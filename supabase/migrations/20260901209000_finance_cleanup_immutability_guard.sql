create or replace function public.finance_reject_posted_mutation() returns trigger language plpgsql set search_path='' as $$
begin
 if current_setting('app.finance_reversal',true)='on' and tg_table_name='journal_entries' and tg_op='UPDATE' then return new; end if;
 if current_setting('app.finance_ephemeral_cleanup',true)='on' then return case when tg_op='DELETE' then old else new end; end if;
 raise exception using errcode='P0001',message='POSTED_JOURNAL_IMMUTABLE';
end $$;

create or replace function public.purge_ephemeral_finance_verification(target_organization_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.role()<>'service_role' then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 if not exists(select 1 from public.organizations where id=target_organization_id and name like 'Phase 9 Finance%') then raise exception using errcode='42501',message='EPHEMERAL_FIXTURE_REQUIRED'; end if;
 perform set_config('app.finance_ephemeral_cleanup','on',true);
 delete from public.bank_statement_lines where organization_id=target_organization_id;
 delete from public.bank_statement_imports where organization_id=target_organization_id;
 delete from public.bank_transfers where organization_id=target_organization_id;
 delete from public.expense_documents where organization_id=target_organization_id;
 delete from public.expenses where organization_id=target_organization_id;
 delete from public.journal_lines where organization_id=target_organization_id;
 delete from public.accounting_events where organization_id=target_organization_id;
 delete from public.journal_entries where organization_id=target_organization_id;
 delete from public.account_mappings where organization_id=target_organization_id;
 update public.accounting_settings set retained_earnings_account_id=null,current_period_id=null where organization_id=target_organization_id;
 delete from public.accounting_periods where organization_id=target_organization_id;
 delete from public.accounting_settings where organization_id=target_organization_id;
 delete from public.gl_accounts where organization_id=target_organization_id;
 delete from public.journal_number_counters where organization_id=target_organization_id;
 perform public.purge_ephemeral_payment_verification(target_organization_id);
end $$;
revoke all on function public.purge_ephemeral_finance_verification(uuid) from public,anon,authenticated;
grant execute on function public.purge_ephemeral_finance_verification(uuid) to service_role;
