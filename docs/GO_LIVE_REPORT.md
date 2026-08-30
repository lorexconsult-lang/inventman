# Phase 14 go-live assessment

Assessment date: 2026-08-29

Expected application baseline: `8ff0e39547330b74f59432988df0d2137d8c9c8d`

Decision: **NOT READY FOR GO-LIVE**

## Production architecture and deployment

The Vercel project `lorexconsult-3939s-projects/inventman` now exists, is linked locally, and has Git integration with `lorexconsult-lang/inventman`, repository root `.`, framework preset Next.js and production branch `main`. Its temporary alias is `https://inventman-lorexconsult-3939s-projects.vercel.app`. An automatic production build of `dff0eb660edc10bff6f7fd269673108d3ed01859` failed closed because environment entries are empty placeholders; it was not retried or promoted and development Supabase credentials were not reused. A custom production domain remains pending owner purchase or selection.

## Supabase

The existing development project remains isolated. A dedicated free-plan staging project, `inventman-staging` (`gqgghdawfgfibshzxeom`), is active and healthy in `eu-west-1`. It was initialized from zero using the complete source-controlled migration chain without development data or seeds; local and staging migration histories match. Staging Auth uses the exact HTTPS branch alias and callback allowlist. Public-schema lint has no errors and retains two known unused-variable warnings. Production Supabase, backup status, PITR status and production-safe structural assertions remain blocked.

## SMTP and DNS authentication

No production SMTP provider, sender identity or controlled mailbox was supplied. SPF, DKIM and DMARC cannot be verified without the sender domain. Signup confirmation, password reset and invitation delivery are release blockers.

## Billing

The application supports verified Paystack and Flutterwave webhook signatures and idempotent event receipt in development. No launch provider, live credential, merchant account or production webhook URL was supplied. No charge or live handshake was attempted.

## Rate limiting, monitoring and scheduled jobs

The application fails closed when production lacks its shared rate-limit backend. No backend URL/token exists. No monitoring DSN, log drain, error-ingestion test, alert policy or uptime monitor is configured.

Subscription maintenance is now PASS at the source and development-verification layers. The authenticated `/api/cron/subscriptions` route is environment-guarded, invokes one service-role-only database function, and has a daily Vercel schedule. The function handles trial expiry, grace entry/expiry and period-end cancellation, records audit events, and queues idempotent notification intents separately from delivery. Repeat-execution pgTAP coverage passes. Billing reconciliation is NOT APPLICABLE until a launch provider and outbound provider-state adapter exist; it does not create charges. Data cleanup is NOT APPLICABLE because no approved retention policy identifies disposable production data. Production execution remains BLOCKED until isolated infrastructure and `CRON_SECRET` are configured.

## Backups and recovery

There is no production project or provider-plan evidence, so automated backup frequency, retention, PITR and Storage-object backup remain unknown. No isolated restore target exists and no restore drill was performed. Proposed RPO 24 hours/RTO 4 hours remain business targets, not achieved capabilities.

## Security and release controls

Development RLS, tenant/platform isolation, redirects, webhook signatures, CSP and application security regressions passed at the Phase 13 gate. Production headers, TLS, origin allowlists and bundle secret safety require a deployed hostname. GitHub security workflow exists, but its latest runs fail during Linux dependency installation; Phase 14 removes the direct Windows-only dependency. Branch protection is unavailable for the current private repository/account plan.

## Public, legal and operational readiness

No custom canonical production hostname exists. Sitemap and canonical generation are environment-driven and cannot be finalized. Privacy and Terms explicitly remain launch-preparation frameworks requiring counsel review. The intended initial platform administrator is `info.vetrilink@gmail.com`; the identity is recorded but has not been bootstrapped. An approved support channel, company information, deployment owner, incident lead, launch window and pilot organizations were not provided.

## Safe verification completed

- Development and source migration history synchronization: PASS.
- Development public-schema lint: PASS with two warnings.
- Vercel CLI authentication, project creation/link, framework settings and GitHub integration: PASS. Environment configuration and successful deployment remain BLOCKED.
- Supabase project inventory: PASS; isolated staging/production resources absent.
- GitHub workflow/branch-policy inventory: PASS; CI dependency fault identified and branch protection plan limitation confirmed.
- Secret values were not printed, copied into documentation or committed.
- No production database mutation, fixture, email, billing event or deployment occurred.
- Scheduled-job unit tests and 19 database assertions: PASS against development only.

## Blockers

### Infrastructure

- Provision an isolated production Supabase project; staging is provisioned.
- Configure isolated staging and production environment values in the linked Vercel project.
- Supply a real domain/DNS control, shared rate limiter, monitoring provider, backup plan and restore target.

### Configuration

- Configure production Auth URLs, SMTP, Storage policies, billing live credentials/webhooks, runtime variables, alerts, schedules and platform-admin bootstrap.
- Define approved public plans/default trial and disable incomplete flags.

### Legal and business signoff

- Approve Privacy and Terms, company/support information, launch billing provider, incident ownership, RPO/RTO, pilot scope and launch window.

## Path to controlled go-live

Provision staging first, migrate from source, configure sandbox integrations, run the full release gate and isolated restore drill, then provision production. Deploy the same green artifact without assigning the domain, run non-destructive smoke checks, promote it, and begin with named internal pilot organizations under active monitoring.

## Phase 14B owner-required actions

- BLOCKED: authorize or purchase two isolated Supabase projects and provide the intended organization, region and database passwords through a secure channel.
- CUSTOM DOMAIN: PENDING OWNER PURCHASE/SELECTION; the generated Vercel alias is temporary.
- SMTP PROVIDER/CREDENTIALS REQUIRED.
- BLOCKED: select PAYSTACK or FLUTTERWAVE and provide an approved live merchant account and credentials.
- BLOCKED: purchase or select a shared rate-limit backend and provide its production credentials.
- MONITORING PROVIDER REQUIRED, including alert and uptime-monitor ownership.
- BLOCKED: select Supabase plans with the required backup retention/PITR capability and authorize an isolated restore target plus Storage-object backup destination.
- BLOCKED: bootstrap the authorized initial platform administrator `info.vetrilink@gmail.com` after isolated infrastructure exists; supply launch plans/pricing/trial/features, company/support contacts, incident owner, pilot businesses and launch window.
- LEGAL REVIEW REQUIRED.
- BLOCKED: owner approval of achievable RPO/RTO after the selected backup plans are known.
