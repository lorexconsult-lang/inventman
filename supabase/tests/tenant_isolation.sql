begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = pgtap, extensions, public;
select plan(27);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
('00000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','a@example.test','',now(),now(),now()),
('00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-000000000000','authenticated','authenticated','b@example.test','',now(),now(),now()),
('00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-000000000000','authenticated','authenticated','branch@example.test','',now(),now(),now()),
('00000000-0000-0000-0000-00000000000d','00000000-0000-0000-0000-000000000000','authenticated','authenticated','restricted@example.test','',now(),now(),now());

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}',true);
select lives_ok($$select public.create_organization('Organization A','gate-org-a','GB','GBP','Europe/London')$$,'User A bootstraps Organization A');
set local role postgres;
select set_config('test.org_a',(select id::text from public.organizations where slug='gate-org-a'),true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}',true);
select lives_ok($$select public.create_organization('Organization B','gate-org-b','US','USD','America/New_York')$$,'User B bootstraps Organization B');
set local role postgres;
select set_config('test.org_b',(select id::text from public.organizations where slug='gate-org-b'),true);

insert into public.businesses(id,organization_id,name,business_type,created_by) values
('10000000-0000-0000-0000-00000000000a',current_setting('test.org_a')::uuid,'Business A','retail','00000000-0000-0000-0000-00000000000a'),
('10000000-0000-0000-0000-00000000000b',current_setting('test.org_b')::uuid,'Business B','retail','00000000-0000-0000-0000-00000000000b');
insert into public.branches(id,organization_id,business_id,name,code,timezone,created_by) values
('20000000-0000-0000-0000-00000000000a',current_setting('test.org_a')::uuid,'10000000-0000-0000-0000-00000000000a','Branch A','A','Europe/London','00000000-0000-0000-0000-00000000000a'),
('20000000-0000-0000-0000-00000000000b',current_setting('test.org_a')::uuid,'10000000-0000-0000-0000-00000000000a','Branch B','B','Europe/London','00000000-0000-0000-0000-00000000000a');
insert into public.warehouses(id,organization_id,business_id,branch_id,name,code,created_by) values
('30000000-0000-0000-0000-00000000000a',current_setting('test.org_a')::uuid,'10000000-0000-0000-0000-00000000000a','20000000-0000-0000-0000-00000000000a','Warehouse A','A','00000000-0000-0000-0000-00000000000a'),
('30000000-0000-0000-0000-00000000000b',current_setting('test.org_a')::uuid,'10000000-0000-0000-0000-00000000000a','20000000-0000-0000-0000-00000000000b','Warehouse B','B','00000000-0000-0000-0000-00000000000a');
insert into public.organization_members(id,organization_id,user_id,status,joined_at) values
('40000000-0000-0000-0000-00000000000c',current_setting('test.org_a')::uuid,'00000000-0000-0000-0000-00000000000c','active',now()),
('40000000-0000-0000-0000-00000000000d',current_setting('test.org_a')::uuid,'00000000-0000-0000-0000-00000000000d','active',now());
insert into public.roles(id,organization_id,name) values
('50000000-0000-0000-0000-00000000000c',current_setting('test.org_a')::uuid,'Test Branch Manager'),
('50000000-0000-0000-0000-00000000000d',current_setting('test.org_a')::uuid,'Restricted Manager');
insert into public.role_permissions(organization_id,role_id,permission_id)
select current_setting('test.org_a')::uuid,'50000000-0000-0000-0000-00000000000c'::uuid,id from public.permissions where code in ('branches.view','branches.update','warehouses.view','warehouses.update','storage_locations.view')
union all select current_setting('test.org_a')::uuid,'50000000-0000-0000-0000-00000000000d'::uuid,id from public.permissions where code='roles.manage';
insert into public.member_roles values
(current_setting('test.org_a')::uuid,'40000000-0000-0000-0000-00000000000c','50000000-0000-0000-0000-00000000000c',now()),
(current_setting('test.org_a')::uuid,'40000000-0000-0000-0000-00000000000d','50000000-0000-0000-0000-00000000000d',now());
insert into public.member_branch_access values(current_setting('test.org_a')::uuid,'40000000-0000-0000-0000-00000000000c','20000000-0000-0000-0000-00000000000a',now());

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}',true);
select is((select count(*)::int from public.organizations),1,'User A sees one organization');
select is((select count(*)::int from public.organizations where id=current_setting('test.org_b')::uuid),0,'User A cannot select Organization B');
select is((select count(*)::int from public.branches where organization_id=current_setting('test.org_b')::uuid),0,'User A cannot access Organization B branches');
select throws_ok(format('insert into public.businesses(organization_id,name,business_type) values(%L,%L,%L)',current_setting('test.org_b'),'Intrusion','retail'),'42501',null,'User A cannot insert Organization B data');
select lives_ok(format('update public.organizations set name=%L where id=%L','Compromised',current_setting('test.org_b')),'Cross-tenant update is filtered');
select lives_ok(format('delete from public.organizations where id=%L',current_setting('test.org_b')),'Cross-tenant delete is filtered');
select is((select count(*)::int from public.organization_members where organization_id=current_setting('test.org_b')::uuid),0,'User A cannot access Organization B memberships');
select ok(public.has_permission(current_setting('test.org_a')::uuid,'organizations.manage'),'Owner has organization capability');
select throws_ok($$select public.create_organization('Duplicate','gate-org-a','GB','GBP','Europe/London')$$,'23505',null,'Duplicate bootstrap is rejected');
set local role postgres;
select is((select count(*)::int from public.organizations where slug='gate-org-a'),1,'Duplicate bootstrap is atomic');
select is((select count(*)::int from public.organization_members where organization_id=current_setting('test.org_a')::uuid and user_id='00000000-0000-0000-0000-00000000000a'),1,'Authenticated actor becomes owner');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}',true);
select is((select count(*)::int from public.organizations where id=current_setting('test.org_a')::uuid),0,'User B cannot select Organization A');
select lives_ok(format('update public.organizations set name=%L where id=%L','Compromised',current_setting('test.org_a')),'Inverse update is filtered');
set local role postgres;
select is((select name from public.organizations where id=current_setting('test.org_a')::uuid),'Organization A','Organization A remains unchanged');
select is((select name from public.organizations where id=current_setting('test.org_b')::uuid),'Organization B','Organization B remains unchanged');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}',true);
select is((select count(*)::int from public.branches),1,'Branch Manager sees only Branch A');
select is((select count(*)::int from public.warehouses),1,'Branch Manager sees only Branch A warehouse');
select lives_ok($$update public.branches set name='Tampered' where id='20000000-0000-0000-0000-00000000000b'$$,'Branch B update is filtered');
select throws_ok($$update public.warehouses set branch_id='20000000-0000-0000-0000-00000000000b' where id='30000000-0000-0000-0000-00000000000a'$$,'42501',null,'Manual branch_id tampering is rejected');
select ok(not public.has_permission(current_setting('test.org_a')::uuid,'users.manage'),'Branch Manager lacks users.manage');

select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}',true);
select ok(public.has_permission(current_setting('test.org_a')::uuid,'roles.manage'),'Restricted manager has roles.manage');
select throws_ok(format('insert into public.role_permissions(organization_id,role_id,permission_id) select %L,%L,id from public.permissions where code=%L',current_setting('test.org_a'),'50000000-0000-0000-0000-00000000000d','users.manage'),'42501',null,'Manager cannot grant capability they lack');

select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
select is((select count(*)::int from public.organizations),0,'Anonymous cannot select organizations');
select is((select count(*)::int from public.organization_members),0,'Anonymous cannot select memberships');
select throws_ok($$select public.create_organization('Anonymous','anonymous-org','GB','GBP','Europe/London')$$,'42501',null,'Anonymous cannot bootstrap');

select * from finish();
rollback;
