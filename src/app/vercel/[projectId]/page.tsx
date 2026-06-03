'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { listDeployments, triggerDeploy, getDeploymentLogs } from '@/lib/api/vercel';
import { DeploymentRow } from '@/components/vercel/deployment-row';
import { DeploymentLogs } from '@/components/vercel/deployment-logs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SkeletonTable, SkeletonLogViewer } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { useToastStore } from '@/components/ui/toast';
import { ArrowLeft, RefreshCw, Rocket, Triangle } from 'lucide-react';
import type { VercelDeployment } from '@/types';

export default function VercelProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { settings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [activeTab, setActiveTab] = useState('deployments');
  const [selectedDeploy, setSelectedDeploy] = useState<string | null>(null);

  const fetchDeployments = async () => {
    if (!settings.vercelToken) return;
    setLoading(true);
    try {
      const data = await listDeployments(settings.vercelToken, projectId);
      setDeployments(data);
    } catch {
      setDeployments([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDeployments(); }, [projectId, settings.vercelToken]);

  const handleDeploy = async () => {
    setDeploying(true);
    const ok = await triggerDeploy(settings.vercelToken, projectId);
    if (ok) {
      addToast('success', 'Deployment triggered');
      setTimeout(fetchDeployments, 3000);
    } else addToast('error', 'Failed to trigger deploy');
    setDeploying(false);
  };

  const viewLogs = async (deployId: string) => {
    setSelectedDeploy(deployId);
    setActiveTab('logs');
    const data = await getDeploymentLogs(settings.vercelToken, deployId);
    setLogs(data);
  };

  const tabs = [
    { id: 'deployments', label: 'Deployments' },
    { id: 'logs', label: 'Logs' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/vercel')}>
          <ArrowLeft size={16} />
        </Button>
        <div className="flex items-center gap-2">
          <Triangle size={20} className="text-info" />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{projectId}</h2>
            <p className="text-xs text-text-muted">Vercel Project</p>
          </div>
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="secondary" onClick={fetchDeployments} loading={loading}>
          <RefreshCw size={14} />
        </Button>
        <Button size="sm" onClick={handleDeploy} loading={deploying}>
          <Rocket size={14} />
          Deploy
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'deployments' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonTable rows={8} />
            ) : deployments.length === 0 ? (
              <p className="text-sm text-text-muted">No deployments yet</p>
            ) : (
              <div className="divide-y divide-border-primary">
                {deployments.map((dep) => (
                  <div
                    key={dep.id}
                    className="cursor-pointer hover:bg-bg-tertiary/30 rounded-lg transition-colors"
                    onClick={() => viewLogs(dep.id)}
                  >
                    <DeploymentRow deployment={dep} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDeploy ? `Deployment Logs (${selectedDeploy.slice(0, 8)})` : 'Select a deployment'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDeploy ? (
              loading ? <SkeletonLogViewer /> : <DeploymentLogs logs={logs} />
            ) : (
              <p className="text-sm text-text-muted">Click a deployment to view its logs</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
