begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path=pgtap,extensions,public;
grant select on all tables in schema public to authenticated;
select plan(36);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-4000-8000-000000005001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','owner5@example.test','',now(),'{}',now(),now()),
('00000000-0000-4000-8000-000000005002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','staff5@example.test','',now(),'{}',now(),now()),
('00000000-0000-4000-8000-000000005003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin5@example.test','',now(),'{}',now(),now()),
('00000000-0000-4000-8000-000000005004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','foreign5@example.test','',now(),'{}',now(),now());

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005001","email":"owner5@example.test","role":"authenticated"}',true);
select lives_ok($$select public.create_organization('Team Gate A','team-gate-a','GB','GBP','Europe/London')$$,'owner creates team test organization');
set local role postgres;
select set_config('t.org',(select id::text from public.organizations where slug='team-gate-a'),true);
select set_config('t.business',(select id::text from public.businesses where organization_id=current_setting('t.org')::uuid limit 1),true);
insert into public.branches(id,organization_id,business_id,name,code,timezone,created_by) values
('00000000-0000-4000-8000-000000005101',current_setting('t.org')::uuid,current_setting('t.business')::uuid,'North','N','Europe/London','00000000-0000-4000-8000-000000005001'),
('00000000-0000-4000-8000-000000005102',current_setting('t.org')::uuid,current_setting('t.business')::uuid,'South','S','Europe/London','00000000-0000-4000-8000-000000005001');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005004","email":"foreign5@example.test","role":"authenticated"}',true);
select lives_ok($$select public.create_organization('Team Gate B','team-gate-b','GB','GBP','Europe/London')$$,'foreign owner creates second organization');
set local role postgres;
select set_config('t.foreign_org',(select id::text from public.organizations where slug='team-gate-b'),true);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005001","email":"owner5@example.test","role":"authenticated"}',true);
select ok(public.has_permission(current_setting('t.org')::uuid,'team.view'),'owner receives team capability');
select lives_ok(format($q$select public.create_team_role('%s','Sales Limited','Sales only',array[(select id from public.permissions where code='sales.order_view')])$q$,current_setting('t.org')),'owner creates custom role');
set local role postgres;
select set_config('t.role',(select id::text from public.roles where organization_id=current_setting('t.org')::uuid and name='Sales Limited'),true);
select is((select count(*)::int from public.role_permissions where role_id=current_setting('t.role')::uuid),1,'custom role has exact permission set');
select ok(not (select is_system from public.roles where id=current_setting('t.role')::uuid),'custom role is not a system authorization shortcut');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005001","email":"owner5@example.test","role":"authenticated"}',true);
select lives_ok(format($q$select public.update_team_role('%s','%s','Sales Viewer','Updated',array[(select id from public.permissions where code='sales.order_view'),(select id from public.permissions where code='customers.view')],true)$q$,current_setting('t.org'),current_setting('t.role')),'role permissions replace atomically');
select is((select count(*)::int from public.role_permissions where role_id=current_setting('t.role')::uuid),2,'updated role has complete new set');
select throws_ok(format($q$select public.update_team_role('%s',(select id from public.roles where organization_id='%s' and name='Owner'),'Owner','x','{}',true)$q$,current_setting('t.org'),current_setting('t.org')),'42501','SYSTEM_ROLE_PROTECTED','system role editing is blocked');

select lives_ok(format($q$select public.invite_team_member('%s','staff5@example.test','Staff Five','%s',array['00000000-0000-4000-8000-000000005101'::uuid],'Welcome','abcdefghijklmnopqrstuvwxyz1234567890','2099-01-01')$q$,current_setting('t.org'),current_setting('t.role')),'valid invitation is created');
set local role postgres;
select set_config('t.invite',(select id::text from public.organization_invitations where organization_id=current_setting('t.org')::uuid and email='staff5@example.test'),true);
select isnt((select token_hash from public.organization_invitations where id=current_setting('t.invite')::uuid),'abcdefghijklmnopqrstuvwxyz1234567890','only invitation token hash is stored');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005001","email":"owner5@example.test","role":"authenticated"}',true);
select throws_ok(format($q$select public.invite_team_member('%s','staff5@example.test','Duplicate','%s','{}','x','differentabcdefghijklmnopqrstuvwxyz123456','2099-01-01')$q$,current_setting('t.org'),current_setting('t.role')),'P0001','ACTIVE_INVITATION_EXISTS','duplicate active invitation is rejected');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005002","email":"staff5@example.test","role":"authenticated"}',true);
select lives_ok($$select public.accept_team_invitation('abcdefghijklmnopqrstuvwxyz1234567890')$$,'invited identity accepts valid token');
select throws_ok($$select public.accept_team_invitation('abcdefghijklmnopqrstuvwxyz1234567890')$$,'P0001','INVITATION_ALREADY_USED','accepted token cannot be reused');
select ok(public.is_active_organization_member(current_setting('t.org')::uuid),'accepted member is active');
set local role postgres;
select set_config('t.member',(select id::text from public.organization_members where organization_id=current_setting('t.org')::uuid and user_id='00000000-0000-4000-8000-000000005002'),true);
select is((select count(*)::int from public.member_branch_access where membership_id=current_setting('t.member')::uuid),1,'invited branch snapshot is applied');
select is((select count(*)::int from public.member_roles where membership_id=current_setting('t.member')::uuid),1,'invited role snapshot is applied');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005001","email":"owner5@example.test","role":"authenticated"}',true);
select lives_ok(format($q$select public.invite_team_member('%s','staff5@example.test','Staff Five','%s','{}','Revoke','revokedabcdefghijklmnopqrstuvwxyz123456','2099-01-01')$q$,current_setting('t.org'),current_setting('t.role')),'second invitation can be issued after acceptance');
set local role postgres;
select set_config('t.revoked_invite',(select id::text from public.organization_invitations where organization_id=current_setting('t.org')::uuid and email='staff5@example.test' and status='pending'),true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005001","email":"owner5@example.test","role":"authenticated"}',true);
select lives_ok(format($q$select public.revoke_team_invitation('%s','%s')$q$,current_setting('t.org'),current_setting('t.revoked_invite')),'pending invitation can be revoked');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005002","email":"staff5@example.test","role":"authenticated"}',true);
select throws_ok($$select public.accept_team_invitation('revokedabcdefghijklmnopqrstuvwxyz123456')$$,'P0001','INVITATION_ALREADY_USED','revoked token cannot be accepted');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005001","email":"owner5@example.test","role":"authenticated"}',true);
select lives_ok(format($q$select public.invite_team_member('%s','staff5@example.test','Staff Five','%s','{}','Expire','expiredabcdefghijklmnopqrstuvwxyz123456','2099-01-01')$q$,current_setting('t.org'),current_setting('t.role')),'replacement invitation is deterministic after revocation');
set local role postgres;
update public.organization_invitations set expires_at=now()-interval '1 minute' where organization_id=current_setting('t.org')::uuid and email='staff5@example.test' and status='pending';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005002","email":"staff5@example.test","role":"authenticated"}',true);
select throws_ok($$select public.accept_team_invitation('expiredabcdefghijklmnopqrstuvwxyz123456')$$,'P0001','INVITATION_EXPIRED','expired token cannot be accepted');
select throws_ok(format($q$select public.invite_team_member('%s','nobody@example.test','Nobody','%s','{}',null,'unauthorizedabcdefghijklmnopqrstuvwxyz','2099-01-01')$q$,current_setting('t.org'),current_setting('t.role')),'42501','PERMISSION_DENIED','unauthorized member cannot invite staff');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005001","email":"owner5@example.test","role":"authenticated"}',true);
select throws_ok(format($q$select public.assign_team_member_roles('%s',(select id from public.organization_members where organization_id='%s' and user_id='00000000-0000-4000-8000-000000005001'),array['%s'::uuid])$q$,current_setting('t.org'),current_setting('t.org'),current_setting('t.role')),'42501','SELF_PRIVILEGE_CHANGE_DENIED','owner cannot rewrite own roles');
select lives_ok(format($q$select public.update_team_member_branches('%s','%s','{}')$q$,current_setting('t.org'),current_setting('t.member')),'owner can restore all-branch access');
select is((select count(*)::int from public.member_branch_access where membership_id=current_setting('t.member')::uuid),0,'empty branch set represents all branches');

set local role postgres;
insert into public.organization_members(id,organization_id,user_id,status,joined_at,email) values('00000000-0000-4000-8000-000000005201',current_setting('t.org')::uuid,'00000000-0000-4000-8000-000000005003','active',now(),'admin5@example.test');
insert into public.roles(id,organization_id,name) values('00000000-0000-4000-8000-000000005301',current_setting('t.org')::uuid,'Team Admin');
insert into public.role_permissions(organization_id,role_id,permission_id) select current_setting('t.org')::uuid,'00000000-0000-4000-8000-000000005301',id from public.permissions where code in('team.view','team.update','team.suspend','roles.manage');
insert into public.member_roles(organization_id,membership_id,role_id) values(current_setting('t.org')::uuid,'00000000-0000-4000-8000-000000005201','00000000-0000-4000-8000-000000005301');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005003","email":"admin5@example.test","role":"authenticated"}',true);
select throws_ok(format($q$select public.create_team_role('%s','Escalated','x',array[(select id from public.permissions where code='organizations.manage')])$q$,current_setting('t.org')),'42501','CANNOT_GRANT_PERMISSION','administrator cannot grant capability they lack');
select throws_ok(format($q$select public.assign_team_member_roles('%s','00000000-0000-4000-8000-000000005201',array['%s'::uuid])$q$,current_setting('t.org'),current_setting('t.role')),'42501','SELF_PRIVILEGE_CHANGE_DENIED','administrator cannot change own roles');
select throws_ok(format($q$select public.set_team_member_status('%s',(select id from public.organization_members where organization_id='%s' and user_id='00000000-0000-4000-8000-000000005001'),'suspended','attack')$q$,current_setting('t.org'),current_setting('t.org')),'42501','LAST_OWNER_PROTECTED','last owner cannot be suspended');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005001","email":"owner5@example.test","role":"authenticated"}',true);
select lives_ok(format($q$select public.set_team_member_status('%s','00000000-0000-4000-8000-000000005201','suspended','Leave')$q$,current_setting('t.org')),'team administrator can be suspended');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005003","email":"admin5@example.test","role":"authenticated"}',true);
select throws_ok(format($q$select public.create_team_role('%s','Blocked','x','{}')$q$,current_setting('t.org')),'42501','PERMISSION_DENIED','suspended administrator cannot act');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000005001","email":"owner5@example.test","role":"authenticated"}',true);
select lives_ok(format($q$select public.set_team_member_status('%s','00000000-0000-4000-8000-000000005201','active',null)$q$,current_setting('t.org')),'owner reactivates suspended administrator');
select throws_ok(format($q$select public.assign_team_member_roles('%s','%s',array[(select id from public.roles where organization_id='%s' and name='Owner')])$q$,current_setting('t.org'),current_setting('t.member'),current_setting('t.foreign_org')),'42501','ROLE_NOT_ASSIGNABLE','cross-tenant role assignment is rejected');
select throws_ok(format($q$select public.update_team_member_branches('%s','%s',array[(select id from public.branches where organization_id='%s' limit 1)])$q$,current_setting('t.org'),current_setting('t.member'),current_setting('t.foreign_org')),'42501','BRANCH_NOT_ASSIGNABLE','cross-tenant branch assignment is rejected');
select is((select count(*)::int from public.audit_events where organization_id=current_setting('t.org')::uuid and action like 'team.%'),10,'team access changes are audited');
select is((select count(*)::int from public.organization_members where organization_id=current_setting('t.foreign_org')::uuid),0,'organization A member list excludes organization B data');

select * from finish();
rollback;
