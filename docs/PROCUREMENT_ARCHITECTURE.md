# Procurement Architecture

## Supplier master

Suppliers are organization-owned lifecycle records with many addresses, contacts, private documents, and product relationships. A variant can have many suppliers; preferred status is relationship metadata rather than a product foreign key. Supplier quotation prices append to immutable history in transaction and base currency.

Private documents use the `supplier-documents` bucket and tenant-prefixed object paths. Storage policies validate the organization prefix and supplier capabilities; allowed media types and a 20 MB limit are enforced by the bucket.

## Demand, sourcing, and approvals

Purchase requisitions snapshot packaging conversions and estimated cost. Reusable approval policies contain ordered steps, capability requirements, thresholds, optional branch scope, and self-approval rules. Requests and actions preserve immutable decision history and support sequential approval.

Approved demand can feed RFQs. Each RFQ has independent supplier invitations and immutable quotation responses. Comparison uses deterministic landed-base cost, delivery time, terms, quantity, and historical performance. Awards may be line-specific; lowest price is displayed but never automatically selected.

## Purchase orders

Purchase orders snapshot supplier identity and terms, product descriptions, supplier item codes, packaging conversion, currency, exchange rate, price, discount, and tax. Tenant-safe numbers use the existing locked counter rather than `MAX + 1`. Approved commercial fields are guarded against rewriting; material changes require a revision/reapproval workflow.

## Receiving and inventory

Each delivery creates a separate GRN. Lines distinguish delivered, accepted, rejected, damaged, previously accepted, and cumulative outstanding quantities. PO lines are locked during posting, preventing concurrent over-receipt. The organization policy is `DISALLOW`, tolerance-based, or explicit authorized override with a required audit reason.

`post_goods_receipt` atomically creates the inspected GRN, updates cumulative PO quantities, and calls the Phase 2 posting engine with `PURCHASE_RECEIPT`. Only accepted goods reach normal inventory. Supplier price and the document exchange-rate snapshot are normalized to base-unit/base-currency cost before the existing WAC or FIFO engine receives them. If ledger posting fails, the GRN and PO changes roll back.

Purchase returns call the same engine with `PURCHASE_RETURN`; they never update balances or movements directly. FIFO safety remains owned by the inventory layer. Rejected goods do not enter inventory and therefore need no compensating movement.

## Landed cost

Freight, shipping, insurance, duty, clearing, handling, port, and other configured acquisition costs can be allocated by value, quantity, or manual amounts. Currency and exchange rate are snapshotted. Allocation history is separate from receipt movements. Later-known cost requires a future controlled inventory revaluation event; historical receipt rows and FIFO layers must not be edited.

Recoverable-tax classification is reserved for the Finance tax-accounting extension. Tax is snapshotted on procurement documents but is not silently capitalized as inventory acquisition cost.

## Invoices and payables

Supplier invoices have organization/supplier/invoice-number uniqueness, PO/GRN links, match status, and approval state. The payable projection derives approved invoice value less approved supplier credits and future allocated payments. Credits are financial documents, not negative fake payments. Actual cash/bank settlement and payment allocation are intentionally deferred to Finance.

## Security and concurrency

All exposed tables force RLS. Read policies require capabilities and apply branch scope to operational documents. Composite tenant foreign keys reject foreign suppliers, products, locations, documents, and policies. Critical transitions are security-definer RPCs with empty search paths, server-derived actors, row locks, idempotency keys, and append-only activity/audit events. Authenticated clients cannot directly mutate inventory balances or movements.

## Future extensions

The schema leaves explicit boundaries for supplier portals, payment allocation, controlled landed-cost revaluation, richer tax accounting, supplier credit allocation, and deterministic/AI-assisted procurement intelligence. None of those extensions may bypass approval history or the inventory posting boundary.

## Verification

The hosted development gate provisions confirmed ephemeral users and tagged organizations, exercises all 22 supplier-to-return workflow steps, validates WAC quantities/value and immutable inventory transaction types, tests GRN replay, duplicate invoices, approval denial, branch tampering and tenant isolation, then purges all tagged transactional and identity fixtures. The cleanup RPC is service-role-only and refuses any organization without the `phase3-e2e-` slug prefix.
