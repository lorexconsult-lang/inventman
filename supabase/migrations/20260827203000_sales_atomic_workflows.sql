-- Phase 4 atomic Sales workflows. Browser clients never write transactional tables directly.

create or replace function public.sales_payload_hash(payload jsonb) returns text
language sql immutable set search_path='' as $$
 select encode(extensions.digest(convert_to(coalesce(payload,'null'::jsonb)::text,'UTF8'),'sha256'),'hex')
$$;
revoke all on function public.sales_payload_hash(jsonb) from public,anon,authenticated;

create or replace function public.sales_assert_access(target_organization_id uuid,target_branch_id uuid,target_permission text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not public.has_permission(target_organization_id,target_permission) then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if target_branch_id is not null and not public.can_access_branch(target_organization_id,target_branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 return actor;
end $$;

create or replace function public.create_sales_fulfilment(target_organization_id uuid,target_sales_order_id uuid,target_lines jsonb,target_fulfilled_at timestamptz,target_notes text,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare o public.sales_orders%rowtype; actor uuid; result uuid:=gen_random_uuid(); item record; l public.sales_order_lines%rowtype; entered numeric; base_qty numeric; hash text:=public.sales_payload_hash(jsonb_build_object('order',target_sales_order_id,'lines',target_lines,'at',target_fulfilled_at)); existing record;
begin
 select id,request_hash into existing from public.sales_fulfillments where organization_id=target_organization_id and idempotency_key=target_idempotency_key; if found then if existing.request_hash<>hash then raise exception using errcode='P0001',message='IDEMPOTENCY_PAYLOAD_MISMATCH'; end if; return existing.id; end if;
 select * into o from public.sales_orders where organization_id=target_organization_id and id=target_sales_order_id; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if; actor:=public.sales_assert_access(target_organization_id,o.branch_id,'sales.fulfilment_create');
 if o.status not in('CONFIRMED','PARTIALLY_RESERVED','RESERVED','PARTIALLY_FULFILLED') then raise exception using errcode='P0001',message='INVALID_ORDER_STATE'; end if;
 insert into public.sales_fulfillments(id,organization_id,business_id,fulfilment_number,sales_order_id,customer_id,branch_id,warehouse_id,storage_location_id,delivery_address_snapshot,fulfilled_at,fulfilled_by,notes,idempotency_key,request_hash)
 values(result,target_organization_id,o.business_id,public.next_inventory_number(target_organization_id,'FUL'),o.id,o.customer_id,o.branch_id,o.fulfilment_warehouse_id,o.fulfilment_location_id,o.delivery_address_snapshot,coalesce(target_fulfilled_at,now()),actor,target_notes,target_idempotency_key,hash);
 for item in select value from jsonb_array_elements(target_lines) loop
  select * into l from public.sales_order_lines where organization_id=target_organization_id and sales_order_id=o.id and id=(item.value->>'sales_order_line_id')::uuid; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
  entered:=(item.value->>'quantity')::numeric; base_qty:=round(entered*l.conversion_snapshot,6); if entered<=0 or base_qty>l.ordered_base_quantity-l.fulfilled_base_quantity-l.cancelled_base_quantity then raise exception using errcode='P0001',message='FULFILMENT_EXCEEDS_OUTSTANDING'; end if;
  insert into public.sales_fulfillment_lines(organization_id,fulfilment_id,sales_order_line_id,product_variant_id,packaging_id,entered_quantity,conversion_snapshot,base_quantity,revenue_base)
  values(target_organization_id,result,l.id,l.product_variant_id,l.packaging_id,entered,l.conversion_snapshot,base_qty,round((entered*l.unit_price-l.discount*(base_qty/l.ordered_base_quantity)+l.tax*(base_qty/l.ordered_base_quantity))*o.exchange_rate,8));
 end loop;
 insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id) values(target_organization_id,'FULFILMENT',result,'CREATED',actor); return result;
end $$;

create or replace function public.post_sales_fulfilment(target_organization_id uuid,target_fulfilment_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare f public.sales_fulfillments%rowtype; o public.sales_orders%rowtype; fl public.sales_fulfillment_lines%rowtype; ol public.sales_order_lines%rowtype; ledger_lines jsonb:='[]'::jsonb; result jsonb; tx uuid; movement record; actor uuid; consume_key uuid;
begin
 select * into f from public.sales_fulfillments where organization_id=target_organization_id and id=target_fulfilment_id for update; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if; actor:=public.sales_assert_access(target_organization_id,f.branch_id,'sales.fulfilment_post');
 if f.status='POSTED' then return jsonb_build_object('fulfilment_id',f.id,'inventory_transaction_id',f.inventory_transaction_id,'replayed',true); end if; if f.status<>'DRAFT' then raise exception using errcode='P0001',message='FULFILMENT_ALREADY_POSTED'; end if;
 select * into o from public.sales_orders where organization_id=target_organization_id and id=f.sales_order_id for update; if o.status not in('CONFIRMED','PARTIALLY_RESERVED','RESERVED','PARTIALLY_FULFILLED') then raise exception using errcode='P0001',message='INVALID_ORDER_STATE'; end if;
 for fl in select * from public.sales_fulfillment_lines where organization_id=target_organization_id and fulfilment_id=f.id order by id for update loop
  select * into ol from public.sales_order_lines where organization_id=target_organization_id and id=fl.sales_order_line_id for update;
  if fl.base_quantity>ol.ordered_base_quantity-ol.fulfilled_base_quantity-ol.cancelled_base_quantity then raise exception using errcode='P0001',message='FULFILMENT_EXCEEDS_OUTSTANDING'; end if;
  if ol.reservation_id is null or fl.base_quantity>ol.reserved_base_quantity then raise exception using errcode='P0001',message='RESERVATION_CONSUMPTION_FAILED'; end if;
  consume_key:=extensions.uuid_generate_v5(fl.id,'sales-fulfilment-reservation-consumption'); perform public.consume_sales_reservation(target_organization_id,ol.reservation_id,fl.base_quantity,consume_key);
  update public.sales_order_lines set reserved_base_quantity=reserved_base_quantity-fl.base_quantity where id=ol.id;
  ledger_lines:=ledger_lines||jsonb_build_array(jsonb_build_object('product_variant_id',fl.product_variant_id,'packaging_id',fl.packaging_id,'storage_location_id',f.storage_location_id,'quantity',fl.entered_quantity));
 end loop;
 result:=public.post_inventory_transaction(target_organization_id,f.business_id,'SALE',f.fulfilled_at,null,coalesce(f.notes,'Sales fulfilment '||f.fulfilment_number),f.fulfilment_number,f.idempotency_key,ledger_lines,'SALES_FULFILMENT',f.id,null,null,null,'WEB',false); tx:=(result->>'transaction_id')::uuid;
 for fl in select * from public.sales_fulfillment_lines where fulfilment_id=f.id order by id for update loop
  select m.id,m.valuation_total into movement from public.inventory_movements m where m.organization_id=target_organization_id and m.transaction_id=tx and m.product_variant_id=fl.product_variant_id and m.packaging_id=fl.packaging_id order by m.id limit 1;
  if movement.id is null then raise exception using errcode='P0001',message='INVENTORY_POST_FAILED'; end if;
  update public.sales_fulfillment_lines set inventory_movement_id=movement.id,inventory_cost_base=abs(movement.valuation_total),gross_profit_base=revenue_base-abs(movement.valuation_total),gross_margin_base=case when revenue_base=0 then 0 else round((revenue_base-abs(movement.valuation_total))/revenue_base*100,8) end where id=fl.id;
  update public.sales_order_lines set fulfilled_base_quantity=fulfilled_base_quantity+fl.base_quantity where id=fl.sales_order_line_id;
 end loop;
 update public.sales_fulfillments set status='POSTED',inventory_transaction_id=tx where id=f.id;
 update public.sales_orders set status=case when not exists(select 1 from public.sales_order_lines where sales_order_id=o.id and fulfilled_base_quantity+cancelled_base_quantity<ordered_base_quantity) then 'FULFILLED' else 'PARTIALLY_FULFILLED' end,updated_at=now() where id=o.id returning status into o.status;
 insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id,details) values(target_organization_id,'FULFILMENT',f.id,'POSTED',actor,jsonb_build_object('inventory_transaction_id',tx)); return jsonb_build_object('fulfilment_id',f.id,'inventory_transaction_id',tx,'order_status',o.status,'replayed',false);
end $$;

create or replace function public.create_customer_invoice(target_organization_id uuid,target_sales_order_id uuid,target_fulfilment_ids uuid[],target_invoice_date date,target_due_date date,target_notes text,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare o public.sales_orders%rowtype; actor uuid; result uuid:=gen_random_uuid(); fl record; eligible numeric; already numeric; qty numeric; sub numeric:=0; taxes numeric:=0; hash text:=public.sales_payload_hash(jsonb_build_object('order',target_sales_order_id,'fulfilments',target_fulfilment_ids,'date',target_invoice_date,'due',target_due_date)); existing record;
begin
 select id,request_hash into existing from public.customer_invoices where organization_id=target_organization_id and idempotency_key=target_idempotency_key; if found then if existing.request_hash<>hash then raise exception using errcode='P0001',message='IDEMPOTENCY_PAYLOAD_MISMATCH'; end if; return existing.id; end if;
 select * into o from public.sales_orders where organization_id=target_organization_id and id=target_sales_order_id for update; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if; actor:=public.sales_assert_access(target_organization_id,o.branch_id,'sales.invoice_create');
 insert into public.customer_invoices(id,organization_id,business_id,invoice_number,customer_id,sales_order_id,branch_id,invoice_date,due_date,currency,exchange_rate,base_currency,billing_address_snapshot,customer_name_snapshot,subtotal,tax,total,base_currency_total,payment_terms,notes,idempotency_key,request_hash,created_by)
 values(result,target_organization_id,o.business_id,public.next_inventory_number(target_organization_id,'CINV'),o.customer_id,o.id,o.branch_id,coalesce(target_invoice_date,current_date),target_due_date,o.currency,o.exchange_rate,o.base_currency,o.billing_address_snapshot,o.customer_name_snapshot,0,0,0,0,o.payment_terms,target_notes,target_idempotency_key,hash,actor);
 for fl in select f.id fulfilment_id,l.*,ol.description_snapshot,ol.sku_snapshot,ol.unit_price,ol.discount line_discount,ol.tax line_tax,ol.ordered_base_quantity from public.sales_fulfillments f join public.sales_fulfillment_lines l on l.organization_id=f.organization_id and l.fulfilment_id=f.id join public.sales_order_lines ol on ol.organization_id=l.organization_id and ol.id=l.sales_order_line_id where f.organization_id=target_organization_id and f.sales_order_id=o.id and f.status='POSTED' and f.id=any(target_fulfilment_ids) order by l.id loop
  select coalesce(sum(il.quantity*il.conversion_snapshot),0) into already from public.customer_invoice_lines il join public.customer_invoices i on i.organization_id=il.organization_id and i.id=il.invoice_id where il.organization_id=target_organization_id and il.sales_fulfillment_line_id=fl.id and i.status<>'VOID'; eligible:=fl.base_quantity-already; if eligible<=0 then raise exception using errcode='P0001',message='INVOICE_EXCEEDS_FULFILLED_VALUE'; end if; qty:=round(eligible/fl.conversion_snapshot,6);
  insert into public.customer_invoice_lines(organization_id,invoice_id,sales_order_line_id,sales_fulfillment_line_id,product_variant_id,description_snapshot,sku_snapshot,quantity,conversion_snapshot,unit_price,discount,tax,line_total)
  values(target_organization_id,result,fl.sales_order_line_id,fl.id,fl.product_variant_id,fl.description_snapshot,fl.sku_snapshot,qty,fl.conversion_snapshot,fl.unit_price,round(fl.line_discount*(eligible/fl.ordered_base_quantity),4),round(fl.line_tax*(eligible/fl.ordered_base_quantity),4),round(qty*fl.unit_price-fl.line_discount*(eligible/fl.ordered_base_quantity)+fl.line_tax*(eligible/fl.ordered_base_quantity),4));
  insert into public.customer_invoice_fulfillments(organization_id,invoice_id,fulfilment_id) values(target_organization_id,result,fl.fulfilment_id) on conflict do nothing;
 end loop;
 select coalesce(sum(quantity*unit_price),0),coalesce(sum(tax),0) into sub,taxes from public.customer_invoice_lines where invoice_id=result; if sub=0 and taxes=0 then raise exception using errcode='P0001',message='INVOICE_EXCEEDS_FULFILLED_VALUE'; end if;
 update public.customer_invoices set subtotal=sub,tax=taxes,total=sub+taxes,base_currency_total=round((sub+taxes)*o.exchange_rate,4) where id=result; return result;
end $$;

create or replace function public.issue_customer_invoice(target_organization_id uuid,target_invoice_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare i public.customer_invoices%rowtype; actor uuid; stock_before numeric; stock_after numeric;
begin
 select * into i from public.customer_invoices where organization_id=target_organization_id and id=target_invoice_id for update; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if; actor:=public.sales_assert_access(target_organization_id,i.branch_id,'sales.invoice_issue');
 if i.status='ISSUED' then return jsonb_build_object('invoice_id',i.id,'replayed',true); end if; if i.status<>'DRAFT' then raise exception using errcode='P0001',message='INVOICE_ALREADY_ISSUED'; end if;
 select coalesce(sum(on_hand_base_quantity),0) into stock_before from public.inventory_balances where organization_id=target_organization_id;
 update public.customer_invoices set status='ISSUED',issued_by=actor,issued_at=now(),due_date=coalesce(due_date,invoice_date+30),updated_at=now() where id=i.id;
 select coalesce(sum(on_hand_base_quantity),0) into stock_after from public.inventory_balances where organization_id=target_organization_id; if stock_after<>stock_before then raise exception using errcode='P0001',message='INVOICE_STOCK_MUTATION'; end if;
 update public.sales_orders set status=case when (select coalesce(sum(il.quantity*il.conversion_snapshot),0) from public.customer_invoice_lines il join public.customer_invoices ci on ci.id=il.invoice_id where ci.sales_order_id=i.sales_order_id and ci.status not in('DRAFT','VOID')) >= (select coalesce(sum(fulfilled_base_quantity),0) from public.sales_order_lines where sales_order_id=i.sales_order_id) then 'INVOICED' else 'PARTIALLY_INVOICED' end where id=i.sales_order_id and status<>'CANCELLED';
 insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id) values(target_organization_id,'INVOICE',i.id,'ISSUED',actor); return jsonb_build_object('invoice_id',i.id,'replayed',false);
end $$;
revoke all on function public.sales_assert_access(uuid,uuid,text) from public,anon,authenticated;

-- Preserve the Phase 2 reservation engine while allowing its Sales-owned source
-- records to be managed by the corresponding Sales capabilities.
create or replace function public.reserve_inventory(target_organization_id uuid,target_product_variant_id uuid,target_storage_location_id uuid,target_quantity numeric,target_source_type text,target_source_id uuid,target_expires_at timestamptz,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); location record; balance public.inventory_balances%rowtype; existing public.inventory_reservations%rowtype; reservation_id uuid:=gen_random_uuid(); payload_hash text; permitted boolean;
begin
 payload_hash:=encode(extensions.digest(convert_to(jsonb_build_object('variant',target_product_variant_id,'location',target_storage_location_id,'quantity',target_quantity,'source_type',target_source_type,'source_id',target_source_id,'expires',target_expires_at)::text,'UTF8'),'sha256'),'hex');
 select * into existing from public.inventory_reservations where organization_id=target_organization_id and idempotency_key=target_idempotency_key; if found then if existing.request_hash<>payload_hash then raise exception using errcode='P0001',message='IDEMPOTENCY_PAYLOAD_MISMATCH'; end if; return existing.id; end if;
 permitted:=case when target_source_type='SALES_ORDER_LINE' then public.has_permission(target_organization_id,'sales.order_confirm') else public.has_permission(target_organization_id,'inventory.reserve') end;
 if actor is null or not permitted then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if; if target_quantity<=0 then raise exception using errcode='22023',message='INVALID_QUANTITY'; end if;
 select id,branch_id,warehouse_id into location from public.storage_locations where organization_id=target_organization_id and id=target_storage_location_id and is_active; if not found then raise exception using errcode='P0001',message='INVALID_LOCATION'; end if; if not public.can_access_branch(target_organization_id,location.branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 if not exists(select 1 from public.product_variants where organization_id=target_organization_id and id=target_product_variant_id and status='ACTIVE') then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 perform pg_advisory_xact_lock(hashtextextended(target_organization_id::text||target_product_variant_id::text||target_storage_location_id::text,0)); select * into balance from public.inventory_balances where organization_id=target_organization_id and product_variant_id=target_product_variant_id and storage_location_id=target_storage_location_id for update;
 if not found or balance.on_hand_base_quantity-balance.reserved_base_quantity<target_quantity then raise exception using errcode='P0001',message='INSUFFICIENT_AVAILABLE_STOCK'; end if;
 insert into public.inventory_reservations(id,organization_id,product_variant_id,branch_id,warehouse_id,storage_location_id,quantity_base,remaining_quantity,source_type,source_id,expires_at,idempotency_key,request_hash,created_by) values(reservation_id,target_organization_id,target_product_variant_id,location.branch_id,location.warehouse_id,target_storage_location_id,target_quantity,target_quantity,target_source_type,target_source_id,target_expires_at,target_idempotency_key,payload_hash,actor);
 update public.inventory_balances set reserved_base_quantity=reserved_base_quantity+target_quantity,updated_at=now() where organization_id=target_organization_id and product_variant_id=target_product_variant_id and storage_location_id=target_storage_location_id;
 insert into public.inventory_reservation_events(organization_id,reservation_id,event_type,quantity,idempotency_key,actor_id) values(target_organization_id,reservation_id,'RESERVED',target_quantity,target_idempotency_key,actor); return reservation_id;
end $$;

create or replace function public.release_inventory_reservation(target_organization_id uuid,target_reservation_id uuid,target_quantity numeric,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); reservation public.inventory_reservations%rowtype; existing uuid; event_name text; permitted boolean;
begin
 select reservation_id into existing from public.inventory_reservation_events where organization_id=target_organization_id and idempotency_key=target_idempotency_key; if found then return existing; end if;
 select * into reservation from public.inventory_reservations where organization_id=target_organization_id and id=target_reservation_id for update; if not found or reservation.status<>'ACTIVE' then raise exception using errcode='P0001',message='RESERVATION_NOT_ACTIVE'; end if;
 permitted:=case when reservation.source_type='SALES_ORDER_LINE' then public.has_permission(target_organization_id,'sales.order_cancel') else public.has_permission(target_organization_id,'inventory.release_reservation') end;
 if actor is null or not permitted then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if; if not public.can_access_branch(target_organization_id,reservation.branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 if target_quantity<=0 or target_quantity>reservation.remaining_quantity then raise exception using errcode='22023',message='INVALID_RELEASE_QUANTITY'; end if; event_name:=case when target_quantity=reservation.remaining_quantity then 'RELEASED' else 'PARTIALLY_RELEASED' end;
 update public.inventory_reservations set remaining_quantity=remaining_quantity-target_quantity,status=case when remaining_quantity-target_quantity=0 then 'RELEASED' else 'ACTIVE' end,updated_at=now() where id=reservation.id;
 update public.inventory_balances set reserved_base_quantity=reserved_base_quantity-target_quantity,updated_at=now() where organization_id=target_organization_id and product_variant_id=reservation.product_variant_id and storage_location_id=reservation.storage_location_id;
 insert into public.inventory_reservation_events(organization_id,reservation_id,event_type,quantity,idempotency_key,actor_id) values(target_organization_id,reservation.id,event_name,target_quantity,target_idempotency_key,actor); return reservation.id;
end $$;

create or replace function public.resolve_sales_price(target_organization_id uuid,target_price_list_id uuid,target_branch_id uuid,target_product_variant_id uuid,target_packaging_id uuid,target_quantity numeric,target_at timestamptz default now())
returns numeric language plpgsql security definer stable set search_path='' as $$
declare result numeric;
begin
 if auth.uid() is null or not public.has_permission(target_organization_id,'sales.order_create') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if not public.can_access_branch(target_organization_id,target_branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 select pp.amount into result from public.product_prices pp
 where pp.organization_id=target_organization_id and pp.price_list_id=target_price_list_id and pp.product_variant_id=target_product_variant_id
 and pp.packaging_id=target_packaging_id and pp.status='ACTIVE' and pp.min_quantity<=target_quantity
 and (pp.branch_id is null or pp.branch_id=target_branch_id) and (pp.effective_from is null or pp.effective_from<=target_at) and (pp.effective_to is null or pp.effective_to>target_at)
 order by (pp.branch_id is not null) desc,pp.min_quantity desc,pp.effective_from desc nulls last,pp.id limit 1;
 if result is null then raise exception using errcode='P0001',message='PRICE_NOT_FOUND'; end if;
 return result;
end $$;

create or replace function public.create_customer(target_organization_id uuid,target_customer jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; result uuid:=gen_random_uuid();
begin
 actor:=public.sales_assert_access(target_organization_id,null,'customers.create');
 insert into public.customers(id,organization_id,customer_code,customer_type,display_name,legal_name,first_name,last_name,email,phone,tax_number,registration_number,default_currency,default_price_list_id,default_payment_terms,credit_limit,notes,created_by)
 values(result,target_organization_id,trim(target_customer->>'customer_code'),coalesce(target_customer->>'customer_type','BUSINESS'),trim(target_customer->>'display_name'),nullif(trim(target_customer->>'legal_name'),''),nullif(trim(target_customer->>'first_name'),''),nullif(trim(target_customer->>'last_name'),''),nullif(trim(target_customer->>'email'),''),nullif(trim(target_customer->>'phone'),''),nullif(trim(target_customer->>'tax_number'),''),nullif(trim(target_customer->>'registration_number'),''),coalesce(target_customer->>'default_currency',(select currency_code from public.organizations where id=target_organization_id)),nullif(target_customer->>'default_price_list_id','')::uuid,nullif(trim(target_customer->>'default_payment_terms'),''),coalesce((target_customer->>'credit_limit')::numeric,0),nullif(trim(target_customer->>'notes'),''),actor);
 insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id) values(target_organization_id,'CUSTOMER',result,'CREATED',actor); return result;
exception when foreign_key_violation then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE';
end $$;

create or replace function public.create_sales_quotation(target_organization_id uuid,target_business_id uuid,target_customer_id uuid,target_branch_id uuid,target_expiry_date date,target_price_list_id uuid,target_currency text,target_exchange_rate numeric,target_billing_address jsonb,target_delivery_address jsonb,target_lines jsonb,target_notes text,target_terms text,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; result uuid:=gen_random_uuid(); customer public.customers%rowtype; item record; package record; price numeric; line_total numeric; subtotal numeric:=0; tax_total numeric:=0; hash text:=public.sales_payload_hash(jsonb_build_object('business',target_business_id,'customer',target_customer_id,'branch',target_branch_id,'expiry',target_expiry_date,'price_list',target_price_list_id,'currency',target_currency,'rate',target_exchange_rate,'lines',target_lines)); existing record;
begin
 select id,request_hash into existing from public.sales_quotations where organization_id=target_organization_id and idempotency_key=target_idempotency_key;
 if found then if existing.request_hash<>hash then raise exception using errcode='P0001',message='IDEMPOTENCY_PAYLOAD_MISMATCH'; end if; return existing.id; end if;
 actor:=public.sales_assert_access(target_organization_id,target_branch_id,'sales.quotation_create');
 select * into customer from public.customers where organization_id=target_organization_id and id=target_customer_id and status='ACTIVE' and credit_status<>'BLOCKED';
 if not found then raise exception using errcode='P0001',message='CUSTOMER_INACTIVE'; end if;
 if jsonb_typeof(target_lines)<>'array' or jsonb_array_length(target_lines)=0 then raise exception using errcode='22023',message='INVALID_LINES'; end if;
 for item in select value from jsonb_array_elements(target_lines) loop
  select p.id,p.product_variant_id,p.conversion_to_base,v.name,v.sku into package from public.product_variant_packaging p join public.product_variants v on v.organization_id=p.organization_id and v.id=p.product_variant_id where p.organization_id=target_organization_id and p.id=(item.value->>'packaging_id')::uuid and p.product_variant_id=(item.value->>'product_variant_id')::uuid and p.is_active and p.can_sell and v.status='ACTIVE';
  if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
  price:=coalesce(nullif(item.value->>'unit_price','')::numeric,public.resolve_sales_price(target_organization_id,target_price_list_id,target_branch_id,package.product_variant_id,package.id,(item.value->>'quantity')::numeric));
  line_total:=round(price*(item.value->>'quantity')::numeric-coalesce((item.value->>'discount')::numeric,0)+coalesce((item.value->>'tax')::numeric,0),4); subtotal:=subtotal+round(price*(item.value->>'quantity')::numeric,4); tax_total:=tax_total+coalesce((item.value->>'tax')::numeric,0);
 end loop;
 insert into public.sales_quotations(id,organization_id,business_id,quotation_number,customer_id,branch_id,quotation_date,expiry_date,currency,exchange_rate,base_currency,price_list_id,billing_address_snapshot,delivery_address_snapshot,customer_name_snapshot,subtotal,discount,tax,total,base_currency_total,notes,terms,created_by,idempotency_key,request_hash)
 values(result,target_organization_id,target_business_id,public.next_inventory_number(target_organization_id,'QUO'),customer.id,target_branch_id,current_date,target_expiry_date,target_currency,target_exchange_rate,(select currency_code from public.organizations where id=target_organization_id),target_price_list_id,target_billing_address,target_delivery_address,customer.display_name,subtotal,0,tax_total,subtotal+tax_total,round((subtotal+tax_total)*target_exchange_rate,4),target_notes,target_terms,actor,target_idempotency_key,hash);
 for item in select value from jsonb_array_elements(target_lines) loop
  select p.id,p.product_variant_id,p.conversion_to_base,v.name,v.sku into package from public.product_variant_packaging p join public.product_variants v on v.organization_id=p.organization_id and v.id=p.product_variant_id where p.organization_id=target_organization_id and p.id=(item.value->>'packaging_id')::uuid and p.product_variant_id=(item.value->>'product_variant_id')::uuid;
  price:=coalesce(nullif(item.value->>'unit_price','')::numeric,public.resolve_sales_price(target_organization_id,target_price_list_id,target_branch_id,package.product_variant_id,package.id,(item.value->>'quantity')::numeric)); line_total:=round(price*(item.value->>'quantity')::numeric-coalesce((item.value->>'discount')::numeric,0)+coalesce((item.value->>'tax')::numeric,0),4);
  insert into public.sales_quotation_lines(id,organization_id,quotation_id,product_variant_id,packaging_id,description_snapshot,sku_snapshot,entered_quantity,conversion_snapshot,base_quantity,unit_price,minimum_price_snapshot,discount,tax,line_total)
  values(gen_random_uuid(),target_organization_id,result,package.product_variant_id,package.id,coalesce(nullif(item.value->>'description',''),package.name),coalesce(package.sku,''),(item.value->>'quantity')::numeric,package.conversion_to_base,round((item.value->>'quantity')::numeric*package.conversion_to_base,6),price,price,coalesce((item.value->>'discount')::numeric,0),coalesce((item.value->>'tax')::numeric,0),line_total);
 end loop;
 insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id) values(target_organization_id,'QUOTATION',result,'CREATED',actor); return result;
exception when foreign_key_violation then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE';
end $$;

create or replace function public.transition_sales_quotation(target_organization_id uuid,target_quotation_id uuid,target_action text)
returns text language plpgsql security definer set search_path='' as $$
declare q public.sales_quotations%rowtype; actor uuid; next_status text; permission text;
begin
 select * into q from public.sales_quotations where organization_id=target_organization_id and id=target_quotation_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 permission:=case when target_action in('APPROVE','REJECT') then 'sales.quotation_approve' else 'sales.quotation_submit' end;
 actor:=public.sales_assert_access(target_organization_id,q.branch_id,permission);
 next_status:=case when target_action='SUBMIT' and q.status='DRAFT' then 'PENDING_APPROVAL' when target_action='APPROVE' and q.status='PENDING_APPROVAL' then 'APPROVED' when target_action='REJECT' and q.status='PENDING_APPROVAL' then 'REJECTED' when target_action='SEND' and q.status='APPROVED' then 'SENT' when target_action='ACCEPT' and q.status in('APPROVED','SENT') then 'ACCEPTED' when target_action='CANCEL' and q.status in('DRAFT','PENDING_APPROVAL','APPROVED','SENT','ACCEPTED') then 'CANCELLED' else null end;
 if next_status is null then raise exception using errcode='P0001',message='INVALID_QUOTATION_STATE'; end if;
 update public.sales_quotations set status=next_status,approved_by=case when next_status='APPROVED' then actor else approved_by end,approved_at=case when next_status='APPROVED' then now() else approved_at end,updated_at=now() where id=q.id;
 insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id) values(target_organization_id,'QUOTATION',q.id,next_status,actor); return next_status;
end $$;

create or replace function public.convert_quotation_to_sales_order(target_organization_id uuid,target_quotation_id uuid,target_warehouse_id uuid,target_location_id uuid,target_requested_delivery_date date,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare q public.sales_quotations%rowtype; customer public.customers%rowtype; result uuid; actor uuid; hash text:=public.sales_payload_hash(jsonb_build_object('quotation',target_quotation_id,'warehouse',target_warehouse_id,'location',target_location_id,'delivery',target_requested_delivery_date)); existing public.sales_orders%rowtype;
begin
 select * into q from public.sales_quotations where organization_id=target_organization_id and id=target_quotation_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 select * into existing from public.sales_orders where organization_id=target_organization_id and originating_quotation_id=q.id;
 if found then if existing.request_hash<>hash then raise exception using errcode='P0001',message='IDEMPOTENCY_PAYLOAD_MISMATCH'; end if; return existing.id; end if;
 actor:=public.sales_assert_access(target_organization_id,q.branch_id,'sales.order_create');
 if q.status not in('APPROVED','SENT','ACCEPTED') or (q.expiry_date is not null and q.expiry_date<current_date and not public.has_permission(target_organization_id,'sales.quotation_approve')) then raise exception using errcode='P0001',message='INVALID_QUOTATION_STATE'; end if;
 select * into customer from public.customers where organization_id=target_organization_id and id=q.customer_id and status='ACTIVE' and credit_status<>'BLOCKED'; if not found then raise exception using errcode='P0001',message='CUSTOMER_INACTIVE'; end if;
 if not exists(select 1 from public.storage_locations l where l.organization_id=target_organization_id and l.id=target_location_id and l.warehouse_id=target_warehouse_id and l.branch_id=q.branch_id and l.is_active) then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 result:=gen_random_uuid();
 insert into public.sales_orders(id,organization_id,business_id,sales_order_number,customer_id,originating_quotation_id,branch_id,fulfilment_warehouse_id,fulfilment_location_id,order_date,requested_delivery_date,currency,exchange_rate,base_currency,price_list_id,subtotal,discount,tax,total,base_currency_total,payment_terms,billing_address_snapshot,delivery_address_snapshot,customer_name_snapshot,notes,idempotency_key,request_hash,created_by)
 values(result,target_organization_id,q.business_id,public.next_inventory_number(target_organization_id,'SO'),q.customer_id,q.id,q.branch_id,target_warehouse_id,target_location_id,current_date,target_requested_delivery_date,q.currency,q.exchange_rate,q.base_currency,q.price_list_id,q.subtotal,q.discount,q.tax,q.total,q.base_currency_total,customer.default_payment_terms,q.billing_address_snapshot,q.delivery_address_snapshot,q.customer_name_snapshot,q.notes,target_idempotency_key,hash,actor);
 insert into public.sales_order_lines(organization_id,sales_order_id,product_variant_id,packaging_id,description_snapshot,sku_snapshot,ordered_quantity,conversion_snapshot,ordered_base_quantity,unit_price,discount,tax,line_total)
 select organization_id,result,product_variant_id,packaging_id,description_snapshot,sku_snapshot,entered_quantity,conversion_snapshot,base_quantity,unit_price,discount,tax,line_total from public.sales_quotation_lines where organization_id=target_organization_id and quotation_id=q.id;
 update public.sales_quotations set status='CONVERTED',updated_at=now() where id=q.id;
 insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id,details) values(target_organization_id,'QUOTATION',q.id,'CONVERTED',actor,jsonb_build_object('sales_order_id',result)); return result;
end $$;

create or replace function public.create_sales_order(target_organization_id uuid,target_business_id uuid,target_customer_id uuid,target_branch_id uuid,target_warehouse_id uuid,target_location_id uuid,target_requested_delivery_date date,target_price_list_id uuid,target_currency text,target_exchange_rate numeric,target_billing_address jsonb,target_delivery_address jsonb,target_lines jsonb,target_notes text,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare quote_id uuid; order_id uuid;
begin
 quote_id:=public.create_sales_quotation(target_organization_id,target_business_id,target_customer_id,target_branch_id,current_date+1,target_price_list_id,target_currency,target_exchange_rate,target_billing_address,target_delivery_address,target_lines,target_notes,null,target_idempotency_key);
 update public.sales_quotations set status='ACCEPTED' where id=quote_id and status='DRAFT';
 order_id:=public.convert_quotation_to_sales_order(target_organization_id,quote_id,target_warehouse_id,target_location_id,target_requested_delivery_date,target_idempotency_key);
 return order_id;
end $$;

create or replace function public.consume_sales_reservation(target_organization_id uuid,target_reservation_id uuid,target_quantity numeric,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); r public.inventory_reservations%rowtype; existing uuid;
begin
 select reservation_id into existing from public.inventory_reservation_events where organization_id=target_organization_id and idempotency_key=target_idempotency_key; if found then return existing; end if;
 if actor is null or not public.has_permission(target_organization_id,'sales.fulfilment_post') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into r from public.inventory_reservations where organization_id=target_organization_id and id=target_reservation_id for update;
 if not found or r.status<>'ACTIVE' or r.source_type<>'SALES_ORDER_LINE' then raise exception using errcode='P0001',message='RESERVATION_CONSUMPTION_FAILED'; end if;
 if target_quantity<=0 or target_quantity>r.remaining_quantity then raise exception using errcode='P0001',message='RESERVATION_CONSUMPTION_FAILED'; end if;
 update public.inventory_reservations set remaining_quantity=remaining_quantity-target_quantity,status=case when remaining_quantity-target_quantity=0 then 'CONSUMED' else 'ACTIVE' end,updated_at=now() where id=r.id;
 update public.inventory_balances set reserved_base_quantity=reserved_base_quantity-target_quantity,updated_at=now() where organization_id=target_organization_id and product_variant_id=r.product_variant_id and storage_location_id=r.storage_location_id;
 insert into public.inventory_reservation_events(organization_id,reservation_id,event_type,quantity,idempotency_key,actor_id) values(target_organization_id,r.id,'CONSUMED',target_quantity,target_idempotency_key,actor); return r.id;
end $$;

create or replace function public.confirm_sales_order(target_organization_id uuid,target_sales_order_id uuid,target_allow_backorder boolean default true,target_credit_override boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.sales_orders%rowtype; c public.customers%rowtype; settings public.sales_settings%rowtype; l public.sales_order_lines%rowtype; available numeric; reserve_qty numeric; rid uuid; exposure numeric; actor uuid;
begin
 select * into o from public.sales_orders where organization_id=target_organization_id and id=target_sales_order_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 actor:=public.sales_assert_access(target_organization_id,o.branch_id,'sales.order_confirm');
 if o.status in('CONFIRMED','PARTIALLY_RESERVED','RESERVED','PARTIALLY_FULFILLED','FULFILLED','PARTIALLY_INVOICED','INVOICED') then return jsonb_build_object('sales_order_id',o.id,'status',o.status,'replayed',true); end if;
 if o.status<>'DRAFT' then raise exception using errcode='P0001',message='INVALID_ORDER_STATE'; end if;
 select * into c from public.customers where organization_id=target_organization_id and id=o.customer_id for update; select * into settings from public.sales_settings where organization_id=target_organization_id;
 if c.status<>'ACTIVE' then raise exception using errcode='P0001',message='CUSTOMER_INACTIVE'; end if; if c.credit_status='BLOCKED' then raise exception using errcode='P0001',message='CUSTOMER_BLOCKED'; end if; if c.credit_status='ON_HOLD' then raise exception using errcode='P0001',message='CUSTOMER_CREDIT_HOLD'; end if;
 perform pg_advisory_xact_lock(hashtextextended(target_organization_id::text||c.id::text,0));
 select coalesce(e.exposure_base,0) into exposure from public.customer_credit_exposure e where e.organization_id=target_organization_id and e.customer_id=c.id;
 if coalesce(c.credit_limit,0)>0 and exposure+o.base_currency_total>c.credit_limit and not(target_credit_override and public.has_permission(target_organization_id,'sales.credit_override')) then raise exception using errcode='P0001',message='CREDIT_LIMIT_EXCEEDED'; end if;
 for l in select * from public.sales_order_lines where organization_id=target_organization_id and sales_order_id=o.id order by id for update loop
  select greatest(coalesce(b.on_hand_base_quantity-b.reserved_base_quantity,0),0) into available from public.inventory_balances b where b.organization_id=target_organization_id and b.product_variant_id=l.product_variant_id and b.storage_location_id=o.fulfilment_location_id for update; reserve_qty:=least(coalesce(available,0),l.ordered_base_quantity);
  if reserve_qty<l.ordered_base_quantity and (settings.backorder_policy='DISALLOW' or not target_allow_backorder) then raise exception using errcode='P0001',message='BACKORDER_NOT_ALLOWED'; end if;
  if reserve_qty>0 then rid:=public.reserve_inventory(target_organization_id,l.product_variant_id,o.fulfilment_location_id,reserve_qty,'SALES_ORDER_LINE',l.id,null,l.id); end if;
  update public.sales_order_lines set reservation_id=rid,reserved_base_quantity=reserve_qty,backordered_base_quantity=l.ordered_base_quantity-reserve_qty where id=l.id;
 end loop;
 update public.sales_orders set status=case when exists(select 1 from public.sales_order_lines where sales_order_id=o.id and backordered_base_quantity>0) then 'PARTIALLY_RESERVED' else 'RESERVED' end,confirmed_at=now(),credit_override_by=case when target_credit_override then actor end,updated_at=now() where id=o.id returning status into o.status;
 insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id,details) values(target_organization_id,'SALES_ORDER',o.id,'CONFIRMED',actor,jsonb_build_object('status',o.status)); return jsonb_build_object('sales_order_id',o.id,'status',o.status,'replayed',false);
end $$;

create or replace function public.cancel_sales_order(target_organization_id uuid,target_sales_order_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.sales_orders%rowtype; l public.sales_order_lines%rowtype; actor uuid; remaining numeric;
begin
 select * into o from public.sales_orders where organization_id=target_organization_id and id=target_sales_order_id for update; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 actor:=public.sales_assert_access(target_organization_id,o.branch_id,'sales.order_cancel'); if o.status='CANCELLED' then return jsonb_build_object('sales_order_id',o.id,'replayed',true); end if;
 if o.status in('FULFILLED','INVOICED','CLOSED') then raise exception using errcode='P0001',message='INVALID_ORDER_STATE'; end if;
 for l in select * from public.sales_order_lines where sales_order_id=o.id order by id for update loop
  if l.reservation_id is not null and l.reserved_base_quantity>0 then perform public.release_inventory_reservation(target_organization_id,l.reservation_id,l.reserved_base_quantity,l.id); end if;
  remaining:=l.ordered_base_quantity-l.fulfilled_base_quantity-l.cancelled_base_quantity; update public.sales_order_lines set cancelled_base_quantity=cancelled_base_quantity+remaining,reserved_base_quantity=0,backordered_base_quantity=0 where id=l.id;
 end loop;
 update public.sales_orders set status='CANCELLED',cancelled_at=now(),updated_at=now() where id=o.id; insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id) values(target_organization_id,'SALES_ORDER',o.id,'CANCELLED',actor); return jsonb_build_object('sales_order_id',o.id,'replayed',false);
end $$;

create or replace function public.create_sales_return(target_organization_id uuid,target_fulfilment_id uuid,target_invoice_id uuid,target_reason_id uuid,target_lines jsonb,target_notes text,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare f public.sales_fulfillments%rowtype; actor uuid; result uuid:=gen_random_uuid(); item record; fl public.sales_fulfillment_lines%rowtype; requested numeric; prior numeric; hash text:=public.sales_payload_hash(jsonb_build_object('fulfilment',target_fulfilment_id,'invoice',target_invoice_id,'reason',target_reason_id,'lines',target_lines)); existing record;
begin
 select id,request_hash into existing from public.sales_returns where organization_id=target_organization_id and idempotency_key=target_idempotency_key; if found then if existing.request_hash<>hash then raise exception using errcode='P0001',message='IDEMPOTENCY_PAYLOAD_MISMATCH'; end if; return existing.id; end if;
 select * into f from public.sales_fulfillments where organization_id=target_organization_id and id=target_fulfilment_id and status='POSTED'; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if; actor:=public.sales_assert_access(target_organization_id,f.branch_id,'sales.return_create');
 if target_invoice_id is not null and not exists(select 1 from public.customer_invoices i join public.customer_invoice_fulfillments x on x.organization_id=i.organization_id and x.invoice_id=i.id where i.organization_id=target_organization_id and i.id=target_invoice_id and i.customer_id=f.customer_id and x.fulfilment_id=f.id and i.status not in('DRAFT','VOID')) then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if not exists(select 1 from public.sales_return_reasons where organization_id=target_organization_id and id=target_reason_id and is_active) then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 insert into public.sales_returns(id,organization_id,business_id,return_number,customer_id,sales_order_id,sales_fulfilment_id,customer_invoice_id,branch_id,return_date,reason_id,notes,idempotency_key,request_hash,created_by)
 values(result,target_organization_id,f.business_id,public.next_inventory_number(target_organization_id,'SRET'),f.customer_id,f.sales_order_id,f.id,target_invoice_id,f.branch_id,now(),target_reason_id,target_notes,target_idempotency_key,hash,actor);
 for item in select value from jsonb_array_elements(target_lines) loop
  select * into fl from public.sales_fulfillment_lines where organization_id=target_organization_id and fulfilment_id=f.id and id=(item.value->>'sales_fulfillment_line_id')::uuid for update; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
  requested:=(item.value->>'quantity')::numeric; select coalesce(sum(rl.accepted_base_quantity),0) into prior from public.sales_return_lines rl join public.sales_returns r on r.organization_id=rl.organization_id and r.id=rl.sales_return_id where rl.organization_id=target_organization_id and rl.sales_fulfillment_line_id=fl.id and r.status='POSTED';
  if requested<=0 or round(requested*fl.conversion_snapshot,6)>fl.base_quantity-prior then raise exception using errcode='P0001',message='RETURN_EXCEEDS_ELIGIBLE_QUANTITY'; end if;
  insert into public.sales_return_lines(organization_id,sales_return_id,sales_fulfillment_line_id,product_variant_id,packaging_id,requested_quantity,conversion_snapshot)
  values(target_organization_id,result,fl.id,fl.product_variant_id,fl.packaging_id,requested,fl.conversion_snapshot);
 end loop;
 insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id) values(target_organization_id,'SALES_RETURN',result,'CREATED',actor); return result;
end $$;

create or replace function public.inspect_sales_return(target_organization_id uuid,target_sales_return_id uuid,target_lines jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare r public.sales_returns%rowtype; item record; l public.sales_return_lines%rowtype; actor uuid; disposition text; accepted numeric; rejected numeric;
begin
 select * into r from public.sales_returns where organization_id=target_organization_id and id=target_sales_return_id for update; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if; actor:=public.sales_assert_access(target_organization_id,r.branch_id,'sales.return_receive');
 if r.status not in('REQUESTED','APPROVED','RECEIVED') then raise exception using errcode='P0001',message='INVALID_RETURN_STATE'; end if;
 for item in select value from jsonb_array_elements(target_lines) loop
  select * into l from public.sales_return_lines where organization_id=target_organization_id and sales_return_id=r.id and id=(item.value->>'sales_return_line_id')::uuid for update; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
  disposition:=item.value->>'disposition'; accepted:=coalesce((item.value->>'accepted_quantity')::numeric,0); rejected:=coalesce((item.value->>'rejected_quantity')::numeric,0);
  if disposition not in('RESTOCK_NORMAL','RESTOCK_DAMAGED','REJECT_RETURN') or accepted<0 or rejected<0 or accepted+rejected>(item.value->>'received_quantity')::numeric or accepted+rejected>l.requested_quantity then raise exception using errcode='P0001',message='INVALID_RETURN_DISPOSITION'; end if;
  if disposition like 'RESTOCK_%' and (accepted<=0 or not exists(select 1 from public.storage_locations sl where sl.organization_id=target_organization_id and sl.id=(item.value->>'destination_location_id')::uuid and sl.branch_id=r.branch_id and sl.is_active)) then raise exception using errcode='P0001',message='INVALID_RETURN_DISPOSITION'; end if;
  if disposition='REJECT_RETURN' and accepted<>0 then raise exception using errcode='P0001',message='INVALID_RETURN_DISPOSITION'; end if;
  update public.sales_return_lines set received_quantity=(item.value->>'received_quantity')::numeric,accepted_quantity=accepted,rejected_quantity=rejected,accepted_base_quantity=round(accepted*conversion_snapshot,6),condition=nullif(item.value->>'condition',''),disposition=disposition,destination_location_id=nullif(item.value->>'destination_location_id','')::uuid,notes=nullif(item.value->>'notes','') where id=l.id;
 end loop; update public.sales_returns set status='INSPECTED' where id=r.id;
end $$;

-- Forward declaration permits the mutually atomic return/credit workflow to be
-- validated before the full implementation below replaces this body.
create or replace function public.issue_customer_credit_note(target_organization_id uuid,target_invoice_id uuid,target_sales_return_id uuid,target_base_amount numeric,target_reason text,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$ begin raise exception using errcode='P0001',message='CREDIT_NOTE_NOT_READY'; end $$;

create or replace function public.post_sales_return(target_organization_id uuid,target_sales_return_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.sales_returns%rowtype; rl public.sales_return_lines%rowtype; fl public.sales_fulfillment_lines%rowtype; m public.inventory_movements%rowtype; allocation record; remaining numeric; available_alloc numeric; take_qty numeric; line_cost numeric; total_cost numeric:=0; credit_total numeric:=0; ledger jsonb:='[]'::jsonb; result jsonb; tx uuid; credit_id uuid; actor uuid; prior numeric;
begin
 select * into r from public.sales_returns where organization_id=target_organization_id and id=target_sales_return_id for update; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if; actor:=public.sales_assert_access(target_organization_id,r.branch_id,'sales.return_post');
 if r.status='POSTED' then return jsonb_build_object('sales_return_id',r.id,'inventory_transaction_id',r.inventory_transaction_id,'credit_note_id',r.credit_note_id,'replayed',true); end if; if r.status<>'INSPECTED' then raise exception using errcode='P0001',message='INVALID_RETURN_STATE'; end if;
 for rl in select * from public.sales_return_lines where organization_id=target_organization_id and sales_return_id=r.id order by id for update loop
  select * into fl from public.sales_fulfillment_lines where organization_id=target_organization_id and id=rl.sales_fulfillment_line_id for update; select * into m from public.inventory_movements where organization_id=target_organization_id and id=fl.inventory_movement_id;
  select coalesce(sum(x.accepted_base_quantity),0) into prior from public.sales_return_lines x join public.sales_returns sr on sr.organization_id=x.organization_id and sr.id=x.sales_return_id where x.organization_id=target_organization_id and x.sales_fulfillment_line_id=fl.id and sr.status='POSTED'; if rl.accepted_base_quantity>fl.base_quantity-prior then raise exception using errcode='P0001',message='RETURN_EXCEEDS_ELIGIBLE_QUANTITY'; end if;
  if rl.disposition in('RESTOCK_NORMAL','RESTOCK_DAMAGED') and rl.accepted_base_quantity>0 then
   remaining:=rl.accepted_base_quantity; line_cost:=0;
   if m.costing_method_snapshot='FIFO' then
    for allocation in select a.*,a.quantity-coalesce((select sum(rca.quantity_base) from public.sales_return_cost_allocations rca join public.sales_return_lines x on x.organization_id=rca.organization_id and x.id=rca.sales_return_line_id join public.sales_returns sr on sr.organization_id=x.organization_id and sr.id=x.sales_return_id where rca.original_cost_allocation_id=a.id and sr.status='POSTED'),0) unused from public.inventory_cost_allocations a where a.organization_id=target_organization_id and a.outbound_movement_id=m.id order by a.created_at,a.id loop
     exit when remaining<=0; available_alloc:=greatest(allocation.unused,0); take_qty:=least(remaining,available_alloc); if take_qty>0 then insert into public.sales_return_cost_allocations(organization_id,sales_return_line_id,original_cost_allocation_id,quantity_base,unit_cost_base) values(target_organization_id,rl.id,allocation.id,take_qty,allocation.unit_cost); line_cost:=line_cost+round(take_qty*allocation.unit_cost,8); remaining:=remaining-take_qty; end if;
    end loop; if remaining>0 then raise exception using errcode='P0001',message='RETURN_COST_BASIS_EXHAUSTED'; end if;
   else line_cost:=round(rl.accepted_base_quantity*abs(m.valuation_total)/fl.base_quantity,8); insert into public.sales_return_cost_allocations(organization_id,sales_return_line_id,quantity_base,unit_cost_base) values(target_organization_id,rl.id,rl.accepted_base_quantity,round(line_cost/rl.accepted_base_quantity,8)); end if;
   update public.sales_return_lines set return_unit_cost_base=round(line_cost/accepted_base_quantity,8) where id=rl.id; total_cost:=total_cost+line_cost;
   ledger:=ledger||jsonb_build_array(jsonb_build_object('product_variant_id',rl.product_variant_id,'packaging_id',rl.packaging_id,'storage_location_id',rl.destination_location_id,'quantity',rl.accepted_quantity,'unit_cost',round(line_cost/rl.accepted_base_quantity,8)));
  end if;
  credit_total:=credit_total+round((rl.accepted_base_quantity/fl.base_quantity)*(select line_total from public.sales_order_lines where id=fl.sales_order_line_id),4);
 end loop;
 if jsonb_array_length(ledger)>0 then result:=public.post_inventory_transaction(target_organization_id,r.business_id,'SALE_RETURN',r.return_date,null,coalesce(r.notes,'Sales return '||r.return_number),r.return_number,r.idempotency_key,ledger,'SALES_RETURN',r.id,null,null,null,'WEB',false); tx:=(result->>'transaction_id')::uuid; end if;
 if r.customer_invoice_id is not null and credit_total>0 then credit_id:=public.issue_customer_credit_note(target_organization_id,r.customer_invoice_id,r.id,credit_total,'Return '||r.return_number,r.idempotency_key); end if;
 update public.sales_returns set status='POSTED',inventory_transaction_id=tx,credit_note_id=credit_id,posted_at=now() where id=r.id; insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id,details) values(target_organization_id,'SALES_RETURN',r.id,'POSTED',actor,jsonb_build_object('inventory_transaction_id',tx,'credit_note_id',credit_id,'restored_cost',total_cost)); return jsonb_build_object('sales_return_id',r.id,'inventory_transaction_id',tx,'credit_note_id',credit_id,'restored_cost',total_cost,'replayed',false);
end $$;

create or replace function public.issue_customer_credit_note(target_organization_id uuid,target_invoice_id uuid,target_sales_return_id uuid,target_base_amount numeric,target_reason text,target_idempotency_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare i public.customer_invoices%rowtype; actor uuid; result uuid:=gen_random_uuid(); hash text:=public.sales_payload_hash(jsonb_build_object('invoice',target_invoice_id,'return',target_sales_return_id,'amount',target_base_amount,'reason',target_reason)); existing record; foreign_amount numeric;
begin
 select id,request_hash into existing from public.customer_credit_notes where organization_id=target_organization_id and idempotency_key=target_idempotency_key; if found then if existing.request_hash<>hash then raise exception using errcode='P0001',message='IDEMPOTENCY_PAYLOAD_MISMATCH'; end if; return existing.id; end if;
 select * into i from public.customer_invoices where organization_id=target_organization_id and id=target_invoice_id and status not in('DRAFT','VOID') for update; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if; actor:=public.sales_assert_access(target_organization_id,i.branch_id,'sales.credit_note_approve');
 if target_sales_return_id is not null and not exists(select 1 from public.sales_returns where organization_id=target_organization_id and id=target_sales_return_id and customer_invoice_id=i.id) then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if target_base_amount<=0 or i.credit_note_total_base+target_base_amount>i.base_currency_total-i.amount_paid_base then raise exception using errcode='P0001',message='CREDIT_EXCEEDS_INVOICE'; end if; foreign_amount:=round(target_base_amount/i.exchange_rate,4);
 insert into public.customer_credit_notes(id,organization_id,credit_note_number,customer_id,customer_invoice_id,sales_return_id,branch_id,credit_date,currency,exchange_rate,subtotal,total,base_currency_total,reason,status,idempotency_key,request_hash,created_by,approved_by,approved_at,issued_by,issued_at)
 values(result,target_organization_id,public.next_inventory_number(target_organization_id,'CRN'),i.customer_id,i.id,target_sales_return_id,i.branch_id,current_date,i.currency,i.exchange_rate,foreign_amount,foreign_amount,target_base_amount,target_reason,'ISSUED',target_idempotency_key,hash,actor,actor,now(),actor,now());
 update public.customer_invoices set credit_note_total_base=credit_note_total_base+target_base_amount,status=case when credit_note_total_base+target_base_amount>=base_currency_total-amount_paid_base then 'CREDITED' else status end,updated_at=now() where id=i.id;
 insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id) values(target_organization_id,'CREDIT_NOTE',result,'ISSUED',actor); return result;
end $$;

-- Internal helpers remain unreachable; authenticated clients receive only audited workflow entry points.
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('resolve_sales_price','create_customer','create_sales_quotation','transition_sales_quotation','convert_quotation_to_sales_order','create_sales_order','confirm_sales_order','cancel_sales_order','create_sales_fulfilment','post_sales_fulfilment','create_customer_invoice','issue_customer_invoice','create_sales_return','inspect_sales_return','post_sales_return','issue_customer_credit_note') loop
  execute format('revoke all on function %s from public,anon',f.signature); execute format('grant execute on function %s to authenticated',f.signature);
 end loop;
end $$;
revoke all on function public.consume_sales_reservation(uuid,uuid,numeric,uuid) from public,anon,authenticated;
