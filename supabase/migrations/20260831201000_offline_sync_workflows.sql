insert into public.permissions(code, description) values
  ('offline.use', 'Use approved offline point-of-sale continuity'),
  ('offline.sync', 'Replay queued offline operations'),
  ('offline.conflicts.view', 'View offline synchronization conflicts'),
  ('offline.conflicts.resolve', 'Resolve offline synchronization conflicts'),
  ('offline.devices.view', 'View registered offline devices'),
  ('offline.devices.manage', 'Manage registered offline devices'),
  ('offline.settings.manage', 'Manage offline operation settings')
on conflict (code) do update set description = excluded.description;

insert into public.role_permissions(organization_id, role_id, permission_id)
select r.organization_id, r.id, p.id
from public.roles r cross join public.permissions p
where r.is_system and r.name in ('Owner','Administrator') and p.code like 'offline.%'
on conflict do nothing;

insert into public.role_permissions(organization_id, role_id, permission_id)
select r.organization_id, r.id, p.id
from public.roles r cross join public.permissions p
where r.is_system and r.name = 'Cashier'
  and p.code in ('offline.use','offline.sync','offline.conflicts.view')
on conflict do nothing;

create or replace function public.register_offline_device(
  target_organization_id uuid,
  target_branch_id uuid,
  target_terminal_id uuid,
  target_device_identifier uuid,
  target_label text,
  target_app_version text
)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  result public.offline_devices%rowtype;
begin
  if actor is null or not public.has_permission(target_organization_id, 'offline.use')
    or not public.can_access_branch(target_organization_id, target_branch_id) then
    raise exception using errcode = '42501', message = 'PERMISSION_DENIED';
  end if;
  if not exists (
    select 1 from public.pos_terminals t
    where t.organization_id = target_organization_id and t.id = target_terminal_id
      and t.branch_id = target_branch_id and t.status = 'ACTIVE'
  ) then
    raise exception using errcode = 'P0001', message = 'SYNC_TERMINAL_REVOKED';
  end if;
  if nullif(trim(target_label), '') is null or nullif(trim(target_app_version), '') is null then
    raise exception using errcode = '22023', message = 'OFFLINE_DEVICE_INVALID';
  end if;

  insert into public.offline_devices(
    organization_id, branch_id, terminal_id, device_identifier, label,
    app_version, registered_by
  ) values (
    target_organization_id, target_branch_id, target_terminal_id,
    target_device_identifier, trim(target_label), trim(target_app_version), actor
  )
  on conflict (organization_id, device_identifier) do update set
    last_seen_at = now(), app_version = excluded.app_version,
    label = case when public.offline_devices.status = 'ACTIVE' then excluded.label else public.offline_devices.label end,
    updated_at = now()
  returning * into result;

  if result.status <> 'ACTIVE' or result.branch_id <> target_branch_id or result.terminal_id <> target_terminal_id then
    raise exception using errcode = '42501', message = 'SYNC_TERMINAL_REVOKED';
  end if;

  insert into public.audit_events(organization_id, actor_id, action, entity_type, entity_id, after_data)
  values (target_organization_id, actor, 'offline.device.registered', 'offline_device', result.id,
    jsonb_build_object('branch_id', result.branch_id, 'terminal_id', result.terminal_id));
  return result.id;
end $$;

create or replace function public.manage_offline_device(
  target_organization_id uuid,
  target_device_id uuid,
  target_label text,
  target_status text
)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  device public.offline_devices%rowtype;
begin
  select * into device from public.offline_devices
  where organization_id = target_organization_id and id = target_device_id for update;
  if not found then raise exception using errcode = 'P0001', message = 'CROSS_TENANT_REFERENCE'; end if;
  if actor is null or not public.has_permission(target_organization_id, 'offline.devices.manage')
    or not public.can_access_branch(target_organization_id, device.branch_id) then
    raise exception using errcode = '42501', message = 'PERMISSION_DENIED';
  end if;
  if target_status not in ('ACTIVE','REVOKED') or nullif(trim(target_label), '') is null then
    raise exception using errcode = '22023', message = 'OFFLINE_DEVICE_INVALID';
  end if;
  update public.offline_devices set label = trim(target_label), status = target_status,
    revoked_at = case when target_status = 'REVOKED' then now() else null end,
    revoked_by = case when target_status = 'REVOKED' then actor else null end,
    updated_at = now()
  where id = device.id;
  insert into public.audit_events(organization_id, actor_id, action, entity_type, entity_id, before_data, after_data)
  values (target_organization_id, actor, 'offline.device.' || lower(target_status), 'offline_device', device.id,
    jsonb_build_object('status', device.status, 'label', device.label),
    jsonb_build_object('status', target_status, 'label', trim(target_label)));
end $$;

create or replace function public.update_offline_settings(
  target_organization_id uuid,
  target_offline_enabled boolean,
  target_price_policy text,
  target_stock_policy text,
  target_credit_allowed boolean,
  target_card_allowed boolean,
  target_transfer_allowed boolean,
  target_cache_max_age_hours integer,
  target_history_retention_days integer
)
returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not public.has_permission(target_organization_id, 'offline.settings.manage') then
    raise exception using errcode = '42501', message = 'PERMISSION_DENIED';
  end if;
  update public.pos_settings set offline_enabled = target_offline_enabled,
    offline_price_policy = target_price_policy, offline_stock_policy = target_stock_policy,
    offline_credit_allowed = target_credit_allowed, offline_card_allowed = target_card_allowed,
    offline_transfer_allowed = target_transfer_allowed,
    offline_cache_max_age_hours = target_cache_max_age_hours,
    offline_history_retention_days = target_history_retention_days,
    updated_at = now(), updated_by = actor
  where organization_id = target_organization_id;
  if not found then raise exception using errcode = 'P0001', message = 'CROSS_TENANT_REFERENCE'; end if;
  insert into public.audit_events(organization_id, actor_id, action, entity_type, entity_id, after_data)
  values (target_organization_id, actor, 'offline.settings.updated', 'organization', target_organization_id,
    jsonb_build_object('enabled', target_offline_enabled, 'price_policy', target_price_policy,
      'stock_policy', target_stock_policy, 'credit_allowed', target_credit_allowed,
      'card_allowed', target_card_allowed, 'transfer_allowed', target_transfer_allowed));
end $$;

create or replace function public.replay_offline_pos_sale(
  target_organization_id uuid,
  target_device_id uuid,
  target_local_transaction_id uuid,
  target_local_created_at timestamptz,
  target_session_id uuid,
  target_customer_id uuid,
  target_lines jsonb,
  target_settlements jsonb,
  target_customer_credit_amount numeric,
  target_cash_tendered numeric,
  target_notes text,
  target_idempotency_key uuid
)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  device public.offline_devices%rowtype;
  session public.pos_sessions%rowtype;
  settings public.pos_settings%rowtype;
  existing public.pos_sales%rowtype;
  method_type text;
  result jsonb;
  sale_id uuid;
  offline_hash text;
begin
  if actor is null or not public.has_permission(target_organization_id, 'offline.sync')
    or not public.has_permission(target_organization_id, 'pos.sale.create') then
    raise exception using errcode = '42501', message = 'PERMISSION_DENIED';
  end if;
  select * into device from public.offline_devices
  where organization_id = target_organization_id and id = target_device_id for update;
  if not found then raise exception using errcode = 'P0001', message = 'CROSS_TENANT_REFERENCE'; end if;
  if device.status <> 'ACTIVE' then raise exception using errcode = '42501', message = 'SYNC_TERMINAL_REVOKED'; end if;
  if not public.can_access_branch(target_organization_id, device.branch_id) then
    raise exception using errcode = '42501', message = 'SYNC_BRANCH_ACCESS_REVOKED';
  end if;
  select * into session from public.pos_sessions
  where organization_id = target_organization_id and id = target_session_id for update;
  if not found or session.status <> 'OPEN' or session.cashier_user_id <> actor then
    raise exception using errcode = 'P0001', message = 'SYNC_SESSION_INVALID';
  end if;
  if session.branch_id <> device.branch_id or session.terminal_id <> device.terminal_id then
    raise exception using errcode = '42501', message = 'SYNC_TERMINAL_REVOKED';
  end if;
  if not exists (select 1 from public.pos_terminals t where t.organization_id = target_organization_id
    and t.id = device.terminal_id and t.status = 'ACTIVE') then
    raise exception using errcode = '42501', message = 'SYNC_TERMINAL_REVOKED';
  end if;
  select * into settings from public.pos_settings where organization_id = target_organization_id;
  if not coalesce(settings.offline_enabled, false) then
    raise exception using errcode = 'P0001', message = 'OFFLINE_DISABLED';
  end if;
  offline_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'organization_id', target_organization_id,
    'device_id', target_device_id,
    'local_transaction_id', target_local_transaction_id,
    'local_created_at', target_local_created_at,
    'session_id', target_session_id,
    'customer_id', target_customer_id,
    'lines', target_lines,
    'settlements', target_settlements,
    'customer_credit_amount', target_customer_credit_amount,
    'cash_tendered', target_cash_tendered
  )::text, 'UTF8'), 'sha256'), 'hex');
  select * into existing from public.pos_sales where organization_id = target_organization_id
    and offline_device_id = target_device_id and local_transaction_id = target_local_transaction_id;
  if found then
    if existing.idempotency_key <> target_idempotency_key or existing.offline_request_hash <> offline_hash then
      raise exception using errcode = 'P0001', message = 'SYNC_IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object('pos_sale_id', existing.id, 'receipt_number', existing.receipt_number,
      'invoice_id', existing.customer_invoice_id, 'inventory_transaction_id', existing.inventory_transaction_id,
      'replayed', true, 'originated_offline', true);
  end if;
  if coalesce(target_customer_credit_amount, 0) > 0 and not settings.offline_credit_allowed then
    raise exception using errcode = 'P0001', message = 'OFFLINE_CREDIT_NOT_ALLOWED';
  end if;
  if exists (select 1 from jsonb_array_elements(coalesce(target_settlements, '[]'::jsonb)) x
    where coalesce(x->>'source_type','PAYMENT') <> 'PAYMENT') then
    raise exception using errcode = 'P0001', message = 'OFFLINE_PAYMENT_METHOD_NOT_ALLOWED';
  end if;
  if exists (
    select 1 from jsonb_array_elements(coalesce(target_settlements, '[]'::jsonb)) x
    left join public.payment_methods m on m.organization_id = target_organization_id
      and m.id = nullif(x->>'payment_method_id','')::uuid
      and m.status = 'ACTIVE'
      and (m.branch_id is null or m.branch_id = device.branch_id)
    where m.id is null
  ) then
    raise exception using errcode = 'P0001', message = 'PAYMENT_METHOD_INACTIVE';
  end if;
  for method_type in
    select m.method_type from jsonb_array_elements(coalesce(target_settlements, '[]'::jsonb)) x
    join public.payment_methods m on m.organization_id = target_organization_id
      and m.id = (x->>'payment_method_id')::uuid
  loop
    if method_type = 'CASH' then null;
    elsif method_type = 'CARD' and settings.offline_card_allowed then null;
    elsif method_type = 'BANK_TRANSFER' and settings.offline_transfer_allowed then null;
    else raise exception using errcode = 'P0001', message = 'OFFLINE_PAYMENT_METHOD_NOT_ALLOWED';
    end if;
  end loop;

  result := public.post_pos_sale(target_organization_id, target_session_id, target_customer_id,
    target_lines, target_settlements, target_customer_credit_amount, target_cash_tendered,
    concat_ws(E'\n', nullif(trim(target_notes), ''), 'Offline local reference: ' || target_local_transaction_id::text),
    null, target_idempotency_key);
  sale_id := (result->>'pos_sale_id')::uuid;
  update public.pos_sales set originated_offline = true, offline_device_id = device.id,
    local_transaction_id = target_local_transaction_id, local_created_at = target_local_created_at,
    server_received_at = now(), offline_request_hash = offline_hash
  where organization_id = target_organization_id and id = sale_id;
  update public.offline_devices set last_seen_at = now(), last_successful_sync_at = now(),
    app_version = device.app_version, updated_at = now() where id = device.id;
  insert into public.offline_sync_events(organization_id, device_id, branch_id, local_transaction_id,
    operation_type, status, server_sale_id, actor_id, metadata)
  values (target_organization_id, device.id, device.branch_id, target_local_transaction_id,
    'POS_SALE', 'SYNCED', sale_id, actor,
    jsonb_build_object('local_created_at', target_local_created_at, 'server_received_at', now()));
  insert into public.audit_events(organization_id, actor_id, action, entity_type, entity_id, after_data)
  values (target_organization_id, actor, 'offline.sale.synced', 'pos_sale', sale_id,
    jsonb_build_object('device_id', device.id, 'local_transaction_id', target_local_transaction_id,
      'local_created_at', target_local_created_at));
  return result || jsonb_build_object('originated_offline', true, 'local_transaction_id', target_local_transaction_id);
exception when unique_violation then
  select * into existing from public.pos_sales where organization_id = target_organization_id
    and offline_device_id = target_device_id and local_transaction_id = target_local_transaction_id;
  if found and existing.idempotency_key = target_idempotency_key
    and existing.offline_request_hash = offline_hash then
    return jsonb_build_object('pos_sale_id', existing.id, 'receipt_number', existing.receipt_number,
      'invoice_id', existing.customer_invoice_id, 'inventory_transaction_id', existing.inventory_transaction_id,
      'replayed', true, 'originated_offline', true);
  end if;
  raise exception using errcode = 'P0001', message = 'SYNC_IDEMPOTENCY_CONFLICT';
end $$;

create or replace function public.record_offline_sync_failure(
  target_organization_id uuid,
  target_device_id uuid,
  target_local_transaction_id uuid,
  target_status text,
  target_error_code text
)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); device public.offline_devices%rowtype; result uuid := gen_random_uuid();
begin
  select * into device from public.offline_devices
  where organization_id = target_organization_id and id = target_device_id;
  if not found then raise exception using errcode = 'P0001', message = 'CROSS_TENANT_REFERENCE'; end if;
  if actor is null or not public.has_permission(target_organization_id, 'offline.sync')
    or not public.can_access_branch(target_organization_id, device.branch_id) then
    raise exception using errcode = '42501', message = 'PERMISSION_DENIED';
  end if;
  if target_status not in ('CONFLICT','FAILED_PERMANENT','RETRYABLE_ERROR') then
    raise exception using errcode = '22023', message = 'OFFLINE_SYNC_STATUS_INVALID';
  end if;
  insert into public.offline_sync_events(id, organization_id, device_id, branch_id,
    local_transaction_id, operation_type, status, error_code, actor_id)
  values (result, target_organization_id, device.id, device.branch_id,
    target_local_transaction_id, 'POS_SALE', target_status, left(target_error_code, 100), actor);
  if target_status = 'CONFLICT' then
    insert into public.audit_events(organization_id, actor_id, action, entity_type, entity_id, after_data)
    values (target_organization_id, actor, 'offline.sync.conflict', 'offline_device', device.id,
      jsonb_build_object('local_transaction_id', target_local_transaction_id, 'error_code', left(target_error_code, 100)));
  end if;
  return result;
end $$;
