create or replace function public.reserve_inventory(target_organization_id uuid,target_product_variant_id uuid,target_storage_location_id uuid,target_quantity numeric,target_source_type text,target_source_id uuid,target_expires_at timestamptz,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); location record; balance public.inventory_balances%rowtype; existing public.inventory_reservations%rowtype; reservation_id uuid:=gen_random_uuid(); payload_hash text;
begin
 payload_hash:=encode(extensions.digest(convert_to(jsonb_build_object('variant',target_product_variant_id,'location',target_storage_location_id,'quantity',target_quantity,'source_type',target_source_type,'source_id',target_source_id,'expires',target_expires_at)::text,'UTF8'),'sha256'),'hex');
 select * into existing from public.inventory_reservations where organization_id=target_organization_id and idempotency_key=target_idempotency_key;
 if found then if existing.request_hash<>payload_hash then raise exception using errcode='P0001',message='IDEMPOTENCY_PAYLOAD_MISMATCH'; end if; return existing.id; end if;
 if actor is null or not public.has_permission(target_organization_id,'inventory.reserve') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if target_quantity<=0 then raise exception using errcode='22023',message='INVALID_QUANTITY'; end if;
 select id,branch_id,warehouse_id into location from public.storage_locations where organization_id=target_organization_id and id=target_storage_location_id and is_active;
 if not found then raise exception using errcode='P0001',message='INVALID_LOCATION'; end if;
 if not public.can_access_branch(target_organization_id,location.branch_id) then raise exception using errcode='42501',message='BRANCH_ACCESS_DENIED'; end if;
 if not exists(select 1 from public.product_variants where organization_id=target_organization_id and id=target_product_variant_id and status='ACTIVE') then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 perform pg_advisory_xact_lock(hashtextextended(target_organization_id::text||target_product_variant_id::text||target_storage_location_id::text,0));
 select * into balance from public.inventory_balances where organization_id=target_organization_id and product_variant_id=target_product_variant_id and storage_location_id=target_storage_location_id for update;
 if not found or balance.on_hand_base_quantity-balance.reserved_base_quantity<target_quantity then raise exception using errcode='P0001',message='INSUFFICIENT_AVAILABLE_STOCK'; end if;
 insert into public.inventory_reservations(id,organization_id,product_variant_id,branch_id,warehouse_id,storage_location_id,quantity_base,remaining_quantity,source_type,source_id,expires_at,idempotency_key,request_hash,created_by)
 values(reservation_id,target_organization_id,target_product_variant_id,location.branch_id,location.warehouse_id,target_storage_location_id,target_quantity,target_quantity,target_source_type,target_source_id,target_expires_at,target_idempotency_key,payload_hash,actor);
 update public.inventory_balances set reserved_base_quantity=reserved_base_quantity+target_quantity,updated_at=now() where organization_id=target_organization_id and product_variant_id=target_product_variant_id and storage_location_id=target_storage_location_id;
 insert into public.inventory_reservation_events(organization_id,reservation_id,event_type,quantity,idempotency_key,actor_id) values(target_organization_id,reservation_id,'RESERVED',target_quantity,target_idempotency_key,actor);
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'inventory.reserved','inventory_reservation',reservation_id,jsonb_build_object('quantity',target_quantity)); return reservation_id;
end $$;

create or replace function public.release_inventory_reservation(target_organization_id uuid,target_reservation_id uuid,target_quantity numeric,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); reservation public.inventory_reservations%rowtype; existing uuid; event_name text;
begin
 select reservation_id into existing from public.inventory_reservation_events where organization_id=target_organization_id and idempotency_key=target_idempotency_key;
 if found then return existing; end if;
 if actor is null or not public.has_permission(target_organization_id,'inventory.release_reservation') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into reservation from public.inventory_reservations where organization_id=target_organization_id and id=target_reservation_id for update;
 if not found or reservation.status<>'ACTIVE' then raise exception using errcode='P0001',message='RESERVATION_NOT_ACTIVE'; end if;
 if not public.can_access_branch(target_organization_id,reservation.branch_id) then raise exception using errcode='42501',message='BRANCH_ACCESS_DENIED'; end if;
 if target_quantity<=0 or target_quantity>reservation.remaining_quantity then raise exception using errcode='22023',message='INVALID_RELEASE_QUANTITY'; end if;
 event_name:=case when target_quantity=reservation.remaining_quantity then 'RELEASED' else 'PARTIALLY_RELEASED' end;
 update public.inventory_reservations set remaining_quantity=remaining_quantity-target_quantity,status=case when remaining_quantity-target_quantity=0 then 'RELEASED' else 'ACTIVE' end,updated_at=now() where id=reservation.id;
 update public.inventory_balances set reserved_base_quantity=reserved_base_quantity-target_quantity,updated_at=now() where organization_id=target_organization_id and product_variant_id=reservation.product_variant_id and storage_location_id=reservation.storage_location_id;
 insert into public.inventory_reservation_events(organization_id,reservation_id,event_type,quantity,idempotency_key,actor_id) values(target_organization_id,reservation.id,event_name,target_quantity,target_idempotency_key,actor);
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'inventory.reservation_released','inventory_reservation',reservation.id,jsonb_build_object('quantity',target_quantity)); return reservation.id;
end $$;

create or replace function public.create_stock_transfer(target_organization_id uuid,target_business_id uuid,target_source_location_id uuid,target_destination_location_id uuid,target_notes text,target_external_reference text,target_lines jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); source record; destination record; transfer_id uuid:=gen_random_uuid(); number text; line record;
begin
 if actor is null or not public.has_permission(target_organization_id,'inventory.transfer_create') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select id,branch_id,warehouse_id into source from public.storage_locations where organization_id=target_organization_id and id=target_source_location_id and is_active;
 select id,branch_id,warehouse_id into destination from public.storage_locations where organization_id=target_organization_id and id=target_destination_location_id and is_active;
 if source.id is null or destination.id is null or source.id=destination.id then raise exception using errcode='P0001',message='INVALID_LOCATION'; end if;
 if not public.can_access_branch(target_organization_id,source.branch_id) then raise exception using errcode='42501',message='BRANCH_ACCESS_DENIED'; end if;
 if not jsonb_typeof(target_lines)='array' or jsonb_array_length(target_lines)=0 then raise exception using errcode='22023',message='INVALID_LINES'; end if;
 number:=public.next_inventory_number(target_organization_id,'TRF');
 insert into public.stock_transfers(id,organization_id,business_id,transfer_number,source_branch_id,source_warehouse_id,source_location_id,destination_branch_id,destination_warehouse_id,destination_location_id,notes,external_reference,created_by)
 values(transfer_id,target_organization_id,target_business_id,number,source.branch_id,source.warehouse_id,source.id,destination.branch_id,destination.warehouse_id,destination.id,target_notes,target_external_reference,actor);
 for line in select value from jsonb_array_elements(target_lines) loop
  if (line.value->>'quantity')::numeric<=0 or not exists(select 1 from public.product_variant_packaging p where p.organization_id=target_organization_id and p.id=(line.value->>'packaging_id')::uuid and p.product_variant_id=(line.value->>'product_variant_id')::uuid) then raise exception using errcode='P0001',message='INVALID_PACKAGING'; end if;
  insert into public.stock_transfer_lines(organization_id,transfer_id,product_variant_id,packaging_id,requested_quantity) values(target_organization_id,transfer_id,(line.value->>'product_variant_id')::uuid,(line.value->>'packaging_id')::uuid,(line.value->>'quantity')::numeric);
 end loop;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id) values(target_organization_id,actor,'inventory.transfer_created','stock_transfer',transfer_id); return transfer_id;
end $$;

create or replace function public.dispatch_stock_transfer(target_organization_id uuid,target_transfer_id uuid,target_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare transfer public.stock_transfers%rowtype; result jsonb; lines jsonb;
begin
 select * into transfer from public.stock_transfers where organization_id=target_organization_id and id=target_transfer_id for update;
 if not found or transfer.status<>'DRAFT' then raise exception using errcode='P0001',message='TRANSFER_ALREADY_DISPATCHED'; end if;
 if not public.has_permission(target_organization_id,'inventory.transfer_dispatch') or not public.can_access_branch(target_organization_id,transfer.source_branch_id) then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select jsonb_agg(jsonb_build_object('product_variant_id',l.product_variant_id,'packaging_id',l.packaging_id,'storage_location_id',transfer.source_location_id,'quantity',l.requested_quantity)) into lines from public.stock_transfer_lines l where l.transfer_id=transfer.id;
 result:=public.post_inventory_transaction(target_organization_id,transfer.business_id,'TRANSFER_DISPATCH',now(),null,transfer.notes,transfer.external_reference,target_idempotency_key,lines,'STOCK_TRANSFER',transfer.id,null,null,null,'WEB',false);
 update public.stock_transfer_lines l set conversion_snapshot=p.conversion_to_base,dispatched_base_quantity=l.requested_quantity*p.conversion_to_base,transfer_unit_cost=m.valuation_unit_cost from public.product_variant_packaging p,public.inventory_movements m
  where l.transfer_id=transfer.id and p.id=l.packaging_id and m.transaction_id=(result->>'transaction_id')::uuid and m.product_variant_id=l.product_variant_id;
 update public.stock_transfers set status='DISPATCHED',dispatched_transaction_id=(result->>'transaction_id')::uuid,dispatched_by=auth.uid(),updated_at=now() where id=transfer.id;
 return result||jsonb_build_object('transfer_id',transfer.id);
end $$;

create or replace function public.receive_stock_transfer(target_organization_id uuid,target_transfer_id uuid,target_receipts jsonb,target_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare transfer public.stock_transfers%rowtype; item record; line public.stock_transfer_lines%rowtype; lines jsonb:='[]'::jsonb; result jsonb; receipt_base numeric; entered numeric;
begin
 select * into transfer from public.stock_transfers where organization_id=target_organization_id and id=target_transfer_id for update;
 if not found or transfer.status not in ('DISPATCHED','PARTIALLY_RECEIVED') then raise exception using errcode='P0001',message='TRANSFER_NOT_RECEIVABLE'; end if;
 if not public.has_permission(target_organization_id,'inventory.transfer_receive') or not public.can_access_branch(target_organization_id,transfer.destination_branch_id) then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 for item in select value from jsonb_array_elements(target_receipts) loop
  select * into line from public.stock_transfer_lines where organization_id=target_organization_id and transfer_id=transfer.id and id=(item.value->>'line_id')::uuid for update;
  if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
  entered:=(item.value->>'quantity')::numeric; receipt_base:=round(entered*line.conversion_snapshot,6);
  if entered<=0 or line.received_base_quantity+receipt_base+line.damaged_base_quantity+line.missing_base_quantity>line.dispatched_base_quantity then raise exception using errcode='P0001',message='TRANSFER_OVER_RECEIPT'; end if;
  lines:=lines||jsonb_build_array(jsonb_build_object('product_variant_id',line.product_variant_id,'packaging_id',line.packaging_id,'storage_location_id',transfer.destination_location_id,'quantity',entered,'transfer_unit_cost',line.transfer_unit_cost));
  update public.stock_transfer_lines set received_base_quantity=received_base_quantity+receipt_base where id=line.id;
 end loop;
 result:=public.post_inventory_transaction(target_organization_id,transfer.business_id,'TRANSFER_RECEIPT',now(),null,transfer.notes,transfer.external_reference,target_idempotency_key,lines,'STOCK_TRANSFER',transfer.id,null,null,null,'WEB',false);
 update public.stock_transfers t set status=case when exists(select 1 from public.stock_transfer_lines l where l.transfer_id=t.id and l.received_base_quantity+l.damaged_base_quantity+l.missing_base_quantity<l.dispatched_base_quantity) then 'PARTIALLY_RECEIVED' else 'RECEIVED' end,
  received_at=case when not exists(select 1 from public.stock_transfer_lines l where l.transfer_id=t.id and l.received_base_quantity+l.damaged_base_quantity+l.missing_base_quantity<l.dispatched_base_quantity) then now() else null end,updated_at=now() where t.id=transfer.id;
 return result||jsonb_build_object('transfer_id',transfer.id);
end $$;

create or replace function public.create_stock_count(target_organization_id uuid,target_business_id uuid,target_branch_id uuid,target_warehouse_id uuid,target_storage_location_id uuid,target_count_type text,target_blind boolean,target_variant_ids uuid[] default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); count_id uuid:=gen_random_uuid(); number text;
begin
 if actor is null or not public.has_permission(target_organization_id,'inventory.count_create') or not public.can_access_branch(target_organization_id,target_branch_id) then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if not exists(select 1 from public.warehouses w where w.organization_id=target_organization_id and w.id=target_warehouse_id and w.branch_id=target_branch_id) or (target_storage_location_id is not null and not exists(select 1 from public.storage_locations l where l.organization_id=target_organization_id and l.id=target_storage_location_id and l.warehouse_id=target_warehouse_id)) then raise exception using errcode='P0001',message='INVALID_LOCATION'; end if;
 number:=public.next_inventory_number(target_organization_id,'CNT');
 insert into public.stock_count_sessions(id,organization_id,business_id,count_number,count_type,status,branch_id,warehouse_id,storage_location_id,blind_count,snapshot_at,created_by)
 values(count_id,target_organization_id,target_business_id,number,target_count_type,'IN_PROGRESS',target_branch_id,target_warehouse_id,target_storage_location_id,target_blind,now(),actor);
 insert into public.stock_count_lines(organization_id,count_session_id,product_variant_id,storage_location_id,expected_quantity_snapshot)
 select b.organization_id,count_id,b.product_variant_id,b.storage_location_id,b.on_hand_base_quantity from public.inventory_balances b where b.organization_id=target_organization_id and b.branch_id=target_branch_id and b.warehouse_id=target_warehouse_id and (target_storage_location_id is null or b.storage_location_id=target_storage_location_id) and (target_variant_ids is null or b.product_variant_id=any(target_variant_ids));
 return count_id;
end $$;

create or replace function public.record_stock_count(target_organization_id uuid,target_count_id uuid,target_lines jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); session public.stock_count_sessions%rowtype; item record;
begin
 select * into session from public.stock_count_sessions where organization_id=target_organization_id and id=target_count_id for update;
 if not found or session.status not in ('IN_PROGRESS','SUBMITTED') or not public.has_permission(target_organization_id,'inventory.count_perform') or not public.can_access_branch(target_organization_id,session.branch_id) then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 for item in select value from jsonb_array_elements(target_lines) loop
  update public.stock_count_lines set counted_quantity=(item.value->>'counted_quantity')::numeric,notes=nullif(item.value->>'notes',''),counted_by=actor,counted_at=now() where organization_id=target_organization_id and count_session_id=session.id and id=(item.value->>'line_id')::uuid;
  if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 end loop;
 update public.stock_count_sessions set status='SUBMITTED',submitted_at=now(),updated_at=now() where id=session.id;
end $$;

create or replace function public.reconcile_inventory_balances(target_organization_id uuid,rebuild boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare differences integer;
begin
 if current_user not in ('postgres','supabase_admin') then raise exception using errcode='42501',message='PLATFORM_ADMIN_ONLY'; end if;
 with ledger as(select product_variant_id,storage_location_id,sum(quantity_delta_base) qty,sum(valuation_total) value from public.inventory_movements where organization_id=target_organization_id group by 1,2)
 select count(*) into differences from ledger full join public.inventory_balances b using(product_variant_id,storage_location_id) where coalesce(ledger.qty,0)<>coalesce(b.on_hand_base_quantity,0) or coalesce(ledger.value,0)<>coalesce(b.inventory_value,0);
 if rebuild then
  update public.inventory_balances b set on_hand_base_quantity=x.qty,inventory_value=x.value,average_unit_cost=case when x.qty=0 then 0 else round(x.value/x.qty,8) end,updated_at=now()
  from (select product_variant_id,storage_location_id,sum(quantity_delta_base) qty,sum(valuation_total) value from public.inventory_movements where organization_id=target_organization_id group by 1,2)x where b.organization_id=target_organization_id and b.product_variant_id=x.product_variant_id and b.storage_location_id=x.storage_location_id;
 end if; return jsonb_build_object('differences',differences,'rebuilt',rebuild);
end $$;

revoke all on function public.reserve_inventory(uuid,uuid,uuid,numeric,text,uuid,timestamptz,uuid) from public,anon;
revoke all on function public.release_inventory_reservation(uuid,uuid,numeric,uuid) from public,anon;
revoke all on function public.create_stock_transfer(uuid,uuid,uuid,uuid,text,text,jsonb) from public,anon;
revoke all on function public.dispatch_stock_transfer(uuid,uuid,uuid) from public,anon;
revoke all on function public.receive_stock_transfer(uuid,uuid,jsonb,uuid) from public,anon;
revoke all on function public.create_stock_count(uuid,uuid,uuid,uuid,uuid,text,boolean,uuid[]) from public,anon;
revoke all on function public.record_stock_count(uuid,uuid,jsonb) from public,anon;
revoke all on function public.reconcile_inventory_balances(uuid,boolean) from public,anon,authenticated;
grant execute on function public.reserve_inventory(uuid,uuid,uuid,numeric,text,uuid,timestamptz,uuid),public.release_inventory_reservation(uuid,uuid,numeric,uuid),public.create_stock_transfer(uuid,uuid,uuid,uuid,text,text,jsonb),public.dispatch_stock_transfer(uuid,uuid,uuid),public.receive_stock_transfer(uuid,uuid,jsonb,uuid),public.create_stock_count(uuid,uuid,uuid,uuid,uuid,text,boolean,uuid[]),public.record_stock_count(uuid,uuid,jsonb) to authenticated;
