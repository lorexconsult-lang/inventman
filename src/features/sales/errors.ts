const messages: Record<string, string> = {
  CUSTOMER_INACTIVE:
    "This customer is inactive and cannot be used for this sale.",
  CUSTOMER_BLOCKED: "This customer is blocked from new Sales activity.",
  CUSTOMER_CREDIT_HOLD: "This customer is currently on credit hold.",
  CREDIT_LIMIT_EXCEEDED:
    "Customer credit limit would be exceeded by this order.",
  APPROVAL_REQUIRED: "Approval is required before this action can continue.",
  PRICE_BELOW_MINIMUM: "The selling price is below the permitted minimum.",
  PRICE_OVERRIDE_NOT_AUTHORIZED:
    "You are not authorized to override the resolved selling price.",
  DISCOUNT_OVERRIDE_NOT_AUTHORIZED:
    "You are not authorized to apply this discount.",
  CREDIT_MANAGEMENT_NOT_AUTHORIZED:
    "You are not authorized to change customer credit settings.",
  INVALID_QUOTATION_STATE:
    "This quotation is not in a valid state for that action.",
  INVALID_LINES: "Add at least one valid Sales line.",
  INVALID_ORDER_STATE:
    "This Sales Order is not in a valid state for that action.",
  INSUFFICIENT_AVAILABLE_STOCK:
    "There is not enough available stock to reserve this quantity.",
  BACKORDER_NOT_ALLOWED:
    "Backorders are disabled; the full order cannot currently be reserved.",
  FULFILMENT_EXCEEDS_OUTSTANDING:
    "The fulfilment quantity exceeds the remaining Sales Order quantity.",
  FULFILMENT_ALREADY_POSTED: "This fulfilment has already been posted.",
  RESERVATION_CONSUMPTION_FAILED:
    "The reserved quantity is no longer available for this fulfilment.",
  INVOICE_ALREADY_ISSUED: "This invoice has already been issued.",
  INVOICE_EXCEEDS_FULFILLED_VALUE:
    "The invoice exceeds the eligible fulfilled quantity.",
  RETURN_EXCEEDS_ELIGIBLE_QUANTITY:
    "The return exceeds the quantity still eligible for return.",
  RETURN_ALREADY_POSTED: "This return has already been posted.",
  INVALID_RETURN_DISPOSITION:
    "Choose a valid inspection disposition and destination.",
  CREDIT_NOTE_ALREADY_EXISTS: "A Credit Note already exists for this return.",
  IDEMPOTENCY_PAYLOAD_MISMATCH:
    "This request was already used with different information. Refresh and retry.",
  UNAUTHORIZED_BRANCH: "You do not have access to this branch.",
  CROSS_TENANT_REFERENCE:
    "One of the selected records is not available in this organization.",
  PERMISSION_DENIED: "You do not have permission to perform this action.",
};

export function salesError(message: string) {
  const code = Object.keys(messages).find((key) => message.includes(key));
  return code
    ? messages[code]
    : "The Sales operation could not be completed. Refresh and try again.";
}
