const required = [
  "APP_VERSION",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_PROJECT_REF",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ERROR_MONITORING_DSN",
  "RATE_LIMIT_REST_URL",
  "RATE_LIMIT_REST_TOKEN",
  "CRON_SECRET",
];

const errors = [];
if (process.env.APP_ENV !== "production") errors.push("APP_ENV must be production");
for (const key of required) if (!process.env[key]?.trim()) errors.push(`${key} is required`);
if (!process.env.PAYSTACK_SECRET_KEY && !process.env.FLUTTERWAVE_WEBHOOK_SECRET) errors.push("A live billing provider secret is required");
if (process.env.BILLING_ENVIRONMENT !== "live") errors.push("BILLING_ENVIRONMENT must be live");

for (const key of ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL", "RATE_LIMIT_REST_URL", "ERROR_MONITORING_DSN"]) {
  const value = process.env[key];
  if (!value) continue;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") errors.push(`${key} must use HTTPS`);
    if (["localhost", "127.0.0.1"].includes(url.hostname)) errors.push(`${key} must not target localhost`);
  } catch {
    errors.push(`${key} must be a valid URL`);
  }
}

const appVersion = process.env.APP_VERSION ?? "";
if (["development", "latest", "main"].includes(appVersion.toLowerCase()) || !/^[0-9a-f]{7,40}$/i.test(appVersion)) errors.push("APP_VERSION must be an immutable Git SHA");

const projectRef = process.env.SUPABASE_PROJECT_REF;
if (projectRef && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname !== `${projectRef}.supabase.co`) errors.push("SUPABASE_PROJECT_REF must match NEXT_PUBLIC_SUPABASE_URL");
  } catch { /* URL error is reported above. */ }
}
if (projectRef && process.env.DEVELOPMENT_SUPABASE_PROJECT_REF === projectRef) errors.push("Production must not use the development Supabase project");
if (process.env.CONFIRM_DEVELOPMENT_PROJECT) errors.push("CONFIRM_DEVELOPMENT_PROJECT must not exist in production");
if (process.env.ALLOW_PRODUCTION_DESTRUCTIVE) errors.push("ALLOW_PRODUCTION_DESTRUCTIVE must not exist in production");

if (errors.length) {
  console.error("Production readiness guard failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(2);
}
console.log(`Production readiness guard passed for ${appVersion.slice(0, 12)}.`);
