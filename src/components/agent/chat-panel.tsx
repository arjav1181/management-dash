'use client';

import { useState, useRef, useEffect } from 'react';
import type { AgentMessage } from '@/types';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, Loader2, Terminal, AlertTriangle } from 'lucide-react';

interface ChatPanelProps {
  messages: AgentMessage[];
  onSend: (message: string) => void;
  loading: boolean;
  className?: string;
}

export function ChatPanel({ messages, onSend, loading, className }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const handleSend = () => {
    if (input.trim() && !loading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const suggestions = [
    'List all my HF Spaces',
    'Show Vercel deployments',
    'Restart the last failed space',
    'What GitHub issues are open?',
  ];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot size={40} className="text-accent/40 mx-auto mb-3" />
            <p className="text-text-secondary text-sm mb-4">Ask me anything about your infrastructure</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { onSend(s); }}
                  className="px-3 py-1.5 text-xs bg-bg-tertiary text-text-secondary rounded-lg hover:bg-bg-elevated hover:text-text-primary transition-colors border border-border-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 max-w-[85%]',
              msg.role === 'user' ? 'ml-auto' : 'mr-auto'
            )}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-accent" />
              </div>
            )}
            <div>
              <div
                className={cn(
                  'rounded-xl px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary text-text-primary border border-border-primary'
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {msg.actions.map((action) => (
                      <div key={action.id} className="flex items-center gap-2 text-xs text-text-muted">
                        {action.status === 'executing' ? (
                          <Loader2 size={12} className="animate-spin text-amber" />
                        ) : action.status === 'done' ? (
                          <Terminal size={12} className="text-emerald" />
                        ) : action.status === 'failed' ? (
                          <AlertTriangle size={12} className="text-rose" />
                        ) : null}
                        <span>{action.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-text-muted mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Bot size={16} className="text-accent" />
            </div>
            <div className="bg-bg-tertiary rounded-xl px-4 py-3 border border-border-primary">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border-primary p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask the agent to do something..."
            className="flex-1 rounded-xl border border-border-primary bg-bg-tertiary px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={!input.trim() || loading}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
