-- =============================================================================
-- Bridge — Full Schema Migration
-- =============================================================================
-- Run this in your Supabase SQL Editor to set up the entire database.
-- Requires: Supabase Auth enabled (built-in).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper: auto-update updated_at timestamp
-- ---------------------------------------------------------------------------
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- 2. user_settings — per-user dashboard configuration
-- ---------------------------------------------------------------------------
-- Stores API tokens, LLM preferences, and GitHub scope for each user.
-- One row per user, created on first login via the app.
-- ---------------------------------------------------------------------------
create table if not exists user_settings (
  id            uuid        primary key references auth.users(id) on delete cascade,
  hf_token      text        not null default '',
  vercel_token  text        not null default '',
  github_token  text        not null default '',
  github_scope  text        not null default 'read',
  llm_provider  text        not null default 'groq',
  llm_model     text        not null default 'llama-3.1-8b-instant',
  llm_api_key   text        not null default '',
  llm_base_url  text        not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at on row modification
create trigger trg_user_settings_updated_at
  before update on user_settings
  for each row
  execute function update_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Row-Level Security
-- ---------------------------------------------------------------------------
alter table user_settings enable row level security;

-- Each user can only see their own row
create policy "Users can read own settings"
  on user_settings for select
  using (auth.uid() = id);

-- Each user can insert their own row (first sign-in)
create policy "Users can insert own settings"
  on user_settings for insert
  with check (auth.uid() = id);

-- Each user can update their own row
create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = id);
