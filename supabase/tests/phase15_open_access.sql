begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = pgtap, extensions, public;
grant select, insert, update, delete on all tables in schema public to authenticated;
select plan(39);

select has_column(
  'public',
  'platform_settings',
  'commercial_access_mode',
  'central commercial access mode is persisted'
);
select has_function(
  'public',
  'platform_commercial_access_mode',
  array[]::text[],
  'central commercial access mode function exists'
);
select has_function(
  'public',
  'platform_set_commercial_access_mode',
  array['text', 'text'],
  'audited commercial mode switch exists'
);
select is(
  public.platform_commercial_access_mode(),
  'OPEN_ACCESS',
  'temporary open access is active'
);

insert into auth.users(
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-4000-8000-000000015001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'open-owner@example.test',
    '',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000015002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'open-outsider@example.test',
    '',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000015003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'open-restricted@example.test',
    '',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000015004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'open-platform@example.test',
    '',
    now(),
    now(),
    now()
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015001","role":"authenticated"}',
  true
);
select lives_ok(
  $$select public.create_organization(
    'Open Access Test',
    'open-access-test',
    'GB',
    'GBP',
    'Europe/London'
  )$$,
  'authenticated owner creates an organization'
);

set local role postgres;
select set_config(
  'test.open_org',
  (select id::text from public.organizations where slug = 'open-access-test'),
  true
);
select set_config(
  'test.open_business',
  (
    select id::text
    from public.businesses
    where organization_id = current_setting('test.open_org')::uuid
    limit 1
  ),
  true
);

update public.organization_subscriptions
set plan_id = (select id from public.saas_plans where code = 'STARTER'),
  status = 'TRIALING',
  access_mode = 'READ_ONLY',
  trial_ends_at = now() - interval '1 day'
where organization_id = current_setting('test.open_org')::uuid;

insert into public.branches(
  id,
  organization_id,
  business_id,
  name,
  code,
  status,
  timezone,
  created_by
)
values
  (
    '00000000-0000-4000-8000-000000015101',
    current_setting('test.open_org')::uuid,
    current_setting('test.open_business')::uuid,
    'Open Branch A',
    'OPEN-A',
    'active',
    'Europe/London',
    '00000000-0000-4000-8000-000000015001'
  ),
  (
    '00000000-0000-4000-8000-000000015102',
    current_setting('test.open_org')::uuid,
    current_setting('test.open_business')::uuid,
    'Open Branch B',
    'OPEN-B',
    'active',
    'Europe/London',
    '00000000-0000-4000-8000-000000015001'
  );

insert into public.warehouses(
  id,
  organization_id,
  branch_id,
  business_id,
  name,
  code,
  warehouse_type,
  status,
  is_default,
  created_by
)
values (
  '00000000-0000-4000-8000-000000015201',
  current_setting('test.open_org')::uuid,
  '00000000-0000-4000-8000-000000015101',
  current_setting('test.open_business')::uuid,
  'Open Warehouse',
  'OPEN-WH',
  'SHOP_FLOOR',
  'active',
  true,
  '00000000-0000-4000-8000-000000015001'
);

insert into public.customers(
  id,
  organization_id,
  customer_code,
  customer_type,
  display_name,
  default_currency,
  created_by
)
values (
  '00000000-0000-4000-8000-000000015301',
  current_setting('test.open_org')::uuid,
  'OPEN-WALK-IN',
  'INDIVIDUAL',
  'Open Access Walk-in',
  'GBP',
  '00000000-0000-4000-8000-000000015001'
);

insert into public.organization_members(
  id,
  organization_id,
  user_id,
  status,
  joined_at
)
values (
  '00000000-0000-4000-8000-000000015401',
  current_setting('test.open_org')::uuid,
  '00000000-0000-4000-8000-000000015003',
  'active',
  now()
);

insert into public.roles(
  id,
  organization_id,
  name,
  description
)
values (
  '00000000-0000-4000-8000-000000015501',
  current_setting('test.open_org')::uuid,
  'Open Access Restricted',
  'Restricted role used to prove open access does not bypass RBAC'
);

insert into public.role_permissions(
  organization_id,
  role_id,
  permission_id
)
select
  current_setting('test.open_org')::uuid,
  '00000000-0000-4000-8000-000000015501',
  permission.id
from public.permissions permission
where permission.code = 'products.view';

insert into public.member_roles(
  organization_id,
  membership_id,
  role_id
)
values (
  current_setting('test.open_org')::uuid,
  '00000000-0000-4000-8000-000000015401',
  '00000000-0000-4000-8000-000000015501'
);

insert into public.member_branch_access(
  organization_id,
  membership_id,
  branch_id
)
values (
  current_setting('test.open_org')::uuid,
  '00000000-0000-4000-8000-000000015401',
  '00000000-0000-4000-8000-000000015101'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015001","role":"authenticated"}',
  true
);
select is(
  public.organization_access_mode(current_setting('test.open_org')::uuid),
  'FULL_ACCESS',
  'open access ignores trial expiration'
);

set local role postgres;
update public.organization_subscriptions
set status = 'EXPIRED',
  access_mode = 'READ_ONLY'
where organization_id = current_setting('test.open_org')::uuid;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015001","role":"authenticated"}',
  true
);
select is(
  public.organization_access_mode(current_setting('test.open_org')::uuid),
  'FULL_ACCESS',
  'open access ignores expired billing status'
);

set local role postgres;
update public.organization_subscriptions
set status = 'SUSPENDED',
  access_mode = 'SUSPENDED'
where organization_id = current_setting('test.open_org')::uuid;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015001","role":"authenticated"}',
  true
);
select is(
  public.organization_access_mode(current_setting('test.open_org')::uuid),
  'FULL_ACCESS',
  'open access ignores subscription suspension status'
);
select ok(
  public.organization_has_feature(
    current_setting('test.open_org')::uuid,
    'pos'
  ),
  'open access grants a feature disabled by the recorded Starter plan'
);
select ok(
  public.organization_has_feature(
    current_setting('test.open_org')::uuid,
    'finance'
  ),
  'open access grants all implemented functional features'
);
select is(
  public.organization_entitlement(
    current_setting('test.open_org')::uuid,
    'multi_branch'
  ) ->> 'numeric_value',
  null,
  'open access removes plan capacity limits'
);
select lives_ok(
  format(
    $query$select public.assert_organization_limit('%s', 'multi_branch', 999999)$query$,
    current_setting('test.open_org')
  ),
  'open access ignores plan usage limits'
);
select is(
  public.organization_has_feature(
    current_setting('test.open_org')::uuid,
    'not-a-real-feature'
  ),
  false,
  'open access does not enable unregistered functionality'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok(
  format(
    $query$select public.organization_has_feature('%s', 'finance')$query$,
    current_setting('test.open_org')
  ),
  '42501',
  'permission denied for function organization_has_feature',
  'authentication is still required'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015002","role":"authenticated"}',
  true
);
select is(
  public.organization_has_feature(
    current_setting('test.open_org')::uuid,
    'finance'
  ),
  false,
  'organization membership is still required'
);
select throws_ok(
  format(
    $query$select public.assert_organization_feature('%s', 'finance', true)$query$,
    current_setting('test.open_org')
  ),
  '42501',
  'PERMISSION_DENIED',
  'feature assertion rejects a cross-tenant outsider'
);
select is(
  (
    select count(*)::integer
    from public.organizations
    where id = current_setting('test.open_org')::uuid
  ),
  0,
  'tenant RLS still hides the organization from outsiders'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015003","role":"authenticated"}',
  true
);
select ok(
  public.has_permission(
    current_setting('test.open_org')::uuid,
    'products.view'
  ),
  'assigned RBAC capability remains available'
);
select ok(
  not public.has_permission(
    current_setting('test.open_org')::uuid,
    'pos.sale.create'
  ),
  'open access does not grant missing RBAC capabilities'
);
select is(
  (
    select count(*)::integer
    from public.branches
    where organization_id = current_setting('test.open_org')::uuid
  ),
  1,
  'branch-scoped RLS still filters tenant records'
);
select ok(
  public.can_access_branch(
    current_setting('test.open_org')::uuid,
    '00000000-0000-4000-8000-000000015101'
  ),
  'assigned branch access remains valid'
);
select ok(
  not public.can_access_branch(
    current_setting('test.open_org')::uuid,
    '00000000-0000-4000-8000-000000015102'
  ),
  'unassigned branch access remains denied'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015002","role":"authenticated"}',
  true
);
select throws_ok(
  $$select public.platform_set_commercial_access_mode(
    'SUBSCRIPTION',
    'unauthorized attempt'
  )$$,
  '42501',
  'PLATFORM_ADMIN_REQUIRED',
  'tenant users cannot change the platform access mode'
);

set local role postgres;
insert into public.platform_admins(
  user_id,
  status,
  capabilities,
  created_by
)
values (
  '00000000-0000-4000-8000-000000015004',
  'ACTIVE',
  array['platform.subscriptions.manage', 'platform.subscriptions.view'],
  '00000000-0000-4000-8000-000000015004'
);
update public.organization_subscriptions
set status = 'EXPIRED',
  access_mode = 'READ_ONLY'
where organization_id = current_setting('test.open_org')::uuid;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015004","role":"authenticated"}',
  true
);
select lives_ok(
  $$select public.platform_set_commercial_access_mode(
    'SUBSCRIPTION',
    'verify retained subscription enforcement'
  )$$,
  'platform administrator can restore subscription mode'
);
select is(
  public.platform_commercial_access_mode(),
  'SUBSCRIPTION',
  'subscription mode is restored without schema changes'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015001","role":"authenticated"}',
  true
);
select is(
  public.organization_access_mode(current_setting('test.open_org')::uuid),
  'READ_ONLY',
  'existing subscription expiration behavior remains testable'
);
select is(
  public.organization_has_feature(
    current_setting('test.open_org')::uuid,
    'finance'
  ),
  false,
  'subscription mode restores recorded entitlement enforcement'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015004","role":"authenticated"}',
  true
);
select lives_ok(
  $$select public.platform_set_commercial_access_mode(
    'OPEN_ACCESS',
    'continue temporary launch access'
  )$$,
  'platform administrator can restore open access'
);
select is(
  public.platform_commercial_access_mode(),
  'OPEN_ACCESS',
  'open access switch is non-destructive'
);
select is(
  (
    select count(*)::integer
    from public.platform_audit_events
    where action = 'platform.commercial_access_mode.changed'
      and target_id = 'commercial_access_mode'
  ),
  2,
  'commercial mode changes are audited'
);

set local role postgres;
update public.organizations
set platform_suspended_at = now(),
  platform_suspension_reason = 'security review'
where id = current_setting('test.open_org')::uuid;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015001","role":"authenticated"}',
  true
);
select is(
  public.organization_access_mode(current_setting('test.open_org')::uuid),
  'SUSPENDED',
  'platform security suspension overrides open access'
);
select throws_ok(
  format(
    $query$select public.assert_organization_feature('%s', 'finance', true)$query$,
    current_setting('test.open_org')
  ),
  '42501',
  'TENANT_SUSPENDED',
  'platform suspension still blocks tenant functionality'
);

set local role postgres;
update public.organizations
set platform_suspended_at = null,
  platform_suspension_reason = null
where id = current_setting('test.open_org')::uuid;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015001","role":"authenticated"}',
  true
);
select set_config(
  'test.open_account',
  public.create_payment_account(
    current_setting('test.open_org')::uuid,
    '00000000-0000-4000-8000-000000015101',
    'OPEN-TILL',
    'Open Access Till',
    'CASH',
    'GBP',
    'Open access offline lease verification'
  )::text,
  true
);
select ok(
  current_setting('test.open_account', true) is not null,
  'owner creates an offline cash account'
);
select set_config(
  'test.open_location',
  (
    select id::text
    from public.storage_locations
    where warehouse_id = '00000000-0000-4000-8000-000000015201'
      and location_type = 'ROOT'
    limit 1
  ),
  true
);
select set_config(
  'test.open_terminal',
  public.create_pos_terminal(
    current_setting('test.open_org')::uuid,
    '00000000-0000-4000-8000-000000015101',
    'OPEN-POS',
    'Open Access POS',
    '00000000-0000-4000-8000-000000015201',
    current_setting('test.open_location')::uuid,
    '00000000-0000-4000-8000-000000015301',
    current_setting('test.open_account')::uuid,
    '80MM',
    'Thank you'
  )::text,
  true
);
select ok(
  current_setting('test.open_terminal', true) is not null,
  'open access allows POS terminal creation despite the Starter plan limit'
);
select set_config(
  'test.open_device',
  public.register_offline_device(
    current_setting('test.open_org')::uuid,
    '00000000-0000-4000-8000-000000015101',
    current_setting('test.open_terminal')::uuid,
    '00000000-0000-4000-8000-000000015601',
    'Open Access Device',
    '8.0.0'
  )::text,
  true
);
select ok(
  current_setting('test.open_device', true) is not null,
  'open access allows a permissioned offline device registration'
);
select set_config(
  'test.open_lease',
  public.issue_offline_entitlement_lease(
    current_setting('test.open_org')::uuid,
    current_setting('test.open_device')::uuid
  )::text,
  true
);
select ok(
  current_setting('test.open_lease')::timestamptz > now()
    and current_setting('test.open_lease')::timestamptz
      <= now() + interval '168 hours',
  'open access issues a finite offline entitlement lease'
);
select ok(
  public.offline_lease_allows_sale(
    current_setting('test.open_org')::uuid,
    current_setting('test.open_device')::uuid,
    now()
  ),
  'offline sale creation time must remain inside the finite lease'
);

set local role postgres;
update public.offline_devices
set status = 'REVOKED',
  revoked_at = now()
where id = current_setting('test.open_device')::uuid;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000015001","role":"authenticated"}',
  true
);
select throws_ok(
  format(
    $query$select public.issue_offline_entitlement_lease('%s', '%s')$query$,
    current_setting('test.open_org'),
    current_setting('test.open_device')
  ),
  '42501',
  'SYNC_TERMINAL_REVOKED',
  'open access does not bypass offline device revocation'
);
select ok(
  not public.offline_lease_allows_sale(
    current_setting('test.open_org')::uuid,
    current_setting('test.open_device')::uuid,
    now()
  ),
  'revoked offline devices cannot use an existing lease'
);

select * from finish();
rollback;
