create or replace function public.purge_ephemeral_sales_verification(target_organization_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare target_slug text;
begin
 if auth.role()<>'service_role' then raise exception using errcode='42501',message='SERVICE_ROLE_REQUIRED';end if;
 select slug into target_slug from public.organizations where id=target_organization_id for update;
 if target_slug is null or target_slug not like 'phase4-e2e-%' then raise exception using errcode='42501',message='NOT_EPHEMERAL_VERIFICATION_TENANT';end if;
 perform set_config('app.ephemeral_verification_cleanup','on',true);
 update public.sales_returns set credit_note_id=null where organization_id=target_organization_id;
 delete from public.sales_return_cost_allocations where organization_id=target_organization_id;
 delete from public.customer_credit_notes where organization_id=target_organization_id;
 delete from public.sales_return_lines where organization_id=target_organization_id;
 delete from public.sales_returns where organization_id=target_organization_id;
 delete from public.customer_invoice_fulfillments where organization_id=target_organization_id;
 delete from public.customer_invoice_lines where organization_id=target_organization_id;
 delete from public.customer_invoices where organization_id=target_organization_id;
 delete from public.sales_fulfillment_lines where organization_id=target_organization_id;
 delete from public.sales_fulfillments where organization_id=target_organization_id;
 delete from public.sales_order_lines where organization_id=target_organization_id;
 delete from public.sales_orders where organization_id=target_organization_id;
 delete from public.sales_quotation_lines where organization_id=target_organization_id;
 delete from public.sales_quotations where organization_id=target_organization_id;
 delete from public.customer_documents where organization_id=target_organization_id;
 delete from public.customer_contacts where organization_id=target_organization_id;
 delete from public.customer_addresses where organization_id=target_organization_id;
 delete from public.customers where organization_id=target_organization_id;
 delete from public.sales_activity where organization_id=target_organization_id;
 delete from public.sales_return_reasons where organization_id=target_organization_id;
 delete from public.sales_settings where organization_id=target_organization_id;
 update public.organizations set slug='phase3-e2e-sales-cleanup-'||target_organization_id::text where id=target_organization_id;
 perform public.purge_ephemeral_procurement_verification(target_organization_id);
end $$;
revoke all on function public.purge_ephemeral_sales_verification(uuid) from public,anon,authenticated;
grant execute on function public.purge_ephemeral_sales_verification(uuid) to service_role;
