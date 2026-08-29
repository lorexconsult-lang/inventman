# Subscriptions and Billing Architecture

Plans are versionable platform data with precise numeric monthly/annual prices and currency. Features use a small set of understandable entitlement types: boolean, limit, quota and enum. Usage is calculated from authoritative branch, member, warehouse, terminal and device records. Downgrades never delete or deactivate existing records; an over-limit organization keeps history and is prevented from creating more until usage is reduced or the plan changes.

One live subscription is permitted per organization. Lifecycle states are `TRIALING`, `ACTIVE`, `PAST_DUE`, `GRACE_PERIOD`, `CANCELLED`, `EXPIRED` and `SUSPENDED`. Central access modes are `FULL_ACCESS`, `GRACE_ACCESS`, `READ_ONLY` and `SUSPENDED`. Trials have explicit timestamps. Provider failure moves through past-due/grace policy rather than immediate suspension. Cancellation defaults to period end, data remains retained, and reactivation must not create a conflicting live subscription.

New organizations receive the configured default trial plan atomically from an organization insert trigger. Existing organizations receive a non-expiring compatibility Business subscription during migration so commercial enforcement does not break deployed tenants. The default plan is referenced by ID in platform settings, never hardcoded in application authorization.

Platform billing transactions are separate from tenant customer/supplier payments. Each subscription snapshots its price, currency and interval; later plan price edits cannot rewrite historical billing. Provider references and webhook event IDs are unique. Paystack and Flutterwave adapters verify raw request signatures using server-only secrets. A signed webhook is recorded idempotently before provider-specific lifecycle processing. Browser redirects never activate paid access. Without configured credentials the UI reports checkout unavailable and makes no commercial-state change.

Offline POS receives a configurable, server-issued entitlement lease after online validation. The encrypted/session-bound authorization cache stores the expiry. New offline checkout is disabled after lease expiry, while queued transactions are preserved. Sync accepts a queued sale only when its `local_created_at` falls inside the recorded lease; server receipt time cannot change that result.

Subscription expiry during an already-submitted server transaction is governed by the database transaction snapshot: an atomic transaction that passed its commercial gate completes or rolls back as one unit. Subsequent transactions re-evaluate current state.

Email event hooks are anticipated for trial start/end, payment success/failure, grace, renewal and cancellation. Production delivery remains dependent on configured custom SMTP and provider credentials; Phase 10 makes no deliverability claim.
# Production billing operations

Provider webhooks verify the raw request signature, derive idempotent event identity, store only a payload hash, apply throttling, and emit correlation-safe logs. Production launch also requires live provider credentials, endpoint registration, retry/replay monitoring, and reconciliation procedures; repository tests cannot prove external provider configuration.
