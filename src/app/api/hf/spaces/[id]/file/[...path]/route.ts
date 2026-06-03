import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { writeSpaceFile, deleteSpaceFile } from '@/lib/api/huggingface';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; path: string[] }> }) {
  try {
    const { id, path } = await params;
    const filePath = path.join('/');
    const content = await req.text();
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) throw new HttpError(400, 'HF token not configured');
    const ok = await writeSpaceFile(settings.hfToken, id, filePath, content);
    return jsonOk({ success: ok });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; path: string[] }> }) {
  try {
    const { id, path } = await params;
    const filePath = path.join('/');
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) throw new HttpError(400, 'HF token not configured');
    const ok = await deleteSpaceFile(settings.hfToken, id, filePath);
    return jsonOk({ success: ok });
  } catch (e) {
    return errorResponse(e);
  }
}
