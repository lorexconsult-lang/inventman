begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path=pgtap,extensions,public;
select plan(66);

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
('00000000-0000-4000-8000-00000000200a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','inventory-owner@example.test','',now(),now(),now()),
('00000000-0000-4000-8000-00000000200b','00000000-0000-0000-0000-000000000000','authenticated','authenticated','inventory-other@example.test','',now(),now(),now()),
('00000000-0000-4000-8000-00000000200c','00000000-0000-0000-0000-000000000000','authenticated','authenticated','inventory-branch@example.test','',now(),now(),now());

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000000200a","role":"authenticated"}',true);
select lives_ok($$select public.create_organization('Inventory A','inventory-a','GB','GBP','Europe/London')$$,'inventory organization bootstraps');
set local role postgres;
select set_config('i.org',(select id::text from public.organizations where slug='inventory-a'),true);
select set_config('i.business',(select id::text from public.businesses where organization_id=current_setting('i.org')::uuid limit 1),true);
select set_config('i.unit',(select id::text from public.units_of_measure where organization_id=current_setting('i.org')::uuid and name='Piece'),true);
insert into public.branches(id,organization_id,business_id,name,code,status,timezone,created_by) values('00000000-0000-4000-8000-000000002101',current_setting('i.org')::uuid,current_setting('i.business')::uuid,'North','NTH','active','Europe/London','00000000-0000-4000-8000-00000000200a'),('00000000-0000-4000-8000-000000002102',current_setting('i.org')::uuid,current_setting('i.business')::uuid,'South','STH','active','Europe/London','00000000-0000-4000-8000-00000000200a');
insert into public.warehouses(id,organization_id,business_id,branch_id,name,code,status,warehouse_type,created_by) values('00000000-0000-4000-8000-000000002201',current_setting('i.org')::uuid,current_setting('i.business')::uuid,'00000000-0000-4000-8000-000000002101','North Main','N-MAIN','active','MAIN','00000000-0000-4000-8000-00000000200a'),('00000000-0000-4000-8000-000000002202',current_setting('i.org')::uuid,current_setting('i.business')::uuid,'00000000-0000-4000-8000-000000002102','South Main','S-MAIN','active','MAIN','00000000-0000-4000-8000-00000000200a');
select set_config('i.loc1',(select id::text from public.storage_locations where warehouse_id='00000000-0000-4000-8000-000000002201' and location_type='ROOT'),true);
select set_config('i.loc2',(select id::text from public.storage_locations where warehouse_id='00000000-0000-4000-8000-000000002202' and location_type='ROOT'),true);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000000200a","role":"authenticated"}',true);
select set_config('i.product',(select public.create_simple_product(current_setting('i.org')::uuid,current_setting('i.business')::uuid,'Ledger Tea','STOCKED_PRODUCT',null,null,null,current_setting('i.unit')::uuid,'INV-TEA','',null,null,10,5,true,gen_random_uuid())::text),true);
set local role postgres;
select set_config('i.variant',(select id::text from public.product_variants where product_id=current_setting('i.product')::uuid),true);
select set_config('i.package',(select id::text from public.product_variant_packaging where product_variant_id=current_setting('i.variant')::uuid and is_base_unit),true);
select set_config('i.reason',(select id::text from public.inventory_reason_codes where organization_id=current_setting('i.org')::uuid and code='MISC_RECEIPT'),true);
select set_config('i.correction',(select id::text from public.inventory_reason_codes where organization_id=current_setting('i.org')::uuid and code='DATA_CORRECTION'),true);
select set_config('i.issue_reason',(select id::text from public.inventory_reason_codes where organization_id=current_setting('i.org')::uuid and code='INTERNAL_USE'),true);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000000200a","role":"authenticated"}',true);
select lives_ok(format($q$select public.post_inventory_transaction('%s','%s','OPENING_STOCK',now(),null,'Opening','LEGACY','00000000-0000-4000-8000-000000002301',jsonb_build_array(jsonb_build_object('product_variant_id','%s','storage_location_id','%s','packaging_id','%s','quantity',10,'unit_cost',100)))$q$,current_setting('i.org'),current_setting('i.business'),current_setting('i.variant'),current_setting('i.loc1'),current_setting('i.package')),'opening stock posts');
select is((select count(*) from public.inventory_transactions where organization_id=current_setting('i.org')::uuid and transaction_type='OPENING_STOCK'),1::bigint,'opening header created');
select is((select count(*) from public.inventory_movements where organization_id=current_setting('i.org')::uuid),1::bigint,'opening movement created');
select is((select on_hand_base_quantity from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc1')::uuid),10::numeric,'opening balance quantity');
select is((select inventory_value from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc1')::uuid),1000::numeric,'opening inventory value');
select is((select average_unit_cost from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc1')::uuid),100::numeric,'first weighted average');
select throws_ok(format($q$insert into public.inventory_movements(organization_id,transaction_id,product_variant_id,branch_id,warehouse_id,storage_location_id,movement_type,quantity_delta_base,entered_quantity,packaging_id,conversion_to_base_snapshot,valuation_unit_cost,valuation_total,costing_method_snapshot,occurred_at,posted_at) values('%s',gen_random_uuid(),'%s','00000000-0000-4000-8000-000000002101','00000000-0000-4000-8000-000000002201','%s','MANUAL_RECEIPT',1,1,'%s',1,1,1,'WEIGHTED_AVERAGE',now(),now())$q$,current_setting('i.org'),current_setting('i.variant'),current_setting('i.loc1'),current_setting('i.package')),'42501',null,'direct movement insert rejected');
select throws_ok(format($q$update public.inventory_movements set quantity_delta_base=99 where organization_id='%s'$q$,current_setting('i.org')),'42501',null,'movement update rejected by grants');
select throws_ok(format($q$delete from public.inventory_movements where organization_id='%s'$q$,current_setting('i.org')),'42501',null,'movement delete rejected by grants');
select throws_ok(format($q$update public.inventory_balances set on_hand_base_quantity=99 where organization_id='%s'$q$,current_setting('i.org')),'42501',null,'balance direct mutation rejected');

select lives_ok(format($q$select public.post_inventory_transaction('%s','%s','MANUAL_RECEIPT',now(),'%s','Receipt','R-2','00000000-0000-4000-8000-000000002302',jsonb_build_array(jsonb_build_object('product_variant_id','%s','storage_location_id','%s','packaging_id','%s','quantity',10,'unit_cost',200)))$q$,current_setting('i.org'),current_setting('i.business'),current_setting('i.reason'),current_setting('i.variant'),current_setting('i.loc1'),current_setting('i.package')),'second receipt posts');
select is((select on_hand_base_quantity from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc1')::uuid),20::numeric,'weighted quantity 20');
select is((select inventory_value from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc1')::uuid),3000::numeric,'weighted value 3000');
select is((select average_unit_cost from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc1')::uuid),150::numeric,'weighted average 150');
select lives_ok(format($q$select public.post_inventory_transaction('%s','%s','MANUAL_ISSUE',now(),'%s','Use','I-1','00000000-0000-4000-8000-000000002303',jsonb_build_array(jsonb_build_object('product_variant_id','%s','storage_location_id','%s','packaging_id','%s','quantity',5)))$q$,current_setting('i.org'),current_setting('i.business'),current_setting('i.issue_reason'),current_setting('i.variant'),current_setting('i.loc1'),current_setting('i.package')),'weighted issue posts');
select is((select inventory_value from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc1')::uuid),2250::numeric,'weighted issue value leaves 2250');
select is((select valuation_total from public.inventory_movements where movement_type='MANUAL_ISSUE' and organization_id=current_setting('i.org')::uuid),-750::numeric,'weighted outbound valued 750');
select throws_ok(format($q$select public.post_inventory_transaction('%s','%s','MANUAL_ISSUE',now(),'%s','Too much','I-2','00000000-0000-4000-8000-000000002304',jsonb_build_array(jsonb_build_object('product_variant_id','%s','storage_location_id','%s','packaging_id','%s','quantity',99)))$q$,current_setting('i.org'),current_setting('i.business'),current_setting('i.issue_reason'),current_setting('i.variant'),current_setting('i.loc1'),current_setting('i.package')),'P0001','INSUFFICIENT_STOCK','negative stock blocked');
select is((select on_hand_base_quantity from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc1')::uuid),15::numeric,'failed issue is atomic');

select lives_ok(format($q$select public.post_inventory_transaction('%s','%s','MANUAL_RECEIPT',now(),'%s','Replay','R-3','00000000-0000-4000-8000-000000002305',jsonb_build_array(jsonb_build_object('product_variant_id','%s','storage_location_id','%s','packaging_id','%s','quantity',1,'unit_cost',150)))$q$,current_setting('i.org'),current_setting('i.business'),current_setting('i.reason'),current_setting('i.variant'),current_setting('i.loc1'),current_setting('i.package')),'idempotent first post');
select lives_ok(format($q$select public.post_inventory_transaction('%s','%s','MANUAL_RECEIPT',now(),'%s','Replay','R-3','00000000-0000-4000-8000-000000002305',jsonb_build_array(jsonb_build_object('product_variant_id','%s','storage_location_id','%s','packaging_id','%s','quantity',1,'unit_cost',150)))$q$,current_setting('i.org'),current_setting('i.business'),current_setting('i.reason'),current_setting('i.variant'),current_setting('i.loc1'),current_setting('i.package')),'same idempotency replays');
select is((select count(*) from public.inventory_transactions where idempotency_key='00000000-0000-4000-8000-000000002305'),1::bigint,'replay has one transaction');
select throws_ok(format($q$select public.post_inventory_transaction('%s','%s','MANUAL_RECEIPT',now(),'%s','Changed','R-3','00000000-0000-4000-8000-000000002305',jsonb_build_array(jsonb_build_object('product_variant_id','%s','storage_location_id','%s','packaging_id','%s','quantity',2,'unit_cost',150)))$q$,current_setting('i.org'),current_setting('i.business'),current_setting('i.reason'),current_setting('i.variant'),current_setting('i.loc1'),current_setting('i.package')),'P0001','IDEMPOTENCY_PAYLOAD_MISMATCH','changed replay rejected');

select lives_ok(format($q$select public.reserve_inventory('%s','%s','%s',5,'TEST',null,null,'00000000-0000-4000-8000-000000002401')$q$,current_setting('i.org'),current_setting('i.variant'),current_setting('i.loc1')),'reservation succeeds');
select is((select reserved_base_quantity from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc1')::uuid),5::numeric,'reserved balance updated');
select is((select available_base_quantity from public.inventory_availability where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc1')::uuid),11::numeric,'availability calculated');
select throws_ok(format($q$select public.reserve_inventory('%s','%s','%s',99,'TEST',null,null,gen_random_uuid())$q$,current_setting('i.org'),current_setting('i.variant'),current_setting('i.loc1')),'P0001','INSUFFICIENT_AVAILABLE_STOCK','reservation oversubscription blocked');
select set_config('i.reservation',(select id::text from public.inventory_reservations where idempotency_key='00000000-0000-4000-8000-000000002401'),true);
select lives_ok(format($q$select public.release_inventory_reservation('%s','%s',2,'00000000-0000-4000-8000-000000002402')$q$,current_setting('i.org'),current_setting('i.reservation')),'partial release succeeds');
select is((select remaining_quantity from public.inventory_reservations where id=current_setting('i.reservation')::uuid),3::numeric,'partial remaining correct');
select lives_ok(format($q$select public.release_inventory_reservation('%s','%s',3,'00000000-0000-4000-8000-000000002403')$q$,current_setting('i.org'),current_setting('i.reservation')),'full release succeeds');
select is((select status from public.inventory_reservations where id=current_setting('i.reservation')::uuid),'RELEASED','reservation released');
select is((select count(*) from public.inventory_reservation_events where reservation_id=current_setting('i.reservation')::uuid),3::bigint,'reservation history append-only');

select set_config('i.transfer',(select public.create_stock_transfer(current_setting('i.org')::uuid,current_setting('i.business')::uuid,current_setting('i.loc1')::uuid,current_setting('i.loc2')::uuid,'Transfer','T-1',jsonb_build_array(jsonb_build_object('product_variant_id',current_setting('i.variant'),'packaging_id',current_setting('i.package'),'quantity',4)))::text),true);
select lives_ok(format($q$select public.dispatch_stock_transfer('%s','%s','00000000-0000-4000-8000-000000002501')$q$,current_setting('i.org'),current_setting('i.transfer')),'transfer dispatch succeeds');
select is((select status from public.stock_transfers where id=current_setting('i.transfer')::uuid),'DISPATCHED','transfer dispatched');
select is((select on_hand_base_quantity from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc1')::uuid),12::numeric,'dispatch reduces source');
select set_config('i.transfer_line',(select id::text from public.stock_transfer_lines where transfer_id=current_setting('i.transfer')::uuid),true);
select lives_ok(format($q$select public.receive_stock_transfer('%s','%s',jsonb_build_array(jsonb_build_object('line_id','%s','quantity',2)),'00000000-0000-4000-8000-000000002502')$q$,current_setting('i.org'),current_setting('i.transfer'),current_setting('i.transfer_line')),'partial transfer receipt');
select is((select status from public.stock_transfers where id=current_setting('i.transfer')::uuid),'PARTIALLY_RECEIVED','partial status');
select lives_ok(format($q$select public.receive_stock_transfer('%s','%s',jsonb_build_array(jsonb_build_object('line_id','%s','quantity',2)),'00000000-0000-4000-8000-000000002503')$q$,current_setting('i.org'),current_setting('i.transfer'),current_setting('i.transfer_line')),'final transfer receipt');
select is((select status from public.stock_transfers where id=current_setting('i.transfer')::uuid),'RECEIVED','transfer received');
select is((select on_hand_base_quantity from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc2')::uuid),4::numeric,'destination quantity received');
select is((select inventory_value from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc2')::uuid),(select abs(valuation_total) from public.inventory_movements where transaction_id=(select dispatched_transaction_id from public.stock_transfers where id=current_setting('i.transfer')::uuid)),'transfer cost basis preserved');
select throws_ok(format($q$select public.receive_stock_transfer('%s','%s',jsonb_build_array(jsonb_build_object('line_id','%s','quantity',1)),gen_random_uuid())$q$,current_setting('i.org'),current_setting('i.transfer'),current_setting('i.transfer_line')),'P0001','TRANSFER_NOT_RECEIVABLE','over/closed receipt rejected');
select set_config('i.count',(select public.create_stock_count(current_setting('i.org')::uuid,current_setting('i.business')::uuid,'00000000-0000-4000-8000-000000002102','00000000-0000-4000-8000-000000002202',current_setting('i.loc2')::uuid,'SPOT',true,array[current_setting('i.variant')::uuid])::text),true);
select lives_ok(format($q$select public.record_stock_count('%s','%s',jsonb_build_array(jsonb_build_object('line_id',(select id from public.stock_count_lines where count_session_id='%s'),'counted_quantity',5)))$q$,current_setting('i.org'),current_setting('i.count'),current_setting('i.count')),'count entry submitted');
select lives_ok(format($q$select public.post_stock_count('%s','%s','%s','00000000-0000-4000-8000-000000002801')$q$,current_setting('i.org'),current_setting('i.count'),current_setting('i.correction')),'positive count variance posts');
select is((select variance_quantity from public.stock_count_lines where count_session_id=current_setting('i.count')::uuid),1::numeric,'count variance calculated in database');
select is((select on_hand_base_quantity from public.inventory_balances where product_variant_id=current_setting('i.variant')::uuid and storage_location_id=current_setting('i.loc2')::uuid),5::numeric,'count movement adjusts balance');
select throws_ok(format($q$select public.post_stock_count('%s','%s','%s',gen_random_uuid())$q$,current_setting('i.org'),current_setting('i.count'),current_setting('i.correction')),'P0001','COUNT_ALREADY_POSTED','count cannot post twice');

set local role postgres;
select is((public.reconcile_inventory_balances(current_setting('i.org')::uuid,false)->>'differences')::integer,0,'ledger reconciles to balances');
select throws_ok(format($q$update public.inventory_settings set costing_method='FIFO' where organization_id='%s'$q$,current_setting('i.org')),'55000','COSTING_METHOD_LOCKED','costing method locked after activity');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000000200b","role":"authenticated"}',true);
select lives_ok($$select public.create_organization('Inventory FIFO','inventory-fifo','NG','NGN','Africa/Lagos')$$,'FIFO organization bootstraps');
set local role postgres;
select set_config('f.org',(select id::text from public.organizations where slug='inventory-fifo'),true);
select set_config('f.business',(select id::text from public.businesses where organization_id=current_setting('f.org')::uuid limit 1),true);
select set_config('f.unit',(select id::text from public.units_of_measure where organization_id=current_setting('f.org')::uuid and name='Piece'),true);
update public.inventory_settings set costing_method='FIFO' where organization_id=current_setting('f.org')::uuid;
insert into public.branches(id,organization_id,business_id,name,code,status,timezone,created_by) values('00000000-0000-4000-8000-000000002601',current_setting('f.org')::uuid,current_setting('f.business')::uuid,'FIFO Branch','FIFO','active','Africa/Lagos','00000000-0000-4000-8000-00000000200b');
insert into public.warehouses(id,organization_id,business_id,branch_id,name,code,status,warehouse_type,created_by) values('00000000-0000-4000-8000-000000002602',current_setting('f.org')::uuid,current_setting('f.business')::uuid,'00000000-0000-4000-8000-000000002601','FIFO Main','FIFO-M','active','MAIN','00000000-0000-4000-8000-00000000200b');
select set_config('f.loc',(select id::text from public.storage_locations where warehouse_id='00000000-0000-4000-8000-000000002602'),true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000000200b","role":"authenticated"}',true);
select set_config('f.product',(select public.create_simple_product(current_setting('f.org')::uuid,current_setting('f.business')::uuid,'FIFO Item','STOCKED_PRODUCT',null,null,null,current_setting('f.unit')::uuid,'FIFO-1','',null,null,null,null,true,gen_random_uuid())::text),true);
set local role postgres;
select set_config('f.variant',(select id::text from public.product_variants where product_id=current_setting('f.product')::uuid),true);
select set_config('f.package',(select id::text from public.product_variant_packaging where product_variant_id=current_setting('f.variant')::uuid and is_base_unit),true);
select set_config('f.reason',(select id::text from public.inventory_reason_codes where organization_id=current_setting('f.org')::uuid and code='MISC_RECEIPT'),true);
select set_config('f.issue_reason',(select id::text from public.inventory_reason_codes where organization_id=current_setting('f.org')::uuid and code='INTERNAL_USE'),true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000000200b","role":"authenticated"}',true);
select lives_ok(format($q$select public.post_inventory_transaction('%s','%s','MANUAL_RECEIPT',now(),'%s','Layer 1',null,'00000000-0000-4000-8000-000000002701',jsonb_build_array(jsonb_build_object('product_variant_id','%s','storage_location_id','%s','packaging_id','%s','quantity',10,'unit_cost',100)))$q$,current_setting('f.org'),current_setting('f.business'),current_setting('f.reason'),current_setting('f.variant'),current_setting('f.loc'),current_setting('f.package')),'FIFO first layer');
select lives_ok(format($q$select public.post_inventory_transaction('%s','%s','MANUAL_RECEIPT',now(),'%s','Layer 2',null,'00000000-0000-4000-8000-000000002702',jsonb_build_array(jsonb_build_object('product_variant_id','%s','storage_location_id','%s','packaging_id','%s','quantity',10,'unit_cost',200)))$q$,current_setting('f.org'),current_setting('f.business'),current_setting('f.reason'),current_setting('f.variant'),current_setting('f.loc'),current_setting('f.package')),'FIFO second layer');
select is((select count(*) from public.inventory_cost_layers where organization_id=current_setting('f.org')::uuid),2::bigint,'two FIFO layers created');
select lives_ok(format($q$select public.post_inventory_transaction('%s','%s','MANUAL_ISSUE',now(),'%s','FIFO issue',null,'00000000-0000-4000-8000-000000002703',jsonb_build_array(jsonb_build_object('product_variant_id','%s','storage_location_id','%s','packaging_id','%s','quantity',15)))$q$,current_setting('f.org'),current_setting('f.business'),current_setting('f.issue_reason'),current_setting('f.variant'),current_setting('f.loc'),current_setting('f.package')),'FIFO multi-layer issue');
select is((select abs(valuation_total) from public.inventory_movements where organization_id=current_setting('f.org')::uuid and movement_type='MANUAL_ISSUE'),2000::numeric,'FIFO outbound value 2000');
select is((select count(*) from public.inventory_cost_allocations where organization_id=current_setting('f.org')::uuid),2::bigint,'FIFO creates two allocations');
select results_eq($$select remaining_quantity from public.inventory_cost_layers where organization_id=current_setting('f.org')::uuid order by effective_at,id$$,array[0::numeric,5::numeric],'FIFO layer remainder 0 and 5');
select is((select inventory_value from public.inventory_balances where organization_id=current_setting('f.org')::uuid),1000::numeric,'FIFO remaining value 1000');
select set_config('f.issue_tx',(select transaction_id::text from public.inventory_movements where organization_id=current_setting('f.org')::uuid and movement_type='MANUAL_ISSUE'),true);
select lives_ok(format($q$select public.reverse_inventory_transaction('%s','%s','00000000-0000-4000-8000-000000002704','Reverse issue')$q$,current_setting('f.org'),current_setting('f.issue_tx')),'FIFO outbound reversal succeeds');
select results_eq($$select remaining_quantity from public.inventory_cost_layers where organization_id=current_setting('f.org')::uuid order by effective_at,id$$,array[10::numeric,10::numeric],'FIFO reversal restores layers');
select is((select status from public.inventory_transactions where id=current_setting('f.issue_tx')::uuid),'REVERSED','original marked reversed');
select is((select count(*) from public.inventory_movements where organization_id=current_setting('f.org')::uuid and movement_type='REVERSAL'),1::bigint,'reversal adds movement without deletion');
select is((select on_hand_base_quantity from public.inventory_balances where organization_id=current_setting('f.org')::uuid),20::numeric,'reversal restores quantity');
select is((select inventory_value from public.inventory_balances where organization_id=current_setting('f.org')::uuid),3000::numeric,'reversal restores value');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-00000000200a","role":"authenticated"}',true);
select throws_ok(format($q$select public.post_inventory_transaction('%s','%s','MANUAL_RECEIPT',now(),'%s','Cross tenant',null,gen_random_uuid(),jsonb_build_array(jsonb_build_object('product_variant_id','%s','storage_location_id','%s','packaging_id','%s','quantity',1,'unit_cost',1)))$q$,current_setting('i.org'),current_setting('i.business'),current_setting('i.reason'),current_setting('f.variant'),current_setting('i.loc1'),current_setting('f.package')),'P0001','INVALID_PACKAGING','cross-tenant variant and packaging rejected');

select * from finish();
rollback;
