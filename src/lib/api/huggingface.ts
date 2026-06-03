import { HF_API_BASE } from '@/lib/utils/constants';
import type { HFSpace, HFSpaceLog, HFFile } from '@/types';

export class HFError extends Error {
  constructor(
    public status: number,
    public code: 'unauthorized' | 'forbidden' | 'not_found' | 'rate_limited' | 'server' | 'network' | 'timeout' | 'unknown',
    message: string,
    public body?: string
  ) {
    super(message);
    this.name = 'HFError';
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

function mapStatus(status: number, body?: string): HFError {
  let code: HFError['code'] = 'unknown';
  let msg = `HF API error: ${status}`;
  if (status === 401) { code = 'unauthorized'; msg = 'HF token is invalid or expired'; }
  else if (status === 403) { code = 'forbidden'; msg = 'HF token lacks required permission'; }
  else if (status === 404) { code = 'not_found'; msg = 'HF resource not found'; }
  else if (status === 429) { code = 'rate_limited'; msg = 'HF rate limit exceeded'; }
  else if (status >= 500) { code = 'server'; msg = `HF server error: ${status}`; }
  return new HFError(status, code, msg, body);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchApi(
  token: string,
  path: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<unknown> {
  const url = `${HF_API_BASE}${path}`;
  let attempt = 0;
  let lastErr: unknown = null;

  while (attempt <= MAX_RETRIES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      clearTimeout(timer);

      if (res.ok) {
        const text = await res.text();
        if (!text) return null;
        try { return JSON.parse(text); } catch { return text; }
      }

      const body = await res.text().catch(() => '');
      const err = mapStatus(res.status, body);

      if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
        lastErr = err;
        attempt++;
        await sleep(250 * 2 ** (attempt - 1));
        continue;
      }
      throw err;
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof HFError) throw e;
      if (e instanceof Error && e.name === 'AbortError') {
        const err = new HFError(0, 'timeout', `HF request timed out after ${timeoutMs}ms`);
        if (attempt < MAX_RETRIES) { lastErr = err; attempt++; await sleep(250 * 2 ** (attempt - 1)); continue; }
        throw err;
      }
      const err = new HFError(0, 'network', e instanceof Error ? e.message : 'Network error');
      if (attempt < MAX_RETRIES) { lastErr = err; attempt++; await sleep(250 * 2 ** (attempt - 1)); continue; }
      throw err;
    }
  }
  throw lastErr instanceof HFError ? lastErr : new HFError(0, 'unknown', 'HF request failed');
}

export interface HFWhoami {
  id: string;
  name: string;
  fullname: string;
  email?: string;
  orgs: { name: string; fullname: string; avatarUrl?: string }[];
  type: 'user' | 'org';
  isPro: boolean;
  avatarUrl?: string;
}

export async function whoami(token: string): Promise<HFWhoami> {
  const data = await fetchApi(token, '/whoami-v2') as Record<string, unknown> | null;
  if (!data) throw new HFError(0, 'unknown', 'Empty whoami response');
  return {
    id: (data.id as string) || '',
    name: (data.name as string) || '',
    fullname: (data.fullname as string) || (data.name as string) || '',
    email: data.email as string | undefined,
    orgs: Array.isArray(data.orgs) ? (data.orgs as HFWhoami['orgs']) : [],
    type: (data.type as 'user' | 'org') || 'user',
    isPro: Boolean(data.isPro),
    avatarUrl: data.avatarUrl as string | undefined,
  };
}

function spaceHttpsUrl(id: string): string {
  if (id.includes('/')) return `https://huggingface.co/spaces/${id}`;
  return `https://huggingface.co/spaces/${id}`;
}

function spaceWssHost(id: string): string {
  if (id.includes('/')) {
    const name = id.split('/')[1] || id;
    return `${name}.hf.space`;
  }
  return `${id}.hf.space`;
}

function mapSpace(s: Record<string, unknown>): HFSpace {
  const id = (s.id as string) || '';
  return {
    id,
    name: id.split('/')[1] || id,
    sdk: (s.sdk as string) || 'docker',
    status: (s.status as HFSpace['status']) || 'unknown',
    likes: (s.likes as number) || 0,
    private: Boolean(s.private),
    createdAt: (s.createdAt as string) || '',
    lastModified: (s.lastModified as string) || '',
    runtime: {
      cpu: ((s.runtime as Record<string, string> | undefined)?.cpu) || '',
      memory: ((s.runtime as Record<string, string> | undefined)?.memory) || '',
      gpu: (s.runtime as Record<string, string> | undefined)?.gpu,
    },
    url: spaceHttpsUrl(id),
    wssEnabled: false,
    sshEnabled: false,
  };
}

export async function listSpaces(token: string): Promise<HFSpace[]> {
  const data = (await fetchApi(token, '/me/spaces?full=true&limit=100')) as Record<string, unknown>[] | null;
  if (!Array.isArray(data)) return [];
  return data
    .map(mapSpace)
    .filter((s) => s.id)
    .sort((a, b) => (b.lastModified || '').localeCompare(a.lastModified || ''));
}

export async function getSpace(token: string, spaceId: string): Promise<HFSpace> {
  const data = (await fetchApi(token, `/spaces/${encodeURIComponent(spaceId)}`)) as Record<string, unknown>;
  return mapSpace(data);
}

export async function getSpaceStatus(token: string, spaceId: string): Promise<HFSpace['status']> {
  try {
    const data = await fetchApi(token, `/spaces/${encodeURIComponent(spaceId)}`);
    return ((data as Record<string, unknown>)?.status as HFSpace['status']) || 'unknown';
  } catch (e) {
    if (e instanceof HFError && (e.code === 'not_found' || e.code === 'unauthorized' || e.code === 'forbidden')) throw e;
    return 'unknown';
  }
}

export async function restartSpace(token: string, spaceId: string): Promise<boolean> {
  await fetchApi(token, `/spaces/${encodeURIComponent(spaceId)}/restart`, { method: 'POST' });
  return true;
}

export async function stopSpace(token: string, spaceId: string): Promise<boolean> {
  await fetchApi(token, `/spaces/${encodeURIComponent(spaceId)}/stop`, { method: 'POST' });
  return true;
}

export async function sleepSpace(token: string, spaceId: string): Promise<boolean> {
  await fetchApi(token, `/spaces/${encodeURIComponent(spaceId)}/sleep`, { method: 'POST' });
  return true;
}

export async function getSpaceLogs(token: string, spaceId: string): Promise<HFSpaceLog[]> {
  const data = await fetchApi(token, `/spaces/${encodeURIComponent(spaceId)}/logs`);
  if (!Array.isArray(data)) return [];
  return data.map((l: Record<string, unknown>) => ({
    timestamp: (l.timestamp as string) || (l.date as string) || '',
    level: ((l.level as string) || 'info').toLowerCase(),
    message: (l.message as string) || (l.data as string) || '',
  }));
}

export async function listSpaceFiles(
  token: string,
  spaceId: string,
  path = ''
): Promise<HFFile[]> {
  const q = path ? `?path=${encodeURIComponent(path)}` : '';
  const data = await fetchApi(token, `/spaces/${encodeURIComponent(spaceId)}/tree/main${q}`);
  if (!Array.isArray(data)) return [];
  return data.map((f: Record<string, unknown>) => ({
    name: (f.path as string) || (f.rfname as string) || '',
    path: (f.path as string) || (f.rfname as string) || '',
    type: f.type === 'directory' ? 'dir' : 'file',
    size: f.size as number,
  }));
}

export async function readSpaceFile(token: string, spaceId: string, filePath: string): Promise<string> {
  const url = `${HF_API_BASE}/spaces/${spaceId}/resolve/main/${filePath}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Authorization: `Bearer ${token}` },
    });
    clearTimeout(timer);
    if (!res.ok) throw mapStatus(res.status);
    return await res.text();
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof HFError) throw e;
    if (e instanceof Error && e.name === 'AbortError') throw new HFError(0, 'timeout', 'File read timed out');
    throw new HFError(0, 'network', e instanceof Error ? e.message : 'Network error');
  }
}

export async function writeSpaceFile(
  token: string,
  spaceId: string,
  filePath: string,
  content: string
): Promise<boolean> {
  const url = `${HF_API_BASE}/spaces/${spaceId}/commit/main`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const header = btoa(JSON.stringify({ summary: `Update ${filePath} via Bridge`, filePath }));
    void header;
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'X-Commit-Description': `Update ${filePath} via Bridge`,
      },
      body: content,
    });
    clearTimeout(timer);
    if (!res.ok) throw mapStatus(res.status, await res.text().catch(() => ''));
    return true;
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof HFError) throw e;
    throw new HFError(0, 'network', e instanceof Error ? e.message : 'Network error');
  }
}

export async function deleteSpaceFile(
  token: string,
  spaceId: string,
  filePath: string
): Promise<boolean> {
  const url = `${HF_API_BASE}/spaces/${spaceId}/commit/main`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'X-Commit-Description': `Delete ${filePath} via Bridge`,
      },
      body: `delete ${filePath}\n`,
    });
    clearTimeout(timer);
    if (!res.ok) throw mapStatus(res.status, await res.text().catch(() => ''));
    return true;
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof HFError) throw e;
    throw new HFError(0, 'network', e instanceof Error ? e.message : 'Network error');
  }
}

export function getSpaceWssUrl(spaceId: string, path = '/_mgmt-dash/ws/'): string {
  return `wss://${spaceWssHost(spaceId)}${path}`;
}
