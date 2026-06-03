import { NextResponse } from 'next/server';
import { createClient as createSupabase } from '@/lib/supabase/server';
import { rateLimitForRoute } from './rate-limit';
import { log, newRequestId, withRequest } from './log';
import { headers } from 'next/headers';

export type AuthedContext = {
  userId: string;
  email: string;
  supabase: Awaited<ReturnType<typeof createSupabase>>;
  logger: ReturnType<typeof withRequest>;
};

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireAuth(): Promise<AuthedContext> {
  const requestId = newRequestId();
  const h = await headers();
  const route = h.get('x-pathname') ?? h.get('referer') ?? 'unknown';
  const logger = withRequest(requestId, route);

  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';

  const supabase = await createSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    log.warn('auth.unauthorized', { requestId, route, ip });
    throw new HttpError(401, 'Unauthorized');
  }

  const rl = rateLimitForRoute(user.id, route);
  if (!rl.allowed) {
    log.warn('auth.rate_limited', { requestId, route, userId: user.id, retryAfterSec: rl.retryAfterSec });
    throw new HttpError(429, `Rate limited. Retry in ${rl.retryAfterSec}s`);
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    supabase,
    logger,
  };
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  log.error('api.unhandled', { error: message });
  return NextResponse.json({ error: message }, { status: 500 });
}

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}
