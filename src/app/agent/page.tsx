'use client';

import { useState, useCallback, useRef } from 'react';
import { ChatPanel } from '@/components/agent/chat-panel';
import { ActionConfirmation } from '@/components/agent/action-confirmation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/store/settings';
import { useToastStore } from '@/components/ui/toast';
import { Bot, Settings } from 'lucide-react';
import Link from 'next/link';
import type { AgentMessage, AgentAction } from '@/types';

const INITIAL_MESSAGE: AgentMessage = {
  id: 'welcome',
  role: 'system',
  content: 'I am your infrastructure management agent. I can list, monitor, and act on your HF Spaces, Vercel projects, and GitHub repositories. Destructive actions will ask for confirmation. What would you like to do?',
  timestamp: new Date().toISOString(),
};

interface ServerAction {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  ok: boolean;
  summary: string;
  requiresConfirmation: boolean;
  confirmed: boolean;
}

function actionFromServer(sa: ServerAction): AgentAction {
  return {
    id: sa.id,
    type: sa.tool,
    description: sa.tool,
    status: sa.confirmed ? (sa.ok ? 'done' : 'failed') : (sa.requiresConfirmation ? 'awaiting_confirmation' : 'executing'),
    requiresConfirmation: sa.requiresConfirmation,
    ok: sa.ok,
    summary: sa.summary,
    args: sa.args,
  };
}

async function postAgent(
  body: { message: string; history: Array<{ role: string; content: string }>; approvedTools?: string[] },
  onEvent: (type: string, data: Record<string, unknown>) => void,
  signal: AbortSignal
): Promise<void> {
  const res = await fetch('/api/agent/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Agent request failed');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';
    for (const ev of events) {
      const lines = ev.split('\n');
      let event = '';
      let data = '';
      for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (event && data) {
        try { onEvent(event, JSON.parse(data) as Record<string, unknown>); } catch { /* ignore parse error */ }
      }
    }
  }
}

export default function AgentPage() {
  const { hasLLM } = useSettingsStore();
  const { addToast } = useToastStore();
  const [messages, setMessages] = useState<AgentMessage[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<AgentAction | null>(null);
  const [lastRequest, setLastRequest] = useState<{ message: string; history: Array<{ role: string; content: string }> } | null>(null);
  const [streamingText, setStreamingText] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (
    content: string,
    history: Array<{ role: string; content: string }>,
    approvedTools: string[] = []
  ) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setStreamingText('');

    const partialActions: Record<string, AgentAction> = {};

      try {
        await postAgent({ message: content, history, approvedTools }, (type, data) => {
          if (type === 'text' && typeof data.text === 'string') {
            setStreamingText((prev) => prev + (data.text as string));
          } else if (type === 'action' && data.action) {
            const a = actionFromServer(data.action as unknown as ServerAction);
            partialActions[a.id] = a;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'assistant') {
                const merged = new Map<string, AgentAction>();
                for (const x of last.actions || []) merged.set(x.id, x);
                for (const [k, v] of Object.entries(partialActions)) merged.set(k, v);
                return [...prev.slice(0, -1), { ...last, actions: Array.from(merged.values()) }];
              }
              return prev;
            });
          } else if (type === 'pending' && data.action) {
            const a = actionFromServer(data.action as unknown as ServerAction);
            setPendingAction(a);
          } else if (type === 'error') {
            addToast('error', (data.error as string) || 'Agent error');
          } else if (type === 'done' && data.result) {
            const r = data.result as { actions: ServerAction[]; pendingConfirmation: ServerAction[] };
            const allActions = (r.actions || []).map(actionFromServer);
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'assistant') {
                return [...prev.slice(0, -1), { ...last, actions: allActions }];
              }
              return prev;
            });
            const next = r.pendingConfirmation?.[0];
            if (next) setPendingAction(actionFromServer(next));
          }
        }, controller.signal);
      } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        addToast('error', e instanceof Error ? e.message : 'Agent request failed');
      }
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  }, [addToast]);

  const handleSend = useCallback((content: string) => {
    const userMsg: AgentMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    const assistantMsg: AgentMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: streamingText || 'Thinking...',
      timestamp: new Date().toISOString(),
      actions: [],
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setLastRequest({ message: content, history: [...messages, userMsg].slice(-10).map((m) => ({ role: m.role, content: m.content })) });
    void send(content, [...messages, userMsg].slice(-10).map((m) => ({ role: m.role, content: m.content })));
  }, [messages, send, streamingText]);

  const handleApproveAction = useCallback((id: string) => {
    if (!lastRequest || !pendingAction) return;
    setPendingAction(null);
    setMessages((prev) => prev.map((m) => ({
      ...m,
      actions: m.actions?.map((a) => (a.id === id ? { ...a, status: 'approved' as const } : a)),
    })));
    addToast('info', `Approved ${pendingAction.description}`);
    void send(lastRequest.message, lastRequest.history, [pendingAction.type]);
  }, [lastRequest, pendingAction, send, addToast]);

  const handleRejectAction = useCallback((id: string) => {
    setPendingAction(null);
    setMessages((prev) => prev.map((m) => ({
      ...m,
      actions: m.actions?.map((a) => (a.id === id ? { ...a, status: 'failed' as const, ok: false, summary: 'Cancelled by user' } : a)),
    })));
    addToast('info', 'Action cancelled');
  }, [addToast]);

  if (!hasLLM()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fadeIn">
        <Card className="max-w-md text-center">
          <CardContent className="py-8">
            <Bot size={48} className="text-text-muted mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">AI Agent Not Configured</h2>
            <p className="text-sm text-text-muted mb-4">
              Configure an LLM provider in Settings to use the AI agent.
            </p>
            <Link href="/settings">
              <Button>
                <Settings size={14} />
                Go to Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fadeIn">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot size={18} className="text-accent" />
            AI Agent
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={loading ? 'warning' : 'success'} dot>{loading ? 'Streaming' : 'Online'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            loading={loading}
            streamingText={streamingText}
            className="h-full"
          />
        </CardContent>
      </Card>

      <ActionConfirmation
        action={pendingAction}
        onApprove={handleApproveAction}
        onReject={handleRejectAction}
      />
    </div>
  );
}
