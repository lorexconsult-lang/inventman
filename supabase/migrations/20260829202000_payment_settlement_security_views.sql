alter table public.permissions drop constraint permissions_code_check;
alter table public.permissions add constraint permissions_code_check check(code~'^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$');

insert into public.permissions(code,description) values
('payments.customer.view','View customer payments'),('payments.customer.create','Create customer payments'),('payments.customer.post','Post customer payments'),('payments.customer.allocate','Allocate customer payments'),('payments.customer.reverse','Reverse customer payments'),
('payments.supplier.view','View supplier payments'),('payments.supplier.create','Create supplier payments'),('payments.supplier.post','Post supplier payments'),('payments.supplier.allocate','Allocate supplier payments'),('payments.supplier.reverse','Reverse supplier payments'),
('payments.refund.view','View customer refunds'),('payments.refund.create','Create customer refunds'),('payments.refund.approve','Approve customer refunds'),('payments.refund.post','Post customer refunds'),
('payments.accounts.view','View settlement accounts and methods'),('payments.accounts.manage','Manage settlement accounts and methods'),('receivables.payments.view','View customer payment settlement'),('payables.payments.view','View supplier payment settlement'),('payments.reports.view','View settlement reports')
on conflict(code) do update set description=excluded.description;

insert into public.role_permissions(organization_id,role_id,permission_id)
select r.organization_id,r.id,p.id from public.roles r cross join public.permissions p
where r.is_system and r.name in('Owner','Administrator') and (p.code like 'payments.%' or p.code in('receivables.payments.view','payables.payments.view')) on conflict do nothing;

create or replace function public.create_payment_account(target_organization_id uuid,target_branch_id uuid,target_account_code text,target_name text,target_account_type text,target_currency text,target_description text)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; actor uuid:=auth.uid();
begin
 if not public.has_permission(target_organization_id,'payments.accounts.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if target_branch_id is not null and (not public.can_access_branch(target_organization_id,target_branch_id) or not exists(select 1 from public.branches where organization_id=target_organization_id and id=target_branch_id and status='active')) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 insert into public.payment_accounts(organization_id,branch_id,account_code,name,account_type,currency,description,created_by) values(target_organization_id,target_branch_id,upper(trim(target_account_code)),trim(target_name),target_account_type,upper(target_currency),nullif(trim(target_description),''),actor) returning id into result;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'payments.account.created','payment_account',result,jsonb_build_object('code',upper(trim(target_account_code)),'type',target_account_type,'branch_id',target_branch_id));
 return result;
end $$;

create or replace function public.update_payment_account(target_organization_id uuid,target_account_id uuid,target_name text,target_status text,target_description text)
returns uuid language plpgsql security definer set search_path='' as $$
declare account public.payment_accounts%rowtype;
begin
 if not public.has_permission(target_organization_id,'payments.accounts.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into account from public.payment_accounts where organization_id=target_organization_id and id=target_account_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 update public.payment_accounts set name=trim(target_name),status=target_status,description=nullif(trim(target_description),''),updated_at=now() where id=account.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,before_data,after_data) values(target_organization_id,auth.uid(),'payments.account.changed','payment_account',account.id,jsonb_build_object('name',account.name,'status',account.status),jsonb_build_object('name',trim(target_name),'status',target_status));
 return account.id;
end $$;

create or replace function public.create_payment_method(target_organization_id uuid,target_branch_id uuid,target_default_account_id uuid,target_code text,target_name text,target_method_type text,target_requires_reference boolean,target_allows_overpayment boolean,target_requires_approval boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; account public.payment_accounts%rowtype; actor uuid:=auth.uid();
begin
 if not public.has_permission(target_organization_id,'payments.accounts.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into account from public.payment_accounts where organization_id=target_organization_id and id=target_default_account_id and status='ACTIVE';
 if not found or (target_branch_id is not null and account.branch_id is not null and account.branch_id<>target_branch_id) then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 insert into public.payment_methods(organization_id,branch_id,default_account_id,code,name,method_type,requires_reference,allows_overpayment,requires_approval,created_by) values(target_organization_id,target_branch_id,target_default_account_id,upper(trim(target_code)),trim(target_name),target_method_type,target_requires_reference,target_allows_overpayment,target_requires_approval,actor) returning id into result;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'payments.method.created','payment_method',result,jsonb_build_object('code',upper(trim(target_code)),'type',target_method_type));
 return result;
end $$;

create or replace function public.sync_customer_credit_allocation() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='ISSUED' and new.customer_invoice_id is not null and (tg_op='INSERT' or old.status is distinct from 'ISSUED') then
  insert into public.customer_credit_allocations(organization_id,credit_note_id,invoice_id,allocated_amount,allocated_base_amount,allocation_date,created_by)
  values(new.organization_id,new.id,new.customer_invoice_id,new.total,new.base_currency_total,new.credit_date,new.created_by) on conflict do nothing;
  perform public.refresh_customer_invoice_settlement(new.organization_id,new.customer_invoice_id);
 end if;
 return new;
end $$;
create trigger customer_credit_settlement after insert or update of status on public.customer_credit_notes for each row execute function public.sync_customer_credit_allocation();
insert into public.customer_credit_allocations(organization_id,credit_note_id,invoice_id,allocated_amount,allocated_base_amount,allocation_date,created_by)
select organization_id,id,customer_invoice_id,total,base_currency_total,credit_date,created_by from public.customer_credit_notes where status='ISSUED' and customer_invoice_id is not null on conflict do nothing;

create or replace view public.customer_invoice_settlement with(security_invoker=true) as
select i.*,
 coalesce((select sum(a.allocated_base_amount) from public.payment_allocations a join public.payments p on p.organization_id=a.organization_id and p.id=a.payment_id where a.organization_id=i.organization_id and a.customer_invoice_id=i.id and not a.is_reversal and not p.is_reversal and p.status<>'VOIDED'),0) payment_allocated_base,
 coalesce((select sum(a.allocated_base_amount) from public.customer_credit_allocations a join public.customer_credit_notes c on c.organization_id=a.organization_id and c.id=a.credit_note_id where a.organization_id=i.organization_id and a.invoice_id=i.id and c.status='ISSUED'),i.credit_note_total_base) credit_allocated_base,
 greatest(i.base_currency_total-coalesce((select sum(a.allocated_base_amount) from public.payment_allocations a join public.payments p on p.organization_id=a.organization_id and p.id=a.payment_id where a.organization_id=i.organization_id and a.customer_invoice_id=i.id and not a.is_reversal and not p.is_reversal and p.status<>'VOIDED'),0)-coalesce((select sum(a.allocated_base_amount) from public.customer_credit_allocations a join public.customer_credit_notes c on c.organization_id=a.organization_id and c.id=a.credit_note_id where a.organization_id=i.organization_id and a.invoice_id=i.id and c.status='ISSUED'),i.credit_note_total_base),0) outstanding_base
from public.customer_invoices i;

create or replace view public.supplier_invoice_settlement with(security_invoker=true) as
select i.*,
 coalesce((select sum(a.allocated_base_amount) from public.payment_allocations a join public.payments p on p.organization_id=a.organization_id and p.id=a.payment_id where a.organization_id=i.organization_id and a.supplier_invoice_id=i.id and not a.is_reversal and not p.is_reversal and p.status<>'VOIDED'),0) payment_allocated_base,
 coalesce((select sum(c.base_currency_amount) from public.supplier_credits c where c.organization_id=i.organization_id and c.supplier_invoice_id=i.id and c.status='APPROVED'),0) credit_allocated_base,
 greatest(i.base_currency_total-coalesce((select sum(a.allocated_base_amount) from public.payment_allocations a join public.payments p on p.organization_id=a.organization_id and p.id=a.payment_id where a.organization_id=i.organization_id and a.supplier_invoice_id=i.id and not a.is_reversal and not p.is_reversal and p.status<>'VOIDED'),0)-coalesce((select sum(c.base_currency_amount) from public.supplier_credits c where c.organization_id=i.organization_id and c.supplier_invoice_id=i.id and c.status='APPROVED'),0),0) outstanding_base
from public.supplier_invoices i;

create or replace view public.customer_receivables with(security_invoker=true) as
select organization_id,customer_id,sum(outstanding_base) outstanding_base,sum(case when due_date<current_date then outstanding_base else 0 end) overdue_base,min(due_date) filter(where outstanding_base>0) oldest_due_date from public.customer_invoice_settlement where status not in('DRAFT','VOID') group by organization_id,customer_id;

create or replace view public.supplier_payables with(security_invoker=true) as
select organization_id,supplier_id,sum(outstanding_base) outstanding_base from public.supplier_invoice_settlement where status not in('DRAFT','VOID') group by organization_id,supplier_id;

create or replace view public.customer_unapplied_credits with(security_invoker=true) as
select p.organization_id,p.customer_id,p.id payment_id,p.payment_number,p.currency,p.amount,
 greatest(p.amount-coalesce((select sum(a.allocated_amount) from public.payment_allocations a where a.organization_id=p.organization_id and a.payment_id=p.id and not a.is_reversal),0)-coalesce((select sum(r.amount) from public.customer_refunds r where r.organization_id=p.organization_id and r.source_payment_id=p.id and r.status in('POSTED','PENDING_APPROVAL')),0),0) unapplied_amount
from public.payments p where p.counterparty_type='CUSTOMER' and not p.is_reversal and p.status<>'VOIDED';

create or replace view public.supplier_advances with(security_invoker=true) as
select p.organization_id,p.supplier_id,p.id payment_id,p.payment_number,p.currency,p.amount,
 greatest(p.amount-coalesce((select sum(a.allocated_amount) from public.payment_allocations a where a.organization_id=p.organization_id and a.payment_id=p.id and not a.is_reversal),0),0) unapplied_amount
from public.payments p where p.counterparty_type='SUPPLIER' and not p.is_reversal and p.status<>'VOIDED';

create or replace view public.operational_settlement_balances with(security_invoker=true) as
select a.organization_id,a.id account_id,a.account_code,a.name,a.currency,
 coalesce((select sum(case p.direction when 'RECEIPT' then p.amount else -p.amount end) from public.payments p where p.organization_id=a.organization_id and p.settlement_account_id=a.id and not p.is_reversal and p.status<>'VOIDED'),0)-coalesce((select sum(r.amount) from public.customer_refunds r where r.organization_id=a.organization_id and r.settlement_account_id=a.id and r.status='POSTED'),0) operational_balance
from public.payment_accounts a;

create or replace view public.customer_statement_transactions with(security_invoker=true) as
select organization_id,customer_id,invoice_date transaction_date,'INVOICE'::text document_type,id document_id,invoice_number document_number,base_currency_total debit_base,0::numeric credit_base from public.customer_invoices where status not in('DRAFT','VOID')
union all select organization_id,customer_id,credit_date,'CREDIT_NOTE',id,credit_note_number,0,base_currency_total from public.customer_credit_notes where status='ISSUED'
union all select organization_id,customer_id,payment_date,'PAYMENT',id,payment_number,0,base_currency_amount from public.payments where counterparty_type='CUSTOMER' and not is_reversal and status<>'VOIDED'
union all select organization_id,customer_id,refund_date,'REFUND',id,refund_number,base_currency_amount,0 from public.customer_refunds where status='POSTED';

create or replace view public.supplier_statement_transactions with(security_invoker=true) as
select organization_id,supplier_id,invoice_date transaction_date,'INVOICE'::text document_type,id document_id,invoice_number document_number,base_currency_total debit_base,0::numeric credit_base from public.supplier_invoices where status not in('DRAFT','VOID')
union all select organization_id,supplier_id,credit_date,'SUPPLIER_CREDIT',id,credit_number,0,base_currency_amount from public.supplier_credits where status='APPROVED'
union all select organization_id,supplier_id,payment_date,'PAYMENT',id,payment_number,0,base_currency_amount from public.payments where counterparty_type='SUPPLIER' and not is_reversal and status<>'VOIDED';

do $$declare t text;begin foreach t in array array['payment_number_counters','payment_accounts','payment_methods','payments','payment_allocations','customer_credit_allocations','supplier_credit_allocations','customer_refunds'] loop execute format('alter table public.%I enable row level security',t);execute format('alter table public.%I force row level security',t);execute format('revoke all on public.%I from anon,authenticated',t);execute format('grant select on public.%I to authenticated',t);end loop;end$$;

create policy payment_accounts_select on public.payment_accounts for select to authenticated using(public.has_permission(organization_id,'payments.accounts.view') and (branch_id is null or public.can_access_branch(organization_id,branch_id)));
create policy payment_methods_select on public.payment_methods for select to authenticated using(public.has_permission(organization_id,'payments.accounts.view') and (branch_id is null or public.can_access_branch(organization_id,branch_id)));
create policy payments_select on public.payments for select to authenticated using(public.can_access_branch(organization_id,branch_id) and public.has_permission(organization_id,case counterparty_type when 'CUSTOMER' then 'payments.customer.view' else 'payments.supplier.view' end));
create policy allocations_select on public.payment_allocations for select to authenticated using(exists(select 1 from public.payments p where p.organization_id=payment_allocations.organization_id and p.id=payment_allocations.payment_id));
create policy customer_credit_allocations_select on public.customer_credit_allocations for select to authenticated using(public.has_permission(organization_id,'receivables.payments.view'));
create policy supplier_credit_allocations_select on public.supplier_credit_allocations for select to authenticated using(public.has_permission(organization_id,'payables.payments.view'));
create policy refunds_select on public.customer_refunds for select to authenticated using(public.has_permission(organization_id,'payments.refund.view') and public.can_access_branch(organization_id,branch_id));

grant select on public.customer_invoice_settlement,public.supplier_invoice_settlement,public.customer_unapplied_credits,public.supplier_advances,public.operational_settlement_balances,public.customer_statement_transactions,public.supplier_statement_transactions to authenticated;
grant select on public.customer_receivables,public.supplier_payables to authenticated;

do $$declare f record;begin for f in select p.oid::regprocedure signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('next_payment_number','refresh_customer_invoice_settlement','refresh_supplier_invoice_settlement','post_shared_payment','post_customer_payment','post_supplier_payment','allocate_existing_payment','reverse_payment','post_customer_refund','finalize_approved_customer_refund','create_payment_account','update_payment_account','create_payment_method','sync_customer_credit_allocation') loop execute format('revoke all on function %s from public,anon,authenticated',f.signature); if f.proname in('post_customer_payment','post_supplier_payment','allocate_existing_payment','reverse_payment','post_customer_refund','finalize_approved_customer_refund','create_payment_account','update_payment_account','create_payment_method') then execute format('grant execute on function %s to authenticated',f.signature); end if; end loop;end$$;
