import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { triggerDeploy } from '@/lib/api/vercel';
import { logActivity } from '@/lib/server/activity';

export async function POST(req: NextRequest, { params }: { params: Promise<{ pid: string }> }) {
  try {
    const { pid } = await params;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.vercelToken) throw new HttpError(400, 'Vercel token not configured');
    const body = await req.json().catch(() => ({}));
    const branch = typeof body?.branch === 'string' ? body.branch : undefined;
    const ok = await triggerDeploy(settings.vercelToken, pid, branch);
    if (ok) {
      await logActivity(ctx.supabase, ctx.userId, 'vercel', 'deploy', `Triggered deploy for ${pid}${branch ? ` @ ${branch}` : ''}`, `/vercel/${pid}`);
    }
    return jsonOk({ success: ok });
  } catch (e) {
    return errorResponse(e);
  }
}
