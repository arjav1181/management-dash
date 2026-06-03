-- Create user_settings table for storing dashboard settings per user
create table if not exists user_settings (
  id uuid references auth.users primary key,
  hf_token text default '',
  vercel_token text default '',
  github_token text default '',
  github_scope text default 'read',
  llm_provider text default 'groq',
  llm_model text default 'llama-3.1-8b-instant',
  llm_api_key text default '',
  llm_base_url text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table user_settings enable row level security;

-- Users can only read/update their own settings
create policy "Users can read own settings"
  on user_settings for select
  using (auth.uid() = id);

create policy "Users can insert own settings"
  on user_settings for insert
  with check (auth.uid() = id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = id);
