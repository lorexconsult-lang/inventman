insert into public.permissions(code,description) values
('suppliers.view','View suppliers'),('suppliers.create','Create suppliers'),('suppliers.update','Update suppliers'),('suppliers.archive','Archive suppliers'),
('procurement.requisition_view','View purchase requisitions'),('procurement.requisition_create','Create purchase requisitions'),('procurement.requisition_submit','Submit purchase requisitions'),('procurement.requisition_approve','Approve purchase requisitions'),
('procurement.rfq_view','View RFQs'),('procurement.rfq_create','Create RFQs'),('procurement.rfq_issue','Issue RFQs'),('procurement.rfq_evaluate','Evaluate RFQs'),
('procurement.quote_view','View quotations'),('procurement.quote_create','Record quotations'),('procurement.quote_select','Award quotations'),
('procurement.po_view','View purchase orders'),('procurement.po_create','Create purchase orders'),('procurement.po_submit','Submit purchase orders'),('procurement.po_approve','Approve purchase orders'),('procurement.po_cancel','Cancel purchase orders'),
('procurement.receipt_view','View goods receipts'),('procurement.receipt_create','Create goods receipts'),('procurement.receipt_post','Post goods receipts'),('procurement.receipt_override','Override receipt quantity'),
('procurement.invoice_view','View supplier invoices'),('procurement.invoice_create','Create supplier invoices'),('procurement.invoice_approve','Approve supplier invoices'),
('procurement.return_view','View purchase returns'),('procurement.return_create','Create purchase returns'),('procurement.return_post','Post purchase returns'),
('procurement.reports_view','View procurement reports'),('procurement.payables_view','View supplier payables'),('approval.manage','Manage approval policies')
on conflict(code) do update set description=excluded.description;

insert into public.role_permissions(organization_id,role_id,permission_id)
select r.organization_id,r.id,p.id from public.roles r cross join public.permissions p where r.is_system and r.name in ('Owner','Administrator') and (p.code like 'suppliers.%' or p.code like 'procurement.%' or p.code='approval.manage') on conflict do nothing;
insert into public.role_permissions(organization_id,role_id,permission_id)
select r.organization_id,r.id,p.id from public.roles r join public.permissions p on p.code in ('suppliers.view','suppliers.create','suppliers.update','procurement.requisition_view','procurement.requisition_create','procurement.requisition_submit','procurement.rfq_view','procurement.rfq_create','procurement.rfq_issue','procurement.rfq_evaluate','procurement.quote_view','procurement.quote_create','procurement.quote_select','procurement.po_view','procurement.po_create','procurement.po_submit','procurement.receipt_view','procurement.receipt_create','procurement.receipt_post','procurement.invoice_view','procurement.invoice_create','procurement.return_view','procurement.return_create','procurement.return_post','procurement.reports_view','procurement.payables_view') where r.is_system and r.name='Branch Manager' on conflict do nothing;

insert into public.procurement_settings(organization_id) select id from public.organizations on conflict do nothing;
create or replace function public.seed_procurement_organization() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.procurement_settings(organization_id) values(new.id); return new; end $$;
create trigger seed_procurement_after_organization after insert on public.organizations for each row execute function public.seed_procurement_organization();

do $$ declare t text; begin foreach t in array array['procurement_settings','suppliers','supplier_addresses','supplier_contacts','supplier_documents','supplier_products','supplier_price_history','approval_policies','approval_steps','approval_requests','approval_actions','purchase_requisitions','purchase_requisition_lines','request_for_quotations','rfq_lines','rfq_suppliers','supplier_quotations','supplier_quotation_lines','purchase_orders','purchase_order_lines','goods_receipts','goods_receipt_lines','landed_costs','landed_cost_allocations','supplier_invoices','supplier_invoice_lines','supplier_invoice_links','supplier_credits','purchase_returns','purchase_return_lines','procurement_activity'] loop execute format('alter table public.%I enable row level security',t); execute format('alter table public.%I force row level security',t); execute format('revoke all on public.%I from anon,authenticated',t); execute format('grant select on public.%I to authenticated',t); end loop; end $$;
grant select on public.supplier_payables,public.purchase_order_outstanding to authenticated;

create policy procurement_settings_read on public.procurement_settings for select to authenticated using(public.has_permission(organization_id,'procurement.po_view'));
create policy suppliers_read on public.suppliers for select to authenticated using(public.has_permission(organization_id,'suppliers.view'));
create policy suppliers_insert on public.suppliers for insert to authenticated with check(public.has_permission(organization_id,'suppliers.create') and created_by=(select auth.uid()));
create policy suppliers_update on public.suppliers for update to authenticated using(public.has_permission(organization_id,'suppliers.update')) with check(public.has_permission(organization_id,'suppliers.update'));
grant insert,update on public.suppliers to authenticated;

do $$ declare pair text[]; begin foreach pair slice 1 in array array[
 ['supplier_addresses','suppliers.view'],['supplier_contacts','suppliers.view'],['supplier_documents','suppliers.view'],['supplier_products','suppliers.view'],['supplier_price_history','suppliers.view'],
 ['approval_policies','approval.manage'],['approval_steps','approval.manage'],['approval_requests','procurement.requisition_view'],['approval_actions','procurement.requisition_view'],
 ['purchase_requisitions','procurement.requisition_view'],['purchase_requisition_lines','procurement.requisition_view'],['request_for_quotations','procurement.rfq_view'],['rfq_lines','procurement.rfq_view'],['rfq_suppliers','procurement.rfq_view'],
 ['supplier_quotations','procurement.quote_view'],['supplier_quotation_lines','procurement.quote_view'],['purchase_orders','procurement.po_view'],['purchase_order_lines','procurement.po_view'],
 ['goods_receipts','procurement.receipt_view'],['goods_receipt_lines','procurement.receipt_view'],['landed_costs','procurement.receipt_view'],['landed_cost_allocations','procurement.receipt_view'],
 ['supplier_invoices','procurement.invoice_view'],['supplier_invoice_lines','procurement.invoice_view'],['supplier_invoice_links','procurement.invoice_view'],['supplier_credits','procurement.payables_view'],
 ['purchase_returns','procurement.return_view'],['purchase_return_lines','procurement.return_view'],['procurement_activity','procurement.reports_view']
 ] loop execute format('create policy %I on public.%I for select to authenticated using(public.has_permission(organization_id,%L))',pair[1]||'_read',pair[1],pair[2]); end loop; end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('supplier-documents','supplier-documents',false,20971520,array['application/pdf','image/jpeg','image/png','text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy supplier_documents_read on storage.objects for select to authenticated using(bucket_id='supplier-documents' and public.has_permission(((storage.foldername(name))[1])::uuid,'suppliers.view'));
create policy supplier_documents_write on storage.objects for insert to authenticated with check(bucket_id='supplier-documents' and public.has_permission(((storage.foldername(name))[1])::uuid,'suppliers.update'));
create policy supplier_documents_delete on storage.objects for delete to authenticated using(bucket_id='supplier-documents' and public.has_permission(((storage.foldername(name))[1])::uuid,'suppliers.update'));

create or replace function public.prevent_procurement_history_mutation() returns trigger language plpgsql set search_path='' as $$ begin raise exception using errcode='55000',message='IMMUTABLE_PROCUREMENT_HISTORY'; end $$;
create trigger approval_actions_immutable before update or delete on public.approval_actions for each row execute function public.prevent_procurement_history_mutation();
create trigger supplier_prices_immutable before update or delete on public.supplier_price_history for each row execute function public.prevent_procurement_history_mutation();
create trigger procurement_activity_immutable before update or delete on public.procurement_activity for each row execute function public.prevent_procurement_history_mutation();

create or replace function public.guard_approved_purchase_order() returns trigger language plpgsql set search_path='' as $$ begin if old.status not in ('DRAFT','PENDING_APPROVAL') and (new.supplier_id,new.branch_id,new.receiving_location_id,new.currency,new.exchange_rate,new.total) is distinct from (old.supplier_id,old.branch_id,old.receiving_location_id,old.currency,old.exchange_rate,old.total) then raise exception using errcode='55000',message='APPROVED_PO_IMMUTABLE'; end if; return new; end $$;
create trigger purchase_orders_approved_guard before update on public.purchase_orders for each row execute function public.guard_approved_purchase_order();

revoke execute on function public.seed_procurement_organization() from public,anon,authenticated;
