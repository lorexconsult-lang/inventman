# Public website architecture

Phase 12 adds server-rendered public routes for Home, Features, Pricing, About, Security, Contact, Support, Privacy and Terms. A shared header/footer keeps navigation consistent. Legal pages are launch frameworks requiring final counsel review; no certifications, testimonials, customer counts or quantified performance claims are fabricated.

Pricing calls the database `public_saas_plans()` projection. It exposes active public plans only, returns no plan identifiers or administrative fields, and includes only configured public entitlement values. Monthly and annual amounts remain database truth. Custom plans show a contact path rather than negotiated pricing.

Canonical metadata, Open Graph/Twitter defaults, `sitemap.ts` and `robots.ts` cover public discovery. Workspace, platform administration, callbacks, invitations, onboarding and APIs are excluded from indexing. Robots is not an authorization boundary. Public pages contain no organization/session data and the Phase 11 service-worker exclusions remain unchanged.

The only client-hydrated marketing control is the billing interval selector. Analytics is provider-ready but intentionally absent until privacy, consent and a production provider are approved.
# Phase 14C public discovery layer

The public site now positions Inventman consistently as a business inventory, sales and profitability operating system. It includes substantive feature, industry-use-case and evergreen resource routes backed by a shared content model, reusable public components, intentional internal links and consistent Start Free Trial conversion paths. Server Components render content-heavy pages; only the live pricing interval control hydrates on the client.

Search behavior is environment-aware. Production public routes may index after a canonical domain is approved; staging and development emit noindex/nofollow and staging robots disallows crawling. Private routes remain authentication-protected, excluded from the sitemap and noindex at the layout boundary. Structured data is limited to visible, accurate Organization, SoftwareApplication, WebSite, WebPage/CollectionPage, BreadcrumbList, FAQPage and Article facts.
# Phase 14D visual composition

The Phase 14C semantic, metadata and internal-linking architecture remains unchanged. Phase 14D recomposes the public experience around an early product showcase, editorial problem narrative, connected operating cycle, alternating inventory/POS/finance/branch product stories, a dark trust section and a structured midnight footer. Interface frames contain sanitized representative Inventman data and describe only implemented workflows.
