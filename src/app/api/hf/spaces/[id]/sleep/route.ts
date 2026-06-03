import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { sleepSpace } from '@/lib/api/huggingface';
import { logActivity } from '@/lib/server/activity';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) throw new HttpError(400, 'HF token not configured');
    const ok = await sleepSpace(settings.hfToken, id);
    if (ok) {
      await logActivity(ctx.supabase, ctx.userId, 'huggingface', 'sleep', `Put ${id} to sleep`, `/huggingface/${id}`);
    }
    return jsonOk({ success: ok });
  } catch (e) {
    return errorResponse(e);
  }
}
