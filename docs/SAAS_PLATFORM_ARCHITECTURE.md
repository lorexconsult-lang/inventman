# SaaS Platform Architecture

Phase 10 adds a commercial control plane that is deliberately separate from tenant operations. Platform administrators are explicit `platform_admins` identities with platform capabilities; organization roles cannot grant platform access. The platform UI lives at `/platform-admin` and exposes tenant metadata, subscription state, usage, plan configuration and immutable platform audit—not tenant operational finance.

Availability is evaluated in this order: authenticated user, active membership, platform suspension, subscription access mode, feature flag, plan entitlement or audited override, tenant capability, then branch access. Plan entitlement never replaces RBAC. Navigation uses both feature and capability signals, while database triggers/RPC assertions remain authoritative for protected writes.

Feature flags support global and organization targets. They can disable future actions but never rewrite transactions. Platform suspension is an administrative/security state distinct from subscription expiry. Suspension and reactivation require platform capability, reason and audit. Support is read-only by default; passwords and silent impersonation are not available.

Bootstrap a platform administrator only through a trusted database/service-role process by inserting the Auth user ID and an intentionally narrow capability array into `platform_admins`. Never hardcode an email or expose this operation to tenant UI. Platform audit rows are immutable.

Platform metrics use explicit definitions. MRR is the sum of active monthly price snapshots plus annual snapshots divided by twelve. It excludes trials, past-due and manual revenue assumptions. ARR is twelve times that deterministic MRR. Churn and conversion require complete period event history and should not be presented until the reporting window is configured.

Expired and cancelled tenant data is retained. Read/export access is the default restricted policy. A future retention/archive policy may be configured, but Phase 10 performs no automatic tenant-data deletion.
