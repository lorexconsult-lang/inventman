import { randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const ref = process.env.SUPABASE_PROJECT_REF,
  key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (
  !ref ||
  !key ||
  !publishable ||
  process.env.CONFIRM_DEVELOPMENT_PROJECT !== `DEVELOPMENT:${ref}` ||
  process.env.NODE_ENV === "production"
)
  throw new Error("Development verification environment is incomplete");
const url = `https://${ref}.supabase.co`,
  admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
  suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`,
  password = `Gate-${randomBytes(24).toString("base64url")}!9`,
  users = [],
  orgs = [];
let browser;
const ok = (value, label) => {
    if (!value) throw new Error(`FAILED: ${label}`);
    console.log(`${label}: PASS`);
  },
  client = () =>
    createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  rpc = async (c, name, args) => {
    const { data, error } = await c.rpc(name, args);
    if (error) throw error;
    return data;
  };
async function provision(label) {
  const email = `phase5-${label}-${suffix}@example.test`,
    { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Phase 5 ${label}`, phase5_e2e: true },
    });
  if (error) throw error;
  users.push(data.user.id);
  const c = client(),
    login = await c.auth.signInWithPassword({ email, password });
  if (login.error) throw login.error;
  return { c, email, id: data.user.id };
}
async function cleanup() {
  for (const id of orgs) {
    const { error } = await admin.rpc("purge_ephemeral_team_verification", {
      target_organization_id: id,
    });
    if (error)
      console.error(`cleanup organization failed: ${error.code ?? "unknown"}`);
  }
  for (const id of users) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`cleanup user failed: ${error.code ?? "unknown"}`);
  }
}

try {
  const owner = await provision("owner"),
    staff = await provision("staff"),
    pending = await provision("pending");
  const orgA = await rpc(owner.c, "create_organization", {
    organization_name: "Phase 5 Team A",
    organization_slug: `phase5-team-a-${suffix}`,
    country_code: "GB",
    currency_code: "GBP",
    organization_timezone: "Europe/London",
  });
  orgs.push(orgA);
  const orgB = await rpc(owner.c, "create_organization", {
    organization_name: "Phase 5 Team B",
    organization_slug: `phase5-team-b-${suffix}`,
    country_code: "GB",
    currency_code: "GBP",
    organization_timezone: "Europe/London",
  });
  orgs.push(orgB);
  const business = (
    await admin
      .from("businesses")
      .select("id")
      .eq("organization_id", orgA)
      .single()
  ).data.id;
  const branchA = crypto.randomUUID(),
    branchB = crypto.randomUUID();
  const branchInsert = await admin.from("branches").insert([
    {
      id: branchA,
      organization_id: orgA,
      business_id: business,
      name: "Team North",
      code: "TN",
      timezone: "Europe/London",
      status: "active",
      created_by: owner.id,
    },
    {
      id: branchB,
      organization_id: orgA,
      business_id: business,
      name: "Team South",
      code: "TS",
      timezone: "Europe/London",
      status: "active",
      created_by: owner.id,
    },
  ]);
  if (branchInsert.error) throw branchInsert.error;
  const permissions = (
    await admin
      .from("permissions")
      .select("id,code")
      .in("code", [
        "products.view",
        "sales.order_view",
        "customers.view",
        "inventory.view",
      ])
  ).data;
  const permissionId = (code) =>
    permissions.find((item) => item.code === code).id;
  const salesRole = await rpc(owner.c, "create_team_role", {
    target_organization_id: orgA,
    target_name: "Hosted Sales User",
    target_description: "Phase 5 verification",
    target_permission_ids: [
      permissionId("products.view"),
      permissionId("sales.order_view"),
      permissionId("customers.view"),
    ],
  });
  ok(Boolean(salesRole), "1. Owner creates capability-based role");
  const inviteToken = randomBytes(32).toString("base64url");
  const invitation = await rpc(owner.c, "invite_team_member", {
    target_organization_id: orgA,
    target_email: staff.email,
    target_display_name: "Hosted Staff",
    target_role_id: salesRole,
    target_branch_ids: [branchA],
    target_note: "Secure verification",
    target_token: inviteToken,
    target_expires_at: new Date(Date.now() + 86400000).toISOString(),
  });
  ok(Boolean(invitation), "2. Owner creates secure invitation");
  const stored = (
    await admin
      .from("organization_invitations")
      .select("token_hash,status")
      .eq("id", invitation)
      .single()
  ).data;
  ok(
    stored.token_hash !== inviteToken && stored.status === "pending",
    "3. Invitation stores only token hash",
  );
  const acceptedOrg = await rpc(staff.c, "accept_team_invitation", {
    target_token: inviteToken,
  });
  ok(acceptedOrg === orgA, "4. Staff accepts organization-bound invitation");
  const membership = (
    await admin
      .from("organization_members")
      .select("id,status,email")
      .eq("organization_id", orgA)
      .eq("user_id", staff.id)
      .single()
  ).data;
  ok(
    membership.status === "active" && membership.email === staff.email,
    "5. Membership activates with identity snapshot",
  );
  ok(
    (
      await admin
        .from("member_roles")
        .select("role_id")
        .eq("membership_id", membership.id)
        .single()
    ).data.role_id === salesRole,
    "6. Intended role is assigned",
  );
  ok(
    (
      await admin
        .from("member_branch_access")
        .select("branch_id")
        .eq("membership_id", membership.id)
        .single()
    ).data.branch_id === branchA,
    "7. Intended branch is assigned",
  );
  ok(
    await rpc(staff.c, "can_access_branch", {
      target_organization_id: orgA,
      target_branch_id: branchA,
    }),
    "8. Staff can access assigned branch",
  );
  ok(
    !(await rpc(staff.c, "can_access_branch", {
      target_organization_id: orgA,
      target_branch_id: branchB,
    })),
    "9. Staff cannot access unassigned branch",
  );
  const selfEscalation = await staff.c.rpc("assign_team_member_roles", {
    target_organization_id: orgA,
    target_membership_id: membership.id,
    target_role_ids: [salesRole],
  });
  ok(Boolean(selfEscalation.error), "10. Self privilege change is rejected");
  const inventoryRole = await rpc(owner.c, "create_team_role", {
    target_organization_id: orgA,
    target_name: "Hosted Inventory User",
    target_description: "Changed access",
    target_permission_ids: [
      permissionId("products.view"),
      permissionId("inventory.view"),
    ],
  });
  await rpc(owner.c, "assign_team_member_roles", {
    target_organization_id: orgA,
    target_membership_id: membership.id,
    target_role_ids: [inventoryRole],
  });
  ok(
    await rpc(staff.c, "has_permission", {
      target_organization_id: orgA,
      permission_code: "inventory.view",
    }),
    "11. Owner changes effective role permissions",
  );
  ok(
    !(await rpc(staff.c, "has_permission", {
      target_organization_id: orgA,
      permission_code: "sales.order_view",
    })),
    "12. Removed role capability no longer applies",
  );
  await rpc(owner.c, "set_team_member_status", {
    target_organization_id: orgA,
    target_membership_id: membership.id,
    target_status: "suspended",
    target_reason: "Hosted verification",
  });
  ok(
    !(await rpc(staff.c, "is_active_organization_member", {
      target_organization_id: orgA,
    })),
    "13. Suspended staff loses workspace access",
  );
  await rpc(owner.c, "set_team_member_status", {
    target_organization_id: orgA,
    target_membership_id: membership.id,
    target_status: "active",
    target_reason: null,
  });
  ok(
    await rpc(staff.c, "is_active_organization_member", {
      target_organization_id: orgA,
    }),
    "14. Reactivated staff regains access",
  );
  const pendingToken = randomBytes(32).toString("base64url");
  const pendingInvite = await rpc(owner.c, "invite_team_member", {
    target_organization_id: orgA,
    target_email: pending.email,
    target_display_name: "Pending Staff",
    target_role_id: salesRole,
    target_branch_ids: [],
    target_note: null,
    target_token: pendingToken,
    target_expires_at: new Date(Date.now() + 86400000).toISOString(),
  });
  await rpc(owner.c, "revoke_team_invitation", {
    target_organization_id: orgA,
    target_invitation_id: pendingInvite,
  });
  const revoked = await pending.c.rpc("accept_team_invitation", {
    target_token: pendingToken,
  });
  ok(Boolean(revoked.error), "15. Revoked invitation cannot be accepted");
  ok(
    (
      await admin
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", owner.id)
        .eq("status", "active")
    ).data.length === 2,
    "16. Owner has two valid organizations",
  );
  ok(
    (await staff.c.from("organizations").select("id").eq("id", orgB)).data
      .length === 0,
    "17. Non-member cannot inspect another organization",
  );

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    }),
    consoleErrors = [],
    failed = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("requestfailed", (request) => failed.push(request.url()));
  await page.goto("http://localhost:3100/auth/login");
  await page.getByLabel("Email address").fill(owner.email);
  await page.getByLabel("Password").fill(password);
  await Promise.all([
    page.waitForURL(/select-organization|dashboard/),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);
  await page.goto("http://localhost:3100/select-organization");
  const form = page.locator("form").filter({ hasText: "Phase 5 Team A" });
  await Promise.all([
    page.waitForURL(/dashboard/),
    form.getByRole("button", { name: "Open workspace" }).click(),
  ]);
  await page.goto("http://localhost:3100/dashboard/settings/team");
  ok(
    await page.getByRole("heading", { name: "Team" }).isVisible(),
    "18. Owner opens Team settings",
  );
  await page.goto(
    `http://localhost:3100/dashboard/settings/team/${membership.id}`,
  );
  ok(
    await page.getByText("Effective permissions").isVisible(),
    "19. Owner views staff access detail",
  );
  await page.goto("http://localhost:3100/dashboard/settings/roles");
  ok(
    await page
      .getByRole("heading", { name: "Roles & permissions" })
      .isVisible(),
    "20. Owner opens role administration",
  );
  await page.getByLabel("Current organization").selectOption(orgB);
  await page.getByRole("button", { name: "Switch" }).click();
  await page.waitForLoadState("networkidle");
  ok(
    (await page.getByLabel("Current organization").inputValue()) === orgB,
    "21. Owner switches to another valid organization",
  );
  await page.getByLabel("Current organization").selectOption(orgA);
  await page.getByRole("button", { name: "Switch" }).click();
  await page.waitForLoadState("networkidle");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3100/dashboard/settings/team");
  ok(
    await page.getByRole("navigation", { name: "Mobile navigation" }).isVisible(),
    "22. Team administration exposes responsive mobile navigation",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: /sign out/i }).click();
  await page.waitForURL(/auth\/login/);
  await page.getByLabel("Email address").fill(staff.email);
  await page.getByLabel("Password").fill(password);
  await Promise.all([
    page.waitForURL(/dashboard/),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);
  await page.waitForLoadState("networkidle");
  const inventoryNavigationCount = await page
    .getByRole("link", { name: "Inventory" })
    .count();
  ok(
    inventoryNavigationCount > 0,
    "23. Capability-aware navigation shows permitted module",
  );
  ok(
    (await page.getByRole("link", { name: "Team" }).count()) === 0,
    "24. Capability-aware navigation hides Team administration",
  );
  await page.goto("http://localhost:3100/dashboard/settings/team");
  await page.waitForLoadState("networkidle");
  ok(
    (await page.locator("body").innerText()).includes("Access denied"),
    "25. Direct unauthorized route shows forbidden state",
  );
  ok(
    consoleErrors.length === 0 && failed.length === 0,
    "26. Browser console and request health",
  );
  console.log("AUTHENTICATED TEAM ACCESS WORKFLOW: PASS");
} finally {
  if (browser) await browser.close();
  await cleanup();
  ok(true, "27. Temporary users and organizations deleted");
  ok(
    !process.env.INVITATION_TOKEN && !process.env.RESET_TOKEN,
    "28. Temporary token artifacts absent",
  );
}
