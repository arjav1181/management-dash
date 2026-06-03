import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listRepos } from '@/lib/api/github';

export async function GET() {
  try {
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.githubToken) throw new HttpError(400, 'GitHub token not configured');
    const repos = await listRepos(settings.githubToken, settings.githubScope);
    return jsonOk(repos);
  } catch (e) {
    return errorResponse(e);
  }
}
