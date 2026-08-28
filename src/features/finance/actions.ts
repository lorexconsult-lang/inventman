"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrganizationPermission } from "@/features/organizations/context";
import { mapBankCsv } from "./csv";
import { financeError } from "./errors";

const uuid = z.string().uuid();
const money = z.coerce.number().nonnegative();
const text = z.string().trim().max(1000);
const done = (path: string, key: string): never => {
  revalidatePath("/dashboard/finance", "layout");
  redirect(`${path}?${key}=1`);
};
const fail = (path: string, message: string): never =>
  redirect(`${path}?error=${encodeURIComponent(financeError(message))}`);

export async function initializeAccounting(form: FormData) {
  const path = "/dashboard/finance/settings";
  const parsed = z
    .object({
      currency: z.string().regex(/^[A-Z]{3}$/),
      fiscalMonth: z.coerce.number().int().min(1).max(12),
      activationDate: z.string().date(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(path, parsed.error.message);
  const { client, organization } = await requireOrganizationPermission(
    "finance.settings.manage",
  );
  const { error } = await client.rpc("initialize_accounting", {
    target_organization_id: organization.id,
    target_base_currency: parsed.data.currency,
    target_fiscal_month: parsed.data.fiscalMonth,
    target_activation_date: parsed.data.activationDate,
  });
  if (error) fail(path, error.message);
  done(path, "initialized");
}
export async function mapPaymentAccount(form: FormData) {
  const path = "/dashboard/finance/settings";
  const parsed = z
    .object({ paymentAccountId: uuid, glAccountId: uuid })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(path, parsed.error.message);
  const { client, organization } = await requireOrganizationPermission(
    "finance.settings.manage",
  );
  const { error } = await client.rpc("map_payment_account", {
    target_organization_id: organization.id,
    target_payment_account_id: parsed.data.paymentAccountId,
    target_gl_account_id: parsed.data.glAccountId,
  });
  if (error) fail(path, error.message);
  done(path, "mapped");
}
export async function activateAccounting() {
  const path = "/dashboard/finance/settings";
  const { client, organization } = await requireOrganizationPermission(
    "finance.settings.manage",
  );
  const { error } = await client.rpc("activate_accounting", {
    target_organization_id: organization.id,
  });
  if (error) fail(path, error.message);
  done(path, "active");
}
export async function createAccount(form: FormData) {
  const path = "/dashboard/finance/accounts";
  const parsed = z
    .object({
      code: z.string().trim().min(1).max(30),
      name: z.string().trim().min(2),
      type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
      parentId: z.string(),
      currency: z.string(),
      description: text,
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(path, parsed.error.message);
  const { client, organization } = await requireOrganizationPermission(
    "finance.accounts.manage",
  );
  const { error } = await client.rpc("create_gl_account", {
    target_organization_id: organization.id,
    target_code: parsed.data.code,
    target_name: parsed.data.name,
    target_type: parsed.data.type,
    target_parent_id: parsed.data.parentId || (null as never),
    target_currency: parsed.data.currency,
    target_description: parsed.data.description,
  });
  if (error) fail(path, error.message);
  done(path, "created");
}
export async function createManualJournal(form: FormData) {
  const path = "/dashboard/finance/journals";
  const parsed = z
    .object({
      date: z.string().date(),
      description: z.string().trim().min(3),
      debitAccount: uuid,
      creditAccount: uuid,
      amount: z.coerce.number().positive(),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(path, parsed.error.message);
  const { client, organization } = await requireOrganizationPermission(
    "finance.journal.post",
  );
  const lines = [
    {
      account_id: parsed.data.debitAccount,
      debit: parsed.data.amount,
      description: parsed.data.description,
    },
    {
      account_id: parsed.data.creditAccount,
      credit: parsed.data.amount,
      description: parsed.data.description,
    },
  ];
  const { error } = await client.rpc("create_manual_journal", {
    target_organization_id: organization.id,
    target_date: parsed.data.date,
    target_description: parsed.data.description,
    target_lines: lines,
  });
  if (error) fail(path, error.message);
  done(path, "posted");
}
export async function reverseJournal(journalId: string, form: FormData) {
  const path = "/dashboard/finance/journals";
  const parsed = z
    .object({ date: z.string().date(), reason: z.string().trim().min(3) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(path, parsed.error.message);
  const { client, organization } = await requireOrganizationPermission(
    "finance.journal.reverse",
  );
  const { error } = await client.rpc("reverse_journal", {
    target_organization_id: organization.id,
    target_journal_id: journalId,
    target_date: parsed.data.date,
    target_reason: parsed.data.reason,
  });
  if (error) fail(path, error.message);
  done(path, "reversed");
}
export async function createExpense(form: FormData) {
  const path = "/dashboard/finance/expenses";
  const parsed = z
    .object({
      branchId: uuid,
      date: z.string().date(),
      payee: z.string().trim().min(2),
      expenseAccountId: uuid,
      amount: z.coerce.number().positive(),
      tax: money,
      currency: z.string().regex(/^[A-Z]{3}$/),
      paymentAccountId: z.string(),
      terms: z.enum(["PAID", "CREDIT"]),
      reference: text,
      description: z.string().trim().min(3),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(path, parsed.error.message);
  const { client, organization } = await requireOrganizationPermission(
    "finance.expense.create",
  );
  const { error } = await client.rpc("create_expense", {
    target_organization_id: organization.id,
    target_branch_id: parsed.data.branchId,
    target_date: parsed.data.date,
    target_payee: parsed.data.payee,
    target_expense_account_id: parsed.data.expenseAccountId,
    target_amount: parsed.data.amount,
    target_tax: parsed.data.tax,
    target_currency: parsed.data.currency,
    target_payment_account_id: parsed.data.paymentAccountId || (null as never),
    target_payment_terms: parsed.data.terms,
    target_reference: parsed.data.reference,
    target_description: parsed.data.description,
  });
  if (error) fail(path, error.message);
  done(path, "created");
}
export async function submitExpense(id: string) {
  const path = "/dashboard/finance/expenses";
  const { client, organization } = await requireOrganizationPermission(
    "finance.expense.create",
  );
  const { error } = await client.rpc("submit_expense", {
    target_organization_id: organization.id,
    target_expense_id: id,
  });
  if (error) fail(path, error.message);
  done(path, "submitted");
}
export async function approveExpense(id: string, approve: boolean) {
  const path = "/dashboard/finance/expenses";
  const { client, organization } = await requireOrganizationPermission(
    "finance.expense.approve",
  );
  const { error } = await client.rpc("approve_expense", {
    target_organization_id: organization.id,
    target_expense_id: id,
    target_approve: approve,
    target_comments: "Finance review",
  });
  if (error) fail(path, error.message);
  done(path, approve ? "approved" : "rejected");
}
export async function postExpense(id: string) {
  const path = "/dashboard/finance/expenses";
  const { client, organization } = await requireOrganizationPermission(
    "finance.expense.post",
  );
  const { error } = await client.rpc("post_expense", {
    target_organization_id: organization.id,
    target_expense_id: id,
  });
  if (error) fail(path, error.message);
  done(path, "posted");
}
export async function postTransfer(form: FormData) {
  const path = "/dashboard/finance/cash-bank";
  const parsed = z
    .object({
      branchId: z.string(),
      date: z.string().date(),
      sourceId: uuid,
      destinationId: uuid,
      amount: z.coerce.number().positive(),
      currency: z.string().regex(/^[A-Z]{3}$/),
      fee: money,
      reference: text,
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(path, parsed.error.message);
  const { client, organization } = await requireOrganizationPermission(
    "finance.bank.transfer",
  );
  const { error } = await client.rpc("post_bank_transfer", {
    target_organization_id: organization.id,
    target_branch_id: parsed.data.branchId || (null as never),
    target_date: parsed.data.date,
    target_source_account_id: parsed.data.sourceId,
    target_destination_account_id: parsed.data.destinationId,
    target_amount: parsed.data.amount,
    target_currency: parsed.data.currency,
    target_fee: parsed.data.fee,
    target_reference: parsed.data.reference,
  });
  if (error) fail(path, error.message);
  done(path, "posted");
}
export async function setPeriodStatus(periodId: string, form: FormData) {
  const path = "/dashboard/finance/periods";
  const status = z
    .enum(["OPEN", "SOFT_CLOSED", "CLOSED", "LOCKED"])
    .safeParse(form.get("status"));
  if (!status.success) return fail(path, status.error.message);
  const { client, organization } = await requireOrganizationPermission(
    "finance.period.manage",
  );
  const { error } = await client.rpc("set_accounting_period_status", {
    target_organization_id: organization.id,
    target_period_id: periodId,
    target_status: status.data,
  });
  if (error) fail(path, error.message);
  done(path, "updated");
}
export async function importBankStatement(form: FormData) {
  const path = "/dashboard/finance/reconciliation";
  const parsed = z
    .object({
      paymentAccountId: uuid,
      dateColumn: z.string().min(1),
      amountColumn: z.string().min(1),
      referenceColumn: z.string(),
      descriptionColumn: z.string().min(1),
    })
    .safeParse(Object.fromEntries(form));
  const file = form.get("file");
  if (!parsed.success || !(file instanceof File) || file.size === 0)
    return fail(path, "BANK_IMPORT_EMPTY");
  if (file.size > 2_000_000) fail(path, "BANK_IMPORT_ROW_INVALID");
  let rows: ReturnType<typeof mapBankCsv>;
  try {
    rows = mapBankCsv(await file.text(), {
      date: parsed.data.dateColumn,
      amount: parsed.data.amountColumn,
      reference: parsed.data.referenceColumn,
      description: parsed.data.descriptionColumn,
    });
  } catch {
    return fail(path, "BANK_IMPORT_ROW_INVALID");
  }
  const { client, organization } = await requireOrganizationPermission(
    "finance.bank.reconcile",
  );
  const mapping = {
    date: parsed.data.dateColumn,
    amount: parsed.data.amountColumn,
    reference: parsed.data.referenceColumn,
    description: parsed.data.descriptionColumn,
  };
  const { error } = await client.rpc("import_bank_statement", {
    target_organization_id: organization.id,
    target_payment_account_id: parsed.data.paymentAccountId,
    target_file_name: file.name,
    target_mapping: mapping,
    target_rows: rows,
  });
  if (error) fail(path, error.message);
  done(path, "imported");
}
export async function matchStatement(
  lineId: string,
  sourceType: string,
  sourceId: string,
) {
  const path = "/dashboard/finance/reconciliation";
  const { client, organization } = await requireOrganizationPermission(
    "finance.bank.reconcile",
  );
  const { error } = await client.rpc("match_bank_statement_line", {
    target_organization_id: organization.id,
    target_line_id: lineId,
    target_source_type: sourceType,
    target_source_id: sourceId,
    target_exclude: false,
  });
  if (error) fail(path, error.message);
  done(path, "matched");
}
