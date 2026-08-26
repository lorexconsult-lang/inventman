-- Phase 2: authoritative inventory ledger schema. Quantities numeric(24,6), costs numeric(24,8).
create table public.inventory_settings (
  organization_id uuid primary key references public.organizations(id),
  costing_method text not null default 'WEIGHTED_AVERAGE' check (costing_method in ('WEIGHTED_AVERAGE','FIFO')),
  negative_stock_policy text not null default 'DISALLOW' check (negative_stock_policy in ('DISALLOW','AUTHORIZED_OVERRIDE')),
  count_mode text not null default 'BLIND' check (count_mode in ('BLIND','VISIBLE')),
  quantity_precision smallint not null default 6 check (quantity_precision between 0 and 6),
  inventory_timezone text not null default 'UTC', allow_backdated boolean not null default false,
  accounting_start_date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.inventory_reason_codes (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
  code text not null, name text not null, applicable_types text[] not null default '{}', requires_notes boolean not null default false,
  is_system boolean not null default false, is_active boolean not null default true, created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint inventory_reason_org_id_key unique(organization_id,id), constraint inventory_reason_code_key unique(organization_id,code)
);

create table public.inventory_number_counters (
  organization_id uuid not null references public.organizations(id), prefix text not null, next_value bigint not null default 1 check(next_value>0),
  updated_at timestamptz not null default now(), primary key(organization_id,prefix)
);

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), business_id uuid not null,
  transaction_number text not null, transaction_type text not null check(transaction_type in ('OPENING_STOCK','MANUAL_RECEIPT','MANUAL_ISSUE','ADJUSTMENT_IN','ADJUSTMENT_OUT','DAMAGE','EXPIRY','LOSS','TRANSFER_DISPATCH','TRANSFER_RECEIPT','TRANSFER_DISCREPANCY','STOCK_COUNT_ADJUSTMENT','REVERSAL','PURCHASE_RECEIPT','PURCHASE_RETURN','SALE','SALE_RETURN','PRODUCTION_OUTPUT','PRODUCTION_CONSUMPTION','RECIPE_CONSUMPTION','BUNDLE_ASSEMBLY','BUNDLE_DISASSEMBLY')),
  status text not null default 'DRAFT' check(status in ('DRAFT','POSTED','REVERSED','CANCELLED')),
  reason_code_id uuid, reference_type text, reference_id uuid, external_reference text, transaction_date timestamptz not null,
  posted_at timestamptz, posted_by uuid references auth.users(id), reversed_at timestamptz, reversed_by uuid references auth.users(id),
  reversal_transaction_id uuid, notes text, idempotency_key uuid not null, request_hash text not null,
  client_transaction_id uuid, device_id text, client_created_at timestamptz, source text not null default 'WEB' check(source in ('WEB','API','OFFLINE_SYNC','SYSTEM')),
  created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
  constraint inventory_transactions_org_id_key unique(organization_id,id), constraint inventory_transaction_number_key unique(organization_id,transaction_number),
  constraint inventory_idempotency_key unique(organization_id,idempotency_key),
  constraint inventory_transaction_business_fk foreign key(organization_id,business_id) references public.businesses(organization_id,id),
  constraint inventory_transaction_reason_fk foreign key(organization_id,reason_code_id) references public.inventory_reason_codes(organization_id,id),
  constraint inventory_transaction_reversal_fk foreign key(organization_id,reversal_transaction_id) references public.inventory_transactions(organization_id,id),
  constraint inventory_posted_shape check((status='DRAFT' and posted_at is null and posted_by is null) or status<>'DRAFT')
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), transaction_id uuid not null,
  product_variant_id uuid not null, branch_id uuid not null, warehouse_id uuid not null, storage_location_id uuid not null,
  movement_type text not null, quantity_delta_base numeric(24,6) not null check(quantity_delta_base<>0), entered_quantity numeric(24,6) not null check(entered_quantity>0),
  packaging_id uuid not null, conversion_to_base_snapshot numeric(24,6) not null check(conversion_to_base_snapshot>0),
  valuation_unit_cost numeric(24,8) not null check(valuation_unit_cost>=0), valuation_total numeric(28,8) not null,
  costing_method_snapshot text not null check(costing_method_snapshot in ('WEIGHTED_AVERAGE','FIFO')), occurred_at timestamptz not null,
  posted_at timestamptz not null, reference_type text, reference_id uuid, created_at timestamptz not null default now(),
  lot_id uuid, serial_id uuid, expiry_date date,
  constraint inventory_movements_org_id_key unique(organization_id,id),
  constraint inventory_movement_transaction_fk foreign key(organization_id,transaction_id) references public.inventory_transactions(organization_id,id),
  constraint inventory_movement_variant_fk foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id),
  constraint inventory_movement_branch_fk foreign key(organization_id,branch_id) references public.branches(organization_id,id),
  constraint inventory_movement_warehouse_fk foreign key(organization_id,warehouse_id) references public.warehouses(organization_id,id),
  constraint inventory_movement_location_fk foreign key(organization_id,storage_location_id) references public.storage_locations(organization_id,id),
  constraint inventory_movement_packaging_fk foreign key(organization_id,packaging_id) references public.product_variant_packaging(organization_id,id),
  constraint inventory_movement_value_sign check(valuation_total = round(quantity_delta_base*valuation_unit_cost,8))
);

create table public.inventory_balances (
  organization_id uuid not null references public.organizations(id), product_variant_id uuid not null, branch_id uuid not null, warehouse_id uuid not null,
  storage_location_id uuid not null, on_hand_base_quantity numeric(24,6) not null default 0, reserved_base_quantity numeric(24,6) not null default 0,
  average_unit_cost numeric(24,8) not null default 0, inventory_value numeric(28,8) not null default 0,
  last_movement_at timestamptz, updated_at timestamptz not null default now(),
  primary key(organization_id,product_variant_id,storage_location_id),
  constraint inventory_balance_variant_fk foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id),
  constraint inventory_balance_branch_fk foreign key(organization_id,branch_id) references public.branches(organization_id,id),
  constraint inventory_balance_warehouse_fk foreign key(organization_id,warehouse_id) references public.warehouses(organization_id,id),
  constraint inventory_balance_location_fk foreign key(organization_id,storage_location_id) references public.storage_locations(organization_id,id),
  constraint inventory_balance_reserved_nonnegative check(reserved_base_quantity>=0)
);

create table public.inventory_cost_layers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), product_variant_id uuid not null,
  branch_id uuid not null, warehouse_id uuid not null, storage_location_id uuid not null, inbound_movement_id uuid not null,
  original_quantity numeric(24,6) not null check(original_quantity>0), remaining_quantity numeric(24,6) not null check(remaining_quantity>=0),
  unit_cost numeric(24,8) not null check(unit_cost>=0), effective_at timestamptz not null, created_at timestamptz not null default now(),
  constraint inventory_layers_org_id_key unique(organization_id,id),
  constraint inventory_layer_variant_fk foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id),
  constraint inventory_layer_location_fk foreign key(organization_id,storage_location_id) references public.storage_locations(organization_id,id),
  constraint inventory_layer_movement_fk foreign key(organization_id,inbound_movement_id) references public.inventory_movements(organization_id,id),
  constraint inventory_layer_remaining_check check(remaining_quantity<=original_quantity)
);

create table public.inventory_cost_allocations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), outbound_movement_id uuid not null,
  cost_layer_id uuid not null, quantity numeric(24,6) not null check(quantity>0), unit_cost numeric(24,8) not null check(unit_cost>=0),
  total_cost numeric(28,8) generated always as (round(quantity*unit_cost,8)) stored, created_at timestamptz not null default now(),
  constraint inventory_allocation_movement_fk foreign key(organization_id,outbound_movement_id) references public.inventory_movements(organization_id,id),
  constraint inventory_allocation_layer_fk foreign key(organization_id,cost_layer_id) references public.inventory_cost_layers(organization_id,id)
);

create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), product_variant_id uuid not null,
  branch_id uuid not null, warehouse_id uuid not null, storage_location_id uuid not null, quantity_base numeric(24,6) not null check(quantity_base>0),
  remaining_quantity numeric(24,6) not null check(remaining_quantity>=0), source_type text not null, source_id uuid, status text not null default 'ACTIVE' check(status in ('ACTIVE','RELEASED','CONSUMED','EXPIRED','CANCELLED')),
  expires_at timestamptz, idempotency_key uuid not null, request_hash text not null, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint inventory_reservation_org_id_key unique(organization_id,id), constraint inventory_reservation_idempotency_key unique(organization_id,idempotency_key),
  constraint inventory_reservation_variant_fk foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id),
  constraint inventory_reservation_location_fk foreign key(organization_id,storage_location_id) references public.storage_locations(organization_id,id),
  constraint inventory_reservation_remaining_check check(remaining_quantity<=quantity_base)
);

create table public.inventory_reservation_events (
  id bigint generated always as identity primary key, organization_id uuid not null references public.organizations(id), reservation_id uuid not null,
  event_type text not null check(event_type in ('RESERVED','PARTIALLY_RELEASED','RELEASED','CONSUMED','EXPIRED','CANCELLED')),
  quantity numeric(24,6) not null check(quantity>=0), idempotency_key uuid not null, actor_id uuid not null references auth.users(id), created_at timestamptz not null default now(),
  constraint reservation_event_reservation_fk foreign key(organization_id,reservation_id) references public.inventory_reservations(organization_id,id),
  constraint reservation_event_idempotency_key unique(organization_id,idempotency_key)
);

create table public.stock_transfers (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), business_id uuid not null,
  transfer_number text not null, source_branch_id uuid not null, source_warehouse_id uuid not null, source_location_id uuid not null,
  destination_branch_id uuid not null, destination_warehouse_id uuid not null, destination_location_id uuid not null,
  status text not null default 'DRAFT' check(status in ('DRAFT','DISPATCHED','PARTIALLY_RECEIVED','RECEIVED','CANCELLED','DISCREPANCY_REVIEW')),
  notes text, external_reference text, dispatched_transaction_id uuid, received_at timestamptz, created_by uuid not null references auth.users(id),
  dispatched_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint stock_transfer_org_id_key unique(organization_id,id), constraint stock_transfer_number_key unique(organization_id,transfer_number),
  constraint stock_transfer_business_fk foreign key(organization_id,business_id) references public.businesses(organization_id,id),
  constraint stock_transfer_source_location_fk foreign key(organization_id,source_location_id) references public.storage_locations(organization_id,id),
  constraint stock_transfer_destination_location_fk foreign key(organization_id,destination_location_id) references public.storage_locations(organization_id,id),
  constraint stock_transfer_distinct_locations check(source_location_id<>destination_location_id)
);

create table public.stock_transfer_lines (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), transfer_id uuid not null,
  product_variant_id uuid not null, packaging_id uuid not null, requested_quantity numeric(24,6) not null check(requested_quantity>0),
  conversion_snapshot numeric(24,6), dispatched_base_quantity numeric(24,6) not null default 0, received_base_quantity numeric(24,6) not null default 0,
  damaged_base_quantity numeric(24,6) not null default 0, missing_base_quantity numeric(24,6) not null default 0, transfer_unit_cost numeric(24,8),
  constraint stock_transfer_line_org_id_key unique(organization_id,id), constraint stock_transfer_line_transfer_fk foreign key(organization_id,transfer_id) references public.stock_transfers(organization_id,id),
  constraint stock_transfer_line_variant_fk foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id),
  constraint stock_transfer_line_packaging_fk foreign key(organization_id,packaging_id) references public.product_variant_packaging(organization_id,id),
  constraint stock_transfer_line_unique unique(transfer_id,product_variant_id,packaging_id),
  constraint stock_transfer_receipt_limits check(received_base_quantity+damaged_base_quantity+missing_base_quantity<=dispatched_base_quantity)
);

create table public.stock_count_sessions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), business_id uuid not null,
  count_number text not null, count_type text not null check(count_type in ('FULL','CYCLE','SPOT')), status text not null default 'DRAFT' check(status in ('DRAFT','IN_PROGRESS','SUBMITTED','READY_TO_POST','POSTED','CANCELLED')),
  branch_id uuid not null, warehouse_id uuid not null, storage_location_id uuid, blind_count boolean not null default true,
  snapshot_at timestamptz, submitted_at timestamptz, posted_at timestamptz, notes text, created_by uuid not null references auth.users(id),
  posted_by uuid references auth.users(id), posting_transaction_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint stock_count_org_id_key unique(organization_id,id), constraint stock_count_number_key unique(organization_id,count_number),
  constraint stock_count_business_fk foreign key(organization_id,business_id) references public.businesses(organization_id,id),
  constraint stock_count_location_fk foreign key(organization_id,storage_location_id) references public.storage_locations(organization_id,id)
);

create table public.stock_count_lines (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), count_session_id uuid not null,
  product_variant_id uuid not null, storage_location_id uuid not null, expected_quantity_snapshot numeric(24,6) not null,
  movement_since_snapshot numeric(24,6) not null default 0, counted_quantity numeric(24,6), recount_quantity numeric(24,6),
  variance_quantity numeric(24,6), variance_value numeric(28,8), notes text, counted_by uuid references auth.users(id), counted_at timestamptz,
  constraint stock_count_line_org_id_key unique(organization_id,id), constraint stock_count_line_session_fk foreign key(organization_id,count_session_id) references public.stock_count_sessions(organization_id,id),
  constraint stock_count_line_variant_fk foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id),
  constraint stock_count_line_location_fk foreign key(organization_id,storage_location_id) references public.storage_locations(organization_id,id),
  constraint stock_count_line_unique unique(count_session_id,product_variant_id,storage_location_id)
);

create table public.inventory_reorder_overrides (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), product_variant_id uuid not null,
  branch_id uuid, warehouse_id uuid, storage_location_id uuid, reorder_point numeric(24,6), reorder_quantity numeric(24,6), safety_stock numeric(24,6),
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint reorder_override_variant_fk foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id),
  constraint reorder_override_scope check(num_nonnulls(branch_id,warehouse_id,storage_location_id)=1)
);

create view public.inventory_availability with (security_invoker=true) as
select balance.*, balance.on_hand_base_quantity-balance.reserved_base_quantity as available_base_quantity
from public.inventory_balances balance;

create index inventory_transactions_history_idx on public.inventory_transactions(organization_id,transaction_date desc,transaction_type,status);
create index inventory_movements_variant_time_idx on public.inventory_movements(organization_id,product_variant_id,occurred_at desc);
create index inventory_movements_branch_time_idx on public.inventory_movements(organization_id,branch_id,occurred_at desc);
create index inventory_movements_location_time_idx on public.inventory_movements(organization_id,storage_location_id,occurred_at desc);
create index inventory_movements_transaction_idx on public.inventory_movements(transaction_id);
create index inventory_layers_fifo_idx on public.inventory_cost_layers(organization_id,product_variant_id,storage_location_id,effective_at,id) where remaining_quantity>0;
create index inventory_reservations_active_idx on public.inventory_reservations(organization_id,storage_location_id,product_variant_id,expires_at) where status='ACTIVE';
create index stock_transfers_active_idx on public.stock_transfers(organization_id,status,created_at desc) where status in ('DRAFT','DISPATCHED','PARTIALLY_RECEIVED','DISCREPANCY_REVIEW');
create index stock_counts_active_idx on public.stock_count_sessions(organization_id,status,created_at desc) where status not in ('POSTED','CANCELLED');

create or replace function public.guard_inventory_immutability() returns trigger language plpgsql set search_path='' as $$
begin raise exception using errcode='55000',message='IMMUTABLE_INVENTORY_HISTORY'; end $$;
create trigger inventory_movements_immutable before update or delete on public.inventory_movements for each row execute function public.guard_inventory_immutability();
create trigger inventory_allocations_immutable before update or delete on public.inventory_cost_allocations for each row execute function public.guard_inventory_immutability();
create trigger reservation_events_immutable before update or delete on public.inventory_reservation_events for each row execute function public.guard_inventory_immutability();

create or replace function public.guard_inventory_settings() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if old.costing_method<>new.costing_method and exists(select 1 from public.inventory_movements m where m.organization_id=old.organization_id) then
    raise exception using errcode='55000',message='COSTING_METHOD_LOCKED';
  end if;
  new.updated_at=now(); return new;
end $$;
create trigger inventory_settings_guard before update on public.inventory_settings for each row execute function public.guard_inventory_settings();

create or replace function public.prevent_used_packaging_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (old.conversion_to_base<>new.conversion_to_base or old.product_variant_id<>new.product_variant_id) and exists(select 1 from public.inventory_movements m where m.packaging_id=old.id) then
  raise exception using errcode='55000',message='PACKAGING_USED_BY_LEDGER';
 end if; return new;
end $$;
create trigger packaging_ledger_guard before update on public.product_variant_packaging for each row execute function public.prevent_used_packaging_change();

insert into public.inventory_settings(organization_id,inventory_timezone) select id,timezone from public.organizations on conflict do nothing;
