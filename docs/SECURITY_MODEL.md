# Security Model

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

## Secrets

Browser configuration is limited to `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Service-role and secret keys are not declared in the public template or referenced in application source.

Custom SMTP credentials belong in Supabase Auth settings, not the Next.js application. Production email-delivery requirements are documented in `AUTH_EMAIL_DELIVERY.md`.
