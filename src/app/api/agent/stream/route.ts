import { NextRequest } from 'next/server';
import { requireAuth, HttpError, errorResponse } from '@/lib/server/auth';
import { loadSettings, settingsToTokenStatus } from '@/lib/server/settings';
import { runAgentStream } from '@/lib/agent/execute';
import { log } from '@/lib/server/log';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RequestBody {
  message: string;
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  approvedTools?: string[];
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse(new HttpError(400, 'Invalid JSON'));
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch { /* closed */ }
      };

      try {
        const ctx = await requireAuth();
        if (!body.message || typeof body.message !== 'string') throw new HttpError(400, 'message is required');
        if (body.message.length > 2000) throw new HttpError(400, 'message too long (max 2000 chars)');

        const { settings, isNew } = await loadSettings(ctx.supabase, ctx.userId);
        if (isNew || !settings.llmConfig.apiKey) throw new HttpError(400, 'LLM not configured. Add an API key in Settings.');

        send('start', { tokenStatus: settingsToTokenStatus(settings) });

        for await (const ev of runAgentStream({
          userId: ctx.userId,
          message: body.message,
          history: body.history || [],
          settings,
          supabase: ctx.supabase,
          signal: req.signal,
          approvedTools: body.approvedTools || [],
        })) {
          if (req.signal.aborted) break;
          send(ev.type, ev);
        }
        log.info('agent_stream_complete', { userId: ctx.userId });
        send('end', { ok: true });
      } catch (e) {
        const msg = e instanceof HttpError ? { error: e.message, status: e.status } : { error: e instanceof Error ? e.message : 'Unknown' };
        send('error', msg);
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
    cancel() {
      // Client closed connection; req.signal aborts automatically
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
