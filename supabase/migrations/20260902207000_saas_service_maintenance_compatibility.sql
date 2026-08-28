begin;
create or replace function public.enforce_commercial_insert() returns trigger language plpgsql security definer set search_path='' as $$
declare feature text:=tg_argv[0]; usage bigint; begin
 if session_user='postgres' or auth.role()='service_role' then return new; end if;
 if tg_table_name='branches' then select count(*) into usage from public.branches where organization_id=new.organization_id and status<>'archived';
 elsif tg_table_name='warehouses' then select count(*) into usage from public.warehouses where organization_id=new.organization_id and status<>'archived';
 elsif tg_table_name='pos_terminals' then select count(*) into usage from public.pos_terminals where organization_id=new.organization_id and status='ACTIVE';
 elsif tg_table_name='offline_devices' then select count(*) into usage from public.offline_devices where organization_id=new.organization_id and status='ACTIVE';
 elsif tg_table_name='organization_invitations' then select count(*) into usage from public.organization_members where organization_id=new.organization_id and status in ('active','invited');
 else usage:=0; end if;
 perform public.assert_organization_limit(new.organization_id,feature,usage); return new; end $$;
create or replace function public.enforce_feature_write() returns trigger language plpgsql security definer set search_path='' as $$ begin if session_user='postgres' or auth.role()='service_role' then return new; end if; perform public.assert_organization_feature(new.organization_id,tg_argv[0],true); return new; end $$;
create or replace function public.enforce_offline_sale_lease() returns trigger language plpgsql security definer set search_path='' as $$ begin if session_user='postgres' or auth.role()='service_role' then return new; end if; if new.originated_offline and not old.originated_offline and not public.offline_lease_allows_sale(new.organization_id,new.offline_device_id,new.local_created_at) then raise exception using errcode='42501',message='OFFLINE_ENTITLEMENT_EXPIRED'; end if; return new; end $$;

alter table public.organization_subscriptions drop constraint organization_subscriptions_organization_id_fkey, add constraint organization_subscriptions_organization_id_fkey foreign key(organization_id) references public.organizations(id) on delete cascade;
alter table public.organization_entitlement_overrides drop constraint organization_entitlement_overrides_organization_id_fkey, add constraint organization_entitlement_overrides_organization_id_fkey foreign key(organization_id) references public.organizations(id) on delete cascade;
alter table public.platform_feature_flags drop constraint platform_feature_flags_organization_id_fkey, add constraint platform_feature_flags_organization_id_fkey foreign key(organization_id) references public.organizations(id) on delete cascade;
alter table public.platform_billing_transactions drop constraint platform_billing_transactions_organization_id_fkey, add constraint platform_billing_transactions_organization_id_fkey foreign key(organization_id) references public.organizations(id) on delete cascade;
alter table public.offline_entitlement_leases drop constraint offline_entitlement_leases_organization_id_device_id_fkey, add constraint offline_entitlement_leases_organization_id_device_id_fkey foreign key(organization_id,device_id) references public.offline_devices(organization_id,id) on delete cascade;
commit;
