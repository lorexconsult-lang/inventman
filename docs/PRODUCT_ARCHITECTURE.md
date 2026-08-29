# Product Architecture

## Phase 6 operational settlement

Payments are shared by Sales and Procurement. Receipts, supplier payments, allocations, credits, refunds, reversals, accounts, statements, and reporting use one tenant-safe engine. POS, external processing, bank reconciliation, and General Ledger remain outside this phase.

## Purpose

Inventman is a multi-tenant operations platform for inventory-based businesses. Version 1 covers the complete commercial scope described in the master specification; AI capabilities are explicitly deferred.

## Boundaries

The application is organized by domain under `src/features`. Domains own their validation, application services, queries, UI, and tests. Shared infrastructure lives under `src/lib`; reusable visual primitives live under `src/components`.

The initial bounded contexts are identity and access, organizations, branches and warehouses, catalogue, inventory, procurement, sales/POS, finance, approvals, audit, reporting, subscriptions, platform administration, and offline synchronization.

## Runtime architecture

- Next.js App Router provides the web, server rendering, route handlers, and application shell.
- Supabase Auth establishes identity; PostgreSQL RLS establishes data authorization.
- PostgreSQL functions own atomic ledger, inventory, and financial state transitions.
- Supabase Storage holds tenant assets behind policies.
- IndexedDB/Dexie holds a deliberately limited operational cache and immutable offline command queue.
- Server synchronization posts commands using stable idempotency keys; it never overwrites cloud balances.

## Dependency rule

Features may depend on shared configuration, types, UI, and infrastructure. Cross-domain writes occur through explicit application services or database functions, never by importing another feature's internal persistence implementation.

## Industry capabilities

Industry modes are organization-level capabilities and configuration. They extend the universal product, inventory, workflow, and location models rather than forking schemas or applications.

## Phase 1 catalogue and locations

Branches contain warehouses, and warehouses contain an adjacency-list storage hierarchy rooted by an automatically created system location. Composite tenant foreign keys, cycle guards, and RLS prevent cross-organization or cross-warehouse links.

The catalogue separates products from sellable variants. Variants own SKUs, packaging conversions, barcodes, option assignments, reorder configuration, and deterministic price rows. Categories are hierarchical; brands, units, tax profiles, and price lists are organization-scoped. Product images are private objects under tenant-prefixed Storage paths with metadata in PostgreSQL.

No table in this phase stores on-hand, available, committed, or inventory-value quantities. Reference cost and reorder fields are configuration metadata only. Authoritative physical quantities must be derived from the future immutable Inventory Ledger.

## Phase 2 inventory engine

The inventory domain owns the immutable transaction/movement ledger, derived location balances and availability, Weighted Average and FIFO valuation, reservations, transfers, stock counts, reversals, reason codes, exports, and reconciliation. Pages read tenant-filtered projections and send commands through server actions to atomic PostgreSQL functions. Future Procurement, Sales/POS, Returns, and Production modules must use this posting boundary rather than mutate balances.

## Phase 3 procurement

The procurement domain adds supplier masters, reusable approvals, requisitions, RFQs/quotations, purchase orders, receiving/GRNs, landed-cost allocations, supplier invoices, AP projections, credits, and purchase returns. Physical receipts and returns call the Phase 2 inventory posting engine atomically. Finance settlement, Sales, and POS remain outside this boundary. See `PROCUREMENT_ARCHITECTURE.md`.

## Phase 4 Sales and receivables

The Sales domain adds customers, quotations, Sales Orders, inventory reservations, partial/full fulfilment, invoices, receivables, returns, Credit Notes, and operational reporting. Fulfilment posts through the Phase 2 Inventory Ledger and records actual COGS. Invoice and Credit Note issuance affect receivables but never mutate stock independently. Payment settlement, POS, and Finance remain future boundaries.

## Phase 5 Team and access administration

The administration surface manages existing memberships, roles, capabilities, invitations, and branch scope. It adds secure invitation acceptance, suspension/reactivation, atomic permission replacement, effective-capability inspection, explicit multi-organization context, capability-aware navigation, forbidden states, and password recovery. See `TEAM_ACCESS_ARCHITECTURE.md`.

## Phase 7 point of sale

The POS application is a branch-scoped orchestration surface over Sales, Inventory, Receivables, and Payments. Terminal sessions and till events add operational cashier control, while checkout reuses existing authoritative document, ledger, allocation, credit, return, and refund paths. See `POS_ARCHITECTURE.md`.
# Phase 8 offline continuity

The installable PWA adds conservative offline POS continuity. IndexedDB holds scoped reference snapshots and immutable queued sale intent; the existing server modules remain the sole business engines. See `OFFLINE_SYNC_ARCHITECTURE.md`.
# Phase 9 finance boundary

Finance now consumes existing operational events and owns only accounting truth: immutable journals, GL balances, periods, expenses, mappings, reconciliation and financial statements. It does not recreate Sales, Procurement, Inventory, Payments, POS, Returns or Credits. See `FINANCE_ACCOUNTING_ARCHITECTURE.md`.
# Phase 10 commercial control plane

SaaS plans, subscriptions, entitlements, usage limits and platform administration are separated from tenant operations. See `SAAS_PLATFORM_ARCHITECTURE.md` and `SUBSCRIPTIONS_BILLING_ARCHITECTURE.md`.
# Production operations

Phase 11 adds production environment separation, health/readiness signals, structured redacted telemetry, distributed rate-limit integration points, hardened browser/PWA boundaries, CI gates, and operational runbooks. These controls preserve existing product workflows; external provider configuration remains a deployment gate.
# Commercial entry and first run

Phase 12 adds the public product site, database-driven pricing, secure signup intent, atomic trial onboarding, a resumable setup wizard, and a checklist derived from operational records. Existing authenticated module engines remain authoritative.

# Phase 14 production assessment

Phase 14 adds a fail-closed production preflight and records external release evidence without expanding product scope. Isolated staging/production hosting and data, domain, email, billing, monitoring, rate limiting, schedules, backups and legal approval remain blockers. The development database is explicitly ineligible for production.
