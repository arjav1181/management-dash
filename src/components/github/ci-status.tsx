'use client';

import type { GitHubActionRun } from '@/types';
import { cn } from '@/lib/utils/cn';
import { CheckCircle, XCircle, Loader2, MinusCircle } from 'lucide-react';

interface CIStatusProps {
  runs: GitHubActionRun[];
  className?: string;
}

export function CIStatus({ runs, className }: CIStatusProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {runs.length === 0 && (
        <p className="text-sm text-text-muted text-center py-4">No workflow runs</p>
      )}
      {runs.map((run) => {
        const icon = run.status === 'completed'
          ? run.conclusion === 'success'
            ? <CheckCircle size={16} className="text-emerald" />
            : <XCircle size={16} className="text-rose" />
          : run.status === 'in_progress'
            ? <Loader2 size={16} className="text-amber animate-spin" />
            : <MinusCircle size={16} className="text-text-muted" />;

        return (
          <div key={run.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors">
            <span className="shrink-0">{icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-primary truncate">{run.name}</p>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>{run.headBranch}</span>
                <span>&middot;</span>
                <span>{run.status} {run.conclusion ? `(${run.conclusion})` : ''}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
