import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';
import { listProjects } from '@/lib/api/vercel';

export async function GET() {
  try {
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    if (!settings.vercelToken) throw new HttpError(400, 'Vercel token not configured');
    const projects = await listProjects(settings.vercelToken);
    return jsonOk(projects);
  } catch (e) {
    return errorResponse(e);
  }
}
