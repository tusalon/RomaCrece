alter table public.content_ideas
  add column if not exists feedback text check (feedback is null or feedback in ('useful', 'not_useful')),
  add column if not exists feedback_reason text not null default '';

alter table public.planned_content
  add column if not exists week_start date,
  add column if not exists source_idea_client_id bigint;

update public.planned_content
set week_start = date_trunc('week', timezone('America/Havana', now()))::date + (week_offset * 7)
where week_start is null;

alter table public.weekly_metrics
  add column if not exists best_planned_content_client_id bigint;

create index if not exists planned_content_week_start_idx
  on public.planned_content(business_id, week_start, day_index);

create index if not exists planned_content_source_idea_idx
  on public.planned_content(business_id, source_idea_client_id);
