import { Octokit } from 'octokit';
import type { GitHubRepo, GitHubCommit, GitHubIssue, GitHubPR, GitHubActionRun, GitHubScope } from '@/types';

function createClient(token: string) {
  return new Octokit({ auth: token });
}

export async function listRepos(token: string, scope: GitHubScope = 'read'): Promise<GitHubRepo[]> {
  try {
    const octokit = createClient(token);
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 50,
      type: scope === 'read' ? 'public' : 'all',
    });
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      private: r.private,
      htmlUrl: r.html_url,
      stars: r.stargazers_count,
      forks: r.forks_count,
      openIssues: r.open_issues_count,
      language: r.language,
      updatedAt: r.updated_at || '',
      pushedAt: r.pushed_at || '',
      defaultBranch: r.default_branch,
    }));
  } catch {
    return [];
  }
}

export async function getCommits(
  token: string,
  owner: string,
  repo: string,
  branch?: string
): Promise<GitHubCommit[]> {
  try {
    const octokit = createClient(token);
    const { data } = await octokit.rest.repos.listCommits({
      owner, repo, sha: branch, per_page: 30,
    });
    return data.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
      author: {
        name: c.commit.author?.name || '',
        email: c.commit.author?.email || '',
        date: c.commit.author?.date || '',
      },
      committer: {
        name: c.commit.committer?.name || '',
        email: c.commit.committer?.email || '',
        date: c.commit.committer?.date || '',
      },
    }));
  } catch {
    return [];
  }
}

export async function listIssues(
  token: string,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubIssue[]> {
  try {
    const octokit = createClient(token);
    const { data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state,
      per_page: 30,
    });
    return (data as Array<Record<string, unknown>>).map((i) => ({
      id: i.id as number,
      number: i.number as number,
      title: (i.title as string) || '',
      state: (i.state as 'open' | 'closed') || 'open',
      createdAt: (i.created_at as string) || '',
      updatedAt: (i.updated_at as string) || '',
      labels: ((i.labels || []) as Array<Record<string, string>>).map((l) => ({
        name: l.name || '',
        color: l.color || '000',
      })),
      assignee: i.assignee ? { login: (i.assignee as Record<string, string>).login } : null,
    }));
  } catch {
    return [];
  }
}

export async function listPRs(
  token: string,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<GitHubPR[]> {
  try {
    const octokit = createClient(token);
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state,
      per_page: 30,
    });
    return (data as Array<Record<string, unknown>>).map((pr) => ({
      id: pr.id as number,
      number: pr.number as number,
      title: pr.title as string,
      state: (pr.merged || pr.merged_at) ? ('merged' as const) : ((pr.state || 'open') as 'open' | 'closed'),
      draft: (pr.draft as boolean) || false,
      createdAt: (pr.created_at as string) || '',
      updatedAt: (pr.updated_at as string) || '',
      head: { ref: ((pr.head as Record<string, string>)?.ref) || '', sha: ((pr.head as Record<string, string>)?.sha) || '' },
      base: { ref: ((pr.base as Record<string, string>)?.ref) || '' },
    }));
  } catch {
    return [];
  }
}

export async function listActionRuns(
  token: string,
  owner: string,
  repo: string
): Promise<GitHubActionRun[]> {
  try {
    const octokit = createClient(token);
    const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: 20,
    });
    return ((data.workflow_runs || []) as Array<Record<string, unknown>>).map((r) => ({
      id: r.id as number,
      name: (r.name as string) || '',
      status: (r.status as GitHubActionRun['status']) || 'queued',
      conclusion: (r.conclusion as GitHubActionRun['conclusion']) || null,
      createdAt: (r.created_at as string) || '',
      updatedAt: (r.updated_at as string) || '',
      headBranch: (r.head_branch as string) || '',
    }));
  } catch {
    return [];
  }
}

export async function createIssue(
  token: string,
  owner: string,
  repo: string,
  title: string,
  body?: string,
  labels?: string[]
): Promise<boolean> {
  try {
    const octokit = createClient(token);
    await octokit.rest.issues.create({ owner, repo, title, body, labels });
    return true;
  } catch {
    return false;
  }
}

export async function mergePR(
  token: string,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<boolean> {
  try {
    const octokit = createClient(token);
    await octokit.rest.pulls.merge({ owner, repo, pull_number: pullNumber });
    return true;
  } catch {
    return false;
  }
}
