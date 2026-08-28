create policy organizations_platform_admin_read on public.organizations for select to authenticated using(public.is_platform_admin('platform.tenants.view'));
create policy organization_members_platform_admin_read on public.organization_members for select to authenticated using(public.is_platform_admin('platform.tenants.view'));
create policy branches_platform_admin_read on public.branches for select to authenticated using(public.is_platform_admin('platform.tenants.view'));
create policy platform_admin_directory_read on public.platform_admins for select to authenticated using(public.is_platform_admin(null));
