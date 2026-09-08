begin;

alter table public.platform_settings
  add column if not exists commercial_access_mode text not null default 'OPEN_ACCESS';

alter table public.platform_settings
  drop constraint if exists platform_settings_commercial_access_mode_check;

alter table public.platform_settings
  add constraint platform_settings_commercial_access_mode_check
  check (commercial_access_mode in ('OPEN_ACCESS', 'SUBSCRIPTION'));

-- This migration intentionally activates temporary launch access. Returning to
-- subscription enforcement is a single audited setting change, not a data or
-- schema rollback.
update public.platform_settings
set commercial_access_mode = 'OPEN_ACCESS'
where singleton;

create or replace function public.platform_commercial_access_mode()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select settings.commercial_access_mode
      from public.platform_settings settings
      where settings.singleton
    ),
    'SUBSCRIPTION'
  )
$$;

create or replace function public.organization_access_mode(target_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when organization.platform_suspended_at is not null then 'SUSPENDED'
    when public.platform_commercial_access_mode() = 'OPEN_ACCESS' then 'FULL_ACCESS'
    else coalesce(
      (
        select case
          when subscription.status = 'SUSPENDED' then 'SUSPENDED'
          when subscription.status in ('ACTIVE', 'TRIALING')
            and (
              subscription.status <> 'TRIALING'
              or subscription.trial_ends_at > now()
            )
            then 'FULL_ACCESS'
          when subscription.status in ('PAST_DUE', 'GRACE_PERIOD')
            and coalesce(subscription.grace_period_ends_at, now()) > now()
            then 'GRACE_ACCESS'
          else 'READ_ONLY'
        end
        from public.organization_subscriptions subscription
        where subscription.organization_id = organization.id
        order by subscription.created_at desc
        limit 1
      ),
      'READ_ONLY'
    )
  end
  from public.organizations organization
  where organization.id = target_organization_id
$$;

create or replace function public.organization_entitlement(
  target_organization_id uuid,
  target_feature_code text
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with commercial as (
    select public.platform_commercial_access_mode() as mode
  ),
  feature as (
    select exists(
      select 1
      from public.platform_features registry
      where registry.feature_code = target_feature_code
        and registry.status = 'ACTIVE'
    ) as active
  ),
  subscription as (
    select current_subscription.plan_id
    from public.organization_subscriptions current_subscription
    where current_subscription.organization_id = target_organization_id
    order by current_subscription.created_at desc
    limit 1
  ),
  plan_entitlement as (
    select entitlement.entitlement_type,
      entitlement.enabled,
      entitlement.numeric_value,
      entitlement.text_value
    from subscription
    join public.plan_entitlements entitlement
      on entitlement.plan_id = subscription.plan_id
      and entitlement.feature_code = target_feature_code
  ),
  override_entitlement as (
    select entitlement.entitlement_type,
      entitlement.enabled,
      entitlement.numeric_value,
      entitlement.text_value
    from public.organization_entitlement_overrides entitlement
    where entitlement.organization_id = target_organization_id
      and entitlement.feature_code = target_feature_code
      and (entitlement.expires_at is null or entitlement.expires_at > now())
  ),
  feature_flag as (
    select coalesce(
      (
        select flag.enabled
        from public.platform_feature_flags flag
        where flag.feature_code = target_feature_code
          and flag.scope = 'ORGANIZATION'
          and flag.organization_id = target_organization_id
      ),
      (
        select flag.enabled
        from public.platform_feature_flags flag
        where flag.feature_code = target_feature_code
          and flag.scope = 'GLOBAL'
      ),
      true
    ) as enabled
  )
  select jsonb_build_object(
    'feature_code',
    target_feature_code,
    'type',
    coalesce(
      (select entitlement_type from override_entitlement),
      (select entitlement_type from plan_entitlement),
      'BOOLEAN'
    ),
    'enabled',
    case
      when not feature.active or not feature_flag.enabled then false
      when commercial.mode = 'OPEN_ACCESS' then true
      else coalesce(
        (select enabled from override_entitlement),
        (select enabled from plan_entitlement),
        coalesce(
          (select numeric_value from override_entitlement),
          (select numeric_value from plan_entitlement)
        ) > 0,
        false
      )
    end,
    'numeric_value',
    case
      when commercial.mode = 'OPEN_ACCESS' then null
      else coalesce(
        (select numeric_value from override_entitlement),
        (select numeric_value from plan_entitlement)
      )
    end,
    'text_value',
    case
      when commercial.mode = 'OPEN_ACCESS' then null
      else coalesce(
        (select text_value from override_entitlement),
        (select text_value from plan_entitlement)
      )
    end,
    'access_mode',
    public.organization_access_mode(target_organization_id)
  )
  from commercial
  cross join feature
  cross join feature_flag
$$;

create or replace function public.assert_organization_limit(
  target_organization_id uuid,
  target_feature_code text,
  current_usage bigint
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  entitlement jsonb;
  limit_value numeric;
begin
  perform public.assert_organization_feature(
    target_organization_id,
    target_feature_code,
    true
  );

  if public.platform_commercial_access_mode() = 'OPEN_ACCESS' then
    return;
  end if;

  entitlement := public.organization_entitlement(
    target_organization_id,
    target_feature_code
  );
  limit_value := nullif(entitlement ->> 'numeric_value', '')::numeric;

  if limit_value is not null and current_usage >= limit_value then
    raise exception using errcode = 'P0001', message = 'PLAN_LIMIT_REACHED';
  end if;
end
$$;

create or replace function public.issue_offline_entitlement_lease(
  target_organization_id uuid,
  target_device_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  device public.offline_devices%rowtype;
  lease_hours integer;
  lease_end timestamptz;
  subscription_id uuid;
begin
  if actor is null
    or not public.has_permission(target_organization_id, 'offline.use')
  then
    raise exception using errcode = '42501', message = 'PERMISSION_DENIED';
  end if;

  perform public.assert_organization_feature(
    target_organization_id,
    'offline',
    true
  );

  select *
  into device
  from public.offline_devices
  where organization_id = target_organization_id
    and id = target_device_id
  for update;

  if not found or device.status <> 'ACTIVE' then
    raise exception using errcode = '42501', message = 'SYNC_TERMINAL_REVOKED';
  end if;

  if not public.can_access_branch(
    target_organization_id,
    device.branch_id
  ) then
    raise exception using errcode = '42501', message = 'SYNC_BRANCH_ACCESS_REVOKED';
  end if;

  if not exists (
    select 1
    from public.pos_terminals terminal
    where terminal.organization_id = target_organization_id
      and terminal.id = device.terminal_id
      and terminal.branch_id = device.branch_id
      and terminal.status = 'ACTIVE'
  ) then
    raise exception using errcode = '42501', message = 'SYNC_TERMINAL_REVOKED';
  end if;

  select offline_entitlement_lease_hours
  into lease_hours
  from public.platform_settings
  where singleton;

  lease_end := now() + make_interval(
    hours => coalesce(lease_hours, 24)
  );

  select id
  into subscription_id
  from public.organization_subscriptions
  where organization_id = target_organization_id
  order by created_at desc
  limit 1;

  insert into public.offline_entitlement_leases(
    organization_id,
    device_id,
    validated_at,
    expires_at,
    subscription_id
  )
  values (
    target_organization_id,
    target_device_id,
    now(),
    lease_end,
    subscription_id
  )
  on conflict (organization_id, device_id)
  do update set
    validated_at = excluded.validated_at,
    expires_at = excluded.expires_at,
    subscription_id = excluded.subscription_id;

  return lease_end;
end
$$;

create or replace function public.offline_lease_allows_sale(
  target_organization_id uuid,
  target_device_id uuid,
  target_local_created_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_active_organization_member(target_organization_id)
    and exists (
      select 1
      from public.offline_devices device
      where device.organization_id = target_organization_id
        and device.id = target_device_id
        and device.status = 'ACTIVE'
        and public.can_access_branch(
          target_organization_id,
          device.branch_id
        )
    )
    and exists (
      select 1
      from public.offline_entitlement_leases lease
      where lease.organization_id = target_organization_id
        and lease.device_id = target_device_id
        and target_local_created_at between lease.validated_at and lease.expires_at
    )
$$;

create or replace function public.platform_set_commercial_access_mode(
  target_mode text,
  target_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_mode text;
begin
  if not public.is_platform_admin('platform.subscriptions.manage') then
    raise exception using errcode = '42501', message = 'PLATFORM_ADMIN_REQUIRED';
  end if;

  if target_mode not in ('OPEN_ACCESS', 'SUBSCRIPTION')
    or nullif(trim(target_reason), '') is null then
    raise exception using errcode = '22023', message = 'INVALID_ACCESS_MODE';
  end if;

  select settings.commercial_access_mode
  into previous_mode
  from public.platform_settings settings
  where settings.singleton
  for update;

  update public.platform_settings
  set commercial_access_mode = target_mode,
    updated_by = auth.uid()
  where singleton;

  insert into public.platform_audit_events(
    actor_id,
    action,
    target_type,
    target_id,
    reason,
    before_data,
    after_data
  )
  values (
    auth.uid(),
    'platform.commercial_access_mode.changed',
    'platform_setting',
    'commercial_access_mode',
    trim(target_reason),
    jsonb_build_object('mode', previous_mode),
    jsonb_build_object('mode', target_mode)
  );
end
$$;

revoke all on function public.platform_commercial_access_mode()
from public;
grant execute on function public.platform_commercial_access_mode()
to anon, authenticated;

revoke all on function public.platform_set_commercial_access_mode(text, text)
from public, anon;
grant execute on function public.platform_set_commercial_access_mode(text, text)
to authenticated;

commit;
