import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk, HttpError } from '@/lib/server/auth';
import { loadSettings, persistSettings, settingsToTokenStatus } from '@/lib/server/settings';

export async function GET() {
  try {
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    return jsonOk({
      githubScope: settings.githubScope,
      gitlabUrl: settings.gitlabUrl,
      llmProvider: settings.llmConfig.provider,
      llmModel: settings.llmConfig.model,
      llmBaseUrl: settings.llmConfig.baseUrl ?? '',
      tokens: settingsToTokenStatus(settings),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);

    const next = { ...settings };
    if (typeof body.githubScope === 'string') next.githubScope = body.githubScope;
    if (typeof body.gitlabUrl === 'string') next.gitlabUrl = body.gitlabUrl;
    if (typeof body.llmProvider === 'string') next.llmConfig = { ...next.llmConfig, provider: body.llmProvider };
    if (typeof body.llmModel === 'string') next.llmConfig = { ...next.llmConfig, model: body.llmModel };
    if (typeof body.llmBaseUrl === 'string') next.llmConfig = { ...next.llmConfig, baseUrl: body.llmBaseUrl || undefined };
    if (typeof body.llmApiKey === 'string') next.llmConfig = { ...next.llmConfig, apiKey: body.llmApiKey };

    if (Object.keys(body).length === 0) throw new HttpError(400, 'No fields provided');

    await persistSettings(ctx.supabase, ctx.userId, next);
    ctx.logger.info('settings.config.updated', { fields: Object.keys(body) });
    return jsonOk({ success: true });
  } catch (e) {
    return errorResponse(e);
  }
}
