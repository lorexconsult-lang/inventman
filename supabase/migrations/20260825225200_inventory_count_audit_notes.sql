create or replace function public.post_stock_count(target_organization_id uuid,target_count_id uuid,target_reason_code_id uuid,target_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare session public.stock_count_sessions%rowtype; line record; movement_after numeric; current_qty numeric; variance numeric; package record; avg_cost numeric; inbound_lines jsonb:='[]'; outbound_lines jsonb:='[]'; result_in jsonb; result_out jsonb; audit_notes text;
begin
 perform public.require_permission(target_organization_id,'inventory.count_post');
 select * into session from public.stock_count_sessions where organization_id=target_organization_id and id=target_count_id for update;
 if not found then raise exception using errcode='P0001',message='COUNT_NOT_FOUND'; end if;
 if session.status='POSTED' then raise exception using errcode='P0001',message='COUNT_ALREADY_POSTED'; end if;
 if session.status not in ('SUBMITTED','READY_TO_POST') then raise exception using errcode='P0001',message='COUNT_NOT_READY'; end if;
 audit_notes:=coalesce(nullif(trim(session.notes),''),'Stock count variance for '||session.count_number);
 for line in select * from public.stock_count_lines where count_session_id=session.id order by id loop
  if line.counted_quantity is null then raise exception using errcode='P0001',message='COUNT_INCOMPLETE'; end if;
  select coalesce(sum(m.quantity_delta_base),0) into movement_after from public.inventory_movements m where m.organization_id=target_organization_id and m.product_variant_id=line.product_variant_id and m.storage_location_id=line.storage_location_id and m.posted_at>session.snapshot_at;
  current_qty:=line.expected_quantity_snapshot+movement_after; variance:=coalesce(line.recount_quantity,line.counted_quantity)-current_qty;
  select p.id,p.conversion_to_base into package from public.product_variant_packaging p where p.organization_id=target_organization_id and p.product_variant_id=line.product_variant_id and p.is_base_unit;
  select average_unit_cost into avg_cost from public.inventory_balances where organization_id=target_organization_id and product_variant_id=line.product_variant_id and storage_location_id=line.storage_location_id;
  update public.stock_count_lines set movement_since_snapshot=movement_after,variance_quantity=variance,variance_value=round(variance*coalesce(avg_cost,0),8) where id=line.id;
  if variance>0 then inbound_lines:=inbound_lines||jsonb_build_array(jsonb_build_object('direction','IN','product_variant_id',line.product_variant_id,'storage_location_id',line.storage_location_id,'packaging_id',package.id,'quantity',variance,'unit_cost',coalesce(avg_cost,0)));
  elsif variance<0 then outbound_lines:=outbound_lines||jsonb_build_array(jsonb_build_object('direction','OUT','product_variant_id',line.product_variant_id,'storage_location_id',line.storage_location_id,'packaging_id',package.id,'quantity',abs(variance))); end if;
 end loop;
 if jsonb_array_length(inbound_lines)>0 then result_in:=public.post_inventory_transaction(target_organization_id,session.business_id,'STOCK_COUNT_ADJUSTMENT',now(),target_reason_code_id,audit_notes,session.count_number,target_idempotency_key,inbound_lines,'STOCK_COUNT',session.id,null,null,null,'WEB',false); end if;
 if jsonb_array_length(outbound_lines)>0 then result_out:=public.post_inventory_transaction(target_organization_id,session.business_id,'STOCK_COUNT_ADJUSTMENT',now(),target_reason_code_id,audit_notes,session.count_number,gen_random_uuid(),outbound_lines,'STOCK_COUNT',session.id,null,null,null,'WEB',false); end if;
 update public.stock_count_sessions set status='POSTED',posted_at=now(),posted_by=auth.uid(),posting_transaction_id=coalesce((result_in->>'transaction_id')::uuid,(result_out->>'transaction_id')::uuid),updated_at=now() where id=session.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id) values(target_organization_id,auth.uid(),'inventory.count_posted','stock_count',session.id);
 return jsonb_build_object('count_id',session.id,'inbound',result_in,'outbound',result_out);
end $$;

revoke all on function public.post_stock_count(uuid,uuid,uuid,uuid) from public,anon;
grant execute on function public.post_stock_count(uuid,uuid,uuid,uuid) to authenticated;
