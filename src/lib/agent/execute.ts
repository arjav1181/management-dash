import type { AgentTool } from './tools';
import { getToolByName, toolRequiresToken } from './tools';
import { chatWithLLM, type LLMMessage } from './llm';
import type { FlatSettings } from '@/lib/server/settings';
import { log } from '@/lib/server/log';
import { logActivity, type ActivityPlatform } from '@/lib/server/activity';
import type { SupabaseLike } from '@/lib/server/settings';

const PLATFORM_MAP: Record<AgentTool['platform'], ActivityPlatform> = {
  hf: 'huggingface',
  vercel: 'vercel',
  github: 'github',
  docker: 'docker',
  gitlab: 'gitlab',
  netlify: 'netlify',
  agent: 'agent',
};

export interface RunAgentArgs {
  userId: string;
  message: string;
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  settings: FlatSettings;
  supabase: SupabaseLike;
  signal?: AbortSignal;
  approvedTools?: string[];
}

export interface AgentActionResult {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  ok: boolean;
  summary: string;
  data?: unknown;
  requiresConfirmation: boolean;
  confirmed: boolean;
}

export interface AgentRunResult {
  text: string;
  actions: AgentActionResult[];
  pendingConfirmation: AgentActionResult[];
}

const MAX_TURNS = 6;

export async function runAgent({
  userId,
  message,
  history,
  settings,
  supabase,
  signal,
  approvedTools = [],
}: RunAgentArgs): Promise<AgentRunResult> {
  const llm = settings.llmConfig;
  const { AGENT_TOOLS } = await import('./tools');

  const tools = AGENT_TOOLS.filter((t) => {
    if (t.platform === 'hf') return !!settings.hfToken;
    if (t.platform === 'vercel') return !!settings.vercelToken;
    if (t.platform === 'github') return !!settings.githubToken;
    if (t.platform === 'docker') return !!settings.dockerToken;
    if (t.platform === 'gitlab') return !!settings.gitlabToken;
    if (t.platform === 'netlify') return !!settings.netlifyToken;
    return true;
  });

  const messages: LLMMessage[] = [
    ...history.filter((h) => h.role !== 'system').map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user', content: message },
  ];

  const allActions: AgentActionResult[] = [];
  const pending: AgentActionResult[] = [];
  let finalText = '';

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await chatWithLLM({ llm, messages, tools, signal });
    finalText = response.text;

    if (!response.toolCalls.length) break;

    const assistantMsg: LLMMessage = {
      role: 'assistant',
      content: response.text,
      tool_calls: response.toolCalls.map((tc) => ({ id: tc.id, name: tc.name, arguments: JSON.stringify(tc.arguments) })),
    };
    messages.push(assistantMsg);

    let allConfirmed = true;
    for (const tc of response.toolCalls) {
      const tool = getToolByName(tc.name);
      const action: AgentActionResult = {
        id: tc.id,
        tool: tc.name,
        args: tc.arguments,
        ok: false,
        summary: '',
        requiresConfirmation: tool?.requiresConfirmation ?? false,
        confirmed: false,
      };

      if (!tool) {
        action.summary = `Unknown tool: ${tc.name}`;
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ error: 'Unknown tool' }) });
        allActions.push(action);
        continue;
      }

      const missing = toolRequiresToken(tool, settings);
      if (missing) {
        action.summary = `${missing} token not configured`;
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ error: action.summary }) });
        allActions.push(action);
        continue;
      }

      if (tool.requiresConfirmation && !approvedTools.includes(tool.name)) {
        pending.push(action);
        allConfirmed = false;
        action.summary = `Awaiting user confirmation for ${tool.name}`;
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ awaiting_confirmation: true }) });
        allActions.push(action);
        continue;
      }

      action.confirmed = true;
      try {
        const result = await tool.execute(tc.arguments, {
          settings,
          userId,
          confirmDestructive: async () => true,
          log: async () => {},
        });
        action.ok = result.ok;
        action.summary = result.summary;
        action.data = result.data;
        await logActivity(supabase, userId, PLATFORM_MAP[tool.platform], `agent.${tool.name}`, result.summary);
      } catch (e) {
        action.summary = `Error: ${e instanceof Error ? e.message : 'unknown'}`;
        log.error('agent_tool_failed', { tool: tool.name, error: action.summary });
      }
      allActions.push(action);
      messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ ok: action.ok, summary: action.summary, data: action.data }) });
    }

    if (allConfirmed && pending.length === 0) {
      continue;
    }
    if (pending.length > 0) break;
  }

  return { text: finalText, actions: allActions, pendingConfirmation: pending };
}
