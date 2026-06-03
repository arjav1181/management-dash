'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusPill } from '@/components/widgets/status-pill';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Search, RefreshCw, ExternalLink, Globe, GitBranch } from 'lucide-react';
import { useSettingsStore } from '@/lib/store/settings';
import { listSites } from '@/lib/api/netlify';
import type { NetlifySite } from '@/types';
import { useToastStore } from '@/components/ui/toast';
import Link from 'next/link';

export default function NetlifyPage() {
  const { settings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [sites, setSites] = useState<NetlifySite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSites = async () => {
    if (!settings.netlifyToken) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await listSites(settings.netlifyToken);
      setSites(data);
    } catch { setSites([]); addToast('error', 'Failed to fetch Netlify sites'); }
    setLoading(false);
  };

  useEffect(() => { fetchSites(); }, [settings.netlifyToken]);

  const filtered = sites.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input className="w-full rounded-lg border border-border-primary bg-bg-tertiary pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="Search sites..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm" variant="secondary" onClick={fetchSites} loading={loading}><RefreshCw size={14} /> Refresh</Button>
      </div>

      {!settings.netlifyToken && (
        <div className="text-center py-12">
          <Globe size={48} className="text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Netlify Token Required</h2>
          <p className="text-sm text-text-muted mb-4">Add your Netlify personal access token in Settings</p>
        </div>
      )}

      {settings.netlifyToken && loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {settings.netlifyToken && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((site) => (
            <Card key={site.id} hover className="p-4">
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                    <Globe size={20} className="text-emerald" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{site.name}</p>
                    <a href={site.url} target="_blank" className="text-xs text-accent hover:underline flex items-center gap-1 mt-0.5">
                      {site.url.replace('https://', '')} <ExternalLink size={10} />
                    </a>
                    {site.buildSettings && (
                      <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                        <GitBranch size={10} /> {site.buildSettings.branch}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {site.publishedDeploy && <StatusPill status={site.publishedDeploy.state} />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-sm text-text-muted">No sites found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
