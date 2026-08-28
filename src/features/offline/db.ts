"use client";

import Dexie, { type EntityTable } from "dexie";
import type {
  OfflineSearchItem,
  OfflineTransaction,
  SyncQueueItem,
} from "./types";

export type MetaRecord = { key: string; value: unknown; updatedAt: string };
export type ScopedCache = {
  cacheKey: string;
  scopeKey: string;
  organizationId: string;
  branchId?: string;
  terminalId?: string;
  payload: Record<string, unknown>;
  syncedAt: string;
};
export type SyncResult = {
  id: string;
  scopeKey: string;
  localTransactionId: string;
  status: string;
  result?: Record<string, unknown>;
  createdAt: string;
};
export type ConflictRecord = {
  id: string;
  scopeKey: string;
  localTransactionId: string;
  code: string;
  message: string;
  status: "OPEN" | "CANCELLED" | "RESOLVED";
  createdAt: string;
  resolvedAt?: string;
};

export class InventmanOfflineDatabase extends Dexie {
  app_meta!: EntityTable<MetaRecord, "key">;
  organizations_cache!: EntityTable<ScopedCache, "cacheKey">;
  branches_cache!: EntityTable<ScopedCache, "cacheKey">;
  terminals_cache!: EntityTable<ScopedCache, "cacheKey">;
  products_cache!: EntityTable<OfflineSearchItem, "cacheKey">;
  variants_cache!: EntityTable<ScopedCache, "cacheKey">;
  barcodes_cache!: EntityTable<ScopedCache, "cacheKey">;
  price_cache!: EntityTable<ScopedCache, "cacheKey">;
  customers_cache!: EntityTable<ScopedCache, "cacheKey">;
  inventory_snapshot_cache!: EntityTable<ScopedCache, "cacheKey">;
  authorization_cache!: EntityTable<ScopedCache, "cacheKey">;
  active_session_cache!: EntityTable<ScopedCache, "cacheKey">;
  held_carts!: EntityTable<ScopedCache, "cacheKey">;
  offline_transactions!: EntityTable<OfflineTransaction, "localTransactionId">;
  sync_queue!: EntityTable<SyncQueueItem, "queueId">;
  sync_results!: EntityTable<SyncResult, "id">;
  conflict_records!: EntityTable<ConflictRecord, "id">;

  constructor() {
    super("inventman-offline");
    const versionOne = {
      app_meta: "&key,updatedAt",
      organizations_cache: "&cacheKey,scopeKey,organizationId,syncedAt",
      branches_cache: "&cacheKey,scopeKey,organizationId,branchId,syncedAt",
      terminals_cache:
        "&cacheKey,scopeKey,organizationId,branchId,terminalId,syncedAt",
      products_cache:
        "&cacheKey,scopeKey,organizationId,branchId,variantId,packagingId,sku,barcode,syncedAt",
      variants_cache: "&cacheKey,scopeKey,organizationId,syncedAt",
      barcodes_cache: "&cacheKey,scopeKey,organizationId,syncedAt",
      price_cache: "&cacheKey,scopeKey,organizationId,branchId,syncedAt",
      customers_cache: "&cacheKey,scopeKey,organizationId,syncedAt",
      inventory_snapshot_cache:
        "&cacheKey,scopeKey,organizationId,branchId,syncedAt",
      active_session_cache:
        "&cacheKey,scopeKey,organizationId,branchId,terminalId,syncedAt",
      held_carts: "&cacheKey,scopeKey,organizationId,branchId,syncedAt",
      offline_transactions:
        "&localTransactionId,scopeKey,organizationId,branchId,terminalId,status,localCreatedAt",
      sync_queue:
        "&queueId,scopeKey,organizationId,branchId,localTransactionId,status,nextRetryAt,createdAt",
      sync_results: "&id,scopeKey,localTransactionId,status,createdAt",
      conflict_records:
        "&id,scopeKey,localTransactionId,status,code,createdAt",
    };
    this.version(1).stores(versionOne);
    // Version 2 only adds the authorization snapshot store. Existing queues are
    // deliberately untouched so an application update cannot discard sales.
    this.version(2).stores({
      ...versionOne,
      authorization_cache:
        "&cacheKey,scopeKey,organizationId,branchId,terminalId,syncedAt",
    });
    // This additive version preserves all financial queue/history stores.
    this.version(3).stores({
      ...versionOne,
      authorization_cache:
        "&cacheKey,scopeKey,organizationId,branchId,terminalId,syncedAt",
    });
  }
}

let instance: InventmanOfflineDatabase | undefined;
export function offlineDb() {
  instance ??= new InventmanOfflineDatabase();
  return instance;
}

export function offlineScope(
  organizationId: string,
  branchId: string,
  terminalId: string,
) {
  return `${organizationId}:${branchId}:${terminalId}`;
}

export async function deviceIdentifier() {
  const db = offlineDb();
  const current = await db.app_meta.get("device_identifier");
  if (typeof current?.value === "string") return current.value;
  const value = crypto.randomUUID();
  await db.app_meta.put({
    key: "device_identifier",
    value,
    updatedAt: new Date().toISOString(),
  });
  return value;
}

export async function pendingForOrganization(organizationId: string) {
  return offlineDb().sync_queue.where("organizationId").equals(organizationId).filter(
    (item) => !["SYNCED", "CANCELLED"].includes(item.status),
  ).count();
}
