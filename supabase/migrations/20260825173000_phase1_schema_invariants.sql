begin;

create extension if not exists pg_trgm with schema extensions;

-- Existing organization hierarchy is extended in place.
alter table public.businesses add column if not exists created_by uuid references auth.users(id);
update public.businesses set created_by = organization.created_by
from public.organizations organization
where public.businesses.organization_id = organization.id and public.businesses.created_by is null;
alter table public.businesses alter column created_by set not null;

insert into public.businesses (organization_id, name, business_type, created_by)
select organization.id, organization.name, 'general', organization.created_by
from public.organizations organization
where not exists (select 1 from public.businesses business where business.organization_id = organization.id);

alter table public.branches
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists address_line_1 text,
  add column if not exists address_line_2 text,
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists postal_code text,
  add column if not exists country_code text,
  add column if not exists currency_code text,
  add column if not exists default_warehouse_id uuid,
  add column if not exists default_price_list_id uuid,
  add column if not exists created_by uuid references auth.users(id);
update public.branches set created_by = organization.created_by
from public.organizations organization
where public.branches.organization_id = organization.id and public.branches.created_by is null;
alter table public.branches alter column created_by set not null;
alter table public.branches add constraint branches_country_code_format check (country_code is null or country_code ~ '^[A-Z]{2}$');
alter table public.branches add constraint branches_currency_code_format check (currency_code is null or currency_code ~ '^[A-Z]{3}$');

alter table public.warehouses
  rename column location_type to warehouse_type;
alter table public.warehouses
  add column if not exists business_id uuid,
  add column if not exists description text,
  add column if not exists address_line_1 text,
  add column if not exists address_line_2 text,
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists postal_code text,
  add column if not exists country_code text,
  add column if not exists is_default boolean not null default false,
  add column if not exists created_by uuid references auth.users(id);
update public.warehouses warehouse set
  business_id = branch.business_id,
  created_by = organization.created_by,
  warehouse_type = case warehouse.warehouse_type
    when 'stock' then 'MAIN'
    when 'shop_floor' then 'SHOP_FLOOR'
    when 'returns' then 'RETURNS'
    when 'damaged' then 'DAMAGED'
    when 'expired' then 'EXPIRED'
    when 'transit' then 'TRANSIT'
    else 'OTHER'
  end
from public.branches branch, public.organizations organization
where warehouse.branch_id = branch.id and warehouse.organization_id = organization.id;
alter table public.warehouses alter column business_id set not null;
alter table public.warehouses alter column created_by set not null;
alter table public.warehouses alter column warehouse_type set default 'MAIN';
alter table public.warehouses drop constraint if exists warehouses_location_type_check;
alter table public.warehouses add constraint warehouses_type_check check (warehouse_type in ('MAIN','SHOP_FLOOR','DISTRIBUTION','RETURNS','DAMAGED','EXPIRED','PRODUCTION','TRANSIT','OTHER'));
alter table public.warehouses add constraint warehouses_country_code_format check (country_code is null or country_code ~ '^[A-Z]{2}$');
alter table public.warehouses add constraint warehouses_business_fk foreign key (organization_id, business_id) references public.businesses(organization_id, id);
create unique index warehouses_one_default_per_branch on public.warehouses (branch_id) where is_default;

create table public.storage_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  branch_id uuid not null,
  warehouse_id uuid not null,
  parent_location_id uuid,
  name text not null check (length(trim(name)) between 1 and 120),
  code text not null check (length(trim(code)) between 1 and 40),
  location_type text not null check (location_type in ('ROOT','ZONE','AISLE','RACK','SHELF','BIN','OTHER')),
  description text,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storage_locations_org_id_key unique (organization_id, id),
  constraint storage_locations_warehouse_fk foreign key (organization_id, warehouse_id) references public.warehouses(organization_id, id),
  constraint storage_locations_branch_fk foreign key (organization_id, branch_id) references public.branches(organization_id, id),
  constraint storage_locations_parent_fk foreign key (organization_id, parent_location_id) references public.storage_locations(organization_id, id),
  constraint storage_locations_warehouse_code_key unique (warehouse_id, code),
  constraint storage_root_shape check ((location_type = 'ROOT' and parent_location_id is null) or location_type <> 'ROOT')
);
create unique index storage_locations_one_root_per_warehouse on public.storage_locations (warehouse_id) where location_type = 'ROOT';

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  parent_id uuid,
  name text not null check (length(trim(name)) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  image_path text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_categories_org_id_key unique (organization_id, id),
  constraint product_categories_parent_fk foreign key (organization_id, parent_id) references public.product_categories(organization_id, id),
  constraint product_categories_org_slug_key unique (organization_id, slug)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (length(trim(name)) between 1 and 120),
  description text,
  logo_path text,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_org_id_key unique (organization_id, id)
);
create unique index brands_org_name_key on public.brands (organization_id, lower(name));

create table public.units_of_measure (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (length(trim(name)) between 1 and 80),
  symbol text not null check (length(trim(symbol)) between 1 and 20),
  dimension text not null check (dimension in ('COUNT','WEIGHT','VOLUME','LENGTH','AREA','OTHER')),
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint units_of_measure_org_id_key unique (organization_id, id)
);
create unique index units_of_measure_org_name_key on public.units_of_measure (organization_id, lower(name));
create unique index units_of_measure_org_symbol_key on public.units_of_measure (organization_id, lower(symbol));

create table public.tax_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (length(trim(name)) between 1 and 100),
  code text not null check (length(trim(code)) between 1 and 30),
  rate numeric(9,6) not null check (rate between 0 and 100),
  calculation text not null default 'EXCLUSIVE' check (calculation in ('INCLUSIVE','EXCLUSIVE')),
  tax_treatment text not null default 'STANDARD' check (tax_treatment in ('STANDARD','ZERO_RATED','EXEMPT')),
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tax_profiles_org_id_key unique (organization_id, id),
  constraint tax_profiles_org_code_key unique (organization_id, code),
  constraint tax_treatment_rate check (tax_treatment = 'STANDARD' or rate = 0)
);

create table public.price_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (length(trim(name)) between 1 and 100),
  code text not null check (length(trim(code)) between 1 and 30),
  description text,
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_lists_org_id_key unique (organization_id, id),
  constraint price_lists_org_code_key unique (organization_id, code)
);
create unique index price_lists_one_default_per_org on public.price_lists (organization_id) where is_default;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  business_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 180),
  description text,
  category_id uuid,
  brand_id uuid,
  product_type text not null check (product_type in ('STOCKED_PRODUCT','NON_STOCKED_PRODUCT','SERVICE','BUNDLE','RECIPE','SERIALIZED_PRODUCT','BATCH_CONTROLLED_PRODUCT','PERISHABLE_PRODUCT')),
  tax_profile_id uuid,
  track_inventory boolean not null default true,
  batch_tracking boolean not null default false,
  serial_tracking boolean not null default false,
  expiry_tracking boolean not null default false,
  allow_negative_stock boolean not null default false,
  reference_cost numeric(20,4) check (reference_cost is null or reference_cost >= 0),
  status text not null default 'DRAFT' check (status in ('DRAFT','ACTIVE','INACTIVE','ARCHIVED')),
  archived_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_org_id_key unique (organization_id, id),
  constraint products_business_fk foreign key (organization_id, business_id) references public.businesses(organization_id, id),
  constraint products_category_fk foreign key (organization_id, category_id) references public.product_categories(organization_id, id),
  constraint products_brand_fk foreign key (organization_id, brand_id) references public.brands(organization_id, id),
  constraint products_tax_profile_fk foreign key (organization_id, tax_profile_id) references public.tax_profiles(organization_id, id),
  constraint products_archive_consistent check ((status = 'ARCHIVED' and archived_at is not null) or (status <> 'ARCHIVED' and archived_at is null)),
  constraint product_tracking_consistent check (
    (product_type <> 'SERVICE' or track_inventory = false)
    and (not serial_tracking or track_inventory)
    and (not batch_tracking or track_inventory)
    and (not expiry_tracking or track_inventory)
  )
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  product_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 180),
  sku text,
  internal_code text,
  manufacturer_part_number text,
  option_signature text,
  weight numeric(20,6) check (weight is null or weight >= 0),
  length numeric(20,6) check (length is null or length >= 0),
  width numeric(20,6) check (width is null or width >= 0),
  height numeric(20,6) check (height is null or height >= 0),
  reorder_point numeric(20,6) check (reorder_point is null or reorder_point >= 0),
  reorder_quantity numeric(20,6) check (reorder_quantity is null or reorder_quantity >= 0),
  safety_stock numeric(20,6) check (safety_stock is null or safety_stock >= 0),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE','ARCHIVED')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_org_id_key unique (organization_id, id),
  constraint product_variants_product_fk foreign key (organization_id, product_id) references public.products(organization_id, id),
  constraint product_variants_archive_consistent check ((status = 'ARCHIVED' and archived_at is not null) or (status <> 'ARCHIVED' and archived_at is null))
);
create unique index product_variants_org_sku_key on public.product_variants (organization_id, lower(sku)) where sku is not null;
create unique index product_variants_org_internal_code_key on public.product_variants (organization_id, lower(internal_code)) where internal_code is not null;
create unique index product_variants_option_signature_key on public.product_variants (product_id, option_signature) where option_signature is not null;

create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  product_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 80),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_options_org_id_key unique (organization_id, id),
  constraint product_options_product_fk foreign key (organization_id, product_id) references public.products(organization_id, id)
);
create unique index product_options_product_name_key on public.product_options (product_id, lower(name));

create table public.product_option_values (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  product_option_id uuid not null,
  value text not null check (length(trim(value)) between 1 and 100),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_option_values_org_id_key unique (organization_id, id),
  constraint product_option_values_option_fk foreign key (organization_id, product_option_id) references public.product_options(organization_id, id)
);
create unique index product_option_values_option_value_key on public.product_option_values (product_option_id, lower(value));

create table public.variant_option_values (
  organization_id uuid not null references public.organizations(id),
  product_variant_id uuid not null,
  product_option_id uuid not null,
  product_option_value_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (product_variant_id, product_option_id),
  constraint variant_option_values_variant_fk foreign key (organization_id, product_variant_id) references public.product_variants(organization_id, id),
  constraint variant_option_values_option_fk foreign key (organization_id, product_option_id) references public.product_options(organization_id, id),
  constraint variant_option_values_value_fk foreign key (organization_id, product_option_value_id) references public.product_option_values(organization_id, id)
);

create table public.product_variant_packaging (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  product_variant_id uuid not null,
  unit_of_measure_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 100),
  conversion_to_base numeric(20,6) not null check (conversion_to_base > 0),
  is_base_unit boolean not null default false,
  can_purchase boolean not null default false,
  can_sell boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variant_packaging_org_id_key unique (organization_id, id),
  constraint product_variant_packaging_variant_fk foreign key (organization_id, product_variant_id) references public.product_variants(organization_id, id),
  constraint product_variant_packaging_unit_fk foreign key (organization_id, unit_of_measure_id) references public.units_of_measure(organization_id, id),
  constraint base_packaging_conversion check (not is_base_unit or conversion_to_base = 1),
  constraint product_variant_packaging_variant_unit_key unique (product_variant_id, unit_of_measure_id)
);
create unique index product_variant_packaging_one_base on public.product_variant_packaging (product_variant_id) where is_base_unit;

create table public.product_barcodes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  product_variant_id uuid not null,
  packaging_id uuid,
  barcode text not null check (length(trim(barcode)) between 3 and 100),
  barcode_type text not null default 'CUSTOM' check (barcode_type in ('EAN8','EAN13','UPC_A','UPC_E','CODE39','CODE128','ISBN','GTIN','CUSTOM')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_barcodes_variant_fk foreign key (organization_id, product_variant_id) references public.product_variants(organization_id, id),
  constraint product_barcodes_packaging_fk foreign key (organization_id, packaging_id) references public.product_variant_packaging(organization_id, id),
  constraint product_barcodes_org_barcode_key unique (organization_id, barcode)
);
create unique index product_barcodes_one_primary_per_variant on public.product_barcodes (product_variant_id) where is_primary;

create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  price_list_id uuid not null,
  product_variant_id uuid not null,
  packaging_id uuid not null,
  branch_id uuid,
  min_quantity numeric(20,6) not null default 1 check (min_quantity > 0),
  amount numeric(20,4) not null check (amount >= 0),
  effective_from timestamptz,
  effective_to timestamptz,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_prices_org_id_key unique (organization_id, id),
  constraint product_prices_price_list_fk foreign key (organization_id, price_list_id) references public.price_lists(organization_id, id),
  constraint product_prices_variant_fk foreign key (organization_id, product_variant_id) references public.product_variants(organization_id, id),
  constraint product_prices_packaging_fk foreign key (organization_id, packaging_id) references public.product_variant_packaging(organization_id, id),
  constraint product_prices_branch_fk foreign key (organization_id, branch_id) references public.branches(organization_id, id),
  constraint product_prices_date_range check (effective_to is null or effective_from is null or effective_to > effective_from)
);
create unique index product_prices_deterministic_key on public.product_prices
  (organization_id, price_list_id, product_variant_id, packaging_id, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), min_quantity, coalesce(effective_from, '-infinity'::timestamptz));

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  product_id uuid not null,
  product_variant_id uuid,
  storage_path text not null,
  alt_text text,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/avif')),
  byte_size bigint not null check (byte_size between 1 and 5242880),
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint product_images_product_fk foreign key (organization_id, product_id) references public.products(organization_id, id),
  constraint product_images_variant_fk foreign key (organization_id, product_variant_id) references public.product_variants(organization_id, id),
  constraint product_images_path_scope check (storage_path like organization_id::text || '/products/%'),
  constraint product_images_org_path_key unique (organization_id, storage_path)
);
create unique index product_images_one_primary_per_product on public.product_images (product_id) where is_primary and product_variant_id is null;

create table public.sku_counters (
  organization_id uuid primary key references public.organizations(id),
  next_value bigint not null default 1 check (next_value > 0),
  prefix text not null default 'SKU' check (prefix ~ '^[A-Z0-9-]{1,20}$'),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id),
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table public.catalogue_import_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  status text not null default 'VALIDATED' check (status in ('VALIDATED','PROCESSING','COMPLETED','COMPLETED_WITH_ERRORS','FAILED')),
  file_name text not null,
  total_rows integer not null check (total_rows >= 0),
  valid_rows integer not null check (valid_rows >= 0),
  error_rows integer not null check (error_rows >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index storage_locations_hierarchy_idx on public.storage_locations (organization_id, warehouse_id, parent_location_id, is_active);
create index product_categories_hierarchy_idx on public.product_categories (organization_id, parent_id, sort_order) where is_active;
create index products_catalogue_idx on public.products (organization_id, status, created_at desc);
create index products_category_idx on public.products (organization_id, category_id, status);
create index products_brand_idx on public.products (organization_id, brand_id, status);
create index products_name_trgm_idx on public.products using gin (lower(name) extensions.gin_trgm_ops);
create index product_variants_product_idx on public.product_variants (organization_id, product_id, status);
create index product_barcodes_lookup_idx on public.product_barcodes (organization_id, barcode);
create index product_prices_lookup_idx on public.product_prices (organization_id, product_variant_id, packaging_id, price_list_id, branch_id, min_quantity desc) where status = 'ACTIVE';
create index audit_events_entity_idx on public.audit_events (organization_id, entity_type, entity_id, created_at desc);

alter table public.branches add constraint branches_default_warehouse_fk
  foreign key (organization_id, default_warehouse_id) references public.warehouses(organization_id, id);
alter table public.branches add constraint branches_default_price_list_fk
  foreign key (organization_id, default_price_list_id) references public.price_lists(organization_id, id);

alter table public.products add column idempotency_key uuid;
create unique index products_org_idempotency_key on public.products (organization_id, idempotency_key) where idempotency_key is not null;

create or replace function public.validate_storage_location_hierarchy()
returns trigger language plpgsql security definer set search_path = '' as $$
declare parent_row record;
begin
  if new.parent_location_id is null then
    if new.location_type <> 'ROOT' then raise exception 'non_root_requires_parent' using errcode = '23514'; end if;
    return new;
  end if;
  if new.parent_location_id = new.id then raise exception 'storage_location_cycle' using errcode = '23514'; end if;
  select organization_id, branch_id, warehouse_id into parent_row
  from public.storage_locations where id = new.parent_location_id;
  if not found or parent_row.organization_id <> new.organization_id or parent_row.branch_id <> new.branch_id or parent_row.warehouse_id <> new.warehouse_id then
    raise exception 'storage_location_parent_scope_mismatch' using errcode = '23514';
  end if;
  if exists (
    with recursive ancestors as (
      select id, parent_location_id from public.storage_locations where id = new.parent_location_id
      union all
      select location.id, location.parent_location_id from public.storage_locations location
      join ancestors on location.id = ancestors.parent_location_id
    ) select 1 from ancestors where id = new.id
  ) then raise exception 'storage_location_cycle' using errcode = '23514'; end if;
  return new;
end;
$$;

create or replace function public.validate_category_hierarchy()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.parent_id is null then return new; end if;
  if new.parent_id = new.id then raise exception 'category_cycle' using errcode = '23514'; end if;
  if exists (
    with recursive ancestors as (
      select id, parent_id from public.product_categories where id = new.parent_id and organization_id = new.organization_id
      union all
      select category.id, category.parent_id from public.product_categories category
      join ancestors on category.id = ancestors.parent_id
      where category.organization_id = new.organization_id
    ) select 1 from ancestors where id = new.id
  ) then raise exception 'category_cycle' using errcode = '23514'; end if;
  return new;
end;
$$;

create or replace function public.validate_variant_option_assignment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.product_variants variant
    join public.product_options option on option.product_id = variant.product_id and option.organization_id = variant.organization_id
    join public.product_option_values option_value on option_value.product_option_id = option.id and option_value.organization_id = option.organization_id
    where variant.id = new.product_variant_id and variant.organization_id = new.organization_id
      and option.id = new.product_option_id and option_value.id = new.product_option_value_id
  ) then raise exception 'invalid_variant_option_assignment' using errcode = '23514'; end if;
  return new;
end;
$$;

create or replace function public.validate_variant_packaging_reference()
returns trigger language plpgsql security definer set search_path = '' as $$
declare packaging_variant_id uuid;
begin
  if new.packaging_id is null then return new; end if;
  select product_variant_id into packaging_variant_id from public.product_variant_packaging
  where id = new.packaging_id and organization_id = new.organization_id;
  if packaging_variant_id is distinct from new.product_variant_id then
    raise exception 'packaging_variant_mismatch' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.validate_product_image_variant()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.product_variant_id is not null and not exists (
    select 1 from public.product_variants variant where variant.id = new.product_variant_id
      and variant.product_id = new.product_id and variant.organization_id = new.organization_id
  ) then raise exception 'image_variant_product_mismatch' using errcode = '23514'; end if;
  return new;
end;
$$;

create or replace function public.validate_branch_defaults()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.default_warehouse_id is not null and not exists (
    select 1 from public.warehouses warehouse where warehouse.id=new.default_warehouse_id
      and warehouse.organization_id=new.organization_id and warehouse.branch_id=new.id
  ) then raise exception 'default_warehouse_branch_mismatch' using errcode='23514'; end if;
  return new;
end;
$$;

create or replace function public.ensure_warehouse_root_location()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.storage_locations (organization_id, branch_id, warehouse_id, name, code, location_type, description, created_by)
  values (new.organization_id, new.branch_id, new.id, 'Root', 'ROOT', 'ROOT', 'Default stock location', new.created_by);
  return new;
end;
$$;

create or replace function public.enforce_product_variant_exists()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_product_id uuid;
begin
  if tg_table_name = 'products' then target_product_id := coalesce(new.id,old.id);
  else target_product_id := coalesce(new.product_id,old.product_id); end if;
  if exists (select 1 from public.products where id = target_product_id)
    and not exists (select 1 from public.product_variants where product_id = target_product_id) then
    raise exception 'product_requires_variant' using errcode = '23514';
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.enforce_variant_base_packaging_exists()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_variant_id uuid;
begin
  if tg_table_name = 'product_variants' then target_variant_id := coalesce(new.id,old.id);
  else target_variant_id := coalesce(new.product_variant_id,old.product_variant_id); end if;
  if exists (select 1 from public.product_variants where id = target_variant_id)
    and (select count(*) from public.product_variant_packaging where product_variant_id = target_variant_id and is_base_unit) <> 1 then
    raise exception 'variant_requires_one_base_packaging' using errcode = '23514';
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.write_audit_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare old_row jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
declare new_row jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
declare organization_id_value uuid := coalesce((new_row ->> 'organization_id')::uuid, (old_row ->> 'organization_id')::uuid);
declare entity_id_value uuid := coalesce((new_row ->> 'id')::uuid, (old_row ->> 'id')::uuid);
begin
  insert into public.audit_events (organization_id, actor_id, action, entity_type, entity_id, before_data, after_data)
  values (organization_id_value, (select auth.uid()), tg_op, tg_table_name, entity_id_value, old_row, new_row);
  return coalesce(new, old);
end;
$$;

create or replace function public.enforce_lifecycle_permission()
returns trigger language plpgsql security definer set search_path = '' as $$
declare required_permission text;
begin
  if tg_table_name = 'products' then
    if old.status is distinct from new.status and (old.status = 'ARCHIVED' or new.status = 'ARCHIVED') then required_permission := 'products.archive'; end if;
  elsif tg_table_name = 'branches' then
    if old.status is distinct from new.status and new.status in ('inactive','archived') then required_permission := 'branches.deactivate'; end if;
  elsif tg_table_name = 'warehouses' then
    if old.status is distinct from new.status and new.status in ('inactive','archived') then required_permission := 'warehouses.deactivate'; end if;
  elsif tg_table_name = 'storage_locations' then
    if old.is_active and not new.is_active then required_permission := 'storage_locations.deactivate'; end if;
  end if;
  if required_permission is not null and not public.has_permission(new.organization_id, required_permission) then
    raise exception 'permission_denied' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger storage_locations_validate before insert or update on public.storage_locations for each row execute function public.validate_storage_location_hierarchy();
create trigger product_categories_validate before insert or update on public.product_categories for each row execute function public.validate_category_hierarchy();
create trigger variant_option_values_validate before insert or update on public.variant_option_values for each row execute function public.validate_variant_option_assignment();
create trigger product_barcodes_validate before insert or update on public.product_barcodes for each row execute function public.validate_variant_packaging_reference();
create trigger product_prices_validate before insert or update on public.product_prices for each row execute function public.validate_variant_packaging_reference();
create trigger product_images_validate before insert or update on public.product_images for each row execute function public.validate_product_image_variant();
create trigger branches_validate_defaults before insert or update on public.branches for each row execute function public.validate_branch_defaults();
create trigger warehouses_create_root after insert on public.warehouses for each row execute function public.ensure_warehouse_root_location();
create constraint trigger products_require_variant after insert or update on public.products deferrable initially deferred for each row execute function public.enforce_product_variant_exists();
create constraint trigger variants_still_required after delete on public.product_variants deferrable initially deferred for each row execute function public.enforce_product_variant_exists();
create constraint trigger variants_require_base_packaging after insert or update on public.product_variants deferrable initially deferred for each row execute function public.enforce_variant_base_packaging_exists();
create constraint trigger base_packaging_still_required after delete or update on public.product_variant_packaging deferrable initially deferred for each row execute function public.enforce_variant_base_packaging_exists();

create trigger storage_locations_set_updated_at before update on public.storage_locations for each row execute function public.set_updated_at();
create trigger product_categories_set_updated_at before update on public.product_categories for each row execute function public.set_updated_at();
create trigger brands_set_updated_at before update on public.brands for each row execute function public.set_updated_at();
create trigger units_of_measure_set_updated_at before update on public.units_of_measure for each row execute function public.set_updated_at();
create trigger tax_profiles_set_updated_at before update on public.tax_profiles for each row execute function public.set_updated_at();
create trigger price_lists_set_updated_at before update on public.price_lists for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
create trigger product_variant_packaging_set_updated_at before update on public.product_variant_packaging for each row execute function public.set_updated_at();
create trigger product_prices_set_updated_at before update on public.product_prices for each row execute function public.set_updated_at();

create trigger branches_audit after insert or update on public.branches for each row execute function public.write_audit_event();
create trigger warehouses_audit after insert or update on public.warehouses for each row execute function public.write_audit_event();
create trigger storage_locations_audit after insert or update on public.storage_locations for each row execute function public.write_audit_event();
create trigger products_audit after insert or update on public.products for each row execute function public.write_audit_event();
create trigger product_variants_audit after insert or update on public.product_variants for each row execute function public.write_audit_event();
create trigger product_variant_packaging_audit after insert or update on public.product_variant_packaging for each row execute function public.write_audit_event();
create trigger product_barcodes_audit after insert or update on public.product_barcodes for each row execute function public.write_audit_event();
create trigger product_prices_audit after insert or update on public.product_prices for each row execute function public.write_audit_event();
create trigger tax_profiles_audit after insert or update on public.tax_profiles for each row execute function public.write_audit_event();
create trigger branches_lifecycle before update on public.branches for each row execute function public.enforce_lifecycle_permission();
create trigger warehouses_lifecycle before update on public.warehouses for each row execute function public.enforce_lifecycle_permission();
create trigger storage_locations_lifecycle before update on public.storage_locations for each row execute function public.enforce_lifecycle_permission();
create trigger products_lifecycle before update on public.products for each row execute function public.enforce_lifecycle_permission();


commit;
