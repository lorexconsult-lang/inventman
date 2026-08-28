export type BalanceRow = {
  account_type: string | null;
  balance: number | string | null;
};

export function sumBalances(rows: BalanceRow[], type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE") {
  return rows.filter((row) => row.account_type === type).reduce((sum, row) => sum + Number(row.balance ?? 0), 0);
}

export function profitAndLoss(rows: BalanceRow[]) {
  const revenue = sumBalances(rows, "REVENUE");
  const expenses = sumBalances(rows, "EXPENSE");
  return { revenue, expenses, netProfit: revenue - expenses };
}

export function balanceSheet(rows: BalanceRow[]) {
  const assets = sumBalances(rows, "ASSET");
  const liabilities = sumBalances(rows, "LIABILITY");
  const equity = sumBalances(rows, "EQUITY");
  const currentEarnings = profitAndLoss(rows).netProfit;
  return { assets, liabilities, equity, currentEarnings, difference: assets - liabilities - equity - currentEarnings };
}

export function trialBalanceTotals(rows: Array<{ debit_balance: number | string | null; credit_balance: number | string | null }>) {
  return rows.reduce((total, row) => ({ debit: total.debit + Number(row.debit_balance ?? 0), credit: total.credit + Number(row.credit_balance ?? 0) }), { debit: 0, credit: 0 });
}

export function reconciliationDifference(subledger: number | string | null, gl: number | string | null) {
  return Number(subledger ?? 0) - Number(gl ?? 0);
}

export function formatMoney(value: number | string | null | undefined, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value ?? 0));
}
