begin;

create or replace function public.production_database_readiness()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select true $$;

revoke all on function public.production_database_readiness() from public;
grant execute on function public.production_database_readiness() to anon, authenticated;

commit;
