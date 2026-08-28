begin;

create table public.platform_settings (
  singleton boolean primary key default true check (singleton),
  default_trial_days integer not null default 14 check (default_trial_days between 0 and 365),
  default_trial_plan_id uuid,
  grace_period_days integer not null default 7 check (grace_period_days between 0 and 90),
  offline_entitlement_lease_hours integer not null default 24 check (offline_entitlement_lease_hours between 1 and 168),
  support_contact text,
  billing_provider text not null default 'MANUAL' check (billing_provider in ('MANUAL','PAYSTACK','FLUTTERWAVE','STRIPE')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED')),
  capabilities text[] not null default array['platform.tenants.view','platform.subscriptions.view'],
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table public.platform_features (
  feature_code text primary key check (feature_code ~ '^[a-z][a-z0-9_.-]+$'),
  name text not null,
  description text not null default '',
  category text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saas_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z][A-Z0-9_]+$'),
  name text not null,
  description text not null default '',
  status text not null default 'DRAFT' check (status in ('DRAFT','ACTIVE','ARCHIVED')),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  monthly_price numeric(20,4) not null default 0 check (monthly_price >= 0),
  annual_price numeric(20,4) not null default 0 check (annual_price >= 0),
  trial_days integer not null default 14 check (trial_days between 0 and 365),
  display_order integer not null default 0,
  is_public boolean not null default true,
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_settings add constraint platform_settings_trial_plan_fk foreign key (default_trial_plan_id) references public.saas_plans(id);

create table public.plan_entitlements (
  plan_id uuid not null references public.saas_plans(id),
  feature_code text not null references public.platform_features(feature_code),
  entitlement_type text not null check (entitlement_type in ('BOOLEAN','LIMIT','QUOTA','ENUM')),
  enabled boolean,
  numeric_value numeric(20,4),
  text_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (plan_id, feature_code),
  check ((entitlement_type='BOOLEAN' and enabled is not null) or (entitlement_type in ('LIMIT','QUOTA') and numeric_value is not null and numeric_value >= 0) or (entitlement_type='ENUM' and text_value is not null))
);

create table public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  plan_id uuid not null references public.saas_plans(id),
  billing_interval text not null check (billing_interval in ('MONTHLY','ANNUAL','CUSTOM')),
  status text not null check (status in ('TRIALING','ACTIVE','PAST_DUE','GRACE_PERIOD','CANCELLED','EXPIRED','SUSPENDED')),
  access_mode text not null check (access_mode in ('FULL_ACCESS','GRACE_ACCESS','READ_ONLY','SUSPENDED')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_period_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  provider text not null default 'MANUAL' check (provider in ('MANUAL','PAYSTACK','FLUTTERWAVE','STRIPE')),
  provider_customer_id text,
  provider_subscription_id text,
  price_snapshot numeric(20,4) not null check (price_snapshot >= 0),
  currency_snapshot text not null check (currency_snapshot ~ '^[A-Z]{3}$'),
  manual_override boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id)
);
create unique index organization_one_live_subscription on public.organization_subscriptions(organization_id) where status in ('TRIALING','ACTIVE','PAST_DUE','GRACE_PERIOD','SUSPENDED');
create unique index organization_provider_subscription_unique on public.organization_subscriptions(provider, provider_subscription_id) where provider_subscription_id is not null;

create table public.organization_entitlement_overrides (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  feature_code text not null references public.platform_features(feature_code), entitlement_type text not null check (entitlement_type in ('BOOLEAN','LIMIT','QUOTA','ENUM')),
  enabled boolean, numeric_value numeric(20,4), text_value text, reason text not null, expires_at timestamptz,
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
  unique (organization_id, feature_code)
);

create table public.platform_feature_flags (
  id uuid primary key default gen_random_uuid(), feature_code text not null references public.platform_features(feature_code),
  scope text not null check (scope in ('GLOBAL','ORGANIZATION')), organization_id uuid references public.organizations(id),
  enabled boolean not null, reason text not null, updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((scope='GLOBAL' and organization_id is null) or (scope='ORGANIZATION' and organization_id is not null))
);
create unique index platform_feature_flags_global_unique on public.platform_feature_flags(feature_code) where scope='GLOBAL';
create unique index platform_feature_flags_org_unique on public.platform_feature_flags(feature_code,organization_id) where scope='ORGANIZATION';

create table public.platform_billing_transactions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  subscription_id uuid references public.organization_subscriptions(id), plan_id uuid not null references public.saas_plans(id),
  billing_period_start timestamptz, billing_period_end timestamptz, amount numeric(20,4) not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'), provider text not null, provider_reference text,
  status text not null check (status in ('PENDING','PAID','FAILED','REFUNDED','VOID')), paid_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index platform_billing_provider_reference_unique on public.platform_billing_transactions(provider,provider_reference) where provider_reference is not null;

create table public.platform_webhook_events (
  id uuid primary key default gen_random_uuid(), provider text not null, provider_event_id text not null,
  payload_hash text not null, event_type text not null, status text not null check (status in ('RECEIVED','PROCESSED','FAILED')),
  received_at timestamptz not null default now(), processed_at timestamptz, error text,
  unique (provider, provider_event_id)
);

create table public.platform_audit_events (
  id bigint generated always as identity primary key, actor_id uuid references auth.users(id), action text not null,
  target_type text not null, target_id text, reason text, before_data jsonb not null default '{}'::jsonb,
  after_data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create table public.offline_entitlement_leases (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null, device_id uuid not null,
  feature_code text not null default 'offline' references public.platform_features(feature_code),
  validated_at timestamptz not null, expires_at timestamptz not null, subscription_id uuid references public.organization_subscriptions(id),
  created_at timestamptz not null default now(), unique (organization_id,device_id),
  foreign key (organization_id,device_id) references public.offline_devices(organization_id,id), check (expires_at > validated_at)
);

alter table public.organizations add column platform_suspended_at timestamptz, add column platform_suspension_reason text;

create or replace function public.is_platform_admin(required_capability text default null) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.platform_admins a where a.user_id=auth.uid() and a.status='ACTIVE' and (required_capability is null or required_capability=any(a.capabilities)))
$$;

create or replace function public.organization_access_mode(target_organization_id uuid) returns text
language sql stable security definer set search_path='' as $$
 select case when o.platform_suspended_at is not null then 'SUSPENDED'
  else coalesce((select case
    when s.status='SUSPENDED' then 'SUSPENDED'
    when s.status in ('ACTIVE','TRIALING') and (s.status<>'TRIALING' or s.trial_ends_at>now()) then 'FULL_ACCESS'
    when s.status in ('PAST_DUE','GRACE_PERIOD') and coalesce(s.grace_period_ends_at,now())>now() then 'GRACE_ACCESS'
    else 'READ_ONLY' end
    from public.organization_subscriptions s where s.organization_id=o.id order by s.created_at desc limit 1),'READ_ONLY') end
 from public.organizations o where o.id=target_organization_id
$$;

create or replace function public.organization_entitlement(target_organization_id uuid,target_feature_code text) returns jsonb
language sql stable security definer set search_path='' as $$
 with subscription as (select s.plan_id from public.organization_subscriptions s where s.organization_id=target_organization_id order by s.created_at desc limit 1),
 e as (select pe.entitlement_type,pe.enabled,pe.numeric_value,pe.text_value from subscription s join public.plan_entitlements pe on pe.plan_id=s.plan_id and pe.feature_code=target_feature_code),
 o as (select x.entitlement_type,x.enabled,x.numeric_value,x.text_value from public.organization_entitlement_overrides x where x.organization_id=target_organization_id and x.feature_code=target_feature_code and (x.expires_at is null or x.expires_at>now())),
 flag as (select coalesce((select f.enabled from public.platform_feature_flags f where f.feature_code=target_feature_code and f.scope='ORGANIZATION' and f.organization_id=target_organization_id),(select f.enabled from public.platform_feature_flags f where f.feature_code=target_feature_code and f.scope='GLOBAL'),true) enabled)
 select jsonb_build_object('feature_code',target_feature_code,'type',coalesce(o.entitlement_type,e.entitlement_type),'enabled',case when flag.enabled then coalesce(o.enabled,e.enabled,coalesce(o.numeric_value,e.numeric_value)>0,false) else false end,'numeric_value',coalesce(o.numeric_value,e.numeric_value),'text_value',coalesce(o.text_value,e.text_value),'access_mode',public.organization_access_mode(target_organization_id)) from e full join o on true cross join flag
$$;

create or replace function public.organization_has_feature(target_organization_id uuid,target_feature_code text) returns boolean
language sql stable security definer set search_path='' as $$
 select public.is_active_organization_member(target_organization_id) and public.organization_access_mode(target_organization_id) in ('FULL_ACCESS','GRACE_ACCESS') and coalesce((public.organization_entitlement(target_organization_id,target_feature_code)->>'enabled')::boolean,false)
$$;

create or replace function public.assert_organization_feature(target_organization_id uuid,target_feature_code text,write_required boolean default false) returns void
language plpgsql stable security definer set search_path='' as $$ declare mode text; begin
 if not public.is_active_organization_member(target_organization_id) then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 mode:=public.organization_access_mode(target_organization_id);
 if mode='SUSPENDED' then raise exception using errcode='42501',message='TENANT_SUSPENDED'; end if;
 if write_required and mode not in ('FULL_ACCESS','GRACE_ACCESS') then raise exception using errcode='42501',message='SUBSCRIPTION_EXPIRED'; end if;
 if not coalesce((public.organization_entitlement(target_organization_id,target_feature_code)->>'enabled')::boolean,false) then raise exception using errcode='42501',message='FEATURE_NOT_INCLUDED'; end if;
end $$;

create or replace function public.organization_usage(target_organization_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$ select case when public.is_active_organization_member(target_organization_id) or public.is_platform_admin('platform.tenants.view') then jsonb_build_object('branches',(select count(*) from public.branches where organization_id=target_organization_id and status<>'archived'),'staff',(select count(*) from public.organization_members where organization_id=target_organization_id and status in ('active','invited')),'warehouses',(select count(*) from public.warehouses where organization_id=target_organization_id and status<>'archived'),'pos_terminals',(select count(*) from public.pos_terminals where organization_id=target_organization_id and status='ACTIVE'),'offline_devices',(select count(*) from public.offline_devices where organization_id=target_organization_id and status='ACTIVE')) else null end $$;

create or replace function public.assert_organization_limit(target_organization_id uuid,target_feature_code text,current_usage bigint) returns void
language plpgsql stable security definer set search_path='' as $$ declare e jsonb; limit_value numeric; begin
 perform public.assert_organization_feature(target_organization_id,target_feature_code,true); e:=public.organization_entitlement(target_organization_id,target_feature_code); limit_value:=nullif(e->>'numeric_value','')::numeric;
 if limit_value is not null and current_usage>=limit_value then raise exception using errcode='P0001',message='PLAN_LIMIT_REACHED'; end if;
end $$;

create or replace function public.issue_offline_entitlement_lease(target_organization_id uuid,target_device_id uuid) returns timestamptz
language plpgsql security definer set search_path='' as $$ declare lease_hours int; lease_end timestamptz; sub_id uuid; begin
 perform public.assert_organization_feature(target_organization_id,'offline',true);
 if not exists(select 1 from public.offline_devices where organization_id=target_organization_id and id=target_device_id and status='ACTIVE') then raise exception using errcode='42501',message='SYNC_TERMINAL_REVOKED'; end if;
 select offline_entitlement_lease_hours into lease_hours from public.platform_settings where singleton; lease_end:=now()+make_interval(hours=>coalesce(lease_hours,24));
 select id into sub_id from public.organization_subscriptions where organization_id=target_organization_id order by created_at desc limit 1;
 insert into public.offline_entitlement_leases(organization_id,device_id,validated_at,expires_at,subscription_id) values(target_organization_id,target_device_id,now(),lease_end,sub_id) on conflict(organization_id,device_id) do update set validated_at=excluded.validated_at,expires_at=excluded.expires_at,subscription_id=excluded.subscription_id;
 return lease_end; end $$;

create or replace function public.offline_lease_allows_sale(target_organization_id uuid,target_device_id uuid,target_local_created_at timestamptz) returns boolean
language sql stable security definer set search_path='' as $$ select exists(select 1 from public.offline_entitlement_leases l where l.organization_id=target_organization_id and l.device_id=target_device_id and target_local_created_at between l.validated_at and l.expires_at) $$;

insert into public.platform_features(feature_code,name,description,category) values
('core.catalogue','Catalogue','Product catalogue','Core'),('core.inventory','Inventory','Inventory control','Core'),('procurement','Procurement','Purchasing workflows','Operations'),('sales','Sales','Sales workflows','Operations'),('payments','Payments','Tenant payment settlement','Operations'),('pos','Point of sale','POS checkout and terminals','Operations'),('offline','Offline POS','Time-limited offline continuity','Operations'),('finance','Finance','General ledger and reporting','Finance'),('advanced_reports','Advanced reports','Advanced reporting tier','Analytics'),('multi_branch','Multiple branches','Branch capacity','Limits'),('staff','Team members','Staff capacity','Limits'),('warehouses','Warehouses','Warehouse capacity','Limits'),('pos_terminals','POS terminals','Terminal capacity','Limits'),('offline_devices','Offline devices','Device capacity','Limits'),('custom_roles','Custom roles','Custom organization roles','Administration'),('api_access','API access','External API access','Platform') on conflict do nothing;

insert into public.platform_settings(singleton) values(true) on conflict do nothing;

alter table public.platform_settings enable row level security; alter table public.platform_settings force row level security;
alter table public.platform_admins enable row level security; alter table public.platform_admins force row level security;
alter table public.platform_features enable row level security; alter table public.platform_features force row level security;
alter table public.saas_plans enable row level security; alter table public.saas_plans force row level security;
alter table public.plan_entitlements enable row level security; alter table public.plan_entitlements force row level security;
alter table public.organization_subscriptions enable row level security; alter table public.organization_subscriptions force row level security;
alter table public.organization_entitlement_overrides enable row level security; alter table public.organization_entitlement_overrides force row level security;
alter table public.platform_feature_flags enable row level security; alter table public.platform_feature_flags force row level security;
alter table public.platform_billing_transactions enable row level security; alter table public.platform_billing_transactions force row level security;
alter table public.platform_webhook_events enable row level security; alter table public.platform_webhook_events force row level security;
alter table public.platform_audit_events enable row level security; alter table public.platform_audit_events force row level security;
alter table public.offline_entitlement_leases enable row level security; alter table public.offline_entitlement_leases force row level security;

create policy platform_features_tenant_read on public.platform_features for select to authenticated using(status='ACTIVE');
create policy plans_public_or_admin_read on public.saas_plans for select to authenticated using((status='ACTIVE' and is_public) or public.is_platform_admin('platform.plans.manage'));
create policy entitlements_plan_read on public.plan_entitlements for select to authenticated using(exists(select 1 from public.saas_plans p where p.id=plan_id and p.status='ACTIVE' and p.is_public) or public.is_platform_admin('platform.plans.manage'));
create policy subscription_tenant_read on public.organization_subscriptions for select to authenticated using(public.is_active_organization_member(organization_id) or public.is_platform_admin('platform.subscriptions.view'));
create policy overrides_tenant_read on public.organization_entitlement_overrides for select to authenticated using(public.is_active_organization_member(organization_id) or public.is_platform_admin('platform.subscriptions.view'));
create policy billing_tenant_read on public.platform_billing_transactions for select to authenticated using(public.is_active_organization_member(organization_id) or public.is_platform_admin('platform.billing.view'));
create policy leases_tenant_read on public.offline_entitlement_leases for select to authenticated using(public.is_active_organization_member(organization_id));
create policy platform_admin_self_read on public.platform_admins for select to authenticated using(user_id=auth.uid());
create policy platform_settings_admin_read on public.platform_settings for select to authenticated using(public.is_platform_admin(null));
create policy feature_flags_admin_read on public.platform_feature_flags for select to authenticated using(public.is_platform_admin('platform.features.manage'));
create policy platform_audit_admin_read on public.platform_audit_events for select to authenticated using(public.is_platform_admin('platform.audit.view'));

grant select on public.platform_features,public.saas_plans,public.plan_entitlements,public.organization_subscriptions,public.organization_entitlement_overrides,public.platform_billing_transactions,public.offline_entitlement_leases,public.platform_admins,public.platform_settings,public.platform_feature_flags,public.platform_audit_events to authenticated;
revoke all on public.platform_webhook_events from anon,authenticated;
grant execute on function public.is_platform_admin(text),public.organization_access_mode(uuid),public.organization_entitlement(uuid,text),public.organization_has_feature(uuid,text),public.assert_organization_feature(uuid,text,boolean),public.organization_usage(uuid),public.assert_organization_limit(uuid,text,bigint),public.issue_offline_entitlement_lease(uuid,uuid),public.offline_lease_allows_sale(uuid,uuid,timestamptz) to authenticated;

create trigger platform_settings_updated before update on public.platform_settings for each row execute function public.set_updated_at();
create trigger platform_admins_updated before update on public.platform_admins for each row execute function public.set_updated_at();
create trigger platform_features_updated before update on public.platform_features for each row execute function public.set_updated_at();
create trigger saas_plans_updated before update on public.saas_plans for each row execute function public.set_updated_at();
create trigger plan_entitlements_updated before update on public.plan_entitlements for each row execute function public.set_updated_at();
create trigger organization_subscriptions_updated before update on public.organization_subscriptions for each row execute function public.set_updated_at();
create trigger platform_feature_flags_updated before update on public.platform_feature_flags for each row execute function public.set_updated_at();

commit;
