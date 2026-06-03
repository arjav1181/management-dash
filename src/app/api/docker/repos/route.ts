import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listRepos as listDockerRepos } from '@/lib/api/docker';

export async function GET() {
  try {
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.dockerToken) throw new HttpError(400, 'Docker token not configured');
    const repos = await listDockerRepos(settings.dockerToken);
    return jsonOk(repos);
  } catch (e) {
    return errorResponse(e);
  }
}
