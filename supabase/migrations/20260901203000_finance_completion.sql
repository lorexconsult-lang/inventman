-- Phase 9 completion: account maintenance, openings, returns/refunds and bank reconciliation.
create or replace function public.create_gl_account(target_organization_id uuid,target_code text,target_name text,target_type text,target_parent_id uuid,target_currency text,target_description text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result uuid:=gen_random_uuid(); parent public.gl_accounts%rowtype;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.accounts.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if target_type not in('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE') then raise exception using errcode='22023',message='ACCOUNT_TYPE_INVALID'; end if;
 if target_parent_id is not null then select * into parent from public.gl_accounts where organization_id=target_organization_id and id=target_parent_id; if not found or parent.account_type<>target_type then raise exception using errcode='P0001',message='ACCOUNT_HIERARCHY_INVALID'; end if; end if;
 insert into public.gl_accounts(id,organization_id,account_code,name,account_type,parent_account_id,normal_balance,currency_restriction,description,created_by)
 values(result,target_organization_id,upper(trim(target_code)),trim(target_name),target_type,target_parent_id,case when target_type in('ASSET','EXPENSE') then 'DEBIT' else 'CREDIT' end,nullif(upper(trim(target_currency)),''),nullif(trim(target_description),''),actor); return result;
end $$;

create or replace function public.set_gl_account_status(target_organization_id uuid,target_account_id uuid,target_active boolean)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); a public.gl_accounts%rowtype;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.accounts.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into a from public.gl_accounts where organization_id=target_organization_id and id=target_account_id for update; if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if a.is_system and not target_active then raise exception using errcode='P0001',message='CONTROL_ACCOUNT_PROTECTED'; end if;
 if not target_active and exists(select 1 from public.account_mappings where organization_id=target_organization_id and gl_account_id=a.id) then raise exception using errcode='P0001',message='ACCOUNT_MAPPING_IN_USE'; end if;
 update public.gl_accounts set is_active=target_active,updated_at=now() where id=a.id;
end $$;

create or replace function public.post_opening_balances(target_organization_id uuid,target_date date,target_lines jsonb,target_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); settings public.accounting_settings%rowtype; offset_account uuid; lines jsonb:=target_lines; item jsonb; d numeric:=0; c numeric:=0;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.settings.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into settings from public.accounting_settings where organization_id=target_organization_id; if not found or settings.activation_date<>target_date or settings.status<>'DRAFT' then raise exception using errcode='P0001',message='OPENING_BALANCE_DATE_INVALID'; end if;
 if exists(select 1 from public.journal_entries where organization_id=target_organization_id and source_type='OPENING_BALANCE') then raise exception using errcode='P0001',message='DUPLICATE_ACCOUNTING_EVENT'; end if;
 for item in select value from jsonb_array_elements(lines) loop d:=d+coalesce((item->>'debit')::numeric,0); c:=c+coalesce((item->>'credit')::numeric,0); end loop;
 offset_account:=public.finance_mapping(target_organization_id,'OPENING_EQUITY',null,null);
 if d>c then lines:=lines||jsonb_build_array(jsonb_build_object('account_id',offset_account,'credit',d-c,'description','Opening balance equity')); elsif c>d then lines:=lines||jsonb_build_array(jsonb_build_object('account_id',offset_account,'debit',c-d,'description','Opening balance equity')); end if;
 update public.accounting_settings set status='ACTIVE' where organization_id=target_organization_id;
 return public.finance_post_lines(target_organization_id,target_date,'FINANCE','OPENING_BALANCE',target_organization_id,'Opening balances: '||trim(target_reason),lines,1,actor);
exception when others then update public.accounting_settings set status='DRAFT' where organization_id=target_organization_id; raise;
end $$;

create or replace function public.finance_credit_note_adapter() returns trigger language plpgsql security definer set search_path='' as $$
declare ar uuid; revenue uuid; output_tax uuid; amount numeric; tax numeric; lines jsonb; journal uuid;
begin
 if new.status='ISSUED' and (tg_op='INSERT' or old.status<>'ISSUED') and exists(select 1 from public.accounting_settings where organization_id=new.organization_id and status='ACTIVE' and activation_date<=new.credit_date) then
  ar:=public.finance_mapping(new.organization_id,'CUSTOMER_AR',new.branch_id,null); revenue:=public.finance_mapping(new.organization_id,'SALE_REVENUE',new.branch_id,null); output_tax:=public.finance_mapping(new.organization_id,'OUTPUT_TAX',new.branch_id,null); amount:=new.base_currency_total; tax:=round(new.tax*new.exchange_rate,4);
  lines:=jsonb_build_array(jsonb_build_object('account_id',revenue,'debit',amount-tax,'branch_id',new.branch_id,'customer_id',new.customer_id,'description','Sales return'),jsonb_build_object('account_id',ar,'credit',amount,'branch_id',new.branch_id,'customer_id',new.customer_id,'description','Customer credit'));
  if tax>0 then lines:=lines||jsonb_build_array(jsonb_build_object('account_id',output_tax,'debit',tax,'branch_id',new.branch_id,'customer_id',new.customer_id,'description','Output tax reversal')); end if;
  perform public.finance_post_lines(new.organization_id,new.credit_date,'SALES','CREDIT_NOTE',new.id,'Credit note '||new.credit_note_number,lines,1,new.issued_by);
 end if; return new;
end $$;
create trigger finance_credit_note after insert or update of status on public.customer_credit_notes for each row execute function public.finance_credit_note_adapter();

create or replace function public.finance_sales_return_adapter() returns trigger language plpgsql security definer set search_path='' as $$
declare amount numeric; inventory uuid; cogs uuid;
begin
 if new.status='POSTED' and (tg_op='INSERT' or old.status<>'POSTED') then
  select coalesce(sum(quantity_base*unit_cost_base),0) into amount from public.sales_return_cost_allocations where organization_id=new.organization_id and sales_return_line_id in(select id from public.sales_return_lines where organization_id=new.organization_id and sales_return_id=new.id);
  if amount>0 then inventory:=public.finance_mapping(new.organization_id,'INVENTORY_ASSET',new.branch_id,null); cogs:=public.finance_mapping(new.organization_id,'SALE_COGS',new.branch_id,null); perform public.finance_post_lines(new.organization_id,new.return_date::date,'SALES','SALES_RETURN_COST',new.id,'Inventory restored '||new.return_number,jsonb_build_array(jsonb_build_object('account_id',inventory,'debit',amount,'branch_id',new.branch_id,'customer_id',new.customer_id),jsonb_build_object('account_id',cogs,'credit',amount,'branch_id',new.branch_id,'customer_id',new.customer_id)),1,new.created_by); end if;
 end if; return new;
end $$;
create trigger finance_sales_return after insert or update of status on public.sales_returns for each row execute function public.finance_sales_return_adapter();

create or replace function public.finance_supplier_credit_adapter() returns trigger language plpgsql security definer set search_path='' as $$
declare ap uuid; inventory uuid;
begin
 if new.status='APPROVED' and (tg_op='INSERT' or old.status<>'APPROVED') and exists(select 1 from public.accounting_settings where organization_id=new.organization_id and status='ACTIVE' and activation_date<=new.credit_date) then
  ap:=public.finance_mapping(new.organization_id,'SUPPLIER_AP',null,null); inventory:=public.finance_mapping(new.organization_id,'INVENTORY_ASSET',null,null); perform public.finance_post_lines(new.organization_id,new.credit_date,'PROCUREMENT','SUPPLIER_CREDIT',new.id,'Supplier credit '||new.credit_number,jsonb_build_array(jsonb_build_object('account_id',ap,'debit',new.base_currency_amount,'supplier_id',new.supplier_id),jsonb_build_object('account_id',inventory,'credit',new.base_currency_amount,'supplier_id',new.supplier_id)),1,null);
 end if; return new;
end $$;
create trigger finance_supplier_credit after insert or update of status on public.supplier_credits for each row execute function public.finance_supplier_credit_adapter();

create or replace function public.finance_refund_adapter() returns trigger language plpgsql security definer set search_path='' as $$
declare ar uuid; cash uuid;
begin
 if new.status='POSTED' and (tg_op='INSERT' or old.status<>'POSTED') and exists(select 1 from public.accounting_settings where organization_id=new.organization_id and status='ACTIVE' and activation_date<=new.refund_date) then
  ar:=public.finance_mapping(new.organization_id,'CUSTOMER_AR',new.branch_id,null); cash:=public.finance_mapping(new.organization_id,case when (select account_type from public.payment_accounts where organization_id=new.organization_id and id=new.settlement_account_id)='CARD_CLEARING' then 'CARD_PAYMENT' else 'CASH_PAYMENT' end,new.branch_id,new.settlement_account_id); perform public.finance_post_lines(new.organization_id,new.refund_date,'PAYMENTS','CUSTOMER_REFUND',new.id,'Customer refund '||new.refund_number,jsonb_build_array(jsonb_build_object('account_id',ar,'debit',new.base_currency_amount,'branch_id',new.branch_id,'customer_id',new.customer_id),jsonb_build_object('account_id',cash,'credit',new.base_currency_amount,'branch_id',new.branch_id,'customer_id',new.customer_id)),1,new.created_by);
 end if; return new;
end $$;
create trigger finance_refund after insert or update of status on public.customer_refunds for each row execute function public.finance_refund_adapter();

create or replace function public.import_bank_statement(target_organization_id uuid,target_payment_account_id uuid,target_file_name text,target_mapping jsonb,target_rows jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result uuid:=gen_random_uuid(); row jsonb;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.bank.reconcile') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if not exists(select 1 from public.payment_accounts where organization_id=target_organization_id and id=target_payment_account_id) then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if jsonb_typeof(target_rows)<>'array' or jsonb_array_length(target_rows)=0 then raise exception using errcode='22023',message='BANK_IMPORT_EMPTY'; end if;
 insert into public.bank_statement_imports(id,organization_id,payment_account_id,file_name,column_mapping,imported_by) values(result,target_organization_id,target_payment_account_id,trim(target_file_name),target_mapping,actor);
 for row in select value from jsonb_array_elements(target_rows) loop
  if nullif(row->>'date','') is null or nullif(row->>'amount','') is null or nullif(trim(row->>'description'),'') is null then raise exception using errcode='22023',message='BANK_IMPORT_ROW_INVALID'; end if;
  insert into public.bank_statement_lines(organization_id,import_id,payment_account_id,transaction_date,amount,reference,description) values(target_organization_id,result,target_payment_account_id,(row->>'date')::date,(row->>'amount')::numeric,nullif(trim(row->>'reference'),''),trim(row->>'description'));
 end loop; return result;
end $$;

create or replace function public.match_bank_statement_line(target_organization_id uuid,target_line_id uuid,target_source_type text,target_source_id uuid,target_exclude boolean)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); line public.bank_statement_lines%rowtype; expected numeric; source_account uuid;
begin
 if actor is null or not public.has_permission(target_organization_id,'finance.bank.reconcile') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select * into line from public.bank_statement_lines where organization_id=target_organization_id and id=target_line_id and status in('UNMATCHED','REVIEW') for update; if not found then raise exception using errcode='P0001',message='BANK_MATCH_ALREADY_USED'; end if;
 if target_exclude then update public.bank_statement_lines set status='EXCLUDED',matched_by=actor,matched_at=now() where id=line.id; return; end if;
 if target_source_type='PAYMENT' then select case when direction='RECEIPT' then base_currency_amount else -base_currency_amount end,settlement_account_id into expected,source_account from public.payments where organization_id=target_organization_id and id=target_source_id and not is_reversal and status<>'VOIDED';
 elsif target_source_type='EXPENSE' then select -(amount+tax_amount)*exchange_rate_snapshot,payment_account_id into expected,source_account from public.expenses where organization_id=target_organization_id and id=target_source_id and status='POSTED';
 elsif target_source_type='BANK_TRANSFER' then select case when source_payment_account_id=line.payment_account_id then -(amount+fee_amount) else amount end,line.payment_account_id into expected,source_account from public.bank_transfers where organization_id=target_organization_id and id=target_source_id and status='POSTED' and line.payment_account_id in(source_payment_account_id,destination_payment_account_id);
 else raise exception using errcode='22023',message='BANK_MATCH_SOURCE_INVALID'; end if;
 if source_account<>line.payment_account_id or round(expected,4)<>round(line.amount,4) then raise exception using errcode='P0001',message='BANK_MATCH_AMOUNT_MISMATCH'; end if;
 if exists(select 1 from public.bank_statement_lines where organization_id=target_organization_id and status='MATCHED' and matched_source_type=target_source_type and matched_source_id=target_source_id) then raise exception using errcode='P0001',message='BANK_MATCH_ALREADY_USED'; end if;
 update public.bank_statement_lines set status='MATCHED',matched_source_type=target_source_type,matched_source_id=target_source_id,matched_by=actor,matched_at=now() where id=line.id;
end $$;

create or replace view public.bank_match_suggestions with(security_invoker=true) as
select l.organization_id,l.id statement_line_id,'PAYMENT'::text source_type,p.id source_id,p.payment_number source_reference,p.payment_date source_date,case when p.direction='RECEIPT' then p.base_currency_amount else -p.base_currency_amount end source_amount,abs(l.transaction_date-p.payment_date) date_distance
from public.bank_statement_lines l join public.payments p on p.organization_id=l.organization_id and p.settlement_account_id=l.payment_account_id and case when p.direction='RECEIPT' then p.base_currency_amount else -p.base_currency_amount end=l.amount and not p.is_reversal and p.status<>'VOIDED' where l.status in('UNMATCHED','REVIEW') and abs(l.transaction_date-p.payment_date)<=7;
grant select on public.bank_match_suggestions to authenticated;
grant execute on function public.create_gl_account(uuid,text,text,text,uuid,text,text),public.set_gl_account_status(uuid,uuid,boolean),public.post_opening_balances(uuid,date,jsonb,text),public.import_bank_statement(uuid,uuid,text,jsonb,jsonb),public.match_bank_statement_line(uuid,uuid,text,uuid,boolean) to authenticated;
revoke all on function public.finance_credit_note_adapter(),public.finance_sales_return_adapter(),public.finance_supplier_credit_adapter(),public.finance_refund_adapter() from public,anon,authenticated;
