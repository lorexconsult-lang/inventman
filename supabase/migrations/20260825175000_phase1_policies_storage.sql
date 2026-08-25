begin;

-- Replace coarse foundation policies with capability-specific policies.
drop policy if exists branches_select_member on public.branches;
drop policy if exists branches_manage on public.branches;
drop policy if exists warehouses_select_member on public.warehouses;
drop policy if exists warehouses_manage on public.warehouses;
create policy branches_select_capability on public.branches for select to authenticated using (public.has_permission(organization_id,'branches.view') and public.can_access_branch(organization_id,id));
create policy branches_create_capability on public.branches for insert to authenticated with check (public.has_permission(organization_id,'branches.create') and public.can_access_branch(organization_id,id));
create policy branches_update_capability on public.branches for update to authenticated using (public.has_permission(organization_id,'branches.update') and public.can_access_branch(organization_id,id)) with check (public.has_permission(organization_id,'branches.update') and public.can_access_branch(organization_id,id));
create policy warehouses_select_capability on public.warehouses for select to authenticated using (public.has_permission(organization_id,'warehouses.view') and public.can_access_branch(organization_id,branch_id));
create policy warehouses_create_capability on public.warehouses for insert to authenticated with check (public.has_permission(organization_id,'warehouses.create') and public.can_access_branch(organization_id,branch_id));
create policy warehouses_update_capability on public.warehouses for update to authenticated using (public.has_permission(organization_id,'warehouses.update') and public.can_access_branch(organization_id,branch_id)) with check (public.has_permission(organization_id,'warehouses.update') and public.can_access_branch(organization_id,branch_id));

alter table public.storage_locations enable row level security; alter table public.storage_locations force row level security;
alter table public.product_categories enable row level security; alter table public.product_categories force row level security;
alter table public.brands enable row level security; alter table public.brands force row level security;
alter table public.units_of_measure enable row level security; alter table public.units_of_measure force row level security;
alter table public.tax_profiles enable row level security; alter table public.tax_profiles force row level security;
alter table public.price_lists enable row level security; alter table public.price_lists force row level security;
alter table public.products enable row level security; alter table public.products force row level security;
alter table public.product_variants enable row level security; alter table public.product_variants force row level security;
alter table public.product_options enable row level security; alter table public.product_options force row level security;
alter table public.product_option_values enable row level security; alter table public.product_option_values force row level security;
alter table public.variant_option_values enable row level security; alter table public.variant_option_values force row level security;
alter table public.product_variant_packaging enable row level security; alter table public.product_variant_packaging force row level security;
alter table public.product_barcodes enable row level security; alter table public.product_barcodes force row level security;
alter table public.product_prices enable row level security; alter table public.product_prices force row level security;
alter table public.product_images enable row level security; alter table public.product_images force row level security;
alter table public.sku_counters enable row level security; alter table public.sku_counters force row level security;
alter table public.audit_events enable row level security; alter table public.audit_events force row level security;
alter table public.catalogue_import_batches enable row level security; alter table public.catalogue_import_batches force row level security;

create policy storage_locations_select on public.storage_locations for select to authenticated using (public.has_permission(organization_id,'storage_locations.view') and public.can_access_branch(organization_id,branch_id));
create policy storage_locations_insert on public.storage_locations for insert to authenticated with check (public.has_permission(organization_id,'storage_locations.create') and public.can_access_branch(organization_id,branch_id));
create policy storage_locations_update on public.storage_locations for update to authenticated using (public.has_permission(organization_id,'storage_locations.update') and public.can_access_branch(organization_id,branch_id)) with check (public.has_permission(organization_id,'storage_locations.update') and public.can_access_branch(organization_id,branch_id));
create policy categories_select on public.product_categories for select to authenticated using (public.has_permission(organization_id,'products.view'));
create policy categories_manage on public.product_categories for all to authenticated using (public.has_permission(organization_id,'categories.manage')) with check (public.has_permission(organization_id,'categories.manage'));
create policy brands_select on public.brands for select to authenticated using (public.has_permission(organization_id,'products.view'));
create policy brands_manage on public.brands for all to authenticated using (public.has_permission(organization_id,'brands.manage')) with check (public.has_permission(organization_id,'brands.manage'));
create policy units_select on public.units_of_measure for select to authenticated using (public.has_permission(organization_id,'products.view'));
create policy units_manage on public.units_of_measure for all to authenticated using (public.has_permission(organization_id,'units.manage')) with check (public.has_permission(organization_id,'units.manage'));
create policy taxes_select on public.tax_profiles for select to authenticated using (public.has_permission(organization_id,'products.view'));
create policy taxes_manage on public.tax_profiles for all to authenticated using (public.has_permission(organization_id,'taxes.manage')) with check (public.has_permission(organization_id,'taxes.manage'));
create policy price_lists_select on public.price_lists for select to authenticated using (public.has_permission(organization_id,'prices.view'));
create policy price_lists_manage on public.price_lists for all to authenticated using (public.has_permission(organization_id,'prices.manage')) with check (public.has_permission(organization_id,'prices.manage'));
create policy products_select on public.products for select to authenticated using (public.has_permission(organization_id,'products.view'));
create policy products_insert on public.products for insert to authenticated with check (public.has_permission(organization_id,'products.create'));
create policy products_update on public.products for update to authenticated using (public.has_permission(organization_id,'products.update')) with check (public.has_permission(organization_id,'products.update'));
create policy variants_select on public.product_variants for select to authenticated using (public.has_permission(organization_id,'products.view'));
create policy variants_manage on public.product_variants for all to authenticated using (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create')) with check (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create'));
create policy options_select on public.product_options for select to authenticated using (public.has_permission(organization_id,'products.view'));
create policy options_manage on public.product_options for all to authenticated using (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create')) with check (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create'));
create policy option_values_select on public.product_option_values for select to authenticated using (public.has_permission(organization_id,'products.view'));
create policy option_values_manage on public.product_option_values for all to authenticated using (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create')) with check (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create'));
create policy variant_values_select on public.variant_option_values for select to authenticated using (public.has_permission(organization_id,'products.view'));
create policy variant_values_manage on public.variant_option_values for all to authenticated using (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create')) with check (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create'));
create policy packaging_select on public.product_variant_packaging for select to authenticated using (public.has_permission(organization_id,'products.view'));
create policy packaging_manage on public.product_variant_packaging for all to authenticated using (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create')) with check (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create'));
create policy barcodes_select on public.product_barcodes for select to authenticated using (public.has_permission(organization_id,'products.view'));
create policy barcodes_manage on public.product_barcodes for all to authenticated using (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create')) with check (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create'));
create policy prices_select on public.product_prices for select to authenticated using (public.has_permission(organization_id,'prices.view') and (branch_id is null or public.can_access_branch(organization_id,branch_id)));
create policy prices_manage on public.product_prices for all to authenticated using (public.has_permission(organization_id,'prices.manage') and (branch_id is null or public.can_access_branch(organization_id,branch_id))) with check (public.has_permission(organization_id,'prices.manage') and (branch_id is null or public.can_access_branch(organization_id,branch_id)));
create policy images_select on public.product_images for select to authenticated using (public.has_permission(organization_id,'products.view'));
create policy images_manage on public.product_images for all to authenticated using (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create')) with check (public.has_permission(organization_id,'products.update') or public.has_permission(organization_id,'products.create'));
create policy audit_select on public.audit_events for select to authenticated using (public.has_permission(organization_id,'audit.view'));
create policy imports_select on public.catalogue_import_batches for select to authenticated using (public.has_permission(organization_id,'catalogue.import'));
create policy imports_manage on public.catalogue_import_batches for all to authenticated using (public.has_permission(organization_id,'catalogue.import')) with check (public.has_permission(organization_id,'catalogue.import'));

grant select, insert, update on public.branches, public.warehouses, public.storage_locations, public.product_categories, public.brands,
  public.units_of_measure, public.tax_profiles, public.price_lists, public.products, public.product_variants, public.product_options,
  public.product_option_values, public.variant_option_values, public.product_variant_packaging, public.product_barcodes,
  public.product_prices, public.product_images, public.catalogue_import_batches to authenticated;
grant select on public.audit_events to authenticated;
grant usage, select on sequence public.audit_events_id_seq to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',false,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy product_images_storage_select on storage.objects for select to authenticated using (
  bucket_id='product-images' and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.has_permission(((storage.foldername(name))[1])::uuid,'products.view')
);
create policy product_images_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id='product-images' and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.has_permission(((storage.foldername(name))[1])::uuid,'products.create')
  and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
);
create policy product_images_storage_update on storage.objects for update to authenticated using (
  bucket_id='product-images' and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.has_permission(((storage.foldername(name))[1])::uuid,'products.update')
) with check (
  bucket_id='product-images' and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.has_permission(((storage.foldername(name))[1])::uuid,'products.update')
  and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','avif')
);
create policy product_images_storage_delete on storage.objects for delete to authenticated using (
  bucket_id='product-images' and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.has_permission(((storage.foldername(name))[1])::uuid,'products.update')
);

revoke all on function public.validate_storage_location_hierarchy() from public;
revoke all on function public.validate_category_hierarchy() from public;
revoke all on function public.validate_variant_option_assignment() from public;
revoke all on function public.validate_variant_packaging_reference() from public;
revoke all on function public.validate_product_image_variant() from public;
revoke all on function public.validate_branch_defaults() from public;
revoke all on function public.ensure_warehouse_root_location() from public;
revoke all on function public.enforce_product_variant_exists() from public;
revoke all on function public.enforce_variant_base_packaging_exists() from public;
revoke all on function public.write_audit_event() from public;
revoke all on function public.enforce_lifecycle_permission() from public;

commit;
