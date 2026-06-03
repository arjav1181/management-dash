import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listSpaces } from '@/lib/api/huggingface';

export async function GET() {
  try {
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) throw new HttpError(400, 'HF token not configured');
    const spaces = await listSpaces(settings.hfToken);
    return jsonOk(spaces);
  } catch (e) {
    return errorResponse(e);
  }
}
