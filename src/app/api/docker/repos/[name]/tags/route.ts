import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { getRepoTags } from '@/lib/api/docker';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;
    const [namespace, repo] = name.split('/');
    if (!namespace || !repo) throw new HttpError(400, 'Invalid name; expected namespace/repo');
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.dockerToken) throw new HttpError(400, 'Docker token not configured');
    const tags = await getRepoTags(settings.dockerToken, namespace, repo);
    return jsonOk(tags);
  } catch (e) {
    return errorResponse(e);
  }
}
