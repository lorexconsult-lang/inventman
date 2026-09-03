# Public route SEO inventory

Production public routes become indexable only when `APP_ENV=production` and a real canonical `NEXT_PUBLIC_APP_URL` is configured. Staging and development emit `noindex, nofollow`; staging robots disallows all crawling. Private application routes never enter the sitemap and define noindex metadata at their layouts.

| Route group | Intent | Title pattern | Structured data | Primary internal links |
| --- | --- | --- | --- | --- |
| `/` | Product/category evaluation | Inventman — Inventory, Sales & Profitability Software | Organization, SoftwareApplication, WebSite, FAQPage | Features, industries, pricing, security |
| `/features` | Capability discovery | Business Operations Software Features | CollectionPage, BreadcrumbList | Every feature, pricing |
| `/features/inventory-management` | Inventory software evaluation | Inventory Management Software | WebPage, BreadcrumbList, FAQPage | Multi-branch, purchasing, POS, pricing |
| `/features/point-of-sale` | POS inventory evaluation | POS and Inventory Software | WebPage, BreadcrumbList, FAQPage | Offline POS, inventory, sales, pricing |
| `/features/sales-invoicing` | Quote-to-cash evaluation | Sales and Invoicing Software | WebPage, BreadcrumbList, FAQPage | Inventory, POS, finance, pricing |
| `/features/purchase-management` | Purchasing evaluation | Purchase Management Software | WebPage, BreadcrumbList, FAQPage | Suppliers, inventory, finance, pricing |
| `/features/supplier-management` | Supplier control evaluation | Supplier Management Software | WebPage, BreadcrumbList, FAQPage | Purchasing, finance, inventory |
| `/features/expense-management` | Expense-control evaluation | Business Expense Management Software | WebPage, BreadcrumbList, FAQPage | Finance, multi-branch, sales |
| `/features/financial-reporting` | Profitability/reporting evaluation | Business Profitability and Financial Reporting | WebPage, BreadcrumbList, FAQPage | Sales, expenses, inventory |
| `/features/multi-branch-management` | Multi-location evaluation | Multi-Branch Inventory Management | WebPage, BreadcrumbList, FAQPage | Inventory, POS, finance |
| `/features/offline-pos` | Offline behavior research | Offline-Supported POS Software | WebPage, BreadcrumbList, FAQPage | POS, inventory, multi-branch |
| `/industries` | Industry-fit discovery | Inventory Software by Industry | CollectionPage, BreadcrumbList | Industry pages, features |
| `/industries/*` | Specific industry use-case evaluation | Unique industry title | BreadcrumbList, FAQPage | Inventory, POS, finance, pricing |
| `/pricing` | Commercial comparison | Inventman Pricing and Plans | BreadcrumbList | Signup, features, contact |
| `/security` | Trust and risk evaluation | Security and Access Controls | BreadcrumbList | Contact, signup |
| `/about` | Product mission/company evaluation | About Inventman | AboutPage, BreadcrumbList | Features, signup |
| `/contact` | Find an approved contact path | Contact Inventman | BreadcrumbList | Features, pricing, support |
| `/support` | Self-service routing | Inventman Support | BreadcrumbList | Login, pricing, resources |
| `/resources` | Educational discovery | Business Inventory Guides & Resources | CollectionPage, BreadcrumbList | Articles, features |
| `/resources/*` | Informational search | Unique guide title | Article, BreadcrumbList | Related feature, resources, signup |
| `/privacy`, `/terms` | Launch legal framework | Unique legal title | Inherited WebPage semantics | Contact, homepage |

Every listed route has a unique description and environment-derived canonical. `/dashboard/*`, `/platform-admin/*`, `/onboarding/*`, `/auth/*`, `/login`, `/signup`, `/invite`, internal APIs and private exports are excluded.

