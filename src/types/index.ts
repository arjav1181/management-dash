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

export interface UserSettings {
  hfToken: string;
  vercelToken: string;
  githubToken: string;
  githubScope: GitHubScope;
  llmConfig: LLMConfig;
  email: string;
  passwordHash: string;
}

export interface AuthUser {
  email: string;
  isLoggedIn: boolean;
}

export interface ActivityItem {
  id: string;
  platform: 'huggingface' | 'vercel' | 'github' | 'agent';
  type: string;
  message: string;
  timestamp: string;
  link?: string;
}

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
  status: 'pending' | 'approved' | 'executing' | 'done' | 'failed';
  description: string;
  requiresConfirmation: boolean;
}
