import { HF_API_BASE } from '@/lib/utils/constants';
import type { HFSpace, HFSpaceLog, HFFile } from '@/types';

async function fetchApi(token: string, path: string, options?: RequestInit) {
  const res = await fetch(`${HF_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`HF API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function listSpaces(token: string): Promise<HFSpace[]> {
  const whoami = await fetchApi(token, '/whoami');
  const name = whoami?.name as string;
  const orgs = (whoami?.orgs as { name: string }[]) || [];

  const authors = [name, ...orgs.map((o) => o.name)];
  const results: HFSpace[] = [];

  for (const author of authors) {
    try {
      const data = await fetchApi(token, `/spaces?author=${author}`);
      const spaces: HFSpace[] = (data || []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        name: (s.id as string).split('/')[1] || (s.id as string),
        sdk: (s.sdk as string) || 'docker',
        status: (s.status as HFSpace['status']) || 'unknown',
        likes: (s.likes as number) || 0,
        private: (s.private as boolean) || false,
        createdAt: (s.createdAt as string) || '',
        lastModified: (s.lastModified as string) || '',
        runtime: {
          cpu: ((s.runtime as Record<string, string>)?.cpu) || '',
          memory: ((s.runtime as Record<string, string>)?.memory) || '',
          gpu: (s.runtime as Record<string, string>)?.gpu,
        },
        url: `https://${(s.id as string).split('/')[1] || s.id}.hf.space`,
        wssEnabled: false,
        sshEnabled: false,
      }));
      results.push(...spaces);
    } catch {
      // skip orgs that fail
    }
  }

  const seen = new Set<string>();
  return results.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

export async function getSpaceStatus(token: string, spaceId: string): Promise<HFSpace['status']> {
  try {
    const data = await fetchApi(token, `/spaces/${spaceId}`);
    return (data?.status as HFSpace['status']) || 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function restartSpace(token: string, spaceId: string): Promise<boolean> {
  try {
    await fetchApi(token, `/spaces/${spaceId}/restart`, { method: 'POST' });
    return true;
  } catch {
    return false;
  }
}

export async function stopSpace(token: string, spaceId: string): Promise<boolean> {
  try {
    await fetchApi(token, `/spaces/${spaceId}/stop`, { method: 'POST' });
    return true;
  } catch {
    return false;
  }
}

export async function sleepSpace(token: string, spaceId: string): Promise<boolean> {
  try {
    await fetchApi(token, `/spaces/${spaceId}/sleep`, { method: 'POST' });
    return true;
  } catch {
    return false;
  }
}

export async function getSpaceLogs(token: string, spaceId: string): Promise<HFSpaceLog[]> {
  try {
    const data = await fetchApi(token, `/spaces/${spaceId}/logs`);
    return (data || []).map((l: Record<string, unknown>) => ({
      timestamp: (l.timestamp as string) || '',
      level: (l.level as string) || 'info',
      message: (l.message as string) || '',
    }));
  } catch {
    return [];
  }
}

export async function listSpaceFiles(
  token: string,
  spaceId: string,
  path = ''
): Promise<HFFile[]> {
  try {
    const data = await fetchApi(token, `/spaces/${spaceId}/files${path ? `?path=${encodeURIComponent(path)}` : ''}`);
    return (data || []).map((f: Record<string, unknown>) => ({
      name: f.name as string,
      path: f.path as string || f.name as string,
      type: (f.type as 'file' | 'dir') || ((f as Record<string, unknown>).children ? 'dir' : 'file'),
      size: f.size as number,
      children: f.children ? (f.children as Record<string, unknown>[]).map((c) => ({
        name: c.name as string,
        path: c.path as string || c.name as string,
        type: (c.type as 'file' | 'dir') || 'file',
        size: c.size as number,
      })) : undefined,
    }));
  } catch {
    return [];
  }
}

export async function readSpaceFile(token: string, spaceId: string, filePath: string): Promise<string> {
  try {
    const res = await fetch(`${HF_API_BASE}/spaces/${spaceId}/files/${filePath}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok ? await res.text() : '';
  } catch {
    return '';
  }
}

export async function writeSpaceFile(
  token: string,
  spaceId: string,
  filePath: string,
  content: string
): Promise<boolean> {
  try {
    const res = await fetch(`${HF_API_BASE}/spaces/${spaceId}/files/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: content,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteSpaceFile(
  token: string,
  spaceId: string,
  filePath: string
): Promise<boolean> {
  try {
    const res = await fetch(`${HF_API_BASE}/spaces/${spaceId}/files/${filePath}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
