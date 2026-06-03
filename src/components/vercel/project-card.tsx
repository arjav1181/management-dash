'use client';

import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import type { VercelProject } from '@/types';
import { Triangle, ExternalLink, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ProjectCardProps {
  project: VercelProject;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const latestDeploy = project.latestDeployments?.[0];
  return (
    <Link href={`/vercel/${project.id}`}>
      <Card hover className="h-full">
        <CardContent>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Triangle size={18} className="text-info shrink-0" />
              <h3 className="font-semibold text-text-primary truncate">{project.name}</h3>
            </div>
            {latestDeploy && <StatusBadge status={latestDeploy.state} />}
          </div>

          <div className="space-y-2 text-sm text-text-secondary">
            {project.gitRepository && (
              <div className="flex items-center gap-2">
                <GitBranch size={14} className="text-text-muted" />
                <span>{project.gitRepository.owner}/{project.gitRepository.repo}</span>
              </div>
            )}
            {project.framework && (
              <p className="text-xs text-text-muted">Framework: {project.framework}</p>
            )}
            {latestDeploy && (
              <p className="text-xs text-text-muted">
                Last deploy: {new Date(latestDeploy.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {latestDeploy && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-primary">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(`https://${latestDeploy.url}`, '_blank');
                }}
              >
                <ExternalLink size={14} />
                Visit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
