import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listActionRuns } from '@/lib/api/github';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  try {
    const { owner, repo } = await params;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.githubToken) throw new HttpError(400, 'GitHub token not configured');
    const runs = await listActionRuns(settings.githubToken, owner, repo);
    return jsonOk(runs);
  } catch (e) {
    return errorResponse(e);
  }
}
