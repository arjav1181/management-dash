'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { ConnectionManager } from '@/components/terminal/connection-manager';
import { TerminalEmulator } from '@/components/terminal/terminal-emulator';
import { WSSPatchWizard } from '@/components/terminal/wss-patch-wizard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToastStore } from '@/components/ui/toast';
import { ArrowLeft } from 'lucide-react';
import type { HFSpace } from '@/types';
import { listSpaces } from '@/lib/api/huggingface';
import { patchSpaceWithWssAgent } from '@/lib/wss-agent/patcher';
import { useEffect } from 'react';

export default function SpaceTerminalPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;
  const { settings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [spaces, setSpaces] = useState<HFSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState(spaceId);
  const [connectionType, setConnectionType] = useState<'ssh' | 'wss'>('wss');
  const [connected, setConnected] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  useEffect(() => {
    if (settings.hfToken) {
      listSpaces(settings.hfToken).then(setSpaces).catch(() => {});
    }
  }, [settings.hfToken]);

  const handleConnect = () => {
    setConnected(true);
    setOutput(['Connected to ' + selectedSpace]);
    addToast('success', `Connected to ${selectedSpace}`);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setOutput([]);
  };

  const handleCommand = (cmd: string) => {
    setOutput((prev) => [...prev, `$ ${cmd}`, `[executing on ${selectedSpace}...]`]);
  };

  const handlePatchWss = async () => {
    const result = await patchSpaceWithWssAgent(settings.hfToken, selectedSpace);
    if (result.success) {
      addToast('success', result.message);
      return true;
    } else {
      addToast('error', result.message);
      return false;
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Terminal</h2>
          <p className="text-xs text-text-muted">{spaceId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <div className="space-y-4">
          <ConnectionManager
            spaces={spaces}
            selectedSpace={selectedSpace}
            connectionType={connectionType}
            connected={connected}
            onSelectSpace={setSelectedSpace}
            onSelectType={setConnectionType}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onPatchWss={handlePatchWss}
          />

          {connectionType === 'wss' && (
            <WSSPatchWizard
              spaceName={selectedSpace}
              onPatch={handlePatchWss}
            />
          )}
        </div>

        <Card className="flex flex-col">
          <CardContent className="flex-1 p-0">
            <TerminalEmulator
              onCommand={handleCommand}
              output={output}
              connected={connected}
              className="h-full"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
