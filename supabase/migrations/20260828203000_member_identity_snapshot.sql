begin;

create or replace function public.fill_organization_member_identity()
returns trigger language plpgsql security definer set search_path='' as $$
declare identity_email text; identity_name text;
begin
 select lower(u.email),nullif(trim(u.raw_user_meta_data->>'full_name'),'') into identity_email,identity_name from auth.users u where u.id=new.user_id;
 new.email:=coalesce(new.email,identity_email);
 new.display_name:=coalesce(new.display_name,identity_name);
 return new;
end $$;

drop trigger if exists fill_organization_member_identity on public.organization_members;
create trigger fill_organization_member_identity before insert or update of user_id on public.organization_members for each row execute function public.fill_organization_member_identity();
revoke all on function public.fill_organization_member_identity() from public,anon,authenticated;

commit;
