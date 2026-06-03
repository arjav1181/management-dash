import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk } from '@/lib/server/auth';

export async function POST(_req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const { error } = await ctx.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', ctx.userId)
      .eq('read', false);
    if (error) throw error;
    return jsonOk({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
