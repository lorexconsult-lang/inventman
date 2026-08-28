const messages: Record<string, string> = {
  ACCOUNT_INACTIVE: "The selected account is inactive.", CONTROL_ACCOUNT_MANUAL_POST_BLOCKED: "Manual posting to that control account is blocked.",
  JOURNAL_UNBALANCED: "Journal debits and credits must balance.", PERIOD_CLOSED: "The accounting period is closed.",
  ACCOUNT_MAPPING_MISSING: "Complete the required account mappings first.", ACCOUNTING_NOT_ACTIVE: "Accounting is not active for this date.",
  DUPLICATE_ACCOUNTING_EVENT: "This accounting event has already been posted.", EXPENSE_APPROVAL_REQUIRED: "Approve the expense before posting.",
  BANK_MATCH_ALREADY_USED: "That statement line or source is already matched.", CROSS_TENANT_REFERENCE: "The selected record is not available in this organization.",
  UNAUTHORIZED_BRANCH: "You do not have access to that branch.", PERMISSION_DENIED: "You do not have permission for this action.",
};
export function financeError(message: string) { return Object.entries(messages).find(([code]) => message.includes(code))?.[1] ?? "The finance action could not be completed."; }
