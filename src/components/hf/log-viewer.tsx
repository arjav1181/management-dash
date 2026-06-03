'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import type { HFSpaceLog } from '@/types';
import { Loader2 } from 'lucide-react';

interface LogViewerProps {
  logs: HFSpaceLog[];
  loading?: boolean;
  className?: string;
}

export function LogViewer({ logs, loading, className }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const levelColors: Record<string, string> = {
    info: 'text-text-secondary',
    warning: 'text-amber',
    error: 'text-rose',
    debug: 'text-text-muted',
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'bg-black/60 rounded-xl border border-border-primary p-4 font-mono text-xs h-[400px] overflow-y-auto',
        className
      )}
    >
      {loading && (
        <div className="flex items-center gap-2 text-text-muted mb-2">
          <Loader2 size={14} className="animate-spin" />
          Streaming logs...
        </div>
      )}
      {logs.length === 0 && !loading && (
        <p className="text-text-muted italic">No logs available</p>
      )}
      {logs.map((log, i) => (
        <div key={i} className="flex gap-3 py-0.5 hover:bg-white/5">
          <span className="text-text-muted shrink-0 w-20">{log.timestamp}</span>
          <span className={cn('shrink-0 w-14 uppercase text-[10px]', levelColors[log.level] || 'text-text-secondary')}>
            [{log.level}]
          </span>
          <span className="text-text-secondary break-all">{log.message}</span>
        </div>
      ))}
    </div>
  );
}
