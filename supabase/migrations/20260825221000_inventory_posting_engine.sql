create or replace function public.next_inventory_number(target_organization_id uuid, target_prefix text)
returns text language plpgsql security definer set search_path='' as $$
declare n bigint;
begin
 insert into public.inventory_number_counters(organization_id,prefix,next_value) values(target_organization_id,target_prefix,2)
 on conflict(organization_id,prefix) do update set next_value=public.inventory_number_counters.next_value+1,updated_at=now()
 returning next_value-1 into n;
 return 'INV-'||target_prefix||'-'||lpad(n::text,6,'0');
end $$;

create or replace function public.post_inventory_transaction(
 target_organization_id uuid, target_business_id uuid, target_transaction_type text, target_transaction_date timestamptz,
 target_reason_code_id uuid, target_notes text, target_external_reference text, target_idempotency_key uuid,
 target_lines jsonb, target_reference_type text default null, target_reference_id uuid default null,
 target_client_transaction_id uuid default null, target_device_id text default null, target_client_created_at timestamptz default null,
 target_source text default 'WEB', target_allow_negative_override boolean default false
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid(); settings public.inventory_settings%rowtype; existing public.inventory_transactions%rowtype;
 tx_id uuid := gen_random_uuid(); movement_id uuid; tx_number text; prefix text; required_permission text; payload_hash text;
 line record; location record; package record; balance public.inventory_balances%rowtype; reason public.inventory_reason_codes%rowtype;
 base_qty numeric(24,6); entered_qty numeric(24,6); unit_cost numeric(24,8); total_cost numeric(28,8); remaining numeric(24,6);
 layer record; take_qty numeric(24,6); allocations jsonb; inbound boolean; outbound boolean; movement_count integer:=0;
begin
 if actor is null then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 payload_hash:=encode(extensions.digest(convert_to(jsonb_build_object('type',target_transaction_type,'date',target_transaction_date,'reason',target_reason_code_id,'notes',target_notes,'reference',target_external_reference,'lines',target_lines)::text,'UTF8'),'sha256'),'hex');
 select * into existing from public.inventory_transactions where organization_id=target_organization_id and idempotency_key=target_idempotency_key;
 if found then
  if existing.request_hash<>payload_hash then raise exception using errcode='P0001',message='IDEMPOTENCY_PAYLOAD_MISMATCH'; end if;
  return jsonb_build_object('transaction_id',existing.id,'transaction_number',existing.transaction_number,'replayed',true);
 end if;
 required_permission:=case target_transaction_type when 'OPENING_STOCK' then 'inventory.opening_stock_post' when 'MANUAL_RECEIPT' then 'inventory.receipt_post'
  when 'MANUAL_ISSUE' then 'inventory.issue_post' when 'ADJUSTMENT_IN' then 'inventory.adjustment_post' when 'ADJUSTMENT_OUT' then 'inventory.adjustment_post'
  when 'DAMAGE' then 'inventory.damage_post' when 'EXPIRY' then 'inventory.expiry_post' when 'LOSS' then 'inventory.loss_post'
  when 'TRANSFER_DISPATCH' then 'inventory.transfer_dispatch' when 'TRANSFER_RECEIPT' then 'inventory.transfer_receive'
  when 'TRANSFER_DISCREPANCY' then 'inventory.transfer_resolve_discrepancy' when 'STOCK_COUNT_ADJUSTMENT' then 'inventory.count_post'
  else null end;
 if required_permission is null or not public.has_permission(target_organization_id,required_permission) then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if not exists(select 1 from public.businesses b where b.organization_id=target_organization_id and b.id=target_business_id and b.status='active') then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 select * into settings from public.inventory_settings where organization_id=target_organization_id;
 if not found then raise exception using errcode='P0001',message='INVENTORY_SETTINGS_MISSING'; end if;
 if target_transaction_date<now()-interval '5 minutes' and (not settings.allow_backdated or not public.has_permission(target_organization_id,'inventory.backdate')) then raise exception using errcode='P0001',message='BACKDATE_NOT_ALLOWED'; end if;
 if not jsonb_typeof(target_lines)='array' or jsonb_array_length(target_lines)=0 or jsonb_array_length(target_lines)>500 then raise exception using errcode='22023',message='INVALID_LINES'; end if;
 if target_reason_code_id is not null then
  select * into reason from public.inventory_reason_codes where organization_id=target_organization_id and id=target_reason_code_id and is_active;
  if not found or (cardinality(reason.applicable_types)>0 and not target_transaction_type=any(reason.applicable_types)) then raise exception using errcode='P0001',message='INVALID_REASON'; end if;
  if reason.requires_notes and nullif(trim(target_notes),'') is null then raise exception using errcode='P0001',message='REASON_NOTES_REQUIRED'; end if;
 elsif target_transaction_type in ('MANUAL_RECEIPT','MANUAL_ISSUE','ADJUSTMENT_IN','ADJUSTMENT_OUT','DAMAGE','EXPIRY','LOSS') then raise exception using errcode='P0001',message='REASON_REQUIRED'; end if;
 inbound:=target_transaction_type in ('OPENING_STOCK','MANUAL_RECEIPT','ADJUSTMENT_IN','TRANSFER_RECEIPT','PRODUCTION_OUTPUT','PURCHASE_RECEIPT','SALE_RETURN');
 outbound:=target_transaction_type in ('MANUAL_ISSUE','ADJUSTMENT_OUT','DAMAGE','EXPIRY','LOSS','TRANSFER_DISPATCH','TRANSFER_DISCREPANCY','STOCK_COUNT_ADJUSTMENT','PURCHASE_RETURN','SALE','PRODUCTION_CONSUMPTION','RECIPE_CONSUMPTION');
 if not inbound and not outbound then raise exception using errcode='22023',message='UNSUPPORTED_TRANSACTION_TYPE'; end if;
 prefix:=case when target_transaction_type='OPENING_STOCK' then 'OPEN' when target_transaction_type like 'TRANSFER_%' then 'TRF' when target_transaction_type='STOCK_COUNT_ADJUSTMENT' then 'CNT' else 'ADJ' end;
 tx_number:=public.next_inventory_number(target_organization_id,prefix);
 insert into public.inventory_transactions(id,organization_id,business_id,transaction_number,transaction_type,status,reason_code_id,reference_type,reference_id,external_reference,transaction_date,posted_at,posted_by,notes,idempotency_key,request_hash,client_transaction_id,device_id,client_created_at,source,created_by)
 values(tx_id,target_organization_id,target_business_id,tx_number,target_transaction_type,'POSTED',target_reason_code_id,target_reference_type,target_reference_id,target_external_reference,target_transaction_date,now(),actor,target_notes,target_idempotency_key,payload_hash,target_client_transaction_id,target_device_id,target_client_created_at,target_source,actor);
 for line in select value from jsonb_array_elements(target_lines) loop
  if line.value?'product_variant_id' is false or line.value?'storage_location_id' is false or line.value?'packaging_id' is false then raise exception using errcode='22023',message='INVALID_LINES'; end if;
  entered_qty:=(line.value->>'quantity')::numeric; if entered_qty<=0 then raise exception using errcode='22023',message='INVALID_QUANTITY'; end if;
  select l.id,l.branch_id,l.warehouse_id into location from public.storage_locations l join public.warehouses w on w.organization_id=l.organization_id and w.id=l.warehouse_id join public.branches b on b.organization_id=l.organization_id and b.id=l.branch_id
   where l.organization_id=target_organization_id and l.id=(line.value->>'storage_location_id')::uuid and l.is_active and w.status='active' and b.status='active';
  if not found then raise exception using errcode='P0001',message='INVALID_LOCATION'; end if;
  if not public.can_access_branch(target_organization_id,location.branch_id) then raise exception using errcode='42501',message='BRANCH_ACCESS_DENIED'; end if;
  select p.id,p.product_variant_id,p.conversion_to_base into package from public.product_variant_packaging p join public.product_variants v on v.organization_id=p.organization_id and v.id=p.product_variant_id join public.products product on product.organization_id=v.organization_id and product.id=v.product_id
   where p.organization_id=target_organization_id and p.id=(line.value->>'packaging_id')::uuid and p.product_variant_id=(line.value->>'product_variant_id')::uuid and p.is_active and v.status='ACTIVE' and product.status='ACTIVE' and product.track_inventory;
  if not found then raise exception using errcode='P0001',message='INVALID_PACKAGING'; end if;
  base_qty:=round(entered_qty*package.conversion_to_base,settings.quantity_precision); if base_qty<=0 then raise exception using errcode='22023',message='INVALID_QUANTITY'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_organization_id::text||package.product_variant_id::text||location.id::text,0));
  insert into public.inventory_balances(organization_id,product_variant_id,branch_id,warehouse_id,storage_location_id) values(target_organization_id,package.product_variant_id,location.branch_id,location.warehouse_id,location.id) on conflict do nothing;
  select * into balance from public.inventory_balances where organization_id=target_organization_id and product_variant_id=package.product_variant_id and storage_location_id=location.id for update;
  if target_transaction_type='OPENING_STOCK' and exists(select 1 from public.inventory_movements m where m.organization_id=target_organization_id and m.product_variant_id=package.product_variant_id and m.storage_location_id=location.id) then raise exception using errcode='P0001',message='OPENING_STOCK_ALREADY_EXISTS'; end if;
  movement_id:=gen_random_uuid(); allocations:='[]'::jsonb;
  if inbound then
   unit_cost:=coalesce(nullif(line.value->>'unit_cost','')::numeric,nullif(line.value->>'transfer_unit_cost','')::numeric);
   if unit_cost is null or unit_cost<0 then raise exception using errcode='22023',message='INVALID_COST'; end if;
   total_cost:=round(base_qty*unit_cost,8);
   insert into public.inventory_movements(id,organization_id,transaction_id,product_variant_id,branch_id,warehouse_id,storage_location_id,movement_type,quantity_delta_base,entered_quantity,packaging_id,conversion_to_base_snapshot,valuation_unit_cost,valuation_total,costing_method_snapshot,occurred_at,posted_at,reference_type,reference_id)
   values(movement_id,target_organization_id,tx_id,package.product_variant_id,location.branch_id,location.warehouse_id,location.id,target_transaction_type,base_qty,entered_qty,package.id,package.conversion_to_base,unit_cost,total_cost,settings.costing_method,target_transaction_date,now(),target_reference_type,target_reference_id);
   if settings.costing_method='FIFO' then insert into public.inventory_cost_layers(organization_id,product_variant_id,branch_id,warehouse_id,storage_location_id,inbound_movement_id,original_quantity,remaining_quantity,unit_cost,effective_at) values(target_organization_id,package.product_variant_id,location.branch_id,location.warehouse_id,location.id,movement_id,base_qty,base_qty,unit_cost,target_transaction_date); end if;
   update public.inventory_balances set on_hand_base_quantity=on_hand_base_quantity+base_qty,inventory_value=inventory_value+total_cost,
    average_unit_cost=case when on_hand_base_quantity+base_qty=0 then 0 else round((inventory_value+total_cost)/(on_hand_base_quantity+base_qty),8) end,last_movement_at=target_transaction_date,updated_at=now()
    where organization_id=target_organization_id and product_variant_id=package.product_variant_id and storage_location_id=location.id;
  else
   if balance.on_hand_base_quantity-base_qty<0 and (settings.negative_stock_policy='DISALLOW' or not target_allow_negative_override or not public.has_permission(target_organization_id,'inventory.negative_override') or settings.costing_method='FIFO') then raise exception using errcode='P0001',message='INSUFFICIENT_STOCK'; end if;
   if balance.reserved_base_quantity>balance.on_hand_base_quantity-base_qty then raise exception using errcode='P0001',message='RESERVED_STOCK_CONFLICT'; end if;
   if settings.costing_method='WEIGHTED_AVERAGE' then unit_cost:=balance.average_unit_cost; total_cost:=round(base_qty*unit_cost,8);
   else
    remaining:=base_qty; total_cost:=0;
    for layer in select * from public.inventory_cost_layers where organization_id=target_organization_id and product_variant_id=package.product_variant_id and storage_location_id=location.id and remaining_quantity>0 order by effective_at,id for update loop
     exit when remaining<=0; take_qty:=least(layer.remaining_quantity,remaining); total_cost:=total_cost+round(take_qty*layer.unit_cost,8); remaining:=remaining-take_qty;
     update public.inventory_cost_layers set remaining_quantity=remaining_quantity-take_qty where id=layer.id;
     allocations:=allocations||jsonb_build_array(jsonb_build_object('layer_id',layer.id,'quantity',take_qty,'unit_cost',layer.unit_cost));
    end loop;
    if remaining>0 then raise exception using errcode='P0001',message='INSUFFICIENT_FIFO_LAYERS'; end if; unit_cost:=round(total_cost/base_qty,8);
   end if;
   insert into public.inventory_movements(id,organization_id,transaction_id,product_variant_id,branch_id,warehouse_id,storage_location_id,movement_type,quantity_delta_base,entered_quantity,packaging_id,conversion_to_base_snapshot,valuation_unit_cost,valuation_total,costing_method_snapshot,occurred_at,posted_at,reference_type,reference_id)
   values(movement_id,target_organization_id,tx_id,package.product_variant_id,location.branch_id,location.warehouse_id,location.id,target_transaction_type,-base_qty,entered_qty,package.id,package.conversion_to_base,unit_cost,-total_cost,settings.costing_method,target_transaction_date,now(),target_reference_type,target_reference_id);
   if settings.costing_method='FIFO' then insert into public.inventory_cost_allocations(organization_id,outbound_movement_id,cost_layer_id,quantity,unit_cost) select target_organization_id,movement_id,(a->>'layer_id')::uuid,(a->>'quantity')::numeric,(a->>'unit_cost')::numeric from jsonb_array_elements(allocations) a; end if;
   update public.inventory_balances set on_hand_base_quantity=on_hand_base_quantity-base_qty,inventory_value=inventory_value-total_cost,
    average_unit_cost=case when on_hand_base_quantity-base_qty=0 then 0 when settings.costing_method='FIFO' then round((inventory_value-total_cost)/(on_hand_base_quantity-base_qty),8) else average_unit_cost end,last_movement_at=target_transaction_date,updated_at=now()
    where organization_id=target_organization_id and product_variant_id=package.product_variant_id and storage_location_id=location.id;
  end if;
  movement_count:=movement_count+1;
 end loop;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'inventory.transaction.posted','inventory_transaction',tx_id,jsonb_build_object('type',target_transaction_type,'number',tx_number,'movements',movement_count));
 return jsonb_build_object('transaction_id',tx_id,'transaction_number',tx_number,'movement_count',movement_count,'replayed',false);
exception when unique_violation then
 select * into existing from public.inventory_transactions where organization_id=target_organization_id and idempotency_key=target_idempotency_key;
 if found and existing.request_hash=payload_hash then return jsonb_build_object('transaction_id',existing.id,'transaction_number',existing.transaction_number,'replayed',true); end if;
 raise exception using errcode='P0001',message='DUPLICATE_IDEMPOTENCY_KEY';
end $$;

revoke all on function public.next_inventory_number(uuid,text) from public,anon,authenticated;
revoke all on function public.post_inventory_transaction(uuid,uuid,text,timestamptz,uuid,text,text,uuid,jsonb,text,uuid,uuid,text,timestamptz,text,boolean) from public,anon;
grant execute on function public.post_inventory_transaction(uuid,uuid,text,timestamptz,uuid,text,text,uuid,jsonb,text,uuid,uuid,text,timestamptz,text,boolean) to authenticated;
