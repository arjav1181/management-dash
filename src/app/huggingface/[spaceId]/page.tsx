'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SpaceControls } from '@/components/hf/space-controls';
import { StatusBadge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { useToastStore } from '@/components/ui/toast';
import { ArrowLeft, Server, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { HFFile } from '@/types';

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = params.spaceId as string;
  const { hasToken } = useSettingsStore();
  const { addToast } = useToastStore();
  const [status, setStatus] = useState<string>('');
  const [files, setFiles] = useState<HFFile[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    if (!hasToken('hf')) return;
    try {
      const [statusRes, filesRes] = await Promise.all([
        fetch(`/api/hf/spaces/${encodeURIComponent(spaceId)}/status`).catch(() => null),
        fetch(`/api/hf/spaces/${encodeURIComponent(spaceId)}/files`).catch(() => null),
      ]);
      if (statusRes?.ok) {
        const s = await statusRes.json();
        setStatus(s.status);
      }
      if (filesRes?.ok) {
        const f = await filesRes.json();
        setFiles((f || []).slice(0, 20));
      }
    } catch {
      addToast('error', 'Failed to load space data');
    }
  };

  useEffect(() => {
    fetchData();
  }, [spaceId, hasToken('hf')]);

  const handleRestart = async () => {
    setActionLoading(true);
    const res = await fetch(`/api/hf/spaces/${encodeURIComponent(spaceId)}/restart`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      addToast('success', 'Space restarted');
      setTimeout(fetchData, 3000);
    } else addToast('error', 'Failed to restart');
    setActionLoading(false);
  };

  const handleStop = async () => {
    setActionLoading(true);
    const res = await fetch(`/api/hf/spaces/${encodeURIComponent(spaceId)}/stop`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      addToast('success', 'Space stopped');
      fetchData();
    } else addToast('error', 'Failed to stop');
    setActionLoading(false);
  };

  const handleSleep = async () => {
    setActionLoading(true);
    const res = await fetch(`/api/hf/spaces/${encodeURIComponent(spaceId)}/sleep`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      addToast('success', 'Space sleeping');
      fetchData();
    } else addToast('error', 'Failed to sleep');
    setActionLoading(false);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'files', label: 'Files' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/huggingface')} aria-label="Back to spaces">
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{spaceId.split('/')[1] || spaceId}</h2>
          <p className="text-xs text-text-muted">{spaceId}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <SpaceControls
        spaceId={spaceId}
        spaceUrl={`https://${spaceId.split('/')[1] || spaceId}.hf.space`}
        onRestart={handleRestart}
        onStop={handleStop}
        onSleep={handleSleep}
        onTerminal={() => router.push(`/huggingface/${spaceId}/terminal`)}
        loading={actionLoading}
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server size={16} className="text-accent" />
                Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">ID</span>
                <span className="text-text-primary">{spaceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Status</span>
                <StatusBadge status={status} />
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">SDK</span>
                <span className="text-text-primary">-</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode size={16} className="text-accent" />
                Recent Files
              </CardTitle>
              <Link href={`/huggingface/${spaceId}/files`}>
                <Button size="sm" variant="ghost">Browse</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {files.map((f) => (
                  <div key={f.path} className="flex items-center gap-2 py-1 text-sm">
                    <FileCode size={14} className="text-text-muted" />
                    <span className="text-text-secondary">{f.name}</span>
                    {f.size && <span className="text-text-muted text-xs ml-auto">{(f.size / 1024).toFixed(1)} KB</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'files' && (
        <Card>
          <CardHeader>
            <CardTitle>File Tree</CardTitle>
            <Link href={`/huggingface/${spaceId}/files`}>
              <Button size="sm" variant="primary">
                <FileCode size={14} />
                File Editor
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {files.map((f) => (
                <div key={f.path} className="flex items-center gap-2 py-1.5 text-sm hover:bg-bg-tertiary/50 rounded px-2">
                  <FileCode size={14} className="text-text-muted" />
                  <span className="text-text-secondary">{f.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
