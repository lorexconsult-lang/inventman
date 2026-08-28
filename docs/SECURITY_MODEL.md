# Security Model

## Payment settlement controls

Payment RPCs derive actor and tenant from `auth.uid()`, enforce capabilities and branch access, and reject cross-tenant references. Posted rows and allocations reject direct mutation. Locks prevent concurrent over-settlement; reversals and refunds preserve audit history. Only safe external references may be retained; PCI card secrets are prohibited.

## Layers

Authentication proves identity; it does not grant tenant data access. Authorization is enforced in PostgreSQL using active organization membership, capabilities, and optional branch scope. UI checks improve usability but are never the security boundary.

All exposed tenant tables enable and force RLS. Policies use stable membership helper functions. Client code receives only the publishable Supabase key. Service-role credentials, if later required for a narrowly scoped platform task, remain server-only.

## Sessions

Supabase SSR stores auth state in cookies. `proxy.ts` refreshes tokens with `getClaims()`, copies refreshed cookies to both the upstream request and browser response, and applies Supabase's cache-control headers. Protected pages repeat verified-claims validation in a server-only data-access function; Proxy is an optimistic redirect layer, not the sole authorization boundary. `getSession()` is never trusted for server authorization.

Authenticated routes are forced dynamic and return private/no-store responses, preventing user-specific rendered content or refreshed tokens from entering a shared cache. Auth callback redirects also carry explicit private/no-store headers.

Authentication Server Actions validate untrusted form input and derive identity from verified server cookies. They never accept a user ID from the client. Next.js origin checks provide CSRF protection for Server Actions; database authorization and RLS remain authoritative.

Application authentication tests provision short-lived confirmed users through the server-only Supabase Admin API. The utility refuses to run without an exact development-project confirmation, accepts its admin credential only from a non-public process environment variable, tags all fixtures, and removes users and tenant data in `finally`. This verifies application login without weakening or misrepresenting production email confirmation.

## Database functions

Prefer `security invoker`. Reviewed `security definer` helpers set `search_path = ''`, schema-qualify objects, expose the smallest possible interface, and revoke public execution before granting it to authenticated users.

Inventory tables grant authenticated users read access only. Stock, reservation, transfer, count, reversal, and settings writes cross capability-checked RPC boundaries. These derive the actor from `auth.uid()`, enforce branch scope, lock stock rows, validate tenant relationships, and append audit events. Platform reconciliation is unavailable to ordinary authenticated users.

## Storage and files

Public branding and private business documents use different buckets. Private object paths begin with an organization ID and policies validate active membership. Uploads require allow-listed media types and size limits.

## Verification

Database integration tests must prove anonymous denial, member access, cross-tenant denial, inactive-member denial, branch scoping, and privileged platform isolation.

`supabase/tests/tenant_isolation.sql` covers anonymous denial, inverse two-tenant isolation, unauthorized inserts/updates/deletes, owner bootstrap atomicity, branch scoping, manual branch-ID tampering, and capability escalation. All 27 assertions pass transactionally against the hosted development database.

`supabase/tests/phase2_inventory.sql` adds 66 assertions for direct-write denial, isolation, availability, valuation, FIFO ordering, reservations, idempotency, transfers, counts, reversals, and reconciliation.

Procurement tables force RLS. Supplier access is tenant capability-scoped; requisitions, approvals, RFQs, POs, receipts, and returns also enforce branch visibility. Atomic workflow functions recheck capabilities, active suppliers, branch/destination relationships, state, totals, receipt quantities, and idempotency. Supplier documents remain in a tenant-prefixed private bucket.

Authenticated hosted verification proves restricted approval denial, branch-ID tampering rejection, foreign-tenant filtering, duplicate GRN replay without duplicate stock, and inability to write inventory balances or movements directly. Ephemeral test cleanup requires `service_role` and an explicit test-only slug prefix.

Sales tables force RLS and expose writes through capability-checked RPCs. Sales confirmation locks customer exposure and inventory reservations; fulfilment consumes reservations and posts `SALE` through the Inventory Ledger; invoice issue performs no stock mutation; accepted returns post `SALE_RETURN` at historical cost before issuing a linked Credit Note. A database trigger rejects unauthorized client-supplied price or discount overrides. Sales verification cleanup requires `service_role` and a `phase4-e2e-` organization slug.

## Secrets

Browser configuration is limited to `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Service-role and secret keys are not declared in the public template or referenced in application source.

Custom SMTP credentials belong in Supabase Auth settings, not the Next.js application. Production email-delivery requirements are documented in `AUTH_EMAIL_DELIVERY.md`.

## Phase 5 Team and access administration

Critical membership, invitation, role, permission, assignment, and branch-access tables reject authenticated direct writes. Security-definer RPCs derive actors from `auth.uid()`, lock mutable state, validate tenant references, and restrict grants to capabilities held by the actor. Invitation tokens are stored only as SHA-256 hashes. Suspended users immediately fail membership, permission, and branch checks while historical attribution remains intact.

The HTTP-only organization cookie is only a requested context; every workspace request validates an active membership. Capability-aware navigation is usability, not an authorization boundary.

## POS security boundary

POS tables are read through branch- and capability-aware forced RLS; direct authenticated mutation is revoked. Terminal, session, held-cart, checkout, cash-event, refund-event, and reprint functions authenticate, validate capability and branch scope, lock mutable state, use tenant-bound references, and audit actions. Checkout never accepts browser organization, price override, stock balance, paid status, or customer exposure as authoritative. Full card numbers, CVV, PIN, and magnetic-stripe data are not represented.
# Offline security boundary

Device UUIDs and cached permission snapshots cannot authorize server work. Replay rechecks the authenticated user, membership capabilities, branch, terminal, device, session, products, pricing, stock, customer, and tenders. RLS scopes device and sync-event reads. Cache Storage excludes API/auth responses, and IndexedDB deliberately stores no credentials or card secrets.
# Finance controls

Finance uses forced tenant RLS, branch-aware read policies, capability authorization, private documents, composite cross-tenant references and deny-by-default functions. Authenticated clients cannot insert or mutate posted journals/lines. Period, mapping, expense, transfer and reconciliation changes occur only through re-authorizing RPCs.
# Phase 10 platform security

Platform identity is independent from organization RBAC. Commercial writes are server-enforced after membership, suspension, access-mode and entitlement evaluation. Provider secrets remain server-only and webhook bodies are signature-verified before idempotent receipt.
