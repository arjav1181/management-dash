import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listDeploys } from '@/lib/api/netlify';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.netlifyToken) throw new HttpError(400, 'Netlify token not configured');
    const deploys = await listDeploys(settings.netlifyToken, id);
    return jsonOk(deploys);
  } catch (e) {
    return errorResponse(e);
  }
}
