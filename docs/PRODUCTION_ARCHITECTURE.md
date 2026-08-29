# Production architecture

Inventman is a Next.js 16 application backed by a dedicated Supabase project. Local, development, staging, and production are explicit `APP_ENV` values. Staging and production must use separate Vercel projects (or separately scoped environments), Supabase projects, credentials, billing webhook endpoints, email credentials, and monitoring destinations. Preview builds must never receive production database credentials.

The browser receives only `NEXT_PUBLIC_*` values. Server-only credentials stay in the deployment secret store. Supabase RLS and permission-aware RPCs remain the primary authorization boundary; Proxy session checks are navigation convenience, not authorization. Static assets may use the CDN, while authenticated pages, API responses, exports, financial data, and platform administration are `private/no-store` and excluded from service-worker caches.

Availability signals are `/api/health/live` (process/config liveness) and `/api/health/ready` (lightweight database readiness using the ordinary publishable client). Release identity comes from `APP_VERSION`. Correlation IDs flow through operational endpoints and structured JSON logs.

Phase 14 discovery on 2026-08-29 found no linked Inventman Vercel project, custom domain, staging project, or dedicated production Supabase project. The linked active Supabase project remains development and is explicitly ineligible for production. The target architecture above is therefore approved design, not deployed-state evidence.

Production promotion is gated by `scripts/assert-production-readiness.mjs`. The deployment artifact must be built from a green GitHub run and promoted only after non-destructive checks of homepage, liveness, readiness, security headers, canonical URLs and platform-admin denial. SMTP remains configured in the production Supabase Auth project; application SMTP variables are readiness metadata and never a replacement for Auth SMTP configuration.
