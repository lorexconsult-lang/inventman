# Changelog

## Unreleased

- Built the Phase 9 Finance foundation: activation-date setup, generic hierarchical Chart of Accounts, protected control mappings, idempotent accounting outbox, immutable double-entry journals, periods and reversals.
- Integrated issued Sales invoices, authoritative Inventory COGS, supplier invoices, customer/supplier payments, refunds and returns without duplicating their operational systems.
- Added expenses with shared approvals, cash/bank transfers, configurable CSV statement imports, deterministic user-confirmed reconciliation, GL financial statements, CSV/print exports, forced RLS and finance capabilities.

- Added the Phase 7 POS orchestration layer with branch terminals, one-open-session till controls, barcode/SKU product search, touch-friendly cart, held sales, split tender, cash change, named-customer credit, printable receipts, reprint audit, session variance review, reports, and CSV export.
- POS checkout reuses the existing Sales Order, Inventory `SALE`, invoice/AR, payment allocation, Credit Note, return/refund, capability, branch, idempotency, and audit boundaries. No second Sales, stock, or payment truth was introduced.
- Added 42 POS pgTAP assertions and 5 POS unit assertions; final hosted and browser gate results are recorded in the Phase 7 implementation gate.

- Added the shared Phase 6 settlement engine: accounts/methods, customer receipts, supplier payments, allocations, overpayments/advances, credits, controlled refunds/reversals, derived AR/AP, statements, reports, and audit controls.
- Added capability- and branch-enforced administration plus database, unit, and authenticated workflow coverage. This is operational settlement, not POS, gateway processing, reconciliation, or General Ledger accounting.
- Hosted verification now passes 277/277 pgTAP assertions and a 37-check authenticated Payments workflow with complete fixture cleanup.

- Built Team and Access Administration with staff filtering, member details, secure invitations, custom roles, grouped permissions, role duplication, effective permissions, branch scope, suspension/reactivation, and audit activity.
- Replaced implicit first-membership selection with an HTTP-only, server-validated organization switcher and added capability-aware responsive navigation plus a forbidden state.
- Added forgot/reset-password flows and hosted Team security/browser verification. Production custom SMTP remains a release gate.

- Completed the Phase 4 Customer, Sales and Receivables application surface: customer maintenance, editable draft quotations, Sales Orders, partial/full fulfilment, invoices, aging and customer statements, returns, Credit Notes, dashboard, reporting, print views, and CSV exports.
- Added database-enforced price/discount override protection plus customer and draft-quotation update RPCs.
- Added authenticated hosted 20→10→4→6 Sales verification with exact reservation, ledger COGS, invoice stock invariance, historical-cost return, AR, security, browser, and cleanup checks. POS, Payments, and Finance remain unimplemented.

- Added the Phase 4 database-first customer, quotation, Sales Order, fulfilment, customer invoice/AR, Sales Return, and Credit Note schema and tenant/branch security model.
- Added atomic Sales RPCs for quotation conversion, credit-safe order confirmation, Inventory Reservation integration, cancellation/release, partial fulfilment through the `SALE` ledger, invoice issue without stock posting, and historical-cost `SALE_RETURN` with return-linked Credits.
- Added hosted Sales pgTAP assertions covering idempotency, authorization, 20→10→4→6 reservation consumption, ledger COGS/margin, invoice stock invariance, return eligibility, historical valuation, and AR reduction.

- Built Phase 3 supplier and procurement foundations: supplier relationships/documents, requisitions, reusable approvals, RFQs and quote history/comparison, protected purchase orders, partial GRNs, landed costs, supplier invoice matching/payables, credits, purchase returns, reporting, and private document policies.
- Integrated accepted receipts and purchase returns atomically with the existing `PURCHASE_RECEIPT` and `PURCHASE_RETURN` inventory ledger paths; no parallel stock system was introduced.
- Completed the 22-step authenticated hosted procurement gate with ephemeral confirmed users, full fixture cleanup, browser health checks, GRN idempotency, three-way invoice links, and restricted tenant/branch authorization tests.

- Built the Phase 2 immutable inventory ledger and derived stock engine with Weighted Average and FIFO costing, deterministic layer allocation, reservations, transfers, counts, reversals, reconciliation, idempotency, concurrency locks, RLS, capability controls, reporting, exports, and responsive inventory workflows.
- Added 66 hosted Phase 2 pgTAP assertions and inventory calculation unit coverage, including count variance posting, exact FIFO restoration, direct-write denial, cross-tenant isolation, and branch scope.

- Built Phase 1 branches, warehouses, hierarchical storage locations, and the complete tenant-safe product catalogue.
- Added simple and option-generated variant products, packaging conversions, organization-unique SKUs/barcodes, tax and price-list configuration, private product images, and lifecycle controls.
- Added validated CSV preview/import, deterministic CSV export, responsive catalogue/location screens, capability enforcement, audit events, and default warehouse/price-list workflows.
- Added 35 Phase 1 pgTAP assertions and catalogue unit coverage while preserving the explicit boundary that no stock balance or Inventory Ledger implementation exists in this phase.

- Initialized product architecture, security, database, RBAC, offline-sync, and delivery documentation.
- Established the Next.js/Supabase project foundation and tenant-safe schema baseline.
- Added Supabase SSR authentication clients, validated registration/login actions, PKCE callback handling, a responsive application shell, and foundational tests.
- Recorded the external npm registry outage that prevented dependency and build verification.
- Installed and pinned dependencies with a lockfile; lint, typecheck, unit tests, Playwright, and production build now pass.
- Hardened Supabase SSR around verified claims, refresh-cookie propagation, no-store caching, PKCE redirects, logout, and server-side protected-route validation.
- Separated public pages from the dynamic authenticated application shell and added isolated browser tests.
- Added capability-authorized tenant mutations, atomic owner bootstrap, and pgTAP tenant-isolation/RBAC tests.
- Recorded local Supabase migration execution as blocked by official container registry TLS/DNS/short-read failures.
- Linked the dedicated hosted `inventman` development project, safely dry-ran and applied the tenant/RBAC foundation migration, and regenerated database types.
- Added an invitation lifecycle model, enforced branch-scoped visibility, and prevented role managers from granting capabilities they do not hold.
- Configured hosted development Auth callback URLs for the local port while preserving the project security settings.
- Executed 27 hosted pgTAP assertions covering tenant isolation, RBAC escalation, branch scoping/tampering, anonymous denial, and atomic owner bootstrap; all passed.
- Added server-authorized organization onboarding, membership-aware dashboard routing, and hosted alphanumeric OTP verification.
- Added browser coverage for onboarding protection, invalid callbacks, no-store behavior, and external redirect rejection.
- Recorded the remaining hosted email expiry/rate-limit blocker; no release commit was created.
- Added a development-only, fail-closed Admin API utility that provisions confirmed ephemeral users, runs real password/session/onboarding/logout and authenticated tenant-boundary checks, and always cleans up its fixtures.
- Completed the application-controlled authentication foundation gate without weakening production email confirmation.
- Split application foundation readiness from the pre-production communication gate and documented custom Supabase SMTP requirements.
# Phase 8 — Offline PWA and sync engine

- Added an installable Inventman PWA with explicit safe caching and offline fallback.
- Added versioned Dexie reference caches, held carts, durable offline transactions, queue history, results, and conflicts.
- Added tenant/branch/terminal-bound device registration and revocation.
- Added conservative offline POS cash checkout and pending local receipts.
- Added deterministic replay through the existing POS/Sales/Inventory/Payments orchestration with idempotent receipt reconciliation.
- Added sync status, manual/automatic replay, multi-tab locking, backoff, and Offline & Sync administration.
- Added seven synchronized database migrations, refreshed generated types, 13 unit assertions, and 31 database assertions.
- Verified durable held-cart recovery, two-sale offline browser replay, all 350 hosted pgTAP assertions, and guarded POS/payment fixture cleanup ordering.
- Kept production custom SMTP, redirect allowlists, and delivery monitoring as release prerequisites.
# Phase 10

- Added SaaS plans, subscriptions, entitlements, real usage limits and downgrade-safe enforcement.
- Added tenant Billing & Plan and visually separate Platform Administration interfaces.
- Added signed, idempotent billing-provider webhook architecture and time-bounded offline entitlement leases.
