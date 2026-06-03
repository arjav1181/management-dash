import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings, setWssSecret } from '@/lib/server/settings';
import { patchSpaceWithWssAgent } from '@/lib/wss-agent/patcher';
import { logActivity } from '@/lib/server/activity';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) throw new HttpError(400, 'HF token not configured');
    const result = await patchSpaceWithWssAgent(settings.hfToken, id, async (secret) => {
      await setWssSecret(ctx.supabase, ctx.userId, id, secret);
    });
    if (result.success) {
      await logActivity(ctx.supabase, ctx.userId, 'huggingface', 'wss_patch', `Patched WSS agent into ${id}`, `/huggingface/${id}/terminal`);
    }
    return jsonOk({ success: result.success, message: result.message });
  } catch (e) {
    return errorResponse(e);
  }
}
