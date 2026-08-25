# Implementation Plan

Status meanings: **Not Started**, **In Progress**, **Complete**, **Blocked**. A phase is complete only when its real workflow, authorization, tests, and documentation are complete.

| Phase | Scope | Status |
|---:|---|---|
| 0 | Repository inspection and architecture documentation | Complete |
| 1 | Core project setup and design system | In Progress |
| 2 | Supabase environment, migrations and generated types | In Progress (hosted development project linked) |
| 3 | Authentication | In Progress |
| 4–30 | Remaining sequence from organizations through deployment readiness | Not Started |

## Current foundation acceptance criteria

- Buildable Next.js 16 App Router project with centralized configuration.
- Version-controlled local Supabase configuration and initial tenant/RBAC migration.
- RLS membership helpers and cross-tenant policy foundation.
- Browser/server Supabase clients using the supported SSR cookie model.
- Accessible responsive shell and foundational UI primitives.
- Lint, strict typecheck, unit test, and production build passing.

## FOUNDATION APPLICATION GATE

| Verification | Status | Evidence |
|---|---|---|
| Dependency installation | PASS | Exact direct versions installed; `package-lock.json` retained; `npm ls --depth=0` passed; npm audit reported zero vulnerabilities. |
| Lint | PASS | `npm run lint` completed with no errors or warnings. |
| Typecheck | PASS | `npm run typecheck` completed under strict TypeScript. |
| Unit tests | PASS | `npm test`: 2 files and 3 tests passed. |
| Playwright | PASS | Public/auth rendering, unauthenticated dashboard/onboarding rejection, invalid callback handling, safe redirects, and no-store response checks: 4 tests passed. |
| Production build | PASS | `npm run build` compiled, typechecked, prerendered public routes, and kept `/dashboard` dynamic. |
| Supabase migration | PASS | Linked only to the dedicated `inventman` development project. The dry run listed one expected migration; push completed and local/remote history match at `20260825120000`. Remote database lint reports no schema errors. |
| Generated database types | PASS | Types were regenerated from the linked hosted schema and include invitations plus foundation RPCs. |
| Authentication URL configuration | PASS | Hosted Auth uses `http://localhost:3100` and allows callback URLs for localhost/127.0.0.1 on ports 3000 and 3100. Existing MFA, 8-character OTP, rate-limit, and storage settings were preserved. |
| Registration | PASS | A real hosted-development signup reached the check-email state and triggered Supabase confirmation without disabling email verification. |
| Password login | PASS | A uniquely tagged, Admin-API-provisioned confirmed development user completed the real application login form. Credentials remained process-only. |
| Session and dashboard | PASS | Verified `getClaims()` protection, onboarding redirect, atomic organization creation, dashboard access, refresh persistence, membership resolution, and absence of browser/network errors. |
| Logout and protected routes | PASS | Real logout removed access; logged-out, cleared-cookie, and malformed-cookie requests all redirected server-side to login without restoration on refresh. |
| Authenticated tenant boundary | PASS | Two temporary confirmed users and organizations proved foreign organization reads, updates, and branch reads are filtered through the hosted API boundary. |
| RLS tenant isolation | PASS | Linked pgTAP executed transactionally against hosted development: all 27 assertions passed, including inverse tenant reads/writes and anonymous denial. |
| RBAC authorization | PASS | Hosted pgTAP proves owner capability, restricted-role denial, and prevention of granting capabilities the actor lacks. |
| Branch isolation | PASS | Hosted pgTAP proves Branch A-only reads, Branch B filtering, and rejection of manual `branch_id` tampering. |
| Owner bootstrap RPC | PASS | Hosted pgTAP proves authenticated ownership, atomic foundation creation, duplicate-slug rejection, and rollback consistency. |
| Environment security | PASS | Only application URL, Supabase URL, and publishable key are browser-visible; secret scan was clean; `.env.local` is ignored. |
| Browser verification | PASS | Real password login, onboarding, dashboard, refresh, logout, post-logout rejection, malformed-cookie rejection, console/network monitoring, and authenticated tenant-boundary tests passed. |

The application-controlled foundation gate is complete. Temporary users and tenant fixtures were deleted after verification.

## PRODUCTION COMMUNICATION GATE

| Verification | Status | Evidence |
|---|---|---|
| Supabase shared email delivery | BLOCKED | The hosted shared SMTP service throttled confirmation attempts; it is not production delivery infrastructure. |
| Custom SMTP configuration | BLOCKED | No production SMTP provider has been configured in Supabase Auth. See `docs/AUTH_EMAIL_DELIVERY.md`. |
| Signup confirmation email | BLOCKED | Real delivery and confirmation remain pending custom SMTP or renewed hosted delivery capacity. |
| Password reset email | BLOCKED | Requires production SMTP configuration and a real mailbox test. |
| Valid production callback | BLOCKED | Invalid-token, safe-redirect, and no-store behavior pass; a real production email link and canonical HTTPS origin remain pending. |

The communication gate is a pre-production release blocker, not a blocker for application development. Email delivery has not been claimed as verified.

## Next.js security release hold

Next.js 16.3.2 is acceptable for foundation verification. The Next.js team announced a scheduled security release for 2026-08-26 covering the 16.3 line and a critical vulnerability. Upgrade to the patched stable 16.3.x version and rerun this gate before any production deployment.
