# Database Architecture

## Tenant hierarchy

`auth.users` → `organization_members` → `organizations` → `businesses` → `branches` → `warehouses`.

Every tenant-owned row carries `organization_id`, even when it can be inferred through another foreign key. This makes policy enforcement and tenant-scoped indexing explicit. Constraints and functions must verify related rows belong to the same tenant.

## Identity and authorization

Organization membership grants tenant entry. Roles contain capabilities through `role_permissions`; branch restrictions are represented by `member_branch_access`. Role names are labels, not authorization logic.

`create_organization` is the reviewed security-definer bootstrap boundary. It derives the actor from `auth.uid()`, creates the tenant, active owner membership, system owner role, capability grants, and role assignment atomically. Direct tenant mutations remain governed by capability policies; ordinary users cannot grant themselves roles or permissions.

## Inventory

`inventory_movements` is the immutable source of truth. `inventory_balances` is a transactionally maintained read model. Posted movements are reversed with compensating movements, never edited or deleted. Atomic RPCs validate membership, permissions, workflow state, packaging conversions, costing, quantities, and idempotency. Weighted Average and FIFO are supported; FIFO consumption uses immutable layer allocations. See `INVENTORY_ARCHITECTURE.md`.

## Conventions

- UUID primary keys; UTC `timestamptz` audit timestamps.
- General money uses `numeric(20,4)` and an ISO currency code. Inventory quantities use `numeric(24,6)`, costs `numeric(24,8)`, and extended values `numeric(28,8)`.
- Tenant indexes start with `organization_id` and add common filter/sort columns.
- Historical financial and stock records use lifecycle states rather than physical deletion.
- User-configurable concepts use tables; stable internal state machines may use enums or constrained text.

The first migration establishes the tenant and RBAC foundation. It is applied to the dedicated hosted development project, remote lint is clean, generated types match, and all 27 hosted pgTAP assertions pass. Two temporary confirmed users additionally passed application-boundary tenant isolation; their organizations and Auth identities were removed afterward.
