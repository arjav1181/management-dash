import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listPipelines } from '@/lib/api/gitlab';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projectId = Number(id);
    if (!Number.isFinite(projectId)) throw new HttpError(400, 'Invalid project id');
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.gitlabToken) throw new HttpError(400, 'GitLab token not configured');
    const pipelines = await listPipelines(settings.gitlabToken, projectId, settings.gitlabUrl);
    return jsonOk(pipelines);
  } catch (e) {
    return errorResponse(e);
  }
}
