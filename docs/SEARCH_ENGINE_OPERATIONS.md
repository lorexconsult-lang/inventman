# Search engine operations

## Indexation policy

- **Staging and development:** `noindex, nofollow` on page metadata; robots disallows `/`. Temporary Vercel URLs are not permanent canonicals.
- **Production public marketing:** indexable only after `APP_ENV=production` and the approved canonical HTTPS origin is configured.
- **Private application:** authenticated routes remain protected, excluded from the sitemap and explicitly noindex. Robots is advisory, never an access control.

## Before enabling production indexing

1. Approve and configure the production domain and `NEXT_PUBLIC_APP_URL`.
2. Confirm canonical, Open Graph and sitemap URLs use that origin.
3. Approve legal/company/support information.
4. Set optional `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` values through environment configuration; never commit tokens.
5. Crawl all public routes for 200 status, unique titles/descriptions, canonical consistency, structured-data syntax, broken links and redirect chains.
6. Verify private routes require authentication and return noindex metadata.

## Google Search Console

Create a Domain property after DNS control exists and use the DNS TXT value supplied by Google. Inspect the canonical homepage, submit `/sitemap.xml`, review Page indexing and Core Web Vitals, and test representative feature, industry and article URLs. Request indexing only after canonical inspection and rich-result validation pass. Monitor coverage changes, manual actions and security issues after releases.

## Bing Webmaster Tools

Create a domain/site property, use the provider-issued DNS or environment-based verification method, submit the same sitemap, inspect representative URLs and monitor crawl/index reports. Do not reuse or invent verification values.

## Structured data and quality checks

Validate visible FAQ content against FAQPage JSON-LD, deep-page navigation against BreadcrumbList, guides against Article, and homepage product identity against Organization, WebSite and SoftwareApplication. Use Google Rich Results Test where supported and Schema Markup Validator for generic schema. Never add ratings, reviews, LocalBusiness data or offers that are not visible and verified.

## Release monitoring

Record search crawl results, Lighthouse/Core Web Vitals evidence, sitemap route count, robots output and deployed SHA for each public-site release. Watch LCP, CLS and INP field data once production has sufficient traffic; use lab TBT only as an approximation before launch.

