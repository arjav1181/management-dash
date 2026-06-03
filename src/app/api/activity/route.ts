import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || 30), 100);
    const { data, error } = await ctx.supabase
      .from('activity')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      return jsonOk({ activity: [] });
    }
    return jsonOk({ activity: data || [] });
  } catch (e) {
    return errorResponse(e);
  }
}
