import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listSpaceFiles } from '@/lib/api/huggingface';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const path = req.nextUrl.searchParams.get('path') ?? '';
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) throw new HttpError(400, 'HF token not configured');
    const files = await listSpaceFiles(settings.hfToken, id, path);
    return jsonOk(files);
  } catch (e) {
    return errorResponse(e);
  }
}
