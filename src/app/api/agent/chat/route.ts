import { NextRequest, NextResponse } from 'next/server';

function buildSystemPrompt(settings: Record<string, unknown>): string {
  const scope = (settings.githubScope as string) || 'read';
  return `You are an infrastructure management agent. You have access to the user's:
- Hugging Face Spaces (token: ${settings.hfToken ? 'configured' : 'NOT configured'})
- Vercel projects (token: ${settings.vercelToken ? 'configured' : 'NOT configured'})
- GitHub repositories (token: ${settings.githubToken ? 'configured' : 'NOT configured'}, scope: ${scope})

Available tools:
1. list_hf_spaces - List all HF Spaces with status
2. restart_hf_space(spaceId) - Restart a space
3. sleep_hf_space(spaceId) - Put a space to sleep
4. get_hf_space_logs(spaceId) - Get recent logs
5. list_vercel_projects - List Vercel projects
6. list_vercel_deployments(projectId) - List deployments
7. trigger_vercel_deploy(projectId) - Trigger a deploy
8. list_github_repos - List repos
9. list_github_commits(owner, repo) - Get commits
10. list_github_issues(owner, repo) - Get issues
11. list_github_prs(owner, repo) - Get PRs
12. list_github_actions(owner, repo) - Get CI status

Respond naturally. If an action requires destructive changes, ask for confirmation first.
Keep responses concise. Format with bullet points when listing items.`;
}

const LLM_ENDPOINTS: Record<string, string> = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  cerebras: 'https://api.cerebras.ai/v1/chat/completions',
};

interface RequestBody {
  message: string;
  settings: {
    llmConfig: { provider: string; apiKey: string; model: string; baseUrl?: string };
    hfToken?: string;
    vercelToken?: string;
    githubToken?: string;
    githubScope?: string;
  };
  history?: { role: string; content: string }[];
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { message, settings, history } = body;
    const { llmConfig } = settings;

    if (!llmConfig?.apiKey) {
      return NextResponse.json({ response: 'LLM not configured. Please add an API key in Settings.' }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(settings);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message },
    ];

    let responseText = '';

    if (llmConfig.provider === 'gemini') {
      const model = llmConfig.model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${llmConfig.apiKey}`;
      const geminiMessages = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.content }],
      }));
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: geminiMessages }),
      });
      if (!geminiRes.ok) throw new Error(`Gemini API error: ${geminiRes.status}`);
      const geminiData = await geminiRes.json();
      responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (llmConfig.provider === 'anthropic') {
      const url = LLM_ENDPOINTS.anthropic;
      const anthropicMessages = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'system' ? 'user' : m.role,
        content: m.content,
      }));
      const anthropicRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': llmConfig.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: llmConfig.model || 'claude-sonnet-4-6',
          system: systemPrompt,
          messages: anthropicMessages,
          max_tokens: 1024,
        }),
      });
      if (!anthropicRes.ok) throw new Error(`Anthropic API error: ${anthropicRes.status}`);
      const anthropicData = await anthropicRes.json();
      responseText = anthropicData?.content?.[0]?.text || '';
    } else {
      const customBaseUrl = llmConfig.provider === 'custom' ? llmConfig.baseUrl : null;
      const url = customBaseUrl
        ? `${customBaseUrl.replace(/\/$/, '')}/chat/completions`
        : (LLM_ENDPOINTS[llmConfig.provider] || LLM_ENDPOINTS.groq);

      const llmRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmConfig.apiKey}`,
          ...(llmConfig.provider === 'openrouter' ? { 'HTTP-Referer': 'https://mgmt-dash.vercel.app' } : {}),
        },
        body: JSON.stringify({
          model: llmConfig.model || 'llama-3.1-8b-instant',
          messages,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!llmRes.ok) {
        const errText = await llmRes.text();
        throw new Error(`LLM API error ${llmRes.status}: ${errText.slice(0, 200)}`);
      }

      const llmData = await llmRes.json();
      responseText = llmData?.choices?.[0]?.message?.content || '';
    }

    return NextResponse.json({
      response: responseText,
      actions: [],
      toast: null,
    });
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
