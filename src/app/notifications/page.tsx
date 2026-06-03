'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Boxes, Triangle, GitBranch, Bot, Container, X, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Notification, Platform } from '@/types';
import { useNotifications } from '@/hooks/use-notifications';
import { useToastStore } from '@/components/ui/toast';

const platformIcons: Record<Platform, React.ReactNode> = {
  huggingface: <Boxes size={16} />,
  vercel: <Triangle size={16} />,
  github: <GitBranch size={16} />,
  agent: <Bot size={16} />,
  docker: <Container size={16} />,
  gitlab: <GitBranch size={16} />,
  netlify: <Triangle size={16} />,
};

const platformColors: Record<Platform, string> = {
  huggingface: 'text-amber',
  vercel: 'text-info',
  github: 'text-text-primary',
  docker: 'text-info',
  gitlab: 'text-amber',
  netlify: 'text-emerald',
  agent: 'text-accent',
};

const platformLink: Record<Platform, string> = {
  huggingface: '/huggingface',
  vercel: '/vercel',
  github: '/github',
  agent: '/agent',
  docker: '/docker',
  gitlab: '/gitlab',
  netlify: '/netlify',
};

export default function NotificationsPage() {
  const { notifications, unread, markAllRead, dismiss, loading, refresh } = useNotifications();
  const { addToast } = useToastStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const visible = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Bell size={20} className="text-accent" />
            Notifications
          </h2>
          <p className="text-sm text-text-muted">{unread} unread</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-tertiary border border-border-primary text-xs">
            <button
              onClick={() => setFilter('all')}
              className={cn('px-3 py-1 rounded-md transition-colors', filter === 'all' ? 'bg-bg-elevated text-text-primary' : 'text-text-muted hover:text-text-secondary')}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={cn('px-3 py-1 rounded-md transition-colors', filter === 'unread' ? 'bg-bg-elevated text-text-primary' : 'text-text-muted hover:text-text-secondary')}
            >
              Unread
            </button>
          </div>
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={async () => { await markAllRead(); addToast('success', 'All marked as read'); }}>
              <CheckCheck size={16} /> Mark all read
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => { void refresh(); }}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {loading && visible.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-muted text-sm">Loading notifications...</p>
          </div>
        )}
        {!loading && visible.length === 0 && (
          <div className="text-center py-16">
            <Inbox size={48} className="text-text-muted mx-auto mb-4 opacity-30" />
            <p className="text-text-muted">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Activity from your platforms will appear here in real time.
            </p>
          </div>
        )}
        {visible.map((n) => {
          const Wrapper: typeof Link | 'div' = n.link ? Link : 'div';
          const wrapperProps = n.link ? { href: n.link } : {};
          return (
            <Wrapper
              key={n.id}
              {...(wrapperProps as { href: string })}
            >
              <Card hover={!!n.link} className={cn('p-4', !n.read && 'border-accent/30 bg-accent/[0.02]')}>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className={cn('mt-0.5', platformColors[n.platform])}>{platformIcons[n.platform]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-text-primary">{n.title}</p>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-accent shrink-0" aria-label="Unread" />}
                        <Badge variant="neutral" className="text-[10px]">{n.platform}</Badge>
                      </div>
                      <p className="text-sm text-text-muted mt-0.5">{n.message}</p>
                      <p className="text-xs text-text-muted mt-1">{n.createdAt}</p>
                    </div>
                    <button
                      onClick={async (e) => { e.preventDefault(); e.stopPropagation(); await dismiss(n.id); }}
                      aria-label="Dismiss notification"
                      className="text-text-muted hover:text-text-primary shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
