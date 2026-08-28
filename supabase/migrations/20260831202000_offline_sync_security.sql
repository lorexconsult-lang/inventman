alter table public.offline_devices enable row level security;
alter table public.offline_devices force row level security;
alter table public.offline_sync_events enable row level security;
alter table public.offline_sync_events force row level security;

revoke all on public.offline_devices, public.offline_sync_events from anon, authenticated;
grant select on public.offline_devices, public.offline_sync_events to authenticated;

create policy offline_devices_select on public.offline_devices for select to authenticated
using (
  public.can_access_branch(organization_id, branch_id)
  and (registered_by = auth.uid() or public.has_permission(organization_id, 'offline.devices.view'))
);

create policy offline_sync_events_select on public.offline_sync_events for select to authenticated
using (
  public.can_access_branch(organization_id, branch_id)
  and (actor_id = auth.uid() or public.has_permission(organization_id, 'offline.conflicts.view'))
);

drop view public.pos_receipts;
create view public.pos_receipts with (security_invoker = true) as
select s.id, s.organization_id, s.branch_id, s.terminal_id, s.session_id, s.cashier_user_id, s.receipt_number,
 s.customer_id, s.sales_order_id, s.fulfilment_id, s.customer_invoice_id, s.inventory_transaction_id, s.currency,
 s.subtotal, s.discount, s.tax, s.total, s.cash_tendered, s.change_due, s.status, s.completed_at,
 c.display_name customer_name, t.name terminal_name, t.terminal_code, b.name branch_name, i.invoice_number,
 coalesce((select jsonb_agg(jsonb_build_object('type',x.settlement_type,'amount',x.amount,'tendered',x.tendered_amount,'change',x.change_amount,'reference',x.external_reference,'method',m.name) order by x.created_at)
  from public.pos_sale_settlements x left join public.payment_methods m on m.organization_id=x.organization_id and m.id=x.payment_method_id where x.organization_id=s.organization_id and x.pos_sale_id=s.id),'[]'::jsonb) settlements,
 s.originated_offline, s.offline_device_id, s.local_transaction_id, s.local_created_at, s.server_received_at
from public.pos_sales s join public.customers c on c.organization_id=s.organization_id and c.id=s.customer_id
join public.pos_terminals t on t.organization_id=s.organization_id and t.id=s.terminal_id
join public.branches b on b.organization_id=s.organization_id and b.id=s.branch_id
join public.customer_invoices i on i.organization_id=s.organization_id and i.id=s.customer_invoice_id;
grant select on public.pos_receipts to authenticated;

do $$
declare function_row record;
begin
  for function_row in
    select p.oid::regprocedure signature from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'register_offline_device','manage_offline_device','update_offline_settings',
      'replay_offline_pos_sale','record_offline_sync_failure'
    )
  loop
    execute format('revoke all on function %s from public, anon, authenticated', function_row.signature);
    execute format('grant execute on function %s to authenticated', function_row.signature);
  end loop;
end $$;
