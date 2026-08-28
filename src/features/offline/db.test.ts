import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { offlineDb, pendingForOrganization } from "./db";
import { persistOfflineSale } from "./queue";

const saleInput = (organizationId: string) => ({
  scopeKey: `${organizationId}:branch:terminal`,
  organizationId,
  branchId: "branch",
  terminalId: "terminal",
  cashierUserId: "cashier",
  sessionId: "session",
  deviceId: "device",
  payload: {
    organizationId,
    branchId: "branch",
    terminalId: "terminal",
    sessionId: "session",
    customerId: "customer",
    lines: [{ product_variant_id: "variant", packaging_id: "pack", quantity: 1, unit_price: 5, discount: 0, tax: 0 }],
    settlements: [{ source_type: "PAYMENT" as const, payment_method_id: "cash", amount: 5, tendered_amount: 5 }],
    customerCreditAmount: 0,
    cashTendered: 5,
    notes: "Offline POS checkout",
  },
});

afterEach(async () => {
  const db = offlineDb();
  db.close();
  await db.delete();
});

describe("Dexie offline durability", () => {
  it("creates the versioned stores without deleting queue data", async () => {
    const db = offlineDb();
    await db.open();
    expect(db.verno).toBe(3);
    expect(db.tables.map((table) => table.name)).toContain("sync_queue");
    expect(db.tables.map((table) => table.name)).toContain("conflict_records");
  });

  it("commits the immutable transaction and queue item atomically", async () => {
    const saved = await persistOfflineSale(saleInput("org-a"));
    const db = offlineDb();
    const transaction = await db.offline_transactions.get(saved.localTransactionId);
    const queued = await db.sync_queue.where("localTransactionId").equals(saved.localTransactionId).first();
    expect(transaction?.requestHash).toMatch(/^[a-f0-9]{64}$/);
    expect(queued?.idempotencyKey).toBe(transaction?.idempotencyKey);
    expect(queued?.payload).toEqual(transaction?.payload);
  });

  it("keeps organization queues isolated", async () => {
    await persistOfflineSale(saleInput("org-a"));
    await persistOfflineSale(saleInput("org-b"));
    expect(await pendingForOrganization("org-a")).toBe(1);
    expect(await pendingForOrganization("org-b")).toBe(1);
  });

  it("preserves pending queue rows across the version 1 to version 3 upgrade", async () => {
    const legacy = new Dexie("inventman-offline");
    legacy.version(1).stores({
      app_meta: "&key,updatedAt",
      offline_transactions:
        "&localTransactionId,scopeKey,organizationId,branchId,terminalId,status,localCreatedAt",
      sync_queue:
        "&queueId,scopeKey,organizationId,branchId,localTransactionId,status,nextRetryAt,createdAt",
    });
    await legacy.open();
    await legacy.table("sync_queue").add({
      queueId: "legacy-queue",
      scopeKey: "org-a:branch:terminal",
      organizationId: "org-a",
      branchId: "branch",
      localTransactionId: "legacy-sale",
      status: "PENDING",
      createdAt: "2026-08-27T10:00:00.000Z",
    });
    legacy.close();

    const upgraded = offlineDb();
    await upgraded.open();
    expect(upgraded.verno).toBe(3);
    expect((await upgraded.sync_queue.get("legacy-queue"))?.status).toBe(
      "PENDING",
    );
  });

  it("persists held carts without creating a sale or queue record", async () => {
    const db = offlineDb();
    await db.open();
    await db.held_carts.put({
      cacheKey: "org-a:branch:terminal:held:one",
      scopeKey: "org-a:branch:terminal",
      organizationId: "org-a",
      branchId: "branch",
      terminalId: "terminal",
      payload: { status: "HELD", cart: [{ quantity: 2 }] },
      syncedAt: "2026-08-27T10:00:00.000Z",
    });
    db.close();
    await db.open();
    expect(await db.held_carts.count()).toBe(1);
    expect(await db.offline_transactions.count()).toBe(0);
    expect(await db.sync_queue.count()).toBe(0);
  });
});
