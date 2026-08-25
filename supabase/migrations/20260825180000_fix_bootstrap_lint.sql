begin;

create or replace function public.create_organization(
  organization_name text, organization_slug text, country_code text, currency_code text, organization_timezone text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := (select auth.uid()); new_organization_id uuid; owner_membership_id uuid; owner_role_id uuid;
begin
  if actor_id is null then raise exception 'authentication_required' using errcode = '42501'; end if;
  insert into public.organizations (name,slug,country_code,currency_code,timezone,created_by)
  values (organization_name,organization_slug,upper(country_code),upper(currency_code),organization_timezone,actor_id) returning id into new_organization_id;
  insert into public.businesses (organization_id,name,business_type,created_by) values (new_organization_id,organization_name,'general',actor_id);
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

commit;
