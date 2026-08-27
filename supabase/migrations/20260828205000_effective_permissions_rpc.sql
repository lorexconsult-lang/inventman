create or replace function public.get_effective_permissions(target_organization_id uuid)
returns text[] language sql stable security definer set search_path='' as $$
 select coalesce(array_agg(distinct p.code order by p.code),'{}')
 from public.organization_members m
 join public.member_roles mr on mr.organization_id=m.organization_id and mr.membership_id=m.id
 join public.roles r on r.organization_id=mr.organization_id and r.id=mr.role_id and r.is_active
 join public.role_permissions rp on rp.organization_id=r.organization_id and rp.role_id=r.id
 join public.permissions p on p.id=rp.permission_id
 where m.organization_id=target_organization_id and m.user_id=auth.uid() and m.status='active'
$$;
revoke all on function public.get_effective_permissions(uuid) from public,anon;
grant execute on function public.get_effective_permissions(uuid) to authenticated;
