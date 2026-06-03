import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, jsonOk } from '@/lib/server/auth';
import { loadSettings } from '@/lib/server/settings';

export async function GET(_req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const { settings } = await loadSettings(ctx.supabase, ctx.userId);
    const exportable = {
      version: 1,
      exportedAt: new Date().toISOString(),
      githubScope: settings.githubScope,
      gitlabUrl: settings.gitlabUrl,
      llmConfig: {
        provider: settings.llmConfig.provider,
        model: settings.llmConfig.model,
        baseUrl: settings.llmConfig.baseUrl || null,
      },
      tokenStatus: {
        hf: !!settings.hfToken,
        vercel: !!settings.vercelToken,
        github: !!settings.githubToken,
        docker: !!settings.dockerToken,
        gitlab: !!settings.gitlabToken,
        netlify: !!settings.netlifyToken,
        llm: !!settings.llmConfig.apiKey,
      },
    };
    return NextResponse.json(exportable, {
      headers: {
        'Content-Disposition': `attachment; filename="bridge-settings-${Date.now()}.json"`,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

interface ImportPayload {
  githubScope?: 'read' | 'write' | 'admin';
  gitlabUrl?: string;
  llmConfig?: { provider?: string; model?: string; baseUrl?: string | null };
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = (await req.json().catch(() => null)) as ImportPayload | null;
    if (!body) return NextResponse.json({ error: 'invalid json' }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (body.githubScope) updates.github_scope = body.githubScope;
    if (body.gitlabUrl) updates.gitlab_url = body.gitlabUrl;
    if (body.llmConfig?.provider) updates.llm_provider = body.llmConfig.provider;
    if (body.llmConfig?.model) updates.llm_model = body.llmConfig.model;
    if (body.llmConfig?.baseUrl !== undefined) updates.llm_base_url = body.llmConfig.baseUrl || '';

    if (Object.keys(updates).length === 0) {
      return jsonOk({ ok: true, applied: 0 });
    }
    updates.updated_at = new Date().toISOString();

    const { error } = await ctx.supabase
      .from('user_settings')
      .upsert({ id: ctx.userId, ...updates });
    if (error) throw error;
    return jsonOk({ ok: true, applied: Object.keys(updates).length - 1 });
  } catch (e) {
    return errorResponse(e);
  }
}
