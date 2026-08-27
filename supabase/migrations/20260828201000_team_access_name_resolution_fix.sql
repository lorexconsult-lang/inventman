begin;

create or replace function public.update_team_role(target_organization_id uuid,target_role_id uuid,target_name text,target_description text,target_permission_ids uuid[],target_is_active boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; role_row public.roles%rowtype; requested_permission_id uuid; before_permissions jsonb;
begin
 actor:=public.assert_team_actor(target_organization_id,'roles.manage');
 select * into role_row from public.roles where organization_id=target_organization_id and id=target_role_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if role_row.is_system then raise exception using errcode='42501',message='SYSTEM_ROLE_PROTECTED'; end if;
 foreach requested_permission_id in array coalesce(target_permission_ids,'{}') loop
  if not public.can_grant_permission(target_organization_id,requested_permission_id) then raise exception using errcode='42501',message='CANNOT_GRANT_PERMISSION'; end if;
 end loop;
 if not target_is_active and exists(select 1 from public.member_roles mr join public.organization_members m on m.organization_id=mr.organization_id and m.id=mr.membership_id where mr.organization_id=target_organization_id and mr.role_id=target_role_id and m.status='active') then raise exception using errcode='P0001',message='ROLE_HAS_ACTIVE_MEMBERS'; end if;
 select coalesce(jsonb_agg(rp.permission_id order by rp.permission_id),'[]') into before_permissions from public.role_permissions rp where rp.organization_id=target_organization_id and rp.role_id=target_role_id;
 update public.roles set name=trim(target_name),description=nullif(trim(target_description),''),is_active=target_is_active where id=target_role_id;
 delete from public.role_permissions rp where rp.organization_id=target_organization_id and rp.role_id=target_role_id;
 insert into public.role_permissions(organization_id,role_id,permission_id) select target_organization_id,target_role_id,x from unnest(coalesce(target_permission_ids,'{}')) x;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,before_data,after_data) values(target_organization_id,actor,'team.role_updated','role',target_role_id,jsonb_build_object('name',role_row.name,'permission_ids',before_permissions),jsonb_build_object('name',trim(target_name),'permission_ids',target_permission_ids,'is_active',target_is_active));
 return target_role_id;
end $$;

create or replace function public.accept_team_invitation(target_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); actor_email text:=lower(auth.jwt()->>'email'); invitation public.organization_invitations%rowtype; result_membership_id uuid;
begin
 if actor is null or target_token is null then raise exception using errcode='42501',message='AUTHENTICATION_REQUIRED'; end if;
 select * into invitation from public.organization_invitations where token_hash=encode(extensions.digest(target_token,'sha256'),'hex') for update;
 if not found then raise exception using errcode='P0001',message='INVITATION_INVALID'; end if;
 if invitation.status<>'pending' then raise exception using errcode='P0001',message='INVITATION_ALREADY_USED'; end if;
 if invitation.expires_at<=now() then update public.organization_invitations set status='expired' where id=invitation.id; raise exception using errcode='P0001',message='INVITATION_EXPIRED'; end if;
 if actor_email is null or actor_email<>invitation.email then raise exception using errcode='42501',message='INVITATION_EMAIL_MISMATCH'; end if;
 if not exists(select 1 from public.organizations where id=invitation.organization_id and status in('trial','active','grace_period')) then raise exception using errcode='P0001',message='ORGANIZATION_UNAVAILABLE'; end if;
 insert into public.organization_members(organization_id,user_id,status,joined_at,invited_by,email,display_name) values(invitation.organization_id,actor,'active',now(),invitation.invited_by,invitation.email,invitation.display_name)
 on conflict(organization_id,user_id) do update set status='active',joined_at=coalesce(organization_members.joined_at,now()),invited_by=invitation.invited_by,email=invitation.email,display_name=coalesce(invitation.display_name,organization_members.display_name),suspended_at=null,suspension_reason=null,deactivated_at=null returning id into result_membership_id;
 delete from public.member_roles mr where mr.organization_id=invitation.organization_id and mr.membership_id=result_membership_id;
 insert into public.member_roles(organization_id,membership_id,role_id) values(invitation.organization_id,result_membership_id,invitation.role_id);
 delete from public.member_branch_access mba where mba.organization_id=invitation.organization_id and mba.membership_id=result_membership_id;
 insert into public.member_branch_access(organization_id,membership_id,branch_id) select invitation.organization_id,result_membership_id,x from unnest(invitation.branch_ids) x;
 update public.organization_invitations set status='accepted',accepted_by=actor,accepted_at=now() where id=invitation.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(invitation.organization_id,actor,'team.invitation_accepted','organization_member',result_membership_id,jsonb_build_object('invitation_id',invitation.id,'role_id',invitation.role_id,'branch_ids',invitation.branch_ids));
 return invitation.organization_id;
end $$;

commit;
