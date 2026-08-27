do $$
declare definition text;old_fragment text;new_fragment text;
begin
 select pg_get_functiondef(p.oid) into definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname='post_pos_sale';
 old_fragment:='update public.pos_sales set change_due=change_due where id=sale_id;';
 new_fragment:='update public.pos_sales ps set cash_tendered=(select nullif(coalesce(sum(s.tendered_amount),0),0) from public.pos_sale_settlements s join public.payment_methods m on m.organization_id=s.organization_id and m.id=s.payment_method_id where s.organization_id=target_organization_id and s.pos_sale_id=sale_id and m.method_type=''CASH''),change_due=(select coalesce(sum(s.change_amount),0) from public.pos_sale_settlements s where s.organization_id=target_organization_id and s.pos_sale_id=sale_id) where ps.id=sale_id;';
 if definition is null or position(old_fragment in definition)=0 then raise exception 'POST_POS_SALE_DEFINITION_UNEXPECTED';end if;
 execute replace(definition,old_fragment,new_fragment);
end $$;
