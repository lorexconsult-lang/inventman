create or replace function public.purge_ephemeral_payment_verification(target_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_slug text;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'PERMISSION_DENIED';
  end if;

  select slug into target_slug
  from public.organizations
  where id = target_organization_id
  for update;

  if target_slug is null or target_slug not like 'phase6-payments-%' then
    raise exception using errcode = '42501', message = 'EPHEMERAL_SCOPE_REQUIRED';
  end if;

  perform set_config('app.ephemeral_verification_cleanup', 'on', true);
  perform set_config('app.payment_mutation', 'on', true);
  delete from public.customer_refunds where organization_id = target_organization_id;
  delete from public.customer_credit_allocations where organization_id = target_organization_id;
  delete from public.supplier_credit_allocations where organization_id = target_organization_id;
  delete from public.payment_allocations where organization_id = target_organization_id;
  delete from public.payments where organization_id = target_organization_id;
  delete from public.payment_methods where organization_id = target_organization_id;
  delete from public.payment_accounts where organization_id = target_organization_id;
  delete from public.payment_number_counters where organization_id = target_organization_id;

  update public.organizations
  set slug = 'phase4-e2e-phase6-cleanup-' || target_organization_id::text
  where id = target_organization_id;
  perform public.purge_ephemeral_sales_verification(target_organization_id);
end
$$;

revoke all on function public.purge_ephemeral_payment_verification(uuid) from public, anon, authenticated;
grant execute on function public.purge_ephemeral_payment_verification(uuid) to service_role;
