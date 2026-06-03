'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

interface TerminalInfo {
  url: string;
  token: string;
  spaceId: string;
  status: string;
}

export default function SpaceTerminalPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;
  const { hasToken } = useSettingsStore();
  const { addToast } = useToastStore();
  const [spaces, setSpaces] = useState<HFSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState(spaceId);
  const [connectionType, setConnectionType] = useState<'ssh' | 'wss'>('wss');
  const [connected, setConnected] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [wssReady, setWssReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const cmdCounterRef = useRef(0);
  const pendingOutputsRef = useRef<Map<string, string[]>>(new Map());

  useEffect(() => {
    if (!hasToken('hf')) return;
    fetch('/api/hf/spaces')
      .then((r) => (r.ok ? r.json() : []))
      .then(setSpaces)
      .catch(() => {});
  }, [hasToken('hf')]);

  useEffect(() => {
    if (!hasToken('hf') || !selectedSpace) {
      setWssReady(false);
      return;
    }
    let cancelled = false;
    fetch(`/api/hf/spaces/${encodeURIComponent(selectedSpace)}/terminal-ws`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TerminalInfo | null) => {
        if (cancelled) return;
        setWssReady(!!data);
      })
      .catch(() => { if (!cancelled) setWssReady(false); });
    return () => { cancelled = true; };
  }, [hasToken, selectedSpace]);

  const handleConnect = useCallback(async () => {
    setOutput([`Connecting to ${selectedSpace}...`]);
    try {
      const res = await fetch(`/api/hf/spaces/${encodeURIComponent(selectedSpace)}/terminal-ws`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to get terminal info' }));
        addToast('error', err.error || 'Failed to get terminal info');
        setOutput((prev) => [...prev, `[error] ${err.error || 'connect failed'}`]);
        return;
      }
      const info: TerminalInfo = await res.json();
      const ws = new WebSocket(info.url);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ token: info.token }));
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '');
          if (msg.type === 'auth_ok') {
            setConnected(true);
            setOutput((prev) => [...prev, `[auth] ${msg.spaceId || info.spaceId}`]);
            return;
          }
          if (msg.type === 'output' && msg.commandId) {
            const buf = pendingOutputsRef.current.get(msg.commandId) || [];
            buf.push(msg.data || '');
            pendingOutputsRef.current.set(msg.commandId, buf);
            setOutput((prev) => [...prev, msg.data || '']);
            return;
          }
          if (msg.type === 'done' && msg.commandId) {
            setOutput((prev) => [...prev, `[exit code: ${msg.code ?? '?'}]`]);
            return;
          }
          if (msg.type === 'error' && msg.commandId) {
            setOutput((prev) => [...prev, `[error] ${msg.error}`]);
            return;
          }
          if (msg.error) {
            setOutput((prev) => [...prev, `[error] ${msg.error}`]);
          }
        } catch {
          setOutput((prev) => [...prev, ev.data as string]);
        }
      };
      ws.onerror = () => {
        setOutput((prev) => [...prev, '[error] WebSocket connection failed']);
      };
      ws.onclose = () => {
        if (connected) {
          setOutput((prev) => [...prev, '[closed]']);
        }
        setConnected(false);
        wsRef.current = null;
      };
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Connect failed');
    }
  }, [selectedSpace, addToast, connected]);

  const handleDisconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

  const handleCommand = useCallback((cmd: string) => {
    setOutput((prev) => [...prev, `$ ${cmd}`]);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const id = `c-${++cmdCounterRef.current}`;
      wsRef.current.send(JSON.stringify({ type: 'command', id, command: cmd }));
    } else {
      setOutput((prev) => [...prev, '[error] not connected']);
    }
  }, []);

  const handlePatchWss = useCallback(async () => {
    try {
      const res = await fetch(`/api/hf/spaces/${encodeURIComponent(selectedSpace)}/patch-wss`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message);
        setWssReady(true);
        return true;
      }
      addToast('error', data.message || 'Patch failed');
      return false;
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Patch failed');
      return false;
    }
  }, [selectedSpace, addToast]);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} aria-label="Back">
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
            wssReady={wssReady}
            onSelectSpace={setSelectedSpace}
            onSelectType={setConnectionType}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onPatchWss={handlePatchWss}
          />

          {connectionType === 'wss' && !wssReady && (
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
