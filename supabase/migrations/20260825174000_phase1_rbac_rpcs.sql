begin;

alter table public.permissions drop constraint permissions_code_check;
alter table public.permissions add constraint permissions_code_check check (code ~ '^[a-z][a-z0-9_-]*\.[a-z][a-z0-9_-]*$');

insert into public.permissions (code, description) values
  ('branches.view','View authorized branches'),('branches.create','Create branches'),('branches.update','Update branches'),('branches.deactivate','Deactivate branches'),
  ('warehouses.view','View authorized warehouses'),('warehouses.create','Create warehouses'),('warehouses.update','Update warehouses'),('warehouses.deactivate','Deactivate warehouses'),
  ('storage_locations.view','View authorized storage locations'),('storage_locations.create','Create storage locations'),('storage_locations.update','Update storage locations'),('storage_locations.deactivate','Deactivate storage locations'),
  ('products.view','View the product catalogue'),('products.create','Create catalogue products'),('products.update','Update catalogue products'),('products.archive','Archive or reactivate products'),
  ('categories.manage','Manage product categories'),('brands.manage','Manage brands'),('units.manage','Manage units of measure'),
  ('prices.view','View product pricing'),('prices.manage','Manage price lists and prices'),('taxes.manage','Manage tax profiles'),
  ('catalogue.import','Import catalogue data'),('catalogue.export','Export catalogue data'),('audit.view','View sensitive audit history')
on conflict (code) do update set description = excluded.description;

insert into public.roles (organization_id, name, description, is_system)
select organization.id, role_name, role_description, true
from public.organizations organization cross join (values
  ('Administrator','Organization administrator'),('Branch Manager','Branch-scoped operations manager'),('Cashier','Restricted catalogue viewer')
) role(role_name, role_description)
on conflict (organization_id, name) do nothing;

insert into public.role_permissions (organization_id, role_id, permission_id)
select role.organization_id, role.id, permission.id from public.roles role cross join public.permissions permission
where role.is_system and role.name in ('Owner','Administrator')
on conflict do nothing;
insert into public.role_permissions (organization_id, role_id, permission_id)
select role.organization_id, role.id, permission.id from public.roles role join public.permissions permission on permission.code in (
  'branches.view','branches.update','warehouses.view','warehouses.create','warehouses.update','warehouses.deactivate',
  'storage_locations.view','storage_locations.create','storage_locations.update','storage_locations.deactivate','products.view','products.update','prices.view'
) where role.is_system and role.name = 'Branch Manager' on conflict do nothing;
insert into public.role_permissions (organization_id, role_id, permission_id)
select role.organization_id, role.id, permission.id from public.roles role join public.permissions permission on permission.code in ('products.view','prices.view')
where role.is_system and role.name = 'Cashier' on conflict do nothing;

insert into public.units_of_measure (organization_id, name, symbol, dimension, is_system, created_by)
select organization.id, unit.name, unit.symbol, unit.dimension, true, organization.created_by
from public.organizations organization cross join (values
  ('Piece','pc','COUNT'),('Unit','unit','COUNT'),('Pack','pack','COUNT'),('Carton','ctn','COUNT'),('Box','box','COUNT'),('Dozen','doz','COUNT'),
  ('Gram','g','WEIGHT'),('Kilogram','kg','WEIGHT'),('Millilitre','ml','VOLUME'),('Litre','l','VOLUME'),('Metre','m','LENGTH')
) unit(name,symbol,dimension) on conflict do nothing;
insert into public.price_lists (organization_id, name, code, description, currency_code, is_default, created_by)
select organization.id, 'Retail', 'RETAIL', 'Default retail selling prices', organization.currency_code, true, organization.created_by
from public.organizations organization on conflict do nothing;

insert into public.storage_locations (organization_id,branch_id,warehouse_id,name,code,location_type,description,created_by)
select warehouse.organization_id,warehouse.branch_id,warehouse.id,'Root','ROOT','ROOT','Default stock location',warehouse.created_by
from public.warehouses warehouse
where not exists (select 1 from public.storage_locations location where location.warehouse_id=warehouse.id and location.location_type='ROOT');

create or replace function public.generate_sku(target_organization_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare counter_value bigint; prefix_value text;
begin
  if not public.has_permission(target_organization_id, 'products.create') then raise exception 'permission_denied' using errcode = '42501'; end if;
  insert into public.sku_counters (organization_id, next_value) values (target_organization_id, 2)
  on conflict (organization_id) do update set next_value = public.sku_counters.next_value + 1, updated_at = now()
  returning next_value - 1, prefix into counter_value, prefix_value;
  return prefix_value || '-' || lpad(counter_value::text, 6, '0');
end;
$$;

create or replace function public.create_simple_product(
  target_organization_id uuid, target_business_id uuid, product_name text, target_product_type text,
  target_category_id uuid, target_brand_id uuid, target_tax_profile_id uuid, target_unit_id uuid,
  target_sku text, target_barcode text, target_price_list_id uuid, target_price numeric,
  target_reference_cost numeric, target_reorder_point numeric, target_track_inventory boolean,
  target_idempotency_key uuid
) returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid()); new_product_id uuid; new_variant_id uuid; new_packaging_id uuid; resolved_sku text;
begin
  if actor_id is null or not public.has_permission(target_organization_id, 'products.create') then raise exception 'permission_denied' using errcode = '42501'; end if;
  select id into new_product_id from public.products where organization_id = target_organization_id and idempotency_key = target_idempotency_key;
  if found then return new_product_id; end if;
  resolved_sku := nullif(trim(target_sku), '');
  if resolved_sku is null then resolved_sku := public.generate_sku(target_organization_id); end if;
  insert into public.products (organization_id,business_id,name,category_id,brand_id,product_type,tax_profile_id,track_inventory,reference_cost,status,created_by,idempotency_key)
  values (target_organization_id,target_business_id,trim(product_name),target_category_id,target_brand_id,target_product_type,target_tax_profile_id,target_track_inventory,target_reference_cost,'ACTIVE',actor_id,target_idempotency_key)
  returning id into new_product_id;
  insert into public.product_variants (organization_id,product_id,name,sku,reorder_point)
  values (target_organization_id,new_product_id,'Default',resolved_sku,target_reorder_point) returning id into new_variant_id;
  insert into public.product_variant_packaging (organization_id,product_variant_id,unit_of_measure_id,name,conversion_to_base,is_base_unit,can_purchase,can_sell)
  select target_organization_id,new_variant_id,unit.id,unit.name,1,true,true,true from public.units_of_measure unit
  where unit.id = target_unit_id and unit.organization_id = target_organization_id and unit.is_active returning id into new_packaging_id;
  if new_packaging_id is null then raise exception 'invalid_base_unit' using errcode = '23514'; end if;
  if nullif(trim(target_barcode),'') is not null then
    insert into public.product_barcodes (organization_id,product_variant_id,packaging_id,barcode,is_primary)
    values (target_organization_id,new_variant_id,new_packaging_id,trim(target_barcode),true);
  end if;
  if target_price is not null then
    if not public.has_permission(target_organization_id, 'prices.manage') then raise exception 'price_permission_denied' using errcode = '42501'; end if;
    insert into public.product_prices (organization_id,price_list_id,product_variant_id,packaging_id,amount,created_by)
    values (target_organization_id,target_price_list_id,new_variant_id,new_packaging_id,target_price,actor_id);
  end if;
  return new_product_id;
end;
$$;

create or replace function public.create_variant_product(
  target_organization_id uuid, target_business_id uuid, product_name text, target_product_type text,
  target_category_id uuid, target_brand_id uuid, target_tax_profile_id uuid, target_track_inventory boolean,
  target_reference_cost numeric, target_idempotency_key uuid, option_definitions jsonb, variant_definitions jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid()); new_product_id uuid; variant_row jsonb; option_row jsonb; value_text text;
declare new_variant_id uuid; new_packaging_id uuid; base_unit_id uuid; attributes jsonb; attribute record; resolved_sku text;
declare extra_packaging jsonb;
begin
  if actor_id is null or not public.has_permission(target_organization_id,'products.create') then raise exception 'permission_denied' using errcode='42501'; end if;
  if jsonb_typeof(option_definitions) <> 'array' or jsonb_typeof(variant_definitions) <> 'array' or jsonb_array_length(variant_definitions)=0 then
    raise exception 'invalid_variant_definition' using errcode='22023';
  end if;
  select id into new_product_id from public.products where organization_id=target_organization_id and idempotency_key=target_idempotency_key;
  if found then return new_product_id; end if;
  insert into public.products (organization_id,business_id,name,category_id,brand_id,product_type,tax_profile_id,track_inventory,reference_cost,status,created_by,idempotency_key)
  values (target_organization_id,target_business_id,trim(product_name),target_category_id,target_brand_id,target_product_type,target_tax_profile_id,target_track_inventory,target_reference_cost,'ACTIVE',actor_id,target_idempotency_key)
  returning id into new_product_id;
  for option_row in select value from jsonb_array_elements(option_definitions) loop
    insert into public.product_options (organization_id,product_id,name,sort_order)
    values (target_organization_id,new_product_id,trim(option_row->>'name'),coalesce((option_row->>'sort_order')::int,0));
    for value_text in select jsonb_array_elements_text(option_row->'values') loop
      insert into public.product_option_values (organization_id,product_option_id,value,sort_order)
      select target_organization_id,option.id,trim(value_text),0 from public.product_options option
      where option.product_id=new_product_id and lower(option.name)=lower(trim(option_row->>'name'));
    end loop;
  end loop;
  for variant_row in select value from jsonb_array_elements(variant_definitions) loop
    attributes := coalesce(variant_row->'attributes','{}'::jsonb);
    if (select count(*) from jsonb_object_keys(attributes)) <> (select count(*) from public.product_options where product_id=new_product_id) then
      raise exception 'variant_requires_one_value_per_option' using errcode='23514';
    end if;
    resolved_sku := nullif(trim(variant_row->>'sku'),'');
    if resolved_sku is null then resolved_sku := public.generate_sku(target_organization_id); end if;
    base_unit_id := (variant_row->>'base_unit_id')::uuid;
    insert into public.product_variants (organization_id,product_id,name,sku,option_signature,reorder_point,reorder_quantity,safety_stock)
    values (target_organization_id,new_product_id,trim(variant_row->>'name'),resolved_sku,
      case when attributes='{}'::jsonb then null else attributes::text end,
      (variant_row->>'reorder_point')::numeric,(variant_row->>'reorder_quantity')::numeric,(variant_row->>'safety_stock')::numeric)
    returning id into new_variant_id;
    insert into public.product_variant_packaging (organization_id,product_variant_id,unit_of_measure_id,name,conversion_to_base,is_base_unit,can_purchase,can_sell)
    select target_organization_id,new_variant_id,unit.id,unit.name,1,true,true,true from public.units_of_measure unit
    where unit.id=base_unit_id and unit.organization_id=target_organization_id and unit.is_active returning id into new_packaging_id;
    if new_packaging_id is null then raise exception 'invalid_base_unit' using errcode='23514'; end if;
    for extra_packaging in select value from jsonb_array_elements(coalesce(variant_row->'packaging','[]'::jsonb)) loop
      insert into public.product_variant_packaging (organization_id,product_variant_id,unit_of_measure_id,name,conversion_to_base,can_purchase,can_sell)
      values (target_organization_id,new_variant_id,(extra_packaging->>'unit_id')::uuid,trim(extra_packaging->>'name'),
        (extra_packaging->>'conversion_to_base')::numeric,coalesce((extra_packaging->>'can_purchase')::boolean,false),coalesce((extra_packaging->>'can_sell')::boolean,true));
    end loop;
    for attribute in select key,value from jsonb_each_text(attributes) loop
      insert into public.variant_option_values (organization_id,product_variant_id,product_option_id,product_option_value_id)
      select target_organization_id,new_variant_id,option.id,option_value.id
      from public.product_options option join public.product_option_values option_value on option_value.product_option_id=option.id
      where option.product_id=new_product_id and lower(option.name)=lower(attribute.key) and lower(option_value.value)=lower(attribute.value);
      if not found then raise exception 'invalid_variant_option_value' using errcode='23514'; end if;
    end loop;
    if nullif(trim(variant_row->>'barcode'),'') is not null then
      insert into public.product_barcodes (organization_id,product_variant_id,packaging_id,barcode,is_primary)
      values (target_organization_id,new_variant_id,new_packaging_id,trim(variant_row->>'barcode'),true);
    end if;
    if variant_row->>'price' is not null then
      if not public.has_permission(target_organization_id,'prices.manage') then raise exception 'price_permission_denied' using errcode='42501'; end if;
      insert into public.product_prices (organization_id,price_list_id,product_variant_id,packaging_id,amount,created_by)
      values (target_organization_id,(variant_row->>'price_list_id')::uuid,new_variant_id,new_packaging_id,(variant_row->>'price')::numeric,actor_id);
    end if;
  end loop;
  return new_product_id;
end;
$$;

create or replace function public.create_organization(
  organization_name text, organization_slug text, country_code text, currency_code text, organization_timezone text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid()); new_organization_id uuid; owner_membership_id uuid; owner_role_id uuid; default_business_id uuid;
begin
  if actor_id is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  insert into public.organizations (name,slug,country_code,currency_code,timezone,created_by)
  values (organization_name,organization_slug,upper(country_code),upper(currency_code),organization_timezone,actor_id) returning id into new_organization_id;
  insert into public.businesses (organization_id,name,business_type,created_by) values (new_organization_id,organization_name,'general',actor_id) returning id into default_business_id;
  insert into public.organization_members (organization_id,user_id,status,joined_at) values (new_organization_id,actor_id,'active',now()) returning id into owner_membership_id;
  insert into public.roles (organization_id,name,description,is_system) values (new_organization_id,'Owner','Organization owner with all capabilities',true) returning id into owner_role_id;
  insert into public.roles (organization_id,name,description,is_system) values
    (new_organization_id,'Administrator','Organization administrator',true),(new_organization_id,'Branch Manager','Branch-scoped operations manager',true),(new_organization_id,'Cashier','Restricted catalogue viewer',true);
  insert into public.role_permissions (organization_id,role_id,permission_id) select new_organization_id,owner_role_id,id from public.permissions;
  insert into public.role_permissions (organization_id,role_id,permission_id)
    select new_organization_id,role.id,permission.id from public.roles role cross join public.permissions permission where role.organization_id=new_organization_id and role.name='Administrator';
  insert into public.role_permissions (organization_id,role_id,permission_id)
    select new_organization_id,role.id,permission.id from public.roles role join public.permissions permission on permission.code in ('branches.view','branches.update','warehouses.view','warehouses.create','warehouses.update','warehouses.deactivate','storage_locations.view','storage_locations.create','storage_locations.update','storage_locations.deactivate','products.view','products.update','prices.view') where role.organization_id=new_organization_id and role.name='Branch Manager';
  insert into public.role_permissions (organization_id,role_id,permission_id)
    select new_organization_id,role.id,permission.id from public.roles role join public.permissions permission on permission.code in ('products.view','prices.view') where role.organization_id=new_organization_id and role.name='Cashier';
  insert into public.member_roles (organization_id,membership_id,role_id) values (new_organization_id,owner_membership_id,owner_role_id);
  insert into public.units_of_measure (organization_id,name,symbol,dimension,is_system,created_by) values
    (new_organization_id,'Piece','pc','COUNT',true,actor_id),(new_organization_id,'Unit','unit','COUNT',true,actor_id),(new_organization_id,'Pack','pack','COUNT',true,actor_id),(new_organization_id,'Carton','ctn','COUNT',true,actor_id),(new_organization_id,'Box','box','COUNT',true,actor_id),(new_organization_id,'Dozen','doz','COUNT',true,actor_id),(new_organization_id,'Gram','g','WEIGHT',true,actor_id),(new_organization_id,'Kilogram','kg','WEIGHT',true,actor_id),(new_organization_id,'Millilitre','ml','VOLUME',true,actor_id),(new_organization_id,'Litre','l','VOLUME',true,actor_id),(new_organization_id,'Metre','m','LENGTH',true,actor_id);
  insert into public.price_lists (organization_id,name,code,description,currency_code,is_default,created_by) values (new_organization_id,'Retail','RETAIL','Default retail selling prices',upper(currency_code),true,actor_id);
  return new_organization_id;
end;
$$;

revoke all on function public.generate_sku(uuid) from public;
revoke all on function public.create_simple_product(uuid,uuid,text,text,uuid,uuid,uuid,uuid,text,text,uuid,numeric,numeric,numeric,boolean,uuid) from public;
revoke all on function public.create_variant_product(uuid,uuid,text,text,uuid,uuid,uuid,boolean,numeric,uuid,jsonb,jsonb) from public;
grant execute on function public.generate_sku(uuid) to authenticated;
grant execute on function public.create_simple_product(uuid,uuid,text,text,uuid,uuid,uuid,uuid,text,text,uuid,numeric,numeric,numeric,boolean,uuid) to authenticated;
grant execute on function public.create_variant_product(uuid,uuid,text,text,uuid,uuid,uuid,boolean,numeric,uuid,jsonb,jsonb) to authenticated;


commit;
