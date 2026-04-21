-- Phase 3: 알림 · 워크스페이스(1인 기본) · 구독 · 웹훅 URL
-- 기존 RLS(surveys_owner_all 등)는 유지하고, 워크스페이스는 소유자 1인 기본 워크스페이스로 백필합니다.

-- ---------- 워크스페이스 ----------------------------------------------------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '기본 워크스페이스',
  slug text not null,
  created_at timestamptz not null default now(),
  constraint workspaces_owner_unique unique (owner_id),
  constraint workspaces_slug_unique unique (slug)
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','editor','viewer')),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx on public.workspace_members(user_id);

alter table public.surveys
  add column if not exists workspace_id uuid references public.workspaces(id);

-- 소유자별 기본 워크스페이스 생성 + 멤버(owner) + 설문 백필
insert into public.workspaces (owner_id, name, slug)
select distinct s.owner_id,
       '기본 워크스페이스',
       'ws-' || replace(s.owner_id::text, '-', '')
from public.surveys s
where not exists (
  select 1 from public.workspaces w where w.owner_id = s.owner_id
);

insert into public.workspace_members (workspace_id, user_id, role)
select w.id, w.owner_id, 'owner'
from public.workspaces w
where not exists (
  select 1 from public.workspace_members wm
  where wm.workspace_id = w.id and wm.user_id = w.owner_id
);

update public.surveys s
set workspace_id = w.id
from public.workspaces w
where s.owner_id = w.owner_id
  and s.workspace_id is null;

-- ---------- 알림 ------------------------------------------------------------
alter table public.surveys
  add column if not exists notify_email boolean not null default true,
  add column if not exists notify_threshold int not null default 1;

create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  kind text not null check (kind in ('first_response','threshold','daily_digest','webhook')),
  sent_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create index if not exists notification_log_survey_idx on public.notification_log(survey_id, sent_at desc);

-- ---------- 웹훅 URL --------------------------------------------------------
alter table public.surveys
  add column if not exists webhook_url text;

-- ---------- 구독(워크스페이스 단위) ----------------------------------------
create table if not exists public.subscriptions (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free','pro','team')),
  status text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------- RLS: 워크스페이스 ----------------------------------------------
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.notification_log enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "workspaces_owner_all" on public.workspaces;
create policy "workspaces_owner_all"
  on public.workspaces
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "workspace_members_self_read" on public.workspace_members;
create policy "workspace_members_self_read"
  on public.workspace_members
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notification_log_owner_read" on public.notification_log;
create policy "notification_log_owner_read"
  on public.notification_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.surveys s
      where s.id = notification_log.survey_id
        and s.owner_id = auth.uid()
    )
  );

drop policy if exists "subscriptions_owner_read" on public.subscriptions;
create policy "subscriptions_owner_read"
  on public.subscriptions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = subscriptions.workspace_id
        and w.owner_id = auth.uid()
    )
  );
