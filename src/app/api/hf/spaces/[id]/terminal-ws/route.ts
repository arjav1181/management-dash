import { NextRequest } from 'next/server';
import { requireAuth, HttpError, errorResponse, jsonOk } from '@/lib/server/auth';
import { loadSettings, getWssSecret } from '@/lib/server/settings';
import { generateWssToken } from '@/lib/wss-agent/jwt';
import { getSpaceStatus, getSpaceWssUrl, HFError } from '@/lib/api/huggingface';
import { log } from '@/lib/server/log';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const spaceId = decodeURIComponent(id);

    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.hfToken) {
      throw new HttpError(400, 'HF token not configured');
    }
    try {
      const status = await getSpaceStatus(settings.hfToken, spaceId);
      if (status === 'unknown') {
        throw new HttpError(404, 'Space not found or unreachable');
      }
      if (!['running', 'sleeping', 'building'].includes(status)) {
        throw new HttpError(409, `Space is in ${status} state; cannot connect`);
      }
    } catch (e) {
      if (e instanceof HFError) throw new HttpError(e.status || 502, e.message);
      throw e;
    }

    const secret = await getWssSecret(ctx.supabase, ctx.userId, spaceId);
    if (!secret) {
      throw new HttpError(409, 'WSS agent not patched. Click "Patch" first.');
    }

    const token = generateWssToken(spaceId, secret);
    const url = getSpaceWssUrl(spaceId);

    log.info('terminal_ws_info', { userId: ctx.userId, spaceId });

    return jsonOk({ url, token, spaceId });
  } catch (e) {
    return errorResponse(e);
  }
}
