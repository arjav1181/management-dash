import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { getSpaceStatus, HFError } from '@/lib/api/huggingface';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) throw new HttpError(400, 'HF token not configured');
    try {
      const status = await getSpaceStatus(settings.hfToken, id);
      return jsonOk({ status });
    } catch (e) {
      if (e instanceof HFError) {
        if (e.code === 'not_found') throw new HttpError(404, e.message);
        if (e.code === 'unauthorized' || e.code === 'forbidden') throw new HttpError(401, e.message);
        throw new HttpError(e.status || 502, e.message);
      }
      throw e;
    }
  } catch (e) {
    return errorResponse(e);
  }
}
