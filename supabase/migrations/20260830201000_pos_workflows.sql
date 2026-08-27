create or replace function public.pos_expected_cash(target_session_id uuid)
returns numeric language sql stable security definer set search_path='' as $$
 select case when exists(
   select 1 from public.pos_sessions s where s.id=target_session_id
   and public.can_access_branch(s.organization_id,s.branch_id)
   and (s.cashier_user_id=auth.uid() or public.has_permission(s.organization_id,'pos.session.review'))
  ) then coalesce((select sum(case direction when 'IN' then amount when 'OUT' then -amount else 0 end)
   from public.pos_cash_events where session_id=target_session_id),0) else null end
$$;

create or replace function public.create_pos_terminal(target_organization_id uuid,target_branch_id uuid,target_code text,target_name text,target_warehouse_id uuid,target_location_id uuid,target_customer_id uuid,target_cash_account_id uuid,target_receipt_width text,target_receipt_footer text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result uuid:=gen_random_uuid();
begin
 if actor is null or not public.has_permission(target_organization_id,'pos.terminal.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;
 if not public.can_access_branch(target_organization_id,target_branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH';end if;
 if not exists(select 1 from public.storage_locations l where l.organization_id=target_organization_id and l.id=target_location_id and l.warehouse_id=target_warehouse_id and l.branch_id=target_branch_id and l.is_active) then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE';end if;
 if not exists(select 1 from public.payment_accounts a where a.organization_id=target_organization_id and a.id=target_cash_account_id and a.status='ACTIVE' and a.account_type='CASH' and (a.branch_id is null or a.branch_id=target_branch_id)) then raise exception using errcode='P0001',message='POS_CASH_ACCOUNT_INVALID';end if;
 if target_customer_id is not null and not exists(select 1 from public.customers c where c.organization_id=target_organization_id and c.id=target_customer_id and c.status='ACTIVE') then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE';end if;
 insert into public.pos_terminals(id,organization_id,branch_id,terminal_code,name,default_warehouse_id,default_storage_location_id,default_customer_id,default_cash_account_id,receipt_width,receipt_footer,created_by)
 values(result,target_organization_id,target_branch_id,upper(trim(target_code)),trim(target_name),target_warehouse_id,target_location_id,target_customer_id,target_cash_account_id,coalesce(target_receipt_width,'80MM'),nullif(trim(target_receipt_footer),''),actor);
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'pos.terminal.created','pos_terminal',result,jsonb_build_object('branch_id',target_branch_id,'code',upper(trim(target_code))));return result;
exception when foreign_key_violation then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE';end $$;

create or replace function public.update_pos_terminal(target_organization_id uuid,target_terminal_id uuid,target_name text,target_status text,target_customer_id uuid,target_cash_account_id uuid,target_receipt_width text,target_receipt_footer text)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); terminal public.pos_terminals%rowtype;
begin
 select * into terminal from public.pos_terminals where organization_id=target_organization_id and id=target_terminal_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE';end if;
 if actor is null or not public.has_permission(target_organization_id,'pos.terminal.manage') or not public.can_access_branch(target_organization_id,terminal.branch_id) then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;
 if target_status='INACTIVE' and exists(select 1 from public.pos_sessions where terminal_id=terminal.id and status in('OPEN','CLOSING')) then raise exception using errcode='P0001',message='POS_TERMINAL_HAS_OPEN_SESSION';end if;
 update public.pos_terminals set name=trim(target_name),status=target_status,default_customer_id=target_customer_id,default_cash_account_id=target_cash_account_id,receipt_width=target_receipt_width,receipt_footer=nullif(trim(target_receipt_footer),''),updated_at=now() where id=terminal.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'pos.terminal.updated','pos_terminal',terminal.id,jsonb_build_object('status',target_status));
end $$;

create or replace function public.open_pos_session(target_organization_id uuid,target_terminal_id uuid,target_opening_float numeric,target_notes text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); terminal public.pos_terminals%rowtype; result uuid:=gen_random_uuid();
begin
 select * into terminal from public.pos_terminals where organization_id=target_organization_id and id=target_terminal_id and status='ACTIVE' for update;
 if not found then raise exception using errcode='P0001',message='TERMINAL_INACTIVE';end if;
 if actor is null or not public.has_permission(target_organization_id,'pos.session.open') or not public.can_access_branch(target_organization_id,terminal.branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_TERMINAL';end if;
 if target_opening_float<0 then raise exception using errcode='22023',message='POS_FLOAT_INVALID';end if;
 if exists(select 1 from public.pos_sessions where terminal_id=terminal.id and status in('OPEN','CLOSING')) then raise exception using errcode='P0001',message='POS_SESSION_ALREADY_OPEN';end if;
 insert into public.pos_sessions(id,organization_id,branch_id,terminal_id,cashier_user_id,session_number,opening_float,opening_notes)
 values(result,target_organization_id,terminal.branch_id,terminal.id,actor,public.next_inventory_number(target_organization_id,'SHIFT'),target_opening_float,nullif(trim(target_notes),''));
 if target_opening_float>0 then insert into public.pos_cash_events(organization_id,branch_id,terminal_id,session_id,event_type,amount,direction,source_type,source_id,reason,actor_id) values(target_organization_id,terminal.branch_id,terminal.id,result,'OPENING_FLOAT',target_opening_float,'IN','SESSION',result,'Opening float',actor);end if;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'pos.session.opened','pos_session',result,jsonb_build_object('terminal_id',terminal.id,'opening_float',target_opening_float));return result;
exception when unique_violation then raise exception using errcode='P0001',message='POS_SESSION_ALREADY_OPEN';end $$;

create or replace function public.record_pos_cash_event(target_organization_id uuid,target_session_id uuid,target_event_type text,target_amount numeric,target_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); session public.pos_sessions%rowtype; permission text; direction text; result uuid:=gen_random_uuid();
begin
 select * into session from public.pos_sessions where organization_id=target_organization_id and id=target_session_id for update;
 if not found or session.status<>'OPEN' then raise exception using errcode='P0001',message='POS_SESSION_CLOSED';end if;
 permission:=case target_event_type when 'CASH_IN' then 'pos.cash.in' when 'CASH_OUT' then 'pos.cash.out' when 'CASH_DROP' then 'pos.cash.drop' else null end;
 if actor is null or permission is null or not public.has_permission(target_organization_id,permission) or not public.can_access_branch(target_organization_id,session.branch_id) then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;
 if target_amount<=0 or nullif(trim(target_reason),'') is null then raise exception using errcode='22023',message='POS_CASH_EVENT_INVALID';end if;
 direction:=case target_event_type when 'CASH_IN' then 'IN' else 'OUT' end;
 insert into public.pos_cash_events(id,organization_id,branch_id,terminal_id,session_id,event_type,amount,direction,source_type,source_id,reason,actor_id) values(result,target_organization_id,session.branch_id,session.terminal_id,session.id,target_event_type,target_amount,direction,'MANUAL',result,trim(target_reason),actor);
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'pos.cash.'||lower(target_event_type),'pos_cash_event',result,jsonb_build_object('session_id',session.id,'amount',target_amount,'reason',target_reason));return result;
end $$;

create or replace function public.close_pos_session(target_organization_id uuid,target_session_id uuid,target_counted_cash numeric,target_notes text,target_variance_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); session public.pos_sessions%rowtype; settings public.pos_settings%rowtype; expected numeric; difference numeric; final_status text;
begin
 select * into session from public.pos_sessions where organization_id=target_organization_id and id=target_session_id for update;
 if not found or session.status<>'OPEN' then raise exception using errcode='P0001',message='POS_SESSION_CLOSED';end if;
 if actor is null or not public.has_permission(target_organization_id,'pos.session.close') or (session.cashier_user_id<>actor and not public.has_permission(target_organization_id,'pos.session.review')) then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;
 if target_counted_cash<0 then raise exception using errcode='22023',message='POS_COUNT_INVALID';end if;
 select * into settings from public.pos_settings where organization_id=target_organization_id;expected:=public.pos_expected_cash(session.id);difference:=target_counted_cash-expected;
 if abs(difference)>coalesce(settings.cash_variance_tolerance,0) and nullif(trim(target_variance_reason),'') is null then raise exception using errcode='P0001',message='CASH_VARIANCE_REASON_REQUIRED';end if;
 final_status:=case when abs(difference)>coalesce(settings.cash_variance_tolerance,0) then 'REVIEW_REQUIRED' else 'CLOSED' end;
 insert into public.pos_cash_events(organization_id,branch_id,terminal_id,session_id,event_type,amount,direction,source_type,source_id,reason,actor_id) values(target_organization_id,session.branch_id,session.terminal_id,session.id,'CLOSING_COUNT',greatest(target_counted_cash,0.0001),'NEUTRAL','SESSION',session.id,'Closing count',actor);
 update public.pos_sessions set expected_cash=expected,counted_cash=target_counted_cash,variance=difference,status=final_status,closed_at=now(),closing_notes=nullif(trim(target_notes),''),variance_reason=nullif(trim(target_variance_reason),'') where id=session.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'pos.session.closed','pos_session',session.id,jsonb_build_object('expected',expected,'counted',target_counted_cash,'variance',difference,'status',final_status));return jsonb_build_object('session_id',session.id,'expected_cash',expected,'counted_cash',target_counted_cash,'variance',difference,'status',final_status);
end $$;

create or replace function public.hold_pos_cart(target_organization_id uuid,target_session_id uuid,target_customer_id uuid,target_cart jsonb,target_notes text,target_cart_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); session public.pos_sessions%rowtype; settings public.pos_settings%rowtype; result uuid:=coalesce(target_cart_id,gen_random_uuid());
begin
 select * into session from public.pos_sessions where organization_id=target_organization_id and id=target_session_id and status='OPEN';
 if not found then raise exception using errcode='P0001',message='POS_SESSION_REQUIRED';end if;
 if actor is null or session.cashier_user_id<>actor or not public.has_permission(target_organization_id,'pos.hold') then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;
 if jsonb_typeof(target_cart)<>'array' or jsonb_array_length(target_cart)=0 then raise exception using errcode='22023',message='INVALID_LINES';end if;
 select * into settings from public.pos_settings where organization_id=target_organization_id;
 insert into public.pos_held_carts(id,organization_id,branch_id,terminal_id,session_id,cashier_user_id,customer_id,cart,notes,expires_at) values(result,target_organization_id,session.branch_id,session.terminal_id,session.id,actor,target_customer_id,target_cart,nullif(trim(target_notes),''),now()+make_interval(mins=>coalesce(settings.hold_expiration_minutes,1440)))
 on conflict(id) do update set customer_id=excluded.customer_id,cart=excluded.cart,notes=excluded.notes,held_at=now(),expires_at=excluded.expires_at,updated_at=now(),status='HELD';return result;
end $$;

create or replace function public.abandon_pos_cart(target_organization_id uuid,target_cart_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); cart public.pos_held_carts%rowtype;
begin select * into cart from public.pos_held_carts where organization_id=target_organization_id and id=target_cart_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE';end if;
 if actor is null or (cart.cashier_user_id<>actor and not public.has_permission(target_organization_id,'pos.void')) or not public.has_permission(target_organization_id,'pos.hold') then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;
 update public.pos_held_carts set status='ABANDONED',updated_at=now() where id=cart.id;end $$;

create or replace function public.post_pos_sale(target_organization_id uuid,target_session_id uuid,target_customer_id uuid,target_lines jsonb,target_settlements jsonb,target_customer_credit_amount numeric,target_cash_tendered numeric,target_notes text,target_held_cart_id uuid,target_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); session public.pos_sessions%rowtype; terminal public.pos_terminals%rowtype; customer public.customers%rowtype; settings public.pos_settings%rowtype; org public.organizations%rowtype; business_id uuid; price_list uuid;
 existing public.pos_sales%rowtype; payload_hash text; order_id uuid; fulfilment_id uuid; invoice_id uuid; inventory_id uuid; sale_id uuid:=gen_random_uuid(); order_row public.sales_orders%rowtype; settlement record; payment_result jsonb; payment_id uuid; method public.payment_methods%rowtype; paid numeric:=0; credit_used numeric:=0; cash_net numeric:=0; tendered numeric:=0; change_due numeric:=0; receipt text;
begin
 if actor is null or not public.has_permission(target_organization_id,'pos.sale.create') then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;
 payload_hash:=public.sales_payload_hash(jsonb_build_object('session',target_session_id,'customer',target_customer_id,'lines',target_lines,'settlements',target_settlements,'customer_credit',target_customer_credit_amount,'cash_tendered',target_cash_tendered));
 select * into existing from public.pos_sales where organization_id=target_organization_id and idempotency_key=target_idempotency_key;
 if found then if existing.request_hash<>payload_hash then raise exception using errcode='P0001',message='IDEMPOTENCY_CONFLICT';end if;return jsonb_build_object('pos_sale_id',existing.id,'receipt_number',existing.receipt_number,'invoice_id',existing.customer_invoice_id,'replayed',true);end if;
 select * into session from public.pos_sessions where organization_id=target_organization_id and id=target_session_id for update;
 if not found or session.status<>'OPEN' then raise exception using errcode='P0001',message='POS_SESSION_REQUIRED';end if;
 if session.cashier_user_id<>actor then raise exception using errcode='42501',message='UNAUTHORIZED_TERMINAL';end if;
 select * into terminal from public.pos_terminals where organization_id=target_organization_id and id=session.terminal_id and branch_id=session.branch_id and status='ACTIVE' for update;
 if not found or not public.can_access_branch(target_organization_id,session.branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_TERMINAL';end if;
 select * into settings from public.pos_settings where organization_id=target_organization_id;select * into org from public.organizations where id=target_organization_id;select b.id into business_id from public.businesses b where b.organization_id=target_organization_id and b.status='active' order by b.created_at limit 1;
 target_customer_id:=coalesce(target_customer_id,terminal.default_customer_id);if target_customer_id is null and coalesce(settings.require_customer,false) then raise exception using errcode='P0001',message='POS_CUSTOMER_REQUIRED';end if;
 select * into customer from public.customers where organization_id=target_organization_id and id=target_customer_id and status='ACTIVE' for update;if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE';end if;
 if customer.id=terminal.default_customer_id and not coalesce(settings.allow_walk_in,true) then raise exception using errcode='P0001',message='POS_CUSTOMER_REQUIRED';end if;
 price_list:=coalesce(customer.default_price_list_id,(select id from public.price_lists where organization_id=target_organization_id and is_default and is_active limit 1));if price_list is null then raise exception using errcode='P0001',message='PRICE_NOT_FOUND';end if;
 if jsonb_typeof(target_lines)<>'array' or jsonb_array_length(target_lines)=0 then raise exception using errcode='22023',message='INVALID_LINES';end if;
 if exists(select 1 from jsonb_array_elements(target_lines) x where coalesce((x->>'discount')::numeric,0)>0) and (not settings.allow_discounts or not public.has_permission(target_organization_id,'pos.discount.apply')) then raise exception using errcode='42501',message='DISCOUNT_APPROVAL_REQUIRED';end if;
 if exists(select 1 from jsonb_array_elements(target_lines) x where coalesce((x->>'discount')::numeric,0)>0 and coalesce((x->>'unit_price')::numeric,0)*coalesce((x->>'quantity')::numeric,0)>0 and ((x->>'discount')::numeric/(x->>'unit_price')::numeric/(x->>'quantity')::numeric*100)>settings.discount_threshold_percent) and not public.has_permission(target_organization_id,'pos.discount.override') then raise exception using errcode='42501',message='DISCOUNT_APPROVAL_REQUIRED';end if;
 order_id:=public.create_sales_order(target_organization_id,business_id,customer.id,session.branch_id,terminal.default_warehouse_id,terminal.default_storage_location_id,current_date,price_list,org.currency_code,1,null,null,target_lines,coalesce(target_notes,'POS sale'),extensions.uuid_generate_v5(target_idempotency_key,'pos-order'));
 -- The shared Sales engine remains authoritative. Normalize its document header from
 -- the already validated line snapshots so POS discounts are reflected in settlement.
 update public.sales_orders o set subtotal=x.subtotal,discount=x.discount,tax=x.tax,total=x.total,base_currency_total=round(x.total*o.exchange_rate,4),updated_at=now()
 from(select sales_order_id,sum(unit_price*ordered_quantity) subtotal,sum(discount) discount,sum(tax) tax,sum(line_total) total from public.sales_order_lines where sales_order_id=order_id group by sales_order_id)x
 where o.organization_id=target_organization_id and o.id=x.sales_order_id;
 update public.sales_quotations q set subtotal=x.subtotal,discount=x.discount,tax=x.tax,total=x.total,base_currency_total=round(x.total*q.exchange_rate,4),updated_at=now()
 from(select so.originating_quotation_id,sum(l.unit_price*l.ordered_quantity) subtotal,sum(l.discount) discount,sum(l.tax) tax,sum(l.line_total) total from public.sales_orders so join public.sales_order_lines l on l.organization_id=so.organization_id and l.sales_order_id=so.id where so.id=order_id group by so.originating_quotation_id)x
 where q.organization_id=target_organization_id and q.id=x.originating_quotation_id;
 perform public.confirm_sales_order(target_organization_id,order_id,false,false);
 select jsonb_agg(jsonb_build_object('sales_order_line_id',id,'quantity',ordered_quantity)) into target_lines from public.sales_order_lines where sales_order_id=order_id;
 fulfilment_id:=public.create_sales_fulfilment(target_organization_id,order_id,target_lines,now(),'POS checkout',extensions.uuid_generate_v5(target_idempotency_key,'pos-fulfilment'));
 inventory_id:=(public.post_sales_fulfilment(target_organization_id,fulfilment_id)->>'inventory_transaction_id')::uuid;
 invoice_id:=public.create_customer_invoice(target_organization_id,order_id,array[fulfilment_id],current_date,current_date,'POS receipt',extensions.uuid_generate_v5(target_idempotency_key,'pos-invoice'));perform public.issue_customer_invoice(target_organization_id,invoice_id);
 select * into order_row from public.sales_orders where id=order_id;
 if target_settlements is null then target_settlements:='[]'::jsonb;end if;if jsonb_typeof(target_settlements)<>'array' then raise exception using errcode='22023',message='PAYMENT_TOTAL_MISMATCH';end if;
 select coalesce(sum((x->>'amount')::numeric),0) into paid from jsonb_array_elements(target_settlements) x where coalesce(x->>'source_type','PAYMENT')='PAYMENT';
 select coalesce(sum((x->>'amount')::numeric),0) into credit_used from jsonb_array_elements(target_settlements) x where coalesce(x->>'source_type','PAYMENT')<>'PAYMENT';
 target_customer_credit_amount:=coalesce(target_customer_credit_amount,0);if target_customer_credit_amount<0 or round(paid+credit_used+target_customer_credit_amount,4)<>round(order_row.total,4) then raise exception using errcode='P0001',message='PAYMENT_TOTAL_MISMATCH';end if;
 if target_customer_credit_amount>0 and customer.id=terminal.default_customer_id then raise exception using errcode='P0001',message='WALK_IN_CREDIT_NOT_ALLOWED';end if;
 receipt:=public.next_inventory_number(target_organization_id,'POS');
 insert into public.pos_sales(id,organization_id,branch_id,terminal_id,session_id,cashier_user_id,receipt_number,customer_id,sales_order_id,fulfilment_id,customer_invoice_id,inventory_transaction_id,currency,subtotal,discount,tax,total,cash_tendered,change_due,idempotency_key,request_hash)
 values(sale_id,target_organization_id,session.branch_id,terminal.id,session.id,actor,receipt,customer.id,order_id,fulfilment_id,invoice_id,inventory_id,order_row.currency,order_row.subtotal,order_row.discount,order_row.tax,order_row.total,target_cash_tendered,0,target_idempotency_key,payload_hash);
 for settlement in select value,ordinality from jsonb_array_elements(target_settlements) with ordinality loop
  if coalesce(settlement.value->>'source_type','PAYMENT')='PAYMENT' then
   select * into method from public.payment_methods where organization_id=target_organization_id and id=(settlement.value->>'payment_method_id')::uuid and status='ACTIVE';if not found then raise exception using errcode='P0001',message='PAYMENT_METHOD_INACTIVE';end if;
   payment_result:=public.post_customer_payment(target_organization_id,customer.id,session.branch_id,current_date,order_row.currency,order_row.exchange_rate,(settlement.value->>'amount')::numeric,method.id,coalesce(nullif(settlement.value->>'account_id','')::uuid,method.default_account_id),settlement.value->>'reference','POS '||receipt,jsonb_build_array(jsonb_build_object('invoice_id',invoice_id,'amount',(settlement.value->>'amount')::numeric)),extensions.uuid_generate_v5(target_idempotency_key,'payment-'||settlement.ordinality));payment_id:=(payment_result->>'payment_id')::uuid;
   tendered:=coalesce((settlement.value->>'tendered_amount')::numeric,(settlement.value->>'amount')::numeric);if method.method_type='CASH' then if tendered<(settlement.value->>'amount')::numeric then raise exception using errcode='P0001',message='PAYMENT_TOTAL_MISMATCH';end if;change_due:=change_due+tendered-(settlement.value->>'amount')::numeric;cash_net:=cash_net+(settlement.value->>'amount')::numeric;end if;
   insert into public.pos_sale_settlements(organization_id,pos_sale_id,settlement_type,payment_id,payment_method_id,amount,tendered_amount,change_amount,external_reference) values(target_organization_id,sale_id,'PAYMENT',payment_id,method.id,(settlement.value->>'amount')::numeric,tendered,case when method.method_type='CASH' then tendered-(settlement.value->>'amount')::numeric else 0 end,nullif(settlement.value->>'reference',''));
  elsif settlement.value->>'source_type'='UNAPPLIED_PAYMENT' then perform public.allocate_existing_payment(target_organization_id,(settlement.value->>'source_id')::uuid,jsonb_build_array(jsonb_build_object('invoice_id',invoice_id,'amount',(settlement.value->>'amount')::numeric)));insert into public.pos_sale_settlements(organization_id,pos_sale_id,settlement_type,source_id,amount) values(target_organization_id,sale_id,'UNAPPLIED_PAYMENT',(settlement.value->>'source_id')::uuid,(settlement.value->>'amount')::numeric);
  elsif settlement.value->>'source_type'='CREDIT_NOTE' then perform public.allocate_customer_credit(target_organization_id,(settlement.value->>'source_id')::uuid,invoice_id,(settlement.value->>'amount')::numeric);insert into public.pos_sale_settlements(organization_id,pos_sale_id,settlement_type,source_id,amount) values(target_organization_id,sale_id,'CREDIT_NOTE',(settlement.value->>'source_id')::uuid,(settlement.value->>'amount')::numeric);
  else raise exception using errcode='P0001',message='PAYMENT_METHOD_INVALID';end if;
 end loop;
 if cash_net>0 then insert into public.pos_cash_events(organization_id,branch_id,terminal_id,session_id,event_type,amount,direction,source_type,source_id,reason,actor_id) values(target_organization_id,session.branch_id,terminal.id,session.id,'CASH_SALE',cash_net,'IN','POS_SALE',sale_id,'Cash sale '||receipt,actor);end if;
 update public.pos_sales ps set cash_tendered=(select nullif(coalesce(sum(s.tendered_amount),0),0) from public.pos_sale_settlements s join public.payment_methods m on m.organization_id=s.organization_id and m.id=s.payment_method_id where s.organization_id=target_organization_id and s.pos_sale_id=sale_id and m.method_type='CASH'),change_due=(select coalesce(sum(s.change_amount),0) from public.pos_sale_settlements s where s.organization_id=target_organization_id and s.pos_sale_id=sale_id) where ps.id=sale_id;if target_held_cart_id is not null then update public.pos_held_carts set status='COMPLETED',updated_at=now() where organization_id=target_organization_id and id=target_held_cart_id and session_id=session.id;end if;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'pos.sale.completed','pos_sale',sale_id,jsonb_build_object('receipt',receipt,'total',order_row.total,'invoice_id',invoice_id,'inventory_transaction_id',inventory_id,'change_due',change_due));return jsonb_build_object('pos_sale_id',sale_id,'receipt_number',receipt,'sales_order_id',order_id,'fulfilment_id',fulfilment_id,'invoice_id',invoice_id,'inventory_transaction_id',inventory_id,'change_due',change_due,'replayed',false);
exception when unique_violation then select * into existing from public.pos_sales where organization_id=target_organization_id and idempotency_key=target_idempotency_key;if found and existing.request_hash=payload_hash then return jsonb_build_object('pos_sale_id',existing.id,'receipt_number',existing.receipt_number,'invoice_id',existing.customer_invoice_id,'replayed',true);end if;raise;end $$;

create or replace function public.record_pos_receipt_reprint(target_organization_id uuid,target_sale_id uuid,target_reason text)
returns uuid language plpgsql security definer set search_path='' as $$declare actor uuid:=auth.uid();sale public.pos_sales%rowtype;result uuid:=gen_random_uuid();begin select * into sale from public.pos_sales where organization_id=target_organization_id and id=target_sale_id;if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE';end if;if actor is null or not public.has_permission(target_organization_id,'pos.receipt.reprint') or not public.can_access_branch(target_organization_id,sale.branch_id) then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;insert into public.pos_receipt_reprints(id,organization_id,pos_sale_id,reprinted_by,reason)values(result,target_organization_id,sale.id,actor,nullif(trim(target_reason),''));insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id)values(target_organization_id,actor,'pos.receipt.reprinted','pos_sale',sale.id);return result;end $$;
