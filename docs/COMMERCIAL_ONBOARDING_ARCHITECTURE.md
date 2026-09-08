# Commercial onboarding architecture

The journey is: anonymous visitor → validated plan code → Supabase signup → email verification/PKCE callback → atomic commercial organization creation → Phase 10 trial → resumable setup wizard → derived first-run checklist → normal workspace.

Only a syntactically safe plan code crosses browser routes. `create_commercial_organization` revalidates that the plan is active and public, accepts no browser price/limits/features, calls the existing organization engine, and updates the automatically created Phase 10 trial. A user with an existing active membership receives that organization on retry, preventing duplicate tenants, memberships, subscriptions and onboarding rows.

During temporary open access, onboarding continues to create and retain the same trial/subscription records so future subscription activation remains reversible and auditable. Those records do not gate tenant functionality while the centralized commercial access mode is `OPEN_ACCESS`, and no checkout is initiated during account or organization creation.

`organization_onboarding` stores wizard position/completion under RLS. The wizard also queries real branch, warehouse, product, POS and membership records so a response lost after a successful write advances correctly on reload. Branch, warehouse, catalogue, POS and invitation links reuse their verified modules and continue enforcing RBAC and entitlements. Optional steps never block workspace access.

The dashboard checklist derives completion from products, opening-stock transactions, suppliers, customers, payment methods, terminals, members and active Finance settings. POS/Finance tasks appear only when entitled. Collapsing the checklist does not change business truth.

SMTP, live checkout, analytics, staging/production infrastructure and monitoring remain deployment configuration—not simulated code success.
