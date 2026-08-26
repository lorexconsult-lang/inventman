create sequence public.inventory_fifo_layer_sequence;
alter table public.inventory_cost_layers add column fifo_sequence bigint not null default nextval('public.inventory_fifo_layer_sequence');
drop index inventory_layers_fifo_idx;
create index inventory_layers_fifo_idx on public.inventory_cost_layers(organization_id,product_variant_id,storage_location_id,effective_at,fifo_sequence) where remaining_quantity>0;

-- The posting function orders equal effective timestamps by UUID. Assign UUIDs from the
-- monotonic layer sequence so that tie-breaking remains deterministic without rewriting history.
create or replace function public.assign_fifo_layer_id() returns trigger language plpgsql set search_path='' as $$
begin
 new.id:=('00000000-0000-4000-8000-'||lpad(to_hex(new.fifo_sequence),12,'0'))::uuid;
 return new;
end $$;
create trigger assign_fifo_layer_id before insert on public.inventory_cost_layers for each row execute function public.assign_fifo_layer_id();
revoke all on sequence public.inventory_fifo_layer_sequence from public,anon,authenticated;
revoke all on function public.assign_fifo_layer_id() from public,anon,authenticated;
