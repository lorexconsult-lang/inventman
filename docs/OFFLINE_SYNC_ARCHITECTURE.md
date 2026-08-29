# Offline Sync Architecture

## Authority boundary

Offline clients store business intent, never authoritative balances. PostgreSQL and the existing `post_pos_sale` RPC remain authoritative for Sales, inventory movements, WAC/FIFO, invoices, payments, receipts, cash events, customer credit, permissions, branch access, terminal state, and cashier sessions. `replay_offline_pos_sale` validates the device and current authorization, restricts offline tender types, then delegates atomically to that same checkout RPC.

## PWA and cache policy

The manifest starts at `/dashboard/pos` in standalone mode. The service worker precaches only the public offline fallback, manifest, and product icons; it caches same-origin immutable Next.js static assets on demand. It excludes API and authentication traffic and never places authenticated financial responses in Cache Storage. Reference records are deliberately stored in IndexedDB.

## Local database

`inventman-offline` is a Dexie database at schema version 3. Additive versions preserve financial stores. Stores are `app_meta`, organization/branch/terminal/product/variant/barcode/price/customer/inventory/authorization/session caches, `held_carts`, `offline_transactions`, `sync_queue`, `sync_results`, and `conflict_records`. Data is scoped by organization, branch, and terminal. The non-secret device UUID is generated once; it is provenance, not authentication.

No password, Supabase key, refresh token, OTP, invitation/reset token, PAN, CVV, or PIN is written deliberately. IndexedDB remains readable to anyone with access to the unlocked browser profile, so cached customer data is deliberately minimal.

## Readiness and local stock guidance

Offline Ready requires available storage, a nonempty product/price cache, active terminal and cashier-session snapshots, a permissions snapshot, and a cache timestamp inside the organization maximum age. Stock shown offline is labelled last-synced. Device guidance subtracts completed unsynced local sale quantities from the last server snapshot; it is not a ledger and cannot prevent two disconnected terminals overselling the same unit.

## Durable checkout and receipts

Phase 8 permits cached product/barcode search, local held carts, walk-in or cached-customer checkout, and immediate tender methods allowed by policy. Cash is supported. Credit, card, and transfer default to disabled; store credit, refunds, authoritative returns, procurement, adjustments, transfers, and stock-count posting remain online-only.

Completion generates stable local transaction and idempotency UUIDs plus a SHA-256 request hash. Dexie commits the immutable sale payload and queue entry in one transaction before the UI displays a `PENDING SYNC` local receipt. A failed transaction issues no receipt.

## Queue, replay, and locking

Queue states are `PENDING`, `SYNCING`, `SYNCED`, `RETRYABLE_ERROR`, `CONFLICT`, `FAILED_PERMANENT`, and `CANCELLED`. Items retain their original payload and server result. Dependencies and creation time determine order. Retryable failures use bounded exponential backoff. Web Locks serializes workers across tabs; an atomic expiring IndexedDB lease is the fallback. Startup recovers stale `SYNCING` records.

Connectivity combines `navigator.onLine` with an uncached `HEAD /api/connectivity` request. Sync runs at startup, reconnect, status checks while pending, manual request, and browser Background Sync notification when available.

## Idempotency and reconciliation

The database uniquely binds `(organization, device, local transaction)`. Replay hashes the complete offline command. Reusing a local reference or idempotency key with different content fails. A response lost after commit can be retried: the RPC returns the existing sale, so no second sale, inventory issue, invoice, payment, receipt, or cash event is created.

Successful reconciliation stores the server sale, receipt, inventory transaction, and response beside the local reference. Server reports count only the server sale; the local queue is operational history, not financial reporting truth. Device and server timestamps are both retained, with server time authoritative for posting.

## Conflicts and recovery

Stock, inactive product/payment method, price/discount policy, suspended user, revoked branch/terminal/device, and invalid session outcomes remain durable conflicts. The Offline & Sync page exposes retry and explicit local cancellation without rewriting the original transaction. A closed original session is not replaced automatically; it requires review.

Logout and organization switching warn when unsynced work exists. Queues remain isolated by original organization/branch/terminal/device. Reset is blocked while unsynced items exist. App and Dexie upgrades do not delete pending or conflicted records.

## Future scope

Later phases may add controlled return drafts or other modules, but must continue to replay explicit commands through existing server engines. Phase 8 intentionally excludes offline inventory and procurement posting, AR/AP settlement, gateways, and accounting.
# Subscription entitlement lease

Offline authorization includes a configurable server-issued lease. Checkout is disabled when it expires; queued sales remain durable and sync is accepted deterministically only when `local_created_at` was within the lease.
# Production cache boundary

The service worker caches only versioned public shell assets. It excludes API, authentication, dashboard, platform-admin, authorized, `private`, `no-store`, and `Set-Cookie` responses. Offline business mutations remain in the existing tenant-scoped IndexedDB queue and must be monitored for retry exhaustion and quota failures.
