# Production release checklist

Status recorded 2026-08-29 during Phase 14. `BLOCKED` is a release decision, not an unchecked task.

| Gate | Status | Evidence or owner action |
| --- | --- | --- |
| Exact source commit and clean tree | PASS | Phase 13 source is `3f0cfd9`; Phase 14 changes require a new verified commit. |
| Development migration history | PASS | All source migrations match the linked development project. |
| Development database lint | PASS | No errors; two existing unused-variable warnings. |
| Full development regression | PASS | 457 unique pgTAP assertions, 84 Vitest tests, 10 Playwright tests, and authenticated domain workflows passed before Phase 14. |
| GitHub quality workflow | BLOCKED | Linux `npm ci` failed because of a Windows-only direct dependency; Phase 14 removes it and requires a green rerun. |
| Isolated staging environment | BLOCKED | No staging Vercel or Supabase project is identified. |
| Isolated production Supabase | BLOCKED | Only the development project is active and linked. Never reuse it. |
| Production migration application | BLOCKED | Production project does not exist; no production SQL was executed. |
| Production Vercel project | BLOCKED | Repository is unlinked and no `inventman` Vercel project exists. |
| Production domain, DNS and TLS | BLOCKED | No domain was supplied or present in Vercel. |
| Auth URLs and real email links | BLOCKED | Await production domain and production Supabase project. |
| Custom SMTP, SPF, DKIM and DMARC | BLOCKED | Provider, credentials, sender and DNS records are absent. |
| Production Storage policy smoke | BLOCKED | Await production Supabase provisioning. |
| Live billing and signed webhook | BLOCKED | No launch provider or live credentials supplied. |
| Distributed rate limiter | BLOCKED | `RATE_LIMIT_REST_URL` and token are absent; application fails closed in production. |
| Monitoring ingestion and alerts | BLOCKED | No provider/DSN, drain, uptime monitor or alert ownership configured. |
| Backups, PITR and Storage backup | BLOCKED | No production project/plan or retention evidence. |
| Isolated restore drill | BLOCKED | No production backup or rehearsal environment. |
| Scheduled jobs | BLOCKED | No deployed authenticated job endpoints or scheduler configuration exists. |
| Legal approval | BLOCKED | Privacy and Terms explicitly state that counsel review is required. |
| Support and company information | BLOCKED | No approved production support channel or company details supplied. |
| Branch protection | BLOCKED | GitHub reports that protection requires a plan upgrade or public repository. |
| Production deployment and smoke | BLOCKED | Deployment is intentionally prohibited until the isolation and configuration gates above pass. |
| Controlled pilot | BLOCKED | Requires named owner, incident lead, pilot tenants and launch window. |
