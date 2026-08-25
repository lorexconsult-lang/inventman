begin;

create extension if not exists pgcrypto with schema extensions;

create type public.membership_status as enum ('invited', 'active', 'suspended', 'deactivated');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  timezone text not null,
  status text not null default 'active' check (status in ('trial', 'active', 'grace_period', 'suspended', 'cancelled')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint organizations_slug_key unique (slug)
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (length(trim(name)) between 2 and 160),
  trading_name text,
  business_type text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_org_id_key unique (organization_id, id)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  business_id uuid not null,
  name text not null check (length(trim(name)) between 2 and 160),
  code text not null check (length(trim(code)) between 1 and 30),
  timezone text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branches_business_fk foreign key (organization_id, business_id) references public.businesses(organization_id, id),
  constraint branches_org_id_key unique (organization_id, id),
  constraint branches_org_code_key unique (organization_id, code)
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  branch_id uuid not null,
  name text not null check (length(trim(name)) between 2 and 160),
  code text not null check (length(trim(code)) between 1 and 30),
  location_type text not null default 'stock' check (location_type in ('stock', 'shop_floor', 'returns', 'damaged', 'expired', 'transit', 'department')),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint warehouses_branch_fk foreign key (organization_id, branch_id) references public.branches(organization_id, id),
  constraint warehouses_org_id_key unique (organization_id, id),
  constraint warehouses_branch_code_key unique (branch_id, code)
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references auth.users(id),
  status public.membership_status not null default 'invited',
  invited_by uuid references auth.users(id),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_org_user_key unique (organization_id, user_id),
  constraint organization_members_org_id_key unique (organization_id, id),
  constraint active_members_have_joined check (status <> 'active' or joined_at is not null)
);

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  email text not null check (email = lower(trim(email)) and position('@' in email) > 1),
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitation_acceptance_consistent check (
    (status = 'accepted' and accepted_by is not null and accepted_at is not null)
    or (status <> 'accepted' and accepted_by is null and accepted_at is null)
  )
);

create unique index organization_invitations_pending_email_key
  on public.organization_invitations (organization_id, email)
  where status = 'pending';

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$'),
  description text not null,
  created_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null check (length(trim(name)) between 2 and 80),
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_org_id_key unique (organization_id, id),
  constraint roles_org_name_key unique nulls not distinct (organization_id, name)
);

create table public.role_permissions (
  organization_id uuid not null references public.organizations(id),
  role_id uuid not null,
  permission_id uuid not null references public.permissions(id),
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id),
  constraint role_permissions_role_fk foreign key (organization_id, role_id) references public.roles(organization_id, id)
);

create table public.member_roles (
  organization_id uuid not null references public.organizations(id),
  membership_id uuid not null,
  role_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (membership_id, role_id),
  constraint member_roles_membership_fk foreign key (organization_id, membership_id) references public.organization_members(organization_id, id),
  constraint member_roles_role_fk foreign key (organization_id, role_id) references public.roles(organization_id, id)
);

create table public.member_branch_access (
  organization_id uuid not null references public.organizations(id),
  membership_id uuid not null,
  branch_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (membership_id, branch_id),
  constraint member_branch_access_membership_fk foreign key (organization_id, membership_id) references public.organization_members(organization_id, id),
  constraint member_branch_access_branch_fk foreign key (organization_id, branch_id) references public.branches(organization_id, id)
);

create index organization_members_user_active_idx on public.organization_members (user_id, organization_id) where status = 'active';
create index businesses_org_status_idx on public.businesses (organization_id, status);
create index branches_org_status_idx on public.branches (organization_id, status);
create index warehouses_org_branch_status_idx on public.warehouses (organization_id, branch_id, status);
create index member_roles_org_membership_idx on public.member_roles (organization_id, membership_id);
create index role_permissions_org_role_idx on public.role_permissions (organization_id, role_id);
create index organization_invitations_org_status_idx on public.organization_invitations (organization_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses for each row execute function public.set_updated_at();
create trigger branches_set_updated_at before update on public.branches for each row execute function public.set_updated_at();
create trigger warehouses_set_updated_at before update on public.warehouses for each row execute function public.set_updated_at();
create trigger organization_members_set_updated_at before update on public.organization_members for each row execute function public.set_updated_at();
create trigger organization_invitations_set_updated_at before update on public.organization_invitations for each row execute function public.set_updated_at();
create trigger roles_set_updated_at before update on public.roles for each row execute function public.set_updated_at();

create or replace function public.is_active_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

create or replace function public.has_permission(target_organization_id uuid, permission_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    join public.member_roles assignment on assignment.membership_id = membership.id and assignment.organization_id = membership.organization_id
    join public.role_permissions grant_entry on grant_entry.role_id = assignment.role_id and grant_entry.organization_id = membership.organization_id
    join public.permissions permission on permission.id = grant_entry.permission_id
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and permission.code = permission_code
  );
$$;

create or replace function public.can_access_branch(target_organization_id uuid, target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_active_organization_member(target_organization_id)
    and (
      not exists (
        select 1
        from public.organization_members membership
        join public.member_branch_access access on access.membership_id = membership.id
          and access.organization_id = membership.organization_id
        where membership.organization_id = target_organization_id
          and membership.user_id = (select auth.uid())
          and membership.status = 'active'
      )
      or exists (
        select 1
        from public.organization_members membership
        join public.member_branch_access access on access.membership_id = membership.id
          and access.organization_id = membership.organization_id
        where membership.organization_id = target_organization_id
          and membership.user_id = (select auth.uid())
          and membership.status = 'active'
          and access.branch_id = target_branch_id
      )
    );
$$;

create or replace function public.can_grant_permission(target_organization_id uuid, target_permission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_permission(target_organization_id, 'roles.manage')
    and exists (
      select 1 from public.permissions permission
      where permission.id = target_permission_id
        and public.has_permission(target_organization_id, permission.code)
    );
$$;

create or replace function public.can_assign_role(target_organization_id uuid, target_role_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_permission(target_organization_id, 'roles.manage')
    and not exists (
      select 1
      from public.role_permissions grant_entry
      join public.permissions permission on permission.id = grant_entry.permission_id
      where grant_entry.organization_id = target_organization_id
        and grant_entry.role_id = target_role_id
        and not public.has_permission(target_organization_id, permission.code)
    );
$$;

revoke all on function public.is_active_organization_member(uuid) from public;
revoke all on function public.has_permission(uuid, text) from public;
grant execute on function public.is_active_organization_member(uuid) to authenticated;
grant execute on function public.has_permission(uuid, text) to authenticated;
revoke all on function public.can_access_branch(uuid, uuid) from public;
revoke all on function public.can_grant_permission(uuid, uuid) from public;
revoke all on function public.can_assign_role(uuid, uuid) from public;
grant execute on function public.can_access_branch(uuid, uuid) to authenticated;
grant execute on function public.can_grant_permission(uuid, uuid) to authenticated;
grant execute on function public.can_assign_role(uuid, uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.organizations force row level security;
alter table public.businesses enable row level security;
alter table public.businesses force row level security;
alter table public.branches enable row level security;
alter table public.branches force row level security;
alter table public.warehouses enable row level security;
alter table public.warehouses force row level security;
alter table public.organization_members enable row level security;
alter table public.organization_members force row level security;
alter table public.organization_invitations enable row level security;
alter table public.organization_invitations force row level security;
alter table public.permissions enable row level security;
alter table public.permissions force row level security;
alter table public.roles enable row level security;
alter table public.roles force row level security;
alter table public.role_permissions enable row level security;
alter table public.role_permissions force row level security;
alter table public.member_roles enable row level security;
alter table public.member_roles force row level security;
alter table public.member_branch_access enable row level security;
alter table public.member_branch_access force row level security;

create policy organizations_select_member on public.organizations for select to authenticated using (public.is_active_organization_member(id));
create policy businesses_select_member on public.businesses for select to authenticated using (public.is_active_organization_member(organization_id));
create policy branches_select_member on public.branches for select to authenticated using (public.can_access_branch(organization_id, id));
create policy warehouses_select_member on public.warehouses for select to authenticated using (public.can_access_branch(organization_id, branch_id));
create policy members_select_self_or_manager on public.organization_members for select to authenticated using (user_id = (select auth.uid()) or public.has_permission(organization_id, 'users.manage'));
create policy invitations_select_manager_or_invitee on public.organization_invitations for select to authenticated
  using (public.has_permission(organization_id, 'users.manage') or email = lower((select auth.jwt() ->> 'email')));
create policy permissions_select_authenticated on public.permissions for select to authenticated using (true);
create policy roles_select_member on public.roles for select to authenticated using (public.is_active_organization_member(organization_id));
create policy role_permissions_select_member on public.role_permissions for select to authenticated using (public.is_active_organization_member(organization_id));
create policy member_roles_select_member on public.member_roles for select to authenticated using (public.is_active_organization_member(organization_id));
create policy branch_access_select_member on public.member_branch_access for select to authenticated using (public.is_active_organization_member(organization_id));

create policy organizations_update_manager on public.organizations for update to authenticated
  using (public.has_permission(id, 'organizations.manage'))
  with check (public.has_permission(id, 'organizations.manage'));
create policy businesses_manage on public.businesses for all to authenticated
  using (public.has_permission(organization_id, 'organizations.manage'))
  with check (public.has_permission(organization_id, 'organizations.manage'));
create policy branches_manage on public.branches for all to authenticated
  using (public.has_permission(organization_id, 'branches.manage') and public.can_access_branch(organization_id, id))
  with check (public.has_permission(organization_id, 'branches.manage') and public.can_access_branch(organization_id, id));
create policy warehouses_manage on public.warehouses for all to authenticated
  using (public.has_permission(organization_id, 'warehouses.manage') and public.can_access_branch(organization_id, branch_id))
  with check (public.has_permission(organization_id, 'warehouses.manage') and public.can_access_branch(organization_id, branch_id));
create policy members_manage on public.organization_members for all to authenticated
  using (public.has_permission(organization_id, 'users.manage'))
  with check (public.has_permission(organization_id, 'users.manage'));
create policy invitations_manage on public.organization_invitations for all to authenticated
  using (public.has_permission(organization_id, 'users.manage'))
  with check (public.has_permission(organization_id, 'users.manage'));
create policy roles_manage on public.roles for all to authenticated
  using (public.has_permission(organization_id, 'roles.manage'))
  with check (public.has_permission(organization_id, 'roles.manage'));
create policy role_permissions_manage on public.role_permissions for all to authenticated
  using (public.can_grant_permission(organization_id, permission_id))
  with check (public.can_grant_permission(organization_id, permission_id));
create policy member_roles_manage on public.member_roles for all to authenticated
  using (public.can_assign_role(organization_id, role_id))
  with check (public.can_assign_role(organization_id, role_id));
create policy branch_access_manage on public.member_branch_access for all to authenticated
  using (public.has_permission(organization_id, 'users.manage'))
  with check (public.has_permission(organization_id, 'users.manage'));

insert into public.permissions (code, description) values
  ('organizations.manage', 'Manage organization settings'),
  ('users.manage', 'Invite and administer organization members'),
  ('roles.manage', 'Create roles and assign capabilities'),
  ('branches.manage', 'Create and administer branches'),
  ('warehouses.manage', 'Create and administer stock locations');

create or replace function public.create_organization(
  organization_name text,
  organization_slug text,
  country_code text,
  currency_code text,
  organization_timezone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  new_organization_id uuid;
  owner_membership_id uuid;
  owner_role_id uuid;
begin
  if actor_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  insert into public.organizations (name, slug, country_code, currency_code, timezone, created_by)
  values (organization_name, organization_slug, upper(country_code), upper(currency_code), organization_timezone, actor_id)
  returning id into new_organization_id;

  insert into public.organization_members (organization_id, user_id, status, joined_at)
  values (new_organization_id, actor_id, 'active', now())
  returning id into owner_membership_id;

  insert into public.roles (organization_id, name, description, is_system)
  values (new_organization_id, 'Owner', 'Organization owner with all available capabilities', true)
  returning id into owner_role_id;

  insert into public.role_permissions (organization_id, role_id, permission_id)
  select new_organization_id, owner_role_id, permission.id from public.permissions permission;

  insert into public.member_roles (organization_id, membership_id, role_id)
  values (new_organization_id, owner_membership_id, owner_role_id);

  return new_organization_id;
end;
$$;

revoke all on function public.create_organization(text, text, text, text, text) from public;
grant execute on function public.create_organization(text, text, text, text, text) to authenticated;

commit;
