import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { createIssue } from '@/lib/api/github';
import { logActivity } from '@/lib/server/activity';

export async function POST(req: NextRequest, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  try {
    const { owner, repo } = await params;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.githubToken) throw new HttpError(400, 'GitHub token not configured');
    if (settings.githubScope === 'read') throw new HttpError(403, 'Write scope required to create issues');
    const { title, body, labels } = await req.json();
    if (!title) throw new HttpError(400, 'Title required');
    const ok = await createIssue(settings.githubToken, owner, repo, title, body, labels);
    if (ok) {
      await logActivity(ctx.supabase, ctx.userId, 'github', 'create_issue', `Created issue in ${owner}/${repo}: ${title}`, `/github/${owner}/${repo}`);
    }
    return jsonOk({ success: ok });
  } catch (e) {
    return errorResponse(e);
  }
}
