import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk } from '@/lib/server/auth';

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const { error } = await ctx.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', ctx.userId);
    if (error) throw error;
    return jsonOk({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const { error } = await ctx.supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', ctx.userId);
    if (error) throw error;
    return jsonOk({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
