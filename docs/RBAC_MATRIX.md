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
