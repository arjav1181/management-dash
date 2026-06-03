import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { whoami } from '@/lib/api/huggingface';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) {
      throw new HttpError(400, 'HF token not configured');
    }
    const me = await whoami(settings.hfToken);
    return jsonOk(me);
  } catch (e) {
    return errorResponse(e);
  }
}
