'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { GitHubRepo } from '@/types';
import { GitBranch, Star, GitFork, Code2 } from 'lucide-react';
import Link from 'next/link';

interface RepoCardProps {
  repo: GitHubRepo;
}

export function RepoCard({ repo }: RepoCardProps) {
  return (
    <Link href={`/github/${repo.fullName}`}>
      <Card hover className="h-full">
        <CardContent>
          <div className="flex items-start gap-2 mb-3">
            <GitBranch size={18} className="text-accent shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h3 className="font-semibold text-text-primary truncate">{repo.name}</h3>
              {repo.description && (
                <p className="text-sm text-text-secondary line-clamp-2 mt-0.5">{repo.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-text-muted">
            {repo.language && (
              <span className="flex items-center gap-1">
                <Code2 size={12} />
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star size={12} />
              {repo.stars}
            </span>
            <span className="flex items-center gap-1">
              <GitFork size={12} />
              {repo.forks}
            </span>
            {repo.openIssues > 0 && (
              <span className="text-rose">{repo.openIssues} issues</span>
            )}
          </div>

          <p className="text-[10px] text-text-muted mt-3">
            Updated {new Date(repo.updatedAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
