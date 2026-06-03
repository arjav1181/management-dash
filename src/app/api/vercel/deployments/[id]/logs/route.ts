import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { getDeploymentLogs } from '@/lib/api/vercel';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.vercelToken) throw new HttpError(400, 'Vercel token not configured');
    const logs = await getDeploymentLogs(settings.vercelToken, id);
    return jsonOk(logs);
  } catch (e) {
    return errorResponse(e);
  }
}
