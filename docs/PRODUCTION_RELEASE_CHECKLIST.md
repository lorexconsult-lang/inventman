# Production release checklist

- [ ] Staging uses isolated data, secrets, email, billing, and monitoring.
- [ ] Required CI checks pass on the exact commit; dependency and secret scans have no unresolved high findings.
- [ ] Migrations were reviewed, linted, tested from empty state and upgrade path, and backed up.
- [ ] Security headers, redirects, authorization, exports, uploads, webhook signatures, and rate-limit responses were verified.
- [ ] SMTP delivery, billing sandbox/live mode, cron authentication/idempotency, monitoring ingestion, and alerts were tested.
- [ ] Backup retention and an isolated restore drill meet approved RPO/RTO targets.
- [ ] Browser, PWA/offline, POS, finance, subscription, platform-admin, and performance smoke tests pass in staging.
- [ ] Deployment owner, incident lead, rollback artifact, maintenance window, and stakeholder communication are recorded.
- [ ] Post-deploy live/readiness and runtime error scan are clean.
