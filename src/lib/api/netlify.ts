import type { NetlifySite, NetlifyDeploy } from '@/types';

const NETLIFY_API = 'https://api.netlify.com/api/v1';

async function fetchApi(token: string, path: string) {
  const res = await fetch(`${NETLIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Netlify API error: ${res.status}`);
  return res.json();
}

export async function listSites(token: string): Promise<NetlifySite[]> {
  const data = await fetchApi(token, '/sites?per_page=50');
  return (data || []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: s.name as string,
    url: s.ssl_url as string || s.url as string,
    repoUrl: (s.build_settings as Record<string, string>)?.repo_url || null,
    buildSettings: s.build_settings
      ? { repo: (s.build_settings as Record<string, string>).repo || '', branch: (s.build_settings as Record<string, string>).branch || '' }
      : null,
    createdAt: (s.created_at as string) || '',
    updatedAt: (s.updated_at as string) || '',
    publishedDeploy: s.published_deploy ? {
      id: (s.published_deploy as Record<string, unknown>).id as string,
      siteId: s.id as string,
      deployUrl: (s.published_deploy as Record<string, unknown>).deploy_url as string || '',
      state: (s.published_deploy as Record<string, unknown>).state as NetlifyDeploy['state'] || 'ready',
      branch: (s.published_deploy as Record<string, unknown>).branch as string || '',
      commitRef: (s.published_deploy as Record<string, unknown>).commit_ref as string || '',
      commitUrl: (s.published_deploy as Record<string, unknown>).commit_url as string || '',
      createdAt: (s.published_deploy as Record<string, unknown>).created_at as string || '',
      publishedAt: (s.published_deploy as Record<string, unknown>).published_at as string || null,
    } : undefined,
  }));
}

export async function listDeploys(token: string, siteId: string): Promise<NetlifyDeploy[]> {
  const data = await fetchApi(token, `/sites/${siteId}/deploys?per_page=20`);
  return (data || []).map((d: Record<string, unknown>) => ({
    id: d.id as string,
    siteId,
    deployUrl: (d.deploy_url as string) || '',
    state: (d.state as NetlifyDeploy['state']) || 'queued',
    branch: (d.branch as string) || '',
    commitRef: (d.commit_ref as string) || '',
    commitUrl: (d.commit_url as string) || '',
    createdAt: (d.created_at as string) || '',
    publishedAt: (d.published_at as string) || null,
  }));
}
