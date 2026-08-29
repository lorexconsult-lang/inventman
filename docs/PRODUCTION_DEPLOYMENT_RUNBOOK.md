# Production deployment runbook

1. Create isolated staging and production Supabase/Vercel resources; restrict operators with least privilege.
2. Configure all variables in `.env.example`, using environment-scoped secret stores. Set `APP_ENV=production` and immutable `APP_VERSION`.
3. Configure custom domain/TLS, SMTP, provider webhooks, distributed rate limiting, monitoring, alerts, backups, and authenticated scheduled jobs.
4. Run `npm ci`, `npm audit --audit-level=high`, lint, typecheck, unit tests, local Supabase reset/lint/pgTAP, workflow verifiers, build, Playwright, and the load test against staging.
5. Apply additive migrations to staging; validate the full workflow and restore drill. Record migration/version and approver.
6. Take/confirm a production backup, apply migrations, deploy the same tested artifact, then check live/readiness, login, one authorized read, webhook delivery, logs, and alerts.
7. Roll back the application by promoting the previous artifact. Database rollback is forward-fix unless an explicitly tested reversible migration exists. Never reset production.

Production configuration and external-service verification are mandatory release gates, not facts established by repository tests.

## Mandatory preflight

Run `npm run guard:production` in CI with production-scoped environment variables before `vercel build --prod`. The guard requires HTTPS endpoints, an immutable Git SHA, a dedicated Supabase project identity, server-only billing/service credentials, monitoring, shared rate limiting and cron authentication. It rejects the development Supabase ref and any development or destructive break-glass flags.

Use a blue/green deployment: deploy with `vercel --prod --skip-domain`, verify through `vercel curl`, then promote the exact artifact. Do not create or auto-link a project from an ambiguous directory. Confirm account/team, project ID and production domain first.

Never run `verify-*-workflow.mjs`, the full pgTAP suite, fixture scripts, cleanup RPCs, `supabase db reset`, load tests, or restore tests against production. Production verification is limited to structural checks and a clearly marked controlled tenant. Store the last known-good deployment URL before promotion; application rollback uses `vercel rollback` or promotion of that artifact. Database changes are forward-fixed unless a separately rehearsed reversal exists.
