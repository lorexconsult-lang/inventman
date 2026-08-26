-- Phase 4 UI stabilization: editable customer/draft quotation boundaries and
-- authoritative price/discount override enforcement.

create or replace function public.guard_sales_line_override()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  quote public.sales_quotations%rowtype;
  resolved_price numeric;
begin
  if tg_table_name = 'sales_quotation_lines' then
    select * into quote
    from public.sales_quotations
    where organization_id = new.organization_id and id = new.quotation_id;

    if quote.id is null then
      raise exception using errcode = 'P0001', message = 'CROSS_TENANT_REFERENCE';
    end if;

    resolved_price := public.resolve_sales_price(
      new.organization_id,
      quote.price_list_id,
      quote.branch_id,
      new.product_variant_id,
      new.packaging_id,
      new.entered_quantity
    );

    if new.unit_price is distinct from resolved_price
      and not public.has_permission(new.organization_id, 'sales.price_override') then
      raise exception using errcode = '42501', message = 'PRICE_OVERRIDE_NOT_AUTHORIZED';
    end if;

    if new.discount > 0
      and not public.has_permission(new.organization_id, 'sales.discount_override') then
      raise exception using errcode = '42501', message = 'DISCOUNT_OVERRIDE_NOT_AUTHORIZED';
    end if;
  end if;

  return new;
end
$$;

drop trigger if exists sales_quotation_lines_override_guard on public.sales_quotation_lines;
create trigger sales_quotation_lines_override_guard
before insert or update of unit_price, discount, entered_quantity, packaging_id
on public.sales_quotation_lines
for each row execute function public.guard_sales_line_override();

revoke all on function public.guard_sales_line_override() from public, anon, authenticated;

create or replace function public.update_customer(
  target_organization_id uuid,
  target_customer_id uuid,
  target_customer jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  existing public.customers%rowtype;
  requested_credit_limit numeric;
  requested_credit_status text;
begin
  if actor is null or not public.has_permission(target_organization_id, 'customers.update') then
    raise exception using errcode = '42501', message = 'PERMISSION_DENIED';
  end if;

  select * into existing
  from public.customers
  where organization_id = target_organization_id and id = target_customer_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'CROSS_TENANT_REFERENCE';
  end if;

  requested_credit_limit := coalesce(nullif(target_customer ->> 'credit_limit', '')::numeric, existing.credit_limit);
  requested_credit_status := coalesce(nullif(target_customer ->> 'credit_status', ''), existing.credit_status);

  if (requested_credit_limit is distinct from existing.credit_limit
      or requested_credit_status is distinct from existing.credit_status)
     and not public.has_permission(target_organization_id, 'customers.credit_manage') then
    raise exception using errcode = '42501', message = 'CREDIT_MANAGEMENT_NOT_AUTHORIZED';
  end if;

  update public.customers set
    customer_type = coalesce(nullif(target_customer ->> 'customer_type', ''), customer_type),
    display_name = coalesce(nullif(trim(target_customer ->> 'display_name'), ''), display_name),
    legal_name = nullif(trim(target_customer ->> 'legal_name'), ''),
    first_name = nullif(trim(target_customer ->> 'first_name'), ''),
    last_name = nullif(trim(target_customer ->> 'last_name'), ''),
    email = nullif(trim(target_customer ->> 'email'), ''),
    phone = nullif(trim(target_customer ->> 'phone'), ''),
    tax_number = nullif(trim(target_customer ->> 'tax_number'), ''),
    registration_number = nullif(trim(target_customer ->> 'registration_number'), ''),
    default_currency = coalesce(nullif(target_customer ->> 'default_currency', ''), default_currency),
    default_price_list_id = nullif(target_customer ->> 'default_price_list_id', '')::uuid,
    default_payment_terms = nullif(trim(target_customer ->> 'default_payment_terms'), ''),
    credit_limit = requested_credit_limit,
    credit_status = requested_credit_status,
    status = coalesce(nullif(target_customer ->> 'status', ''), status),
    notes = nullif(trim(target_customer ->> 'notes'), ''),
    updated_at = now()
  where organization_id = target_organization_id and id = target_customer_id;

  insert into public.sales_activity(organization_id, document_type, document_id, action, actor_id)
  values(target_organization_id, 'CUSTOMER', target_customer_id, 'UPDATED', actor);
  return target_customer_id;
exception when foreign_key_violation then
  raise exception using errcode = 'P0001', message = 'CROSS_TENANT_REFERENCE';
end
$$;

create or replace function public.update_sales_quotation(
  target_organization_id uuid,
  target_quotation_id uuid,
  target_expiry_date date,
  target_billing_address jsonb,
  target_delivery_address jsonb,
  target_lines jsonb,
  target_notes text,
  target_terms text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  quote public.sales_quotations%rowtype;
  actor uuid;
  item record;
  package record;
  price numeric;
  line_total numeric;
  calculated_subtotal numeric := 0;
  calculated_discount numeric := 0;
  calculated_tax numeric := 0;
begin
  select * into quote
  from public.sales_quotations
  where organization_id = target_organization_id and id = target_quotation_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'CROSS_TENANT_REFERENCE';
  end if;
  actor := public.sales_assert_access(target_organization_id, quote.branch_id, 'sales.quotation_update');
  if quote.status not in ('DRAFT', 'REJECTED') then
    raise exception using errcode = 'P0001', message = 'INVALID_QUOTATION_STATE';
  end if;
  if jsonb_typeof(target_lines) <> 'array' or jsonb_array_length(target_lines) = 0 then
    raise exception using errcode = '22023', message = 'INVALID_LINES';
  end if;

  delete from public.sales_quotation_lines
  where organization_id = target_organization_id and quotation_id = quote.id;

  for item in select value from jsonb_array_elements(target_lines) loop
    select p.id, p.product_variant_id, p.conversion_to_base, v.name, v.sku
    into package
    from public.product_variant_packaging p
    join public.product_variants v on v.organization_id = p.organization_id and v.id = p.product_variant_id
    where p.organization_id = target_organization_id
      and p.id = (item.value ->> 'packaging_id')::uuid
      and p.product_variant_id = (item.value ->> 'product_variant_id')::uuid
      and p.is_active and p.can_sell and v.status = 'ACTIVE';
    if not found then
      raise exception using errcode = 'P0001', message = 'CROSS_TENANT_REFERENCE';
    end if;

    price := coalesce(
      nullif(item.value ->> 'unit_price', '')::numeric,
      public.resolve_sales_price(target_organization_id, quote.price_list_id, quote.branch_id, package.product_variant_id, package.id, (item.value ->> 'quantity')::numeric)
    );
    line_total := round(price * (item.value ->> 'quantity')::numeric - coalesce((item.value ->> 'discount')::numeric, 0) + coalesce((item.value ->> 'tax')::numeric, 0), 4);
    calculated_subtotal := calculated_subtotal + round(price * (item.value ->> 'quantity')::numeric, 4);
    calculated_discount := calculated_discount + coalesce((item.value ->> 'discount')::numeric, 0);
    calculated_tax := calculated_tax + coalesce((item.value ->> 'tax')::numeric, 0);

    insert into public.sales_quotation_lines(
      organization_id, quotation_id, product_variant_id, packaging_id,
      description_snapshot, sku_snapshot, entered_quantity, conversion_snapshot,
      base_quantity, unit_price, minimum_price_snapshot, discount, tax, line_total
    ) values(
      target_organization_id, quote.id, package.product_variant_id, package.id,
      coalesce(nullif(item.value ->> 'description', ''), package.name), coalesce(package.sku, ''),
      (item.value ->> 'quantity')::numeric, package.conversion_to_base,
      round((item.value ->> 'quantity')::numeric * package.conversion_to_base, 6),
      price, public.resolve_sales_price(target_organization_id, quote.price_list_id, quote.branch_id, package.product_variant_id, package.id, (item.value ->> 'quantity')::numeric),
      coalesce((item.value ->> 'discount')::numeric, 0), coalesce((item.value ->> 'tax')::numeric, 0), line_total
    );
  end loop;

  update public.sales_quotations set
    status = 'DRAFT', expiry_date = target_expiry_date,
    billing_address_snapshot = target_billing_address,
    delivery_address_snapshot = target_delivery_address,
    subtotal = calculated_subtotal, discount = calculated_discount, tax = calculated_tax,
    total = calculated_subtotal - calculated_discount + calculated_tax,
    base_currency_total = round((calculated_subtotal - calculated_discount + calculated_tax) * exchange_rate, 4),
    notes = target_notes, terms = target_terms, updated_at = now()
  where organization_id = target_organization_id and id = quote.id;

  insert into public.sales_activity(organization_id, document_type, document_id, action, actor_id)
  values(target_organization_id, 'QUOTATION', quote.id, 'UPDATED', actor);
  return quote.id;
end
$$;

revoke all on function public.update_customer(uuid, uuid, jsonb) from public, anon;
revoke all on function public.update_sales_quotation(uuid, uuid, date, jsonb, jsonb, jsonb, text, text) from public, anon;
grant execute on function public.update_customer(uuid, uuid, jsonb) to authenticated;
grant execute on function public.update_sales_quotation(uuid, uuid, date, jsonb, jsonb, jsonb, text, text) to authenticated;
