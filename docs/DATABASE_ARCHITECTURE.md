# Database Architecture

## Payments and settlement

`payments` is the common customer/supplier settlement record. Tenant-composite foreign keys bind accounts, methods, parties, invoices, allocations, credits, and refunds. Posting RPCs lock targets and use request hashes for exact retries. Views derive invoice settlement, AR/AP, unapplied receipts/advances, operational balances, and statements. See `PAYMENTS_ARCHITECTURE.md`.

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

## Procurement

Procurement documents use composite organization foreign keys and tenant-safe counter numbering. Commercial documents snapshot mutable master values, currency, exchange rate, packaging conversion, price, and tax. GRN and purchase-return posting functions lock parent/line rows and invoke `post_inventory_transaction`; no procurement table is a stock authority. Supplier payables are derived from invoices and credits rather than a mutable supplier balance.

## POS orchestration

`pos_terminals`, `pos_sessions`, `pos_held_carts`, `pos_sales`, `pos_sale_settlements`, `pos_cash_events`, and `pos_receipt_reprints` hold operational POS context and immutable links. `post_pos_sale` composes existing Sales, Inventory, invoice, and Payment RPCs inside one transaction. POS totals do not replace ledger, AR, or settlement truth. Forced RLS and tenant-composite references protect every exposed POS record.
# Phase 8 offline support

Migrations `20260831200000` through `20260831206000` add tenant-bound offline devices, sparse sync audit events, POS origin metadata, explicit replay/device/settings RPCs, RLS, offline capabilities, strict idempotency-key reuse checks, and guarded ephemeral verification cleanup. Replay delegates to `post_pos_sale`; it does not introduce another ledger. Local and hosted history are synchronized at 69 migrations.
# Phase 9 finance database

The Finance schema adds organization accounting settings, hierarchical GL accounts, periods, mappings, idempotent accounting events, immutable journal headers/lines, expenses, transfers and bank reconciliation. Forced RLS, composite tenant references, revoked direct writes and controlled security-definer functions enforce double entry and period locks in PostgreSQL.
# Phase 10 database boundary

Platform plans, feature registry, subscriptions, overrides, flags, billing transactions, webhook receipts and audit use dedicated tables. Tenant payment and general-ledger tables never store Inventman subscription billing.
# Production database operations

Production and staging require isolated Supabase projects and credentials. Migrations are forward-only, reviewed, linted, tested from a clean database, and applied before artifact promotion. Provider-managed backups and point-in-time recovery must be enabled and proven by isolated restore drills; see `BACKUP_RESTORE_RUNBOOK.md`.
# Commercial onboarding data

`public_saas_plans()` is the anonymous-safe plan projection. `create_commercial_organization()` composes the existing organization and Phase 10 subscription engines idempotently. `organization_onboarding` is tenant-RLS state for wizard navigation only; operational completion remains derived from domain tables.
