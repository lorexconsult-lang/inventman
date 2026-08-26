# Sales Architecture

## Database-first boundary

Phase 4 uses PostgreSQL RPCs as the only write boundary for Sales documents. Transactional tables are forced through RLS, authenticated clients receive read access subject to capability and branch policies, and direct writes remain revoked. The browser UI and POS are intentionally outside this database gate.

## Forward flow

`QUOTATION → SALES ORDER → INVENTORY RESERVATION → FULFILMENT → SALE LEDGER → INVOICE → ACCOUNTS RECEIVABLE`

- Quotations and lines retain customer, address, currency, price, packaging, tax, and conversion snapshots.
- Quotation conversion locks the source and uses a unique source link plus payload hash, so retries return one Sales Order.
- Draft orders do not reserve stock. `confirm_sales_order` locks the order/customer, serializes credit exposure, and reserves through the existing Inventory Reservation engine.
- The Inventory Reservation subsystem is authoritative. Sales line reservation fields are projections used for workflow display and outstanding/backorder queries.
- `post_sales_fulfilment` locks the order and lines, consumes the exact reservation quantity, and invokes the existing Inventory Engine with `SALE` in one PostgreSQL transaction. Reservation consumption happens immediately before ledger posting because the inventory engine protects stock still reserved for other documents; any posting failure rolls the consumption back.
- COGS is copied from the resulting immutable inventory movement. Revenue, gross profit, and gross-margin percentage are stored on the fulfilment line.
- Invoice issue does not call the Inventory Engine. Receivables and credit exposure are derived from issued invoices and issued Credits.

## Return flow

`SALE → SALES RETURN → SALE_RETURN LEDGER → CREDIT NOTE → AR REDUCTION`

- Return eligibility is enforced against fulfilled quantity less all previously posted returns while the original fulfilment line is locked.
- Rejected returns create no inventory movement. Accepted normal/damaged restock requires an authorized destination in the return branch.
- WAC returns use the proportional historical value of the original outbound movement.
- FIFO returns consume the original outbound cost allocations deterministically by allocation creation order and ID. Each restored portion is linked in `sales_return_cost_allocations`; cumulative restored quantity and cost cannot exceed the original sale allocations.
- A return-linked Credit Note and the `SALE_RETURN` movement are created in the same transaction. A failure in either rolls back both.
- Credit Notes never modify stock independently.

## Credit policy

Credit exposure is:

`outstanding issued AR + confirmed uninvoiced Sales commitments`

Order confirmation takes an organization/customer advisory transaction lock before evaluating the limit. Exceeding the limit requires both an explicit override request and `sales.credit_override`.

## Backorders

If backorders are allowed, confirmation reserves the available quantity and records the remainder on the Sales line. If disabled, insufficient availability rejects the entire confirmation. The backorder index and line projections preserve everything needed for later manual allocation; automatic allocation is not implemented in this database gate.

## Transaction, concurrency, and idempotency model

- Critical RPCs are `SECURITY DEFINER`, use an empty search path, schema-qualify objects, derive `auth.uid()`, validate capability and branch scope, and do not accept actor or tenant ownership from the client.
- Row locks protect document state and quantities. Inventory/location advisory locks remain owned by the Inventory Engine; customer advisory locks serialize credit exposure.
- Posting documents carry organization-scoped idempotency keys and payload hashes. Exact retries return the original result; changed payloads raise `IDEMPOTENCY_PAYLOAD_MISMATCH`.
- Stable business errors are returned without exposing internal SQL details.

## Security and tenant integrity

Tenant-composite foreign keys cover customer, branch, warehouse/location, variant/packaging, document, ledger, and return relationships. Sensitive child tables inherit branch authorization through their parent policies. `anon` and unauthorized authenticated users cannot execute Sales workflows or mutate ledger/balance tables directly.

## Application surface

Phase 4 includes authenticated screens for customers, quotations, Sales Orders, fulfilments, invoices, receivables and customer statements, Sales Returns, Credit Notes, dashboard metrics, reports, printing, and CSV exports. Draft quotation and customer edits cross capability-checked RPC boundaries. Sales line inserts enforce price and discount override capabilities in PostgreSQL, not only in the browser.

Payment allocation, POS, Finance, and independent manual Credit Notes remain outside Phase 4. Statements therefore show issued invoices and issued Credit Notes only.

## Verification cleanup

`purge_ephemeral_sales_verification` remains in permanent migration history because it was already deployed and is the fail-closed cleanup boundary for authenticated hosted verification. Execution is restricted to `service_role`, and the target organization must use the `phase4-e2e-` slug prefix. It is not available to application users.
