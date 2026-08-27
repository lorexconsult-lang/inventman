create or replace function public.purge_ephemeral_pos_verification(target_organization_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.role()<>'service_role' then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;
 if not exists(select 1 from public.organizations where id=target_organization_id and slug like 'phase7-pos-%') then raise exception using errcode='42501',message='EPHEMERAL_SCOPE_REQUIRED';end if;
 perform set_config('app.ephemeral_verification_cleanup','on',true);
 perform set_config('app.payment_mutation','on',true);
 delete from public.pos_receipt_reprints where organization_id=target_organization_id;
 delete from public.pos_sale_settlements where organization_id=target_organization_id;
 delete from public.pos_cash_events where organization_id=target_organization_id;
 delete from public.pos_held_carts where organization_id=target_organization_id;
 delete from public.pos_sales where organization_id=target_organization_id;
 delete from public.pos_sessions where organization_id=target_organization_id;
 delete from public.pos_terminals where organization_id=target_organization_id;
 delete from public.pos_settings where organization_id=target_organization_id;
 update public.branches set default_warehouse_id=null,default_price_list_id=null where organization_id=target_organization_id;
 update public.organizations set slug='phase6-payments-phase7-cleanup-'||target_organization_id::text where id=target_organization_id;
 perform public.purge_ephemeral_payment_verification(target_organization_id);
end $$;
revoke all on function public.purge_ephemeral_pos_verification(uuid) from public,anon,authenticated;
grant execute on function public.purge_ephemeral_pos_verification(uuid) to service_role;
