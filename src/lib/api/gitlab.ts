import type { GitLabProject, GitLabPipeline, GitLabMR } from '@/types';

export async function listProjects(token: string, baseUrl = 'https://gitlab.com'): Promise<GitLabProject[]> {
  const res = await fetch(`${baseUrl}/api/v4/projects?membership=true&per_page=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GitLab API error: ${res.status}`);
  const data = await res.json();
  return (data || []).map((p: Record<string, unknown>) => ({
    id: p.id as number,
    name: p.name as string,
    nameWithNamespace: p.name_with_namespace as string,
    pathWithNamespace: p.path_with_namespace as string,
    description: (p.description as string) || '',
    visibility: (p.visibility as 'public' | 'private' | 'internal') || 'private',
    avatarUrl: (p.avatar_url as string) || null,
    starCount: (p.star_count as number) || 0,
    forkCount: (p.forks_count as number) || 0,
    openIssuesCount: (p.open_issues_count as number) || 0,
    defaultBranch: (p.default_branch as string) || 'main',
    httpUrlToRepo: p.http_url_to_repo as string,
    lastActivityAt: (p.last_activity_at as string) || '',
  }));
}

export async function listPipelines(token: string, projectId: number, baseUrl = 'https://gitlab.com'): Promise<GitLabPipeline[]> {
  const res = await fetch(`${baseUrl}/api/v4/projects/${projectId}/pipelines?per_page=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data || []).map((p: Record<string, unknown>) => ({
    id: p.id as number,
    status: (p.status as GitLabPipeline['status']) || 'pending',
    ref: p.ref as string,
    sha: p.sha as string,
    webUrl: p.web_url as string,
    createdAt: (p.created_at as string) || '',
    updatedAt: (p.updated_at as string) || '',
  }));
}

export async function listMRs(token: string, projectId: number, state: 'opened' | 'all' = 'opened', baseUrl = 'https://gitlab.com'): Promise<GitLabMR[]> {
  const res = await fetch(`${baseUrl}/api/v4/projects/${projectId}/merge_requests?state=${state}&per_page=20`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data || []).map((mr: Record<string, unknown>) => ({
    id: mr.id as number,
    iid: mr.iid as number,
    title: mr.title as string,
    description: (mr.description as string) || '',
    state: (mr.state as GitLabMR['state']) || 'opened',
    draft: (mr.draft as boolean) || false,
    sourceBranch: mr.source_branch as string,
    targetBranch: mr.target_branch as string,
    webUrl: mr.web_url as string,
    createdAt: (mr.created_at as string) || '',
  }));
}
