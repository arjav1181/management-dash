import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, HttpError, errorResponse, jsonOk } from '@/lib/server/auth';
import { loadSettings, settingsToTokenStatus } from '@/lib/server/settings';
import { runAgent } from '@/lib/agent/execute';
import { log } from '@/lib/server/log';

interface RequestBody {
  message: string;
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  approvedTools?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body: RequestBody = await req.json();
    if (!body.message || typeof body.message !== 'string') {
      throw new HttpError(400, 'message is required');
    }
    if (body.message.length > 2000) {
      throw new HttpError(400, 'message too long (max 2000 chars)');
    }

    const { settings, isNew } = await loadSettings(ctx.supabase, ctx.userId);
    if (isNew || !settings.llmConfig.apiKey) {
      throw new HttpError(400, 'LLM not configured. Add an API key in Settings.');
    }

    const result = await runAgent({
      userId: ctx.userId,
      message: body.message,
      history: body.history || [],
      settings,
      supabase: ctx.supabase,
      approvedTools: body.approvedTools || [],
    });

    log.info('agent_run_complete', {
      userId: ctx.userId,
      actions: result.actions.length,
      pending: result.pendingConfirmation.length,
    });

    return jsonOk({
      response: result.text,
      actions: result.actions,
      pendingConfirmation: result.pendingConfirmation,
      tokenStatus: settingsToTokenStatus(settings),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
