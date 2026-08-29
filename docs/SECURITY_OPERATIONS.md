# Security operations

Review access quarterly and on every role change. Require MFA for source, deployment, database, billing, email, domain, and monitoring operators. Rotate secrets after staff/vendor changes and suspected exposure; use provider secret stores and never browser variables. Review Supabase RLS, grants and `SECURITY DEFINER` search paths with every migration.

The application sets CSP, clickjacking, MIME, referrer, permissions, opener/resource and production HSTS controls. Next.js Server Actions provide same-origin checks; every action and RPC must still authenticate, authorize, validate input, and return minimal data. Allowlisted redirect destinations must remain same-origin. CSV exports must neutralize spreadsheet formulas. Uploads require size/type checks and private bucket policies.

Application memory rate limiting is a local/test fallback only. Production must configure `RATE_LIMIT_REST_URL` as a shared fail-closed endpoint accepting `{ key, limit, windowMs }`, with its bearer token in `RATE_LIMIT_REST_TOKEN`, and/or staged Vercel Firewall rules beginning in log mode. Monitor auth, invite, admin, export, search, checkout and billing webhook abuse. Return structured 429 responses and never log secrets, raw webhook bodies, tokens, cookies, or personal/financial payloads.
