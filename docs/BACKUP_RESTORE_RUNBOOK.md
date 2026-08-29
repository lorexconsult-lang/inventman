# Backup and restore runbook

Target objectives (business approval required): RPO 24 hours and RTO 4 hours. These are targets, not evidence that the hosting plan currently meets them.

Enable provider-managed daily database backups and point-in-time recovery where the plan supports it. Separately inventory Storage buckets and export immutable audit/finance data according to retention policy. Encrypt backups, restrict restore access, log all access, and keep at least one logically separate copy. Never place dumps in Git.

For a drill, create a new isolated Supabase project, restore the selected snapshot there, apply only required configuration, and run schema counts, pgTAP, tenant-isolation, ledger-balance, inventory-balance, attachment sampling, and application smoke checks. Record timestamps, backup age, duration, checksum/size where available, failures, and evidence. Destroy the isolated drill environment after approval. Never restore over development, staging, or production during a test.

Phase 14 status (2026-08-29): BLOCKED. No production project, backup artifact, retention policy, PITR window, Storage export destination or isolated restore target exists. Do not treat the 24-hour/4-hour targets as achieved until a timed drill records provider evidence and representative data checks.
