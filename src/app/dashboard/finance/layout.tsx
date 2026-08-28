import Link from "next/link";
import type { ReactNode } from "react";
import { requireOrganizationPermission } from "@/features/organizations/context";

const links = [["Overview","/dashboard/finance"],["Expenses","/dashboard/finance/expenses"],["Accounts","/dashboard/finance/accounts"],["Journals","/dashboard/finance/journals"],["General ledger","/dashboard/finance/ledger"],["Cash & bank","/dashboard/finance/cash-bank"],["Reconciliation","/dashboard/finance/reconciliation"],["Reports","/dashboard/finance/reports"],["Periods","/dashboard/finance/periods"],["Settings","/dashboard/finance/settings"]];
export default async function FinanceLayout({children}:{children:ReactNode}) { await requireOrganizationPermission("finance.view"); return <div className="space-y-6"><nav aria-label="Finance" className="flex gap-2 overflow-x-auto rounded-xl border bg-surface p-2">{links.map(([label,href])=><Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">{label}</Link>)}</nav>{children}</div>; }
