# Product Architecture

## Purpose

Inventman is a multi-tenant operations platform for inventory-based businesses. Version 1 covers the complete commercial scope described in the master specification; AI capabilities are explicitly deferred.

## Boundaries

The application is organized by domain under `src/features`. Domains own their validation, application services, queries, UI, and tests. Shared infrastructure lives under `src/lib`; reusable visual primitives live under `src/components`.

The initial bounded contexts are identity and access, organizations, branches and warehouses, catalogue, inventory, procurement, sales/POS, finance, approvals, audit, reporting, subscriptions, platform administration, and offline synchronization.

## Runtime architecture

- Next.js App Router provides the web, server rendering, route handlers, and application shell.
- Supabase Auth establishes identity; PostgreSQL RLS establishes data authorization.
- PostgreSQL functions own atomic ledger, inventory, and financial state transitions.
- Supabase Storage holds tenant assets behind policies.
- IndexedDB/Dexie holds a deliberately limited operational cache and immutable offline command queue.
- Server synchronization posts commands using stable idempotency keys; it never overwrites cloud balances.

## Dependency rule

Features may depend on shared configuration, types, UI, and infrastructure. Cross-domain writes occur through explicit application services or database functions, never by importing another feature's internal persistence implementation.

## Industry capabilities

Industry modes are organization-level capabilities and configuration. They extend the universal product, inventory, workflow, and location models rather than forking schemas or applications.
