'use client';

import { cn } from '@/lib/utils/cn';

interface StatusPillProps {
  status: 'running' | 'sleeping' | 'building' | 'error' | 'ready' | 'unknown' | string;
  className?: string;
}

const statusColors: Record<string, string> = {
  running: 'bg-emerald',
  ready: 'bg-emerald',
  sleeping: 'bg-info',
  building: 'bg-amber',
  error: 'bg-rose',
  unknown: 'bg-text-muted',
  BUILDING: 'bg-amber',
  READY: 'bg-emerald',
  ERROR: 'bg-rose',
  CANCELED: 'bg-text-muted',
  QUEUED: 'bg-amber',
  INITIALIZING: 'bg-info',
  completed: 'bg-emerald',
  in_progress: 'bg-amber',
  success: 'bg-emerald',
  failure: 'bg-rose',
  cancelled: 'bg-text-muted',
  open: 'bg-emerald',
  closed: 'bg-text-muted',
  merged: 'bg-info',
};

export function StatusPill({ status, className }: StatusPillProps) {
  const color = statusColors[status] || 'bg-text-muted';
  return (
    <span className={cn('flex items-center gap-1.5 text-xs text-text-muted', className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse-dot', color)} />
      {status}
    </span>
  );
}
