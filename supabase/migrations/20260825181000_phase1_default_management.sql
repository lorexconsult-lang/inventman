begin;

create or replace function public.create_warehouse(
  target_branch_id uuid, warehouse_name text, warehouse_code text, target_warehouse_type text,
  warehouse_description text, make_default boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid()); branch_row record; new_warehouse_id uuid; resolved_default boolean;
begin
  select id,organization_id,business_id into branch_row from public.branches where id=target_branch_id;
  if actor_id is null or not found or not public.has_permission(branch_row.organization_id,'warehouses.create')
    or not public.can_access_branch(branch_row.organization_id,target_branch_id) then
    raise exception 'permission_denied' using errcode='42501';
  end if;
  resolved_default := make_default or not exists (select 1 from public.warehouses where branch_id=target_branch_id and is_default);
  if resolved_default then update public.warehouses set is_default=false where branch_id=target_branch_id and is_default; end if;
  insert into public.warehouses (organization_id,business_id,branch_id,name,code,warehouse_type,description,is_default,created_by)
  values (branch_row.organization_id,branch_row.business_id,target_branch_id,trim(warehouse_name),upper(trim(warehouse_code)),target_warehouse_type,warehouse_description,resolved_default,actor_id)
  returning id into new_warehouse_id;
  if resolved_default then update public.branches set default_warehouse_id=new_warehouse_id where id=target_branch_id; end if;
  return new_warehouse_id;
end;
$$;

create or replace function public.set_default_warehouse(target_branch_id uuid, target_warehouse_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare branch_row record;
begin
  select id,organization_id into branch_row from public.branches where id=target_branch_id;
  if not found or not public.has_permission(branch_row.organization_id,'warehouses.update')
    or not public.can_access_branch(branch_row.organization_id,target_branch_id) then raise exception 'permission_denied' using errcode='42501'; end if;
  if not exists (select 1 from public.warehouses where id=target_warehouse_id and branch_id=target_branch_id and organization_id=branch_row.organization_id and status='active') then
    raise exception 'invalid_default_warehouse' using errcode='23514';
  end if;
  update public.warehouses set is_default=(id=target_warehouse_id) where branch_id=target_branch_id;
  update public.branches set default_warehouse_id=target_warehouse_id where id=target_branch_id;
end;
$$;

create or replace function public.set_default_price_list(target_organization_id uuid, target_price_list_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_permission(target_organization_id,'prices.manage') then raise exception 'permission_denied' using errcode='42501'; end if;
  if not exists (select 1 from public.price_lists where id=target_price_list_id and organization_id=target_organization_id and is_active) then
    raise exception 'invalid_default_price_list' using errcode='23514';
  end if;
  update public.price_lists set is_default=(id=target_price_list_id) where organization_id=target_organization_id;
end;
$$;

revoke all on function public.create_warehouse(uuid,text,text,text,text,boolean) from public;
revoke all on function public.set_default_warehouse(uuid,uuid) from public;
revoke all on function public.set_default_price_list(uuid,uuid) from public;
grant execute on function public.create_warehouse(uuid,text,text,text,text,boolean) to authenticated;
grant execute on function public.set_default_warehouse(uuid,uuid) to authenticated;
grant execute on function public.set_default_price_list(uuid,uuid) to authenticated;

commit;
