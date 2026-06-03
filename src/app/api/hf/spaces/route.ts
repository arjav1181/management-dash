import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listSpaces, HFError } from '@/lib/api/huggingface';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) throw new HttpError(400, 'HF token not configured');
    try {
      const spaces = await listSpaces(settings.hfToken);
      return jsonOk(spaces);
    } catch (e) {
      if (e instanceof HFError) {
        ctx.logger.warn('hf.list_spaces.failed', { code: e.code, status: e.status });
        throw new HttpError(e.status || 502, e.message);
      }
      throw e;
    }
  } catch (e) {
    return errorResponse(e);
  }
}
