'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { getSpaceLogs } from '@/lib/api/huggingface';
import { LogViewer } from '@/components/hf/log-viewer';
import { Button } from '@/components/ui/button';
import { SkeletonLogViewer } from '@/components/ui/skeleton';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { HFSpaceLog } from '@/types';

export default function SpaceLogsPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;
  const { settings } = useSettingsStore();
  const [logs, setLogs] = useState<HFSpaceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!settings.hfToken) return;
    setLoading(true);
    try {
      const data = await getSpaceLogs(settings.hfToken, spaceId);
      setLogs(data.slice(-200));
    } catch {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [spaceId, settings.hfToken]);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Logs</h2>
          <p className="text-xs text-text-muted">{spaceId}</p>
        </div>
        <Badge variant="info" dot>Auto-refresh 10s</Badge>
        <div className="flex-1" />
        <Button size="sm" variant="secondary" onClick={fetchLogs} loading={loading}>
          <RefreshCw size={14} />
        </Button>
      </div>
      {loading ? <SkeletonLogViewer /> : <LogViewer logs={logs} loading={false} />}
    </div>
  );
}
