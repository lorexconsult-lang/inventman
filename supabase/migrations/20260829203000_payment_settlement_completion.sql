create or replace function public.refresh_supplier_invoice_settlement(target_organization_id uuid,target_invoice_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare i public.supplier_invoices%rowtype; paid numeric; credited numeric; outstanding numeric;
begin
 select * into i from public.supplier_invoices where organization_id=target_organization_id and id=target_invoice_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 select coalesce(sum(a.allocated_base_amount),0) into paid from public.payment_allocations a join public.payments p on p.organization_id=a.organization_id and p.id=a.payment_id where a.organization_id=target_organization_id and a.supplier_invoice_id=i.id and not a.is_reversal and not p.is_reversal and p.status<>'VOIDED';
 select coalesce(sum(c.base_currency_amount),0) into credited from public.supplier_credits c where c.organization_id=target_organization_id and c.supplier_invoice_id=i.id and c.status='APPROVED';
 credited:=credited+coalesce((select sum(a.allocated_base_amount) from public.supplier_credit_allocations a join public.supplier_credits c on c.organization_id=a.organization_id and c.id=a.supplier_credit_id where a.organization_id=target_organization_id and a.supplier_invoice_id=i.id and c.status='APPROVED' and c.supplier_invoice_id is null),0);
 outstanding:=greatest(i.base_currency_total-credited-paid,0);
 perform set_config('app.payment_mutation','on',true);
 update public.supplier_invoices set amount_paid_base=paid,status=case when status in('DRAFT','REVIEW','DISPUTED','VOID') then status when outstanding=0 then 'PAID' when paid>0 or credited>0 then 'PARTIALLY_PAID' else 'APPROVED' end,updated_at=now() where id=i.id;
end $$;

create or replace function public.update_payment_method(target_organization_id uuid,target_method_id uuid,target_name text,target_status text,target_requires_reference boolean,target_allows_overpayment boolean,target_requires_approval boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare method public.payment_methods%rowtype;
begin
 if not public.has_permission(target_organization_id,'payments.accounts.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into method from public.payment_methods where organization_id=target_organization_id and id=target_method_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 update public.payment_methods set name=trim(target_name),status=target_status,requires_reference=target_requires_reference,allows_overpayment=target_allows_overpayment,requires_approval=target_requires_approval,updated_at=now() where id=method.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,before_data,after_data) values(target_organization_id,auth.uid(),'payments.method.changed','payment_method',method.id,jsonb_build_object('status',method.status,'requires_reference',method.requires_reference,'allows_overpayment',method.allows_overpayment),jsonb_build_object('status',target_status,'requires_reference',target_requires_reference,'allows_overpayment',target_allows_overpayment));
 return method.id;
end $$;

create or replace function public.refund_approval_policy_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status='PENDING_APPROVAL' and not exists(select 1 from public.approval_policies p where p.organization_id=new.organization_id and p.document_type='CUSTOMER_REFUND' and p.is_active and (p.branch_id is null or p.branch_id=new.branch_id) and p.minimum_amount<=new.base_currency_amount) then raise exception using errcode='P0001',message='APPROVAL_REQUIRED'; end if;
 return new;
end $$;
create trigger refund_requires_approval_policy before insert on public.customer_refunds for each row execute function public.refund_approval_policy_guard();

create or replace function public.allocate_customer_credit(target_organization_id uuid,target_credit_note_id uuid,target_invoice_id uuid,target_amount numeric)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); credit public.customer_credit_notes%rowtype; invoice public.customer_invoices%rowtype; used numeric; outstanding numeric; result uuid;
begin
 if not public.has_permission(target_organization_id,'payments.customer.allocate') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into credit from public.customer_credit_notes where organization_id=target_organization_id and id=target_credit_note_id and status='ISSUED' for update;
 select * into invoice from public.customer_invoices where organization_id=target_organization_id and id=target_invoice_id for update;
 if not found or credit.id is null or credit.customer_id<>invoice.customer_id then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if credit.currency<>invoice.currency then raise exception using errcode='P0001',message='PAYMENT_CURRENCY_MISMATCH'; end if;
 select coalesce(sum(allocated_amount),0) into used from public.customer_credit_allocations where organization_id=target_organization_id and credit_note_id=credit.id;
 outstanding:=greatest(invoice.total-invoice.amount_paid_base-invoice.credit_note_total_base/invoice.exchange_rate,0);
 if target_amount<=0 or used+target_amount>credit.total then raise exception using errcode='P0001',message='PAYMENT_ALLOCATION_EXCEEDS_PAYMENT'; end if;
 if target_amount>outstanding then raise exception using errcode='P0001',message='PAYMENT_ALLOCATION_EXCEEDS_INVOICE'; end if;
 insert into public.customer_credit_allocations(organization_id,credit_note_id,invoice_id,allocated_amount,allocated_base_amount,allocation_date,created_by) values(target_organization_id,credit.id,invoice.id,target_amount,round(target_amount*credit.exchange_rate,4),current_date,actor) returning id into result;
 perform public.refresh_customer_invoice_settlement(target_organization_id,invoice.id);
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'payments.customer_credit.allocated','customer_credit_note',credit.id,jsonb_build_object('invoice_id',invoice.id,'amount',target_amount));
 return result;
end $$;

create or replace function public.allocate_supplier_credit(target_organization_id uuid,target_supplier_credit_id uuid,target_supplier_invoice_id uuid,target_amount numeric)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); credit public.supplier_credits%rowtype; invoice public.supplier_invoices%rowtype; used numeric; outstanding numeric; result uuid;
begin
 if not public.has_permission(target_organization_id,'payments.supplier.allocate') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into credit from public.supplier_credits where organization_id=target_organization_id and id=target_supplier_credit_id and status='APPROVED' for update;
 select * into invoice from public.supplier_invoices where organization_id=target_organization_id and id=target_supplier_invoice_id for update;
 if not found or credit.id is null or credit.supplier_id<>invoice.supplier_id then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if credit.currency<>invoice.currency then raise exception using errcode='P0001',message='PAYMENT_CURRENCY_MISMATCH'; end if;
 if credit.supplier_invoice_id is not null then raise exception using errcode='P0001',message='CREDIT_ALREADY_LINKED'; end if;
 select coalesce(sum(allocated_amount),0) into used from public.supplier_credit_allocations where organization_id=target_organization_id and supplier_credit_id=credit.id;
 select outstanding_base/invoice.exchange_rate into outstanding from public.supplier_invoice_settlement where organization_id=target_organization_id and id=invoice.id;
 if target_amount<=0 or used+target_amount>credit.amount then raise exception using errcode='P0001',message='PAYMENT_ALLOCATION_EXCEEDS_PAYMENT'; end if;
 if target_amount>outstanding then raise exception using errcode='P0001',message='PAYMENT_ALLOCATION_EXCEEDS_INVOICE'; end if;
 insert into public.supplier_credit_allocations(organization_id,supplier_credit_id,supplier_invoice_id,allocated_amount,allocated_base_amount,allocation_date,created_by) values(target_organization_id,credit.id,invoice.id,target_amount,round(target_amount*credit.exchange_rate,4),current_date,actor) returning id into result;
 perform public.refresh_supplier_invoice_settlement(target_organization_id,invoice.id);
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'payments.supplier_credit.allocated','supplier_credit',credit.id,jsonb_build_object('invoice_id',invoice.id,'amount',target_amount));
 return result;
end $$;

create or replace view public.supplier_invoice_settlement with(security_invoker=true) as
select i.*,
 coalesce((select sum(a.allocated_base_amount) from public.payment_allocations a join public.payments p on p.organization_id=a.organization_id and p.id=a.payment_id where a.organization_id=i.organization_id and a.supplier_invoice_id=i.id and not a.is_reversal and not p.is_reversal and p.status<>'VOIDED'),0) payment_allocated_base,
 coalesce((select sum(c.base_currency_amount) from public.supplier_credits c where c.organization_id=i.organization_id and c.supplier_invoice_id=i.id and c.status='APPROVED'),0)+coalesce((select sum(a.allocated_base_amount) from public.supplier_credit_allocations a join public.supplier_credits c on c.organization_id=a.organization_id and c.id=a.supplier_credit_id where a.organization_id=i.organization_id and a.supplier_invoice_id=i.id and c.status='APPROVED' and c.supplier_invoice_id is null),0) credit_allocated_base,
 greatest(i.base_currency_total-coalesce((select sum(a.allocated_base_amount) from public.payment_allocations a join public.payments p on p.organization_id=a.organization_id and p.id=a.payment_id where a.organization_id=i.organization_id and a.supplier_invoice_id=i.id and not a.is_reversal and not p.is_reversal and p.status<>'VOIDED'),0)-coalesce((select sum(c.base_currency_amount) from public.supplier_credits c where c.organization_id=i.organization_id and c.supplier_invoice_id=i.id and c.status='APPROVED'),0)-coalesce((select sum(a.allocated_base_amount) from public.supplier_credit_allocations a join public.supplier_credits c on c.organization_id=a.organization_id and c.id=a.supplier_credit_id where a.organization_id=i.organization_id and a.supplier_invoice_id=i.id and c.status='APPROVED' and c.supplier_invoice_id is null),0),0) outstanding_base
from public.supplier_invoices i;

create or replace view public.supplier_payables with(security_invoker=true) as select organization_id,supplier_id,sum(outstanding_base) outstanding_base from public.supplier_invoice_settlement where status not in('DRAFT','VOID') group by organization_id,supplier_id;

create or replace view public.customer_unapplied_credit_documents with(security_invoker=true) as
select p.organization_id,p.customer_id,'PAYMENT'::text source_type,p.id source_id,p.payment_number document_number,p.currency,greatest(p.amount-coalesce((select sum(a.allocated_amount) from public.payment_allocations a where a.organization_id=p.organization_id and a.payment_id=p.id and not a.is_reversal),0)-coalesce((select sum(r.amount) from public.customer_refunds r where r.organization_id=p.organization_id and r.source_payment_id=p.id and r.status in('POSTED','PENDING_APPROVAL')),0),0) unapplied_amount from public.payments p where p.counterparty_type='CUSTOMER' and not p.is_reversal and p.status<>'VOIDED'
union all
select c.organization_id,c.customer_id,'CREDIT_NOTE',c.id,c.credit_note_number,c.currency,greatest(c.total-coalesce((select sum(a.allocated_amount) from public.customer_credit_allocations a where a.organization_id=c.organization_id and a.credit_note_id=c.id),0)-coalesce((select sum(r.amount) from public.customer_refunds r where r.organization_id=c.organization_id and r.source_credit_note_id=c.id and r.status in('POSTED','PENDING_APPROVAL')),0),0) from public.customer_credit_notes c where c.status='ISSUED';
grant select on public.customer_unapplied_credit_documents to authenticated;

create or replace function public.purge_ephemeral_payment_verification(target_organization_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.role()<>'service_role' then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if not exists(select 1 from public.organizations where id=target_organization_id and slug like 'phase6-payments-%') then raise exception using errcode='42501',message='EPHEMERAL_SCOPE_REQUIRED'; end if;
 delete from public.organizations where id=target_organization_id;
end $$;

revoke all on function public.update_payment_method(uuid,uuid,text,text,boolean,boolean,boolean) from public,anon;
revoke all on function public.allocate_customer_credit(uuid,uuid,uuid,numeric) from public,anon;
revoke all on function public.allocate_supplier_credit(uuid,uuid,uuid,numeric) from public,anon;
grant execute on function public.update_payment_method(uuid,uuid,text,text,boolean,boolean,boolean),public.allocate_customer_credit(uuid,uuid,uuid,numeric),public.allocate_supplier_credit(uuid,uuid,uuid,numeric) to authenticated;
revoke all on function public.purge_ephemeral_payment_verification(uuid) from public,anon,authenticated;
grant execute on function public.purge_ephemeral_payment_verification(uuid) to service_role;
