import type {
  OfflineReadiness,
  QueueStatus,
  SyncQueueItem,
} from "./types";

const conflictCodes = new Set([
  "INSUFFICIENT_STOCK",
  "SYNC_INSUFFICIENT_STOCK",
  "PRICE_POLICY_CONFLICT",
  "SYNC_PRICE_CONFLICT",
  "PRODUCT_INACTIVE",
  "CUSTOMER_BLOCKED",
  "CREDIT_LIMIT_EXCEEDED",
  "SYNC_TERMINAL_REVOKED",
  "SYNC_SESSION_INVALID",
  "SYNC_USER_SUSPENDED",
  "SYNC_BRANCH_ACCESS_REVOKED",
  "PAYMENT_METHOD_INACTIVE",
  "SYNC_PAYMENT_CONFLICT",
  "AUTH_REQUIRED",
  "SYNC_AUTH_REQUIRED",
]);

const permanentCodes = new Set([
  "PERMISSION_DENIED",
  "CROSS_TENANT_REFERENCE",
  "OFFLINE_PAYMENT_METHOD_NOT_ALLOWED",
  "OFFLINE_CREDIT_NOT_ALLOWED",
  "SYNC_IDEMPOTENCY_CONFLICT",
  "SYNC_PERMANENT_FAILURE",
]);

export function nextQueueStatus(
  current: QueueStatus,
  event: "START" | "SUCCESS" | "RETRY" | "CONFLICT" | "FAIL" | "CANCEL",
): QueueStatus {
  if (["SYNCED", "CANCELLED"].includes(current)) return current;
  const transitions: Record<typeof event, QueueStatus> = {
    START: "SYNCING",
    SUCCESS: "SYNCED",
    RETRY: "RETRYABLE_ERROR",
    CONFLICT: "CONFLICT",
    FAIL: "FAILED_PERMANENT",
    CANCEL: "CANCELLED",
  };
  return transitions[event];
}

export function retryDelayMs(retryCount: number) {
  return Math.min(5 * 60_000, 2 ** Math.max(0, retryCount) * 2_000);
}

export function classifySyncError(code: string, status?: number): QueueStatus {
  if (conflictCodes.has(code)) return "CONFLICT";
  if (permanentCodes.has(code)) return "FAILED_PERMANENT";
  if (!status || status === 408 || status === 429 || status >= 500)
    return "RETRYABLE_ERROR";
  return "CONFLICT";
}

export function provisionalAvailable(
  lastKnownServerAvailable: number,
  queuedBaseQuantity: number,
) {
  return Math.max(0, lastKnownServerAvailable - queuedBaseQuantity);
}

export function isPriceStale(
  syncedAt: string,
  maxAgeHours: number,
  now = Date.now(),
) {
  return now - new Date(syncedAt).getTime() > maxAgeHours * 3_600_000;
}

export function cacheReadiness(input: {
  storageAvailable: boolean;
  productCount: number;
  hasTerminal: boolean;
  hasSession: boolean;
  authorizationCapturedAt?: string;
  entitlementLeaseExpiresAt?: string;
  lastSyncedAt?: string;
  maxAgeHours: number;
  now?: number;
}): OfflineReadiness {
  const reasons: string[] = [];
  if (!input.storageAvailable) reasons.push("Offline storage is unavailable");
  if (!input.productCount) reasons.push("Product and price cache is empty");
  if (!input.hasTerminal) reasons.push("No active terminal is cached");
  if (!input.hasSession) reasons.push("No active cashier session is cached");
  if (!input.authorizationCapturedAt)
    reasons.push("Authorization snapshot is missing");
  if (!input.entitlementLeaseExpiresAt || new Date(input.entitlementLeaseExpiresAt).getTime() < (input.now ?? Date.now()))
    reasons.push("Offline entitlement lease has expired");
  if (
    !input.lastSyncedAt ||
    isPriceStale(
      input.lastSyncedAt,
      input.maxAgeHours,
      input.now ?? Date.now(),
    )
  )
    reasons.push("Offline cache is stale");
  return { ready: reasons.length === 0, reasons, lastSyncedAt: input.lastSyncedAt };
}

export function orderQueue(items: SyncQueueItem[]) {
  const complete = new Set(
    items.filter((item) => item.status === "SYNCED").map((item) => item.queueId),
  );
  return [...items]
    .filter(
      (item) =>
        ["PENDING", "RETRYABLE_ERROR"].includes(item.status) &&
        item.dependencyIds.every((id) => complete.has(id)),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function friendlyOfflineError(code?: string) {
  const messages: Record<string, string> = {
    OFFLINE_CACHE_NOT_READY: "This device is not ready for offline sales.",
    OFFLINE_STORAGE_UNAVAILABLE: "Offline storage is unavailable in this browser.",
    OFFLINE_QUEUE_WRITE_FAILED: "The sale could not be saved safely on this device.",
    OFFLINE_CREDIT_NOT_ALLOWED: "Customer credit is online-only for this organization.",
    OFFLINE_PAYMENT_METHOD_NOT_ALLOWED: "This payment method cannot be recorded offline.",
    SYNC_AUTH_REQUIRED: "Sign in again before syncing.",
    SYNC_SESSION_INVALID: "The original cashier session is no longer open.",
    SYNC_TERMINAL_REVOKED: "This terminal or device has been revoked.",
    SYNC_BRANCH_ACCESS_REVOKED: "Branch access changed while the device was offline.",
    SYNC_USER_SUSPENDED: "This cashier is suspended. Manager review is required.",
    SYNC_INSUFFICIENT_STOCK: "Server stock is insufficient for this offline sale.",
    SYNC_PRICE_CONFLICT: "The saved price requires manager review.",
    PAYMENT_METHOD_INACTIVE: "A saved payment method is no longer active.",
    SYNC_IDEMPOTENCY_CONFLICT: "The local reference was reused with different sale data.",
  };
  return messages[code ?? ""] ?? "The transaction needs review before it can sync.";
}

export function reconcileReceipt(
  localReference: string,
  serverResult?: Record<string, unknown>,
) {
  return {
    localReference,
    serverSaleId:
      typeof serverResult?.pos_sale_id === "string"
        ? serverResult.pos_sale_id
        : undefined,
    serverReceiptNumber:
      typeof serverResult?.receipt_number === "string"
        ? serverResult.receipt_number
        : undefined,
  };
}
