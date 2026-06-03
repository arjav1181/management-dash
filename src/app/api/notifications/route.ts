import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk } from '@/lib/server/auth';
import { log } from '@/lib/server/log';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || 50), 100);
    const onlyUnread = req.nextUrl.searchParams.get('unread') === '1';

    let query = ctx.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (onlyUnread) query = query.eq('read', false);

    const { data, error } = await query;
    if (error) {
      log.warn('notifications.list_failed', { userId: ctx.userId, error: error.message });
      return jsonOk({ notifications: [], unread: 0 });
    }

    const unread = (data || []).filter((n: { read: boolean }) => !n.read).length;
    return jsonOk({ notifications: data || [], unread });
  } catch (e) {
    return errorResponse(e);
  }
}
