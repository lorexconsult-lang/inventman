begin;

create table public.platform_notification_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subscription_id uuid not null references public.organization_subscriptions(id) on delete cascade,
  event_type text not null check (event_type in ('TRIAL_REMINDER','TRIAL_EXPIRED','BILLING_GRACE_REMINDER','SUBSCRIPTION_EXPIRED','SUBSCRIPTION_CANCELLED')),
  scheduled_for date not null,
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','DELIVERED','FAILED','CANCELLED')),
  available_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_id,event_type,scheduled_for)
);
create index platform_notification_events_pending_idx on public.platform_notification_events(status,available_at) where status in ('PENDING','FAILED');
alter table public.platform_notification_events enable row level security;
alter table public.platform_notification_events force row level security;
create policy platform_notification_events_admin_read on public.platform_notification_events for select to authenticated using(public.is_platform_admin('platform.subscriptions.view'));
grant select on public.platform_notification_events to authenticated;
create trigger platform_notification_events_updated before update on public.platform_notification_events for each row execute function public.set_updated_at();

create or replace function public.run_subscription_maintenance(target_now timestamptz default now()) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  grace_days integer;
  reminders_queued integer := 0;
  trials_expired integer := 0;
  grace_started integer := 0;
  grace_expired integer := 0;
  cancellations_completed integer := 0;
begin
  if auth.role() <> 'service_role' then raise exception using errcode='42501',message='SERVICE_ROLE_REQUIRED'; end if;
  select coalesce(grace_period_days,7) into grace_days from public.platform_settings where singleton;

  insert into public.platform_notification_events(organization_id,subscription_id,event_type,scheduled_for,payload)
  select organization_id,id,'TRIAL_REMINDER',target_now::date,jsonb_build_object('days_remaining',(trial_ends_at::date-target_now::date))
  from public.organization_subscriptions
  where status='TRIALING' and trial_ends_at is not null and (trial_ends_at::date-target_now::date) in (1,3,7)
  on conflict(subscription_id,event_type,scheduled_for) do nothing;
  get diagnostics reminders_queued = row_count;

  insert into public.platform_notification_events(organization_id,subscription_id,event_type,scheduled_for,payload)
  select organization_id,id,'BILLING_GRACE_REMINDER',target_now::date,jsonb_build_object('grace_period_ends_at',grace_period_ends_at)
  from public.organization_subscriptions
  where status in ('PAST_DUE','GRACE_PERIOD') and (grace_period_ends_at is null or grace_period_ends_at>target_now)
  on conflict(subscription_id,event_type,scheduled_for) do nothing;
  get diagnostics grace_started = row_count;
  reminders_queued := reminders_queued + grace_started;

  with changed as (
    update public.organization_subscriptions set status='CANCELLED',access_mode='READ_ONLY',cancelled_at=coalesce(cancelled_at,target_now)
    where cancel_at_period_end and current_period_end is not null and current_period_end<=target_now and status in ('TRIALING','ACTIVE','PAST_DUE','GRACE_PERIOD')
    returning id,organization_id
  ), audited as (
    insert into public.platform_audit_events(action,target_type,target_id,reason,after_data)
    select 'system.subscription.cancelled','organization',organization_id::text,'scheduled period-end cancellation',jsonb_build_object('subscription_id',id,'effective_at',target_now) from changed
    returning 1
  )
  insert into public.platform_notification_events(organization_id,subscription_id,event_type,scheduled_for,payload)
  select c.organization_id,c.id,'SUBSCRIPTION_CANCELLED',target_now::date,jsonb_build_object('effective_at',target_now) from changed c
  on conflict(subscription_id,event_type,scheduled_for) do nothing;
  get diagnostics cancellations_completed = row_count;

  with changed as (
    update public.organization_subscriptions set status='EXPIRED',access_mode='READ_ONLY'
    where status='TRIALING' and trial_ends_at is not null and trial_ends_at<=target_now
    returning id,organization_id
  ), audited as (
    insert into public.platform_audit_events(action,target_type,target_id,reason,after_data)
    select 'system.subscription.trial_expired','organization',organization_id::text,'trial end reached',jsonb_build_object('subscription_id',id,'effective_at',target_now) from changed
    returning 1
  )
  insert into public.platform_notification_events(organization_id,subscription_id,event_type,scheduled_for,payload)
  select c.organization_id,c.id,'TRIAL_EXPIRED',target_now::date,jsonb_build_object('effective_at',target_now) from changed c
  on conflict(subscription_id,event_type,scheduled_for) do nothing;
  get diagnostics trials_expired = row_count;

  with changed as (
    update public.organization_subscriptions set status='GRACE_PERIOD',access_mode='GRACE_ACCESS',grace_period_ends_at=coalesce(grace_period_ends_at,target_now+make_interval(days=>grace_days))
    where status='PAST_DUE'
    returning id,organization_id,grace_period_ends_at
  )
  insert into public.platform_audit_events(action,target_type,target_id,reason,after_data)
  select 'system.subscription.grace_started','organization',organization_id::text,'past-due grace policy',jsonb_build_object('subscription_id',id,'grace_period_ends_at',grace_period_ends_at) from changed;
  get diagnostics grace_started = row_count;

  with changed as (
    update public.organization_subscriptions set status='EXPIRED',access_mode='READ_ONLY'
    where status='GRACE_PERIOD' and grace_period_ends_at is not null and grace_period_ends_at<=target_now
    returning id,organization_id
  ), audited as (
    insert into public.platform_audit_events(action,target_type,target_id,reason,after_data)
    select 'system.subscription.grace_expired','organization',organization_id::text,'grace period end reached',jsonb_build_object('subscription_id',id,'effective_at',target_now) from changed
    returning 1
  )
  insert into public.platform_notification_events(organization_id,subscription_id,event_type,scheduled_for,payload)
  select c.organization_id,c.id,'SUBSCRIPTION_EXPIRED',target_now::date,jsonb_build_object('effective_at',target_now) from changed c
  on conflict(subscription_id,event_type,scheduled_for) do nothing;
  get diagnostics grace_expired = row_count;

  return jsonb_build_object('reminders_queued',reminders_queued,'trials_expired',trials_expired,'grace_started',grace_started,'grace_expired',grace_expired,'cancellations_completed',cancellations_completed);
end $$;

revoke all on function public.run_subscription_maintenance(timestamptz) from public,anon,authenticated;
grant execute on function public.run_subscription_maintenance(timestamptz) to service_role;

commit;
