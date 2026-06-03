import { createServer, IncomingMessage } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { generateWssToken, verifyWssToken } from '../lib/wss-agent/jwt';

const PORT = Number(process.env.WSS_PROXY_PORT || 3001);
const ENABLE_PROXY = process.env.WSS_PROXY_ENABLED !== 'false';

interface WssProxyContext {
  supabase: SupabaseClient;
  userId: string;
  spaceId: string;
  secret: string;
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = decodeURIComponent(part.slice(eq + 1).trim());
    if (k) out[k] = v;
  }
  return out;
}

void parseCookies;

function buildSupabaseFromCookies(cookies: Record<string, string>): SupabaseClient {
  const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ');
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(cookies).map(([name, value]) => ({ name, value }));
        },
        setAll() {
          // No-op: sidecar cannot set cookies
        },
      },
    }
  );
}

async function authenticate(req: IncomingMessage, url: URL): Promise<{ userId: string; supabase: SupabaseClient; spaceId: string; token: string } | null> {
  const cookies = parseCookies(req.headers.cookie);
  const supabase = buildSupabaseFromCookies(cookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const spaceId = url.searchParams.get('spaceId');
  const token = url.searchParams.get('token');
  if (!spaceId || !token) return null;
  return { userId: user.id, supabase, spaceId, token };
}

async function loadSecret(ctx: WssProxyContext): Promise<boolean> {
  const { data } = await ctx.supabase
    .from('user_settings')
    .select('wss_secrets')
    .eq('id', ctx.userId)
    .single();
  const row = data as { wss_secrets: Record<string, string> | null } | null;
  const secret = row?.wss_secrets?.[ctx.spaceId];
  if (!secret) return false;
  ctx.secret = secret;
  return true;
}

function upstreamUrl(spaceId: string): string {
  const sub = spaceId.split('/')[1] || spaceId;
  return `wss://${sub}.hf.space/_mgmt-dash/ws/`;
}

function pipeBidirectional(client: WebSocket, upstream: WebSocket): void {
  client.on('message', (data, isBinary) => {
    if (upstream.readyState === WebSocket.OPEN) upstream.send(data, { binary: isBinary });
  });
  upstream.on('message', (data, isBinary) => {
    if (client.readyState === WebSocket.OPEN) client.send(data, { binary: isBinary });
  });
  client.on('close', () => { try { upstream.close(); } catch { /* ignore */ } });
  upstream.on('close', () => { try { client.close(); } catch { /* ignore */ } });
  client.on('error', () => { try { upstream.close(); } catch { /* ignore */ } });
  upstream.on('error', () => { try { client.close(); } catch { /* ignore */ } });
}

export function registerWssProxy() {
  if (!ENABLE_PROXY) return;
  if (process.env.VERCEL) return;

  const httpServer = createServer((_req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('wss-proxy-ok');
  });

  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', async (req, socket, head) => {
    try {
      const url = new URL(req.url || '', 'http://localhost');
      if (url.pathname !== '/api/hf/spaces/ws') {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }
      const auth = await authenticate(req, url);
      if (!auth) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      const ctx: WssProxyContext = { supabase: auth.supabase, userId: auth.userId, spaceId: auth.spaceId, secret: '' };
      if (!(await loadSecret(ctx))) {
        socket.write('HTTP/1.1 409 Conflict\r\n\r\n');
        socket.destroy();
        return;
      }
      const verified = verifyWssToken(auth.token, ctx.secret);
      if (!verified || verified.spaceId !== auth.spaceId) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (client) => {
        const upstream = new WebSocket(upstreamUrl(auth.spaceId), {
          headers: { 'User-Agent': 'mgmt-dash-wss-proxy/1.0' },
        });
        upstream.on('open', () => {
          upstream.send(JSON.stringify({ token: generateWssToken(auth.spaceId, ctx.secret) }));
        });
        upstream.on('error', (err) => {
          try { client.send(JSON.stringify({ type: 'error', error: `upstream: ${err.message}` })); client.close(); } catch { /* ignore */ }
        });
        client.on('error', (err) => {
          try { upstream.send(JSON.stringify({ type: 'error', error: `client: ${err.message}` })); upstream.close(); } catch { /* ignore */ }
        });
        pipeBidirectional(client, upstream);
      });
    } catch {
      try {
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
      } catch { /* ignore */ }
    }
  });

  httpServer.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[wss-proxy] listening on :${PORT}`);
  });
}
