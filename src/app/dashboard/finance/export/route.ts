import { NextRequest } from "next/server";
import { financeData } from "@/features/finance/queries";
const escape = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;
export async function GET(request: NextRequest) {
  const report = request.nextUrl.searchParams.get("report") ?? "ledger";
  const d = await financeData();
  let headers: string[];
  let rows: unknown[][];
  if (report === "trial-balance") {
    headers = ["Account code", "Account name", "Debit", "Credit"];
    rows = d.trial.map((x) => [
      x.account_code,
      x.name,
      x.debit_balance,
      x.credit_balance,
    ]);
  } else if (report === "expenses") {
    headers = ["Expense", "Date", "Payee", "Description", "Amount", "Tax", "Currency", "Status"];
    rows = d.expenses.map((x) => [x.expense_number, x.expense_date, x.payee, x.description, x.amount, x.tax_amount, x.currency, x.status]);
  } else if (report === "bank-reconciliation") {
    headers = ["Date", "Account", "Reference", "Description", "Amount", "Status", "Matched source"];
    rows = d.bankLines.map((x) => [x.transaction_date, x.payment_accounts?.name, x.reference, x.description, x.amount, x.status, x.matched_source_type]);
  } else if (report === "journals") {
    headers = ["Journal", "Date", "Source module", "Source type", "Description", "Status"];
    rows = d.journals.map((x) => [x.journal_number, x.journal_date, x.source_module, x.source_type, x.description, x.status]);
  } else if (
    report === "profit-loss" ||
    report === "balance-sheet" ||
    report === "cash-flow"
  ) {
    headers = ["Account type", "Account code", "Account name", "Balance"];
    rows = d.balances
      .filter((x) =>
        report === "profit-loss"
          ? ["REVENUE", "EXPENSE"].includes(x.account_type ?? "")
          : report === "balance-sheet"
            ? ["ASSET", "LIABILITY", "EQUITY"].includes(x.account_type ?? "")
            : x.account_type === "ASSET" && /cash|bank/i.test(x.name ?? ""),
      )
      .map((x) => [x.account_type, x.account_code, x.name, x.balance]);
  } else {
    headers = [
      "Date",
      "Account code",
      "Account",
      "Journal",
      "Source module",
      "Source type",
      "Debit",
      "Credit",
      "Running balance",
    ];
    rows = d.ledger.map((x) => [
      x.journal_date,
      x.account_code,
      x.account_name,
      x.journal_number,
      x.source_module,
      x.source_type,
      x.base_debit,
      x.base_credit,
      x.running_balance,
    ]);
  }
  const csv = [headers, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="finance-${report}.csv"`,
    },
  });
}
