create table public.ai_audits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'gemini',
  model text not null,
  week_start date not null,
  analysis jsonb not null,
  created_at timestamptz not null default now(),
  unique (business_id, week_start)
);

create index ai_audits_owner_idx on public.ai_audits(owner_id, created_at desc);
create index ai_audits_business_idx on public.ai_audits(business_id, week_start desc);

alter table public.ai_audits enable row level security;

create policy "owners read their ai audits" on public.ai_audits
  for select to authenticated using ((select auth.uid()) = owner_id);
