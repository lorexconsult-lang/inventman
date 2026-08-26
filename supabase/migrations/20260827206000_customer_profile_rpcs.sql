create or replace function public.add_customer_contact(target_organization_id uuid,target_customer_id uuid,target_contact jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();result uuid:=gen_random_uuid();
begin
 if actor is null or not public.has_permission(target_organization_id,'customers.update') then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;
 if not exists(select 1 from public.customers where organization_id=target_organization_id and id=target_customer_id and status<>'ARCHIVED') then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE';end if;
 if nullif(trim(target_contact->>'name'),'') is null then raise exception using errcode='22023',message='INVALID_CONTACT';end if;
 if coalesce((target_contact->>'is_primary')::boolean,false) then update public.customer_contacts set is_primary=false where organization_id=target_organization_id and customer_id=target_customer_id;end if;
 insert into public.customer_contacts(id,organization_id,customer_id,name,title,email,phone,is_primary,is_billing,is_delivery,created_at)
 values(result,target_organization_id,target_customer_id,trim(target_contact->>'name'),nullif(trim(target_contact->>'title'),''),nullif(trim(target_contact->>'email'),''),nullif(trim(target_contact->>'phone'),''),coalesce((target_contact->>'is_primary')::boolean,false),coalesce((target_contact->>'is_billing')::boolean,false),coalesce((target_contact->>'is_delivery')::boolean,false),now());
 insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id,details)values(target_organization_id,'CUSTOMER',target_customer_id,'CONTACT_ADDED',actor,jsonb_build_object('contact_id',result));return result;
end $$;

create or replace function public.add_customer_address(target_organization_id uuid,target_customer_id uuid,target_address jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();result uuid:=gen_random_uuid();kind text:=target_address->>'address_type';
begin
 if actor is null or not public.has_permission(target_organization_id,'customers.update') then raise exception using errcode='42501',message='PERMISSION_DENIED';end if;
 if not exists(select 1 from public.customers where organization_id=target_organization_id and id=target_customer_id and status<>'ARCHIVED') then raise exception using errcode='P0001',message='CROSS_TENANT_REFERENCE';end if;
 if kind not in('BILLING','DELIVERY','OFFICE','HOME','OTHER') or nullif(trim(target_address->>'line_1'),'') is null or nullif(trim(target_address->>'country_code'),'') is null then raise exception using errcode='22023',message='INVALID_ADDRESS';end if;
 if coalesce((target_address->>'is_default_billing')::boolean,false) then update public.customer_addresses set is_default_billing=false where organization_id=target_organization_id and customer_id=target_customer_id;end if;
 if coalesce((target_address->>'is_default_delivery')::boolean,false) then update public.customer_addresses set is_default_delivery=false where organization_id=target_organization_id and customer_id=target_customer_id;end if;
 insert into public.customer_addresses(id,organization_id,customer_id,address_type,line_1,line_2,city,state_region,postal_code,country_code,is_default_billing,is_default_delivery)
 values(result,target_organization_id,target_customer_id,kind,trim(target_address->>'line_1'),nullif(trim(target_address->>'line_2'),''),nullif(trim(target_address->>'city'),''),nullif(trim(target_address->>'state_region'),''),nullif(trim(target_address->>'postal_code'),''),upper(trim(target_address->>'country_code')),coalesce((target_address->>'is_default_billing')::boolean,false),coalesce((target_address->>'is_default_delivery')::boolean,false));
 insert into public.sales_activity(organization_id,document_type,document_id,action,actor_id,details)values(target_organization_id,'CUSTOMER',target_customer_id,'ADDRESS_ADDED',actor,jsonb_build_object('address_id',result));return result;
end $$;
revoke all on function public.add_customer_contact(uuid,uuid,jsonb),public.add_customer_address(uuid,uuid,jsonb) from public,anon;
grant execute on function public.add_customer_contact(uuid,uuid,jsonb),public.add_customer_address(uuid,uuid,jsonb) to authenticated;
