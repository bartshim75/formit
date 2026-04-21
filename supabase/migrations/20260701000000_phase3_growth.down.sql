-- 롤백: Phase 3 growth (주의: 데이터 손실 가능)
drop policy if exists "subscriptions_owner_read" on public.subscriptions;
drop policy if exists "notification_log_owner_read" on public.notification_log;
drop policy if exists "workspace_members_self_read" on public.workspace_members;
drop policy if exists "workspaces_owner_all" on public.workspaces;

alter table public.surveys drop column if exists webhook_url;
drop table if exists public.notification_log cascade;
alter table public.surveys drop column if exists notify_threshold;
alter table public.surveys drop column if exists notify_email;

drop table if exists public.subscriptions cascade;

alter table public.surveys drop column if exists workspace_id;
drop table if exists public.workspace_members cascade;
drop table if exists public.workspaces cascade;
