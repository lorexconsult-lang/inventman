# Finance and Accounting Architecture

## Authority and activation

Sales, Procurement, Inventory, Payments, POS, Returns and Credits remain the operational systems of record. Finance consumes their committed events through `accounting_events`; the General Ledger is authoritative only for accounting balances. Each organization chooses an accounting start date. Earlier activity is represented by a reviewed balanced opening journal; later qualifying events post once using `(organization_id, source_module, source_type, source_id, posting_version)`.

Activation is deliberately gated: base currency, fiscal year month, a generic editable SME chart, critical control mappings, all active settlement-account mappings, 24 accounting periods and a start date must exist. The template is country-neutral. Localization, statutory filing, payroll, depreciation and advanced year-end automation are future boundaries.

## Posting model

`finance_record_event` is the transactional outbox boundary and `finance_process_event` is the deterministic adapter. `finance_post_lines` is the only internal posted-journal writer. It resolves an open period, validates every tenant-scoped active account, calculates totals database-side, rejects imbalance, assigns a journal number and inserts the header and lines atomically. Retries return the existing journal.

Recognition boundaries are:

- issued customer invoice: debit AR, credit revenue and output tax;
- posted Sales fulfilment: debit COGS, credit Inventory using `sales_fulfillment_lines.inventory_cost_base`, which originates in the Inventory Engine;
- approved supplier invoice: debit Inventory/input tax, credit AP; this is the chosen acquisition recognition boundary, so goods receipt does not also recognize the asset in GL;
- customer receipt: debit mapped cash/bank/clearing, credit AR;
- supplier payment: debit AP, credit mapped cash/bank;
- payment reversal: exact opposite linked accounting effect without deleting the original;
- issued Credit Note: debit revenue/output tax, credit AR;
- posted Sales Return: debit Inventory, credit COGS using historical return cost allocations;
- approved supplier credit/Purchase Return: debit AP, credit Inventory;
- posted customer refund: debit customer AR/credit position, credit mapped cash/bank.

Posting failures mark the accounting event `FAILED`; operational records are not duplicated or rewritten. An activated workflow’s database transaction still fails atomically when a mandatory finance posting cannot be produced, preventing distributed half-state.

## Chart, mappings and journals

Accounts support the five classes, hierarchy, normal balance, optional currency restriction, inactivity and manual-posting policy. AR, AP, Inventory, input/output tax and retained earnings are protected controls. Custom accounts are organization-scoped. Operational mapping rules support branch, product-category and settlement-account overrides, with the most specific rule winning.

Posted journals are immutable. Direct authenticated writes are revoked. A correction calls `reverse_journal`, which creates a fully balanced opposite journal, links it to the original and marks the original `REVERSED`. Manual journals require `finance.journal.post`; protected controls are blocked. Periods move through `OPEN`, `SOFT_CLOSED`, `CLOSED` and `LOCKED`; only open/soft-closed periods accept posting and locked periods cannot reopen.

## Expenses and cash

Expenses reuse the Phase 3 `approval_requests` and `approval_actions` tables. Drafts may be submitted, policy-routed by amount/branch/document type, approved or rejected, then posted. Paid expenses credit mapped settlement accounts; credit expenses credit AP/accrual control. Supporting files use the private `finance-documents` bucket and tenant-first paths.

Payment settlement accounts are not duplicated: each Phase 6 `payment_accounts` record maps to one GL asset/clearing account. Transfers debit the destination, credit the source and separately debit configured bank fees. Drawer events do not post merely because cash moved inside the POS subsystem; an actual transfer posts once.

## Reporting and reconciliation

`general_ledger`, `trial_balance` and `financial_statement_balances` derive from posted lines. The application presents GL, account history, Trial Balance, P&L, Balance Sheet and an explicitly non-statutory categorized cash-movement report with print and CSV output. Current earnings are included when checking `Assets = Liabilities + Equity + Current earnings`.

`finance_reconciliation` compares customer receivables to AR control, supplier payables to AP control and signed Inventory Ledger valuation to Inventory control. Non-zero differences are exceptions. Cash mappings expose operational-versus-GL comparison context.

Bank CSV import accepts user-selected column names, validates date/amount/description and stores private import metadata. Suggestions use exact amount, mapped account and a seven-day date window. The user confirms every match; a payment, transfer or expense cannot be reused. Ambiguous items remain `UNMATCHED` or `REVIEW`.

## Security

All exposed Finance tables use forced RLS. Policies require capability checks and branch access where relevant. Tenant-composite foreign keys reject cross-organization references. Table writes are revoked from authenticated users; security-definer RPCs re-check user, capability, tenant, branch, state and account rules. Internal posting/event/trigger functions are revoked from public, anonymous and authenticated roles. Finance documents remain private. Structured error codes are mapped to safe UI messages.

## Historical initialization

The safe default is controlled activation, not blind historical backfill. The opening process accepts reviewed cash, AR, AP and Inventory control positions and creates the balancing equity line automatically. Inventory openings must first exist in the Inventory Ledger and the resulting control reconciliation must be zero before production use. A verified deterministic backfill can be added later as a separately versioned migration, never inferred automatically.
