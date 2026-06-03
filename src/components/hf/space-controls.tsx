'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw, Power, Moon, ExternalLink, Terminal } from 'lucide-react';

interface SpaceControlsProps {
  spaceId: string;
  spaceUrl: string;
  onRestart: () => void;
  onStop: () => void;
  onSleep: () => void;
  onTerminal: () => void;
  loading?: boolean;
}

export function SpaceControls({
  spaceUrl,
  onRestart,
  onStop,
  onSleep,
  onTerminal,
  loading,
}: SpaceControlsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button size="sm" variant="primary" onClick={onRestart} loading={loading}>
        <RefreshCw size={14} />
        Restart
      </Button>
      <Button size="sm" variant="secondary" onClick={onSleep} loading={loading}>
        <Moon size={14} />
        Sleep
      </Button>
      <Button size="sm" variant="danger" onClick={onStop} loading={loading}>
        <Power size={14} />
        Stop
      </Button>
      <Button size="sm" variant="outline" onClick={onTerminal}>
        <Terminal size={14} />
        Terminal
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => window.open(spaceUrl, '_blank')}
      >
        <ExternalLink size={14} />
        Open
      </Button>
    </div>
  );
}
