import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listMRs } from '@/lib/api/gitlab';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projectId = Number(id);
    if (!Number.isFinite(projectId)) throw new HttpError(400, 'Invalid project id');
    const state = (req.nextUrl.searchParams.get('state') as 'opened' | 'all') || 'opened';
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.gitlabToken) throw new HttpError(400, 'GitLab token not configured');
    const mrs = await listMRs(settings.gitlabToken, projectId, state, settings.gitlabUrl);
    return jsonOk(mrs);
  } catch (e) {
    return errorResponse(e);
  }
}
