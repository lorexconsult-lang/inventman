import "server-only";
import { getOrganizationContext } from "@/features/organizations/context";

export async function financeData() {
  const context = await getOrganizationContext(); const { client } = context;
  const [settings, accounts, periods, mappings, paymentAccounts, branches, expenses, journals, ledger, trial, balances, reconciliations, bankLines, suggestions] = await Promise.all([
    client.from("accounting_settings").select("*").maybeSingle(),
    client.from("gl_accounts").select("*").order("account_code"),
    client.from("accounting_periods").select("*").order("start_date", { ascending: false }),
    client.from("account_mappings").select("*,gl_accounts(account_code,name),payment_accounts(account_code,name)").order("mapping_key"),
    client.from("payment_accounts").select("id,account_code,name,account_type,currency,branch_id,status").eq("status", "ACTIVE").order("name"),
    client.from("branches").select("id,name").eq("status", "active").order("name"),
    client.from("expenses").select("*,branches(name),gl_accounts(account_code,name)").order("expense_date", { ascending: false }).limit(100),
    client.from("journal_entries").select("*").order("journal_date", { ascending: false }).limit(100),
    client.from("general_ledger").select("*").order("journal_date", { ascending: false }).limit(250),
    client.from("trial_balance").select("*").order("account_code"),
    client.from("financial_statement_balances").select("*").order("account_code"),
    client.from("finance_reconciliation").select("*"),
    client.from("bank_statement_lines").select("*,payment_accounts(name)").order("transaction_date", { ascending: false }).limit(100),
    client.from("bank_match_suggestions").select("*").order("date_distance").limit(100),
  ]);
  return { ...context, settings: settings.data, accounts: accounts.data ?? [], periods: periods.data ?? [], mappings: mappings.data ?? [], paymentAccounts: paymentAccounts.data ?? [], branches: branches.data ?? [], expenses: expenses.data ?? [], journals: journals.data ?? [], ledger: ledger.data ?? [], trial: trial.data ?? [], balances: balances.data ?? [], reconciliations: reconciliations.data ?? [], bankLines: bankLines.data ?? [], suggestions: suggestions.data ?? [] };
}
