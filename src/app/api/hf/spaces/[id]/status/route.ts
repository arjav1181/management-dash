import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { getSpaceStatus } from '@/lib/api/huggingface';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) throw new HttpError(400, 'HF token not configured');
    const status = await getSpaceStatus(settings.hfToken, id);
    return jsonOk({ status });
  } catch (e) {
    return errorResponse(e);
  }
}
