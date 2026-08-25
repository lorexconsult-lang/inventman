# Offline Sync Architecture

## Principle

Offline clients queue business commands, not resulting balances. A reconnect synchronizes each versioned command to an idempotent server endpoint, which validates and posts authoritative transactions atomically.

## Local stores

Dexie stores a limited product/price/barcode snapshot, necessary customers, active shift, device metadata, and queued commands. It never downloads the tenant's full dataset. Each command includes client UUID, device, organization, branch, user, local timestamp, type, schema version, payload, idempotency key, status, retry count, and acknowledgement metadata.

## State machine

`LOCAL_ONLY → QUEUED → SYNCING → SYNCED`. Failures become `FAILED`, business collisions become `CONFLICT`, and ambiguous outcomes become `REQUIRES_REVIEW`. Network retries use bounded exponential backoff. A stable idempotency key is reused for every retry.

## Conflict rules

The server is authoritative for permissions, prices requiring authorization, current workflow state, and availability rules. Offline sales post their original transaction and movement intent; no client quantity overwrites a server quantity. Conflicts preserve the local payload and server response for review.
