import type { LLMConfig, GitHubScope } from '@/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { encryptToken, decryptToken } from './crypto';

export interface UserSettingsRow {
  id: string;
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
  wss_secrets: Record<string, string> | null;
  created_at?: string;
  updated_at?: string;
}

export interface FlatSettings {
  hfToken: string;
  vercelToken: string;
  githubToken: string;
  dockerToken: string;
  gitlabToken: string;
  gitlabUrl: string;
  netlifyToken: string;
  githubScope: GitHubScope;
  llmConfig: LLMConfig;
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

const DEFAULT_SETTINGS: FlatSettings = {
  hfToken: '',
  vercelToken: '',
  githubToken: '',
  dockerToken: '',
  gitlabToken: '',
  gitlabUrl: 'https://gitlab.com',
  netlifyToken: '',
  githubScope: 'read',
  llmConfig: { provider: 'groq', apiKey: '', model: 'llama-3.1-8b-instant' },
};

const ENC_PREFIX = 'enc:';

function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}

function isLegacyPlaintext(value: string): boolean {
  return !isEncrypted(value);
}

export { isLegacyPlaintext };

function safeDecrypt(cipher: string | null | undefined): string {
  if (!cipher) return '';
  if (!isEncrypted(cipher)) return cipher;
  try {
    return decryptToken(cipher.slice(ENC_PREFIX.length));
  } catch {
    return '';
  }
}

export function rowToSettings(row: Partial<UserSettingsRow> | null | undefined): FlatSettings {
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    hfToken: safeDecrypt(row.hf_token),
    vercelToken: safeDecrypt(row.vercel_token),
    githubToken: safeDecrypt(row.github_token),
    dockerToken: safeDecrypt(row.docker_token),
    gitlabToken: safeDecrypt(row.gitlab_token),
    gitlabUrl: row.gitlab_url || 'https://gitlab.com',
    netlifyToken: safeDecrypt(row.netlify_token),
    githubScope: ((row.github_scope as GitHubScope) || 'read'),
    llmConfig: {
      provider: (row.llm_provider as LLMConfig['provider']) || 'groq',
      model: row.llm_model || 'llama-3.1-8b-instant',
      apiKey: safeDecrypt(row.llm_api_key),
      baseUrl: row.llm_base_url || undefined,
    },
  };
}

export function settingsToRow(settings: FlatSettings): Partial<UserSettingsRow> {
  const wrap = (plain: string): string => (plain ? ENC_PREFIX + encryptToken(plain) : '');
  return {
    hf_token: wrap(settings.hfToken),
    vercel_token: wrap(settings.vercelToken),
    github_token: wrap(settings.githubToken),
    docker_token: wrap(settings.dockerToken),
    gitlab_token: wrap(settings.gitlabToken),
    gitlab_url: settings.gitlabUrl,
    netlify_token: wrap(settings.netlifyToken),
    github_scope: settings.githubScope,
    llm_provider: settings.llmConfig.provider,
    llm_model: settings.llmConfig.model,
    llm_api_key: wrap(settings.llmConfig.apiKey),
    llm_base_url: settings.llmConfig.baseUrl || '',
  };
}

export function settingsToTokenStatus(settings: FlatSettings): TokenStatus {
  return {
    hf: !!settings.hfToken,
    vercel: !!settings.vercelToken,
    github: !!settings.githubToken,
    docker: !!settings.dockerToken,
    gitlab: !!settings.gitlabToken,
    netlify: !!settings.netlifyToken,
    llm: !!settings.llmConfig.apiKey,
  };
}

export type SupabaseLike = SupabaseClient;

export async function loadSettings(supabase: SupabaseLike, userId: string): Promise<{ settings: FlatSettings; row: UserSettingsRow | null; isNew: boolean }> {
  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('id', userId)
    .single();

  if (!data) {
    const seed = { ...settingsToRow(DEFAULT_SETTINGS), id: userId };
    const { data: inserted } = await supabase
      .from('user_settings')
      .upsert(seed)
      .select()
      .single();
    return { settings: rowToSettings(inserted as UserSettingsRow | null), row: inserted as UserSettingsRow | null, isNew: true };
  }

  return { settings: rowToSettings(data as UserSettingsRow), row: data as UserSettingsRow, isNew: false };
}

export async function persistSettings(
  supabase: SupabaseLike,
  userId: string,
  settings: FlatSettings
): Promise<void> {
  const payload = { ...settingsToRow(settings), id: userId, updated_at: new Date().toISOString() };
  const { error } = await supabase.from('user_settings').upsert(payload);
  if (error) throw error;
}

export async function getWssSecret(supabase: SupabaseLike, userId: string, spaceId: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_settings')
    .select('wss_secrets')
    .eq('id', userId)
    .single();
  const row = data as { wss_secrets: Record<string, string> | null } | null;
  const map = row?.wss_secrets || null;
  return map?.[spaceId] ?? null;
}

export async function setWssSecret(
  supabase: SupabaseLike,
  userId: string,
  spaceId: string,
  secret: string
): Promise<void> {
  const { data } = await supabase
    .from('user_settings')
    .select('wss_secrets')
    .eq('id', userId)
    .single();
  const row = data as { wss_secrets: Record<string, string> | null } | null;
  const map = row?.wss_secrets || {};
  map[spaceId] = secret;
  const { error } = await supabase
    .from('user_settings')
    .upsert({ id: userId, wss_secrets: map, updated_at: new Date().toISOString() });
  if (error) throw error;
}
