# Disaster recovery runbook

Declare an incident, freeze deployments and destructive jobs, appoint incident commander and scribe, identify the last known-good application artifact and backup, and preserve logs. Choose fail-forward, application rollback, or isolated database restore based on evidence. Restore into a new environment first, validate tenant isolation and financial/inventory invariants, rotate exposed credentials, repoint traffic only with two-person approval, then monitor health, errors, latency, webhooks, email, and reconciliation.

Communicate impact and recovery estimates without exposing tenant data. After recovery, reconcile missed billing/webhook/scheduled events idempotently and write a blameless post-incident review. Exercise this runbook at least twice yearly; record measured RPO/RTO separately from targets.

Go-live requires named incident owners, a production Vercel project and last-known-good deployment, Supabase restore access, provider escalation paths and approved communication authority. Phase 14 has none of this live-provider evidence, so recovery readiness is BLOCKED.
