-- Operational returns remain independent before an organization activates Finance.
create or replace function public.finance_sales_return_adapter() returns trigger language plpgsql security definer set search_path='' as $$
declare amount numeric; inventory uuid; cogs uuid;
begin
 if new.status='POSTED' and (tg_op='INSERT' or old.status<>'POSTED')
 and exists(select 1 from public.accounting_settings where organization_id=new.organization_id and status='ACTIVE' and activation_date<=new.return_date::date) then
  select coalesce(sum(quantity_base*unit_cost_base),0) into amount from public.sales_return_cost_allocations where organization_id=new.organization_id and sales_return_line_id in(select id from public.sales_return_lines where organization_id=new.organization_id and sales_return_id=new.id);
  if amount>0 then inventory:=public.finance_mapping(new.organization_id,'INVENTORY_ASSET',new.branch_id,null); cogs:=public.finance_mapping(new.organization_id,'SALE_COGS',new.branch_id,null); perform public.finance_post_lines(new.organization_id,new.return_date::date,'SALES','SALES_RETURN_COST',new.id,'Inventory restored '||new.return_number,jsonb_build_array(jsonb_build_object('account_id',inventory,'debit',amount,'branch_id',new.branch_id,'customer_id',new.customer_id),jsonb_build_object('account_id',cogs,'credit',amount,'branch_id',new.branch_id,'customer_id',new.customer_id)),1,new.created_by); end if;
 end if; return new;
end $$;
revoke all on function public.finance_sales_return_adapter() from public,anon,authenticated;
