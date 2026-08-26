# RBAC Matrix

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
