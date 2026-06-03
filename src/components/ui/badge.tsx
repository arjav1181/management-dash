'use client';

import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
  dot?: boolean;
}

const variantClasses = {
  default: 'bg-accent/15 text-accent border-accent/20',
  success: 'bg-emerald/15 text-emerald border-emerald/20',
  warning: 'bg-amber/15 text-amber border-amber/20',
  danger: 'bg-rose/15 text-rose border-rose/20',
  info: 'bg-info/15 text-info border-info/20',
  neutral: 'bg-bg-tertiary text-text-secondary border-border-primary',
};

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border',
        variantClasses[variant],
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'running' || status === 'READY' || status === 'success' || status === 'completed'
      ? 'success'
      : status === 'building' || status === 'BUILDING' || status === 'in_progress'
        ? 'warning'
        : status === 'error' || status === 'ERROR' || status === 'failure'
          ? 'danger'
          : status === 'sleeping'
            ? 'info'
            : 'neutral';

  return <Badge variant={variant} dot>{status}</Badge>;
}
