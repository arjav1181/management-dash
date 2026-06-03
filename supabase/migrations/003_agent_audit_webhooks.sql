-- Agent conversations (per-user thread)
create table if not exists agent_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agent_conversations_user
  on agent_conversations(user_id, updated_at desc);

create table if not exists agent_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references agent_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  actions jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_messages_conversation
  on agent_messages(conversation_id, created_at);

alter table agent_conversations enable row level security;
alter table agent_messages enable row level security;

create policy "agent_conversations_owner" on agent_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "agent_messages_owner" on agent_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Audit log (security-sensitive events)
create table if not exists audit_log (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  ip text,
  user_agent text,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_user_time
  on audit_log(user_id, created_at desc);
create index if not exists idx_audit_log_event_time
  on audit_log(event, created_at desc);

alter table audit_log enable row level security;
create policy "audit_log_admin_only" on audit_log
  for select using (auth.uid() = user_id);

-- Token health tracking
create table if not exists token_health (
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  last_validated_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  primary key (user_id, platform)
);

alter table token_health enable row level security;
create policy "token_health_owner" on token_health
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Webhooks registry
create table if not exists webhooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('github', 'vercel', 'huggingface', 'gitlab', 'netlify', 'docker')),
  secret text not null,
  url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhooks_user on webhooks(user_id);

alter table webhooks enable row level security;
create policy "webhooks_owner" on webhooks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
