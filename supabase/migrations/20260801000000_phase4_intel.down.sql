drop policy if exists "ai_summaries_owner_read" on public.ai_summaries;
drop table if exists public.ai_summaries cascade;
alter table public.surveys drop column if exists variants;
