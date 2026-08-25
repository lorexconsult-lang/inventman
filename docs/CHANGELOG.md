# Changelog

## Unreleased

- Built Phase 1 branches, warehouses, hierarchical storage locations, and the complete tenant-safe product catalogue.
- Added simple and option-generated variant products, packaging conversions, organization-unique SKUs/barcodes, tax and price-list configuration, private product images, and lifecycle controls.
- Added validated CSV preview/import, deterministic CSV export, responsive catalogue/location screens, capability enforcement, audit events, and default warehouse/price-list workflows.
- Added 35 Phase 1 pgTAP assertions and catalogue unit coverage while preserving the explicit boundary that no stock balance or Inventory Ledger implementation exists in this phase.

- Initialized product architecture, security, database, RBAC, offline-sync, and delivery documentation.
- Established the Next.js/Supabase project foundation and tenant-safe schema baseline.
- Added Supabase SSR authentication clients, validated registration/login actions, PKCE callback handling, a responsive application shell, and foundational tests.
- Recorded the external npm registry outage that prevented dependency and build verification.
- Installed and pinned dependencies with a lockfile; lint, typecheck, unit tests, Playwright, and production build now pass.
- Hardened Supabase SSR around verified claims, refresh-cookie propagation, no-store caching, PKCE redirects, logout, and server-side protected-route validation.
- Separated public pages from the dynamic authenticated application shell and added isolated browser tests.
- Added capability-authorized tenant mutations, atomic owner bootstrap, and pgTAP tenant-isolation/RBAC tests.
- Recorded local Supabase migration execution as blocked by official container registry TLS/DNS/short-read failures.
- Linked the dedicated hosted `inventman` development project, safely dry-ran and applied the tenant/RBAC foundation migration, and regenerated database types.
- Added an invitation lifecycle model, enforced branch-scoped visibility, and prevented role managers from granting capabilities they do not hold.
- Configured hosted development Auth callback URLs for the local port while preserving the project security settings.
- Executed 27 hosted pgTAP assertions covering tenant isolation, RBAC escalation, branch scoping/tampering, anonymous denial, and atomic owner bootstrap; all passed.
- Added server-authorized organization onboarding, membership-aware dashboard routing, and hosted alphanumeric OTP verification.
- Added browser coverage for onboarding protection, invalid callbacks, no-store behavior, and external redirect rejection.
- Recorded the remaining hosted email expiry/rate-limit blocker; no release commit was created.
- Added a development-only, fail-closed Admin API utility that provisions confirmed ephemeral users, runs real password/session/onboarding/logout and authenticated tenant-boundary checks, and always cleans up its fixtures.
- Completed the application-controlled authentication foundation gate without weakening production email confirmation.
- Split application foundation readiness from the pre-production communication gate and documented custom Supabase SMTP requirements.
