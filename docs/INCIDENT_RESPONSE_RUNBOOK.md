# Incident response runbook

Severity: SEV-1 is broad outage/data exposure or financial-integrity risk; SEV-2 is major degraded workflow; SEV-3 is limited impact. The first responder opens a timeline, names an incident commander, limits changes, captures correlation IDs and sanitized evidence, and pages the security/privacy owner when data may be involved.

Contain with the narrowest reversible action: disable a provider integration, revoke a credential, roll back an artifact, or stage firewall controls. Do not erase logs or modify affected records for investigation. Notify customers and regulators according to contracts and applicable law. Recovery requires health/readiness, error-rate, authentication, tenant isolation, ledger/inventory reconciliation, webhook replay, and monitoring checks. Close with root cause, corrective owners/dates, and follow-up validation.
