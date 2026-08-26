create or replace function public.post_stock_count(target_organization_id uuid,target_count_id uuid,target_reason_code_id uuid,target_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare session public.stock_count_sessions%rowtype; line record; inbound_lines jsonb:='[]'::jsonb; outbound_lines jsonb:='[]'::jsonb; package record; current_qty numeric; variance numeric; result_in jsonb; result_out jsonb; avg_cost numeric; movement_after numeric;
begin
 select * into session from public.stock_count_sessions where organization_id=target_organization_id and id=target_count_id for update;
 if not found or session.status not in ('SUBMITTED','READY_TO_POST') then raise exception using errcode='P0001',message='COUNT_ALREADY_POSTED'; end if;
 if not public.has_permission(target_organization_id,'inventory.count_post') or not public.can_access_branch(target_organization_id,session.branch_id) then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if exists(select 1 from public.stock_count_lines where count_session_id=session.id and counted_quantity is null) then raise exception using errcode='P0001',message='COUNT_INCOMPLETE'; end if;
 for line in select * from public.stock_count_lines where count_session_id=session.id for update loop
  select coalesce(sum(m.quantity_delta_base),0) into movement_after from public.inventory_movements m where m.organization_id=target_organization_id and m.product_variant_id=line.product_variant_id and m.storage_location_id=line.storage_location_id and m.posted_at>session.snapshot_at;
  current_qty:=line.expected_quantity_snapshot+movement_after; variance:=coalesce(line.recount_quantity,line.counted_quantity)-current_qty;
  select p.id,p.conversion_to_base into package from public.product_variant_packaging p where p.organization_id=target_organization_id and p.product_variant_id=line.product_variant_id and p.is_base_unit;
  select average_unit_cost into avg_cost from public.inventory_balances where organization_id=target_organization_id and product_variant_id=line.product_variant_id and storage_location_id=line.storage_location_id;
  update public.stock_count_lines set movement_since_snapshot=movement_after,variance_quantity=variance,variance_value=round(variance*coalesce(avg_cost,0),8) where id=line.id;
  if variance>0 then inbound_lines:=inbound_lines||jsonb_build_array(jsonb_build_object('product_variant_id',line.product_variant_id,'storage_location_id',line.storage_location_id,'packaging_id',package.id,'quantity',variance,'unit_cost',coalesce(avg_cost,0)));
  elsif variance<0 then outbound_lines:=outbound_lines||jsonb_build_array(jsonb_build_object('product_variant_id',line.product_variant_id,'storage_location_id',line.storage_location_id,'packaging_id',package.id,'quantity',abs(variance))); end if;
 end loop;
 if jsonb_array_length(inbound_lines)>0 then result_in:=public.post_inventory_transaction(target_organization_id,session.business_id,'STOCK_COUNT_ADJUSTMENT',now(),target_reason_code_id,session.notes,session.count_number,target_idempotency_key,inbound_lines,'STOCK_COUNT',session.id,null,null,null,'WEB',false); end if;
 if jsonb_array_length(outbound_lines)>0 then result_out:=public.post_inventory_transaction(target_organization_id,session.business_id,'STOCK_COUNT_ADJUSTMENT',now(),target_reason_code_id,session.notes,session.count_number,gen_random_uuid(),outbound_lines,'STOCK_COUNT',session.id,null,null,null,'WEB',false); end if;
 update public.stock_count_sessions set status='POSTED',posted_at=now(),posted_by=auth.uid(),posting_transaction_id=coalesce((result_in->>'transaction_id')::uuid,(result_out->>'transaction_id')::uuid),updated_at=now() where id=session.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id) values(target_organization_id,auth.uid(),'inventory.count_posted','stock_count',session.id);
 return jsonb_build_object('count_id',session.id,'inbound',result_in,'outbound',result_out);
end $$;

create or replace function public.reverse_inventory_transaction(target_organization_id uuid,target_transaction_id uuid,target_idempotency_key uuid,target_notes text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare original public.inventory_transactions%rowtype; existing public.inventory_transactions%rowtype; reversal_id uuid:=gen_random_uuid(); number text; movement record; new_movement_id uuid; balance public.inventory_balances%rowtype; layer public.inventory_cost_layers%rowtype; allocation record; payload_hash text;
begin
 payload_hash:=encode(extensions.digest(convert_to(jsonb_build_object('transaction',target_transaction_id,'notes',target_notes)::text,'UTF8'),'sha256'),'hex');
 select * into existing from public.inventory_transactions where organization_id=target_organization_id and idempotency_key=target_idempotency_key;
 if found then if existing.request_hash<>payload_hash then raise exception using errcode='P0001',message='IDEMPOTENCY_PAYLOAD_MISMATCH'; end if; return jsonb_build_object('transaction_id',existing.id,'replayed',true); end if;
 if not public.has_permission(target_organization_id,'inventory.transaction_reverse') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into original from public.inventory_transactions where organization_id=target_organization_id and id=target_transaction_id for update;
 if not found or original.status<>'POSTED' then raise exception using errcode='P0001',message='UNSAFE_REVERSAL'; end if;
 for movement in select * from public.inventory_movements where transaction_id=original.id order by id loop
  if not public.can_access_branch(target_organization_id,movement.branch_id) then raise exception using errcode='42501',message='BRANCH_ACCESS_DENIED'; end if;
  if movement.costing_method_snapshot='FIFO' and movement.quantity_delta_base>0 then
   select * into layer from public.inventory_cost_layers where inbound_movement_id=movement.id for update;
   if not found or layer.remaining_quantity<>layer.original_quantity then raise exception using errcode='P0001',message='UNSAFE_FIFO_REVERSAL'; end if;
  end if;
 end loop;
 number:=public.next_inventory_number(target_organization_id,'REV');
 insert into public.inventory_transactions(id,organization_id,business_id,transaction_number,transaction_type,status,reference_type,reference_id,transaction_date,posted_at,posted_by,notes,idempotency_key,request_hash,source,created_by)
 values(reversal_id,target_organization_id,original.business_id,number,'REVERSAL','POSTED','INVENTORY_TRANSACTION',original.id,now(),now(),auth.uid(),target_notes,target_idempotency_key,payload_hash,'WEB',auth.uid());
 for movement in select * from public.inventory_movements where transaction_id=original.id order by id loop
  perform pg_advisory_xact_lock(hashtextextended(target_organization_id::text||movement.product_variant_id::text||movement.storage_location_id::text,0));
  select * into balance from public.inventory_balances where organization_id=target_organization_id and product_variant_id=movement.product_variant_id and storage_location_id=movement.storage_location_id for update;
  if movement.quantity_delta_base>0 and balance.on_hand_base_quantity<movement.quantity_delta_base then raise exception using errcode='P0001',message='UNSAFE_REVERSAL'; end if;
  new_movement_id:=gen_random_uuid();
  insert into public.inventory_movements(id,organization_id,transaction_id,product_variant_id,branch_id,warehouse_id,storage_location_id,movement_type,quantity_delta_base,entered_quantity,packaging_id,conversion_to_base_snapshot,valuation_unit_cost,valuation_total,costing_method_snapshot,occurred_at,posted_at,reference_type,reference_id)
  values(new_movement_id,target_organization_id,reversal_id,movement.product_variant_id,movement.branch_id,movement.warehouse_id,movement.storage_location_id,'REVERSAL',-movement.quantity_delta_base,movement.entered_quantity,movement.packaging_id,movement.conversion_to_base_snapshot,movement.valuation_unit_cost,-movement.valuation_total,movement.costing_method_snapshot,now(),now(),'INVENTORY_TRANSACTION',original.id);
  update public.inventory_balances set on_hand_base_quantity=on_hand_base_quantity-movement.quantity_delta_base,inventory_value=inventory_value-movement.valuation_total,
   average_unit_cost=case when on_hand_base_quantity-movement.quantity_delta_base=0 then 0 else round((inventory_value-movement.valuation_total)/(on_hand_base_quantity-movement.quantity_delta_base),8) end,last_movement_at=now(),updated_at=now()
   where organization_id=target_organization_id and product_variant_id=movement.product_variant_id and storage_location_id=movement.storage_location_id;
  if movement.costing_method_snapshot='FIFO' then
   if movement.quantity_delta_base>0 then update public.inventory_cost_layers set remaining_quantity=0 where inbound_movement_id=movement.id;
   else
    for allocation in select * from public.inventory_cost_allocations where outbound_movement_id=movement.id loop update public.inventory_cost_layers set remaining_quantity=remaining_quantity+allocation.quantity where id=allocation.cost_layer_id; end loop;
   end if;
  end if;
 end loop;
 update public.inventory_transactions set status='REVERSED',reversed_at=now(),reversed_by=auth.uid(),reversal_transaction_id=reversal_id where id=original.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,before_data,after_data) values(target_organization_id,auth.uid(),'inventory.transaction_reversed','inventory_transaction',original.id,jsonb_build_object('status','POSTED'),jsonb_build_object('status','REVERSED','reversal_transaction_id',reversal_id));
 return jsonb_build_object('transaction_id',reversal_id,'transaction_number',number,'replayed',false);
end $$;

revoke all on function public.post_stock_count(uuid,uuid,uuid,uuid) from public,anon;
revoke all on function public.reverse_inventory_transaction(uuid,uuid,uuid,text) from public,anon;
grant execute on function public.post_stock_count(uuid,uuid,uuid,uuid),public.reverse_inventory_transaction(uuid,uuid,uuid,text) to authenticated;
