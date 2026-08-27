const messages: Record<string, string> = {
  PAYMENT_AMOUNT_INVALID: "Enter a payment amount greater than zero.",
  PAYMENT_ACCOUNT_INACTIVE: "Choose an active settlement account.",
  PAYMENT_METHOD_INACTIVE: "Choose an active payment method available to this branch.",
  PAYMENT_CURRENCY_MISMATCH: "Payment, account, and invoice currencies must match.",
  PAYMENT_REFERENCE_REQUIRED: "This payment method requires an external reference.",
  PAYMENT_ALLOCATION_EXCEEDS_PAYMENT: "Allocations exceed the available payment amount.",
  PAYMENT_ALLOCATION_EXCEEDS_INVOICE: "An allocation exceeds the invoice outstanding amount.",
  INVOICE_ALREADY_SETTLED: "The selected invoice is already settled or unavailable.",
  DUPLICATE_PAYMENT_REFERENCE: "A payment with this reference and amount already exists.",
  REFUND_EXCEEDS_AVAILABLE_CREDIT: "The refund exceeds the available unapplied credit.",
  PAYMENT_ALREADY_REVERSED: "This payment has already been reversed.",
  PAYMENT_REFUND_EXISTS: "A refunded payment cannot be reversed.",
  APPROVAL_REQUIRED: "This refund requires approval before posting.",
  UNAUTHORIZED_BRANCH: "You cannot use this branch or settlement account.",
  IDEMPOTENCY_CONFLICT: "This request key was already used for different payment data.",
  CROSS_TENANT_REFERENCE: "A selected record is not available in this organization.",
  PERMISSION_DENIED: "You do not have permission to perform this payment action.",
};

export function paymentError(value: string) {
  const code = Object.keys(messages).find((item) => value.includes(item));
  return code ? messages[code] : "The settlement operation could not be completed.";
}
