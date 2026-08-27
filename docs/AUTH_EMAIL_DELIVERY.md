# Auth Email Delivery

## Production requirement

Supabase's shared development SMTP service is rate-limited and intended only for evaluation. It is not sufficient for production reliability, throughput, branding, monitoring, or deliverability. A custom SMTP provider must be configured in the Supabase Auth settings before production; the Next.js application must not send Supabase Auth messages through a separate email SDK.

Supabase Auth remains responsible for signup confirmation, password reset, email-change confirmation, and magic-link or email-OTP messages when those methods are enabled. SMTP credentials belong only in the hosted Supabase project configuration and must never appear in browser variables, repository files, screenshots, or documentation.

Team invitations use the same server-side delivery boundary. The application stores an independent invitation with a hashed, expiring, one-time token and intended role/branch snapshot. Auth establishes the verified identity; database acceptance applies organization access. Resend rotates the token, and revocation prevents later acceptance.

## Redirect configuration

The production Auth site URL must use the canonical HTTPS application origin. Every permitted callback origin must be listed explicitly. Preview and local origins should remain separate from production, and callbacks must continue to allow only relative post-auth destinations, reject external redirect targets, exchange valid PKCE codes server-side, and return private/no-store responses.

## Production verification

Before launch, verify all of the following with real mailboxes on multiple providers:

- Signup confirmation delivery and valid callback exchange.
- Expired, reused, malformed, and wrong-recipient token rejection.
- Password-reset delivery and completion.
- Email-change confirmation for both old and new addresses where configured.
- Magic-link or OTP delivery, expiry, and replay prevention where enabled.
- SPF, DKIM, and DMARC alignment; sender-domain reputation; bounce and complaint handling.
- Responsive, accessible templates with correct branding and no sensitive content.
- Delivery latency, provider throttling, retry behavior, and operational alerting.

No SMTP password or provider API credential should be stored in this repository.
