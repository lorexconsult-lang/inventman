const messages: Record<string, string> = {
  POS_SESSION_REQUIRED: "Open a till session before starting a sale.",
  POS_SESSION_ALREADY_OPEN: "This terminal already has an open session.",
  POS_SESSION_CLOSED: "This till session is closed.",
  UNAUTHORIZED_TERMINAL: "You cannot use this terminal or branch.",
  PAYMENT_TOTAL_MISMATCH:
    "The payment and credit total must equal the sale total.",
  WALK_IN_CREDIT_NOT_ALLOWED:
    "Select a named customer before placing a sale on credit.",
  POS_CUSTOMER_REQUIRED: "Select a customer to continue.",
  DISCOUNT_APPROVAL_REQUIRED: "You are not permitted to apply this discount.",
  INSUFFICIENT_STOCK:
    "There is not enough available stock to complete this sale.",
  CASH_VARIANCE_REASON_REQUIRED: "Enter a reason for the cash variance.",
  IDEMPOTENCY_CONFLICT:
    "This checkout request was already used with different details.",
  CROSS_TENANT_REFERENCE:
    "One of the selected records is not available in this workspace.",
  PERMISSION_DENIED: "You do not have permission to perform this action.",
};
export function posError(message: string) {
  return (
    Object.entries(messages).find(([code]) => message.includes(code))?.[1] ??
    "The POS action could not be completed."
  );
}
