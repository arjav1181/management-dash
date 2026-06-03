-- =============================================================================
-- Bridge — Full Schema Migration
-- =============================================================================
-- Run this in your Supabase SQL Editor to set up the entire database.
-- =============================================================================

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- user_settings: per-user dashboard configuration
create table if not exists user_settings (
  id              uuid        primary key references auth.users(id) on delete cascade,
  hf_token        text        not null default '',
  vercel_token    text        not null default '',
  github_token    text        not null default '',
  docker_token    text        not null default '',
  gitlab_token    text        not null default '',
  gitlab_url      text        not null default 'https://gitlab.com',
  netlify_token   text        not null default '',
  github_scope    text        not null default 'read',
  llm_provider    text        not null default 'groq',
  llm_model       text        not null default 'llama-3.1-8b-instant',
  llm_api_key     text        not null default '',
  llm_base_url    text        not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_user_settings_updated_at
  before update on user_settings
  for each row
  execute function update_updated_at();

-- Row-Level Security
alter table user_settings enable row level security;

create policy "Users can read own settings"
  on user_settings for select
  using (auth.uid() = id);

create policy "Users can insert own settings"
  on user_settings for insert
  with check (auth.uid() = id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = id);
