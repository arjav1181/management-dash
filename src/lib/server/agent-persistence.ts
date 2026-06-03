import type { SupabaseLike } from './settings';
import { newRequestId, log } from './log';

export type { SupabaseLike };

export interface AgentMessageRow {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actions: unknown;
  created_at: string;
}

export interface AgentConversationRow {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export async function getOrCreateConversation(
  supabase: SupabaseLike,
  userId: string,
  conversationId?: string
): Promise<AgentConversationRow> {
  if (conversationId) {
    const { data } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();
    if (data) return data as AgentConversationRow;
  }
  const { data, error } = await supabase
    .from('agent_conversations')
    .insert({ user_id: userId, title: 'New conversation' })
    .select()
    .single();
  if (error) throw error;
  return data as AgentConversationRow;
}

export async function saveAgentMessage(
  supabase: SupabaseLike,
  row: { conversationId: string; userId: string; role: 'user' | 'assistant' | 'system'; content: string; actions?: unknown }
): Promise<void> {
  const { error } = await supabase.from('agent_messages').insert({
    conversation_id: row.conversationId,
    user_id: row.userId,
    role: row.role,
    content: row.content,
    actions: row.actions ?? null,
  });
  if (error) {
    log.warn('agent_message_save_failed', { requestId: newRequestId(), error: error.message });
  }
  await supabase
    .from('agent_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', row.conversationId);
}

export async function loadConversationHistory(
  supabase: SupabaseLike,
  userId: string,
  conversationId: string,
  limit = 50
): Promise<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>> {
  const { data } = await supabase
    .from('agent_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);
  return (data || []) as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

export async function listConversations(
  supabase: SupabaseLike,
  userId: string,
  limit = 20
): Promise<AgentConversationRow[]> {
  const { data } = await supabase
    .from('agent_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);
  return (data || []) as AgentConversationRow[];
}
