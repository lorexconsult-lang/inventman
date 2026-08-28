-- Phase 9: controlled finance API, immutable double-entry posting, RLS and reports.
insert into public.permissions(code,description) values
('finance.view','View finance dashboard'),('finance.settings.manage','Manage accounting configuration'),
('finance.accounts.view','View chart of accounts'),('finance.accounts.manage','Manage chart of accounts'),
('finance.journal.view','View journals'),('finance.journal.create','Create manual journals'),
('finance.journal.approve','Approve journals'),('finance.journal.post','Post journals'),('finance.journal.reverse','Reverse journals'),
('finance.expense.view','View expenses'),('finance.expense.create','Create expenses'),
('finance.expense.approve','Approve expenses'),('finance.expense.post','Post expenses'),
('finance.bank.view','View cash, bank and reconciliation'),('finance.bank.transfer','Transfer cash or bank funds'),
('finance.bank.reconcile','Reconcile bank statements'),('finance.reports.view','View financial reports'),
('finance.period.manage','Manage accounting periods')
on conflict(code) do update set description=excluded.description;

insert into public.role_permissions(organization_id,role_id,permission_id)
select r.organization_id,r.id,p.id from public.roles r cross join public.permissions p
where r.is_system and r.name in('Owner','Administrator') and p.code like 'finance.%' on conflict do nothing;

create table public.journal_number_counters(
 organization_id uuid not null references public.organizations(id) on delete cascade,
 fiscal_year integer not null, last_number bigint not null default 0,
 primary key(organization_id,fiscal_year)
);

create or replace function public.finance_account_balance(target_account_type text,target_debits numeric,target_credits numeric)
returns numeric language sql immutable set search_path='' as $$
 select case when target_account_type in('ASSET','EXPENSE') then target_debits-target_credits else target_credits-target_debits end
$$;

create or replace function public.finance_next_journal_number(target_organization_id uuid,target_date date)
returns text language plpgsql security definer set search_path='' as $$
declare n bigint;
begin
 insert into public.journal_number_counters(organization_id,fiscal_year,last_number)
 values(target_organization_id,extract(year from target_date)::integer,1)
 on conflict(organization_id,fiscal_year) do update set last_number=public.journal_number_counters.last_number+1
 returning last_number into n;
 return 'JRN-'||extract(year from target_date)::integer||'-'||lpad(n::text,6,'0');
end $$;

create or replace function public.finance_period_for_date(target_organization_id uuid,target_date date)
returns uuid language plpgsql security definer set search_path='' stable as $$
declare result uuid;
begin
 select id into result from public.accounting_periods
 where organization_id=target_organization_id and target_date between start_date and end_date and status in('OPEN','SOFT_CLOSED')
 order by start_date desc limit 1;
 if result is null then raise exception using errcode='P0001',message='PERIOD_CLOSED'; end if;
 return result;
end $$;

create or replace function public.finance_mapping(target_organization_id uuid,target_key text,target_branch_id uuid default null,target_payment_account_id uuid default null)
returns uuid language plpgsql security definer set search_path='' stable as $$
declare result uuid;
begin
 select m.gl_account_id into result from public.account_mappings m join public.gl_accounts a on a.organization_id=m.organization_id and a.id=m.gl_account_id
 where m.organization_id=target_organization_id and m.mapping_key=target_key and a.is_active
 and (m.branch_id is null or m.branch_id=target_branch_id)
 and (m.payment_account_id is null or m.payment_account_id=target_payment_account_id)
 order by (m.payment_account_id is not null)::integer desc,(m.branch_id is not null)::integer desc,m.priority desc limit 1;
 if result is null then raise exception using errcode='P0001',message='ACCOUNT_MAPPING_MISSING'; end if;
 return result;
end $$;

create or replace function public.finance_post_lines(
 target_organization_id uuid,target_date date,target_source_module text,target_source_type text,target_source_id uuid,
 target_description text,target_lines jsonb,target_posting_version integer default 1,target_created_by uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare existing uuid; result uuid:=gen_random_uuid(); period uuid; actor uuid:=coalesce(target_created_by,auth.uid()); line jsonb; line_no integer:=0; d numeric:=0; c numeric:=0; acct public.gl_accounts%rowtype; settings public.accounting_settings%rowtype;
begin
 select id into existing from public.journal_entries where organization_id=target_organization_id and source_module=target_source_module and source_type=target_source_type and source_id=target_source_id and posting_version=target_posting_version and status<>'VOID';
 if existing is not null then return existing; end if;
 select * into settings from public.accounting_settings where organization_id=target_organization_id and status='ACTIVE';
 if not found or settings.activation_date is null then raise exception using errcode='P0001',message='ACCOUNTING_NOT_ACTIVE'; end if;
 if target_date<settings.activation_date then raise exception using errcode='P0001',message='ACCOUNTING_NOT_ACTIVE'; end if;
 period:=public.finance_period_for_date(target_organization_id,target_date);
 if jsonb_typeof(target_lines)<>'array' or jsonb_array_length(target_lines)<2 then raise exception using errcode='P0001',message='JOURNAL_UNBALANCED'; end if;
 for line in select value from jsonb_array_elements(target_lines) loop
  d:=d+coalesce((line->>'debit')::numeric,0); c:=c+coalesce((line->>'credit')::numeric,0);
  select * into acct from public.gl_accounts where organization_id=target_organization_id and id=(line->>'account_id')::uuid and is_active;
  if not found then raise exception using errcode='P0001',message='ACCOUNT_INACTIVE'; end if;
 end loop;
 if round(d,4)<>round(c,4) or d<=0 then raise exception using errcode='P0001',message='JOURNAL_UNBALANCED'; end if;
 insert into public.journal_entries(id,organization_id,journal_number,journal_date,period_id,source_module,source_type,source_id,description,status,posting_version,created_by,posted_by,posted_at)
 values(result,target_organization_id,public.finance_next_journal_number(target_organization_id,target_date),target_date,period,target_source_module,target_source_type,target_source_id,trim(target_description),'POSTED',target_posting_version,actor,actor,now());
 for line in select value from jsonb_array_elements(target_lines) loop
  line_no:=line_no+1;
  insert into public.journal_lines(organization_id,journal_id,line_number,account_id,debit,credit,currency,exchange_rate_snapshot,base_debit,base_credit,branch_id,customer_id,supplier_id,product_id,description)
  values(target_organization_id,result,line_no,(line->>'account_id')::uuid,coalesce((line->>'debit')::numeric,0),coalesce((line->>'credit')::numeric,0),settings.base_currency,1,coalesce((line->>'debit')::numeric,0),coalesce((line->>'credit')::numeric,0),nullif(line->>'branch_id','')::uuid,nullif(line->>'customer_id','')::uuid,nullif(line->>'supplier_id','')::uuid,nullif(line->>'product_id','')::uuid,line->>'description');
 end loop;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data)
 values(target_organization_id,actor,'finance.journal.posted','journal_entry',result,jsonb_build_object('source_module',target_source_module,'source_type',target_source_type,'source_id',target_source_id,'debits',d));
 return result;
exception when unique_violation then
 select id into existing from public.journal_entries where organization_id=target_organization_id and source_module=target_source_module and source_type=target_source_type and source_id=target_source_id and posting_version=target_posting_version and status<>'VOID';
 if existing is not null then return existing; end if; raise;
end $$;

create or replace function public.finance_reject_posted_mutation() returns trigger language plpgsql set search_path='' as $$
begin
 if current_setting('app.finance_reversal',true)='on' and tg_table_name='journal_entries' and tg_op='UPDATE' and new.status='REVERSED' then return new; end if;
 raise exception using errcode='P0001',message='POSTED_JOURNAL_IMMUTABLE';
end $$;
create trigger journal_entries_immutable before update or delete on public.journal_entries for each row when(old.status in('POSTED','REVERSED')) execute function public.finance_reject_posted_mutation();
create trigger journal_lines_immutable before update or delete on public.journal_lines for each row execute function public.finance_reject_posted_mutation();

create or replace function public.create_manual_journal(target_organization_id uuid,target_date date,target_description text,target_lines jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); line jsonb; acct public.gl_accounts%rowtype;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.journal.post') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 for line in select value from jsonb_array_elements(target_lines) loop
  select * into acct from public.gl_accounts where organization_id=target_organization_id and id=(line->>'account_id')::uuid;
  if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
  if acct.control_type is not null or not acct.allow_manual_posting then raise exception using errcode='P0001',message='CONTROL_ACCOUNT_MANUAL_POST_BLOCKED'; end if;
 end loop;
 return public.finance_post_lines(target_organization_id,target_date,'FINANCE','MANUAL',gen_random_uuid(),target_description,target_lines,1,actor);
end $$;

create or replace function public.reverse_journal(target_organization_id uuid,target_journal_id uuid,target_date date,target_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); original public.journal_entries%rowtype; result uuid; lines jsonb;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.journal.reverse') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into original from public.journal_entries where organization_id=target_organization_id and id=target_journal_id and status='POSTED' for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if exists(select 1 from public.journal_entries where organization_id=target_organization_id and reversal_of_id=original.id) then raise exception using errcode='P0001',message='DUPLICATE_ACCOUNTING_EVENT'; end if;
 select jsonb_agg(jsonb_build_object('account_id',account_id,'debit',base_credit,'credit',base_debit,'branch_id',branch_id,'customer_id',customer_id,'supplier_id',supplier_id,'product_id',product_id,'description','Reversal: '||coalesce(description,original.description)) order by line_number) into lines from public.journal_lines where organization_id=target_organization_id and journal_id=original.id;
 result:=public.finance_post_lines(target_organization_id,target_date,'FINANCE','REVERSAL',original.id,'Reversal: '||trim(target_reason),lines,1,actor);
 perform set_config('app.finance_reversal','on',true);
 update public.journal_entries set status='REVERSED',reversal_reason=trim(target_reason) where id=original.id;
 update public.journal_entries set reversal_of_id=original.id,reversal_reason=trim(target_reason) where id=result;
 return result;
end $$;

create or replace function public.initialize_accounting(target_organization_id uuid,target_base_currency text,target_fiscal_month integer,target_activation_date date)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); y integer; start_date date; retained uuid; inventory uuid; cogs uuid; revenue uuid; ar uuid; ap uuid; output_tax uuid; input_tax uuid; opening_equity uuid;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.settings.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if target_activation_date is null then raise exception using errcode='P0001',message='ACCOUNTING_START_DATE_REQUIRED'; end if;
 insert into public.accounting_settings(organization_id,base_currency,fiscal_year_start_month,activation_date,status,updated_by)
 values(target_organization_id,upper(target_base_currency),target_fiscal_month,target_activation_date,'DRAFT',actor)
 on conflict(organization_id) do update set base_currency=excluded.base_currency,fiscal_year_start_month=excluded.fiscal_year_start_month,activation_date=excluded.activation_date,updated_by=actor,updated_at=now();
 insert into public.gl_accounts(organization_id,account_code,name,account_type,normal_balance,control_type,is_system,allow_manual_posting,created_by,description) values
 (target_organization_id,'1100','Cash and Bank','ASSET','DEBIT',null,false,true,actor,'Cash and bank accounts'),
 (target_organization_id,'1200','Accounts Receivable','ASSET','DEBIT','AR',true,false,actor,'Customer subledger control'),
 (target_organization_id,'1300','Inventory','ASSET','DEBIT','INVENTORY',true,false,actor,'Inventory ledger control'),
 (target_organization_id,'1400','Input Tax','ASSET','DEBIT','INPUT_TAX',true,false,actor,'Recoverable tax control'),
 (target_organization_id,'2100','Accounts Payable','LIABILITY','CREDIT','AP',true,false,actor,'Supplier subledger control'),
 (target_organization_id,'2200','Output Tax Payable','LIABILITY','CREDIT','OUTPUT_TAX',true,false,actor,'Output tax control'),
 (target_organization_id,'3100','Retained Earnings','EQUITY','CREDIT','RETAINED_EARNINGS',true,false,actor,'Retained earnings'),
 (target_organization_id,'3200','Opening Balance Equity','EQUITY','CREDIT',null,true,true,actor,'Controlled opening balance offset'),
 (target_organization_id,'4100','Product Sales','REVENUE','CREDIT',null,false,true,actor,'Product sales revenue'),
 (target_organization_id,'5100','Cost of Goods Sold','EXPENSE','DEBIT',null,false,true,actor,'Authoritative inventory cost'),
 (target_organization_id,'6100','Operating Expenses','EXPENSE','DEBIT',null,false,true,actor,'Operating expenses'),
 (target_organization_id,'6200','Bank Fees','EXPENSE','DEBIT',null,false,true,actor,'Cash and bank fees')
 on conflict(organization_id,account_code) do nothing;
 select id into ar from public.gl_accounts where organization_id=target_organization_id and account_code='1200'; select id into inventory from public.gl_accounts where organization_id=target_organization_id and account_code='1300'; select id into input_tax from public.gl_accounts where organization_id=target_organization_id and account_code='1400'; select id into ap from public.gl_accounts where organization_id=target_organization_id and account_code='2100'; select id into output_tax from public.gl_accounts where organization_id=target_organization_id and account_code='2200'; select id into retained from public.gl_accounts where organization_id=target_organization_id and account_code='3100'; select id into opening_equity from public.gl_accounts where organization_id=target_organization_id and account_code='3200'; select id into revenue from public.gl_accounts where organization_id=target_organization_id and account_code='4100'; select id into cogs from public.gl_accounts where organization_id=target_organization_id and account_code='5100';
 insert into public.account_mappings(organization_id,mapping_key,gl_account_id,created_by) values
 (target_organization_id,'CUSTOMER_AR',ar,actor),(target_organization_id,'INVENTORY_ASSET',inventory,actor),(target_organization_id,'INPUT_TAX',input_tax,actor),(target_organization_id,'SUPPLIER_AP',ap,actor),(target_organization_id,'OUTPUT_TAX',output_tax,actor),(target_organization_id,'SALE_REVENUE',revenue,actor),(target_organization_id,'SALE_COGS',cogs,actor),(target_organization_id,'OPENING_EQUITY',opening_equity,actor)
 on conflict do nothing;
 update public.accounting_settings set retained_earnings_account_id=retained where organization_id=target_organization_id;
 y:=extract(year from target_activation_date)::integer;
 for i in 0..23 loop start_date:=(date_trunc('month',target_activation_date)+(i||' months')::interval)::date; insert into public.accounting_periods(organization_id,name,start_date,end_date) values(target_organization_id,to_char(start_date,'Mon YYYY'),start_date,(start_date+interval '1 month-1 day')::date) on conflict do nothing; end loop;
 update public.accounting_settings s set current_period_id=(select p.id from public.accounting_periods p where p.organization_id=target_organization_id and target_activation_date between p.start_date and p.end_date) where organization_id=target_organization_id;
 return jsonb_build_object('accounts',12,'activation_date',target_activation_date);
end $$;

create or replace function public.map_payment_account(target_organization_id uuid,target_payment_account_id uuid,target_gl_account_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); pa public.payment_accounts%rowtype; ga public.gl_accounts%rowtype; key text;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.settings.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into pa from public.payment_accounts where organization_id=target_organization_id and id=target_payment_account_id;
 select * into ga from public.gl_accounts where organization_id=target_organization_id and id=target_gl_account_id and account_type='ASSET' and is_active;
 if pa.id is null or ga.id is null then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 key:=case when pa.account_type='CARD_CLEARING' then 'CARD_PAYMENT' else 'CASH_PAYMENT' end;
 delete from public.account_mappings where organization_id=target_organization_id and mapping_key=key and payment_account_id=target_payment_account_id and branch_id is null and product_category_id is null;
 insert into public.account_mappings(organization_id,mapping_key,gl_account_id,payment_account_id,created_by) values(target_organization_id,key,ga.id,pa.id,actor);
end $$;

create or replace function public.activate_accounting(target_organization_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); missing integer;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.settings.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select count(*) into missing from (values('CUSTOMER_AR'),('SUPPLIER_AP'),('INVENTORY_ASSET'),('SALE_REVENUE'),('SALE_COGS'),('OUTPUT_TAX')) required(key) where not exists(select 1 from public.account_mappings m where m.organization_id=target_organization_id and m.mapping_key=required.key);
 if missing>0 or exists(select 1 from public.payment_accounts p where p.organization_id=target_organization_id and p.status='ACTIVE' and not exists(select 1 from public.account_mappings m where m.organization_id=p.organization_id and m.payment_account_id=p.id)) then raise exception using errcode='P0001',message='ACCOUNT_MAPPING_MISSING'; end if;
 update public.accounting_settings set status='ACTIVE',updated_by=actor,updated_at=now() where organization_id=target_organization_id and activation_date is not null;
 if not found then raise exception using errcode='P0001',message='ACCOUNTING_SETUP_INCOMPLETE'; end if;
end $$;

create or replace view public.general_ledger with(security_invoker=true) as
select l.organization_id,l.account_id,a.account_code,a.name account_name,a.account_type,e.id journal_id,e.journal_number,e.journal_date,e.period_id,e.source_module,e.source_type,e.source_id,e.description journal_description,l.line_number,l.branch_id,l.customer_id,l.supplier_id,l.product_id,l.base_debit,l.base_credit,l.description,
 sum(public.finance_account_balance(a.account_type,l.base_debit,l.base_credit)) over(partition by l.organization_id,l.account_id order by e.journal_date,e.journal_number,l.line_number) running_balance
from public.journal_lines l join public.journal_entries e on e.organization_id=l.organization_id and e.id=l.journal_id join public.gl_accounts a on a.organization_id=l.organization_id and a.id=l.account_id where e.status in('POSTED','REVERSED');

create or replace view public.trial_balance with(security_invoker=true) as
select a.organization_id,a.id account_id,a.account_code,a.name,a.account_type,
 greatest(coalesce(sum(l.base_debit),0)-coalesce(sum(l.base_credit),0),0) debit_balance,
 greatest(coalesce(sum(l.base_credit),0)-coalesce(sum(l.base_debit),0),0) credit_balance
from public.gl_accounts a left join public.journal_lines l on l.organization_id=a.organization_id and l.account_id=a.id left join public.journal_entries e on e.organization_id=l.organization_id and e.id=l.journal_id and e.status in('POSTED','REVERSED') group by a.organization_id,a.id,a.account_code,a.name,a.account_type;

create or replace view public.financial_statement_balances with(security_invoker=true) as
select a.organization_id,a.account_type,a.account_code,a.name,public.finance_account_balance(a.account_type,coalesce(sum(l.base_debit),0),coalesce(sum(l.base_credit),0)) balance
from public.gl_accounts a left join public.journal_lines l on l.organization_id=a.organization_id and l.account_id=a.id left join public.journal_entries e on e.organization_id=l.organization_id and e.id=l.journal_id and e.status in('POSTED','REVERSED') group by a.organization_id,a.id,a.account_type,a.account_code,a.name;

create or replace view public.finance_reconciliation with(security_invoker=true) as
select s.organization_id,'AR'::text reconciliation_type,coalesce((select sum(outstanding_base) from public.customer_receivables r where r.organization_id=s.organization_id),0) subledger_balance,coalesce((select sum(balance) from public.financial_statement_balances f join public.gl_accounts a on a.organization_id=f.organization_id and a.account_code=f.account_code where f.organization_id=s.organization_id and a.control_type='AR'),0) gl_balance
from public.accounting_settings s union all
select s.organization_id,'AP',coalesce((select sum(outstanding_base) from public.supplier_payables r where r.organization_id=s.organization_id),0),coalesce((select sum(balance) from public.financial_statement_balances f join public.gl_accounts a on a.organization_id=f.organization_id and a.account_code=f.account_code where f.organization_id=s.organization_id and a.control_type='AP'),0) from public.accounting_settings s union all
select s.organization_id,'INVENTORY',coalesce((select sum(valuation_total) from public.inventory_movements m where m.organization_id=s.organization_id),0),coalesce((select sum(balance) from public.financial_statement_balances f join public.gl_accounts a on a.organization_id=f.organization_id and a.account_code=f.account_code where f.organization_id=s.organization_id and a.control_type='INVENTORY'),0) from public.accounting_settings s;

do $$declare t text;begin foreach t in array array['journal_number_counters','accounting_settings','gl_accounts','accounting_periods','account_mappings','accounting_events','journal_entries','journal_lines','expenses','expense_documents','bank_transfers','bank_statement_imports','bank_statement_lines'] loop execute format('alter table public.%I enable row level security',t); execute format('alter table public.%I force row level security',t); execute format('revoke all on public.%I from anon,authenticated',t); execute format('grant select on public.%I to authenticated',t); end loop;end$$;
create policy accounting_settings_select on public.accounting_settings for select to authenticated using(public.has_permission(organization_id,'finance.view'));
create policy gl_accounts_select on public.gl_accounts for select to authenticated using(public.has_permission(organization_id,'finance.accounts.view'));
create policy accounting_periods_select on public.accounting_periods for select to authenticated using(public.has_permission(organization_id,'finance.view'));
create policy account_mappings_select on public.account_mappings for select to authenticated using(public.has_permission(organization_id,'finance.settings.manage'));
create policy accounting_events_select on public.accounting_events for select to authenticated using(public.has_permission(organization_id,'finance.journal.view'));
create policy journal_entries_select on public.journal_entries for select to authenticated using(public.has_permission(organization_id,'finance.journal.view'));
create policy journal_lines_select on public.journal_lines for select to authenticated using(public.has_permission(organization_id,'finance.journal.view') and (branch_id is null or public.can_access_branch(organization_id,branch_id)));
create policy expenses_select on public.expenses for select to authenticated using(public.has_permission(organization_id,'finance.expense.view') and public.can_access_branch(organization_id,branch_id));
create policy expense_documents_select on public.expense_documents for select to authenticated using(exists(select 1 from public.expenses e where e.organization_id=expense_documents.organization_id and e.id=expense_documents.expense_id));
create policy bank_transfers_select on public.bank_transfers for select to authenticated using(public.has_permission(organization_id,'finance.bank.view') and (branch_id is null or public.can_access_branch(organization_id,branch_id)));
create policy bank_imports_select on public.bank_statement_imports for select to authenticated using(public.has_permission(organization_id,'finance.bank.view'));
create policy bank_lines_select on public.bank_statement_lines for select to authenticated using(public.has_permission(organization_id,'finance.bank.view'));
grant select on public.general_ledger,public.trial_balance,public.financial_statement_balances,public.finance_reconciliation to authenticated;
grant execute on function public.initialize_accounting(uuid,text,integer,date),public.map_payment_account(uuid,uuid,uuid),public.activate_accounting(uuid),public.create_manual_journal(uuid,date,text,jsonb),public.reverse_journal(uuid,uuid,date,text) to authenticated;
revoke all on function public.finance_post_lines(uuid,date,text,text,uuid,text,jsonb,integer,uuid),public.finance_next_journal_number(uuid,date),public.finance_period_for_date(uuid,date),public.finance_mapping(uuid,text,uuid,uuid) from public,anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('finance-documents','finance-documents',false,10485760,array['application/pdf','image/jpeg','image/png','text/csv']) on conflict(id) do update set public=false;
create policy finance_documents_read on storage.objects for select to authenticated using(bucket_id='finance-documents' and public.has_permission((storage.foldername(name))[1]::uuid,'finance.expense.view'));
create policy finance_documents_insert on storage.objects for insert to authenticated with check(bucket_id='finance-documents' and public.has_permission((storage.foldername(name))[1]::uuid,'finance.expense.create'));
