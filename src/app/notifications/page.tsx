'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Boxes, Triangle, GitBranch, Bot, Container, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Notification, Platform } from '@/types';
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

// Demo notifications - in production these would come from Supabase
const DEMO_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'deploy_success', platform: 'vercel', title: 'Deploy successful', message: 'production-api deployed to vercel', read: false, createdAt: '2 min ago' },
  { id: '2', type: 'build_complete', platform: 'huggingface', title: 'Space built', message: 'my-llm-space finished building', read: false, createdAt: '15 min ago', link: '/huggingface/my-llm-space' },
  { id: '3', type: 'pr_merged', platform: 'github', title: 'PR merged', message: 'feat/add-auth merged into main', read: true, createdAt: '1 hour ago' },
  { id: '4', type: 'space_error', platform: 'huggingface', title: 'Space error', message: 'demo-space crashed (OOM)', read: false, createdAt: '2 hours ago' },
  { id: '5', type: 'deploy_fail', platform: 'vercel', title: 'Deploy failed', message: 'frontend-app build failed on main', read: true, createdAt: '3 hours ago' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const { addToast } = useToastStore();

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('success', 'All marked as read');
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unread = notifications.filter((n) => !n.read).length;

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
        {unread > 0 && (
          <Button size="sm" variant="ghost" onClick={markAllRead}>
            <CheckCheck size={16} /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <Card key={n.id} className={cn('p-4', !n.read && 'border-accent/30 bg-accent/[0.02]')}>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5', platformColors[n.platform])}>{platformIcons[n.platform]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">{n.title}</p>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                  </div>
                  <p className="text-sm text-text-muted mt-0.5">{n.message}</p>
                  <p className="text-xs text-text-muted mt-1">{n.createdAt}</p>
                </div>
                <button onClick={() => dismiss(n.id)} className="text-text-muted hover:text-text-primary shrink-0">
                  <X size={16} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-16">
            <Bell size={48} className="text-text-muted mx-auto mb-4 opacity-20" />
            <p className="text-text-muted">All caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
