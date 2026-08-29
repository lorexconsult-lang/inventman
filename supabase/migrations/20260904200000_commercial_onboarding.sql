begin;

create or replace function public.public_saas_plans()
returns table(code text,name text,description text,currency text,monthly_price numeric,annual_price numeric,trial_days integer,display_order integer,is_custom boolean,entitlements jsonb)
language sql stable security definer set search_path=''
as $$
 select p.code,p.name,p.description,p.currency,p.monthly_price,p.annual_price,p.trial_days,p.display_order,p.is_custom,
 coalesce((select jsonb_agg(jsonb_build_object('feature_code',e.feature_code,'type',e.entitlement_type,'enabled',e.enabled,'value',e.numeric_value,'text',e.text_value) order by e.feature_code) from public.plan_entitlements e where e.plan_id=p.id),'[]'::jsonb)
 from public.saas_plans p where p.status='ACTIVE' and p.is_public order by p.display_order,p.name
$$;

revoke all on function public.public_saas_plans() from public;
grant execute on function public.public_saas_plans() to anon,authenticated;

create table public.organization_onboarding (
 organization_id uuid primary key references public.organizations(id) on delete cascade,
 business_type text not null default 'GENERAL',
 current_step text not null default 'BUSINESS_PROFILE',
 completed_steps text[] not null default '{}',
 completed_at timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.organization_onboarding enable row level security;
alter table public.organization_onboarding force row level security;
create policy onboarding_member_read on public.organization_onboarding for select to authenticated using(public.is_active_organization_member(organization_id));
grant select on public.organization_onboarding to authenticated;

create or replace function public.create_commercial_organization(organization_name text,organization_slug text,country_code text,currency_code text,organization_timezone text,target_business_type text,target_plan_code text default null)
returns uuid language plpgsql security definer set search_path=''
as $$ declare actor uuid:=auth.uid(); org_id uuid; selected_plan public.saas_plans%rowtype; existing uuid; begin
 if actor is null then raise exception using errcode='42501',message='AUTHENTICATION_REQUIRED'; end if;
 select m.organization_id into existing from public.organization_members m where m.user_id=actor and m.status='active' order by m.created_at limit 1;
 if existing is not null then return existing; end if;
 if nullif(trim(target_plan_code),'') is not null then
  select * into selected_plan from public.saas_plans where code=upper(target_plan_code) and status='ACTIVE' and is_public;
  if not found then raise exception using errcode='22023',message='PLAN_UNAVAILABLE'; end if;
 end if;
 org_id:=public.create_organization(organization_name,organization_slug,country_code,currency_code,organization_timezone);
 if selected_plan.id is not null then
  update public.organization_subscriptions set plan_id=selected_plan.id,billing_interval='MONTHLY',trial_ends_at=trial_started_at+make_interval(days=>selected_plan.trial_days),price_snapshot=selected_plan.monthly_price,currency_snapshot=selected_plan.currency where organization_id=org_id and status='TRIALING';
 end if;
 insert into public.organization_onboarding(organization_id,business_type) values(org_id,upper(target_business_type));
 return org_id;
end $$;
revoke all on function public.create_commercial_organization(text,text,text,text,text,text,text) from public,anon;
grant execute on function public.create_commercial_organization(text,text,text,text,text,text,text) to authenticated;

create or replace function public.set_organization_onboarding(target_organization_id uuid,target_business_type text,target_step text,target_completed_steps text[],target_complete boolean default false)
returns void language plpgsql security definer set search_path=''
as $$ begin
 if not public.has_permission(target_organization_id,'organizations.manage') then raise exception using errcode='42501',message='PERMISSION_DENIED'; end if;
 insert into public.organization_onboarding(organization_id,business_type,current_step,completed_steps,completed_at)
 values(target_organization_id,upper(target_business_type),upper(target_step),coalesce(target_completed_steps,'{}'),case when target_complete then now() end)
 on conflict(organization_id) do update set business_type=excluded.business_type,current_step=excluded.current_step,completed_steps=excluded.completed_steps,completed_at=coalesce(public.organization_onboarding.completed_at,excluded.completed_at),updated_at=now();
end $$;
revoke all on function public.set_organization_onboarding(uuid,text,text,text[],boolean) from public,anon;
grant execute on function public.set_organization_onboarding(uuid,text,text,text[],boolean) to authenticated;

commit;
