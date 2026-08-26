create or replace function public.inspect_sales_return(target_organization_id uuid,target_sales_return_id uuid,target_lines jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare r public.sales_returns%rowtype; item record; l public.sales_return_lines%rowtype; target_disposition text; accepted numeric; rejected numeric;
begin
 select * into r from public.sales_returns where organization_id=target_organization_id and id=target_sales_return_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 perform public.sales_assert_access(target_organization_id,r.branch_id,'sales.return_receive');
 if r.status not in('REQUESTED','APPROVED','RECEIVED') then raise exception using errcode='P0001',message='INVALID_RETURN_STATE'; end if;
 for item in select value from jsonb_array_elements(target_lines) loop
  select * into l from public.sales_return_lines where organization_id=target_organization_id and sales_return_id=r.id and id=(item.value->>'sales_return_line_id')::uuid for update;
  if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
  target_disposition:=item.value->>'disposition'; accepted:=coalesce((item.value->>'accepted_quantity')::numeric,0); rejected:=coalesce((item.value->>'rejected_quantity')::numeric,0);
  if target_disposition not in('RESTOCK_NORMAL','RESTOCK_DAMAGED','REJECT_RETURN') or accepted<0 or rejected<0 or accepted+rejected>(item.value->>'received_quantity')::numeric or accepted+rejected>l.requested_quantity then raise exception using errcode='P0001',message='INVALID_RETURN_DISPOSITION'; end if;
  if target_disposition like 'RESTOCK_%' and (accepted<=0 or not exists(select 1 from public.storage_locations sl where sl.organization_id=target_organization_id and sl.id=(item.value->>'destination_location_id')::uuid and sl.branch_id=r.branch_id and sl.is_active)) then raise exception using errcode='P0001',message='INVALID_RETURN_DISPOSITION'; end if;
  if target_disposition='REJECT_RETURN' and accepted<>0 then raise exception using errcode='P0001',message='INVALID_RETURN_DISPOSITION'; end if;
  update public.sales_return_lines set received_quantity=(item.value->>'received_quantity')::numeric,accepted_quantity=accepted,rejected_quantity=rejected,accepted_base_quantity=round(accepted*conversion_snapshot,6),condition=nullif(item.value->>'condition',''),disposition=target_disposition,destination_location_id=nullif(item.value->>'destination_location_id','')::uuid,notes=nullif(item.value->>'notes','') where id=l.id;
 end loop;
 update public.sales_returns set status='INSPECTED' where id=r.id;
end $$;

create or replace function public.sales_return_credit_amount(target_organization_id uuid,target_fulfilment_line_id uuid,target_accepted_base_quantity numeric)
returns numeric language sql security definer stable set search_path='' as $$
 select round(target_accepted_base_quantity/ol.ordered_base_quantity*ol.line_total,4)
 from public.sales_fulfillment_lines fl join public.sales_order_lines ol on ol.organization_id=fl.organization_id and ol.id=fl.sales_order_line_id
 where fl.organization_id=target_organization_id and fl.id=target_fulfilment_line_id
$$;
revoke all on function public.sales_return_credit_amount(uuid,uuid,numeric) from public,anon,authenticated;

-- Replace the expression used by post_sales_return without duplicating the long
-- locking and historical-cost body: the function source is patched in place.
do $$ declare definition text; begin
 select pg_get_functiondef('public.post_sales_return(uuid,uuid)'::regprocedure) into definition;
 definition:=replace(definition,
  'credit_total:=credit_total+round((rl.accepted_base_quantity/fl.base_quantity)*(select line_total from public.sales_order_lines where id=fl.sales_order_line_id),4);',
  'credit_total:=credit_total+public.sales_return_credit_amount(target_organization_id,fl.id,rl.accepted_base_quantity);');
 if definition not like '%sales_return_credit_amount%' then raise exception 'POST_SALES_RETURN_PATCH_FAILED'; end if;
 execute definition;
end $$;
revoke all on function public.inspect_sales_return(uuid,uuid,jsonb),public.post_sales_return(uuid,uuid) from public,anon;
grant execute on function public.inspect_sales_return(uuid,uuid,jsonb),public.post_sales_return(uuid,uuid) to authenticated;
