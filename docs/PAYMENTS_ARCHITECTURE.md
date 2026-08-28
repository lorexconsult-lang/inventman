# Payments and Settlement Architecture

Phase 6 adds one operational settlement engine shared by customer receipts and supplier payments. It deliberately excludes General Ledger, bank reconciliation, gateways, card processing, and POS.

## Model

`payment_accounts` represent operational cash, bank, card-clearing, mobile-money, and other-clearing destinations. `payment_methods` configure references, overpayments, branch scope, default accounts, and approval behavior. `payments` is the common transaction; typed allocations settle customer or supplier invoices. Credit allocations are non-cash documents. Refunds and linked reversals preserve history.

Invoice outstanding, AR, AP, unapplied customer credit, supplier advances, operational account balances, and statements are database-derived. No editable balance is authoritative.

## Controls

Posting, allocation, reversal, credit application, and refund functions derive the tenant and actor from the session. They enforce capabilities, branch scope, tenant/counterparty/currency consistency, active configuration, idempotency hashes, duplicate-reference policy, row locking, allocation limits, and audit events. Posted records are immutable to ordinary callers. Reversal unwinds allocations atomically.

Approval-required refunds reuse the approval engine and need a matching active policy. Card numbers, CVV, PIN, and track data are never stored.

## Boundaries

Exchange-rate snapshots are retained, but realized FX is deferred to Finance. Account balances are operational settlement balances, not accounting cash balances. Future POS can reuse this engine, but no POS workflow is included.

## POS consumer

POS split tender creates ordinary customer payments through `post_customer_payment`, with one allocation to the issued POS invoice per tender. Cash, card-clearing, transfer, and mobile-money remain configured methods/accounts. Existing unapplied payments and Credit Notes can settle a POS invoice as non-cash credit; a pay-later remainder stays in AR. No card secrets or gateway confirmations are stored, and till totals are operational rather than General Ledger balances.
# Offline tender boundary

Cash is the default offline tender. Card and transfer records require explicit policy and remain unverified metadata; customer/store credit defaults to online-only. Replay revalidates active payment methods and the existing settlement engine creates authoritative payment and till effects exactly once.
# Finance integration

Phase 6 settlement accounts map to GL asset/clearing accounts; no second cash model exists. Customer receipts, supplier payments, refunds and reversals post through their authoritative payment records. A reversal creates an opposite linked journal and never deletes the original.
