import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listDeployments } from '@/lib/api/vercel';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ pid: string }> }) {
  try {
    const { pid } = await params;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.vercelToken) throw new HttpError(400, 'Vercel token not configured');
    const deployments = await listDeployments(settings.vercelToken, pid);
    return jsonOk(deployments);
  } catch (e) {
    return errorResponse(e);
  }
}
