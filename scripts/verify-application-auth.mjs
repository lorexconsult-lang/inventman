import { randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const projectRef = process.env.SUPABASE_PROJECT_REF;
const adminKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const confirmation = process.env.CONFIRM_DEVELOPMENT_PROJECT;
if (!projectRef || !adminKey) throw new Error("Development project ref and server-side admin credential are required");
if (confirmation !== `DEVELOPMENT:${projectRef}` || process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run without exact DEVELOPMENT:<project-ref> confirmation");
}

const url = `https://${projectRef}.supabase.co`;
const admin = createClient(url, adminKey, { auth: { autoRefreshToken: false, persistSession: false } });
const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const passwordA = process.env.AUTH_TEST_PASSWORD ?? `Gate-${randomBytes(24).toString("base64url")}!9`;
const passwordB = `Gate-${randomBytes(24).toString("base64url")}!9`;
const emailA = process.env.AUTH_TEST_EMAIL ?? `inventman-auth-a-${suffix}@example.test`;
const emailB = `inventman-auth-b-${suffix}@example.test`;
const createdUserIds = [];
const createdOrganizationIds = [];

async function provision(email, password) {
  let data, error;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      ({ data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { foundation_auth_test: true, run: suffix },
      }));
      break;
    } catch (cause) {
      if (attempt === 2 || cause?.name !== "AuthRetryableFetchError") throw cause;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  if (error?.message.toLowerCase().includes("already")) {
    const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;
    const existing = users.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (!existing?.user_metadata?.foundation_auth_test) throw new Error("Refusing to replace a non-test user");
    const { error: deleteError } = await admin.auth.admin.deleteUser(existing.id);
    if (deleteError) throw deleteError;
    ({ data, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { foundation_auth_test: true, run: suffix },
    }));
  }
  if (error || !data.user) throw error ?? new Error("Admin user provisioning returned no user");
  createdUserIds.push(data.user.id);
  return data.user;
}

async function cleanup() {
  for (const organizationId of createdOrganizationIds) {
    const { error: defaultError } = await admin.from("branches").update({ default_warehouse_id: null }).eq("organization_id", organizationId);
    if (defaultError) throw new Error(`Branch default cleanup failed: ${defaultError.code}`);
    for (const table of ["member_branch_access", "member_roles", "role_permissions", "organization_invitations", "warehouses", "branches", "roles", "organization_members", "businesses"]) {
      const { error } = await admin.from(table).delete().eq("organization_id", organizationId);
      if (error) throw new Error(`${table} cleanup failed: ${error.code}`);
    }
    const { error } = await admin.from("organizations").delete().eq("id", organizationId);
    if (error) throw new Error(`Organization cleanup failed: ${error.code}`);
  }
  for (const userId of createdUserIds) {
    let { error } = await admin.auth.admin.deleteUser(userId);
    if (error?.status === 500) ({ error } = await admin.auth.admin.deleteUser(userId, true));
    if (error) throw new Error(`User cleanup failed: ${error.code ?? error.status}`);
  }
}

const browserErrors = [];
let browser;
try {
  await provision(emailA, passwordA);
  await provision(emailB, passwordB);
  console.log("confirmed development users provisioned: PASS");

  const userB = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { error: loginBError } = await userB.auth.signInWithPassword({ email: emailB, password: passwordB });
  if (loginBError) throw loginBError;
  const { data: orgBData, error: orgBError } = await userB.rpc("create_organization", {
    organization_name: "Foundation Boundary B", organization_slug: `gate-boundary-b-${suffix}`,
    country_code: "GB", currency_code: "GBP", organization_timezone: "Europe/London",
  });
  if (orgBError || !orgBData) throw orgBError ?? new Error("Organization B bootstrap failed");
  createdOrganizationIds.push(orgBData);

  browser = await chromium.launch();
  let context = await browser.newContext();
  let page = await context.newPage();
  const monitor = (target) => {
    target.on("console", (message) => { if (message.type() === "error") browserErrors.push(`console:${message.text()}`); });
    target.on("pageerror", (error) => browserErrors.push(`page:${error.message}`));
    target.on("response", (response) => { if (response.status() >= 500) browserErrors.push(`http:${response.status()} ${response.url()}`); });
  };
  monitor(page);

  await page.goto("http://localhost:3100/auth/login");
  await page.getByLabel("Email address").fill(emailA);
  await page.getByLabel("Password").fill(passwordA);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/onboarding");
  console.log("real password login and verified session: PASS");

  await page.getByLabel("Organization name").fill("Foundation Boundary A");
  await page.getByLabel("Organization slug").fill(`gate-boundary-a-${suffix}`);
  await page.getByRole("button", { name: "Create organization" }).click();
  await page.waitForURL("**/onboarding/setup");
  const { data: orgARows, error: orgAError } = await admin.from("organizations").select("id").eq("slug", `gate-boundary-a-${suffix}`);
  if (orgAError || orgARows?.length !== 1) throw orgAError ?? new Error("Expected exactly one Organization A");
  createdOrganizationIds.push(orgARows[0].id);
  const orgAId = orgARows[0].id;
  const [memberships, subscriptions, onboardingRows] = await Promise.all([
    admin.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", orgAId).eq("user_id", createdUserIds[0]),
    admin.from("organization_subscriptions").select("id", { count: "exact", head: true }).eq("organization_id", orgAId).eq("status", "TRIALING"),
    admin.from("organization_onboarding").select("organization_id", { count: "exact", head: true }).eq("organization_id", orgAId),
  ]);
  if (memberships.count !== 1 || subscriptions.count !== 1 || onboardingRows.count !== 1) throw new Error("Commercial bootstrap cardinality failed");

  const userA = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { error: loginAError } = await userA.auth.signInWithPassword({ email: emailA, password: passwordA });
  if (loginAError) throw loginAError;
  const { data: businessA, error: businessAError } = await admin.from("businesses").select("id").eq("organization_id", orgAId).single();
  if (businessAError) throw businessAError;
  const branchInput = {
    organization_id: orgAId, business_id: businessA.id, created_by: createdUserIds[0],
    name: "Phase 12 Main", code: `P12-${suffix}`.slice(0, 30), timezone: "Europe/London",
  };
  const branchCreate = await userA.from("branches").insert(branchInput).select("id").single();
  if (branchCreate.error) throw branchCreate.error;
  const branchRetry = await userA.from("branches").insert(branchInput);
  if (!branchRetry.error) throw new Error("Branch retry unexpectedly created a duplicate");
  const branchCount = await admin.from("branches").select("id", { count: "exact", head: true }).eq("organization_id", orgAId).eq("code", branchInput.code);
  if (branchCount.count !== 1) throw new Error("Branch retry cardinality failed");

  const warehouseInput = {
    target_branch_id: branchCreate.data.id, warehouse_name: "Phase 12 Main Warehouse",
    warehouse_code: `P12-W-${suffix}`.slice(0, 30), target_warehouse_type: "MAIN",
    warehouse_description: "Phase 12 disposable verification", make_default: true,
  };
  const warehouseCreate = await userA.rpc("create_warehouse", warehouseInput);
  if (warehouseCreate.error) throw warehouseCreate.error;
  const warehouseRetry = await userA.rpc("create_warehouse", warehouseInput);
  if (!warehouseRetry.error) throw new Error("Warehouse retry unexpectedly created a duplicate");
  const warehouseCount = await admin.from("warehouses").select("id", { count: "exact", head: true }).eq("organization_id", orgAId).eq("code", warehouseInput.warehouse_code.toUpperCase());
  if (warehouseCount.count !== 1) throw new Error("Warehouse retry cardinality failed");

  const { data: businessB, error: businessBError } = await admin.from("businesses").select("id").eq("organization_id", orgBData).single();
  if (businessBError) throw businessBError;
  const foreignBranch = await admin.from("branches").insert({ organization_id: orgBData, business_id: businessB.id, created_by: createdUserIds[1], name: "Foreign", code: `FOREIGN-${suffix}`.slice(0, 30), timezone: "Europe/London" }).select("id").single();
  if (foreignBranch.error) throw foreignBranch.error;
  const foreignWarehouse = await userA.rpc("create_warehouse", { ...warehouseInput, target_branch_id: foreignBranch.data.id, warehouse_code: `FOREIGN-W-${suffix}`.slice(0, 30), make_default: false });
  if (!foreignWarehouse.error) throw new Error("Cross-tenant branch reference was accepted");
  console.log("branch and warehouse response-loss retries and tenant reference guard: PASS");

  const retry = await userA.rpc("create_commercial_organization", {
    organization_name: "Ignored Retry", organization_slug: `ignored-${suffix}`,
    country_code: "GB", currency_code: "GBP", organization_timezone: "Europe/London",
    target_business_type: "OTHER", target_plan_code: "STARTER",
  });
  if (retry.error || retry.data !== orgAId) throw retry.error ?? new Error("Organization retry did not reconcile");
  const retryOrganizations = await admin.from("organizations").select("id", { count: "exact", head: true }).eq("created_by", createdUserIds[0]);
  if (retryOrganizations.count !== 1) throw new Error("Organization retry created a duplicate");
  console.log("commercial bootstrap cardinality and response-loss retry: PASS");

  await context.close();
  context = await browser.newContext();
  page = await context.newPage();
  monitor(page);
  await page.goto("http://localhost:3100/auth/login");
  await page.getByLabel("Email address").fill(emailA);
  await page.getByLabel("Password").fill(passwordA);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/onboarding/setup");
  await page.getByText("First branch").waitFor();
  console.log("interrupted session resumes onboarding from actual state: PASS");
  await page.getByRole("button", { name: "Enter Inventman" }).click();
  await page.waitForURL("**/dashboard");
  await page.getByText("Operations overview").waitFor();
  const checklist = page.locator("details summary");
  if (await checklist.count() !== 1) throw new Error(`First-run checklist did not render at ${page.url()}`);
  console.log("optional setup finish, checklist, and workspace entry: PASS");

  await page.reload();
  await page.getByText("Operations overview").waitFor();
  if (browserErrors.length) throw new Error(`Browser errors detected: ${browserErrors.join(" | ")}`);
  console.log("dashboard refresh, claims protection, and browser health: PASS");

  const { data: foreignRead, error: foreignReadError } = await userA.from("organizations").select("id").eq("id", orgBData);
  if (foreignReadError || foreignRead?.length !== 0) throw foreignReadError ?? new Error("Cross-tenant read was not filtered");
  const { data: foreignUpdate, error: foreignUpdateError } = await userA.from("organizations").update({ name: "Compromised" }).eq("id", orgBData).select("id");
  if (foreignUpdateError || foreignUpdate?.length !== 0) throw foreignUpdateError ?? new Error("Cross-tenant update was not filtered");
  const { data: foreignBranches, error: foreignBranchError } = await userA.from("branches").select("id").eq("organization_id", orgBData);
  if (foreignBranchError || foreignBranches?.length !== 0) throw foreignBranchError ?? new Error("Cross-tenant branch read was not filtered");
  console.log("authenticated application-boundary tenant isolation: PASS");

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/auth/login");
  await page.goto("http://localhost:3100/dashboard");
  await page.waitForURL(/\/auth\/login\?next=%2Fdashboard$/);
  await context.clearCookies();
  await page.goto("http://localhost:3100/dashboard");
  await page.waitForURL(/\/auth\/login\?next=%2Fdashboard$/);
  await context.addCookies([{ name: `sb-${projectRef}-auth-token`, value: "malformed", domain: "localhost", path: "/" }]);
  await page.goto("http://localhost:3100/dashboard");
  await page.waitForURL(/\/auth\/login\?next=%2Fdashboard$/);
  console.log("logout, cleared-cookie, and malformed-session rejection: PASS");
  await context.close();
} finally {
  if (browser) await browser.close();
  await cleanup();
  console.log("temporary users and tenant fixtures cleaned up: PASS");
}
