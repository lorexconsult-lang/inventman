# POS Architecture

## Boundary

POS is an orchestration layer over the existing Sales, Inventory Ledger, customer receivables, and shared Payments engine. It does not maintain parallel stock, customer-balance, invoice, or settlement truth. A completed checkout creates a Sales Order, confirms its reservation, posts a fulfilment as an immutable `SALE` movement, issues the customer invoice, and posts/allocates each tender in one PostgreSQL transaction.

## Terminals and sessions

Terminals are organization- and branch-bound and select an active warehouse, stock location, walk-in customer, cash settlement account, and receipt format. A partial unique index permits one open/closing session per terminal. Opening float, cash sales, refunds, drops, paid-in/paid-out events, and neutral closing counts form an append-only operational till event stream. Expected cash is derived from those events. Variances above organization tolerance require a reason and manager review.

## Checkout and credit

`post_pos_sale` locks the session and terminal, validates branch access and `pos.sale.create`, uses authoritative catalogue price and Sales override controls, and calls the existing Sales and Payments functions. Split tender supports configured cash, card-clearing, transfer, mobile-money, and other methods without storing cardholder secrets. Cash tender and change are explicit. A named customer may leave the unpaid remainder as receivables subject to existing credit status/limit enforcement; the configured walk-in customer may never buy on credit. Existing unapplied payments and Credit Notes can be allocated as non-cash tender without double-counting.

## Held carts, receipts, and returns

Held carts are resumable, expiring snapshots and do not reserve or mutate inventory. A completed cart is linked to its POS sale. Receipts reference the Sales Order, fulfilment, invoice, Inventory transaction, and settlement records and can be printed or audited on reprint. Completed-sale corrections use the existing Sales Return, `SALE_RETURN`, Credit Note, refund, and payment-reversal architecture; POS never deletes completed history.

## Security

All exposed POS tables use forced RLS. Direct authenticated writes are revoked; mutations use `SECURITY DEFINER` functions with an empty `search_path`, capability checks, branch checks, tenant-composite foreign keys, state locks, and audit events. Capabilities answer what a cashier can do and branch access answers where. The seeded Cashier role is only a template; no authorization decision uses its name.

## Deferred boundaries

Phase 7 does not include offline queues, payment gateways, card processing, cash drawers/printers, bank reconciliation, General Ledger, expenses, subscriptions, or accounting close. Receipts use browser printing. Operational till and settlement totals are not accounting cash balances.
# Offline POS

An authenticated cashier with a previously cached active terminal/session can record a policy-approved immediate-settlement sale offline. The browser commits an immutable transaction and queue item before showing a pending receipt. Reconnect uses `replay_offline_pos_sale`, which revalidates current access and calls `post_pos_sale`. Offline refunds and authoritative returns remain disabled.
