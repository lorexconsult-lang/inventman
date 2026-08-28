-- Fixes found by the first hosted Phase 9 pgTAP execution.
do $$
declare definition text;
begin
 select pg_get_functiondef('public.initialize_accounting(uuid,text,integer,date)'::regprocedure) into definition;
 definition:=replace(definition,'''1 month-1 day''::interval','''1 month''::interval - ''1 day''::interval');
 execute definition;
end $$;

create or replace function public.finance_reject_posted_mutation() returns trigger language plpgsql set search_path='' as $$
begin
 if current_setting('app.finance_reversal',true)='on' and tg_table_name='journal_entries' and tg_op='UPDATE' then return new; end if;
 raise exception using errcode='P0001',message='POSTED_JOURNAL_IMMUTABLE';
end $$;

create or replace view public.trial_balance with(security_invoker=true) as
select a.organization_id,a.id account_id,a.account_code,a.name,a.account_type,
 greatest(coalesce(sum(l.base_debit) filter(where e.id is not null),0)-coalesce(sum(l.base_credit) filter(where e.id is not null),0),0) debit_balance,
 greatest(coalesce(sum(l.base_credit) filter(where e.id is not null),0)-coalesce(sum(l.base_debit) filter(where e.id is not null),0),0) credit_balance
from public.gl_accounts a left join public.journal_lines l on l.organization_id=a.organization_id and l.account_id=a.id left join public.journal_entries e on e.organization_id=l.organization_id and e.id=l.journal_id and e.status in('POSTED','REVERSED') group by a.organization_id,a.id,a.account_code,a.name,a.account_type;

create or replace view public.financial_statement_balances with(security_invoker=true) as
select a.organization_id,a.account_type,a.account_code,a.name,public.finance_account_balance(a.account_type,coalesce(sum(l.base_debit) filter(where e.id is not null),0),coalesce(sum(l.base_credit) filter(where e.id is not null),0)) balance
from public.gl_accounts a left join public.journal_lines l on l.organization_id=a.organization_id and l.account_id=a.id left join public.journal_entries e on e.organization_id=l.organization_id and e.id=l.journal_id and e.status in('POSTED','REVERSED') group by a.organization_id,a.id,a.account_type,a.account_code,a.name;
