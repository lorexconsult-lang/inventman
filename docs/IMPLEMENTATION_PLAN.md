# Implementation Plan

Status meanings: **Not Started**, **In Progress**, **Complete**, **Blocked**. A phase is complete only when its real workflow, authorization, tests, and documentation are complete.

| Phase | Scope | Status |
|---:|---|---|
| 0 | Repository inspection and architecture documentation | Complete |
| 1 | Core project setup and design system | In Progress |
| 2 | Supabase environment, migrations and generated types | In Progress (hosted development project linked) |
| 3 | Authentication | In Progress |
| 4–30 | Remaining sequence from organizations through deployment readiness | Not Started |

## Current foundation acceptance criteria

- Buildable Next.js 16 App Router project with centralized configuration.
- Version-controlled local Supabase configuration and initial tenant/RBAC migration.
- RLS membership helpers and cross-tenant policy foundation.
- Browser/server Supabase clients using the supported SSR cookie model.
- Accessible responsive shell and foundational UI primitives.
- Lint, strict typecheck, unit test, and production build passing.

## FOUNDATION APPLICATION GATE

| Verification | Status | Evidence |
|---|---|---|
| Dependency installation | PASS | Exact direct versions installed; `package-lock.json` retained; `npm ls --depth=0` passed; npm audit reported zero vulnerabilities. |
| Lint | PASS | `npm run lint` completed with no errors or warnings. |
| Typecheck | PASS | `npm run typecheck` completed under strict TypeScript. |
| Unit tests | PASS | `npm test`: 2 files and 3 tests passed. |
| Playwright | PASS | Public/auth rendering, unauthenticated dashboard/onboarding rejection, invalid callback handling, safe redirects, and no-store response checks: 4 tests passed. |
| Production build | PASS | `npm run build` compiled, typechecked, prerendered public routes, and kept `/dashboard` dynamic. |
| Supabase migration | PASS | Linked only to the dedicated `inventman` development project. The dry run listed one expected migration; push completed and local/remote history match at `20260825120000`. Remote database lint reports no schema errors. |
| Generated database types | PASS | Types were regenerated from the linked hosted schema and include invitations plus foundation RPCs. |
| Authentication URL configuration | PASS | Hosted Auth uses `http://localhost:3100` and allows callback URLs for localhost/127.0.0.1 on ports 3000 and 3100. Existing MFA, 8-character OTP, rate-limit, and storage settings were preserved. |
| Registration | PASS | A real hosted-development signup reached the check-email state and triggered Supabase confirmation without disabling email verification. |
| Password login | PASS | A uniquely tagged, Admin-API-provisioned confirmed development user completed the real application login form. Credentials remained process-only. |
| Session and dashboard | PASS | Verified `getClaims()` protection, onboarding redirect, atomic organization creation, dashboard access, refresh persistence, membership resolution, and absence of browser/network errors. |
| Logout and protected routes | PASS | Real logout removed access; logged-out, cleared-cookie, and malformed-cookie requests all redirected server-side to login without restoration on refresh. |
| Authenticated tenant boundary | PASS | Two temporary confirmed users and organizations proved foreign organization reads, updates, and branch reads are filtered through the hosted API boundary. |
| RLS tenant isolation | PASS | Linked pgTAP executed transactionally against hosted development: all 27 assertions passed, including inverse tenant reads/writes and anonymous denial. |
| RBAC authorization | PASS | Hosted pgTAP proves owner capability, restricted-role denial, and prevention of granting capabilities the actor lacks. |
| Branch isolation | PASS | Hosted pgTAP proves Branch A-only reads, Branch B filtering, and rejection of manual `branch_id` tampering. |
| Owner bootstrap RPC | PASS | Hosted pgTAP proves authenticated ownership, atomic foundation creation, duplicate-slug rejection, and rollback consistency. |
| Environment security | PASS | Only application URL, Supabase URL, and publishable key are browser-visible; secret scan was clean; `.env.local` is ignored. |
| Browser verification | PASS | Real password login, onboarding, dashboard, refresh, logout, post-logout rejection, malformed-cookie rejection, console/network monitoring, and authenticated tenant-boundary tests passed. |

The application-controlled foundation gate is complete. Temporary users and tenant fixtures were deleted after verification.

## PHASE 2 INVENTORY GATE

| Verification | Status | Evidence |
|---|---|---|
| Ledger and costing | PASS | Immutable movements, derived balances, Weighted Average, FIFO layers/allocations, reversals, and reconciliation are deployed to hosted development. |
| Workflows | PASS | Opening stock, manual stock events, reservations, transfers, stock counts, settings, history, valuation, and CSV exports are implemented. |
| Tenant security | PASS | Capability RPCs, RLS, branch scope, direct-write denial, actor derivation, and audit events are enforced. |
| Database tests | PASS | All 66 Phase 2 hosted pgTAP assertions pass. |
| Application gates | PASS | Strict typecheck, ESLint, 19 unit tests, 4 browser security tests, and the production build pass; all 128 hosted database assertions pass together. |

## PHASE 3 PROCUREMENT GATE

| Verification | Status | Evidence |
|---|---|---|
| Supplier and procurement schema | PASS | Supplier master, approvals, sourcing, PO, GRN, landed cost, invoice/AP, credit and return structures are deployed to hosted development. |
| Inventory integration | PASS | Accepted GRNs and purchase returns call the existing inventory engine atomically with idempotency and row locks. |
| Security | PASS | Forced RLS, tenant-composite references, branch policies, capability RPCs, private document storage, and direct ledger-write denial are implemented. |
| Tests and build | PASS | All 164 hosted pgTAP assertions, 27 unit tests, 4 Playwright security tests, the authenticated 22-step hosted procurement workflow, strict typecheck, ESLint, database lint, and production build pass. |

## PHASE 4 CUSTOMER, SALES AND RECEIVABLES GATE

| Verification | Status | Evidence |
|---|---|---|
| Customer and Sales schema | PASS | Customer master, quotations, orders, fulfilments, invoices/AR, returns, Credits, activity, tenant-composite references, indexes, and generated types are deployed to hosted development. |
| Atomic order and reservation workflow | PASS | Confirmation, partial reservation/backorder policy, cancellation release, row/advisory locking, capability checks, and exact idempotency use the existing Inventory Reservation subsystem. |
| Inventory and COGS integration | PASS | Partial 10→4→6 fulfilment posts `SALE`, consumes reservations exactly, and records authoritative ledger COGS and margin. Invoice issue has an explicit zero-stock-mutation regression assertion. |
| Returns and receivables | PASS | Return eligibility, inspection disposition, `SALE_RETURN`, historical WAC/FIFO restoration links, return-linked Credit Notes, and derived AR are transactionally enforced. |
| Sales application | PASS | Customer, quotation, Sales Order, partial/full fulfilment, invoice, receivables/aging/statement, return, Credit Note, dashboard, report, print, and CSV routes are implemented. |
| Database tests | PASS | 39 Phase 4 hosted pgTAP assertions pass. Tenant, Catalogue, Inventory, Procurement and Sales run together as 203 assertions. |
| Database lint | PASS | Public-schema lint has no Phase 4 errors; pgTAP extension-internal findings are excluded from the application schema result. |

Phase 4 itself did not include settlement. Customer/supplier settlement and allocation are now implemented by Phase 6; POS and Finance remain deferred.

## PRODUCTION COMMUNICATION GATE

| Verification | Status | Evidence |
|---|---|---|
| Supabase shared email delivery | BLOCKED | The hosted shared SMTP service throttled confirmation attempts; it is not production delivery infrastructure. |
| Custom SMTP configuration | BLOCKED | No production SMTP provider has been configured in Supabase Auth. See `docs/AUTH_EMAIL_DELIVERY.md`. |
| Signup confirmation email | BLOCKED | Real delivery and confirmation remain pending custom SMTP or renewed hosted delivery capacity. |
| Password reset email | BLOCKED | Requires production SMTP configuration and a real mailbox test. |
| Valid production callback | BLOCKED | Invalid-token, safe-redirect, and no-store behavior pass; a real production email link and canonical HTTPS origin remain pending. |

The communication gate is a pre-production release blocker, not a blocker for application development. Email delivery has not been claimed as verified.

## Next.js security release hold

Next.js 16.3.2 is acceptable for foundation verification. The Next.js team announced a scheduled security release for 2026-08-26 covering the 16.3 line and a critical vulnerability. Upgrade to the patched stable 16.3.x version and rerun this gate before any production deployment.

## PHASE 5 TEAM AND ACCESS ADMINISTRATION GATE

| Verification | Status | Evidence |
|---|---|---|
| Membership and owner safety | PASS | Staff lifecycle, suspension/reactivation, self-change denial, and final-owner protection use locked RPCs. |
| Invitations | PASS | Hashed expiring tokens, verified-email binding, assignment snapshots, resend rotation, revocation, duplicate handling, and one-time acceptance are implemented. |
| Roles and branch access | PASS | Grouped permissions, custom role duplication/editing, atomic replacement, effective permissions, and branch scope remain capability-driven. |
| Context and navigation | PASS | Server-validated HTTP-only workspace selection replaces first-membership selection; navigation is capability-aware with a forbidden experience. |
| Account lifecycle | PASS | Forgot/reset-password flows use Supabase Auth PKCE callbacks and safe relative redirects. Production delivery remains gated by custom SMTP. |
| Database tests | PASS | 36 Phase 5 hosted pgTAP assertions cover invitation, role, branch, suspension, tenant, escalation, and owner controls. |

No POS, Payments, Finance, Offline/PWA, Subscriptions, Super Admin, Industry Packs, AI, or public-site work is included.

## PHASE 6 PAYMENTS AND SETTLEMENT GATE

| Verification | Status | Evidence |
|---|---|---|
| Shared settlement model | PASS | Customer and supplier transactions reuse accounts, methods, payments, allocations, reversal, refund, numbering, idempotency, and audit architecture. |
| AR/AP integration | PASS | Outstanding, unapplied credit/advances, statements, and exposure derive from invoices, credits, payments, and reversals. |
| Security | PASS | PostgreSQL enforces tenant, branch, capability, currency, over-allocation, immutability, and cross-reference controls. |
| Application | PASS | Receipt/voucher entry, allocation, refund/reversal, configuration, statements, dashboard, filters, print, and CSV routes are implemented. |
| Verification | PASS | 38 new Phase 6 pgTAP assertions bring the hosted total to 277; 41 unit tests, 4 baseline Playwright tests, the 37-check payment workflow, Team/Sales regressions, lint, typecheck, build, and database lint pass. |

POS, gateways, bank APIs/reconciliation, General Ledger, expenses, subscriptions, and offline operation remain deferred.

## PHASE 7 POS AND CASHIER OPERATIONS GATE

| Verification | Status | Evidence |
|---|---|---|
| Shared transaction path | IMPLEMENTED | Atomic POS checkout composes existing Sales Order, reservation, fulfilment/`SALE`, invoice, Payment allocation, and customer-credit controls. |
| Till operations | IMPLEMENTED | Branch terminals, one open session, opening float, cash events, blind close, tolerance, manager review, held carts, and audit history are implemented. |
| Register application | IMPLEMENTED | Barcode/SKU search, responsive cart, discounts, split tender, cash change, customer pay-later credit, receipts, returns link, settings, sessions, reports, and CSV exist. |
| Security | IMPLEMENTED | Forced RLS, revoked direct writes, composite tenant references, capability/branch checks, state locks, idempotency, safe card metadata boundary, and audit events are in place. |
| Verification | PASS | 42 new Phase 7 pgTAP assertions bring the hosted total to 319; 46 unit tests, 4 baseline Playwright tests, the 34-check authenticated POS workflow, Sales/Team regressions, lint, typecheck, build, and public-schema database lint pass. |

Offline POS, gateways/card processing, peripheral integrations, bank reconciliation, General Ledger, expenses, subscriptions, and PWA remain deferred.
# Phase 8 — Offline-first PWA and POS sync

Complete and verified: installable manifest and safe service worker, Dexie v3 scoped cache/queue, durable held carts and offline cash sale receipts, device registration/revocation, explicit replay through POS, retry/locking/conflicts/reconciliation UI, 13 new Vitest assertions, and 31 new pgTAP assertions. All 69 hosted migrations and generated types are synchronized; all 350 hosted assertions and the authenticated two-sale offline browser workflow pass. Production SMTP remains a release prerequisite.
# Phase 9 — Finance, Expenses, General Ledger and Reporting

Implemented: controlled activation, generic Chart of Accounts, mappings, transactional event posting, immutable balanced journals, reversals, accounting periods, Sales/COGS/Procurement/Payment/Return adapters, expenses with shared approvals, cash transfers, manual bank reconciliation, GL/Trial Balance/P&L/Balance Sheet/categorized cash flow, reconciliations, exports, forced RLS, generated types, hosted pgTAP and responsive administration.

Verification: 48 new Phase 9 pgTAP assertions bring the hosted aggregate to 398. The authenticated Finance workflow passes 40 checks with complete cleanup; Team, Sales, Procurement, Payments and POS authenticated regressions pass, including offline POS replay. Vitest passes 67 assertions, Playwright passes 6 browser/PWA checks, and database lint, migration sync, typecheck, ESLint and production build pass.
