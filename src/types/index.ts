// ─── HF Spaces ──────────────────────────────────────────
export interface HFUser {
  name: string;
  avatarUrl: string;
}

export interface HFSpace {
  id: string;
  name: string;
  sdk: string;
  status: 'running' | 'sleeping' | 'building' | 'error' | 'unknown';
  likes: number;
  private: boolean;
  createdAt: string;
  lastModified: string;
  runtime: { cpu: string; memory: string; gpu?: string };
  url: string;
  wssEnabled?: boolean;
  sshEnabled?: boolean;
}

export interface HFSpaceLog {
  timestamp: string;
  level: string;
  message: string;
}

export interface HFFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  children?: HFFile[];
}

// ─── Vercel ─────────────────────────────────────────────
export interface VercelProject {
  id: string;
  name: string;
  framework: string | null;
  gitRepository: { repo: string; owner: string } | null;
  updatedAt: string;
  latestDeployments: VercelDeployment[];
}

export interface VercelDeployment {
  id: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  createdAt: string;
  builder: { id: string };
  meta: Record<string, string>;
}

// ─── GitHub ─────────────────────────────────────────────
export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  htmlUrl: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  updatedAt: string;
  pushedAt: string;
  defaultBranch: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: { name: string; email: string; date: string };
  committer: { name: string; email: string; date: string };
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  labels: { name: string; color: string }[];
  assignee: { login: string } | null;
}

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  createdAt: string;
  updatedAt: string;
  head: { ref: string; sha: string };
  base: { ref: string };
}

export interface GitHubActionRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | null;
  createdAt: string;
  updatedAt: string;
  headBranch: string;
}

// ─── Docker Hub ─────────────────────────────────────────
export interface DockerRepo {
  name: string;
  namespace: string;
  repoName: string;
  description: string;
  starCount: number;
  pullCount: number;
  lastUpdated: string;
  dateRegistered: string;
  tags: string[];
}

export interface DockerTag {
  name: string;
  size: number;
  lastPushed: string;
  lastPulled: string;
  digest: string;
}

// ─── GitLab ─────────────────────────────────────────────
export interface GitLabProject {
  id: number;
  name: string;
  nameWithNamespace: string;
  pathWithNamespace: string;
  description: string;
  visibility: 'public' | 'private' | 'internal';
  avatarUrl: string | null;
  starCount: number;
  forkCount: number;
  openIssuesCount: number;
  defaultBranch: string;
  httpUrlToRepo: string;
  lastActivityAt: string;
}

export interface GitLabPipeline {
  id: number;
  status: 'running' | 'pending' | 'success' | 'failed' | 'canceled' | 'skipped';
  ref: string;
  sha: string;
  webUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitLabMR {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: 'opened' | 'closed' | 'merged' | 'locked';
  draft: boolean;
  sourceBranch: string;
  targetBranch: string;
  webUrl: string;
  createdAt: string;
}

// ─── Netlify ────────────────────────────────────────────
export interface NetlifySite {
  id: string;
  name: string;
  url: string;
  repoUrl: string | null;
  buildSettings: { repo: string; branch: string } | null;
  createdAt: string;
  updatedAt: string;
  publishedDeploy?: NetlifyDeploy;
}

export interface NetlifyDeploy {
  id: string;
  siteId: string;
  deployUrl: string;
  state: 'ready' | 'building' | 'error' | 'queued';
  branch: string;
  commitRef: string;
  commitUrl: string;
  createdAt: string;
  publishedAt: string | null;
}

// ─── LLM & Agent ────────────────────────────────────────
export interface LLMConfig {
  provider: 'groq' | 'gemini' | 'anthropic' | 'openai' | 'openrouter' | 'cerebras' | 'custom';
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export const LLM_PROVIDERS: { value: LLMConfig['provider']; label: string; models: string[] }[] = [
  { value: 'groq', label: 'Groq', models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'] },
  { value: 'gemini', label: 'Gemini', models: ['gemini-2.5-flash', 'gemini-2.5-pro'] },
  { value: 'anthropic', label: 'Anthropic', models: ['claude-sonnet-4-6', 'claude-haiku-4-5'] },
  { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'] },
  { value: 'openrouter', label: 'OpenRouter', models: ['anthropic/claude-sonnet-4-6', 'openai/gpt-4o', 'google/gemini-2.5-flash'] },
  { value: 'cerebras', label: 'Cerebras', models: ['llama-3.3-70b'] },
  { value: 'custom', label: 'Custom (OpenAI-compatible)', models: ['custom'] },
];

export type GitHubScope = 'read' | 'write' | 'admin';

// ─── Settings ───────────────────────────────────────────
export interface UserSettings {
  hfToken: string;
  vercelToken: string;
  githubToken: string;
  dockerToken: string;
  gitlabToken: string;
  gitlabUrl: string;
  netlifyToken: string;
  githubScope: GitHubScope;
  llmConfig: LLMConfig;
  email: string;
  passwordHash: string;
}

export interface TokenStatus {
  hf: boolean;
  vercel: boolean;
  github: boolean;
  docker: boolean;
  gitlab: boolean;
  netlify: boolean;
  llm: boolean;
}

export interface AuthUser {
  email: string;
  isLoggedIn: boolean;
}

// ─── Activity & Notifications ───────────────────────────
export type Platform = 'huggingface' | 'vercel' | 'github' | 'agent' | 'docker' | 'gitlab' | 'netlify';

export interface ActivityItem {
  id: string;
  platform: Platform;
  type: string;
  message: string;
  timestamp: string;
  link?: string;
  icon?: string;
}

export interface Notification {
  id: string;
  type: 'deploy_success' | 'deploy_fail' | 'build_complete' | 'space_error' | 'pr_merged' | 'issue_assigned' | 'pipeline_fail' | 'system';
  platform: Platform;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

// ─── Agent ──────────────────────────────────────────────
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actions?: AgentAction[];
}

export interface AgentAction {
  id: string;
  type: string;
  status: 'pending' | 'approved' | 'executing' | 'done' | 'failed' | 'awaiting_confirmation';
  description: string;
  requiresConfirmation: boolean;
  ok?: boolean;
  summary?: string;
  args?: Record<string, unknown>;
}

// ─── Dashboard Widgets ──────────────────────────────────
export interface WidgetData {
  totalSpaces: number;
  runningSpaces: number;
  totalVercel: number;
  readyVercel: number;
  totalRepos: number;
  totalStars: number;
  totalIssues: number;
  totalDeployments: number;
  failedDeployments: number;
  healthScore: number;
  recentEvents: ActivityItem[];
}
