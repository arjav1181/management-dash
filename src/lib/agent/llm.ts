import type { LLMConfig } from '@/types';
import type { AgentTool } from './tools';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{ id: string; name: string; arguments: string }>;
}

export interface LLMResponse {
  text: string;
  toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
}

interface ChatArgs {
  llm: LLMConfig;
  messages: LLMMessage[];
  tools: AgentTool[];
  signal?: AbortSignal;
}

const OPENAI_COMPAT_ENDPOINTS: Record<string, string | null> = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  cerebras: 'https://api.cerebras.ai/v1/chat/completions',
  custom: null,
};

function buildSystemPrompt(tools: AgentTool[]): string {
  const toolList = tools
    .map((t) => `- ${t.name}(${Object.keys(t.parameters.properties).join(', ') || ''}): ${t.description}${t.requiresConfirmation ? ' [destructive, needs confirmation]' : ''}`)
    .join('\n');
  return `You are Bridge, an infrastructure management AI agent. You can help users manage HF Spaces, Vercel projects, and GitHub repositories by calling the available tools.

Available tools:
${toolList}

When you need data, call the appropriate tool. Keep your final reply concise (1-6 short lines or bullets). When the user asks for a destructive action (restart, sleep, deploy, merge, create), call the tool. The system will request user confirmation automatically for destructive tools.`;
}

function toOpenAITools(tools: AgentTool[]) {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: {
        type: 'object',
        properties: t.parameters.properties,
        required: t.parameters.required,
      },
    },
  }));
}

function toAnthropicTools(tools: AgentTool[]) {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: 'object',
      properties: t.parameters.properties,
      required: t.parameters.required,
    },
  }));
}

function toGeminiTools(tools: AgentTool[]) {
  return [{
    function_declarations: tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: {
        type: 'object',
        properties: t.parameters.properties,
        required: t.parameters.required,
      },
    })),
  }];
}

export async function chatWithLLM({ llm, messages, tools, signal }: ChatArgs): Promise<LLMResponse> {
  const systemPrompt = buildSystemPrompt(tools);

  if (llm.provider === 'anthropic') {
    return chatAnthropic(llm, systemPrompt, messages, tools, signal);
  }
  if (llm.provider === 'gemini') {
    return chatGemini(llm, systemPrompt, messages, tools, signal);
  }
  return chatOpenAICompat(llm, systemPrompt, messages, tools, signal);
}

async function chatOpenAICompat(
  llm: LLMConfig,
  systemPrompt: string,
  messages: LLMMessage[],
  tools: AgentTool[],
  signal?: AbortSignal
): Promise<LLMResponse> {
  const baseUrl = llm.provider === 'custom' ? llm.baseUrl : OPENAI_COMPAT_ENDPOINTS[llm.provider];
  if (!baseUrl) throw new Error(`No endpoint for provider ${llm.provider}`);
  const url = llm.provider === 'custom' ? `${baseUrl.replace(/\/$/, '')}/chat/completions` : baseUrl;

  const oaMessages = messages.map((m) => {
    if (m.role === 'tool') {
      return { role: 'tool' as const, content: m.content, tool_call_id: m.tool_call_id || '' };
    }
    if (m.role === 'assistant' && m.tool_calls?.length) {
      return {
        role: 'assistant' as const,
        content: m.content || null,
        tool_calls: m.tool_calls.map((tc) => ({ id: tc.id, type: 'function' as const, function: { name: tc.name, arguments: tc.arguments } })),
      };
    }
    return { role: m.role, content: m.content };
  });

  const body: Record<string, unknown> = {
    model: llm.model,
    messages: [{ role: 'system', content: systemPrompt }, ...oaMessages],
    max_tokens: 1024,
    temperature: 0.5,
  };
  if (tools.length > 0) body.tools = toOpenAITools(tools);
  body.tool_choice = tools.length > 0 ? 'auto' : undefined;

  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${llm.apiKey}`,
      ...(llm.provider === 'openrouter' ? { 'HTTP-Referer': 'https://mgmt-dash.vercel.app', 'X-Title': 'Bridge' } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${llm.provider} ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const choice = data.choices?.[0];
  const text = choice?.message?.content || '';
  const toolCalls = (choice?.message?.tool_calls || []).map((tc: { id: string; function: { name: string; arguments: string } }) => {
    let args: Record<string, unknown> = {};
    try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }
    return { id: tc.id, name: tc.function.name, arguments: args };
  });
  if (!toolCalls.length && text) {
    return { text, toolCalls: extractFallbackToolCalls(text, tools) };
  }
  return { text, toolCalls };
}

async function chatAnthropic(
  llm: LLMConfig,
  systemPrompt: string,
  messages: LLMMessage[],
  tools: AgentTool[],
  signal?: AbortSignal
): Promise<LLMResponse> {
  const url = 'https://api.anthropic.com/v1/messages';
  const nonSystem = messages.filter((m) => m.role !== 'system');
  const anthropicMessages: Array<{ role: 'user' | 'assistant'; content: Array<Record<string, unknown>> }> = [];
  for (const m of nonSystem) {
    if (m.role === 'tool') {
      anthropicMessages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: m.tool_call_id, content: m.content }],
      });
    } else if (m.role === 'assistant' && m.tool_calls?.length) {
      anthropicMessages.push({
        role: 'assistant',
        content: m.tool_calls.map((tc) => ({ type: 'tool_use', id: tc.id, name: tc.name, input: parseJsonSafe(tc.arguments) })),
      });
    } else {
      anthropicMessages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: [{ type: 'text', text: m.content }] });
    }
  }
  const body: Record<string, unknown> = {
    model: llm.model,
    system: systemPrompt,
    messages: anthropicMessages,
    max_tokens: 1024,
  };
  if (tools.length > 0) body.tools = toAnthropicTools(tools);

  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': llm.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Anthropic ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const blocks = data.content || [];
  let text = '';
  const toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = [];
  for (const b of blocks) {
    if (b.type === 'text') text += b.text;
    if (b.type === 'tool_use') {
      toolCalls.push({ id: b.id, name: b.name, arguments: b.input || {} });
    }
  }
  if (!toolCalls.length && text) {
    return { text, toolCalls: extractFallbackToolCalls(text, tools) };
  }
  return { text, toolCalls };
}

async function chatGemini(
  llm: LLMConfig,
  systemPrompt: string,
  messages: LLMMessage[],
  tools: AgentTool[],
  signal?: AbortSignal
): Promise<LLMResponse> {
  const model = llm.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${llm.apiKey}`;

  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => {
      if (m.role === 'tool') {
        return { role: 'function', parts: [{ functionResponse: { name: m.tool_call_id || '', response: { result: m.content } } }] };
      }
      if (m.role === 'assistant' && m.tool_calls?.length) {
        return {
          role: 'model',
          parts: m.tool_calls.map((tc) => ({
            functionCall: { name: tc.name, args: parseJsonSafe(tc.arguments) },
          })),
        };
      }
      return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] };
    });

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.5 },
  };
  if (tools.length > 0) body.tools = toGeminiTools(tools);

  const res = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const candidate = data.candidates?.[0];
  let text = '';
  const toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = [];
  for (const part of candidate?.content?.parts || []) {
    if (part.text) text += part.text;
    if (part.functionCall) {
      toolCalls.push({
        id: `gemini-${Date.now()}-${toolCalls.length}`,
        name: part.functionCall.name,
        arguments: part.functionCall.args || {},
      });
    }
  }
  if (!toolCalls.length && text) {
    return { text, toolCalls: extractFallbackToolCalls(text, tools) };
  }
  return { text, toolCalls };
}

function parseJsonSafe(s: string): Record<string, unknown> {
  try { return JSON.parse(s); } catch { return {}; }
}

const JSON_FENCE_RE = /```(?:json)?\s*([\s\S]*?)```/g;

function extractFallbackToolCalls(text: string, tools: AgentTool[]): Array<{ id: string; name: string; arguments: Record<string, unknown> }> {
  const out: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = [];
  const names = new Set(tools.map((t) => t.name));
  let m: RegExpExecArray | null;
  JSON_FENCE_RE.lastIndex = 0;
  while ((m = JSON_FENCE_RE.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed?.name && names.has(parsed.name)) {
        out.push({ id: `fb-${Date.now()}-${out.length}`, name: parsed.name, arguments: parsed.arguments || {} });
      }
    } catch { /* not JSON */ }
  }
  if (out.length === 0) {
    const bare = text.match(/\{[\s\S]*?"name"\s*:\s*"(?:[a-z_]+)"[\s\S]*?\}/);
    if (bare) {
      try {
        const parsed = JSON.parse(bare[0]);
        if (parsed?.name && names.has(parsed.name)) {
          out.push({ id: `fb-${Date.now()}`, name: parsed.name, arguments: parsed.arguments || {} });
        }
      } catch { /* ignore */ }
    }
  }
  return out;
}
