'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plug, PlugZap, RefreshCw } from 'lucide-react';
import type { HFSpace } from '@/types';

interface ConnectionManagerProps {
  spaces: HFSpace[];
  selectedSpace: string;
  connectionType: 'ssh' | 'wss';
  connected: boolean;
  onSelectSpace: (id: string) => void;
  onSelectType: (type: 'ssh' | 'wss') => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onPatchWss?: () => void;
}

export function ConnectionManager({
  spaces,
  selectedSpace,
  connectionType,
  connected,
  onSelectSpace,
  onSelectType,
  onConnect,
  onDisconnect,
  onPatchWss,
}: ConnectionManagerProps) {
  const selectedSpaceData = spaces.find((s) => s.id === selectedSpace);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select
            label="Space"
            options={spaces.map((s) => ({ value: s.id, label: s.name }))}
            value={selectedSpace}
            onChange={(e) => onSelectSpace(e.target.value)}
            placeholder="Select a space..."
          />

          <Select
            label="Connection Type"
            options={[
              { value: 'ssh', label: 'SSH (native)' },
              { value: 'wss', label: 'WSS Agent (auto-patch)' },
            ]}
            value={connectionType}
            onChange={(e) => onSelectType(e.target.value as 'ssh' | 'wss')}
          />

          {connectionType === 'wss' && !selectedSpaceData?.wssEnabled && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber/5 border border-amber/20">
              <div>
                <p className="text-sm text-text-primary">WSS agent not detected</p>
                <p className="text-xs text-text-muted">Auto-patch will inject the agent</p>
              </div>
              {onPatchWss && (
                <Button size="sm" variant="outline" onClick={onPatchWss}>
                  <RefreshCw size={14} />
                  Patch
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {connected ? (
              <Button variant="danger" size="sm" onClick={onDisconnect}>
                <PlugZap size={14} />
                Disconnect
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={onConnect} disabled={!selectedSpace}>
                <Plug size={14} />
                Connect
              </Button>
            )}
            {connected && <Badge variant="success" dot>Connected</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
