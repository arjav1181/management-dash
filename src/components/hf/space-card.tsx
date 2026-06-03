'use client';

import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { HFSpace } from '@/types';
import { ExternalLink, Container, Terminal, Server } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SpaceCardProps {
  space: HFSpace;
  onRestart?: (id: string) => void;
  onTerminal?: (id: string) => void;
}

export function SpaceCard({ space, onRestart, onTerminal }: SpaceCardProps) {
  return (
    <Link href={`/huggingface/${space.id}`}>
      <Card hover className="h-full">
        <CardContent>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Container size={18} className="text-accent shrink-0" />
              <h3 className="font-semibold text-text-primary truncate">{space.name}</h3>
            </div>
            <StatusBadge status={space.status} />
          </div>

          <div className="space-y-2 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <Server size={14} className="text-text-muted" />
              <span>{space.runtime.cpu} / {space.runtime.memory}</span>
            </div>
            {space.runtime.gpu && (
              <div className="flex items-center gap-2">
                <Server size={14} className="text-text-muted" />
                <span>{space.runtime.gpu}</span>
              </div>
            )}
            <p className="text-xs text-text-muted">
              {space.sdk} &middot; {space.private ? 'Private' : 'Public'}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-primary">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.preventDefault();
                window.open(space.url, '_blank');
              }}
            >
              <ExternalLink size={14} />
              Open
            </Button>
            {onTerminal && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  onTerminal(space.id);
                }}
              >
                <Terminal size={14} />
                Terminal
              </Button>
            )}
            {space.wssEnabled && (
              <span className="text-[10px] text-emerald ml-auto">WSS active</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
