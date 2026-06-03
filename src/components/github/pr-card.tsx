'use client';

import type { GitHubPR } from '@/types';
import { GitPullRequest, GitMerge, GitPullRequestClosed } from 'lucide-react';

interface PRCardProps {
  pr: GitHubPR;
}

export function PRCard({ pr }: PRCardProps) {
  const icon = pr.state === 'merged' ? <GitMerge size={16} className="text-info" /> :
    pr.state === 'closed' ? <GitPullRequestClosed size={16} className="text-text-muted" /> :
      <GitPullRequest size={16} className="text-emerald" />;

  return (
    <div className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm text-text-primary truncate">#{pr.number} {pr.title}</p>
          {pr.draft && <span className="text-[10px] text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">Draft</span>}
        </div>
        <p className="text-xs text-text-muted mt-0.5">
          {pr.head.ref} &rarr; {pr.base.ref} &middot; {new Date(pr.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
