# RBAC Matrix

## Phase 6 payment permissions

Customer and supplier payment view/create/post/allocate/reverse capabilities are independent. Refund view/create/approve/post and settlement-account view/manage are separately assignable. Receivables/payables visibility is explicit. Mutations also enforce branch scope; role names never authorize actions.

This matrix is a default template. Organizations may create custom roles; authorization always evaluates capabilities rather than role names.

| Capability group | Owner | Administrator | Branch Manager | Inventory Manager | Storekeeper | Procurement | Sales Manager | Cashier | Accountant | Auditor | Viewer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Organization settings | ✓ | ✓ |  |  |  |  |  |  |  | View | View |
| Users and roles | ✓ | ✓ | Branch |  |  |  |  |  |  | View |  |
| Products | ✓ | ✓ | ✓ | ✓ | View | ✓ | View | View | View | View | View |
| Inventory receive/adjust/count | ✓ | ✓ | Approve | ✓ | Receive/count | Receive | View |  | View | View | View |
| Procurement create/approve | ✓ | ✓ | Branch | View | Receive | ✓ |  |  | Pay | View | View |
| Sales/POS | ✓ | ✓ | ✓ | View |  |  | ✓ | Create | View | View | View |
| Refunds, voids, discounts | ✓ | ✓ | Approve |  |  |  | Approve | Limited | View | View | View |
| Finance and profitability | ✓ | ✓ | Branch |  |  | Limited | ✓ | Shift | ✓ | View |  |
| Audit reports | ✓ | ✓ | Branch | Inventory |  | Procurement | Sales | Own | Finance | ✓ | View |

`Branch` means access is restricted by `member_branch_access`. Exact seeded permission assignments will be introduced with each domain so incomplete capabilities are not advertised.

## Phase 1 permissions

Location capabilities are split into branch create/update/deactivate, warehouse create/update/deactivate, and storage-location create/update/deactivate. Catalogue capabilities separately govern product view/create/update/archive, categories, brands, units, tax profiles, prices, and CSV import. Every application mutation checks a capability server-side; RLS and database functions repeat tenant and scope enforcement.

The default Owner and Administrator roles receive full Phase 1 capabilities. Branch Manager receives operational catalogue and location capabilities subject to branch scope. Cashier receives catalogue read access only. Custom roles remain capability-based.

## Phase 2 inventory permissions

Capabilities separately govern view, opening stock, receipts, issues, adjustments, reservations, transfer create/dispatch/receive, count create/perform/post, reversal, backdate, negative-stock override, settings, valuation, and export. Owner and Administrator receive all. Inventory Manager receives operational and settings capabilities; Storekeeper receives branch-scoped daily workflows without reversal, override, backdate, or settings authority. Auditor and Viewer remain read-only.

## Phase 3 procurement permissions

Supplier, requisition, RFQ, quotation, PO, receipt, invoice, return, report, payable, and approval-policy capabilities are independently assignable. Owner and Administrator receive all. Branch Manager receives branch-scoped operational procurement without PO/invoice approval or policy management. Approval checks use capabilities and policy steps, never role names.

Hosted verification additionally uses a restricted custom role with PO-create capability limited to one branch: an approval attempt and a PO targeting another branch both fail at the database boundary.

## Phase 4 Sales permissions

Customer view/create/update, customer-credit management, quotation view/create/update/submit/approve, order view/create/update/confirm/cancel, fulfilment view/create/post, invoice view/create/issue/void, return view/create/approve/receive/post, Credit Note view/create/approve, discount/price/credit overrides, receivables/aging/statements, and Sales reports are separate capabilities. Branch-aware documents repeat `can_access_branch` checks in RLS and RPCs. Price and discount override controls are enforced on quotation lines in PostgreSQL.

## Phase 5 Team and access permissions

`team.view`, `team.invite`, `team.update`, and `team.suspend` separate directory visibility, invitations, role/branch assignment, and lifecycle control. `roles.view` permits inspection; `roles.manage` governs custom-role mutation. Actors may delegate only capabilities they hold. System Owner roles, self-modification, cross-tenant references, and the final active owner are protected in PostgreSQL.

## Phase 7 POS permissions

POS capabilities independently govern register access, sale completion, discount application/override, held carts, safe void/return/refund initiation, session open/close/review, cash in/out/drop, receipt reprint, terminal administration, and reports. Owner and Administrator receive all POS capabilities. Cashier receives the operational POS capabilities and the minimum Sales, Inventory, Catalogue, Customer, and Payment dependencies needed by atomic checkout. Branch access remains mandatory.
