create or replace function public.normalize_pos_cash_tender()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.change_due is distinct from old.change_due then
  select nullif(coalesce(sum(s.tendered_amount),0),0)
  into new.cash_tendered
  from public.pos_sale_settlements s
  join public.payment_methods m on m.organization_id=s.organization_id and m.id=s.payment_method_id
  where s.organization_id=new.organization_id and s.pos_sale_id=new.id
   and s.settlement_type='PAYMENT' and m.method_type='CASH';
 end if;
 return new;
end $$;

create trigger pos_sales_normalize_cash_tender before update of change_due on public.pos_sales
for each row execute function public.normalize_pos_cash_tender();

revoke all on function public.normalize_pos_cash_tender() from public,anon,authenticated;
