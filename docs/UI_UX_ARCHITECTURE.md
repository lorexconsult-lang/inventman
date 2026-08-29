# Authenticated UI/UX architecture

## Scope and invariants

Phase 13 changes presentation and navigation without changing database migrations, RPC contracts, authorization decisions, entitlement resolution, offline queue semantics, or accounting/inventory calculations. Server layouts remain the trust boundary. `DashboardLayout` obtains the current organization, available organizations, effective capabilities, and entitled features before rendering the shell.

The client navigation receives only the resolved capability and feature code sets. Filtering controls discoverability; it is not a replacement for server checks. Organization switching still uses the existing server action and cookie, guarded against unsynced device work.

## Composition

`AppShell` owns the tenant workspace frame:

1. Desktop organization identity and grouped navigation.
2. Sticky topbar with route-derived breadcrumbs, synchronization state, workspace switching, and sign-out.
3. Bounded application content with shared table/form treatment.
4. Mobile menu trigger, backdrop, and off-canvas version of the same filtered navigation.
5. PWA registration and existing offline behavior.

The platform-administration layout is intentionally visually distinct and continues to call `requirePlatformAdmin()` before rendering. Its navigation exposes internal platform resources and an explicit return to the tenant workspace.

## Route inventory

The authenticated route families below were audited in Phase 13. Dynamic detail/edit routes inherit the same family shell and presentation rules.

| Area | Route families | Primary experience |
| --- | --- | --- |
| Operations overview | `/dashboard` | KPIs, first-run progress, exceptions |
| Catalogue | `/dashboard/catalogue`, `/new`, `/import`, `/settings`, `/[productId]`, product inventory/procurement | Product records, imports, pricing, stock context |
| Inventory | `/dashboard/inventory`, `/opening`, `/movements`, `/adjustments`, `/counts`, `/transfers`, `/reservations`, `/valuation`, `/settings` | Stock control and auditability |
| Procurement | `/dashboard/procurement`, `/suppliers`, `/requisitions`, `/approvals`, `/rfqs`, `/purchase-orders`, `/receipts`, `/returns`, `/invoices`, `/payments`, `/reports` | Procure-to-pay workflow |
| Sales | `/dashboard/sales`, `/customers`, `/quotations`, `/orders`, `/fulfilments`, `/invoices`, `/returns`, `/credit-notes`, `/payments`, `/receivables`, `/reports` | Quote-to-cash workflow |
| Payments | `/dashboard/payments` | Customer/supplier payment overview |
| POS | `/dashboard/pos`, `/sessions`, `/receipts`, `/reports` | Register, session, receipt, offline-aware sale flow |
| Finance | `/dashboard/finance`, `/accounts`, `/journals`, `/ledger`, `/expenses`, `/cash-bank`, `/reconciliation`, `/periods`, `/reports`, `/settings` | Accounting records and reporting |
| Business setup | `/dashboard/branches`, `/warehouses`, including detail/create routes | Operational locations |
| Administration | `/dashboard/settings`, `/team`, `/roles`, `/billing`, `/payments`, `/pos`, `/offline` | Organization, access, billing, and channel setup |
| Platform admin | `/platform-admin`, `/tenants`, `/plans`, `/audit`, tenant detail | Cross-tenant platform operations |

## State model

Server Components remain the default for reads. Client Components are limited to interaction boundaries such as the navigation drawer, workspace switch guard, offline status, and existing transactional forms. Route loading uses a low-layout-shift skeleton. Route errors provide a retry without discarding the current workspace. Empty collections continue to show domain-specific next steps.

The UI never fabricates a global branch filter: many existing workflows deliberately select branch or warehouse as part of the transaction. Introducing a cosmetic global selector without plumbing it into every query would be misleading. Branch context therefore remains explicit within each workflow until a separately specified domain-level context contract exists.

## Verification contract

For UI changes, the minimum checkpoint is type checking plus an authenticated browser pass at desktop and 390px that validates page load, current navigation, drawer behavior, key controls, and console errors. Release verification additionally runs lint, unit tests, production build, Playwright, authenticated workflow verification, hosted database tests, and environment cleanup according to the production runbooks.
