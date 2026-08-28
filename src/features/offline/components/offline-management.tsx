"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { offlineDb } from "../db";
import { friendlyOfflineError } from "../logic";
import { cancelQueuedTransaction, processSyncQueue } from "../sync";
import type { OfflineTransaction, SyncQueueItem } from "../types";

export function OfflineManagement({ organizationId }: { organizationId: string }) {
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);
  const [transactions, setTransactions] = useState<OfflineTransaction[]>([]);
  const [storageError, setStorageError] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const db = offlineDb();
      await db.open();
      const [items, sales] = await Promise.all([
        db.sync_queue.where("organizationId").equals(organizationId).toArray(),
        db.offline_transactions
          .where("organizationId")
          .equals(organizationId)
          .toArray(),
      ]);
      setQueue(items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setTransactions(sales);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [organizationId]);
  useEffect(() => {
    queueMicrotask(() => void refresh());
    const update = () => void refresh();
    window.addEventListener("inventman:queue-updated", update);
    window.addEventListener("inventman:offline-sync", update);
    return () => {
      window.removeEventListener("inventman:queue-updated", update);
      window.removeEventListener("inventman:offline-sync", update);
    };
  }, [refresh]);
  const totals = useMemo(
    () => ({
      pending: queue.filter((item) => ["PENDING", "RETRYABLE_ERROR", "SYNCING"].includes(item.status)).length,
      conflicts: queue.filter((item) => item.status === "CONFLICT").length,
      failed: queue.filter((item) => item.status === "FAILED_PERMANENT").length,
      synced: queue.filter((item) => item.status === "SYNCED").length,
    }),
    [queue],
  );
  if (storageError)
    return <p className="rounded-xl bg-danger-soft p-4" role="alert">Offline storage unavailable. Offline checkout is disabled.</p>;
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {Object.entries(totals).map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-surface p-4">
            <p className="text-xs uppercase text-subtle">{label}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        onClick={() => void processSyncQueue().then(refresh)}
      >
        Sync now
      </button>
      <div className="space-y-3">
        {queue.map((item) => {
          const sale = transactions.find((record) => record.localTransactionId === item.localTransactionId);
          const amount = sale?.payload.lines.reduce(
            (sum, line) => sum + line.quantity * line.unit_price - line.discount + line.tax,
            0,
          );
          return (
            <article key={item.queueId} className="rounded-xl border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold">{sale?.localReceiptNumber ?? item.localTransactionId}</p>
                  <p className="text-xs text-subtle">{new Date(item.createdAt).toLocaleString()} · {item.status}</p>
                </div>
                <strong>{amount === undefined ? "" : amount.toFixed(2)}</strong>
              </div>
              {item.errorCode ? (
                <p className="mt-3 rounded-lg bg-warning-soft p-3 text-sm">
                  {friendlyOfflineError(item.errorCode)} ({item.errorCode})
                </p>
              ) : null}
              <p className="mt-2 text-xs text-subtle">
                {sale?.payload.lines.map((line) => `${line.quantity} × ${line.product_variant_id}`).join(", ")}
              </p>
              {!["SYNCED", "CANCELLED"].includes(item.status) ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-2 text-xs font-semibold"
                    onClick={async () => {
                      await offlineDb().sync_queue.update(item.queueId, {
                        status: "PENDING",
                        nextRetryAt: undefined,
                        updatedAt: new Date().toISOString(),
                      });
                      await processSyncQueue(item.scopeKey);
                      await refresh();
                    }}
                  >Retry</button>
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-2 text-xs font-semibold text-danger"
                    onClick={() => void cancelQueuedTransaction(item.queueId).then(refresh)}
                  >Cancel local transaction</button>
                </div>
              ) : null}
            </article>
          );
        })}
        {!queue.length ? <p className="rounded-xl border border-dashed p-6 text-center text-subtle">No offline transactions on this device.</p> : null}
      </div>
    </section>
  );
}
