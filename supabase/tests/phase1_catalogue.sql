begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = pgtap, extensions, public;
select plan(35);

insert into auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('00000000-0000-0000-0000-00000000100a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase1-a@example.test','',now(),now(),now()),
('00000000-0000-0000-0000-00000000100b','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase1-b@example.test','',now(),now(),now()),
('00000000-0000-0000-0000-00000000100c','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase1-restricted@example.test','',now(),now(),now()),
('00000000-0000-0000-0000-00000000100d','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase1-branch@example.test','',now(),now(),now());

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000100a","role":"authenticated"}',true);
select lives_ok($$select public.create_organization('Phase One A','phase-one-a','GB','GBP','Europe/London')$$,'Organization A foundation bootstraps');
set local role postgres;
select set_config('test.org_a',(select id::text from public.organizations where slug='phase-one-a'),true);
select set_config('test.business_a',(select id::text from public.businesses where organization_id=current_setting('test.org_a')::uuid limit 1),true);
select set_config('test.unit_a',(select id::text from public.units_of_measure where organization_id=current_setting('test.org_a')::uuid and name='Piece'),true);
select set_config('test.price_a',(select id::text from public.price_lists where organization_id=current_setting('test.org_a')::uuid and is_default),true);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000100b","role":"authenticated"}',true);
select lives_ok($$select public.create_organization('Phase One B','phase-one-b','US','USD','America/New_York')$$,'Organization B foundation bootstraps');
set local role postgres;
select set_config('test.org_b',(select id::text from public.organizations where slug='phase-one-b'),true);
select set_config('test.business_b',(select id::text from public.businesses where organization_id=current_setting('test.org_b')::uuid limit 1),true);
select set_config('test.unit_b',(select id::text from public.units_of_measure where organization_id=current_setting('test.org_b')::uuid and name='Piece'),true);
select set_config('test.price_b',(select id::text from public.price_lists where organization_id=current_setting('test.org_b')::uuid and is_default),true);

insert into public.branches(id,organization_id,business_id,name,code,timezone,created_by) values
('21000000-0000-0000-0000-00000000000a',current_setting('test.org_a')::uuid,current_setting('test.business_a')::uuid,'Ibadan','IBD','Europe/London','00000000-0000-0000-0000-00000000100a'),
('21000000-0000-0000-0000-00000000000b',current_setting('test.org_a')::uuid,current_setting('test.business_a')::uuid,'Lagos','LOS','Europe/London','00000000-0000-0000-0000-00000000100a'),
('21000000-0000-0000-0000-00000000000c',current_setting('test.org_b')::uuid,current_setting('test.business_b')::uuid,'Boston','BOS','America/New_York','00000000-0000-0000-0000-00000000100b');
insert into public.warehouses(id,organization_id,business_id,branch_id,name,code,is_default,created_by) values
('31000000-0000-0000-0000-00000000000a',current_setting('test.org_a')::uuid,current_setting('test.business_a')::uuid,'21000000-0000-0000-0000-00000000000a','Main Store','MAIN',true,'00000000-0000-0000-0000-00000000100a'),
('31000000-0000-0000-0000-00000000000b',current_setting('test.org_a')::uuid,current_setting('test.business_a')::uuid,'21000000-0000-0000-0000-00000000000b','Lagos Store','MAIN',true,'00000000-0000-0000-0000-00000000100a'),
('31000000-0000-0000-0000-00000000000c',current_setting('test.org_b')::uuid,current_setting('test.business_b')::uuid,'21000000-0000-0000-0000-00000000000c','Boston Store','MAIN',true,'00000000-0000-0000-0000-00000000100b');
insert into public.product_categories(id,organization_id,name,slug,created_by) values
('61000000-0000-0000-0000-00000000000a',current_setting('test.org_a')::uuid,'Beverages','beverages','00000000-0000-0000-0000-00000000100a'),
('61000000-0000-0000-0000-00000000000b',current_setting('test.org_b')::uuid,'Foreign','foreign','00000000-0000-0000-0000-00000000100b');
insert into public.brands(id,organization_id,name,created_by) values
('62000000-0000-0000-0000-00000000000a',current_setting('test.org_a')::uuid,'Local Brand','00000000-0000-0000-0000-00000000100a'),
('62000000-0000-0000-0000-00000000000b',current_setting('test.org_b')::uuid,'Foreign Brand','00000000-0000-0000-0000-00000000100b');

select is((select count(*)::int from public.storage_locations where warehouse_id='31000000-0000-0000-0000-00000000000a' and location_type='ROOT'),1,'Warehouse receives exactly one root location');
select throws_ok(format('insert into public.warehouses(organization_id,business_id,branch_id,name,code,is_default,created_by) values(%L,%L,%L,%L,%L,true,%L)',current_setting('test.org_a'),current_setting('test.business_a'),'21000000-0000-0000-0000-00000000000a','Second Default','SECOND','00000000-0000-0000-0000-00000000100a'),'23505',null,'Only one default warehouse is allowed per branch');
insert into public.storage_locations(id,organization_id,branch_id,warehouse_id,parent_location_id,name,code,location_type,created_by)
select '41000000-0000-0000-0000-00000000000a',current_setting('test.org_a')::uuid,'21000000-0000-0000-0000-00000000000a','31000000-0000-0000-0000-00000000000a',id,'Zone A','ZONE-A','ZONE','00000000-0000-0000-0000-00000000100a'
from public.storage_locations where warehouse_id='31000000-0000-0000-0000-00000000000a' and location_type='ROOT';
insert into public.storage_locations(id,organization_id,branch_id,warehouse_id,parent_location_id,name,code,location_type,created_by)
values ('41000000-0000-0000-0000-00000000000b',current_setting('test.org_a')::uuid,'21000000-0000-0000-0000-00000000000a','31000000-0000-0000-0000-00000000000a','41000000-0000-0000-0000-00000000000a','Aisle 1','AISLE-1','AISLE','00000000-0000-0000-0000-00000000100a');
select throws_ok($$update public.storage_locations set parent_location_id='41000000-0000-0000-0000-00000000000b' where id='41000000-0000-0000-0000-00000000000a'$$,'23514',null,'Storage hierarchy rejects cycles');
select throws_ok(format('insert into public.storage_locations(organization_id,branch_id,warehouse_id,parent_location_id,name,code,location_type,created_by) values(%L,%L,%L,%L,%L,%L,%L,%L)',current_setting('test.org_a'),'21000000-0000-0000-0000-00000000000b','31000000-0000-0000-0000-00000000000b','41000000-0000-0000-0000-00000000000a','Invalid','INVALID','BIN','00000000-0000-0000-0000-00000000100a'),'23514',null,'Storage parent cannot cross warehouses');
insert into public.product_categories(id,organization_id,parent_id,name,slug,created_by) values
('61000000-0000-0000-0000-00000000000c',current_setting('test.org_a')::uuid,'61000000-0000-0000-0000-00000000000a','Soft Drinks','soft-drinks','00000000-0000-0000-0000-00000000100a');
select throws_ok($$update public.product_categories set parent_id='61000000-0000-0000-0000-00000000000c' where id='61000000-0000-0000-0000-00000000000a'$$,'23514',null,'Category hierarchy rejects cycles');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000100a","role":"authenticated"}',true);
select is((select count(*)::int from public.product_categories where organization_id=current_setting('test.org_b')::uuid),0,'Organization A cannot read Organization B categories');
select is((select count(*)::int from public.brands where organization_id=current_setting('test.org_b')::uuid),0,'Organization A cannot read Organization B brands');
select throws_ok(format('select public.create_simple_product(%L,%L,%L,%L,%L,%L,null,%L,%L,null,%L,10,5,2,true,%L)',current_setting('test.org_a'),current_setting('test.business_a'),'Foreign category','STOCKED_PRODUCT','61000000-0000-0000-0000-00000000000b','62000000-0000-0000-0000-00000000000a',current_setting('test.unit_a'),'FOREIGN-CAT',current_setting('test.price_a'),'71000000-0000-0000-0000-000000000001'),'23503',null,'Product cannot reference another tenant category');
select throws_ok(format('select public.create_simple_product(%L,%L,%L,%L,%L,%L,null,%L,%L,null,%L,10,5,2,true,%L)',current_setting('test.org_a'),current_setting('test.business_a'),'Foreign brand','STOCKED_PRODUCT','61000000-0000-0000-0000-00000000000a','62000000-0000-0000-0000-00000000000b',current_setting('test.unit_a'),'FOREIGN-BRAND',current_setting('test.price_a'),'71000000-0000-0000-0000-000000000002'),'23503',null,'Product cannot reference another tenant brand');
select throws_ok(format('select public.create_simple_product(%L,%L,%L,%L,%L,%L,null,%L,%L,null,%L,10,5,2,true,%L)',current_setting('test.org_a'),current_setting('test.business_a'),'Foreign unit','STOCKED_PRODUCT','61000000-0000-0000-0000-00000000000a','62000000-0000-0000-0000-00000000000a',current_setting('test.unit_b'),'FOREIGN-UNIT',current_setting('test.price_a'),'71000000-0000-0000-0000-000000000003'),'23514',null,'Product cannot reference another tenant unit');
select throws_ok(format('insert into public.warehouses(organization_id,business_id,branch_id,name,code,created_by) values(%L,%L,%L,%L,%L,%L)',current_setting('test.org_a'),current_setting('test.business_a'),'21000000-0000-0000-0000-00000000000c','Intrusion','X','00000000-0000-0000-0000-00000000100a'),'23503',null,'Organization A cannot create warehouse under Organization B branch');
select lives_ok(format('select public.create_simple_product(%L,%L,%L,%L,%L,%L,null,%L,%L,%L,%L,700,520,5,true,%L)',current_setting('test.org_a'),current_setting('test.business_a'),'Coca-Cola 50cl','STOCKED_PRODUCT','61000000-0000-0000-0000-00000000000c','62000000-0000-0000-0000-00000000000a',current_setting('test.unit_a'),'COKE-50CL','544900000001',current_setting('test.price_a'),'71000000-0000-0000-0000-000000000004'),'Atomic simple product creation succeeds');
select is((select count(*)::int from public.product_variants where sku='COKE-50CL'),1,'Simple product receives one Default variant');
select is((select count(*)::int from public.product_variant_packaging packaging join public.product_variants variant on variant.id=packaging.product_variant_id where variant.sku='COKE-50CL' and packaging.is_base_unit),1,'Simple product receives exactly one base packaging');
select throws_ok(format('insert into public.product_variant_packaging(organization_id,product_variant_id,unit_of_measure_id,name,conversion_to_base) select %L,id,%L,%L,0 from public.product_variants where sku=%L',current_setting('test.org_a'),current_setting('test.unit_a'),'Invalid','COKE-50CL'),'23514',null,'Packaging conversion must be positive');
select throws_ok(format('insert into public.product_variant_packaging(organization_id,product_variant_id,unit_of_measure_id,name,conversion_to_base,is_base_unit) select %L,id,(select id from public.units_of_measure where organization_id=%L and name=%L),%L,1,true from public.product_variants where sku=%L',current_setting('test.org_a'),current_setting('test.org_a'),'Pack','Second base','COKE-50CL'),'23505',null,'Variant cannot have two base packaging rows');
select throws_ok(format('select public.create_simple_product(%L,%L,%L,%L,null,null,null,%L,%L,null,%L,null,null,null,true,%L)',current_setting('test.org_a'),current_setting('test.business_a'),'Duplicate SKU','STOCKED_PRODUCT',current_setting('test.unit_a'),'COKE-50CL',current_setting('test.price_a'),'71000000-0000-0000-0000-000000000005'),'23505',null,'SKU is unique inside one tenant');
select lives_ok(format('select public.create_variant_product(%L,%L,%L,%L,null,null,null,true,null,%L,%L::jsonb,%L::jsonb)',
  current_setting('test.org_a'),current_setting('test.business_a'),'T-Shirt','STOCKED_PRODUCT','71000000-0000-0000-0000-000000000007',
  '[{"name":"Colour","values":["Black","White"]},{"name":"Size","values":["S","M"]}]',
  jsonb_build_array(
    jsonb_build_object('name','Black / S','sku','TS-B-S','base_unit_id',current_setting('test.unit_a'),'attributes',jsonb_build_object('Colour','Black','Size','S')),
    jsonb_build_object('name','Black / M','sku','TS-B-M','base_unit_id',current_setting('test.unit_a'),'attributes',jsonb_build_object('Colour','Black','Size','M')),
    jsonb_build_object('name','White / S','sku','TS-W-S','base_unit_id',current_setting('test.unit_a'),'attributes',jsonb_build_object('Colour','White','Size','S')),
    jsonb_build_object('name','White / M','sku','TS-W-M','base_unit_id',current_setting('test.unit_a'),'attributes',jsonb_build_object('Colour','White','Size','M'))
  )::text),'Atomic variant product creation succeeds');
select is((select count(*)::int from public.product_variants variant join public.products product on product.id=variant.product_id where product.name='T-Shirt'),4,'Variant product creates every unique combination');
select throws_ok(format('select public.create_variant_product(%L,%L,%L,%L,null,null,null,true,null,%L,%L::jsonb,%L::jsonb)',
  current_setting('test.org_a'),current_setting('test.business_a'),'Duplicate combinations','STOCKED_PRODUCT','71000000-0000-0000-0000-000000000008',
  '[{"name":"Size","values":["S"]}]',
  jsonb_build_array(
    jsonb_build_object('name','First','sku','DUP-COMBO-1','base_unit_id',current_setting('test.unit_a'),'attributes',jsonb_build_object('Size','S')),
    jsonb_build_object('name','Second','sku','DUP-COMBO-2','base_unit_id',current_setting('test.unit_a'),'attributes',jsonb_build_object('Size','S'))
  )::text),'23505',null,'Duplicate variant combinations are rejected');
set local role postgres;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000100b","role":"authenticated"}',true);
select lives_ok(format('select public.create_simple_product(%L,%L,%L,%L,null,null,null,%L,%L,%L,%L,1,1,1,true,%L)',current_setting('test.org_b'),current_setting('test.business_b'),'Shared identifiers','STOCKED_PRODUCT',current_setting('test.unit_b'),'COKE-50CL','544900000001',current_setting('test.price_b'),'71000000-0000-0000-0000-000000000006'),'Same SKU and barcode are allowed in another tenant');
set local role postgres;

select throws_ok(format('insert into public.product_barcodes(organization_id,product_variant_id,packaging_id,barcode) select %L,variant.id,(select packaging.id from public.product_variant_packaging packaging join public.product_variants other on other.id=packaging.product_variant_id where other.organization_id=%L limit 1),%L from public.product_variants variant where variant.organization_id=%L limit 1',current_setting('test.org_a'),current_setting('test.org_b'),'MISMATCH',current_setting('test.org_a')),'23514',null,'Barcode packaging must belong to its variant');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000100a","role":"authenticated"}',true);
select throws_ok(format('insert into public.product_prices(organization_id,price_list_id,product_variant_id,packaging_id,amount,created_by) select %L,%L,variant.id,packaging.id,5,%L from public.product_variants variant join public.product_variant_packaging packaging on packaging.product_variant_id=variant.id where variant.sku=%L',current_setting('test.org_a'),current_setting('test.price_b'),'00000000-0000-0000-0000-00000000100a','COKE-50CL'),'23503',null,'Price cannot reference another tenant price list');
select throws_ok(format('insert into public.product_prices(organization_id,price_list_id,product_variant_id,packaging_id,branch_id,amount,created_by) select %L,%L,variant.id,packaging.id,%L,5,%L from public.product_variants variant join public.product_variant_packaging packaging on packaging.product_variant_id=variant.id where variant.sku=%L',current_setting('test.org_a'),current_setting('test.price_a'),'21000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-00000000100a','COKE-50CL'),'23503',null,'Branch-specific price cannot target another tenant branch');

set local role postgres;
insert into public.organization_members(id,organization_id,user_id,status,joined_at) values
('51000000-0000-0000-0000-00000000000c',current_setting('test.org_a')::uuid,'00000000-0000-0000-0000-00000000100c','active',now()),
('51000000-0000-0000-0000-00000000000d',current_setting('test.org_a')::uuid,'00000000-0000-0000-0000-00000000100d','active',now());
insert into public.roles(id,organization_id,name) values
('52000000-0000-0000-0000-00000000000c',current_setting('test.org_a')::uuid,'Phase Restricted'),
('52000000-0000-0000-0000-00000000000d',current_setting('test.org_a')::uuid,'Phase Branch');
insert into public.role_permissions(organization_id,role_id,permission_id)
select current_setting('test.org_a')::uuid,'52000000-0000-0000-0000-00000000000c'::uuid,id from public.permissions where code in ('products.view','prices.view')
union all select current_setting('test.org_a')::uuid,'52000000-0000-0000-0000-00000000000d'::uuid,id from public.permissions where code in ('branches.view','warehouses.view','warehouses.create','storage_locations.view','products.view');
insert into public.member_roles values
(current_setting('test.org_a')::uuid,'51000000-0000-0000-0000-00000000000c','52000000-0000-0000-0000-00000000000c',now()),
(current_setting('test.org_a')::uuid,'51000000-0000-0000-0000-00000000000d','52000000-0000-0000-0000-00000000000d',now());
insert into public.member_branch_access values(current_setting('test.org_a')::uuid,'51000000-0000-0000-0000-00000000000d','21000000-0000-0000-0000-00000000000a',now());

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000100c","role":"authenticated"}',true);
select throws_ok(format('insert into public.products(organization_id,business_id,name,product_type,created_by) values(%L,%L,%L,%L,%L)',current_setting('test.org_a'),current_setting('test.business_a'),'Unauthorized','STOCKED_PRODUCT','00000000-0000-0000-0000-00000000100c'),'42501',null,'Restricted user cannot create products');
select lives_ok($$update public.product_prices set amount=1$$,'Unauthorized price update is filtered');
select is((select count(*)::int from public.product_prices where amount=1),0,'Restricted user cannot alter prices');

select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000100d","role":"authenticated"}',true);
select is((select count(*)::int from public.warehouses),1,'Branch-scoped user sees only assigned branch warehouse');
select is((select count(*)::int from public.storage_locations where branch_id='21000000-0000-0000-0000-00000000000b'),0,'Branch-scoped user cannot see other branch locations');
select throws_ok(format('insert into public.warehouses(organization_id,business_id,branch_id,name,code,created_by) values(%L,%L,%L,%L,%L,%L)',current_setting('test.org_a'),current_setting('test.business_a'),'21000000-0000-0000-0000-00000000000b','Spoofed','SPOOF','00000000-0000-0000-0000-00000000100d'),'42501',null,'Branch-scoped user cannot spoof branch_id');

set local role postgres;
select ok((select count(*) from public.audit_events where organization_id=current_setting('test.org_a')::uuid and entity_type in ('products','product_prices')) > 0,'Sensitive catalogue mutations produce audit events');
select is((select count(*)::int from information_schema.columns where table_schema='public' and table_name in ('products','product_variants') and column_name in ('current_stock','quantity_on_hand','available_quantity','reserved_stock')),0,'Catalogue contains no physical stock quantity shortcuts');
set local role anon;
select is((select count(*)::int from public.products),0,'Anonymous users cannot read catalogue products');

select * from finish();
rollback;
