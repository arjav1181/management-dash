'use client';

import type { GitHubIssue } from '@/types';
import { CircleDot, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface IssueListProps {
  issues: GitHubIssue[];
  className?: string;
}

export function IssueList({ issues, className }: IssueListProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {issues.length === 0 && (
        <p className="text-sm text-text-muted text-center py-4">No issues found</p>
      )}
      {issues.map((issue) => (
        <div key={issue.id} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors">
          {issue.state === 'open' ? (
            <CircleDot size={16} className="text-emerald mt-0.5 shrink-0" />
          ) : (
            <CircleCheck size={16} className="text-text-muted mt-0.5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-text-primary truncate">#{issue.number} {issue.title}</p>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5 flex-wrap">
              {issue.labels.map((label) => (
                <span
                  key={label.name}
                  className="inline-block px-1.5 py-0.5 rounded text-[10px]"
                  style={{ backgroundColor: `#${label.color}22`, color: `#${label.color}` }}
                >
                  {label.name}
                </span>
              ))}
              {issue.assignee && <span>assigned to {issue.assignee.login}</span>}
              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
