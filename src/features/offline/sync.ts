"use client";

import { createClient } from "@/lib/supabase/client";
import { offlineDb } from "./db";
import {
  classifySyncError,
  friendlyOfflineError,
  orderQueue,
  retryDelayMs,
} from "./logic";
import type { NetworkState, SyncQueueItem } from "./types";

export const OFFLINE_SYNC_EVENT = "inventman:offline-sync";

function announce(state: NetworkState) {
  window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_EVENT, { detail: state }));
}

export async function verifyConnectivity() {
  if (!navigator.onLine) return false;
  try {
    const response = await fetch("/api/connectivity", {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function errorCode(message: string) {
  const known = message.match(/[A-Z][A-Z0-9_]{3,}/g);
  return known?.at(-1) ?? "SYNC_NETWORK_ERROR";
}

async function markFailure(item: SyncQueueItem, message: string) {
  const db = offlineDb();
  const code = errorCode(message);
  const status = classifySyncError(code);
  const retryCount = item.retryCount + 1;
  const now = new Date();
  await db.transaction("rw", db.sync_queue, db.offline_transactions, db.conflict_records, async () => {
    await db.sync_queue.update(item.queueId, {
      status,
      retryCount,
      lastAttemptAt: now.toISOString(),
      nextRetryAt:
        status === "RETRYABLE_ERROR"
          ? new Date(now.getTime() + retryDelayMs(retryCount)).toISOString()
          : undefined,
      errorCode: code,
      errorMessage: friendlyOfflineError(code),
      updatedAt: now.toISOString(),
    });
    await db.offline_transactions.update(item.localTransactionId, { status });
    if (status === "CONFLICT" || status === "FAILED_PERMANENT")
      await db.conflict_records.put({
        id: item.queueId,
        scopeKey: item.scopeKey,
        localTransactionId: item.localTransactionId,
        code,
        message: friendlyOfflineError(code),
        status: "OPEN",
        createdAt: now.toISOString(),
      });
  });
  if (status !== "RETRYABLE_ERROR") {
    const client = createClient();
    try {
      await client.rpc("record_offline_sync_failure" as never, {
        target_organization_id: item.organizationId,
        target_device_id: item.deviceId,
        target_local_transaction_id: item.localTransactionId,
        target_status: status,
        target_error_code: code,
      } as never);
    } catch {
      // Local conflict durability must not depend on observability telemetry.
    }
  }
  return status;
}

async function replay(item: SyncQueueItem) {
  const db = offlineDb();
  const staleBefore = new Date(Date.now() - 2 * 60_000).toISOString();
  const stale = await db.sync_queue
    .filter(
      (item) =>
        item.status === "SYNCING" &&
        (!item.lastAttemptAt || item.lastAttemptAt < staleBefore),
    )
    .toArray();
  await Promise.all(
    stale.map((item) =>
      db.sync_queue.update(item.queueId, {
        status: "PENDING",
        updatedAt: new Date().toISOString(),
      }),
    ),
  );
  const now = new Date().toISOString();
  await db.sync_queue.update(item.queueId, {
    status: "SYNCING",
    lastAttemptAt: now,
    updatedAt: now,
  });
  const transaction = await db.offline_transactions.get(
    item.localTransactionId,
  );
  if (!transaction) {
    await markFailure(item, "SYNC_PERMANENT_FAILURE");
    return;
  }
  const client = createClient();
  const { data, error } = await client.rpc("replay_offline_pos_sale" as never, {
    target_organization_id: item.organizationId,
    target_device_id: item.deviceId,
    target_local_transaction_id: item.localTransactionId,
    target_local_created_at: transaction.localCreatedAt,
    target_session_id: item.payload.sessionId,
    target_customer_id: item.payload.customerId,
    target_lines: item.payload.lines,
    target_settlements: item.payload.settlements,
    target_customer_credit_amount: item.payload.customerCreditAmount,
    target_cash_tendered: item.payload.cashTendered,
    target_notes: item.payload.notes,
    target_idempotency_key: item.idempotencyKey,
  } as never);
  if (error) {
    await markFailure(item, error.message);
    return;
  }
  const result = (data ?? {}) as Record<string, unknown>;
  await db.transaction(
    "rw",
    db.sync_queue,
    db.offline_transactions,
    db.sync_results,
    async () => {
      await db.sync_queue.update(item.queueId, {
        status: "SYNCED",
        serverResult: result,
        errorCode: undefined,
        errorMessage: undefined,
        updatedAt: new Date().toISOString(),
      });
      await db.offline_transactions.update(item.localTransactionId, {
        status: "SYNCED",
        serverSaleId:
          typeof result.pos_sale_id === "string" ? result.pos_sale_id : undefined,
        serverReceiptNumber:
          typeof result.receipt_number === "string"
            ? result.receipt_number
            : undefined,
        serverInventoryTransactionId:
          typeof result.inventory_transaction_id === "string"
            ? result.inventory_transaction_id
            : undefined,
      });
      await db.sync_results.add({
        id: crypto.randomUUID(),
        scopeKey: item.scopeKey,
        localTransactionId: item.localTransactionId,
        status: "SYNCED",
        result,
        createdAt: new Date().toISOString(),
      });
    },
  );
}

async function processUnlocked(scopeKey?: string) {
  if (!(await verifyConnectivity())) {
    announce("OFFLINE");
    return { synced: 0, conflicts: 0 };
  }
  announce("SYNCING");
  const db = offlineDb();
  const all = scopeKey
    ? await db.sync_queue.where("scopeKey").equals(scopeKey).toArray()
    : await db.sync_queue.toArray();
  const due = orderQueue(all).filter(
    (item) => !item.nextRetryAt || item.nextRetryAt <= new Date().toISOString(),
  );
  let synced = 0;
  for (const item of due) {
    await replay(item);
    const current = await db.sync_queue.get(item.queueId);
    if (current?.status === "SYNCED") synced += 1;
  }
  const conflicts = await db.sync_queue
    .filter((item) => item.status === "CONFLICT")
    .count();
  announce(conflicts ? "CONFLICTS_PRESENT" : "ONLINE");
  return { synced, conflicts };
}

export async function processSyncQueue(scopeKey?: string) {
  if ("locks" in navigator)
    return navigator.locks.request("inventman-offline-sync", { mode: "exclusive" }, () =>
      processUnlocked(scopeKey),
    );
  const db = offlineDb();
  const now = Date.now();
  const owner = crypto.randomUUID();
  const acquired = await db.transaction("rw", db.app_meta, async () => {
    const lock = await db.app_meta.get("sync_lock");
    if (
      typeof lock?.value === "object" &&
      lock.value &&
      "expiresAt" in lock.value &&
      Number(lock.value.expiresAt) > now
    )
      return false;
    await db.app_meta.put({
      key: "sync_lock",
      value: { owner, expiresAt: now + 60_000 },
      updatedAt: new Date().toISOString(),
    });
    return true;
  });
  if (!acquired)
    return { synced: 0, conflicts: 0 };
  try {
    return await processUnlocked(scopeKey);
  } finally {
    const lock = await db.app_meta.get("sync_lock");
    if (
      typeof lock?.value === "object" &&
      lock.value &&
      "owner" in lock.value &&
      lock.value.owner === owner
    )
      await db.app_meta.delete("sync_lock");
  }
}

export async function cancelQueuedTransaction(queueId: string) {
  const db = offlineDb();
  const item = await db.sync_queue.get(queueId);
  if (!item || item.status === "SYNCED") return false;
  await db.transaction("rw", db.sync_queue, db.offline_transactions, db.conflict_records, async () => {
    await db.sync_queue.update(queueId, {
      status: "CANCELLED",
      updatedAt: new Date().toISOString(),
    });
    await db.offline_transactions.update(item.localTransactionId, {
      status: "CANCELLED",
    });
    await db.conflict_records.update(queueId, {
      status: "CANCELLED",
      resolvedAt: new Date().toISOString(),
    });
  });
  return true;
}
