'use client';

import { useState, useCallback } from 'react';
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

interface ServerResponse {
  response: string;
  actions: ServerAction[];
  pendingConfirmation: ServerAction[];
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

export default function AgentPage() {
  const { hasLLM } = useSettingsStore();
  const { addToast } = useToastStore();
  const [messages, setMessages] = useState<AgentMessage[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<AgentAction | null>(null);
  const [lastRequest, setLastRequest] = useState<{ message: string; history: Array<{ role: string; content: string }> } | null>(null);

  const send = useCallback(async (
    content: string,
    history: Array<{ role: string; content: string }>,
    approvedTools: string[] = []
  ) => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history, approvedTools }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Agent request failed');
      }
      const data: ServerResponse = await res.json();
      const assistantMsg: AgentMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.response || (data.actions.length ? 'Done.' : 'I have no response.'),
        timestamp: new Date().toISOString(),
        actions: data.actions.map(actionFromServer),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      const next = data.pendingConfirmation?.[0];
      if (next) {
        setPendingAction(actionFromServer(next));
      }
    } catch (e) {
      const assistantMsg: AgentMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${e instanceof Error ? e.message : 'Failed to communicate with agent'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSend = useCallback((content: string) => {
    const userMsg: AgentMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLastRequest({ message: content, history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })) });
    void send(content, messages.slice(-10).map((m) => ({ role: m.role, content: m.content })));
  }, [messages, send]);

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
            <Badge variant="success" dot>Online</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            loading={loading}
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
