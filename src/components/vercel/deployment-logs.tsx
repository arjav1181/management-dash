'use client';

import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

interface DeploymentLogsProps {
  logs: string[];
  loading?: boolean;
  className?: string;
}

export function DeploymentLogs({ logs, loading, className }: DeploymentLogsProps) {
  return (
    <div
      className={cn(
        'bg-black/60 rounded-xl border border-border-primary p-4 font-mono text-xs h-[300px] overflow-y-auto',
        className
      )}
    >
      {loading && (
        <div className="flex items-center gap-2 text-text-muted mb-2">
          <Loader2 size={14} className="animate-spin" />
          Loading logs...
        </div>
      )}
      {logs.length === 0 && !loading && (
        <p className="text-text-muted italic">No logs available</p>
      )}
      {logs.map((log, i) => (
        <div key={i} className="py-0.5 text-text-secondary break-all hover:bg-white/5">
          {log}
        </div>
      ))}
    </div>
  );
}
