export type QueueStatus =
  | "PENDING"
  | "SYNCING"
  | "SYNCED"
  | "RETRYABLE_ERROR"
  | "CONFLICT"
  | "FAILED_PERMANENT"
  | "CANCELLED";

export type NetworkState =
  | "ONLINE"
  | "OFFLINE"
  | "SYNCING"
  | "SYNC_FAILED"
  | "CONFLICTS_PRESENT";

export type OfflineSearchItem = {
  cacheKey: string;
  scopeKey: string;
  organizationId: string;
  branchId: string;
  variantId: string;
  packagingId: string;
  label: string;
  packaging: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  availableBase: number;
  conversion: number;
  taxRate: number;
  currency: string;
  syncedAt: string;
};

export type OfflineSettlement = {
  source_type: "PAYMENT";
  payment_method_id: string;
  account_id?: string;
  amount: number;
  tendered_amount?: number;
  reference?: string;
};

export type OfflineSalePayload = {
  organizationId: string;
  branchId: string;
  terminalId: string;
  sessionId: string;
  customerId: string;
  lines: Array<{
    product_variant_id: string;
    packaging_id: string;
    quantity: number;
    unit_price: number;
    discount: number;
    tax: number;
  }>;
  settlements: OfflineSettlement[];
  customerCreditAmount: number;
  cashTendered: number;
  notes: string;
};

export type OfflineTransaction = {
  localTransactionId: string;
  scopeKey: string;
  organizationId: string;
  branchId: string;
  terminalId: string;
  cashierUserId: string;
  sessionId: string;
  deviceId: string;
  idempotencyKey: string;
  requestHash: string;
  payload: OfflineSalePayload;
  localReceiptNumber: string;
  localCreatedAt: string;
  status: QueueStatus;
  serverSaleId?: string;
  serverReceiptNumber?: string;
  serverInventoryTransactionId?: string;
  serverPaymentIds?: string[];
};

export type SyncQueueItem = {
  queueId: string;
  scopeKey: string;
  organizationId: string;
  branchId: string;
  deviceId: string;
  operationType: "POS_SALE";
  localTransactionId: string;
  idempotencyKey: string;
  requestHash: string;
  dependencyIds: string[];
  payload: OfflineSalePayload;
  status: QueueStatus;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  errorCode?: string;
  errorMessage?: string;
  serverResult?: Record<string, unknown>;
};

export type OfflineReadiness = {
  ready: boolean;
  reasons: string[];
  lastSyncedAt?: string;
};
