'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Container, Search, RefreshCw, ExternalLink, Star, Download } from 'lucide-react';
import { useSettingsStore } from '@/lib/store/settings';
import { listRepos } from '@/lib/api/docker';
import type { DockerRepo } from '@/types';
import { useToastStore } from '@/components/ui/toast';

export default function DockerPage() {
  const { settings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [repos, setRepos] = useState<DockerRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRepos = async () => {
    if (!settings.dockerToken) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await listRepos(settings.dockerToken);
      setRepos(data);
    } catch { setRepos([]); addToast('error', 'Failed to fetch Docker repos'); }
    setLoading(false);
  };

  useEffect(() => { fetchRepos(); }, [settings.dockerToken]);

  const filtered = repos.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input className="w-full rounded-lg border border-border-primary bg-bg-tertiary pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="Search images..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm" variant="secondary" onClick={fetchRepos} loading={loading}><RefreshCw size={14} /> Refresh</Button>
      </div>

      {!settings.dockerToken && (
        <div className="text-center py-12">
          <Container size={48} className="text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Docker Token Required</h2>
          <p className="text-sm text-text-muted mb-4">Add your Docker Hub token in Settings</p>
        </div>
      )}

      {settings.dockerToken && loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {settings.dockerToken && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((repo) => (
            <Card key={repo.name} hover className="p-4">
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Container size={20} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{repo.name}</p>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">{repo.description || 'No description'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                      <span className="flex items-center gap-1"><Star size={12} /> {repo.starCount}</span>
                      <span className="flex items-center gap-1"><Download size={12} /> {(repo.pullCount / 1000).toFixed(1)}k</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-sm text-text-muted">No images found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
