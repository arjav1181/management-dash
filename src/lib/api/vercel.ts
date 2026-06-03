import { VERCEL_API_BASE } from '@/lib/utils/constants';
import type { VercelProject, VercelDeployment } from '@/types';

async function fetchApi(token: string, path: string, options?: RequestInit) {
  const res = await fetch(`${VERCEL_API_BASE}/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`Vercel API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function listProjects(token: string): Promise<VercelProject[]> {
  const data = await fetchApi(token, '/projects');
  return (data?.projects || []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string,
    framework: (p.framework as string) || null,
    gitRepository: p.gitRepository
      ? {
          repo: (p.gitRepository as Record<string, string>).repo,
          owner: (p.gitRepository as Record<string, string>).owner,
        }
      : null,
    updatedAt: (p.updatedAt as string) || '',
    latestDeployments: ((p.latestDeployments as Record<string, unknown>[]) || []).map(
      (d: Record<string, unknown>) => ({
        id: d.id as string,
        name: d.name as string,
        url: d.url as string,
        state: d.state as VercelDeployment['state'],
        createdAt: (d.createdAt as string) || '',
        builder: { id: (d.builder as Record<string, string>)?.id || '' },
        meta: (d.meta as Record<string, string>) || {},
      })
    ),
  }));
}

export async function listDeployments(
  token: string,
  projectId: string
): Promise<VercelDeployment[]> {
  const data = await fetchApi(token, `/deployments?projectId=${projectId}&limit=50`);
  return (data?.deployments || []).map((d: Record<string, unknown>) => ({
    id: d.id as string,
    name: d.name as string,
    url: d.url as string,
    state: d.state as VercelDeployment['state'],
    createdAt: (d.createdAt as string) || '',
    builder: { id: (d.builder as Record<string, string>)?.id || '' },
    meta: (d.meta as Record<string, string>) || {},
  }));
}

export async function triggerDeploy(
  token: string,
  projectId: string,
  branch?: string
): Promise<boolean> {
  try {
    const body: Record<string, unknown> = {};
    if (branch) body.target = branch;
    const data = await fetchApi(token, `/deployments?projectId=${projectId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return !!data.id;
  } catch {
    return false;
  }
}

export async function getDeploymentLogs(
  token: string,
  deploymentId: string
): Promise<string[]> {
  try {
    const data = await fetchApi(token, `/deployments/${deploymentId}/logs`);
    return (data || []).map((l: Record<string, unknown>) => {
      const text =
        typeof l.text === 'string' ? l.text :
        typeof l.payload === 'string' ? l.payload :
        JSON.stringify(l);
      return `${l.createdAt || ''} ${text}`;
    });
  } catch {
    return [];
  }
}
