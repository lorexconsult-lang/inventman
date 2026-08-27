create or replace function public.cleanup_customer_credit_settlement_dependencies()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('app.ephemeral_verification_cleanup', true) = 'on' then
    delete from public.customer_credit_allocations
    where organization_id = old.organization_id and credit_note_id = old.id;
    delete from public.customer_refunds
    where organization_id = old.organization_id and source_credit_note_id = old.id;
  end if;
  return old;
end
$$;

create or replace function public.cleanup_supplier_credit_settlement_dependencies()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('app.ephemeral_verification_cleanup', true) = 'on' then
    delete from public.supplier_credit_allocations
    where organization_id = old.organization_id and supplier_credit_id = old.id;
  end if;
  return old;
end
$$;

drop trigger if exists cleanup_customer_credit_settlement_dependencies_trigger on public.customer_credit_notes;
create trigger cleanup_customer_credit_settlement_dependencies_trigger
before delete on public.customer_credit_notes
for each row execute function public.cleanup_customer_credit_settlement_dependencies();

drop trigger if exists cleanup_supplier_credit_settlement_dependencies_trigger on public.supplier_credits;
create trigger cleanup_supplier_credit_settlement_dependencies_trigger
before delete on public.supplier_credits
for each row execute function public.cleanup_supplier_credit_settlement_dependencies();

revoke all on function public.cleanup_customer_credit_settlement_dependencies() from public, anon, authenticated;
revoke all on function public.cleanup_supplier_credit_settlement_dependencies() from public, anon, authenticated;
