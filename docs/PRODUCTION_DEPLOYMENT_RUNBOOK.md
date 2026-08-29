# Production deployment runbook

1. Create isolated staging and production Supabase/Vercel resources; restrict operators with least privilege.
2. Configure all variables in `.env.example`, using environment-scoped secret stores. Set `APP_ENV=production` and immutable `APP_VERSION`.
3. Configure custom domain/TLS, SMTP, provider webhooks, distributed rate limiting, monitoring, alerts, backups, and authenticated scheduled jobs.
4. Run `npm ci`, `npm audit --audit-level=high`, lint, typecheck, unit tests, local Supabase reset/lint/pgTAP, workflow verifiers, build, Playwright, and the load test against staging.
5. Apply additive migrations to staging; validate the full workflow and restore drill. Record migration/version and approver.
6. Take/confirm a production backup, apply migrations, deploy the same tested artifact, then check live/readiness, login, one authorized read, webhook delivery, logs, and alerts.
7. Roll back the application by promoting the previous artifact. Database rollback is forward-fix unless an explicitly tested reversible migration exists. Never reset production.

Production configuration and external-service verification are mandatory release gates, not facts established by repository tests.
