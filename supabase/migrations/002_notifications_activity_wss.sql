-- =============================================================================
-- Bridge — Migration 002: notifications, activity, wss_secrets
-- =============================================================================
-- Run in Supabase SQL Editor after 001_user_settings.sql
-- =============================================================================

-- wss_secrets: per-user, per-space JWT secret used by the WSS agent patcher
alter table user_settings
  add column if not exists wss_secrets jsonb not null default '{}'::jsonb;

-- notifications: real notifications surfaced to the dashboard
create table if not exists notifications (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  type        text        not null,
  platform    text        not null,
  title       text        not null,
  message     text        not null,
  read        boolean     not null default false,
  link        text,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on notifications (user_id, read) where read = false;

alter table notifications enable row level security;

create policy "Users can read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can insert own notifications"
  on notifications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete own notifications"
  on notifications for delete
  using (auth.uid() = user_id);

-- activity: audit log of significant actions (deploys, restarts, etc.)
create table if not exists activity (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  platform    text        not null,
  type        text        not null,
  message     text        not null,
  link        text,
  created_at  timestamptz not null default now()
);

create index if not exists activity_user_created_idx
  on activity (user_id, created_at desc);

alter table activity enable row level security;

create policy "Users can read own activity"
  on activity for select
  using (auth.uid() = user_id);

create policy "Users can insert own activity"
  on activity for insert
  with check (auth.uid() = user_id);

-- Realtime: enable for notifications and activity (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'activity'
  ) then
    execute 'alter publication supabase_realtime add table public.activity';
  end if;
end $$;
