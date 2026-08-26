create or replace function public.seed_inventory_organization() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.inventory_settings(organization_id,inventory_timezone) values(new.id,new.timezone);
 insert into public.inventory_reason_codes(organization_id,code,name,applicable_types,requires_notes,is_system,created_by)
 select new.id,x.code,x.name,x.types,x.notes,true,new.created_by from (values
 ('DAMAGED','Damaged',array['DAMAGE','TRANSFER_DISCREPANCY'],true),('EXPIRED','Expired',array['EXPIRY'],true),('MISSING','Missing',array['LOSS','TRANSFER_DISCREPANCY'],true),('THEFT','Theft',array['LOSS'],true),
 ('DATA_CORRECTION','Data Correction',array['ADJUSTMENT_IN','ADJUSTMENT_OUT','STOCK_COUNT_ADJUSTMENT'],true),('FOUND','Found During Count',array['ADJUSTMENT_IN','STOCK_COUNT_ADJUSTMENT'],false),
 ('PROMOTIONAL','Promotional Use',array['MANUAL_ISSUE'],false),('STAFF_USE','Staff Consumption',array['MANUAL_ISSUE'],true),('INTERNAL_USE','Internal Use',array['MANUAL_ISSUE'],false),
 ('SPOILAGE','Spoilage',array['DAMAGE','LOSS'],true),('BREAKAGE','Breakage',array['DAMAGE'],true),('MISC_RECEIPT','Miscellaneous Receipt',array['MANUAL_RECEIPT'],false)
 )x(code,name,types,notes);
 return new;
end $$;
revoke all on function public.seed_inventory_organization() from public,anon,authenticated;
