begin;

insert into public.saas_plans(code,name,description,status,currency,monthly_price,annual_price,trial_days,display_order,is_public)
values
('STARTER','Starter','Core inventory for a small team','ACTIVE','GBP',19,190,14,10,true),
('GROWTH','Growth','Multi-branch operations and POS','ACTIVE','GBP',49,490,14,20,true),
('BUSINESS','Business','Full operations, offline and finance','ACTIVE','GBP',99,990,14,30,true)
on conflict(code) do nothing;

insert into public.plan_entitlements(plan_id,feature_code,entitlement_type,enabled,numeric_value)
select p.id,f.feature_code,'BOOLEAN',
  case p.code when 'STARTER' then f.feature_code in ('core.catalogue','core.inventory','sales','payments')
              when 'GROWTH' then f.feature_code in ('core.catalogue','core.inventory','procurement','sales','payments','pos','multi_branch','staff','warehouses','pos_terminals')
              else f.feature_code not in ('api_access') end,null
from public.saas_plans p cross join public.platform_features f
where p.code in ('STARTER','GROWTH','BUSINESS') and f.feature_code not in ('multi_branch','staff','warehouses','pos_terminals','offline_devices')
on conflict(plan_id,feature_code) do nothing;

insert into public.plan_entitlements(plan_id,feature_code,entitlement_type,numeric_value)
select p.id,x.feature_code,'LIMIT',case p.code
 when 'STARTER' then case x.feature_code when 'multi_branch' then 1 when 'staff' then 3 when 'warehouses' then 1 when 'pos_terminals' then 0 else 0 end
 when 'GROWTH' then case x.feature_code when 'multi_branch' then 3 when 'staff' then 10 when 'warehouses' then 5 when 'pos_terminals' then 3 when 'offline_devices' then 0 end
 else case x.feature_code when 'multi_branch' then 10 when 'staff' then 50 when 'warehouses' then 20 when 'pos_terminals' then 10 when 'offline_devices' then 10 end end
from public.saas_plans p cross join (values('multi_branch'),('staff'),('warehouses'),('pos_terminals'),('offline_devices')) x(feature_code)
where p.code in ('STARTER','GROWTH','BUSINESS') on conflict(plan_id,feature_code) do nothing;

update public.platform_settings set default_trial_plan_id=(select id from public.saas_plans where code='BUSINESS') where singleton;

insert into public.organization_subscriptions(organization_id,plan_id,billing_interval,status,access_mode,current_period_start,current_period_end,provider,price_snapshot,currency_snapshot,manual_override)
select o.id,p.id,'ANNUAL','ACTIVE','FULL_ACCESS',o.created_at,o.created_at+interval '100 years','MANUAL',p.annual_price,p.currency,true
from public.organizations o cross join public.saas_plans p where p.code='BUSINESS'
on conflict do nothing;

create or replace function public.bootstrap_organization_subscription() returns trigger
language plpgsql security definer set search_path='' as $$ declare p public.saas_plans%rowtype; days int; begin
 select sp.* into p from public.platform_settings s join public.saas_plans sp on sp.id=s.default_trial_plan_id where s.singleton;
 select default_trial_days into days from public.platform_settings where singleton;
 if p.id is null then return new; end if;
 insert into public.organization_subscriptions(organization_id,plan_id,billing_interval,status,access_mode,trial_started_at,trial_ends_at,provider,price_snapshot,currency_snapshot)
 values(new.id,p.id,'MONTHLY','TRIALING','FULL_ACCESS',now(),now()+make_interval(days=>coalesce(days,p.trial_days)),'MANUAL',p.monthly_price,p.currency);
 return new; end $$;
create trigger organization_subscription_bootstrap after insert on public.organizations for each row execute function public.bootstrap_organization_subscription();

create or replace function public.enforce_commercial_insert() returns trigger language plpgsql security definer set search_path='' as $$
declare feature text:=tg_argv[0]; usage bigint; begin
 if tg_table_name='branches' then select count(*) into usage from public.branches where organization_id=new.organization_id and status<>'archived';
 elsif tg_table_name='warehouses' then select count(*) into usage from public.warehouses where organization_id=new.organization_id and status<>'archived';
 elsif tg_table_name='pos_terminals' then select count(*) into usage from public.pos_terminals where organization_id=new.organization_id and status='ACTIVE';
 elsif tg_table_name='offline_devices' then select count(*) into usage from public.offline_devices where organization_id=new.organization_id and status='ACTIVE';
 elsif tg_table_name='organization_invitations' then select count(*) into usage from public.organization_members where organization_id=new.organization_id and status in ('active','invited');
 else usage:=0; end if;
 perform public.assert_organization_limit(new.organization_id,feature,usage); return new; end $$;
create trigger branches_commercial_gate before insert on public.branches for each row execute function public.enforce_commercial_insert('multi_branch');
create trigger warehouses_commercial_gate before insert on public.warehouses for each row execute function public.enforce_commercial_insert('warehouses');
create trigger terminals_commercial_gate before insert on public.pos_terminals for each row execute function public.enforce_commercial_insert('pos_terminals');
create trigger devices_commercial_gate before insert on public.offline_devices for each row execute function public.enforce_commercial_insert('offline_devices');
create trigger invitations_commercial_gate before insert on public.organization_invitations for each row execute function public.enforce_commercial_insert('staff');

create or replace function public.enforce_feature_write() returns trigger language plpgsql security definer set search_path='' as $$ begin perform public.assert_organization_feature(new.organization_id,tg_argv[0],true); return new; end $$;
create trigger inventory_commercial_gate before insert on public.inventory_transactions for each row execute function public.enforce_feature_write('core.inventory');
create trigger procurement_commercial_gate before insert on public.purchase_requisitions for each row execute function public.enforce_feature_write('procurement');
create trigger sales_commercial_gate before insert on public.sales_orders for each row execute function public.enforce_feature_write('sales');
create trigger payments_commercial_gate before insert on public.payments for each row execute function public.enforce_feature_write('payments');
create trigger pos_commercial_gate before insert on public.pos_sales for each row execute function public.enforce_feature_write('pos');
create or replace function public.enforce_offline_sale_lease() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.originated_offline and not old.originated_offline and not public.offline_lease_allows_sale(new.organization_id,new.offline_device_id,new.local_created_at) then raise exception using errcode='42501',message='OFFLINE_ENTITLEMENT_EXPIRED'; end if; return new; end $$;
create trigger offline_sale_lease_gate before update of originated_offline on public.pos_sales for each row execute function public.enforce_offline_sale_lease();

create or replace function public.platform_create_plan(target_code text,target_name text,target_description text,target_currency text,target_monthly_price numeric,target_annual_price numeric,target_trial_days integer,target_is_public boolean) returns uuid
language plpgsql security definer set search_path='' as $$ declare result uuid:=gen_random_uuid(); begin
 if not public.is_platform_admin('platform.plans.manage') then raise exception using errcode='42501',message='PLATFORM_ADMIN_REQUIRED'; end if;
 insert into public.saas_plans(id,code,name,description,currency,monthly_price,annual_price,trial_days,is_public,status) values(result,upper(trim(target_code)),trim(target_name),trim(target_description),upper(target_currency),target_monthly_price,target_annual_price,target_trial_days,target_is_public,'DRAFT');
 insert into public.platform_audit_events(actor_id,action,target_type,target_id,after_data) values(auth.uid(),'platform.plan.created','saas_plan',result::text,jsonb_build_object('code',upper(trim(target_code)))); return result; end $$;

create or replace function public.platform_set_plan_entitlement(target_plan_id uuid,target_feature_code text,target_type text,target_enabled boolean,target_numeric_value numeric,target_text_value text,target_reason text) returns void
language plpgsql security definer set search_path='' as $$ begin
 if not public.is_platform_admin('platform.plans.manage') then raise exception using errcode='42501',message='PLATFORM_ADMIN_REQUIRED'; end if;
 insert into public.plan_entitlements(plan_id,feature_code,entitlement_type,enabled,numeric_value,text_value) values(target_plan_id,target_feature_code,target_type,target_enabled,target_numeric_value,target_text_value) on conflict(plan_id,feature_code) do update set entitlement_type=excluded.entitlement_type,enabled=excluded.enabled,numeric_value=excluded.numeric_value,text_value=excluded.text_value;
 insert into public.platform_audit_events(actor_id,action,target_type,target_id,reason,after_data) values(auth.uid(),'platform.plan.entitlement_changed','saas_plan',target_plan_id::text,target_reason,jsonb_build_object('feature_code',target_feature_code)); end $$;

create or replace function public.platform_change_subscription(target_organization_id uuid,target_plan_id uuid,target_interval text,target_status text,target_effective_at timestamptz,target_reason text) returns uuid
language plpgsql security definer set search_path='' as $$ declare old public.organization_subscriptions%rowtype; p public.saas_plans%rowtype; result uuid; price numeric; begin
 if not public.is_platform_admin('platform.subscriptions.manage') then raise exception using errcode='42501',message='PLATFORM_ADMIN_REQUIRED'; end if;
 if nullif(trim(target_reason),'') is null then raise exception using errcode='22023',message='REASON_REQUIRED'; end if;
 select * into p from public.saas_plans where id=target_plan_id and status in ('ACTIVE','DRAFT'); if not found then raise exception using errcode='P0001',message='INVALID_PLAN_TRANSITION'; end if;
 select * into old from public.organization_subscriptions where organization_id=target_organization_id order by created_at desc limit 1 for update;
 price:=case target_interval when 'ANNUAL' then p.annual_price else p.monthly_price end;
 if old.id is not null and target_effective_at>now() then update public.organization_subscriptions set cancel_at_period_end=true,current_period_end=target_effective_at where id=old.id returning id into result;
 else
  if old.id is not null and old.status in ('TRIALING','ACTIVE','PAST_DUE','GRACE_PERIOD','SUSPENDED') then update public.organization_subscriptions set status='CANCELLED',access_mode='READ_ONLY',cancelled_at=now() where id=old.id; end if;
  insert into public.organization_subscriptions(organization_id,plan_id,billing_interval,status,access_mode,current_period_start,current_period_end,provider,price_snapshot,currency_snapshot,manual_override) values(target_organization_id,p.id,target_interval,target_status,case when target_status in ('ACTIVE','TRIALING') then 'FULL_ACCESS' when target_status in ('PAST_DUE','GRACE_PERIOD') then 'GRACE_ACCESS' when target_status='SUSPENDED' then 'SUSPENDED' else 'READ_ONLY' end,now(),case target_interval when 'ANNUAL' then now()+interval '1 year' else now()+interval '1 month' end,'MANUAL',price,p.currency,true) returning id into result;
 end if;
 insert into public.platform_audit_events(actor_id,action,target_type,target_id,reason,before_data,after_data) values(auth.uid(),'platform.subscription.changed','organization',target_organization_id::text,target_reason,to_jsonb(old),jsonb_build_object('plan_id',target_plan_id,'status',target_status,'interval',target_interval)); return result; end $$;

create or replace function public.platform_extend_trial(target_organization_id uuid,target_new_end timestamptz,target_reason text) returns void
language plpgsql security definer set search_path='' as $$ declare old_end timestamptz; begin
 if not public.is_platform_admin('platform.subscriptions.manage') then raise exception using errcode='42501',message='PLATFORM_ADMIN_REQUIRED'; end if;
 select trial_ends_at into old_end from public.organization_subscriptions where organization_id=target_organization_id order by created_at desc limit 1 for update;
 if target_new_end<=now() or nullif(trim(target_reason),'') is null then raise exception using errcode='22023',message='INVALID_PLAN_TRANSITION'; end if;
 update public.organization_subscriptions set status='TRIALING',access_mode='FULL_ACCESS',trial_ends_at=target_new_end where organization_id=target_organization_id and created_at=(select max(created_at) from public.organization_subscriptions where organization_id=target_organization_id);
 insert into public.platform_audit_events(actor_id,action,target_type,target_id,reason,before_data,after_data) values(auth.uid(),'platform.trial.extended','organization',target_organization_id::text,target_reason,jsonb_build_object('trial_ends_at',old_end),jsonb_build_object('trial_ends_at',target_new_end)); end $$;

create or replace function public.platform_set_tenant_suspension(target_organization_id uuid,target_suspended boolean,target_reason text) returns void
language plpgsql security definer set search_path='' as $$ declare before_row public.organizations%rowtype; begin
 if not public.is_platform_admin('platform.tenants.manage') then raise exception using errcode='42501',message='PLATFORM_ADMIN_REQUIRED'; end if;
 if nullif(trim(target_reason),'') is null then raise exception using errcode='22023',message='REASON_REQUIRED'; end if;
 select * into before_row from public.organizations where id=target_organization_id for update; if not found then raise exception using errcode='P0001',message='TENANT_NOT_FOUND'; end if;
 update public.organizations set platform_suspended_at=case when target_suspended then now() end,platform_suspension_reason=case when target_suspended then trim(target_reason) end where id=target_organization_id;
 insert into public.platform_audit_events(actor_id,action,target_type,target_id,reason,before_data,after_data) values(auth.uid(),case when target_suspended then 'platform.tenant.suspended' else 'platform.tenant.reactivated' end,'organization',target_organization_id::text,target_reason,jsonb_build_object('suspended_at',before_row.platform_suspended_at),jsonb_build_object('suspended',target_suspended)); end $$;

create or replace function public.platform_set_feature_flag(target_feature_code text,target_scope text,target_organization_id uuid,target_enabled boolean,target_reason text) returns uuid
language plpgsql security definer set search_path='' as $$ declare result uuid; begin
 if not public.is_platform_admin('platform.features.manage') then raise exception using errcode='42501',message='PLATFORM_ADMIN_REQUIRED'; end if;
 if nullif(trim(target_reason),'') is null then raise exception using errcode='22023',message='REASON_REQUIRED'; end if;
 select id into result from public.platform_feature_flags where feature_code=target_feature_code and scope=target_scope and organization_id is not distinct from target_organization_id for update;
 if result is null then insert into public.platform_feature_flags(feature_code,scope,organization_id,enabled,reason,updated_by) values(target_feature_code,target_scope,target_organization_id,target_enabled,target_reason,auth.uid()) returning id into result;
 else update public.platform_feature_flags set enabled=target_enabled,reason=target_reason,updated_by=auth.uid() where id=result; end if;
 insert into public.platform_audit_events(actor_id,action,target_type,target_id,reason,after_data) values(auth.uid(),'platform.feature_flag.changed','feature_flag',result::text,target_reason,jsonb_build_object('feature_code',target_feature_code,'scope',target_scope,'enabled',target_enabled)); return result; end $$;

create or replace function public.cancel_organization_subscription(target_organization_id uuid) returns void
language plpgsql security definer set search_path='' as $$ begin
 if not public.has_permission(target_organization_id,'organizations.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 update public.organization_subscriptions set cancel_at_period_end=true where organization_id=target_organization_id and status in ('TRIALING','ACTIVE','PAST_DUE','GRACE_PERIOD');
 if not found then raise exception using errcode='P0001',message='INVALID_PLAN_TRANSITION'; end if;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data) values(target_organization_id,auth.uid(),'subscription.cancellation_scheduled','organization',target_organization_id,jsonb_build_object('cancel_at_period_end',true)); end $$;

create or replace function public.record_platform_webhook_event(target_provider text,target_event_id text,target_event_type text,target_payload_hash text) returns boolean
language plpgsql security definer set search_path='' as $$ begin
 insert into public.platform_webhook_events(provider,provider_event_id,event_type,payload_hash,status) values(upper(target_provider),target_event_id,target_event_type,target_payload_hash,'RECEIVED'); return true;
exception when unique_violation then return false; end $$;

create or replace function public.guard_platform_audit_immutability() returns trigger language plpgsql set search_path='' as $$ begin raise exception using errcode='42501',message='PLATFORM_AUDIT_IMMUTABLE'; end $$;
create trigger platform_audit_immutable before update or delete on public.platform_audit_events for each row execute function public.guard_platform_audit_immutability();

revoke all on function public.bootstrap_organization_subscription(),public.enforce_commercial_insert(),public.enforce_feature_write(),public.enforce_offline_sale_lease(),public.guard_platform_audit_immutability(),public.record_platform_webhook_event(text,text,text,text) from public,anon,authenticated;
grant execute on function public.record_platform_webhook_event(text,text,text,text) to service_role;
grant execute on function public.platform_create_plan(text,text,text,text,numeric,numeric,integer,boolean),public.platform_set_plan_entitlement(uuid,text,text,boolean,numeric,text,text),public.platform_change_subscription(uuid,uuid,text,text,timestamptz,text),public.platform_extend_trial(uuid,timestamptz,text),public.platform_set_tenant_suspension(uuid,boolean,text),public.platform_set_feature_flag(text,text,uuid,boolean,text),public.cancel_organization_subscription(uuid) to authenticated;

commit;
