'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ActivityItem } from '@/types';
import { Boxes, Triangle, GitBranch, Bot } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const platformIcons = {
  huggingface: <Boxes size={14} />,
  vercel: <Triangle size={14} />,
  github: <GitBranch size={14} />,
  agent: <Bot size={14} />,
};

const platformColors = {
  huggingface: 'text-amber',
  vercel: 'text-info',
  github: 'text-text-primary',
  agent: 'text-accent',
};

interface ActivityFeedProps {
  items: ActivityItem[];
  className?: string;
}

export function ActivityFeed({ items, className }: ActivityFeedProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">No recent activity</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-border-primary last:border-0">
              <div className={cn('mt-0.5', platformColors[item.platform])}>
                {platformIcons[item.platform]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{item.message}</p>
                <p className="text-xs text-text-muted mt-0.5">{item.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
