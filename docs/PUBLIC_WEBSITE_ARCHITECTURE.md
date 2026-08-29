# Public website architecture

Phase 12 adds server-rendered public routes for Home, Features, Pricing, About, Security, Contact, Support, Privacy and Terms. A shared header/footer keeps navigation consistent. Legal pages are launch frameworks requiring final counsel review; no certifications, testimonials, customer counts or quantified performance claims are fabricated.

Pricing calls the database `public_saas_plans()` projection. It exposes active public plans only, returns no plan identifiers or administrative fields, and includes only configured public entitlement values. Monthly and annual amounts remain database truth. Custom plans show a contact path rather than negotiated pricing.

Canonical metadata, Open Graph/Twitter defaults, `sitemap.ts` and `robots.ts` cover public discovery. Workspace, platform administration, callbacks, invitations, onboarding and APIs are excluded from indexing. Robots is not an authorization boundary. Public pages contain no organization/session data and the Phase 11 service-worker exclusions remain unchanged.

The only client-hydrated marketing control is the billing interval selector. Analytics is provider-ready but intentionally absent until privacy, consent and a production provider are approved.
