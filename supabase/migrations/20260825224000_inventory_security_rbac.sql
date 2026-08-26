insert into public.permissions(code,description) values
('inventory.view','View authorized inventory balances'),('inventory.valuation_view','View inventory valuation'),('inventory.movement_view','View inventory movements'),
('inventory.opening_stock_create','Create opening stock drafts'),('inventory.opening_stock_post','Post opening stock'),('inventory.receipt_create','Create receipts'),('inventory.receipt_post','Post receipts'),
('inventory.issue_create','Create issues'),('inventory.issue_post','Post issues'),('inventory.adjustment_create','Create adjustments'),('inventory.adjustment_post','Post adjustments'),
('inventory.damage_post','Post damage'),('inventory.expiry_post','Post expiry'),('inventory.loss_post','Post loss'),('inventory.reserve','Reserve inventory'),('inventory.release_reservation','Release reservations'),
('inventory.transfer_create','Create transfers'),('inventory.transfer_dispatch','Dispatch transfers'),('inventory.transfer_receive','Receive transfers'),('inventory.transfer_resolve_discrepancy','Resolve transfer discrepancies'),
('inventory.count_create','Create stock counts'),('inventory.count_perform','Perform stock counts'),('inventory.count_review','Review stock counts'),('inventory.count_post','Post count variances'),
('inventory.transaction_reverse','Reverse inventory transactions'),('inventory.backdate','Post authorized backdated inventory'),('inventory.settings_manage','Manage inventory settings'),('inventory.negative_override','Override negative stock policy')
on conflict(code) do update set description=excluded.description;

insert into public.role_permissions(organization_id,role_id,permission_id)
select r.organization_id,r.id,p.id from public.roles r cross join public.permissions p where r.is_system and r.name in ('Owner','Administrator') and p.code like 'inventory.%' on conflict do nothing;
insert into public.role_permissions(organization_id,role_id,permission_id)
select r.organization_id,r.id,p.id from public.roles r join public.permissions p on p.code in ('inventory.view','inventory.valuation_view','inventory.movement_view','inventory.receipt_create','inventory.receipt_post','inventory.issue_create','inventory.issue_post','inventory.adjustment_create','inventory.adjustment_post','inventory.damage_post','inventory.expiry_post','inventory.loss_post','inventory.reserve','inventory.release_reservation','inventory.transfer_create','inventory.transfer_dispatch','inventory.transfer_receive','inventory.count_create','inventory.count_perform','inventory.count_review','inventory.count_post') where r.is_system and r.name='Branch Manager' on conflict do nothing;
insert into public.role_permissions(organization_id,role_id,permission_id)
select r.organization_id,r.id,p.id from public.roles r join public.permissions p on p.code in ('inventory.view','inventory.reserve','inventory.release_reservation') where r.is_system and r.name='Cashier' on conflict do nothing;

insert into public.inventory_reason_codes(organization_id,code,name,applicable_types,requires_notes,is_system,created_by)
select o.id,x.code,x.name,x.types,x.notes,true,o.created_by from public.organizations o cross join (values
 ('DAMAGED','Damaged',array['DAMAGE','TRANSFER_DISCREPANCY'],true),('EXPIRED','Expired',array['EXPIRY'],true),('MISSING','Missing',array['LOSS','TRANSFER_DISCREPANCY'],true),('THEFT','Theft',array['LOSS'],true),
 ('DATA_CORRECTION','Data Correction',array['ADJUSTMENT_IN','ADJUSTMENT_OUT','STOCK_COUNT_ADJUSTMENT'],true),('FOUND','Found During Count',array['ADJUSTMENT_IN','STOCK_COUNT_ADJUSTMENT'],false),
 ('PROMOTIONAL','Promotional Use',array['MANUAL_ISSUE'],false),('STAFF_USE','Staff Consumption',array['MANUAL_ISSUE'],true),('INTERNAL_USE','Internal Use',array['MANUAL_ISSUE'],false),
 ('SPOILAGE','Spoilage',array['DAMAGE','LOSS'],true),('BREAKAGE','Breakage',array['DAMAGE'],true),('MISC_RECEIPT','Miscellaneous Receipt',array['MANUAL_RECEIPT'],false)
)x(code,name,types,notes) on conflict do nothing;

create or replace function public.seed_inventory_organization() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.inventory_settings(organization_id,inventory_timezone) values(new.id,new.timezone);
 insert into public.inventory_reason_codes(organization_id,code,name,applicable_types,requires_notes,is_system,created_by) values
 (new.id,'DAMAGED','Damaged',array['DAMAGE','TRANSFER_DISCREPANCY'],true,true,new.created_by),(new.id,'EXPIRED','Expired',array['EXPIRY'],true,true,new.created_by),(new.id,'MISSING','Missing',array['LOSS','TRANSFER_DISCREPANCY'],true,true,new.created_by),(new.id,'DATA_CORRECTION','Data Correction',array['ADJUSTMENT_IN','ADJUSTMENT_OUT','STOCK_COUNT_ADJUSTMENT'],true,true,new.created_by),(new.id,'MISC_RECEIPT','Miscellaneous Receipt',array['MANUAL_RECEIPT'],false,true,new.created_by);
 return new;
end $$;
create trigger seed_inventory_after_organization after insert on public.organizations for each row execute function public.seed_inventory_organization();

create or replace function public.update_inventory_settings(target_organization_id uuid,target_costing_method text,target_negative_stock_policy text,target_count_mode text,target_allow_backdated boolean,target_accounting_start_date date)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.has_permission(target_organization_id,'inventory.settings_manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 update public.inventory_settings set costing_method=target_costing_method,negative_stock_policy=target_negative_stock_policy,count_mode=target_count_mode,allow_backdated=target_allow_backdated,accounting_start_date=target_accounting_start_date where organization_id=target_organization_id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,auth.uid(),'inventory.settings_updated','inventory_settings',target_organization_id,jsonb_build_object('costing_method',target_costing_method,'negative_stock_policy',target_negative_stock_policy));
end $$;
revoke all on function public.update_inventory_settings(uuid,text,text,text,boolean,date) from public,anon;
grant execute on function public.update_inventory_settings(uuid,text,text,text,boolean,date) to authenticated;

alter table public.inventory_settings enable row level security; alter table public.inventory_settings force row level security;
alter table public.inventory_reason_codes enable row level security; alter table public.inventory_reason_codes force row level security;
alter table public.inventory_number_counters enable row level security; alter table public.inventory_number_counters force row level security;
alter table public.inventory_transactions enable row level security; alter table public.inventory_transactions force row level security;
alter table public.inventory_movements enable row level security; alter table public.inventory_movements force row level security;
alter table public.inventory_balances enable row level security; alter table public.inventory_balances force row level security;
alter table public.inventory_cost_layers enable row level security; alter table public.inventory_cost_layers force row level security;
alter table public.inventory_cost_allocations enable row level security; alter table public.inventory_cost_allocations force row level security;
alter table public.inventory_reservations enable row level security; alter table public.inventory_reservations force row level security;
alter table public.inventory_reservation_events enable row level security; alter table public.inventory_reservation_events force row level security;
alter table public.stock_transfers enable row level security; alter table public.stock_transfers force row level security;
alter table public.stock_transfer_lines enable row level security; alter table public.stock_transfer_lines force row level security;
alter table public.stock_count_sessions enable row level security; alter table public.stock_count_sessions force row level security;
alter table public.stock_count_lines enable row level security; alter table public.stock_count_lines force row level security;
alter table public.inventory_reorder_overrides enable row level security; alter table public.inventory_reorder_overrides force row level security;

create policy inventory_settings_read on public.inventory_settings for select to authenticated using(public.has_permission(organization_id,'inventory.view'));
create policy inventory_reasons_read on public.inventory_reason_codes for select to authenticated using(public.has_permission(organization_id,'inventory.view'));
create policy inventory_reasons_manage on public.inventory_reason_codes for all to authenticated using(public.has_permission(organization_id,'inventory.settings_manage')) with check(public.has_permission(organization_id,'inventory.settings_manage'));
create policy inventory_transactions_read on public.inventory_transactions for select to authenticated using(public.has_permission(organization_id,'inventory.movement_view') and exists(select 1 from public.inventory_movements m where m.transaction_id=id and public.can_access_branch(organization_id,m.branch_id)));
create policy inventory_movements_read on public.inventory_movements for select to authenticated using(public.has_permission(organization_id,'inventory.movement_view') and public.can_access_branch(organization_id,branch_id));
create policy inventory_balances_read on public.inventory_balances for select to authenticated using(public.has_permission(organization_id,'inventory.view') and public.can_access_branch(organization_id,branch_id));
create policy inventory_layers_read on public.inventory_cost_layers for select to authenticated using(public.has_permission(organization_id,'inventory.valuation_view') and public.can_access_branch(organization_id,branch_id));
create policy inventory_allocations_read on public.inventory_cost_allocations for select to authenticated using(public.has_permission(organization_id,'inventory.valuation_view') and exists(select 1 from public.inventory_movements m where m.id=outbound_movement_id and public.can_access_branch(organization_id,m.branch_id)));
create policy inventory_reservations_read on public.inventory_reservations for select to authenticated using(public.has_permission(organization_id,'inventory.view') and public.can_access_branch(organization_id,branch_id));
create policy inventory_reservation_events_read on public.inventory_reservation_events for select to authenticated using(exists(select 1 from public.inventory_reservations r where r.id=reservation_id and public.has_permission(organization_id,'inventory.view') and public.can_access_branch(organization_id,r.branch_id)));
create policy stock_transfers_read on public.stock_transfers for select to authenticated using(public.has_permission(organization_id,'inventory.view') and (public.can_access_branch(organization_id,source_branch_id) or public.can_access_branch(organization_id,destination_branch_id)));
create policy stock_transfer_lines_read on public.stock_transfer_lines for select to authenticated using(exists(select 1 from public.stock_transfers t where t.id=transfer_id and (public.can_access_branch(organization_id,t.source_branch_id) or public.can_access_branch(organization_id,t.destination_branch_id))));
create policy stock_counts_read on public.stock_count_sessions for select to authenticated using(public.has_permission(organization_id,'inventory.view') and public.can_access_branch(organization_id,branch_id));
create policy stock_count_lines_read on public.stock_count_lines for select to authenticated using(exists(select 1 from public.stock_count_sessions s where s.id=count_session_id and public.has_permission(organization_id,'inventory.view') and public.can_access_branch(organization_id,s.branch_id)));
create policy reorder_overrides_read on public.inventory_reorder_overrides for select to authenticated using(public.has_permission(organization_id,'inventory.view') and (branch_id is null or public.can_access_branch(organization_id,branch_id)));
create policy reorder_overrides_manage on public.inventory_reorder_overrides for all to authenticated using(public.has_permission(organization_id,'inventory.settings_manage')) with check(public.has_permission(organization_id,'inventory.settings_manage'));

revoke all on public.inventory_settings,public.inventory_reason_codes,public.inventory_number_counters,public.inventory_transactions,public.inventory_movements,public.inventory_balances,public.inventory_cost_layers,public.inventory_cost_allocations,public.inventory_reservations,public.inventory_reservation_events,public.stock_transfers,public.stock_transfer_lines,public.stock_count_sessions,public.stock_count_lines,public.inventory_reorder_overrides from anon,authenticated;
grant select on public.inventory_settings,public.inventory_reason_codes,public.inventory_transactions,public.inventory_movements,public.inventory_balances,public.inventory_cost_layers,public.inventory_cost_allocations,public.inventory_reservations,public.inventory_reservation_events,public.stock_transfers,public.stock_transfer_lines,public.stock_count_sessions,public.stock_count_lines,public.inventory_reorder_overrides,public.inventory_availability to authenticated;
grant insert,update on public.inventory_reason_codes,public.inventory_reorder_overrides to authenticated;

revoke all on function public.seed_inventory_organization(),public.guard_inventory_immutability(),public.guard_inventory_settings(),public.prevent_used_packaging_change() from public,anon,authenticated;
