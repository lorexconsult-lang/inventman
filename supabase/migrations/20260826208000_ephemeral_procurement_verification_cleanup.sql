create or replace function public.guard_inventory_immutability() returns trigger language plpgsql set search_path='' as $$
begin
 if current_setting('app.ephemeral_verification_cleanup',true)='on' then return old; end if;
 raise exception using errcode='55000',message='IMMUTABLE_INVENTORY_HISTORY';
end $$;
create or replace function public.prevent_procurement_history_mutation() returns trigger language plpgsql set search_path='' as $$
begin
 if current_setting('app.ephemeral_verification_cleanup',true)='on' then return old; end if;
 raise exception using errcode='55000',message='IMMUTABLE_PROCUREMENT_HISTORY';
end $$;

create or replace function public.purge_ephemeral_procurement_verification(target_organization_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare target_slug text;
begin
 if auth.role()<>'service_role' then raise exception using errcode='42501',message='SERVICE_ROLE_REQUIRED'; end if;
 select slug into target_slug from public.organizations where id=target_organization_id for update;
 if target_slug is null or target_slug not like 'phase3-e2e-%' then raise exception using errcode='42501',message='NOT_EPHEMERAL_VERIFICATION_TENANT'; end if;
 perform set_config('app.ephemeral_verification_cleanup','on',true);
 delete from public.supplier_invoice_links where organization_id=target_organization_id;
 delete from public.supplier_invoice_lines where organization_id=target_organization_id;
 delete from public.supplier_credits where organization_id=target_organization_id;
 delete from public.supplier_invoices where organization_id=target_organization_id;
 delete from public.purchase_return_lines where organization_id=target_organization_id;
 delete from public.purchase_returns where organization_id=target_organization_id;
 delete from public.landed_cost_allocations where organization_id=target_organization_id;
 delete from public.landed_costs where organization_id=target_organization_id;
 delete from public.goods_receipt_lines where organization_id=target_organization_id;
 delete from public.goods_receipts where organization_id=target_organization_id;
 delete from public.purchase_order_lines where organization_id=target_organization_id;
 delete from public.purchase_orders where organization_id=target_organization_id;
 delete from public.supplier_quotation_lines where organization_id=target_organization_id;
 delete from public.supplier_price_history where organization_id=target_organization_id;
 delete from public.supplier_quotations where organization_id=target_organization_id;
 delete from public.rfq_suppliers where organization_id=target_organization_id;
 delete from public.rfq_lines where organization_id=target_organization_id;
 delete from public.request_for_quotations where organization_id=target_organization_id;
 delete from public.purchase_requisition_lines where organization_id=target_organization_id;
 delete from public.approval_actions where organization_id=target_organization_id;
 delete from public.approval_requests where organization_id=target_organization_id;
 delete from public.approval_steps where organization_id=target_organization_id;
 delete from public.approval_policies where organization_id=target_organization_id;
 delete from public.purchase_requisitions where organization_id=target_organization_id;
 delete from public.supplier_products where organization_id=target_organization_id;
 delete from public.supplier_documents where organization_id=target_organization_id;
 delete from public.supplier_contacts where organization_id=target_organization_id;
 delete from public.supplier_addresses where organization_id=target_organization_id;
 delete from public.suppliers where organization_id=target_organization_id;
 delete from public.procurement_activity where organization_id=target_organization_id;
 delete from public.procurement_settings where organization_id=target_organization_id;
 delete from public.inventory_cost_allocations where organization_id=target_organization_id;
 delete from public.inventory_cost_layers where organization_id=target_organization_id;
 delete from public.inventory_movements where organization_id=target_organization_id;
 delete from public.inventory_transactions where organization_id=target_organization_id;
 delete from public.inventory_balances where organization_id=target_organization_id;
 delete from public.inventory_reservation_events where organization_id=target_organization_id;
 delete from public.inventory_reservations where organization_id=target_organization_id;
 delete from public.stock_transfer_lines where organization_id=target_organization_id;
 delete from public.stock_transfers where organization_id=target_organization_id;
 delete from public.stock_count_lines where organization_id=target_organization_id;
 delete from public.stock_count_sessions where organization_id=target_organization_id;
 delete from public.inventory_reorder_overrides where organization_id=target_organization_id;
 delete from public.inventory_reason_codes where organization_id=target_organization_id;
 delete from public.inventory_number_counters where organization_id=target_organization_id;
 delete from public.inventory_settings where organization_id=target_organization_id;
 delete from public.organizations where id=target_organization_id;
end $$;
revoke all on function public.purge_ephemeral_procurement_verification(uuid) from public,anon,authenticated;
grant execute on function public.purge_ephemeral_procurement_verification(uuid) to service_role;
