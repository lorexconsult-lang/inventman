"use client";

import { deviceIdentifier, offlineDb, offlineScope } from "./db";
import { cacheReadiness, provisionalAvailable } from "./logic";
import type { OfflineSearchItem } from "./types";

export type OfflineBootstrap = {
  appVersion: string;
  organization: { id: string; name: string; currency: string };
  branch: { id: string; name: string };
  terminal: { id: string; name: string; status: string };
  session: { id: string; cashierUserId: string; openedAt: string };
  permissions: string[];
  settings: {
    offlineEnabled: boolean;
    maxAgeHours: number;
    pricePolicy: string;
    stockPolicy: string;
    creditAllowed: boolean;
    cardAllowed: boolean;
    transferAllowed: boolean;
  };
  customers: Array<Record<string, unknown> & { id: string }>;
  methods: Array<Record<string, unknown> & { id: string }>;
  accounts: Array<Record<string, unknown> & { id: string }>;
  products: Array<Omit<OfflineSearchItem, "cacheKey" | "scopeKey" | "syncedAt">>;
  syncedAt: string;
};

export async function cacheBootstrap(data: OfflineBootstrap) {
  const db = offlineDb();
  await db.open();
  const scopeKey = offlineScope(
    data.organization.id,
    data.branch.id,
    data.terminal.id,
  );
  const scoped = (key: string, payload: Record<string, unknown>) => ({
    cacheKey: `${scopeKey}:${key}`,
    scopeKey,
    organizationId: data.organization.id,
    branchId: data.branch.id,
    terminalId: data.terminal.id,
    payload,
    syncedAt: data.syncedAt,
  });
  await db.transaction(
    "rw",
    [
      db.organizations_cache,
      db.branches_cache,
      db.terminals_cache,
      db.products_cache,
      db.variants_cache,
      db.barcodes_cache,
      db.customers_cache,
      db.price_cache,
      db.inventory_snapshot_cache,
      db.authorization_cache,
      db.active_session_cache,
      db.app_meta,
    ],
    async () => {
      await db.organizations_cache.put(scoped("organization", data.organization));
      await db.branches_cache.put(scoped("branch", data.branch));
      await db.terminals_cache.put(scoped("terminal", data.terminal));
      await db.authorization_cache.put(
        scoped("authorization", {
          permissions: data.permissions,
          capturedAt: data.syncedAt,
        }),
      );
      await db.active_session_cache.put(scoped("session", data.session));
      await Promise.all([
        db.customers_cache.where("scopeKey").equals(scopeKey).delete(),
        db.price_cache.where("scopeKey").equals(scopeKey).delete(),
        db.variants_cache.where("scopeKey").equals(scopeKey).delete(),
        db.barcodes_cache.where("scopeKey").equals(scopeKey).delete(),
        db.inventory_snapshot_cache.where("scopeKey").equals(scopeKey).delete(),
        db.products_cache.where("scopeKey").equals(scopeKey).delete(),
      ]);
      await db.customers_cache.bulkPut(
        data.customers.map((item) => scoped(`customer:${item.id}`, item)),
      );
      await db.price_cache.bulkPut(
        data.methods.map((item) => scoped(`method:${item.id}`, item)),
      );
      await db.price_cache.bulkPut(
        data.accounts.map((item) => scoped(`account:${item.id}`, item)),
      );
      await db.products_cache.bulkPut(
        data.products.map((item) => ({
          ...item,
          cacheKey: `${scopeKey}:${item.variantId}:${item.packagingId}`,
          scopeKey,
          syncedAt: data.syncedAt,
        })),
      );
      await db.variants_cache.bulkPut(
        data.products.map((item) =>
          scoped(`variant:${item.variantId}:${item.packagingId}`, {
            variantId: item.variantId,
            packagingId: item.packagingId,
            label: item.label,
            packaging: item.packaging,
            sku: item.sku,
            conversion: item.conversion,
            taxRate: item.taxRate,
          }),
        ),
      );
      await db.barcodes_cache.bulkPut(
        data.products
          .filter((item) => item.barcode)
          .map((item) =>
            scoped(`barcode:${item.barcode}`, {
              barcode: item.barcode,
              variantId: item.variantId,
              packagingId: item.packagingId,
            }),
          ),
      );
      await db.price_cache.bulkPut(
        data.products.map((item) =>
          scoped(`price:${item.variantId}:${item.packagingId}`, {
            variantId: item.variantId,
            packagingId: item.packagingId,
            amount: item.price,
            currency: item.currency,
          }),
        ),
      );
      await db.inventory_snapshot_cache.bulkPut(
        data.products.map((item) =>
          scoped(`stock:${item.variantId}:${item.packagingId}`, {
            variantId: item.variantId,
            packagingId: item.packagingId,
            availableBase: item.availableBase,
          }),
        ),
      );
      await db.app_meta.put({
        key: `readiness:${scopeKey}`,
        value: { settings: data.settings, lastSyncedAt: data.syncedAt },
        updatedAt: data.syncedAt,
      });
    },
  );
  return { scopeKey, deviceIdentifier: await deviceIdentifier() };
}

export async function searchCachedProducts(scopeKey: string, text: string) {
  const query = text.trim().toLocaleLowerCase();
  if (query.length < 2) return [];
  const db = offlineDb();
  const products = await db.products_cache.where("scopeKey").equals(scopeKey).toArray();
  const queued = await db.offline_transactions
    .where("scopeKey")
    .equals(scopeKey)
    .filter((item) => !["SYNCED", "CANCELLED"].includes(item.status))
    .toArray();
  return products
    .filter((item) =>
      [item.label, item.sku, item.barcode, item.packaging]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(query)),
    )
    .slice(0, 20)
    .map((item) => {
      const localBase = queued.reduce(
        (sum, transaction) =>
          sum +
          transaction.payload.lines
            .filter(
              (line) =>
                line.product_variant_id === item.variantId &&
                line.packaging_id === item.packagingId,
            )
            .reduce(
              (lineSum, line) => lineSum + line.quantity * item.conversion,
              0,
            ),
        0,
      );
      return {
        ...item,
        availableBase: provisionalAvailable(item.availableBase, localBase),
      };
    });
}

export async function getOfflineReadiness(scopeKey: string) {
  const db = offlineDb();
  try {
    await db.open();
    const [meta, products, terminal, session, authorization] = await Promise.all([
      db.app_meta.get(`readiness:${scopeKey}`),
      db.products_cache.where("scopeKey").equals(scopeKey).count(),
      db.terminals_cache.where("scopeKey").equals(scopeKey).first(),
      db.active_session_cache.where("scopeKey").equals(scopeKey).first(),
      db.authorization_cache.where("scopeKey").equals(scopeKey).first(),
    ]);
    const value = (meta?.value ?? {}) as {
      lastSyncedAt?: string;
      settings?: { maxAgeHours?: number };
    };
    const authorizationPayload = (authorization?.payload ?? {}) as { entitlementLeaseExpiresAt?: string };
    return cacheReadiness({
      storageAvailable: true,
      productCount: products,
      hasTerminal: Boolean(terminal),
      hasSession: Boolean(session),
      authorizationCapturedAt: authorization?.syncedAt,
      entitlementLeaseExpiresAt: authorizationPayload.entitlementLeaseExpiresAt,
      lastSyncedAt: value.lastSyncedAt,
      maxAgeHours: value.settings?.maxAgeHours ?? 24,
    });
  } catch {
    return cacheReadiness({
      storageAvailable: false,
      productCount: 0,
      hasTerminal: false,
      hasSession: false,
      maxAgeHours: 24,
    });
  }
}

export async function resetOfflineData(scopeKey: string) {
  const db = offlineDb();
  const pending = await db.sync_queue
    .where("scopeKey")
    .equals(scopeKey)
    .filter((item) => !["SYNCED", "CANCELLED"].includes(item.status))
    .count();
  if (pending) throw new Error("OFFLINE_PENDING_QUEUE");
  await Promise.all([
    db.products_cache.where("scopeKey").equals(scopeKey).delete(),
    db.customers_cache.where("scopeKey").equals(scopeKey).delete(),
    db.price_cache.where("scopeKey").equals(scopeKey).delete(),
    db.inventory_snapshot_cache.where("scopeKey").equals(scopeKey).delete(),
    db.authorization_cache.where("scopeKey").equals(scopeKey).delete(),
    db.active_session_cache.where("scopeKey").equals(scopeKey).delete(),
  ]);
}
