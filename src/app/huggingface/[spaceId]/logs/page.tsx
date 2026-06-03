'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { LogViewer } from '@/components/hf/log-viewer';
import { Button } from '@/components/ui/button';
import { useToastStore } from '@/components/ui/toast';
import { RefreshCw } from 'lucide-react';
import type { HFSpaceLog } from '@/types';

export default function SpaceLogsPage() {
  const params = useParams();
  const spaceId = params.spaceId as string;
  const { hasToken } = useSettingsStore();
  const { addToast } = useToastStore();
  const [logs, setLogs] = useState<HFSpaceLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    if (!hasToken('hf')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hf/spaces/${encodeURIComponent(spaceId)}/logs`);
      if (!res.ok) {
        addToast('error', 'Failed to fetch logs');
        setLogs([]);
        return;
      }
      const data = await res.json();
      setLogs(data);
    } catch {
      addToast('error', 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [spaceId, hasToken('hf')]);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Logs: {spaceId}</h2>
        </div>
        <Button size="sm" variant="secondary" onClick={fetchLogs} loading={loading}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>
      <LogViewer logs={logs} />
    </div>
  );
}
