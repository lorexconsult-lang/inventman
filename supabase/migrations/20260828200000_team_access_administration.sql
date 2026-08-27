begin;

alter table public.organization_members
  add column display_name text,
  add column email text,
  add column suspended_at timestamptz,
  add column suspension_reason text,
  add column deactivated_at timestamptz;

alter table public.organization_members
  add constraint organization_members_email_format check (email is null or (email=lower(trim(email)) and position('@' in email)>1)),
  add constraint organization_members_suspension_consistent check ((status='suspended')=(suspended_at is not null));

alter table public.organization_invitations
  add column display_name text,
  add column invitation_note text,
  add column role_id uuid,
  add column branch_ids uuid[] not null default '{}',
  add column resend_count integer not null default 0 check(resend_count>=0),
  add column last_sent_at timestamptz not null default now(),
  add constraint organization_invitations_role_fk foreign key(organization_id,role_id) references public.roles(organization_id,id);

insert into public.permissions(code,description) values
 ('team.view','View organization team members'),
 ('team.invite','Invite organization team members'),
 ('team.update','Assign team roles and branch access'),
 ('team.suspend','Suspend and reactivate team members'),
 ('roles.view','View roles and effective permissions')
on conflict(code) do update set description=excluded.description;

insert into public.role_permissions(organization_id,role_id,permission_id)
select r.organization_id,r.id,p.id
from public.roles r cross join public.permissions p
where r.is_system and r.name in('Owner','Administrator')
  and p.code in('team.view','team.invite','team.update','team.suspend','roles.view')
on conflict do nothing;

update public.organization_members m set
  email=lower(u.email),
  display_name=nullif(trim(u.raw_user_meta_data->>'full_name'),'')
from auth.users u where u.id=m.user_id and m.email is null;

drop policy if exists members_select_self_or_manager on public.organization_members;
create policy members_select_self_or_team on public.organization_members for select to authenticated
using(user_id=(select auth.uid()) or public.has_permission(organization_id,'team.view'));
drop policy if exists invitations_select_manager_or_invitee on public.organization_invitations;
create policy invitations_select_team_or_invitee on public.organization_invitations for select to authenticated
using(public.has_permission(organization_id,'team.view') or email=lower((select auth.jwt()->>'email')));
drop policy if exists members_manage on public.organization_members;
drop policy if exists invitations_manage on public.organization_invitations;
drop policy if exists roles_manage on public.roles;
drop policy if exists role_permissions_manage on public.role_permissions;
drop policy if exists member_roles_manage on public.member_roles;
drop policy if exists branch_access_manage on public.member_branch_access;
revoke insert,update,delete on public.organization_members,public.organization_invitations,public.roles,public.role_permissions,public.member_roles,public.member_branch_access from authenticated;

create or replace function public.is_protected_owner(target_organization_id uuid,target_membership_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.member_roles mr join public.roles r on r.organization_id=mr.organization_id and r.id=mr.role_id
 where mr.organization_id=target_organization_id and mr.membership_id=target_membership_id and r.is_system and r.name='Owner')
$$;

create or replace function public.assert_team_actor(target_organization_id uuid,target_permission text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not public.has_permission(target_organization_id,target_permission) then
  raise exception using errcode='42501',message='PERMISSION_DENIED';
 end if;
 return actor;
end $$;

create or replace function public.create_team_role(target_organization_id uuid,target_name text,target_description text,target_permission_ids uuid[])
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; new_id uuid:=gen_random_uuid(); permission_id uuid;
begin
 actor:=public.assert_team_actor(target_organization_id,'roles.manage');
 if length(trim(target_name))<2 then raise exception using errcode='22023',message='INVALID_ROLE'; end if;
 foreach permission_id in array coalesce(target_permission_ids,'{}') loop
  if not public.can_grant_permission(target_organization_id,permission_id) then raise exception using errcode='42501',message='CANNOT_GRANT_PERMISSION'; end if;
 end loop;
 insert into public.roles(id,organization_id,name,description,is_system) values(new_id,target_organization_id,trim(target_name),nullif(trim(target_description),''),false);
 insert into public.role_permissions(organization_id,role_id,permission_id) select target_organization_id,new_id,x from unnest(coalesce(target_permission_ids,'{}')) x;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'team.role_created','role',new_id,jsonb_build_object('name',trim(target_name),'permission_ids',target_permission_ids));
 return new_id;
end $$;

create or replace function public.update_team_role(target_organization_id uuid,target_role_id uuid,target_name text,target_description text,target_permission_ids uuid[],target_is_active boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; role_row public.roles%rowtype; permission_id uuid; before_permissions jsonb;
begin
 actor:=public.assert_team_actor(target_organization_id,'roles.manage');
 select * into role_row from public.roles where organization_id=target_organization_id and id=target_role_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if role_row.is_system then raise exception using errcode='42501',message='SYSTEM_ROLE_PROTECTED'; end if;
 foreach permission_id in array coalesce(target_permission_ids,'{}') loop
  if not public.can_grant_permission(target_organization_id,permission_id) then raise exception using errcode='42501',message='CANNOT_GRANT_PERMISSION'; end if;
 end loop;
 if not target_is_active and exists(select 1 from public.member_roles mr join public.organization_members m on m.organization_id=mr.organization_id and m.id=mr.membership_id where mr.organization_id=target_organization_id and mr.role_id=target_role_id and m.status='active') then
  raise exception using errcode='P0001',message='ROLE_HAS_ACTIVE_MEMBERS';
 end if;
 select coalesce(jsonb_agg(permission_id order by permission_id),'[]') into before_permissions from public.role_permissions where organization_id=target_organization_id and role_id=target_role_id;
 update public.roles set name=trim(target_name),description=nullif(trim(target_description),''),is_active=target_is_active where id=target_role_id;
 delete from public.role_permissions where organization_id=target_organization_id and role_id=target_role_id;
 insert into public.role_permissions(organization_id,role_id,permission_id) select target_organization_id,target_role_id,x from unnest(coalesce(target_permission_ids,'{}')) x;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,before_data,after_data) values(target_organization_id,actor,'team.role_updated','role',target_role_id,jsonb_build_object('name',role_row.name,'permission_ids',before_permissions),jsonb_build_object('name',trim(target_name),'permission_ids',target_permission_ids,'is_active',target_is_active));
 return target_role_id;
end $$;

create or replace function public.invite_team_member(target_organization_id uuid,target_email text,target_display_name text,target_role_id uuid,target_branch_ids uuid[],target_note text,target_token text,target_expires_at timestamptz)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; invitation_id uuid; branch_id uuid;
begin
 actor:=public.assert_team_actor(target_organization_id,'team.invite');
 if target_token is null or length(target_token)<32 or target_expires_at<=now() then raise exception using errcode='22023',message='INVALID_INVITATION'; end if;
 if target_role_id is null or not public.can_assign_role(target_organization_id,target_role_id) or not exists(select 1 from public.roles where organization_id=target_organization_id and id=target_role_id and is_active and not(is_system and name='Owner')) then raise exception using errcode='42501',message='ROLE_NOT_ASSIGNABLE'; end if;
 foreach branch_id in array coalesce(target_branch_ids,'{}') loop
  if not exists(select 1 from public.branches where organization_id=target_organization_id and id=branch_id and status='active') or not public.can_access_branch(target_organization_id,branch_id) then raise exception using errcode='42501',message='BRANCH_NOT_ASSIGNABLE'; end if;
 end loop;
 select id into invitation_id from public.organization_invitations where organization_id=target_organization_id and email=lower(trim(target_email)) and status='pending' for update;
 if found and (select expires_at>now() from public.organization_invitations where id=invitation_id) then raise exception using errcode='P0001',message='ACTIVE_INVITATION_EXISTS'; end if;
 if found then
  update public.organization_invitations set token_hash=encode(extensions.digest(target_token,'sha256'),'hex'),display_name=nullif(trim(target_display_name),''),invitation_note=nullif(trim(target_note),''),role_id=target_role_id,branch_ids=coalesce(target_branch_ids,'{}'),expires_at=target_expires_at,status='pending',resend_count=resend_count+1,last_sent_at=now() where id=invitation_id;
 else
  invitation_id:=gen_random_uuid();
  insert into public.organization_invitations(id,organization_id,email,token_hash,invited_by,expires_at,display_name,invitation_note,role_id,branch_ids,last_sent_at) values(invitation_id,target_organization_id,lower(trim(target_email)),encode(extensions.digest(target_token,'sha256'),'hex'),actor,target_expires_at,nullif(trim(target_display_name),''),nullif(trim(target_note),''),target_role_id,coalesce(target_branch_ids,'{}'),now());
 end if;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'team.invitation_created','organization_invitation',invitation_id,jsonb_build_object('email',lower(trim(target_email)),'role_id',target_role_id,'branch_ids',target_branch_ids,'expires_at',target_expires_at));
 return invitation_id;
end $$;

create or replace function public.resend_team_invitation(target_organization_id uuid,target_invitation_id uuid,target_token text,target_expires_at timestamptz)
returns text language plpgsql security definer set search_path='' as $$
declare actor uuid; invitation public.organization_invitations%rowtype;
begin
 actor:=public.assert_team_actor(target_organization_id,'team.invite');
 select * into invitation from public.organization_invitations where organization_id=target_organization_id and id=target_invitation_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if invitation.status<>'pending' then raise exception using errcode='P0001',message='INVITATION_NOT_PENDING'; end if;
 if length(target_token)<32 or target_expires_at<=now() then raise exception using errcode='22023',message='INVALID_INVITATION'; end if;
 update public.organization_invitations set token_hash=encode(extensions.digest(target_token,'sha256'),'hex'),expires_at=target_expires_at,resend_count=resend_count+1,last_sent_at=now() where id=invitation.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,actor,'team.invitation_resent','organization_invitation',invitation.id,jsonb_build_object('expires_at',target_expires_at));
 return invitation.email;
end $$;

create or replace function public.revoke_team_invitation(target_organization_id uuid,target_invitation_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; invitation public.organization_invitations%rowtype;
begin
 actor:=public.assert_team_actor(target_organization_id,'team.invite');
 select * into invitation from public.organization_invitations where organization_id=target_organization_id and id=target_invitation_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if invitation.status<>'pending' then raise exception using errcode='P0001',message='INVITATION_NOT_PENDING'; end if;
 update public.organization_invitations set status='revoked' where id=invitation.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id) values(target_organization_id,actor,'team.invitation_revoked','organization_invitation',invitation.id);
 return invitation.id;
end $$;

create or replace function public.accept_team_invitation(target_token text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); actor_email text:=lower(auth.jwt()->>'email'); invitation public.organization_invitations%rowtype; membership_id uuid;
begin
 if actor is null or target_token is null then raise exception using errcode='42501',message='AUTHENTICATION_REQUIRED'; end if;
 select * into invitation from public.organization_invitations where token_hash=encode(extensions.digest(target_token,'sha256'),'hex') for update;
 if not found then raise exception using errcode='P0001',message='INVITATION_INVALID'; end if;
 if invitation.status<>'pending' then raise exception using errcode='P0001',message='INVITATION_ALREADY_USED'; end if;
 if invitation.expires_at<=now() then update public.organization_invitations set status='expired' where id=invitation.id; raise exception using errcode='P0001',message='INVITATION_EXPIRED'; end if;
 if actor_email is null or actor_email<>invitation.email then raise exception using errcode='42501',message='INVITATION_EMAIL_MISMATCH'; end if;
 if not exists(select 1 from public.organizations where id=invitation.organization_id and status in('trial','active','grace_period')) then raise exception using errcode='P0001',message='ORGANIZATION_UNAVAILABLE'; end if;
 insert into public.organization_members(organization_id,user_id,status,joined_at,invited_by,email,display_name) values(invitation.organization_id,actor,'active',now(),invitation.invited_by,invitation.email,invitation.display_name)
 on conflict(organization_id,user_id) do update set status='active',joined_at=coalesce(organization_members.joined_at,now()),invited_by=invitation.invited_by,email=invitation.email,display_name=coalesce(invitation.display_name,organization_members.display_name),suspended_at=null,suspension_reason=null,deactivated_at=null returning id into membership_id;
 delete from public.member_roles where organization_id=invitation.organization_id and membership_id=membership_id;
 insert into public.member_roles(organization_id,membership_id,role_id) values(invitation.organization_id,membership_id,invitation.role_id);
 delete from public.member_branch_access where organization_id=invitation.organization_id and membership_id=membership_id;
 insert into public.member_branch_access(organization_id,membership_id,branch_id) select invitation.organization_id,membership_id,x from unnest(invitation.branch_ids) x;
 update public.organization_invitations set status='accepted',accepted_by=actor,accepted_at=now() where id=invitation.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(invitation.organization_id,actor,'team.invitation_accepted','organization_member',membership_id,jsonb_build_object('invitation_id',invitation.id,'role_id',invitation.role_id,'branch_ids',invitation.branch_ids));
 return invitation.organization_id;
end $$;

create or replace function public.assign_team_member_roles(target_organization_id uuid,target_membership_id uuid,target_role_ids uuid[])
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; member public.organization_members%rowtype; actor_membership uuid; role_id uuid; before_roles jsonb;
begin
 actor:=public.assert_team_actor(target_organization_id,'team.update');
 if not public.has_permission(target_organization_id,'roles.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select id into actor_membership from public.organization_members where organization_id=target_organization_id and user_id=actor and status='active';
 select * into member from public.organization_members where organization_id=target_organization_id and id=target_membership_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if member.id=actor_membership then raise exception using errcode='42501',message='SELF_PRIVILEGE_CHANGE_DENIED'; end if;
 if member.status<>'active' then raise exception using errcode='P0001',message='MEMBER_NOT_ACTIVE'; end if;
 if cardinality(coalesce(target_role_ids,'{}'))=0 then raise exception using errcode='22023',message='ROLE_REQUIRED'; end if;
 foreach role_id in array target_role_ids loop
  if not public.can_assign_role(target_organization_id,role_id) or not exists(select 1 from public.roles where organization_id=target_organization_id and id=role_id and is_active and not(is_system and name='Owner')) then raise exception using errcode='42501',message='ROLE_NOT_ASSIGNABLE'; end if;
 end loop;
 if public.is_protected_owner(target_organization_id,target_membership_id) and (select count(*) from public.organization_members m where m.organization_id=target_organization_id and m.status='active' and public.is_protected_owner(target_organization_id,m.id))<=1 then raise exception using errcode='42501',message='LAST_OWNER_PROTECTED'; end if;
 select coalesce(jsonb_agg(role_id order by role_id),'[]') into before_roles from public.member_roles where organization_id=target_organization_id and membership_id=target_membership_id;
 delete from public.member_roles where organization_id=target_organization_id and membership_id=target_membership_id;
 insert into public.member_roles(organization_id,membership_id,role_id) select target_organization_id,target_membership_id,x from unnest(target_role_ids) x;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,before_data,after_data) values(target_organization_id,actor,'team.roles_assigned','organization_member',target_membership_id,jsonb_build_object('role_ids',before_roles),jsonb_build_object('role_ids',target_role_ids));
 return target_membership_id;
end $$;

create or replace function public.update_team_member_branches(target_organization_id uuid,target_membership_id uuid,target_branch_ids uuid[])
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; member public.organization_members%rowtype; actor_membership uuid; branch_id uuid; before_branches jsonb;
begin
 actor:=public.assert_team_actor(target_organization_id,'team.update');
 select id into actor_membership from public.organization_members where organization_id=target_organization_id and user_id=actor and status='active';
 select * into member from public.organization_members where organization_id=target_organization_id and id=target_membership_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if member.id=actor_membership then raise exception using errcode='42501',message='SELF_PRIVILEGE_CHANGE_DENIED'; end if;
 if member.status not in('active','suspended') then raise exception using errcode='P0001',message='MEMBER_NOT_MANAGEABLE'; end if;
 foreach branch_id in array coalesce(target_branch_ids,'{}') loop
  if not exists(select 1 from public.branches where organization_id=target_organization_id and id=branch_id and status='active') or not public.can_access_branch(target_organization_id,branch_id) then raise exception using errcode='42501',message='BRANCH_NOT_ASSIGNABLE'; end if;
 end loop;
 select coalesce(jsonb_agg(branch_id order by branch_id),'[]') into before_branches from public.member_branch_access where organization_id=target_organization_id and membership_id=target_membership_id;
 delete from public.member_branch_access where organization_id=target_organization_id and membership_id=target_membership_id;
 insert into public.member_branch_access(organization_id,membership_id,branch_id) select target_organization_id,target_membership_id,x from unnest(coalesce(target_branch_ids,'{}')) x;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,before_data,after_data) values(target_organization_id,actor,'team.branch_access_updated','organization_member',target_membership_id,jsonb_build_object('branch_ids',before_branches),jsonb_build_object('branch_ids',target_branch_ids));
 return target_membership_id;
end $$;

create or replace function public.set_team_member_status(target_organization_id uuid,target_membership_id uuid,target_status public.membership_status,target_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; member public.organization_members%rowtype; actor_membership uuid;
begin
 actor:=public.assert_team_actor(target_organization_id,'team.suspend');
 if target_status not in('active','suspended','deactivated') then raise exception using errcode='22023',message='INVALID_MEMBER_STATUS'; end if;
 select id into actor_membership from public.organization_members where organization_id=target_organization_id and user_id=actor and status='active';
 select * into member from public.organization_members where organization_id=target_organization_id and id=target_membership_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if member.id=actor_membership then raise exception using errcode='42501',message='SELF_STATUS_CHANGE_DENIED'; end if;
 if target_status<>'active' and public.is_protected_owner(target_organization_id,target_membership_id) and (select count(*) from public.organization_members m where m.organization_id=target_organization_id and m.status='active' and public.is_protected_owner(target_organization_id,m.id))<=1 then raise exception using errcode='42501',message='LAST_OWNER_PROTECTED'; end if;
 update public.organization_members set status=target_status,suspended_at=case when target_status='suspended' then now() end,suspension_reason=case when target_status='suspended' then nullif(trim(target_reason),'') end,deactivated_at=case when target_status='deactivated' then now() end where id=target_membership_id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,before_data,after_data) values(target_organization_id,actor,case target_status when 'active' then 'team.member_reactivated' when 'suspended' then 'team.member_suspended' else 'team.member_deactivated' end,'organization_member',target_membership_id,jsonb_build_object('status',member.status),jsonb_build_object('status',target_status,'reason',nullif(trim(target_reason),'')));
 return target_membership_id;
end $$;

do $$ declare f record; begin
 for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('is_protected_owner','assert_team_actor','create_team_role','update_team_role','invite_team_member','resend_team_invitation','revoke_team_invitation','accept_team_invitation','assign_team_member_roles','update_team_member_branches','set_team_member_status') loop
  execute format('revoke all on function %s from public,anon',f.signature);
  execute format('grant execute on function %s to authenticated',f.signature);
 end loop;
end $$;

commit;
