# Product Architecture

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
