begin;
create or replace function public.enforce_commercial_insert() returns trigger language plpgsql security definer set search_path='' as $$
declare feature text:=tg_argv[0]; usage bigint; begin
 if session_user='postgres' then return new; end if;
 if tg_table_name='branches' then select count(*) into usage from public.branches where organization_id=new.organization_id and status<>'archived';
 elsif tg_table_name='warehouses' then select count(*) into usage from public.warehouses where organization_id=new.organization_id and status<>'archived';
 elsif tg_table_name='pos_terminals' then select count(*) into usage from public.pos_terminals where organization_id=new.organization_id and status='ACTIVE';
 elsif tg_table_name='offline_devices' then select count(*) into usage from public.offline_devices where organization_id=new.organization_id and status='ACTIVE';
 elsif tg_table_name='organization_invitations' then select count(*) into usage from public.organization_members where organization_id=new.organization_id and status in ('active','invited');
 else usage:=0; end if;
 perform public.assert_organization_limit(new.organization_id,feature,usage); return new; end $$;
create or replace function public.enforce_feature_write() returns trigger language plpgsql security definer set search_path='' as $$ begin if session_user='postgres' then return new; end if; perform public.assert_organization_feature(new.organization_id,tg_argv[0],true); return new; end $$;
create or replace function public.enforce_offline_sale_lease() returns trigger language plpgsql security definer set search_path='' as $$ begin if session_user='postgres' then return new; end if; if new.originated_offline and not old.originated_offline and not public.offline_lease_allows_sale(new.organization_id,new.offline_device_id,new.local_created_at) then raise exception using errcode='42501',message='OFFLINE_ENTITLEMENT_EXPIRED'; end if; return new; end $$;
commit;
