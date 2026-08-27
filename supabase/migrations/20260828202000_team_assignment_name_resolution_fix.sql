begin;

create or replace function public.assign_team_member_roles(target_organization_id uuid,target_membership_id uuid,target_role_ids uuid[])
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; member public.organization_members%rowtype; actor_membership uuid; requested_role_id uuid; before_roles jsonb;
begin
 actor:=public.assert_team_actor(target_organization_id,'team.update');
 if not public.has_permission(target_organization_id,'roles.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 select m.id into actor_membership from public.organization_members m where m.organization_id=target_organization_id and m.user_id=actor and m.status='active';
 select * into member from public.organization_members m where m.organization_id=target_organization_id and m.id=target_membership_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if member.id=actor_membership then raise exception using errcode='42501',message='SELF_PRIVILEGE_CHANGE_DENIED'; end if;
 if member.status<>'active' then raise exception using errcode='P0001',message='MEMBER_NOT_ACTIVE'; end if;
 if cardinality(coalesce(target_role_ids,'{}'))=0 then raise exception using errcode='22023',message='ROLE_REQUIRED'; end if;
 foreach requested_role_id in array target_role_ids loop
  if not public.can_assign_role(target_organization_id,requested_role_id) or not exists(select 1 from public.roles r where r.organization_id=target_organization_id and r.id=requested_role_id and r.is_active and not(r.is_system and r.name='Owner')) then raise exception using errcode='42501',message='ROLE_NOT_ASSIGNABLE'; end if;
 end loop;
 if public.is_protected_owner(target_organization_id,target_membership_id) and (select count(*) from public.organization_members m where m.organization_id=target_organization_id and m.status='active' and public.is_protected_owner(target_organization_id,m.id))<=1 then raise exception using errcode='42501',message='LAST_OWNER_PROTECTED'; end if;
 select coalesce(jsonb_agg(mr.role_id order by mr.role_id),'[]') into before_roles from public.member_roles mr where mr.organization_id=target_organization_id and mr.membership_id=target_membership_id;
 delete from public.member_roles mr where mr.organization_id=target_organization_id and mr.membership_id=target_membership_id;
 insert into public.member_roles(organization_id,membership_id,role_id) select target_organization_id,target_membership_id,x from unnest(target_role_ids) x;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,before_data,after_data) values(target_organization_id,actor,'team.roles_assigned','organization_member',target_membership_id,jsonb_build_object('role_ids',before_roles),jsonb_build_object('role_ids',target_role_ids));
 return target_membership_id;
end $$;

create or replace function public.update_team_member_branches(target_organization_id uuid,target_membership_id uuid,target_branch_ids uuid[])
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; member public.organization_members%rowtype; actor_membership uuid; requested_branch_id uuid; before_branches jsonb;
begin
 actor:=public.assert_team_actor(target_organization_id,'team.update');
 select m.id into actor_membership from public.organization_members m where m.organization_id=target_organization_id and m.user_id=actor and m.status='active';
 select * into member from public.organization_members m where m.organization_id=target_organization_id and m.id=target_membership_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE'; end if;
 if member.id=actor_membership then raise exception using errcode='42501',message='SELF_PRIVILEGE_CHANGE_DENIED'; end if;
 if member.status not in('active','suspended') then raise exception using errcode='P0001',message='MEMBER_NOT_MANAGEABLE'; end if;
 foreach requested_branch_id in array coalesce(target_branch_ids,'{}') loop
  if not exists(select 1 from public.branches b where b.organization_id=target_organization_id and b.id=requested_branch_id and b.status='active') or not public.can_access_branch(target_organization_id,requested_branch_id) then raise exception using errcode='42501',message='BRANCH_NOT_ASSIGNABLE'; end if;
 end loop;
 select coalesce(jsonb_agg(mba.branch_id order by mba.branch_id),'[]') into before_branches from public.member_branch_access mba where mba.organization_id=target_organization_id and mba.membership_id=target_membership_id;
 delete from public.member_branch_access mba where mba.organization_id=target_organization_id and mba.membership_id=target_membership_id;
 insert into public.member_branch_access(organization_id,membership_id,branch_id) select target_organization_id,target_membership_id,x from unnest(coalesce(target_branch_ids,'{}')) x;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,before_data,after_data) values(target_organization_id,actor,'team.branch_access_updated','organization_member',target_membership_id,jsonb_build_object('branch_ids',before_branches),jsonb_build_object('branch_ids',target_branch_ids));
 return target_membership_id;
end $$;

commit;
