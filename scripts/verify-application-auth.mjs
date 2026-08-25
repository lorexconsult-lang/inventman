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
  let { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { foundation_auth_test: true, run: suffix },
  });
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
    for (const table of ["member_branch_access", "member_roles", "role_permissions", "organization_invitations", "warehouses", "branches", "roles", "organization_members", "businesses"]) {
      await admin.from(table).delete().eq("organization_id", organizationId);
    }
    await admin.from("organizations").delete().eq("id", organizationId);
  }
  for (const userId of createdUserIds) await admin.auth.admin.deleteUser(userId);
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
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") browserErrors.push(`console:${message.text()}`); });
  page.on("pageerror", (error) => browserErrors.push(`page:${error.message}`));
  page.on("response", (response) => { if (response.status() >= 500) browserErrors.push(`http:${response.status()} ${response.url()}`); });

  await page.goto("http://localhost:3100/auth/login");
  await page.getByLabel("Email address").fill(emailA);
  await page.getByLabel("Password").fill(passwordA);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/onboarding");
  console.log("real password login and verified session: PASS");

  await page.getByLabel("Organization name").fill("Foundation Boundary A");
  await page.getByLabel("Organization slug").fill(`gate-boundary-a-${suffix}`);
  await page.getByRole("button", { name: "Create organization" }).click();
  await page.waitForURL("**/dashboard");
  const { data: orgARows, error: orgAError } = await admin.from("organizations").select("id").eq("slug", `gate-boundary-a-${suffix}`);
  if (orgAError || orgARows?.length !== 1) throw orgAError ?? new Error("Expected exactly one Organization A");
  createdOrganizationIds.push(orgARows[0].id);
  console.log("real onboarding and single organization bootstrap: PASS");

  await page.reload();
  await page.getByText("Operations overview").waitFor();
  if (browserErrors.length) throw new Error(`Browser errors detected: ${browserErrors.join(" | ")}`);
  console.log("dashboard refresh, claims protection, and browser health: PASS");

  const userA = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { error: loginAError } = await userA.auth.signInWithPassword({ email: emailA, password: passwordA });
  if (loginAError) throw loginAError;
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
