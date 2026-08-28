alter table public.pos_settings
  add column offline_enabled boolean not null default true,
  add column offline_price_policy text not null default 'ALLOW_STALE_WITH_WARNING'
    check (offline_price_policy in ('STRICT','ALLOW_STALE_WITH_WARNING','ALLOW_STALE')),
  add column offline_stock_policy text not null default 'BLOCK_IF_LOCAL_SNAPSHOT_INSUFFICIENT'
    check (offline_stock_policy in ('BLOCK_IF_LOCAL_SNAPSHOT_INSUFFICIENT','ALLOW_WITH_WARNING')),
  add column offline_credit_allowed boolean not null default false,
  add column offline_card_allowed boolean not null default false,
  add column offline_transfer_allowed boolean not null default false,
  add column offline_cache_max_age_hours integer not null default 24
    check (offline_cache_max_age_hours between 1 and 720),
  add column offline_history_retention_days integer not null default 30
    check (offline_history_retention_days between 1 and 365);

create table public.offline_devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  terminal_id uuid not null,
  device_identifier uuid not null,
  label text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','REVOKED')),
  app_version text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_successful_sync_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  registered_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, device_identifier),
  foreign key (organization_id, branch_id) references public.branches(organization_id, id),
  foreign key (organization_id, terminal_id) references public.pos_terminals(organization_id, id)
);

create table public.offline_sync_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  device_id uuid not null,
  branch_id uuid not null,
  local_transaction_id uuid,
  operation_type text not null check (operation_type in ('POS_SALE','CACHE_REFRESH','DEVICE_REGISTER','CONFLICT_REVIEW')),
  status text not null check (status in ('SYNCED','CONFLICT','FAILED_PERMANENT','RETRYABLE_ERROR')),
  error_code text,
  server_sale_id uuid,
  actor_id uuid not null references auth.users(id),
  attempted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  foreign key (organization_id, device_id) references public.offline_devices(organization_id, id),
  foreign key (organization_id, branch_id) references public.branches(organization_id, id),
  foreign key (organization_id, server_sale_id) references public.pos_sales(organization_id, id)
);

alter table public.pos_sales
  add column originated_offline boolean not null default false,
  add column offline_device_id uuid,
  add column local_transaction_id uuid,
  add column local_created_at timestamptz,
  add column server_received_at timestamptz,
  add column offline_request_hash text;

alter table public.pos_sales
  add constraint pos_sales_offline_device_fk
  foreign key (organization_id, offline_device_id)
  references public.offline_devices(organization_id, id);

create unique index pos_sales_offline_reference_unique
  on public.pos_sales(organization_id, offline_device_id, local_transaction_id)
  where originated_offline;
alter table public.pos_sales add constraint pos_sales_offline_metadata_check check (
  (not originated_offline and offline_device_id is null and local_transaction_id is null
    and local_created_at is null and server_received_at is null and offline_request_hash is null)
  or
  (originated_offline and offline_device_id is not null and local_transaction_id is not null
    and local_created_at is not null and server_received_at is not null and offline_request_hash is not null)
);
create index offline_devices_admin_idx
  on public.offline_devices(organization_id, branch_id, status, last_seen_at desc);
create index offline_sync_events_admin_idx
  on public.offline_sync_events(organization_id, device_id, attempted_at desc);
create index offline_sync_events_conflict_idx
  on public.offline_sync_events(organization_id, status, attempted_at desc)
  where status <> 'SYNCED';
