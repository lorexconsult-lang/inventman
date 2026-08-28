-- Phase 9: deterministic operational posting adapters and finance workflows.
create or replace function public.finance_record_event(target_organization_id uuid,target_module text,target_type text,target_source_id uuid,target_date date,target_payload jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare event_id uuid; journal uuid;
begin
 if not exists(select 1 from public.accounting_settings where organization_id=target_organization_id and status='ACTIVE' and activation_date<=target_date) then return null; end if;
 insert into public.accounting_events(organization_id,source_module,source_type,source_id,event_date,payload)
 values(target_organization_id,target_module,target_type,target_source_id,target_date,target_payload)
 on conflict(organization_id,source_module,source_type,source_id,posting_version) do update set attempts=public.accounting_events.attempts+1
 returning id,journal_id into event_id,journal;
 if journal is not null then return journal; end if;
 begin
  journal:=public.finance_process_event(event_id);
 exception when others then
  update public.accounting_events set status='FAILED',error_code=sqlerrm,attempts=attempts+1,processed_at=now() where id=event_id;
  raise;
 end;
 return journal;
end $$;

create or replace function public.finance_process_event(target_event_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare ev public.accounting_events%rowtype; lines jsonb; journal uuid; cash uuid; ar uuid; ap uuid; inventory uuid; revenue uuid; cogs uuid; input_tax uuid; output_tax uuid; amount numeric; tax numeric; item public.payments%rowtype;
begin
 select * into ev from public.accounting_events where id=target_event_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if ev.journal_id is not null then return ev.journal_id; end if;
 if ev.source_type='CUSTOMER_INVOICE' then
  ar:=public.finance_mapping(ev.organization_id,'CUSTOMER_AR',(ev.payload->>'branch_id')::uuid,null);
  revenue:=public.finance_mapping(ev.organization_id,'SALE_REVENUE',(ev.payload->>'branch_id')::uuid,null);
  output_tax:=public.finance_mapping(ev.organization_id,'OUTPUT_TAX',(ev.payload->>'branch_id')::uuid,null);
  amount:=(ev.payload->>'amount')::numeric; tax:=coalesce((ev.payload->>'tax')::numeric,0);
  lines:=jsonb_build_array(
   jsonb_build_object('account_id',ar,'debit',amount,'branch_id',ev.payload->>'branch_id','customer_id',ev.payload->>'customer_id','description','Customer invoice'),
   jsonb_build_object('account_id',revenue,'credit',amount-tax,'branch_id',ev.payload->>'branch_id','customer_id',ev.payload->>'customer_id','description','Sales revenue'));
  if tax>0 then lines:=lines||jsonb_build_array(jsonb_build_object('account_id',output_tax,'credit',tax,'branch_id',ev.payload->>'branch_id','customer_id',ev.payload->>'customer_id','description','Output tax')); end if;
 elsif ev.source_type='SALES_COGS' then
  cogs:=public.finance_mapping(ev.organization_id,'SALE_COGS',(ev.payload->>'branch_id')::uuid,null); inventory:=public.finance_mapping(ev.organization_id,'INVENTORY_ASSET',(ev.payload->>'branch_id')::uuid,null); amount:=(ev.payload->>'amount')::numeric;
  if amount=0 then update public.accounting_events set status='NOT_REQUIRED',processed_at=now() where id=ev.id; return null; end if;
  lines:=jsonb_build_array(jsonb_build_object('account_id',cogs,'debit',amount,'branch_id',ev.payload->>'branch_id','customer_id',ev.payload->>'customer_id','description','Authoritative fulfilment cost'),jsonb_build_object('account_id',inventory,'credit',amount,'branch_id',ev.payload->>'branch_id','customer_id',ev.payload->>'customer_id','description','Inventory relieved'));
 elsif ev.source_type='SUPPLIER_INVOICE' then
  inventory:=public.finance_mapping(ev.organization_id,'INVENTORY_ASSET',null,null); ap:=public.finance_mapping(ev.organization_id,'SUPPLIER_AP',null,null); input_tax:=public.finance_mapping(ev.organization_id,'INPUT_TAX',null,null); amount:=(ev.payload->>'amount')::numeric; tax:=coalesce((ev.payload->>'tax')::numeric,0);
  lines:=jsonb_build_array(jsonb_build_object('account_id',inventory,'debit',amount-tax,'supplier_id',ev.payload->>'supplier_id','description','Inventory acquisition'),jsonb_build_object('account_id',ap,'credit',amount,'supplier_id',ev.payload->>'supplier_id','description','Supplier payable'));
  if tax>0 then lines:=lines||jsonb_build_array(jsonb_build_object('account_id',input_tax,'debit',tax,'supplier_id',ev.payload->>'supplier_id','description','Input tax')); end if;
 elsif ev.source_type='PAYMENT' then
  select * into item from public.payments where organization_id=ev.organization_id and id=ev.source_id;
  if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
  cash:=public.finance_mapping(ev.organization_id,case when (select account_type from public.payment_accounts where organization_id=item.organization_id and id=item.settlement_account_id)='CARD_CLEARING' then 'CARD_PAYMENT' else 'CASH_PAYMENT' end,item.branch_id,item.settlement_account_id);
  amount:=item.base_currency_amount;
  if item.counterparty_type='CUSTOMER' then
   ar:=public.finance_mapping(ev.organization_id,'CUSTOMER_AR',item.branch_id,null);
   lines:=case when item.is_reversal then jsonb_build_array(jsonb_build_object('account_id',ar,'debit',amount,'branch_id',item.branch_id,'customer_id',item.customer_id,'description','Customer payment reversal'),jsonb_build_object('account_id',cash,'credit',amount,'branch_id',item.branch_id,'customer_id',item.customer_id,'description','Cash reversal')) else jsonb_build_array(jsonb_build_object('account_id',cash,'debit',amount,'branch_id',item.branch_id,'customer_id',item.customer_id,'description','Customer receipt'),jsonb_build_object('account_id',ar,'credit',amount,'branch_id',item.branch_id,'customer_id',item.customer_id,'description','Receivable settled')) end;
  else
   ap:=public.finance_mapping(ev.organization_id,'SUPPLIER_AP',item.branch_id,null);
   lines:=case when item.is_reversal then jsonb_build_array(jsonb_build_object('account_id',cash,'debit',amount,'branch_id',item.branch_id,'supplier_id',item.supplier_id,'description','Supplier payment reversal'),jsonb_build_object('account_id',ap,'credit',amount,'branch_id',item.branch_id,'supplier_id',item.supplier_id,'description','Payable reinstated')) else jsonb_build_array(jsonb_build_object('account_id',ap,'debit',amount,'branch_id',item.branch_id,'supplier_id',item.supplier_id,'description','Supplier payable settled'),jsonb_build_object('account_id',cash,'credit',amount,'branch_id',item.branch_id,'supplier_id',item.supplier_id,'description','Supplier payment')) end;
  end if;
 else raise exception using errcode='P0001',message='ACCOUNTING_EVENT_UNSUPPORTED'; end if;
 journal:=public.finance_post_lines(ev.organization_id,ev.event_date,ev.source_module,ev.source_type,ev.source_id,coalesce(ev.payload->>'description',ev.source_type),lines,ev.posting_version,null);
 update public.accounting_events set status='POSTED',journal_id=journal,attempts=attempts+1,processed_at=now(),error_code=null where id=ev.id;
 return journal;
end $$;

create or replace function public.finance_customer_invoice_adapter() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status in('ISSUED','PARTIALLY_PAID','PAID','OVERDUE','DISPUTED','CREDITED') and (tg_op='INSERT' or old.status='DRAFT') then
  perform public.finance_record_event(new.organization_id,'SALES','CUSTOMER_INVOICE',new.id,new.invoice_date,jsonb_build_object('amount',new.base_currency_total,'tax',round(new.tax*new.exchange_rate,4),'branch_id',new.branch_id,'customer_id',new.customer_id,'description','Invoice '||new.invoice_number));
 end if; return new;
end $$;
create trigger finance_customer_invoice after insert or update of status on public.customer_invoices for each row execute function public.finance_customer_invoice_adapter();

create or replace function public.finance_sales_cogs_adapter() returns trigger language plpgsql security definer set search_path='' as $$
declare cost numeric;
begin
 if new.status='POSTED' and (tg_op='INSERT' or old.status<>'POSTED') then
  select coalesce(sum(inventory_cost_base),0) into cost from public.sales_fulfillment_lines where organization_id=new.organization_id and fulfilment_id=new.id;
  perform public.finance_record_event(new.organization_id,'SALES','SALES_COGS',new.id,new.fulfilled_at::date,jsonb_build_object('amount',cost,'branch_id',new.branch_id,'customer_id',new.customer_id,'description','COGS '||new.fulfilment_number));
 end if; return new;
end $$;
create trigger finance_sales_cogs after insert or update of status on public.sales_fulfillments for each row execute function public.finance_sales_cogs_adapter();

create or replace function public.finance_supplier_invoice_adapter() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status in('APPROVED','PARTIALLY_PAID','PAID') and (tg_op='INSERT' or old.status in('DRAFT','REVIEW')) then
  perform public.finance_record_event(new.organization_id,'PROCUREMENT','SUPPLIER_INVOICE',new.id,new.invoice_date,jsonb_build_object('amount',new.base_currency_total,'tax',round(new.tax*new.exchange_rate,4),'supplier_id',new.supplier_id,'description','Supplier invoice '||new.invoice_number));
 end if; return new;
end $$;
create trigger finance_supplier_invoice after insert or update of status on public.supplier_invoices for each row execute function public.finance_supplier_invoice_adapter();

create or replace function public.finance_payment_adapter() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform public.finance_record_event(new.organization_id,'PAYMENTS','PAYMENT',new.id,new.payment_date,jsonb_build_object('description',case when new.is_reversal then 'Payment reversal ' else 'Payment ' end||new.payment_number)); return new;
end $$;
create trigger finance_payment after insert on public.payments for each row execute function public.finance_payment_adapter();

create or replace function public.create_expense(target_organization_id uuid,target_branch_id uuid,target_date date,target_payee text,target_expense_account_id uuid,target_amount numeric,target_tax numeric,target_currency text,target_payment_account_id uuid,target_payment_terms text,target_reference text,target_description text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result uuid:=gen_random_uuid(); number text;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.expense.create') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if not public.can_access_branch(target_organization_id,target_branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 if not exists(select 1 from public.gl_accounts where organization_id=target_organization_id and id=target_expense_account_id and account_type='EXPENSE' and is_active) then raise exception using errcode='P0001',message='ACCOUNT_INACTIVE'; end if;
 if target_payment_terms='PAID' and not exists(select 1 from public.payment_accounts where organization_id=target_organization_id and id=target_payment_account_id and status='ACTIVE') then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 number:='EXP-'||to_char(target_date,'YYYYMM')||'-'||upper(substr(replace(result::text,'-',''),1,8));
 insert into public.expenses(id,organization_id,branch_id,expense_number,expense_date,payee,expense_account_id,amount,tax_amount,currency,payment_account_id,payment_terms,reference,description,status,created_by)
 values(result,target_organization_id,target_branch_id,number,target_date,trim(target_payee),target_expense_account_id,target_amount,target_tax,upper(target_currency),target_payment_account_id,target_payment_terms,nullif(trim(target_reference),''),trim(target_description),'DRAFT',actor); return result;
end $$;

create or replace function public.submit_expense(target_organization_id uuid,target_expense_id uuid)
returns text language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); e public.expenses%rowtype; policy public.approval_policies%rowtype; request_id uuid;
begin
 select * into e from public.expenses where organization_id=target_organization_id and id=target_expense_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if actor<>e.created_by or not public.has_permission(target_organization_id,'finance.expense.create') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if e.status<>'DRAFT' then raise exception using errcode='P0001',message='EXPENSE_STATE_INVALID'; end if;
 select * into policy from public.approval_policies where organization_id=target_organization_id and document_type='EXPENSE' and is_active and (branch_id is null or branch_id=e.branch_id) and minimum_amount<=e.amount*e.exchange_rate_snapshot order by minimum_amount desc limit 1;
 if found then
  request_id:=gen_random_uuid(); insert into public.approval_requests(id,organization_id,policy_id,document_type,document_id,branch_id,amount,currency,requester_id,document_hash) values(request_id,target_organization_id,policy.id,'EXPENSE',e.id,e.branch_id,e.amount*e.exchange_rate_snapshot,e.currency,actor,md5(e.id::text||e.amount::text||e.description));
  update public.expenses set status='PENDING_APPROVAL',approval_request_id=request_id,submitted_by=actor,updated_at=now() where id=e.id; return 'PENDING_APPROVAL';
 end if;
 update public.expenses set status='APPROVED',submitted_by=actor,approved_by=actor,updated_at=now() where id=e.id; return 'APPROVED';
end $$;

create or replace function public.approve_expense(target_organization_id uuid,target_expense_id uuid,target_approve boolean,target_comments text)
returns text language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); e public.expenses%rowtype;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.expense.approve') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into e from public.expenses where organization_id=target_organization_id and id=target_expense_id and status='PENDING_APPROVAL' for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 insert into public.approval_actions(organization_id,approval_request_id,step_order,actor_id,action,comments) values(target_organization_id,e.approval_request_id,1,actor,case when target_approve then 'APPROVE' else 'REJECT' end,nullif(trim(target_comments),''));
 update public.approval_requests set status=case when target_approve then 'APPROVED' else 'REJECTED' end,finalized_at=now() where id=e.approval_request_id;
 update public.expenses set status=case when target_approve then 'APPROVED' else 'REJECTED' end,approved_by=case when target_approve then actor end,updated_at=now() where id=e.id; return case when target_approve then 'APPROVED' else 'REJECTED' end;
end $$;

create or replace function public.post_expense(target_organization_id uuid,target_expense_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); e public.expenses%rowtype; credit uuid; input_tax uuid; lines jsonb; journal uuid; base_amount numeric; base_tax numeric;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.expense.post') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into e from public.expenses where organization_id=target_organization_id and id=target_expense_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if e.status='POSTED' then return e.journal_id; end if; if e.status<>'APPROVED' then raise exception using errcode='P0001',message='EXPENSE_APPROVAL_REQUIRED'; end if;
 base_amount:=round(e.amount*e.exchange_rate_snapshot,4); base_tax:=round(e.tax_amount*e.exchange_rate_snapshot,4);
 credit:=case when e.payment_terms='CREDIT' then public.finance_mapping(target_organization_id,'SUPPLIER_AP',e.branch_id,null) else public.finance_mapping(target_organization_id,case when (select account_type from public.payment_accounts where organization_id=e.organization_id and id=e.payment_account_id)='CARD_CLEARING' then 'CARD_PAYMENT' else 'CASH_PAYMENT' end,e.branch_id,e.payment_account_id) end;
 lines:=jsonb_build_array(jsonb_build_object('account_id',e.expense_account_id,'debit',base_amount,'branch_id',e.branch_id,'description',e.description),jsonb_build_object('account_id',credit,'credit',base_amount+base_tax,'branch_id',e.branch_id,'description','Expense settlement'));
 if base_tax>0 then input_tax:=public.finance_mapping(target_organization_id,'INPUT_TAX',e.branch_id,null); lines:=lines||jsonb_build_array(jsonb_build_object('account_id',input_tax,'debit',base_tax,'branch_id',e.branch_id,'description','Expense input tax')); end if;
 journal:=public.finance_post_lines(target_organization_id,e.expense_date,'EXPENSES','EXPENSE',e.id,e.description,lines,1,actor);
 update public.expenses set status='POSTED',journal_id=journal,posted_at=now(),updated_at=now() where id=e.id; return journal;
end $$;

create or replace function public.post_bank_transfer(target_organization_id uuid,target_branch_id uuid,target_date date,target_source_account_id uuid,target_destination_account_id uuid,target_amount numeric,target_currency text,target_fee numeric,target_reference text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result uuid:=gen_random_uuid(); source_gl uuid; destination_gl uuid; fee_gl uuid; lines jsonb; journal uuid;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.bank.transfer') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if target_branch_id is not null and not public.can_access_branch(target_organization_id,target_branch_id) then raise exception using errcode='42501',message='UNAUTHORIZED_BRANCH'; end if;
 if target_source_account_id=target_destination_account_id or target_amount<=0 or target_fee<0 then raise exception using errcode='22023',message='BANK_TRANSFER_INVALID'; end if;
 source_gl:=public.finance_mapping(target_organization_id,case when (select account_type from public.payment_accounts where organization_id=target_organization_id and id=target_source_account_id)='CARD_CLEARING' then 'CARD_PAYMENT' else 'CASH_PAYMENT' end,target_branch_id,target_source_account_id);
 destination_gl:=public.finance_mapping(target_organization_id,case when (select account_type from public.payment_accounts where organization_id=target_organization_id and id=target_destination_account_id)='CARD_CLEARING' then 'CARD_PAYMENT' else 'CASH_PAYMENT' end,target_branch_id,target_destination_account_id);
 lines:=jsonb_build_array(jsonb_build_object('account_id',destination_gl,'debit',target_amount,'branch_id',target_branch_id,'description','Transfer received'),jsonb_build_object('account_id',source_gl,'credit',target_amount+target_fee,'branch_id',target_branch_id,'description','Transfer sent'));
 if target_fee>0 then fee_gl:=public.finance_mapping(target_organization_id,'BANK_FEES',target_branch_id,null); lines:=lines||jsonb_build_array(jsonb_build_object('account_id',fee_gl,'debit',target_fee,'branch_id',target_branch_id,'description','Transfer fee')); end if;
 insert into public.bank_transfers(id,organization_id,branch_id,transfer_number,transfer_date,source_payment_account_id,destination_payment_account_id,amount,currency,fee_amount,reference,status,created_by,posted_at)
 values(result,target_organization_id,target_branch_id,'TRF-'||upper(substr(replace(result::text,'-',''),1,10)),target_date,target_source_account_id,target_destination_account_id,target_amount,upper(target_currency),target_fee,nullif(trim(target_reference),''),'DRAFT',actor,now());
 journal:=public.finance_post_lines(target_organization_id,target_date,'FINANCE','BANK_TRANSFER',result,'Cash and bank transfer',lines,1,actor);
 update public.bank_transfers set status='POSTED',journal_id=journal where id=result; return result;
end $$;

create or replace function public.set_accounting_period_status(target_organization_id uuid,target_period_id uuid,target_status text)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); p public.accounting_periods%rowtype;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.period.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into p from public.accounting_periods where organization_id=target_organization_id and id=target_period_id for update; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if target_status not in('OPEN','SOFT_CLOSED','CLOSED','LOCKED') or p.status='LOCKED' and target_status<>'LOCKED' then raise exception using errcode='P0001',message='PERIOD_LOCKED'; end if;
 if target_status in('CLOSED','LOCKED') and exists(select 1 from public.journal_entries where organization_id=target_organization_id and period_id=p.id and status in('DRAFT','PENDING_APPROVAL')) then raise exception using errcode='P0001',message='PERIOD_UNRESOLVED_DRAFTS'; end if;
 update public.accounting_periods set status=target_status,closed_by=case when target_status in('CLOSED','LOCKED') then actor end,closed_at=case when target_status in('CLOSED','LOCKED') then now() end where id=p.id;
end $$;

grant execute on function public.create_expense(uuid,uuid,date,text,uuid,numeric,numeric,text,uuid,text,text,text),public.submit_expense(uuid,uuid),public.approve_expense(uuid,uuid,boolean,text),public.post_expense(uuid,uuid),public.post_bank_transfer(uuid,uuid,date,uuid,uuid,numeric,text,numeric,text),public.set_accounting_period_status(uuid,uuid,text) to authenticated;
revoke all on function public.finance_record_event(uuid,text,text,uuid,date,jsonb),public.finance_process_event(uuid),public.finance_customer_invoice_adapter(),public.finance_sales_cogs_adapter(),public.finance_supplier_invoice_adapter(),public.finance_payment_adapter() from public,anon,authenticated;
