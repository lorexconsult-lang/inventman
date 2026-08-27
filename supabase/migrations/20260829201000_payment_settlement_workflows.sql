create or replace function public.next_payment_number(target_organization_id uuid,target_prefix text)
returns text language plpgsql security definer set search_path='' as $$
declare n bigint;
begin
 insert into public.payment_number_counters(organization_id,prefix,next_value) values(target_organization_id,target_prefix,2)
 on conflict(organization_id,prefix) do update set next_value=public.payment_number_counters.next_value+1,updated_at=now()
 returning next_value-1 into n;
 return target_prefix||'-'||lpad(n::text,6,'0');
end $$;

create or replace function public.refresh_customer_invoice_settlement(target_organization_id uuid,target_invoice_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare i public.customer_invoices%rowtype; paid numeric; credited numeric; outstanding numeric;
begin
 select * into i from public.customer_invoices where organization_id=target_organization_id and id=target_invoice_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 select coalesce(sum(a.allocated_base_amount),0) into paid from public.payment_allocations a join public.payments p on p.organization_id=a.organization_id and p.id=a.payment_id where a.organization_id=target_organization_id and a.customer_invoice_id=i.id and not a.is_reversal and not p.is_reversal and p.status<>'VOIDED';
 select coalesce(sum(a.allocated_base_amount),0) into credited from public.customer_credit_allocations a join public.customer_credit_notes c on c.organization_id=a.organization_id and c.id=a.credit_note_id where a.organization_id=target_organization_id and a.invoice_id=i.id and c.status='ISSUED';
 if credited=0 then credited:=i.credit_note_total_base; end if;
 outstanding:=greatest(i.base_currency_total-credited-paid,0);
 perform set_config('app.payment_mutation','on',true);
 update public.customer_invoices set amount_paid_base=paid,credit_note_total_base=credited,status=case when status in('DRAFT','VOID','DISPUTED') then status when outstanding=0 and credited>=base_currency_total and paid=0 then 'CREDITED' when outstanding=0 then 'PAID' when paid>0 or credited>0 then 'PARTIALLY_PAID' when due_date<current_date then 'OVERDUE' else 'ISSUED' end,updated_at=now() where id=i.id;
end $$;

create or replace function public.refresh_supplier_invoice_settlement(target_organization_id uuid,target_invoice_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare i public.supplier_invoices%rowtype; paid numeric; credited numeric; outstanding numeric;
begin
 select * into i from public.supplier_invoices where organization_id=target_organization_id and id=target_invoice_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 select coalesce(sum(a.allocated_base_amount),0) into paid from public.payment_allocations a join public.payments p on p.organization_id=a.organization_id and p.id=a.payment_id where a.organization_id=target_organization_id and a.supplier_invoice_id=i.id and not a.is_reversal and not p.is_reversal and p.status<>'VOIDED';
 select coalesce(sum(c.base_currency_amount),0) into credited from public.supplier_credits c where c.organization_id=target_organization_id and c.supplier_invoice_id=i.id and c.status='APPROVED';
 outstanding:=greatest(i.base_currency_total-credited-paid,0);
 perform set_config('app.payment_mutation','on',true);
 update public.supplier_invoices set amount_paid_base=paid,status=case when status in('DRAFT','REVIEW','DISPUTED','VOID') then status when outstanding=0 then 'PAID' when paid>0 or credited>0 then 'PARTIALLY_PAID' else 'APPROVED' end,updated_at=now() where id=i.id;
end $$;

create or replace function public.payment_immutable_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if current_setting('app.payment_mutation',true)<>'on' then raise exception using errcode='42501',message='PAYMENT_IMMUTABLE'; end if;
 return case when tg_op='DELETE' then old else new end;
end $$;
create trigger payments_immutable before update or delete on public.payments for each row execute function public.payment_immutable_guard();
create trigger allocations_immutable before update or delete on public.payment_allocations for each row execute function public.payment_immutable_guard();
create trigger refunds_immutable before update or delete on public.customer_refunds for each row execute function public.payment_immutable_guard();

create or replace function public.post_shared_payment(
 target_organization_id uuid,target_counterparty_type text,target_counterparty_id uuid,target_branch_id uuid,target_payment_date date,
 target_currency text,target_exchange_rate numeric,target_amount numeric,target_payment_method_id uuid,target_settlement_account_id uuid,
 target_external_reference text,target_notes text,target_allocations jsonb,target_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); required_permission text; existing public.payments%rowtype; method public.payment_methods%rowtype; account public.payment_accounts%rowtype;
 payment_id uuid:=gen_random_uuid(); payment_number text; payload_hash text; allocation record; invoice record; allocation_amount numeric; outstanding numeric; allocation_total numeric:=0; base_allocation numeric;
begin
 if actor is null then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if target_counterparty_type not in('CUSTOMER','SUPPLIER') then raise exception using errcode='22023',message='PAYMENT_COUNTERPARTY_INVALID'; end if;
 required_permission:=case target_counterparty_type when 'CUSTOMER' then 'payments.customer.post' else 'payments.supplier.post' end;
 if not public.has_permission(target_organization_id,required_permission) then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if not public.can_access_branch(target_organization_id,target_branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 if target_amount<=0 or target_exchange_rate<=0 then raise exception using errcode='22023',message='PAYMENT_AMOUNT_INVALID'; end if;
 if target_currency!~'^[A-Z]{3}$' then raise exception using errcode='22023',message='PAYMENT_CURRENCY_INVALID'; end if;
 if target_allocations is null then target_allocations:='[]'::jsonb; end if;
 if jsonb_typeof(target_allocations)<>'array' then raise exception using errcode='22023',message='PAYMENT_ALLOCATIONS_INVALID'; end if;
 payload_hash:=encode(extensions.digest(convert_to(jsonb_build_object('party_type',target_counterparty_type,'party',target_counterparty_id,'branch',target_branch_id,'date',target_payment_date,'currency',target_currency,'rate',target_exchange_rate,'amount',target_amount,'method',target_payment_method_id,'account',target_settlement_account_id,'reference',target_external_reference,'notes',target_notes,'allocations',target_allocations)::text,'UTF8'),'sha256'),'hex');
 select * into existing from public.payments where organization_id=target_organization_id and idempotency_key=target_idempotency_key;
 if found then
  if existing.request_hash<>payload_hash then raise exception using errcode='P0001',message='IDEMPOTENCY_CONFLICT'; end if;
  return jsonb_build_object('payment_id',existing.id,'payment_number',existing.payment_number,'status',existing.status,'replayed',true);
 end if;
 select * into method from public.payment_methods where organization_id=target_organization_id and id=target_payment_method_id and status='ACTIVE';
 if not found or (method.branch_id is not null and method.branch_id<>target_branch_id) then raise exception using errcode='P0001',message='PAYMENT_METHOD_INACTIVE'; end if;
 if method.requires_reference and nullif(trim(target_external_reference),'') is null then raise exception using errcode='P0001',message='PAYMENT_REFERENCE_REQUIRED'; end if;
 select * into account from public.payment_accounts where organization_id=target_organization_id and id=target_settlement_account_id and status='ACTIVE';
 if not found then raise exception using errcode='P0001',message='PAYMENT_ACCOUNT_INACTIVE'; end if;
 if account.currency<>target_currency then raise exception using errcode='P0001',message='PAYMENT_CURRENCY_MISMATCH'; end if;
 if account.branch_id is not null and account.branch_id<>target_branch_id then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 if target_counterparty_type='CUSTOMER' and not exists(select 1 from public.customers where organization_id=target_organization_id and id=target_counterparty_id and status in('ACTIVE','BLOCKED')) then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if target_counterparty_type='SUPPLIER' and not exists(select 1 from public.suppliers where organization_id=target_organization_id and id=target_counterparty_id and status='ACTIVE') then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 payment_number:=public.next_payment_number(target_organization_id,case target_counterparty_type when 'CUSTOMER' then 'CR' else 'SP' end);
 insert into public.payments(id,organization_id,branch_id,payment_number,counterparty_type,direction,customer_id,supplier_id,payment_date,currency,exchange_rate_snapshot,amount,base_currency_amount,payment_method_id,settlement_account_id,external_reference,notes,status,idempotency_key,request_hash,created_by,posted_by)
 values(payment_id,target_organization_id,target_branch_id,payment_number,target_counterparty_type,case target_counterparty_type when 'CUSTOMER' then 'RECEIPT' else 'PAYMENT' end,case when target_counterparty_type='CUSTOMER' then target_counterparty_id end,case when target_counterparty_type='SUPPLIER' then target_counterparty_id end,target_payment_date,target_currency,target_exchange_rate,target_amount,round(target_amount*target_exchange_rate,4),target_payment_method_id,target_settlement_account_id,nullif(trim(target_external_reference),''),nullif(trim(target_notes),''),'POSTED',target_idempotency_key,payload_hash,actor,actor);
 for allocation in select value from jsonb_array_elements(target_allocations) loop
  allocation_amount:=(allocation.value->>'amount')::numeric;
  if allocation_amount<=0 then raise exception using errcode='22023',message='PAYMENT_AMOUNT_INVALID'; end if;
  allocation_total:=allocation_total+allocation_amount;
  if allocation_total>target_amount then raise exception using errcode='P0001',message='PAYMENT_ALLOCATION_EXCEEDS_PAYMENT'; end if;
  if target_counterparty_type='CUSTOMER' then
   select i.* into invoice from public.customer_invoices i where i.organization_id=target_organization_id and i.id=(allocation.value->>'invoice_id')::uuid for update;
   if not found or invoice.customer_id<>target_counterparty_id then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
   if not public.can_access_branch(target_organization_id,invoice.branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
   if invoice.currency<>target_currency then raise exception using errcode='P0001',message='PAYMENT_CURRENCY_MISMATCH'; end if;
   if invoice.status in('DRAFT','VOID','CREDITED','PAID') then raise exception using errcode='P0001',message='INVOICE_ALREADY_SETTLED'; end if;
   select greatest(invoice.total-coalesce(sum(a.allocated_amount),0)-coalesce((select sum(ca.allocated_amount) from public.customer_credit_allocations ca join public.customer_credit_notes cn on cn.organization_id=ca.organization_id and cn.id=ca.credit_note_id where ca.organization_id=target_organization_id and ca.invoice_id=invoice.id and cn.status='ISSUED'),invoice.credit_note_total_base/invoice.exchange_rate),0) into outstanding from public.payment_allocations a join public.payments p on p.organization_id=a.organization_id and p.id=a.payment_id where a.organization_id=target_organization_id and a.customer_invoice_id=invoice.id and not a.is_reversal and not p.is_reversal and p.status<>'VOIDED';
   if allocation_amount>outstanding then raise exception using errcode='P0001',message='PAYMENT_ALLOCATION_EXCEEDS_INVOICE'; end if;
   base_allocation:=round(allocation_amount*target_exchange_rate,4);
   insert into public.payment_allocations(organization_id,payment_id,customer_invoice_id,allocated_amount,allocated_base_amount,allocation_date,created_by) values(target_organization_id,payment_id,invoice.id,allocation_amount,base_allocation,target_payment_date,actor);
   perform public.refresh_customer_invoice_settlement(target_organization_id,invoice.id);
  else
   select i.* into invoice from public.supplier_invoices i where i.organization_id=target_organization_id and i.id=(allocation.value->>'invoice_id')::uuid for update;
   if not found or invoice.supplier_id<>target_counterparty_id then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
   if invoice.currency<>target_currency then raise exception using errcode='P0001',message='PAYMENT_CURRENCY_MISMATCH'; end if;
   if invoice.status in('DRAFT','REVIEW','VOID','PAID') then raise exception using errcode='P0001',message='INVOICE_ALREADY_SETTLED'; end if;
   select greatest(invoice.total-coalesce(sum(a.allocated_amount),0)-coalesce((select sum(sc.amount) from public.supplier_credits sc where sc.organization_id=target_organization_id and sc.supplier_invoice_id=invoice.id and sc.status='APPROVED'),0),0) into outstanding from public.payment_allocations a join public.payments p on p.organization_id=a.organization_id and p.id=a.payment_id where a.organization_id=target_organization_id and a.supplier_invoice_id=invoice.id and not a.is_reversal and not p.is_reversal and p.status<>'VOIDED';
   if allocation_amount>outstanding then raise exception using errcode='P0001',message='PAYMENT_ALLOCATION_EXCEEDS_INVOICE'; end if;
   base_allocation:=round(allocation_amount*target_exchange_rate,4);
   insert into public.payment_allocations(organization_id,payment_id,supplier_invoice_id,allocated_amount,allocated_base_amount,allocation_date,created_by) values(target_organization_id,payment_id,invoice.id,allocation_amount,base_allocation,target_payment_date,actor);
   perform public.refresh_supplier_invoice_settlement(target_organization_id,invoice.id);
  end if;
 end loop;
 if allocation_total<target_amount and not method.allows_overpayment then raise exception using errcode='P0001',message='PAYMENT_ALLOCATION_EXCEEDS_INVOICE'; end if;
 perform set_config('app.payment_mutation','on',true);
 update public.payments set status=case when allocation_total=0 then 'POSTED' when allocation_total<target_amount then 'PARTIALLY_ALLOCATED' else 'ALLOCATED' end where id=payment_id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,case target_counterparty_type when 'CUSTOMER' then 'payments.customer.posted' else 'payments.supplier.posted' end,'payment',payment_id,jsonb_build_object('payment_number',payment_number,'amount',target_amount,'currency',target_currency,'allocated',allocation_total,'branch_id',target_branch_id));
 return jsonb_build_object('payment_id',payment_id,'payment_number',payment_number,'status',case when allocation_total=0 then 'POSTED' when allocation_total<target_amount then 'PARTIALLY_ALLOCATED' else 'ALLOCATED' end,'unallocated_amount',target_amount-allocation_total,'replayed',false);
exception when unique_violation then
 select * into existing from public.payments where organization_id=target_organization_id and idempotency_key=target_idempotency_key;
 if found and existing.request_hash=payload_hash then return jsonb_build_object('payment_id',existing.id,'payment_number',existing.payment_number,'status',existing.status,'replayed',true); end if;
 raise exception using errcode='P0001',message='DUPLICATE_PAYMENT_REFERENCE';
end $$;

create or replace function public.post_customer_payment(target_organization_id uuid,target_customer_id uuid,target_branch_id uuid,target_payment_date date,target_currency text,target_exchange_rate numeric,target_amount numeric,target_payment_method_id uuid,target_settlement_account_id uuid,target_external_reference text,target_notes text,target_allocations jsonb,target_idempotency_key uuid)
returns jsonb language sql security definer set search_path='' as $$ select public.post_shared_payment(target_organization_id,'CUSTOMER',target_customer_id,target_branch_id,target_payment_date,target_currency,target_exchange_rate,target_amount,target_payment_method_id,target_settlement_account_id,target_external_reference,target_notes,target_allocations,target_idempotency_key) $$;

create or replace function public.post_supplier_payment(target_organization_id uuid,target_supplier_id uuid,target_branch_id uuid,target_payment_date date,target_currency text,target_exchange_rate numeric,target_amount numeric,target_payment_method_id uuid,target_settlement_account_id uuid,target_external_reference text,target_notes text,target_allocations jsonb,target_idempotency_key uuid)
returns jsonb language sql security definer set search_path='' as $$ select public.post_shared_payment(target_organization_id,'SUPPLIER',target_supplier_id,target_branch_id,target_payment_date,target_currency,target_exchange_rate,target_amount,target_payment_method_id,target_settlement_account_id,target_external_reference,target_notes,target_allocations,target_idempotency_key) $$;

create or replace function public.allocate_existing_payment(target_organization_id uuid,target_payment_id uuid,target_allocations jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); p public.payments%rowtype; allocation record; invoice record; used numeric; allocation_amount numeric; outstanding numeric; base_allocation numeric;
begin
 select * into p from public.payments where organization_id=target_organization_id and id=target_payment_id and not is_reversal for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if not public.has_permission(target_organization_id,case p.counterparty_type when 'CUSTOMER' then 'payments.customer.allocate' else 'payments.supplier.allocate' end) then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if not public.can_access_branch(target_organization_id,p.branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 if p.status in('VOIDED','REFUNDED') then raise exception using errcode='P0001',message='PAYMENT_ALREADY_REVERSED'; end if;
 if jsonb_typeof(target_allocations)<>'array' then raise exception using errcode='22023',message='PAYMENT_ALLOCATIONS_INVALID'; end if;
 select coalesce(sum(a.allocated_amount),0) into used from public.payment_allocations a where a.organization_id=target_organization_id and a.payment_id=p.id and not a.is_reversal and not exists(select 1 from public.payment_allocations r where r.organization_id=a.organization_id and r.original_allocation_id=a.id and r.is_reversal);
 for allocation in select value from jsonb_array_elements(target_allocations) loop
  allocation_amount:=(allocation.value->>'amount')::numeric;
  if allocation_amount<=0 then raise exception using errcode='22023',message='PAYMENT_AMOUNT_INVALID'; end if;
  used:=used+allocation_amount;
  if used>p.amount then raise exception using errcode='P0001',message='PAYMENT_ALLOCATION_EXCEEDS_PAYMENT'; end if;
  if p.counterparty_type='CUSTOMER' then
   select * into invoice from public.customer_invoices where organization_id=target_organization_id and id=(allocation.value->>'invoice_id')::uuid for update;
   if not found or invoice.customer_id<>p.customer_id then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
   if invoice.currency<>p.currency then raise exception using errcode='P0001',message='PAYMENT_CURRENCY_MISMATCH'; end if;
   select greatest(invoice.total-coalesce(sum(a.allocated_amount) filter(where not exists(select 1 from public.payment_allocations r where r.organization_id=a.organization_id and r.original_allocation_id=a.id and r.is_reversal)),0)-invoice.credit_note_total_base/invoice.exchange_rate,0) into outstanding from public.payment_allocations a join public.payments x on x.organization_id=a.organization_id and x.id=a.payment_id where a.organization_id=target_organization_id and a.customer_invoice_id=invoice.id and not a.is_reversal and not x.is_reversal and x.status<>'VOIDED';
   if allocation_amount>outstanding then raise exception using errcode='P0001',message='PAYMENT_ALLOCATION_EXCEEDS_INVOICE'; end if;
   base_allocation:=round(allocation_amount*p.exchange_rate_snapshot,4);
   insert into public.payment_allocations(organization_id,payment_id,customer_invoice_id,allocated_amount,allocated_base_amount,allocation_date,created_by) values(target_organization_id,p.id,invoice.id,allocation_amount,base_allocation,current_date,actor);
   perform public.refresh_customer_invoice_settlement(target_organization_id,invoice.id);
  else
   select * into invoice from public.supplier_invoices where organization_id=target_organization_id and id=(allocation.value->>'invoice_id')::uuid for update;
   if not found or invoice.supplier_id<>p.supplier_id then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
   if invoice.currency<>p.currency then raise exception using errcode='P0001',message='PAYMENT_CURRENCY_MISMATCH'; end if;
   select greatest(invoice.total-coalesce(sum(a.allocated_amount) filter(where not exists(select 1 from public.payment_allocations r where r.organization_id=a.organization_id and r.original_allocation_id=a.id and r.is_reversal)),0)-coalesce((select sum(sc.amount) from public.supplier_credits sc where sc.organization_id=target_organization_id and sc.supplier_invoice_id=invoice.id and sc.status='APPROVED'),0),0) into outstanding from public.payment_allocations a join public.payments x on x.organization_id=a.organization_id and x.id=a.payment_id where a.organization_id=target_organization_id and a.supplier_invoice_id=invoice.id and not a.is_reversal and not x.is_reversal and x.status<>'VOIDED';
   if allocation_amount>outstanding then raise exception using errcode='P0001',message='PAYMENT_ALLOCATION_EXCEEDS_INVOICE'; end if;
   base_allocation:=round(allocation_amount*p.exchange_rate_snapshot,4);
   insert into public.payment_allocations(organization_id,payment_id,supplier_invoice_id,allocated_amount,allocated_base_amount,allocation_date,created_by) values(target_organization_id,p.id,invoice.id,allocation_amount,base_allocation,current_date,actor);
   perform public.refresh_supplier_invoice_settlement(target_organization_id,invoice.id);
  end if;
 end loop;
 perform set_config('app.payment_mutation','on',true);
 update public.payments set status=case when used=0 then 'POSTED' when used<amount then 'PARTIALLY_ALLOCATED' else 'ALLOCATED' end where id=p.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'payments.allocation.created','payment',p.id,jsonb_build_object('allocated_total',used));
 return jsonb_build_object('payment_id',p.id,'allocated_amount',used,'unallocated_amount',p.amount-used);
end $$;

create or replace function public.reverse_payment(target_organization_id uuid,target_payment_id uuid,target_reason text,target_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); p public.payments%rowtype; existing public.payments%rowtype; reversal_id uuid:=gen_random_uuid(); reversal_number text; allocation record;
begin
 select * into p from public.payments where organization_id=target_organization_id and id=target_payment_id and not is_reversal for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if not public.has_permission(target_organization_id,case p.counterparty_type when 'CUSTOMER' then 'payments.customer.reverse' else 'payments.supplier.reverse' end) then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if not public.can_access_branch(target_organization_id,p.branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 if p.status='VOIDED' or exists(select 1 from public.payments where organization_id=target_organization_id and original_payment_id=p.id) then raise exception using errcode='P0001',message='PAYMENT_ALREADY_REVERSED'; end if;
 if exists(select 1 from public.customer_refunds where organization_id=target_organization_id and source_payment_id=p.id and status='POSTED') then raise exception using errcode='P0001',message='PAYMENT_REFUND_EXISTS'; end if;
 if nullif(trim(target_reason),'') is null then raise exception using errcode='22023',message='REVERSAL_REASON_REQUIRED'; end if;
 select * into existing from public.payments where organization_id=target_organization_id and idempotency_key=target_idempotency_key;
 if found then return jsonb_build_object('payment_id',existing.id,'payment_number',existing.payment_number,'replayed',true); end if;
 reversal_number:=public.next_payment_number(target_organization_id,case p.counterparty_type when 'CUSTOMER' then 'CRV' else 'SPV' end);
 perform set_config('app.payment_mutation','on',true);
 update public.payments set status='VOIDED',reversal_reason=target_reason where id=p.id;
 insert into public.payments(id,organization_id,branch_id,payment_number,counterparty_type,direction,customer_id,supplier_id,payment_date,currency,exchange_rate_snapshot,amount,base_currency_amount,payment_method_id,settlement_account_id,external_reference,notes,status,idempotency_key,request_hash,is_reversal,original_payment_id,reversal_reason,created_by,posted_by)
 values(reversal_id,target_organization_id,p.branch_id,reversal_number,p.counterparty_type,p.direction,p.customer_id,p.supplier_id,current_date,p.currency,p.exchange_rate_snapshot,p.amount,p.base_currency_amount,p.payment_method_id,p.settlement_account_id,p.external_reference,'Reversal of '||p.payment_number,'ALLOCATED',target_idempotency_key,encode(extensions.digest(convert_to(p.id::text||target_reason,'UTF8'),'sha256'),'hex'),true,p.id,target_reason,actor,actor);
 for allocation in select * from public.payment_allocations where organization_id=target_organization_id and payment_id=p.id and not is_reversal loop
  insert into public.payment_allocations(organization_id,payment_id,customer_invoice_id,supplier_invoice_id,allocated_amount,allocated_base_amount,allocation_date,is_reversal,original_allocation_id,created_by) values(target_organization_id,reversal_id,allocation.customer_invoice_id,allocation.supplier_invoice_id,allocation.allocated_amount,allocation.allocated_base_amount,current_date,true,allocation.id,actor);
  if allocation.customer_invoice_id is not null then perform public.refresh_customer_invoice_settlement(target_organization_id,allocation.customer_invoice_id); else perform public.refresh_supplier_invoice_settlement(target_organization_id,allocation.supplier_invoice_id); end if;
 end loop;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,before_data,after_data) values(target_organization_id,actor,'payments.payment.reversed','payment',p.id,jsonb_build_object('status',p.status),jsonb_build_object('status','VOIDED','reversal_id',reversal_id,'reason',target_reason));
 return jsonb_build_object('payment_id',reversal_id,'payment_number',reversal_number,'replayed',false);
end $$;

create or replace function public.post_customer_refund(target_organization_id uuid,target_customer_id uuid,target_branch_id uuid,target_source_payment_id uuid,target_source_credit_note_id uuid,target_refund_date date,target_currency text,target_exchange_rate numeric,target_amount numeric,target_payment_method_id uuid,target_settlement_account_id uuid,target_external_reference text,target_reason text,target_idempotency_key uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); source_payment public.payments%rowtype; source_credit public.customer_credit_notes%rowtype; account public.payment_accounts%rowtype; method public.payment_methods%rowtype; existing public.customer_refunds%rowtype; available numeric; already_refunded numeric; refund_id uuid:=gen_random_uuid(); refund_number text; payload_hash text; policy public.approval_policies%rowtype; request_id uuid; result_status text;
begin
 if not public.has_permission(target_organization_id,'payments.refund.post') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if not public.can_access_branch(target_organization_id,target_branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 if target_amount<=0 or target_exchange_rate<=0 or ((target_source_payment_id is null)=(target_source_credit_note_id is null)) then raise exception using errcode='22023',message='PAYMENT_AMOUNT_INVALID'; end if;
 payload_hash:=encode(extensions.digest(convert_to(jsonb_build_object('customer',target_customer_id,'branch',target_branch_id,'payment',target_source_payment_id,'credit',target_source_credit_note_id,'date',target_refund_date,'currency',target_currency,'rate',target_exchange_rate,'amount',target_amount,'method',target_payment_method_id,'account',target_settlement_account_id,'reference',target_external_reference,'reason',target_reason)::text,'UTF8'),'sha256'),'hex');
 select * into existing from public.customer_refunds where organization_id=target_organization_id and idempotency_key=target_idempotency_key;
 if found then if existing.request_hash<>payload_hash then raise exception using errcode='P0001',message='IDEMPOTENCY_CONFLICT'; end if; return jsonb_build_object('refund_id',existing.id,'refund_number',existing.refund_number,'status',existing.status,'replayed',true); end if;
 select * into account from public.payment_accounts where organization_id=target_organization_id and id=target_settlement_account_id and status='ACTIVE';
 if not found then raise exception using errcode='P0001',message='PAYMENT_ACCOUNT_INACTIVE'; end if;
 select * into method from public.payment_methods where organization_id=target_organization_id and id=target_payment_method_id and status='ACTIVE';
 if not found then raise exception using errcode='P0001',message='PAYMENT_METHOD_INACTIVE'; end if;
 if account.currency<>target_currency then raise exception using errcode='P0001',message='PAYMENT_CURRENCY_MISMATCH'; end if;
 if account.branch_id is not null and account.branch_id<>target_branch_id then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 if method.requires_reference and nullif(trim(target_external_reference),'') is null then raise exception using errcode='P0001',message='PAYMENT_REFERENCE_REQUIRED'; end if;
 if target_source_payment_id is not null then
  select * into source_payment from public.payments where organization_id=target_organization_id and id=target_source_payment_id and customer_id=target_customer_id and not is_reversal and status<>'VOIDED' for update;
  if not found or source_payment.currency<>target_currency then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
  select source_payment.amount-coalesce(sum(a.allocated_amount),0) into available from public.payment_allocations a where a.organization_id=target_organization_id and a.payment_id=source_payment.id and not a.is_reversal;
 else
  select * into source_credit from public.customer_credit_notes where organization_id=target_organization_id and id=target_source_credit_note_id and customer_id=target_customer_id and status='ISSUED' for update;
  if not found or source_credit.currency<>target_currency then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
  select source_credit.total-coalesce(sum(a.allocated_amount),0) into available from public.customer_credit_allocations a where a.organization_id=target_organization_id and a.credit_note_id=source_credit.id;
 end if;
 select coalesce(sum(r.amount),0) into already_refunded from public.customer_refunds r where r.organization_id=target_organization_id and r.status in('POSTED','PENDING_APPROVAL') and ((target_source_payment_id is not null and r.source_payment_id=target_source_payment_id) or (target_source_credit_note_id is not null and r.source_credit_note_id=target_source_credit_note_id));
 available:=coalesce(available,case when target_source_payment_id is not null then source_payment.amount else source_credit.total end)-already_refunded;
 if target_amount>available then raise exception using errcode='P0001',message='REFUND_EXCEEDS_AVAILABLE_CREDIT'; end if;
 select * into policy from public.approval_policies where organization_id=target_organization_id and document_type='CUSTOMER_REFUND' and is_active and (branch_id is null or branch_id=target_branch_id) and minimum_amount<=round(target_amount*target_exchange_rate,4) order by minimum_amount desc limit 1;
 result_status:=case when found or method.requires_approval then 'PENDING_APPROVAL' else 'POSTED' end;
 refund_number:=public.next_payment_number(target_organization_id,'RF');
 insert into public.customer_refunds(id,organization_id,branch_id,refund_number,customer_id,source_payment_id,source_credit_note_id,refund_date,currency,exchange_rate_snapshot,amount,base_currency_amount,payment_method_id,settlement_account_id,external_reference,reason,status,idempotency_key,request_hash,processed_by,posted_at,created_by)
 values(refund_id,target_organization_id,target_branch_id,refund_number,target_customer_id,target_source_payment_id,target_source_credit_note_id,target_refund_date,target_currency,target_exchange_rate,target_amount,round(target_amount*target_exchange_rate,4),target_payment_method_id,target_settlement_account_id,nullif(trim(target_external_reference),''),target_reason,result_status,target_idempotency_key,payload_hash,case when result_status='POSTED' then actor end,case when result_status='POSTED' then now() end,actor);
 if result_status='PENDING_APPROVAL' then
  request_id:=gen_random_uuid();
  insert into public.approval_requests(id,organization_id,policy_id,document_type,document_id,branch_id,amount,currency,requester_id,document_hash) values(request_id,target_organization_id,policy.id,'CUSTOMER_REFUND',refund_id,target_branch_id,round(target_amount*target_exchange_rate,4),target_currency,actor,payload_hash);
  perform set_config('app.payment_mutation','on',true); update public.customer_refunds set approval_request_id=request_id where id=refund_id;
 else
  if target_source_payment_id is not null then perform set_config('app.payment_mutation','on',true); update public.payments set status=case when target_amount+already_refunded>=available+already_refunded then 'REFUNDED' else 'PARTIALLY_REFUNDED' end where id=source_payment.id; end if;
 end if;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,case result_status when 'POSTED' then 'payments.refund.posted' else 'payments.refund.created' end,'customer_refund',refund_id,jsonb_build_object('amount',target_amount,'currency',target_currency,'status',result_status));
 return jsonb_build_object('refund_id',refund_id,'refund_number',refund_number,'status',result_status,'replayed',false);
end $$;

create or replace function public.finalize_approved_customer_refund(target_organization_id uuid,target_refund_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); r public.customer_refunds%rowtype; approved boolean;
begin
 if not public.has_permission(target_organization_id,'payments.refund.post') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into r from public.customer_refunds where organization_id=target_organization_id and id=target_refund_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if r.status<>'PENDING_APPROVAL' then raise exception using errcode='P0001',message='REFUND_STATE_INVALID'; end if;
 select status='APPROVED' into approved from public.approval_requests where organization_id=target_organization_id and id=r.approval_request_id;
 if not coalesce(approved,false) then raise exception using errcode='P0001',message='APPROVAL_REQUIRED'; end if;
 perform set_config('app.payment_mutation','on',true);
 update public.customer_refunds set status='POSTED',approved_by=actor,processed_by=actor,posted_at=now() where id=r.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'payments.refund.posted','customer_refund',r.id,jsonb_build_object('amount',r.amount));
 return r.id;
end $$;
