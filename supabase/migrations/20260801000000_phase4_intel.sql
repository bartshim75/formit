-- Phase 4: AI 요약 캐시 + 설문 A/B variant 메타

alter table public.surveys
  add column if not exists variants jsonb;

create table if not exists public.ai_summaries (
  survey_id uuid not null references public.surveys(id) on delete cascade,
  question_id text not null,
  model text not null,
  summary jsonb not null,
  generated_at timestamptz not null default now(),
  response_count_at_time int not null,
  primary key (survey_id, question_id, model)
);

create index if not exists ai_summaries_survey_idx on public.ai_summaries(survey_id, generated_at desc);

alter table public.ai_summaries enable row level security;

drop policy if exists "ai_summaries_owner_read" on public.ai_summaries;
create policy "ai_summaries_owner_read"
  on public.ai_summaries
  for select
  to authenticated
  using (
    exists (
      select 1 from public.surveys s
      where s.id = ai_summaries.survey_id
        and s.owner_id = auth.uid()
    )
  );
