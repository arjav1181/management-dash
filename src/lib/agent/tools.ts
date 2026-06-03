import type { FlatSettings } from '@/lib/server/settings';

export interface ToolContext {
  settings: FlatSettings;
  userId: string;
  confirmDestructive: (toolName: string) => Promise<boolean>;
  log: (event: string, meta?: Record<string, unknown>) => Promise<void>;
}

export interface AgentTool {
  name: string;
  description: string;
  platform: 'hf' | 'vercel' | 'github' | 'gitlab' | 'docker' | 'netlify' | 'agent';
  requiresConfirmation: boolean;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
  execute: (params: Record<string, unknown>, ctx: ToolContext) => Promise<{ ok: boolean; summary: string; data?: unknown }>;
}

import { listSpaces, getSpaceStatus, restartSpace, stopSpace, sleepSpace, getSpaceLogs } from '@/lib/api/huggingface';
import { listProjects, listDeployments, triggerDeploy, getDeploymentLogs } from '@/lib/api/vercel';
import { listRepos, listIssues, listPRs, getCommits, listActionRuns, createIssue, mergePR } from '@/lib/api/github';

const jsonResult = (data: unknown) => ({ ok: true, summary: 'OK', data });

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: 'list_hf_spaces',
    description: 'List all Hugging Face Spaces for the current user with their status.',
    platform: 'hf',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {}, required: [] },
    execute: async (_p, ctx) => {
      const spaces = await listSpaces(ctx.settings.hfToken);
      return {
        ok: true,
        summary: `${spaces.length} space(s) found`,
        data: spaces.slice(0, 20).map((s) => ({ id: s.id, name: s.name, status: s.status, sdk: s.sdk })),
      };
    },
  },
  {
    name: 'restart_hf_space',
    description: 'Restart a specific Hugging Face Space.',
    platform: 'hf',
    requiresConfirmation: true,
    parameters: {
      type: 'object',
      properties: { spaceId: { type: 'string', description: 'HF space id, e.g. username/space-name' } },
      required: ['spaceId'],
    },
    execute: async (p, ctx) => {
      const ok = await restartSpace(ctx.settings.hfToken, p.spaceId as string);
      return { ok, summary: ok ? `Restart signal sent to ${p.spaceId}` : `Failed to restart ${p.spaceId}` };
    },
  },
  {
    name: 'sleep_hf_space',
    description: 'Put a Hugging Face Space to sleep.',
    platform: 'hf',
    requiresConfirmation: true,
    parameters: {
      type: 'object',
      properties: { spaceId: { type: 'string', description: 'HF space id' } },
      required: ['spaceId'],
    },
    execute: async (p, ctx) => {
      const ok = await sleepSpace(ctx.settings.hfToken, p.spaceId as string);
      return { ok, summary: ok ? `Sleep signal sent to ${p.spaceId}` : `Failed to sleep ${p.spaceId}` };
    },
  },
  {
    name: 'stop_hf_space',
    description: 'Stop a Hugging Face Space.',
    platform: 'hf',
    requiresConfirmation: true,
    parameters: {
      type: 'object',
      properties: { spaceId: { type: 'string', description: 'HF space id' } },
      required: ['spaceId'],
    },
    execute: async (p, ctx) => {
      const ok = await stopSpace(ctx.settings.hfToken, p.spaceId as string);
      return { ok, summary: ok ? `Stop signal sent to ${p.spaceId}` : `Failed to stop ${p.spaceId}` };
    },
  },
  {
    name: 'get_hf_space_status',
    description: 'Get the runtime status of a specific Hugging Face Space.',
    platform: 'hf',
    requiresConfirmation: false,
    parameters: {
      type: 'object',
      properties: { spaceId: { type: 'string', description: 'HF space id' } },
      required: ['spaceId'],
    },
    execute: async (p, ctx) => {
      const status = await getSpaceStatus(ctx.settings.hfToken, p.spaceId as string);
      return { ok: true, summary: `Status: ${status}`, data: { status } };
    },
  },
  {
    name: 'get_hf_space_logs',
    description: 'Get recent runtime logs for a Hugging Face Space.',
    platform: 'hf',
    requiresConfirmation: false,
    parameters: {
      type: 'object',
      properties: { spaceId: { type: 'string', description: 'HF space id' } },
      required: ['spaceId'],
    },
    execute: async (p, ctx) => {
      const logs = await getSpaceLogs(ctx.settings.hfToken, p.spaceId as string);
      return { ok: true, summary: `${logs.length} log entries`, data: logs.slice(0, 20) };
    },
  },
  {
    name: 'list_vercel_projects',
    description: 'List all Vercel projects for the current user.',
    platform: 'vercel',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {}, required: [] },
    execute: async (_p, ctx) => {
      const projects = await listProjects(ctx.settings.vercelToken);
      return { ok: true, summary: `${projects.length} project(s)`, data: projects.slice(0, 20).map((p) => ({ id: p.id, name: p.name, framework: p.framework })) };
    },
  },
  {
    name: 'list_vercel_deployments',
    description: 'List recent deployments for a specific Vercel project.',
    platform: 'vercel',
    requiresConfirmation: false,
    parameters: {
      type: 'object',
      properties: { projectId: { type: 'string', description: 'Vercel project id' } },
      required: ['projectId'],
    },
    execute: async (p, ctx) => {
      const deployments = await listDeployments(ctx.settings.vercelToken, p.projectId as string);
      return { ok: true, summary: `${deployments.length} deployment(s)`, data: deployments.slice(0, 10) };
    },
  },
  {
    name: 'trigger_vercel_deploy',
    description: 'Trigger a new deploy for a Vercel project. Optionally specify a target branch.',
    platform: 'vercel',
    requiresConfirmation: true,
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'Vercel project id' },
        branch: { type: 'string', description: 'Optional target branch' },
      },
      required: ['projectId'],
    },
    execute: async (p, ctx) => {
      const ok = await triggerDeploy(ctx.settings.vercelToken, p.projectId as string, p.branch as string | undefined);
      return { ok, summary: ok ? `Deploy triggered for ${p.projectId}` : `Failed to trigger deploy` };
    },
  },
  {
    name: 'get_vercel_deployment_logs',
    description: 'Get logs for a specific Vercel deployment.',
    platform: 'vercel',
    requiresConfirmation: false,
    parameters: {
      type: 'object',
      properties: { deploymentId: { type: 'string', description: 'Vercel deployment id' } },
      required: ['deploymentId'],
    },
    execute: async (p, ctx) => {
      const logs = await getDeploymentLogs(ctx.settings.vercelToken, p.deploymentId as string);
      return { ok: true, summary: `${logs.length} log lines`, data: logs.slice(0, 30) };
    },
  },
  {
    name: 'list_github_repos',
    description: 'List GitHub repositories accessible to the current token.',
    platform: 'github',
    requiresConfirmation: false,
    parameters: { type: 'object', properties: {}, required: [] },
    execute: async (_p, ctx) => {
      const repos = await listRepos(ctx.settings.githubToken, ctx.settings.githubScope);
      return { ok: true, summary: `${repos.length} repo(s)`, data: repos.slice(0, 20).map((r) => ({ fullName: r.fullName, stars: r.stars, language: r.language, updatedAt: r.updatedAt })) };
    },
  },
  {
    name: 'list_github_commits',
    description: 'List recent commits on a GitHub repository.',
    platform: 'github',
    requiresConfirmation: false,
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        branch: { type: 'string', description: 'Optional branch' },
      },
      required: ['owner', 'repo'],
    },
    execute: async (p, ctx) => jsonResult(await getCommits(ctx.settings.githubToken, p.owner as string, p.repo as string, p.branch as string | undefined)),
  },
  {
    name: 'list_github_issues',
    description: 'List issues for a GitHub repository.',
    platform: 'github',
    requiresConfirmation: false,
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        state: { type: 'string', description: 'open|closed|all', enum: ['open', 'closed', 'all'] },
      },
      required: ['owner', 'repo'],
    },
    execute: async (p, ctx) => jsonResult(await listIssues(ctx.settings.githubToken, p.owner as string, p.repo as string, (p.state as 'open' | 'closed' | 'all') || 'open')),
  },
  {
    name: 'list_github_pulls',
    description: 'List pull requests for a GitHub repository.',
    platform: 'github',
    requiresConfirmation: false,
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        state: { type: 'string', description: 'open|closed|all', enum: ['open', 'closed', 'all'] },
      },
      required: ['owner', 'repo'],
    },
    execute: async (p, ctx) => jsonResult(await listPRs(ctx.settings.githubToken, p.owner as string, p.repo as string, (p.state as 'open' | 'closed' | 'all') || 'open')),
  },
  {
    name: 'list_github_actions',
    description: 'List recent GitHub Actions workflow runs for a repository.',
    platform: 'github',
    requiresConfirmation: false,
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
      },
      required: ['owner', 'repo'],
    },
    execute: async (p, ctx) => jsonResult(await listActionRuns(ctx.settings.githubToken, p.owner as string, p.repo as string)),
  },
  {
    name: 'create_github_issue',
    description: 'Create a new issue on a GitHub repository. Requires write scope.',
    platform: 'github',
    requiresConfirmation: true,
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'Issue title' },
        body: { type: 'string', description: 'Issue body (markdown)' },
      },
      required: ['owner', 'repo', 'title'],
    },
    execute: async (p, ctx) => {
      if (ctx.settings.githubScope === 'read') {
        return { ok: false, summary: 'Write scope required to create issues' };
      }
      const ok = await createIssue(ctx.settings.githubToken, p.owner as string, p.repo as string, p.title as string, p.body as string | undefined);
      return { ok, summary: ok ? `Issue created on ${p.owner}/${p.repo}` : 'Failed to create issue' };
    },
  },
  {
    name: 'merge_github_pr',
    description: 'Merge a pull request. Requires write scope.',
    platform: 'github',
    requiresConfirmation: true,
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pullNumber: { type: 'number', description: 'PR number' },
      },
      required: ['owner', 'repo', 'pullNumber'],
    },
    execute: async (p, ctx) => {
      if (ctx.settings.githubScope === 'read') {
        return { ok: false, summary: 'Write scope required to merge PRs' };
      }
      const ok = await mergePR(ctx.settings.githubToken, p.owner as string, p.repo as string, p.pullNumber as number);
      return { ok, summary: ok ? `PR #${p.pullNumber} merged` : 'Failed to merge PR' };
    },
  },
];

export function getToolByName(name: string): AgentTool | undefined {
  return AGENT_TOOLS.find((t) => t.name === name);
}

export function toolRequiresToken(tool: AgentTool, settings: FlatSettings): string | null {
  if (tool.platform === 'hf' && !settings.hfToken) return 'Hugging Face';
  if (tool.platform === 'vercel' && !settings.vercelToken) return 'Vercel';
  if (tool.platform === 'github' && !settings.githubToken) return 'GitHub';
  if (tool.platform === 'docker' && !settings.dockerToken) return 'Docker';
  if (tool.platform === 'gitlab' && !settings.gitlabToken) return 'GitLab';
  if (tool.platform === 'netlify' && !settings.netlifyToken) return 'Netlify';
  return null;
}
