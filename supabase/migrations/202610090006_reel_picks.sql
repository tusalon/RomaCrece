-- Reels que las dueñas marcan con «Quiero hacerlo». Solo la función submit-reel-picks
-- (service role) escribe aquí; cada dueña solo puede leer los de su salón.
-- Para deshacer: drop table if exists public.romacrece_reel_picks;
create table public.romacrece_reel_picks (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  reel_id text not null check (reel_id ~ '^reel-[0-9]{2}$'),
  reel_title text not null check (char_length(reel_title) between 1 and 80),
  note text check (note is null or char_length(note) <= 280),
  picked_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (negocio_id, reel_id)
);

create index romacrece_reel_picks_pending_idx
  on public.romacrece_reel_picks(picked_at) where notified_at is null;

alter table public.romacrece_reel_picks enable row level security;

create policy "members read their reel picks"
  on public.romacrece_reel_picks
  for select to authenticated
  using (negocio_id in (
    select negocio_id from public.romacrece_memberships
    where auth_user_id = (select auth.uid())
  ));
