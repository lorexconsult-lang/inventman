-- pg_get_functiondef normalizes the interval using INTERVAL literal syntax.
do $$
declare definition text;
begin
 select pg_get_functiondef('public.initialize_accounting(uuid,text,integer,date)'::regprocedure) into definition;
 definition:=replace(definition,'1 month-1 day','1 month'' - interval ''1 day');
 if definition not like '%1 month'' - interval ''1 day%' then raise exception 'initialize_accounting interval replacement failed'; end if;
 execute definition;
end $$;
