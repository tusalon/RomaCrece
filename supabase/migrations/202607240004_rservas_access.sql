create table public.romacrece_memberships (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  negocio_id uuid not null unique references public.negocios(id) on delete cascade,
  negocio_slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index romacrece_memberships_business_idx
  on public.romacrece_memberships(negocio_id);

alter table public.romacrece_memberships enable row level security;

create policy "members read their RomaCrece link"
  on public.romacrece_memberships
  for select to authenticated
  using ((select auth.uid()) = auth_user_id);

create table public.romacrece_login_attempts (
  identifier_hash text primary key,
  failure_count integer not null default 0 check (failure_count >= 0),
  first_failed_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.romacrece_login_attempts enable row level security;

create or replace function public.romacrece_access_status()
returns table (
  allowed boolean,
  reason text,
  negocio_id uuid,
  negocio_slug text,
  negocio_nombre text,
  subscription_state text,
  renewal_date date
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when membership.auth_user_id is null then false
      when subscription.negocio_id is null then false
      when lower(trim(coalesce(subscription.estado::text, ''))) <> 'activa' then false
      when subscription.fecha_renovacion is not null
        and subscription.fecha_renovacion::date >= date '2026-07-19'
        and subscription.fecha_renovacion::date <= (now() at time zone 'America/Havana')::date then false
      else true
    end as allowed,
    case
      when membership.auth_user_id is null then 'not_linked'
      when subscription.negocio_id is null then 'subscription_missing'
      when lower(trim(coalesce(subscription.estado::text, ''))) <> 'activa' then 'subscription_inactive'
      when subscription.fecha_renovacion is not null
        and subscription.fecha_renovacion::date >= date '2026-07-19'
        and subscription.fecha_renovacion::date <= (now() at time zone 'America/Havana')::date then 'subscription_expired'
      else 'active'
    end as reason,
    membership.negocio_id,
    membership.negocio_slug,
    business.nombre::text as negocio_nombre,
    subscription.estado::text as subscription_state,
    subscription.fecha_renovacion::date as renewal_date
  from (select 1) as anchor
  left join lateral (
    select linked.auth_user_id, linked.negocio_id, linked.negocio_slug
    from public.romacrece_memberships as linked
    where linked.auth_user_id = (select auth.uid())
    limit 1
  ) as membership on true
  left join public.negocios as business on business.id = membership.negocio_id
  left join lateral (
    select paid.negocio_id, paid.estado, paid.fecha_renovacion
    from public.suscripciones as paid
    where paid.negocio_id = membership.negocio_id
    order by paid.fecha_renovacion desc nulls last, paid.created_at desc
    limit 1
  ) as subscription on true;
$$;

create or replace function public.romacrece_has_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select status.allowed from public.romacrece_access_status() as status limit 1), false);
$$;

revoke all on function public.romacrece_access_status() from public;
revoke all on function public.romacrece_has_access() from public;
grant execute on function public.romacrece_access_status() to authenticated;
grant execute on function public.romacrece_has_access() to authenticated;

drop policy if exists "owners manage their businesses" on public.businesses;
create policy "active members manage their businesses" on public.businesses
  for all to authenticated
  using ((select auth.uid()) = owner_id and (select public.romacrece_has_access()))
  with check ((select auth.uid()) = owner_id and (select public.romacrece_has_access()));

drop policy if exists "owners manage their audits" on public.audit_snapshots;
create policy "active members manage their audits" on public.audit_snapshots
  for all to authenticated
  using ((select auth.uid()) = owner_id and (select public.romacrece_has_access()))
  with check ((select auth.uid()) = owner_id and (select public.romacrece_has_access()));

drop policy if exists "owners manage their ideas" on public.content_ideas;
create policy "active members manage their ideas" on public.content_ideas
  for all to authenticated
  using ((select auth.uid()) = owner_id and (select public.romacrece_has_access()))
  with check ((select auth.uid()) = owner_id and (select public.romacrece_has_access()));

drop policy if exists "owners manage their calendar" on public.planned_content;
create policy "active members manage their calendar" on public.planned_content
  for all to authenticated
  using ((select auth.uid()) = owner_id and (select public.romacrece_has_access()))
  with check ((select auth.uid()) = owner_id and (select public.romacrece_has_access()));

drop policy if exists "owners read their ai audits" on public.ai_audits;
create policy "active members read their ai audits" on public.ai_audits
  for select to authenticated
  using ((select auth.uid()) = owner_id and (select public.romacrece_has_access()));

drop policy if exists "owners manage their weekly metrics" on public.weekly_metrics;
create policy "active members manage their weekly metrics" on public.weekly_metrics
  for all to authenticated
  using ((select auth.uid()) = owner_id and (select public.romacrece_has_access()))
  with check ((select auth.uid()) = owner_id and (select public.romacrece_has_access()));
