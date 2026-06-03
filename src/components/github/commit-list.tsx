'use client';

import type { GitHubCommit } from '@/types';
import { GitCommit } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CommitListProps {
  commits: GitHubCommit[];
  className?: string;
}

export function CommitList({ commits, className }: CommitListProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {commits.length === 0 && (
        <p className="text-sm text-text-muted text-center py-4">No commits found</p>
      )}
      {commits.map((commit) => (
        <div key={commit.sha} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors">
          <GitCommit size={14} className="text-text-muted mt-1 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-text-primary truncate">{commit.message.split('\n')[0]}</p>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
              <span>{commit.author.name}</span>
              <span>&middot;</span>
              <span>{new Date(commit.author.date).toLocaleString()}</span>
              <span className="font-mono text-[10px] text-text-muted">{commit.sha.slice(0, 7)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
