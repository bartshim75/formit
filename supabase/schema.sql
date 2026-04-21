-- ============================================================================
-- Formit — Supabase schema
-- Run this entire file in Supabase dashboard → SQL Editor → New query → Run
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================================

-- ---------- Extensions ------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ---------- Tables ----------------------------------------------------------

create table if not exists public.surveys (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  title        text not null default '제목 없는 설문',
  description  text not null default '',
  emoji        text not null default '📝',
  color        text not null default '#E03E6C',
  status       text not null default 'draft'
               check (status in ('draft','live','closed')),
  sections     jsonb not null default '[]'::jsonb,
  settings     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists surveys_owner_idx
  on public.surveys(owner_id, updated_at desc);
create index if not exists surveys_status_idx
  on public.surveys(status);

create table if not exists public.responses (
  id            uuid primary key default gen_random_uuid(),
  survey_id     uuid not null references public.surveys(id) on delete cascade,
  answers       jsonb not null default '{}'::jsonb,
  meta          jsonb not null default '{}'::jsonb,
  submitted_at  timestamptz not null default now()
);

create index if not exists responses_survey_idx
  on public.responses(survey_id, submitted_at desc);

-- ---------- updated_at trigger ---------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists surveys_touch_updated_at on public.surveys;
create trigger surveys_touch_updated_at
  before update on public.surveys
  for each row execute function public.touch_updated_at();

-- ---------- Row Level Security ---------------------------------------------

alter table public.surveys   enable row level security;
alter table public.responses enable row level security;

-- surveys: owner can do anything with their own rows
drop policy if exists "surveys_owner_all" on public.surveys;
create policy "surveys_owner_all"
  on public.surveys
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- surveys: anyone (even anonymous) can SELECT a live survey (for respondents)
drop policy if exists "surveys_public_read_live" on public.surveys;
create policy "surveys_public_read_live"
  on public.surveys
  for select
  to anon, authenticated
  using (status = 'live');

-- responses: anyone (even anonymous) can INSERT a response to a live survey
drop policy if exists "responses_public_insert_live" on public.responses;
create policy "responses_public_insert_live"
  on public.responses
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.surveys s
      where s.id = responses.survey_id
        and s.status = 'live'
    )
  );

-- responses: only the survey owner can SELECT / DELETE responses
drop policy if exists "responses_owner_select" on public.responses;
create policy "responses_owner_select"
  on public.responses
  for select
  to authenticated
  using (
    exists (
      select 1 from public.surveys s
      where s.id = responses.survey_id
        and s.owner_id = auth.uid()
    )
  );

drop policy if exists "responses_owner_delete" on public.responses;
create policy "responses_owner_delete"
  on public.responses
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.surveys s
      where s.id = responses.survey_id
        and s.owner_id = auth.uid()
    )
  );

-- ---------- Response count (public-safe) -----------------------------------
-- SECURITY DEFINER RPC that returns only a count for a given survey id.
-- Lets respondent view show "N people answered so far" without exposing rows.

create or replace function public.survey_response_count(p_survey_id uuid)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.responses r
  join public.surveys s on s.id = r.survey_id
  where r.survey_id = p_survey_id
    and s.status = 'live';
$$;

grant execute on function public.survey_response_count(uuid) to anon, authenticated;

-- ---------- Done ------------------------------------------------------------
-- You can verify with:
--   select * from public.surveys;
--   select * from public.responses;
