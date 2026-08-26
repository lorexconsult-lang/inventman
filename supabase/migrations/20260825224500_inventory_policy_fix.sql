drop policy inventory_transactions_read on public.inventory_transactions;
create policy inventory_transactions_read on public.inventory_transactions for select to authenticated using(
 public.has_permission(organization_id,'inventory.movement_view') and exists(
  select 1 from public.inventory_movements movement where movement.transaction_id=inventory_transactions.id and public.can_access_branch(inventory_transactions.organization_id,movement.branch_id)
 )
);
