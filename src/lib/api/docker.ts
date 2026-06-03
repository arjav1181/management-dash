import type { DockerRepo, DockerTag } from '@/types';

const DOCKER_HUB_API = 'https://hub.docker.com/v2';

export async function listRepos(token: string, namespace = ''): Promise<DockerRepo[]> {
  const url = namespace
    ? `${DOCKER_HUB_API}/repositories/${namespace}`
    : `${DOCKER_HUB_API}/repositories?page_size=50`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Docker API error: ${res.status}`);
  const data = await res.json();
  const results = data.results || data || [];
  return results.map((r: Record<string, unknown>) => ({
    name: `${r.namespace}/${r.name}` as string,
    namespace: r.namespace as string,
    repoName: r.name as string,
    description: (r.description as string) || '',
    starCount: (r.star_count as number) || 0,
    pullCount: (r.pull_count as number) || 0,
    lastUpdated: (r.last_updated as string) || '',
    dateRegistered: (r.date_registered as string) || '',
    tags: [],
  }));
}

export async function getRepoTags(token: string, namespace: string, repo: string): Promise<DockerTag[]> {
  const res = await fetch(`${DOCKER_HUB_API}/namespaces/${namespace}/repositories/${repo}/tags?page_size=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map((t: Record<string, unknown>) => ({
    name: t.name as string,
    size: (t.full_size as number) || 0,
    lastPushed: (t.last_pushed as string) || '',
    lastPulled: (t.last_pulled as string) || '',
    digest: t.digest as string,
  }));
}
