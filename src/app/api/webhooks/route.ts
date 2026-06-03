import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, jsonOk } from '@/lib/server/auth';
import { log } from '@/lib/server/log';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

interface WebhookBody {
  source: 'github' | 'vercel' | 'huggingface' | 'gitlab' | 'netlify' | 'docker';
  payload: unknown;
  signature?: string;
  event?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as WebhookBody | null;
    if (!body?.source) return NextResponse.json({ error: 'source required' }, { status: 400 });

    if (body.signature && body.event) {
      const secret = process.env[`WEBHOOK_SECRET_${body.source.toUpperCase()}`] || '';
      if (secret) {
        const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(body.payload)).digest('hex');
        if (expected !== body.signature) {
          log.warn('webhook.bad_signature', { source: body.source, event: body.event });
          return NextResponse.json({ error: 'bad signature' }, { status: 401 });
        }
      }
    }

    log.info('webhook.received', { source: body.source, event: body.event });
    return jsonOk({ received: true, ts: new Date().toISOString() });
  } catch (e) {
    return errorResponse(e);
  }
}
