import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listProjects as listGitLabProjects } from '@/lib/api/gitlab';

export async function GET() {
  try {
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.gitlabToken) throw new HttpError(400, 'GitLab token not configured');
    const projects = await listGitLabProjects(settings.gitlabToken, settings.gitlabUrl);
    return jsonOk(projects);
  } catch (e) {
    return errorResponse(e);
  }
}
