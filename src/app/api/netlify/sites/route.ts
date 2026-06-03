import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listSites } from '@/lib/api/netlify';

export async function GET() {
  try {
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.netlifyToken) throw new HttpError(400, 'Netlify token not configured');
    const sites = await listSites(settings.netlifyToken);
    return jsonOk(sites);
  } catch (e) {
    return errorResponse(e);
  }
}
