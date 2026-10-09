-- Tope diario de usos de IA por salón, aplicado en el servidor (antes solo existía en la pantalla).
-- Para deshacer: drop function public.romacrece_take_ai_quota(uuid, text, integer);
--                drop table public.romacrece_ai_usage;
create table public.romacrece_ai_usage (
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('content', 'audit')),
  uses integer not null default 0 check (uses >= 0),
  primary key (negocio_id, day, kind)
);

alter table public.romacrece_ai_usage enable row level security;

-- Suma un uso y dice si estaba dentro del tope. Atómica: dos llamadas a la vez no se saltan el límite.
create or replace function public.romacrece_take_ai_quota(p_negocio uuid, p_kind text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uses integer;
begin
  insert into public.romacrece_ai_usage as u (negocio_id, day, kind, uses)
  values (p_negocio, (now() at time zone 'America/Havana')::date, p_kind, 1)
  on conflict (negocio_id, day, kind)
  do update set uses = u.uses + 1 where u.uses < p_limit
  returning u.uses into v_uses;
  return v_uses is not null;
end;
$$;

revoke all on function public.romacrece_take_ai_quota(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.romacrece_take_ai_quota(uuid, text, integer) to service_role;
