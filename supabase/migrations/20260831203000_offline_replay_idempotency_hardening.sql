-- Keep an already-deployed migration immutable while hardening the Phase 8
-- wrapper. The replacement is anchored to the exact prior function body and
-- fails closed if that prerequisite ever differs.
do $$
declare
  definition text;
  anchor text := $body$  if coalesce(target_customer_credit_amount, 0) > 0 and not settings.offline_credit_allowed then$body$;
  guard text := $body$  select * into existing from public.pos_sales
  where organization_id = target_organization_id
    and idempotency_key = target_idempotency_key;
  if found then
    if not existing.originated_offline
      or existing.offline_device_id <> target_device_id
      or existing.local_transaction_id <> target_local_transaction_id
      or existing.offline_request_hash <> offline_hash then
      raise exception using errcode = 'P0001', message = 'SYNC_IDEMPOTENCY_CONFLICT';
    end if;
    return jsonb_build_object('pos_sale_id', existing.id, 'receipt_number', existing.receipt_number,
      'invoice_id', existing.customer_invoice_id, 'inventory_transaction_id', existing.inventory_transaction_id,
      'replayed', true, 'originated_offline', true);
  end if;
  if coalesce(target_customer_credit_amount, 0) > 0 and not settings.offline_credit_allowed then$body$;
begin
  select pg_get_functiondef(
    'public.replay_offline_pos_sale(uuid,uuid,uuid,timestamptz,uuid,uuid,jsonb,jsonb,numeric,numeric,text,uuid)'::regprocedure
  ) into definition;
  if position(anchor in definition) = 0 then
    raise exception 'OFFLINE_REPLAY_HARDENING_ANCHOR_MISSING';
  end if;
  execute replace(definition, anchor, guard);
end $$;
