create or replace function public.purge_ephemeral_saas_verification(target_organization_id uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 if current_user not in ('postgres','service_role') or not exists(select 1 from public.organizations where id=target_organization_id and slug like 'phase10-saas-%') then raise exception using errcode='42501',message='EPHEMERAL_CLEANUP_DENIED'; end if;
 delete from public.offline_entitlement_leases where organization_id=target_organization_id;
 delete from public.platform_billing_transactions where organization_id=target_organization_id;
 delete from public.organization_entitlement_overrides where organization_id=target_organization_id;
 delete from public.platform_feature_flags where organization_id=target_organization_id;
 delete from public.organization_subscriptions where organization_id=target_organization_id;
 perform public.purge_ephemeral_finance_verification(target_organization_id);
end $$;
revoke all on function public.purge_ephemeral_saas_verification(uuid) from public,anon,authenticated;
grant execute on function public.purge_ephemeral_saas_verification(uuid) to service_role;
