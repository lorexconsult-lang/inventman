# Scheduled jobs

Inventman schedules one daily authenticated maintenance call at 02:15 UTC through `vercel.json`. Vercel sends `Authorization: Bearer <CRON_SECRET>` to `/api/cron/subscriptions`; the route additionally refuses local/development environments and invokes the database using the server-only service role.

`run_subscription_maintenance` is the single subscription lifecycle engine for scheduled transitions. It atomically and idempotently handles expired trials, past-due entry into the configured grace period, expired grace periods, and cancellation at period end. Every transition writes a platform audit event. Repeat execution finds no eligible row and causes no duplicate transition.

Reminder intent is stored in `platform_notification_events` with a uniqueness boundary per subscription, event type, and scheduled date. Email delivery is intentionally separate: SMTP failure cannot change subscription truth. A future delivery worker may claim pending events, increment attempts and record delivery status after a provider is selected.

Billing reconciliation is not scheduled yet. Existing provider abstractions validate inbound webhooks but do not implement safe provider-state retrieval. Adding a polling job before Paystack or Flutterwave is explicitly selected would invent API semantics and credentials. It remains a configuration/implementation blocker and must never create a charge.

No general cleanup job exists. Current cleanup functions are narrowly guarded verification utilities and are forbidden in staging/production. Business transactions, audit history, inventory movements, accounting journals and billing history have no automated deletion policy.

Operational verification requires an unauthorized 401 check, one authenticated staging execution, an immediate repeat showing zero transitions/no duplicate outbox rows, correlation-aware runtime logs, and an alert for missed or failed daily execution.
