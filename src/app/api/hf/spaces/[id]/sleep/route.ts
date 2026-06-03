import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { sleepSpace, HFError } from '@/lib/api/huggingface';
import { logActivity, pushNotification } from '@/lib/server/activity';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) throw new HttpError(400, 'HF token not configured');
    try {
      await sleepSpace(settings.hfToken, id);
    } catch (e) {
      if (e instanceof HFError) throw new HttpError(e.status || 502, e.message);
      throw e;
    }
    await logActivity(ctx.supabase, ctx.userId, 'huggingface', 'sleep', `Slept space ${id}`, `/huggingface/${id}`);
    await pushNotification(ctx.supabase, ctx.userId, {
      type: 'system',
      platform: 'huggingface',
      title: `Space ${id} put to sleep`,
      message: 'The space will wake on next request.',
      link: `/huggingface/${id}`,
    });
    return jsonOk({ success: true });
  } catch (e) {
    return errorResponse(e);
  }
}
