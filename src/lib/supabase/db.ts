import type { LLMConfig } from '@/types';

export interface UserSettingsRow {
  hf_token: string;
  vercel_token: string;
  github_token: string;
  docker_token: string;
  gitlab_token: string;
  gitlab_url: string;
  netlify_token: string;
  github_scope: string;
  llm_provider: string;
  llm_model: string;
  llm_api_key: string;
  llm_base_url: string;
}

const DEFAULT_ROW: UserSettingsRow = {
  hf_token: '',
  vercel_token: '',
  github_token: '',
  docker_token: '',
  gitlab_token: '',
  gitlab_url: 'https://gitlab.com',
  netlify_token: '',
  github_scope: 'read',
  llm_provider: 'groq',
  llm_model: 'llama-3.1-8b-instant',
  llm_api_key: '',
  llm_base_url: '',
};

interface FlatSettings {
  hfToken: string;
  vercelToken: string;
  githubToken: string;
  dockerToken: string;
  gitlabToken: string;
  gitlabUrl: string;
  netlifyToken: string;
  githubScope: string;
  llmConfig: LLMConfig;
}

export function rowToSettings(row: Partial<UserSettingsRow>) {
  return {
    hfToken: row.hf_token ?? '',
    vercelToken: row.vercel_token ?? '',
    githubToken: row.github_token ?? '',
    dockerToken: row.docker_token ?? '',
    gitlabToken: row.gitlab_token ?? '',
    gitlabUrl: row.gitlab_url ?? 'https://gitlab.com',
    netlifyToken: row.netlify_token ?? '',
    githubScope: (row.github_scope ?? 'read') as 'read' | 'write' | 'admin',
    llmConfig: {
      provider: (row.llm_provider ?? 'groq') as LLMConfig['provider'],
      model: row.llm_model ?? 'llama-3.1-8b-instant',
      apiKey: row.llm_api_key ?? '',
      baseUrl: row.llm_base_url || undefined,
    } as LLMConfig,
  };
}

export function settingsToRow(settings: FlatSettings): Partial<UserSettingsRow> {
  return {
    hf_token: settings.hfToken,
    vercel_token: settings.vercelToken,
    github_token: settings.githubToken,
    docker_token: settings.dockerToken,
    gitlab_token: settings.gitlabToken,
    gitlab_url: settings.gitlabUrl,
    netlify_token: settings.netlifyToken,
    github_scope: settings.githubScope,
    llm_provider: settings.llmConfig.provider,
    llm_model: settings.llmConfig.model,
    llm_api_key: settings.llmConfig.apiKey,
    llm_base_url: settings.llmConfig.baseUrl || '',
  };
}

export async function fetchSettings(supabase: ReturnType<typeof import('./client').createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { settings: rowToSettings(DEFAULT_ROW), isNew: true };

  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!data) {
    const { data: inserted } = await supabase
      .from('user_settings')
      .upsert({ id: user.id, ...DEFAULT_ROW })
      .select()
      .single();
    return { settings: rowToSettings(inserted || DEFAULT_ROW), isNew: true };
  }

  return { settings: rowToSettings(data as UserSettingsRow), isNew: false };
}

export async function saveSettings(
  supabase: ReturnType<typeof import('./client').createClient>,
  settings: FlatSettings
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const row = settingsToRow(settings);
  const { error } = await supabase
    .from('user_settings')
    .upsert({ id: user.id, ...row, updated_at: new Date().toISOString() });
  if (error) throw error;
}
