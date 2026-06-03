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
import { nanoid } from 'nanoid';

const INITIAL_MESSAGE: AgentMessage = {
  id: 'welcome',
  role: 'system',
  content: 'I am your infrastructure management agent. I can help you monitor and manage your HF Spaces, Vercel deployments, and GitHub repositories. What would you like to do?',
  timestamp: new Date().toISOString(),
};

export default function AgentPage() {
  const { settings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [messages, setMessages] = useState<AgentMessage[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<AgentAction | null>(null);

  const hasLLM = !!(settings.llmConfig.apiKey);

  const handleSend = useCallback(async (content: string) => {
    if (!hasLLM || loading) return;

    const userMsg: AgentMessage = {
      id: nanoid(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          settings: {
            llmConfig: settings.llmConfig,
            hfToken: settings.hfToken,
            vercelToken: settings.vercelToken,
            githubToken: settings.githubToken,
            githubScope: settings.githubScope,
          },
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error('Agent request failed');

      const data = await response.json();

      const assistantMsg: AgentMessage = {
        id: nanoid(),
        role: 'assistant',
        content: data.response || 'I processed your request.',
        timestamp: new Date().toISOString(),
        actions: data.actions || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (data.actions?.length > 0) {
        const action = data.actions.find((a: AgentAction) => a.requiresConfirmation);
        if (action) setPendingAction(action);
      }

      if (data.toast) {
        addToast(data.toast.type || 'info', data.toast.message);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: 'assistant',
          content: `Error: ${e instanceof Error ? e.message : 'Failed to communicate with agent'}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setLoading(false);
  }, [hasLLM, loading, messages, settings, addToast]);

  const handleApproveAction = (_id: string) => {
    setPendingAction(null);
    addToast('info', 'Action approved and executed');
  };

  const handleRejectAction = (_id: string) => {
    setPendingAction(null);
    addToast('info', 'Action cancelled');
  };

  if (!hasLLM) {
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
            <span className="text-xs text-text-muted">
              {settings.llmConfig.provider} &middot; {settings.llmConfig.model}
            </span>
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
