'use client';

import { Badge } from '@/components/ui/badge';
import type { VercelDeployment } from '@/types';
import { ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeploymentRowProps {
  deployment: VercelDeployment;
}

export function DeploymentRow({ deployment }: DeploymentRowProps) {
  const stateVariant: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
    READY: 'success',
    BUILDING: 'warning',
    ERROR: 'danger',
    CANCELED: 'neutral',
    QUEUED: 'info',
    INITIALIZING: 'info',
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-bg-tertiary/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Clock size={14} className="text-text-muted shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-text-primary truncate">
            {deployment.meta?.githubCommitMessage || deployment.name}
          </p>
          <p className="text-xs text-text-muted">
            {new Date(deployment.createdAt).toLocaleString()} &middot;{' '}
            {deployment.meta?.githubCommitRef || deployment.builder?.id || 'deploy'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={stateVariant[deployment.state] || 'neutral'}>{deployment.state}</Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => window.open(`https://${deployment.url}`, '_blank')}
        >
          <ExternalLink size={14} />
        </Button>
      </div>
    </div>
  );
}
