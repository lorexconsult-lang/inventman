alter table public.inventory_movements drop constraint inventory_movement_value_sign;
alter table public.inventory_movements add constraint inventory_movement_value_sign check(
 (quantity_delta_base>0 and valuation_total>=0) or (quantity_delta_base<0 and valuation_total<=0)
);
