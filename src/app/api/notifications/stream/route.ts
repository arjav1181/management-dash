import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/server/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      send('hello', { ts: Date.now() });

      const channel = supabase
        .channel(`notif-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            send('notification', payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') send('ready', { ts: Date.now() });
        });

      const heartbeat = setInterval(() => send('ping', { ts: Date.now() }), 25_000);

      const cleanup = () => {
        clearInterval(heartbeat);
        supabase.removeChannel(channel);
        try { controller.close(); } catch { /* already closed */ }
      };

      req.signal.addEventListener('abort', cleanup);
      log.info('notifications.stream_open', { userId: user.id });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
