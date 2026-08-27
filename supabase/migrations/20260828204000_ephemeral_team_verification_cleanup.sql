create or replace function public.purge_ephemeral_team_verification(target_organization_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare target_slug text;
begin
 if auth.role()<>'service_role' then raise exception using errcode='42501',message='SERVICE_ROLE_REQUIRED'; end if;
 select slug into target_slug from public.organizations where id=target_organization_id for update;
 if target_slug is null or target_slug not like 'phase5-team-%' then raise exception using errcode='42501',message='NOT_EPHEMERAL_VERIFICATION_TENANT'; end if;
 update public.organizations set slug='phase3-e2e-team-cleanup-'||target_organization_id::text where id=target_organization_id;
 perform public.purge_ephemeral_procurement_verification(target_organization_id);
end $$;
revoke all on function public.purge_ephemeral_team_verification(uuid) from public,anon,authenticated;
grant execute on function public.purge_ephemeral_team_verification(uuid) to service_role;
