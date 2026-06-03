import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { mergePR } from '@/lib/api/github';
import { logActivity } from '@/lib/server/activity';

export async function POST(req: NextRequest, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  try {
    const { owner, repo } = await params;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.githubToken) throw new HttpError(400, 'GitHub token not configured');
    if (settings.githubScope === 'read') throw new HttpError(403, 'Write scope required to merge PRs');
    const { pullNumber } = await req.json();
    if (typeof pullNumber !== 'number') throw new HttpError(400, 'pullNumber required');
    const ok = await mergePR(settings.githubToken, owner, repo, pullNumber);
    if (ok) {
      await logActivity(ctx.supabase, ctx.userId, 'github', 'merge_pr', `Merged PR #${pullNumber} in ${owner}/${repo}`, `/github/${owner}/${repo}`);
    }
    return jsonOk({ success: ok });
  } catch (e) {
    return errorResponse(e);
  }
}
