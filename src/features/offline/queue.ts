"use client";

import { offlineDb } from "./db";
import type { OfflineSalePayload, OfflineTransaction } from "./types";

async function payloadHash(payload: OfflineSalePayload) {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function persistOfflineSale(input: {
  scopeKey: string;
  organizationId: string;
  branchId: string;
  terminalId: string;
  cashierUserId: string;
  sessionId: string;
  deviceId: string;
  payload: OfflineSalePayload;
}) {
  const db = offlineDb();
  if (!db.isOpen()) await db.open();
  const localTransactionId = crypto.randomUUID();
  const idempotencyKey = crypto.randomUUID();
  const requestHash = await payloadHash(input.payload);
  const localCreatedAt = new Date().toISOString();
  const localReceiptNumber = `OFF-${localCreatedAt.slice(0, 10).replaceAll("-", "")}-${localTransactionId.slice(0, 8).toUpperCase()}`;
  const transaction: OfflineTransaction = {
    localTransactionId,
    scopeKey: input.scopeKey,
    organizationId: input.organizationId,
    branchId: input.branchId,
    terminalId: input.terminalId,
    cashierUserId: input.cashierUserId,
    sessionId: input.sessionId,
    deviceId: input.deviceId,
    idempotencyKey,
    requestHash,
    payload: input.payload,
    localReceiptNumber,
    localCreatedAt,
    status: "PENDING",
  };
  await db.transaction("rw", db.offline_transactions, db.sync_queue, async () => {
    await db.offline_transactions.add(transaction);
    await db.sync_queue.add({
      queueId: crypto.randomUUID(),
      scopeKey: input.scopeKey,
      organizationId: input.organizationId,
      branchId: input.branchId,
      deviceId: input.deviceId,
      operationType: "POS_SALE",
      localTransactionId,
      idempotencyKey,
      requestHash,
      dependencyIds: [],
      payload: input.payload,
      status: "PENDING",
      retryCount: 0,
      createdAt: localCreatedAt,
      updatedAt: localCreatedAt,
    });
  });
  return transaction;
}
