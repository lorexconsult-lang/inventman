begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path=pgtap,extensions,public;
select plan(19);

select has_table('public','platform_notification_events','notification intent outbox exists');
select has_function('public','run_subscription_maintenance',array['timestamp with time zone'],'subscription maintenance engine exists');
select is((select relrowsecurity from pg_class where oid='public.platform_notification_events'::regclass),true,'notification outbox RLS enabled');
select is((select relforcerowsecurity from pg_class where oid='public.platform_notification_events'::regclass),true,'notification outbox RLS forced');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
values('00000000-0000-4000-8000-00000001400a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase14-jobs@example.test','',now(),now(),now());
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000001400a","role":"authenticated"}',true);
select lives_ok($$select public.create_organization('Phase 14 Trial','phase14-trial','GB','GBP','Europe/London')$$,'trial fixture created');
select lives_ok($$select public.create_organization('Phase 14 Past Due','phase14-past-due','GB','GBP','Europe/London')$$,'past-due fixture created');
select lives_ok($$select public.create_organization('Phase 14 Grace','phase14-grace','GB','GBP','Europe/London')$$,'grace fixture created');
select lives_ok($$select public.create_organization('Phase 14 Cancel','phase14-cancel','GB','GBP','Europe/London')$$,'cancellation fixture created');
select lives_ok($$select public.create_organization('Phase 14 Reminder','phase14-reminder','GB','GBP','Europe/London')$$,'reminder fixture created');

set local role postgres;
update public.organization_subscriptions s set trial_ends_at='2026-10-09T00:00:00Z' where organization_id=(select id from public.organizations where slug='phase14-trial');
update public.organization_subscriptions s set status='PAST_DUE',access_mode='GRACE_ACCESS',trial_ends_at=null where organization_id=(select id from public.organizations where slug='phase14-past-due');
update public.organization_subscriptions s set status='GRACE_PERIOD',access_mode='GRACE_ACCESS',trial_ends_at=null,grace_period_ends_at='2026-10-09T00:00:00Z' where organization_id=(select id from public.organizations where slug='phase14-grace');
update public.organization_subscriptions s set status='ACTIVE',access_mode='FULL_ACCESS',trial_ends_at=null,cancel_at_period_end=true,current_period_end='2026-10-09T00:00:00Z' where organization_id=(select id from public.organizations where slug='phase14-cancel');
update public.organization_subscriptions s set trial_ends_at='2026-10-13T00:00:00Z' where organization_id=(select id from public.organizations where slug='phase14-reminder');

set local role authenticated;
select throws_ok($$select public.run_subscription_maintenance('2026-10-10T00:00:00Z')$$,'42501','permission denied for function run_subscription_maintenance','tenant cannot run maintenance');
set local role service_role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
select lives_ok($$select public.run_subscription_maintenance('2026-10-10T00:00:00Z')$$,'service role runs maintenance');
select is((select status from public.organization_subscriptions where organization_id=(select id from public.organizations where slug='phase14-trial')),'EXPIRED','expired trial becomes expired');
select is((select status from public.organization_subscriptions where organization_id=(select id from public.organizations where slug='phase14-past-due')),'GRACE_PERIOD','past due enters grace');
select is((select status from public.organization_subscriptions where organization_id=(select id from public.organizations where slug='phase14-grace')),'EXPIRED','expired grace becomes expired');
select is((select status from public.organization_subscriptions where organization_id=(select id from public.organizations where slug='phase14-cancel')),'CANCELLED','period-end cancellation completes');
select is((select count(*)::integer from public.platform_notification_events e join public.organizations o on o.id=e.organization_id where o.slug like 'phase14-%'),5,'reminders and transition notices are queued once');
select is((select count(*)::integer from public.platform_audit_events a join public.organizations o on o.id::text=a.target_id where a.action like 'system.subscription.%' and o.slug like 'phase14-%'),4,'every transition is audited');
select is((public.run_subscription_maintenance('2026-10-10T00:00:00Z')->>'trials_expired')::integer,0,'repeat execution makes no trial transition');
select is((select count(*)::integer from public.platform_notification_events e join public.organizations o on o.id=e.organization_id where o.slug like 'phase14-%'),5,'repeat execution creates no duplicate notice');

select * from finish();
rollback;
