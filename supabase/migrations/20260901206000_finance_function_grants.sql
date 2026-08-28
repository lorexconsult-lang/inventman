-- Every finance RPC is deny-by-default; only the explicit application boundary is callable.
do $$declare f record;begin
 for f in select p.oid::regprocedure signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and (p.proname like 'finance_%' or p.proname in(
  'initialize_accounting','map_payment_account','activate_accounting','create_gl_account','set_gl_account_status',
  'create_manual_journal','reverse_journal','post_opening_balances','create_expense','submit_expense','approve_expense','post_expense',
  'post_bank_transfer','set_accounting_period_status','import_bank_statement','match_bank_statement_line')) loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  if f.proname in('initialize_accounting','map_payment_account','activate_accounting','create_gl_account','set_gl_account_status','create_manual_journal','reverse_journal','post_opening_balances','create_expense','submit_expense','approve_expense','post_expense','post_bank_transfer','set_accounting_period_status','import_bank_statement','match_bank_statement_line') then execute format('grant execute on function %s to authenticated',f.signature); end if;
 end loop;
end $$;
