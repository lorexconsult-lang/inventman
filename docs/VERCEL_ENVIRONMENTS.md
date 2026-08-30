# Vercel environment structure

Inventman uses three isolated environments. Values below are names and classifications only; secrets must be entered through the relevant provider controls and must not be committed.

## Public variables

These values are included in browser bundles and must never contain privileged credentials:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Server-only variables

- `APP_ENV`
- `APP_VERSION`
- `SUPABASE_PROJECT_REF`
- `DEVELOPMENT_SUPABASE_PROJECT_REF` (non-secret safety comparison; production only)
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYSTACK_SECRET_KEY` or `FLUTTERWAVE_WEBHOOK_SECRET`
- `BILLING_ENVIRONMENT`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `EMAIL_FROM`
- `ERROR_MONITORING_DSN`
- `RATE_LIMIT_REST_URL`
- `RATE_LIMIT_REST_TOKEN`
- `CRON_SECRET`

`NODE_ENV` is platform-managed. Verification-only variables such as `CONFIRM_DEVELOPMENT_PROJECT`, `ALLOW_PRODUCTION_DESTRUCTIVE`, test identities and load-test controls are not deployment configuration and are forbidden in production where noted by the production guard.

## Isolation status

- Development: local development configuration exists outside source control. It is not authorized for Vercel Preview or Production.
- Preview/Staging: configured with the isolated `inventman-staging` Supabase project (`gqgghdawfgfibshzxeom`) and `APP_ENV=staging`. Third-party SMTP, billing, monitoring and distributed rate-limit credentials remain intentionally absent.
- Production: no environment variables are configured. It requires dedicated production infrastructure and `APP_ENV=production` before deployment.

The Vercel project is `lorexconsult-3939s-projects/inventman`, linked to `lorexconsult-lang/inventman` with repository root `.` and production branch `main`. The temporary project alias is `https://inventman-lorexconsult-3939s-projects.vercel.app`; it is not considered a successful deployment until a configuration-complete build passes.
