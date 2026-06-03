import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listPRs } from '@/lib/api/github';

export async function GET(req: NextRequest, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  try {
    const { owner, repo } = await params;
    const state = (req.nextUrl.searchParams.get('state') as 'open' | 'closed' | 'all') || 'open';
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.githubToken) throw new HttpError(400, 'GitHub token not configured');
    const prs = await listPRs(settings.githubToken, owner, repo, state);
    return jsonOk(prs);
  } catch (e) {
    return errorResponse(e);
  }
}
