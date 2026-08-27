insert into public.permissions(code,description) values
('pos.access','Access point of sale'),
('pos.sale.create','Complete point-of-sale sales'),
('pos.discount.apply','Apply permitted point-of-sale discounts'),
('pos.discount.override','Override point-of-sale discount limits'),
('pos.hold','Hold and resume carts'),
('pos.void','Abandon held carts and initiate safe void workflows'),
('pos.return','Initiate point-of-sale returns'),
('pos.refund','Record approved point-of-sale refunds'),
('pos.session.open','Open cashier sessions'),
('pos.session.close','Close own cashier sessions'),
('pos.session.review','Review and approve cashier sessions'),
('pos.cash.in','Record till cash in'),
('pos.cash.out','Record till cash out'),
('pos.cash.drop','Record till cash drops'),
('pos.receipt.reprint','Reprint receipts'),
('pos.terminal.view','View POS terminals'),
('pos.terminal.manage','Manage POS terminals and settings'),
('pos.reports.view','View POS reports')
on conflict(code) do update set description=excluded.description;

insert into public.role_permissions(organization_id,role_id,permission_id)
select r.organization_id,r.id,p.id from public.roles r cross join public.permissions p
where r.is_system and r.name in('Owner','Administrator') and p.code like 'pos.%'
on conflict do nothing;

-- Cashier remains a template only. Effective capabilities, never this name, authorize every operation.
insert into public.role_permissions(organization_id,role_id,permission_id)
select r.organization_id,r.id,p.id from public.roles r cross join public.permissions p
where r.is_system and r.name='Cashier' and p.code in(
 'pos.access','pos.sale.create','pos.discount.apply','pos.hold','pos.return',
 'pos.session.open','pos.session.close','pos.cash.in','pos.cash.out','pos.cash.drop',
 'pos.receipt.reprint','pos.terminal.view',
 'products.view','customers.view','sales.quotation_create','sales.order_create','sales.order_confirm','sales.discount_override',
 'sales.fulfilment_create','sales.fulfilment_post','sales.invoice_create','sales.invoice_issue',
 'payments.customer.view','payments.customer.create','payments.customer.post','payments.customer.allocate',
 'payments.accounts.view','receivables.payments.view','inventory.view','inventory.reserve'
)
on conflict do nothing;

insert into public.pos_settings(organization_id)
select id from public.organizations on conflict(organization_id) do nothing;

create or replace function public.initialize_pos_settings()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.pos_settings(organization_id) values(new.id) on conflict do nothing;
 return new;
end $$;
create trigger organizations_initialize_pos_settings after insert on public.organizations
for each row execute function public.initialize_pos_settings();

create or replace function public.update_pos_settings(
 target_organization_id uuid,target_require_customer boolean,target_allow_walk_in boolean,
 target_allow_discounts boolean,target_discount_threshold_percent numeric,
 target_cash_variance_tolerance numeric,target_hold_expiration_minutes integer,target_return_policy text)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null or not public.has_permission(target_organization_id,'pos.terminal.manage') then
  raise exception using errcode='42501',message='PERMISSION_DENIED';
 end if;
 update public.pos_settings set require_customer=target_require_customer,allow_walk_in=target_allow_walk_in,
  allow_discounts=target_allow_discounts,discount_threshold_percent=target_discount_threshold_percent,
  cash_variance_tolerance=target_cash_variance_tolerance,hold_expiration_minutes=target_hold_expiration_minutes,
  return_policy=nullif(trim(target_return_policy),''),updated_at=now(),updated_by=actor
 where organization_id=target_organization_id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data)
 values(target_organization_id,actor,'pos.settings.updated','organization',target_organization_id,
  jsonb_build_object('require_customer',target_require_customer,'allow_walk_in',target_allow_walk_in,
   'allow_discounts',target_allow_discounts,'discount_threshold_percent',target_discount_threshold_percent,
   'cash_variance_tolerance',target_cash_variance_tolerance,'hold_expiration_minutes',target_hold_expiration_minutes));
end $$;

create or replace function public.review_pos_session(target_organization_id uuid,target_session_id uuid,target_approve boolean,target_notes text)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); target public.pos_sessions%rowtype;
begin
 select * into target from public.pos_sessions where organization_id=target_organization_id and id=target_session_id for update;
 if not found then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE';end if;
 if actor is null or not public.has_permission(target_organization_id,'pos.session.review') or not public.can_access_branch(target_organization_id,target.branch_id) then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;
 if target.status<>'REVIEW_REQUIRED' then raise exception using errcode='P0001',message='POS_SESSION_REVIEW_NOT_REQUIRED';end if;
 if not target_approve then raise exception using errcode='P0001',message='POS_SESSION_CORRECTION_REQUIRED';end if;
 update public.pos_sessions set status='CLOSED',approved_by=actor,closing_notes=concat_ws(E'\n',closing_notes,nullif(trim(target_notes),'')) where id=target.id;
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data)
 values(target_organization_id,actor,'pos.session.reviewed','pos_session',target.id,jsonb_build_object('approved',true,'variance',target.variance));
end $$;

create or replace function public.record_pos_cash_refund(target_organization_id uuid,target_session_id uuid,target_refund_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); target_session public.pos_sessions%rowtype; refund public.customer_refunds%rowtype; result uuid:=gen_random_uuid();
begin
 select * into target_session from public.pos_sessions where organization_id=target_organization_id and id=target_session_id for update;
 if not found or target_session.status<>'OPEN' then raise exception using errcode='P0001',message='POS_SESSION_REQUIRED';end if;
 if actor is null or target_session.cashier_user_id<>actor or not public.has_permission(target_organization_id,'pos.refund') then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;
 select * into refund from public.customer_refunds where organization_id=target_organization_id and id=target_refund_id and branch_id=target_session.branch_id and status='POSTED';
 if not found then raise exception using errcode='P0001',message='POS_REFUND_INVALID';end if;
 if exists(select 1 from public.pos_cash_events where organization_id=target_organization_id and source_type='CUSTOMER_REFUND' and source_id=refund.id) then raise exception using errcode='P0001',message='IDEMPOTENCY_CONFLICT';end if;
 insert into public.pos_cash_events(id,organization_id,branch_id,terminal_id,session_id,event_type,amount,direction,source_type,source_id,reason,actor_id)
 values(result,target_organization_id,target_session.branch_id,target_session.terminal_id,target_session.id,'CASH_REFUND',refund.amount,'OUT','CUSTOMER_REFUND',refund.id,'Posted customer refund',actor);
 insert into public.audit_events(organization_id,actor_id,action,entity_type,entity_id,after_data)
 values(target_organization_id,actor,'pos.refund.recorded','customer_refund',refund.id,jsonb_build_object('session_id',target_session.id,'cash_event_id',result));
 return result;
end $$;

create or replace view public.pos_session_summaries with(security_invoker=true) as
select s.*,t.terminal_code,t.name terminal_name,
 coalesce((select sum(ps.total) from public.pos_sales ps where ps.organization_id=s.organization_id and ps.session_id=s.id and ps.status<>'VOIDED'),0) sales_total,
 coalesce((select count(*) from public.pos_sales ps where ps.organization_id=s.organization_id and ps.session_id=s.id and ps.status<>'VOIDED'),0) transaction_count,
 public.pos_expected_cash(s.id) live_expected_cash
from public.pos_sessions s join public.pos_terminals t on t.organization_id=s.organization_id and t.id=s.terminal_id;

create or replace view public.pos_receipts with(security_invoker=true) as
select s.id,s.organization_id,s.branch_id,s.terminal_id,s.session_id,s.cashier_user_id,s.receipt_number,
 s.customer_id,s.sales_order_id,s.fulfilment_id,s.customer_invoice_id,s.inventory_transaction_id,s.currency,
 s.subtotal,s.discount,s.tax,s.total,s.cash_tendered,s.change_due,s.status,s.completed_at,
 c.display_name customer_name,t.name terminal_name,t.terminal_code,b.name branch_name,i.invoice_number,
 coalesce((select jsonb_agg(jsonb_build_object('type',x.settlement_type,'amount',x.amount,'tendered',x.tendered_amount,'change',x.change_amount,'reference',x.external_reference,'method',m.name) order by x.created_at)
  from public.pos_sale_settlements x left join public.payment_methods m on m.organization_id=x.organization_id and m.id=x.payment_method_id where x.organization_id=s.organization_id and x.pos_sale_id=s.id),'[]'::jsonb) settlements
from public.pos_sales s join public.customers c on c.organization_id=s.organization_id and c.id=s.customer_id
join public.pos_terminals t on t.organization_id=s.organization_id and t.id=s.terminal_id
join public.branches b on b.organization_id=s.organization_id and b.id=s.branch_id
join public.customer_invoices i on i.organization_id=s.organization_id and i.id=s.customer_invoice_id;

create or replace view public.pos_daily_summary with(security_invoker=true) as
select organization_id,branch_id,(completed_at at time zone 'UTC')::date sale_date,currency,
 count(*) filter(where status<>'VOIDED') transaction_count,
 coalesce(sum(total) filter(where status<>'VOIDED'),0) gross_sales,
 coalesce(sum(discount) filter(where status<>'VOIDED'),0) discounts,
 coalesce(sum(tax) filter(where status<>'VOIDED'),0) tax,
 coalesce(avg(total) filter(where status<>'VOIDED'),0) average_transaction
from public.pos_sales group by organization_id,branch_id,(completed_at at time zone 'UTC')::date,currency;

do $$declare table_name text;begin
 foreach table_name in array array['pos_settings','pos_terminals','pos_sessions','pos_held_carts','pos_sales','pos_sale_settlements','pos_cash_events','pos_receipt_reprints'] loop
  execute format('alter table public.%I enable row level security',table_name);
  execute format('alter table public.%I force row level security',table_name);
  execute format('revoke all on public.%I from anon,authenticated',table_name);
  execute format('grant select on public.%I to authenticated',table_name);
 end loop;
end $$;

create policy pos_settings_select on public.pos_settings for select to authenticated using(public.has_permission(organization_id,'pos.terminal.view') or public.has_permission(organization_id,'pos.access'));
create policy pos_terminals_select on public.pos_terminals for select to authenticated using(public.has_permission(organization_id,'pos.terminal.view') and public.can_access_branch(organization_id,branch_id));
create policy pos_sessions_select on public.pos_sessions for select to authenticated using(public.can_access_branch(organization_id,branch_id) and (cashier_user_id=auth.uid() or public.has_permission(organization_id,'pos.session.review')));
create policy pos_held_carts_select on public.pos_held_carts for select to authenticated using(public.can_access_branch(organization_id,branch_id) and (cashier_user_id=auth.uid() or public.has_permission(organization_id,'pos.session.review')));
create policy pos_sales_select on public.pos_sales for select to authenticated using(public.has_permission(organization_id,'pos.access') and public.can_access_branch(organization_id,branch_id));
create policy pos_settlements_select on public.pos_sale_settlements for select to authenticated using(exists(select 1 from public.pos_sales s where s.organization_id=pos_sale_settlements.organization_id and s.id=pos_sale_settlements.pos_sale_id));
create policy pos_cash_events_select on public.pos_cash_events for select to authenticated using(public.can_access_branch(organization_id,branch_id) and (actor_id=auth.uid() or public.has_permission(organization_id,'pos.session.review')));
create policy pos_reprints_select on public.pos_receipt_reprints for select to authenticated using(exists(select 1 from public.pos_sales s where s.organization_id=pos_receipt_reprints.organization_id and s.id=pos_receipt_reprints.pos_sale_id));

grant select on public.pos_session_summaries,public.pos_receipts,public.pos_daily_summary to authenticated;

do $$declare function_row record;begin
 for function_row in select p.oid::regprocedure signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in('initialize_pos_settings','pos_expected_cash','create_pos_terminal','update_pos_terminal','update_pos_settings','open_pos_session','record_pos_cash_event','close_pos_session','review_pos_session','hold_pos_cart','abandon_pos_cart','post_pos_sale','record_pos_receipt_reprint','record_pos_cash_refund') loop
  execute format('revoke all on function %s from public,anon,authenticated',function_row.signature);
  if function_row.proname<>'initialize_pos_settings' then execute format('grant execute on function %s to authenticated',function_row.signature);end if;
 end loop;
end $$;
