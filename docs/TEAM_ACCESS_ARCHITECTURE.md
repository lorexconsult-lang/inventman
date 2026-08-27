# Team and Access Architecture

## Membership lifecycle

`organization_members` remains the tenant-entry record. Its lifecycle is `invited`, `active`, `suspended`, or `deactivated`; operational history continues to reference the Auth user and is never deleted when workspace access is suspended. Identity display name and normalized email are organization-directory snapshots, not credentials or private Auth metadata.

Suspension and reactivation run through `set_team_member_status`. The RPC locks the membership, derives the actor from `auth.uid()`, blocks self-status changes, protects the final active system Owner, and records an audit event. A suspended membership fails membership, capability, and branch checks.

## Invitations and email delivery

Invitations are organization-bound, role-bound, branch-bound, expiring, revocable, and one-time. The application generates 256-bit random tokens server-side; PostgreSQL stores only a SHA-256 hash. Acceptance requires an authenticated identity whose verified JWT email matches the invitation, then atomically activates one membership and applies the stored role and branch snapshot. Resend rotates the token and expiry instead of creating uncontrolled duplicates.

Supabase Auth delivers the magic-link/OTP envelope server-side. Shared development SMTP is suitable only for workflow verification. Production custom SMTP, sender-domain authentication, delivery monitoring, and real-mailbox invitation/reset testing remain release prerequisites.

## Roles and effective permissions

The existing many-to-many model is preserved: a member may have multiple roles, and effective capabilities are the distinct union of active-role grants returned by `get_effective_permissions`. Role names are labels only. System roles are protected; custom-role updates replace the complete permission set transactionally.

An administrator may grant or assign only capabilities they already hold. The UI groups actual database permission codes by domain and never silently adds dependencies.

## Branch access

Capabilities answer what a member may do. `member_branch_access` answers where. No branch rows means all branches; one or more rows restrict the member to those branches. Updates validate tenant-composite branch identity, prevent self-expansion, and constrain assignment to the actor's own accessible scope.

## Organization context and navigation

The active workspace is stored in an HTTP-only, SameSite cookie. Every request validates it against active memberships. Users with multiple memberships and no valid selection are routed to `/select-organization`; invalid or suspended memberships cannot become current context.

The shell filters links using effective capabilities and marks active routes on desktop and mobile. This is usability only: page guards, RPC checks, RLS, and branch checks remain authoritative. Administrative routes show a safe forbidden page instead of an empty table or database error.

## Audit and concurrency

Invitation, role, assignment, branch, suspension, reactivation, and acceptance changes write `audit_events` with safe before/after metadata. Tokens are excluded. Critical RPCs lock the invitation, role, or membership before state validation.
