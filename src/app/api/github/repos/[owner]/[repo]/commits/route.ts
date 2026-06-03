import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { getCommits } from '@/lib/api/github';

export async function GET(req: NextRequest, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  try {
    const { owner, repo } = await params;
    const branch = req.nextUrl.searchParams.get('branch') ?? undefined;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.githubToken) throw new HttpError(400, 'GitHub token not configured');
    const commits = await getCommits(settings.githubToken, owner, repo, branch);
    return jsonOk(commits);
  } catch (e) {
    return errorResponse(e);
  }
}
