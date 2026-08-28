do $$declare definition text;begin
 select pg_get_functiondef('public.purge_ephemeral_finance_verification(uuid)'::regprocedure) into definition;
 definition:=replace(definition,'perform public.purge_ephemeral_payment_verification(target_organization_id);','update public.organizations set slug=''phase6-payments-finance-cleanup-''||target_organization_id::text where id=target_organization_id;'||chr(10)||' perform public.purge_ephemeral_payment_verification(target_organization_id);');
 execute definition;
end $$;
revoke all on function public.purge_ephemeral_finance_verification(uuid) from public,anon,authenticated;
grant execute on function public.purge_ephemeral_finance_verification(uuid) to service_role;
