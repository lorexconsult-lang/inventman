import { describe, expect, it } from "vitest";
import {
  cacheReadiness,
  classifySyncError,
  isPriceStale,
  nextQueueStatus,
  orderQueue,
  provisionalAvailable,
  reconcileReceipt,
  retryDelayMs,
} from "./logic";
import type { SyncQueueItem } from "./types";

const item = (overrides: Partial<SyncQueueItem> = {}): SyncQueueItem => ({
  queueId: crypto.randomUUID(),
  scopeKey: "org:branch:terminal",
  organizationId: "org",
  branchId: "branch",
  deviceId: "device",
  operationType: "POS_SALE",
  localTransactionId: crypto.randomUUID(),
  idempotencyKey: crypto.randomUUID(),
  requestHash: "hash",
  dependencyIds: [],
  payload: {
    organizationId: "org",
    branchId: "branch",
    terminalId: "terminal",
    sessionId: "session",
    customerId: "customer",
    lines: [],
    settlements: [],
    customerCreditAmount: 0,
    cashTendered: 0,
    notes: "",
  },
  status: "PENDING",
  retryCount: 0,
  createdAt: "2026-08-27T10:00:00.000Z",
  updatedAt: "2026-08-27T10:00:00.000Z",
  ...overrides,
});

describe("offline queue rules", () => {
  it("uses an explicit immutable terminal state machine", () => {
    expect(nextQueueStatus("PENDING", "START")).toBe("SYNCING");
    expect(nextQueueStatus("SYNCING", "SUCCESS")).toBe("SYNCED");
    expect(nextQueueStatus("SYNCED", "RETRY")).toBe("SYNCED");
  });

  it("orders due work and waits for dependencies", () => {
    const complete = item({ queueId: "done", status: "SYNCED" });
    const first = item({ queueId: "first", createdAt: "2026-08-27T10:01:00.000Z" });
    const dependent = item({ queueId: "second", dependencyIds: ["done"], createdAt: "2026-08-27T10:02:00.000Z" });
    const blocked = item({ queueId: "blocked", dependencyIds: ["missing"] });
    expect(orderQueue([dependent, blocked, first, complete]).map((x) => x.queueId)).toEqual(["first", "second"]);
  });

  it("bounds exponential retry delay", () => {
    expect(retryDelayMs(0)).toBe(2_000);
    expect(retryDelayMs(20)).toBe(300_000);
  });

  it("classifies network failures, conflicts, and permanent failures", () => {
    expect(classifySyncError("SYNC_NETWORK_ERROR")).toBe("RETRYABLE_ERROR");
    expect(classifySyncError("SYNC_INSUFFICIENT_STOCK", 409)).toBe("CONFLICT");
    expect(classifySyncError("SYNC_IDEMPOTENCY_CONFLICT", 409)).toBe("FAILED_PERMANENT");
  });
});

describe("offline cache and reconciliation", () => {
  it("subtracts only device-local unsynced intent from the snapshot", () => {
    expect(provisionalAvailable(10, 3)).toBe(7);
    expect(provisionalAvailable(1, 2)).toBe(0);
  });

  it("detects stale prices", () => {
    expect(isPriceStale("2026-08-27T10:00:00.000Z", 2, Date.parse("2026-08-27T13:00:00.000Z"))).toBe(true);
  });

  it("requires storage, products, terminal, session, auth, and freshness", () => {
    expect(cacheReadiness({ storageAvailable: false, productCount: 0, hasTerminal: false, hasSession: false, maxAgeHours: 24 }).ready).toBe(false);
    expect(cacheReadiness({ storageAvailable: true, productCount: 2, hasTerminal: true, hasSession: true, authorizationCapturedAt: "2026-08-27T10:00:00.000Z", lastSyncedAt: "2026-08-27T10:00:00.000Z", maxAgeHours: 24, now: Date.parse("2026-08-27T11:00:00.000Z") }).ready).toBe(true);
  });

  it("maps local receipts to authoritative server references", () => {
    expect(reconcileReceipt("OFF-1", { pos_sale_id: "sale", receipt_number: "POS-1" })).toEqual({ localReference: "OFF-1", serverSaleId: "sale", serverReceiptNumber: "POS-1" });
  });
});
