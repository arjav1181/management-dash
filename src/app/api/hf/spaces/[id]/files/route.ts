import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listSpaceFiles, HFError } from '@/lib/api/huggingface';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const path = req.nextUrl.searchParams.get('path') ?? '';
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) throw new HttpError(400, 'HF token not configured');
    try {
      const files = await listSpaceFiles(settings.hfToken, id, path);
      return jsonOk(files);
    } catch (e) {
      if (e instanceof HFError) throw new HttpError(e.status || 502, e.message);
      throw e;
    }
  } catch (e) {
    return errorResponse(e);
  }
}
