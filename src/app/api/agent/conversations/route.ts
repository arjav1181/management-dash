import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk } from '@/lib/server/auth';
import { listConversations, getOrCreateConversation, loadConversationHistory, saveAgentMessage } from '@/lib/server/agent-persistence';
import { log } from '@/lib/server/log';

export async function GET(_req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const conversations = await listConversations(ctx.supabase, ctx.userId);
    return jsonOk({ conversations });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = (await req.json().catch(() => ({}))) as { conversationId?: string; title?: string };
    const conv = await getOrCreateConversation(ctx.supabase, ctx.userId, body.conversationId);
    if (body.title) {
      await ctx.supabase
        .from('agent_conversations')
        .update({ title: body.title })
        .eq('id', conv.id)
        .eq('user_id', ctx.userId);
      conv.title = body.title;
    }
    const history = await loadConversationHistory(ctx.supabase, ctx.userId, conv.id);
    return jsonOk({ conversation: conv, history });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = (await req.json()) as { conversationId: string; role: 'user' | 'assistant' | 'system'; content: string; actions?: unknown };
    if (!body.conversationId || !body.role || !body.content) {
      return NextResponse.json({ error: 'conversationId, role, content required' }, { status: 400 });
    }
    await saveAgentMessage(ctx.supabase, {
      conversationId: body.conversationId,
      userId: ctx.userId,
      role: body.role,
      content: body.content,
      actions: body.actions,
    });
    log.info('agent_message_saved', { userId: ctx.userId, conversationId: body.conversationId, role: body.role });
    return jsonOk({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
