import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { persistSettings } from '@/lib/server/settings';

const TOKEN_KEYS = ['hfToken', 'vercelToken', 'githubToken', 'dockerToken', 'gitlabToken', 'netlifyToken', 'llmApiKey'] as const;
const CONFIG_KEYS = ['gitlabUrl', 'llmModel', 'llmBaseUrl', 'githubScope', 'llmProvider'] as const;

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json();

    const tokens: Record<string, string> = {};
    for (const k of TOKEN_KEYS) {
      if (typeof body[k] === 'string') tokens[k] = body[k];
    }

    const config: Record<string, string> = {};
    for (const k of CONFIG_KEYS) {
      if (typeof body[k] === 'string') config[k] = body[k];
    }

    if (Object.keys(tokens).length === 0 && Object.keys(config).length === 0) {
      throw new HttpError(400, 'No valid fields provided');
    }

    const { loadSettings } = await import('@/lib/server/settings');
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);

    const next = { ...settings };
    for (const [k, v] of Object.entries(tokens)) next[k as keyof typeof next] = v as never;
    if (config.gitlabUrl) next.gitlabUrl = config.gitlabUrl;
    if (config.llmModel) next.llmConfig = { ...next.llmConfig, model: config.llmModel };
    if (config.llmBaseUrl !== undefined) next.llmConfig = { ...next.llmConfig, baseUrl: config.llmBaseUrl || undefined };
    if (config.llmProvider) next.llmConfig = { ...next.llmConfig, provider: config.llmProvider as typeof next.llmConfig.provider };
    if (config.githubScope) next.githubScope = config.githubScope as typeof next.githubScope;

    await persistSettings(ctx.supabase, ctx.userId, next);
    ctx.logger.info('settings.tokens.updated', { fields: Object.keys({ ...tokens, ...config }) });
    return jsonOk({ success: true });
  } catch (e) {
    return errorResponse(e);
  }
}
