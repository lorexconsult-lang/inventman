# Inventory Architecture

## Authority and precision

`inventory_movements` is the immutable source of physical stock truth. `inventory_balances` is a transactionally maintained read model and can be reconciled or rebuilt by a platform-only repair function. Products and variants never carry mutable on-hand quantities.

Quantities use `numeric(24,6)`, unit costs use `numeric(24,8)`, and extended values use `numeric(28,8)`. PostgreSQL performs authoritative conversion and costing; JavaScript values are display/input strings.

## Posting model

Every business event produces one posted `inventory_transactions` header and one or more signed movement rows atomically. The bulk JSON interface supports 500 lines, snapshots entered quantity, packaging conversion, location hierarchy, costing method, and valuation, and derives the actor from `auth.uid()`.

Posted movements and cost allocations cannot be updated or deleted. Authenticated roles have read-only internal-table grants; writes use reviewed security-definer RPCs with empty search paths, tenant validation, capabilities, and branch checks.

## Costing and cost scope

Quantity and valuation are location-scoped. A transfer removes quantity/value from its source, holds the value in transit, and posts the same cost basis at its destination, creating no profit or loss.

Weighted Average recomputes value and average cost on inbound movements. Outbound movements snapshot the current location average. FIFO creates receipt layers and maps outbound movements to allocations. Equal effective timestamps use a monotonic sequence as a deterministic tie-breaker. Unsafe reversal of a consumed inbound FIFO layer is blocked.

## Reservations

Reservations are not physical movements. They update only reserved quantity, so available stock is `on_hand - reserved`. Creation and release lock the same variant/location balance as physical posting, preventing concurrent oversubscription. Reservation events are append-only and idempotent.

## Transfers and counts

Transfers move through DRAFT, DISPATCHED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED, or DISCREPANCY_REVIEW. Dispatch creates source movements and goods in transit. Receipt may be partial, cannot exceed dispatch, and preserves cost basis.

Starting a count snapshots expected quantities. Posting includes later movements before calculating variance. Blind counts hide expectations. Variance posting creates `STOCK_COUNT_ADJUSTMENT` movements and never overwrites balances.

## Reversals

A reversal creates a linked transaction with opposite movements. The original remains and becomes REVERSED. Weighted Average restores historical value. FIFO outbound reversal restores exact allocations; FIFO inbound reversal is blocked after consumption.

## Idempotency and concurrency

Organization-scoped idempotency keys use canonical server-generated request hashes. Exact replay returns the original transaction; changed reuse fails. Advisory transaction locks use organization, variant, and location, followed by balance and layer row locks. Concurrent issues and reservations cannot spend the same stock.

## Policies and repair

Negative stock defaults to DISALLOW. Override needs configuration, explicit capability and request intent; FIFO negative stock stays blocked. Backdating needs configuration plus capability. Costing method changes are blocked after activity.

`reconcile_inventory_balances` compares ledger totals with balances and may rebuild only for platform database roles. Movement indexes cover tenant/time, variant, branch, location, and transaction paths. Future time partitioning can preserve UUID identities and tenant indexes.

## Future integrations

Procurement, Sales/POS, Returns, Production, and Offline Sync must call the same posting boundary with reference and idempotency metadata. Offline clients submit business events, never absolute balances. Nullable lot, serial, and expiry extension keys preserve room for later batch/IMEI/FEFO workflows without implementing them prematurely.
# Offline stock snapshots

Offline POS caches last-known branch availability only for cashier guidance. It subtracts this device's unsynced sale intent but never writes balances, costing layers, WAC, or FIFO. The server inventory posting inside POS checkout remains authoritative and can reject a conflicting replay.
# Finance integration

Inventory remains the valuation authority. Posted fulfilment COGS and return restoration costs feed GL Inventory/COGS journals from recorded authoritative cost fields; catalogue reference costs are never used. `finance_reconciliation` compares signed Inventory Ledger valuation to the Inventory control account.
