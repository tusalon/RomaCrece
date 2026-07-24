create table public.weekly_metrics (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  followers integer not null default 0 check (followers >= 0),
  reach integer not null default 0 check (reach >= 0),
  profile_visits integer not null default 0 check (profile_visits >= 0),
  likes integer not null default 0 check (likes >= 0),
  comments integer not null default 0 check (comments >= 0),
  saves integer not null default 0 check (saves >= 0),
  messages integer not null default 0 check (messages >= 0),
  bookings integer not null default 0 check (bookings >= 0),
  posts integer not null default 0 check (posts >= 0),
  reels integer not null default 0 check (reels >= 0),
  stories integer not null default 0 check (stories >= 0),
  best_post text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, week_start)
);

create index weekly_metrics_owner_idx on public.weekly_metrics(owner_id, week_start desc);
create index weekly_metrics_business_idx on public.weekly_metrics(business_id, week_start desc);

alter table public.weekly_metrics enable row level security;

create policy "owners manage their weekly metrics" on public.weekly_metrics
  for all to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
