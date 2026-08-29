# Production architecture

Inventman is a Next.js 16 application backed by a dedicated Supabase project. Local, development, staging, and production are explicit `APP_ENV` values. Staging and production must use separate Vercel projects (or separately scoped environments), Supabase projects, credentials, billing webhook endpoints, email credentials, and monitoring destinations. Preview builds must never receive production database credentials.

The browser receives only `NEXT_PUBLIC_*` values. Server-only credentials stay in the deployment secret store. Supabase RLS and permission-aware RPCs remain the primary authorization boundary; Proxy session checks are navigation convenience, not authorization. Static assets may use the CDN, while authenticated pages, API responses, exports, financial data, and platform administration are `private/no-store` and excluded from service-worker caches.

Availability signals are `/api/health/live` (process/config liveness) and `/api/health/ready` (lightweight database readiness using the ordinary publishable client). Release identity comes from `APP_VERSION`. Correlation IDs flow through operational endpoints and structured JSON logs.
