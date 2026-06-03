'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/ui/skeleton';
import { Search, RefreshCw, GitBranch, GitFork, Eye } from 'lucide-react';
import { useSettingsStore } from '@/lib/store/settings';
import { listProjects } from '@/lib/api/gitlab';
import type { GitLabProject } from '@/types';
import { useToastStore } from '@/components/ui/toast';
import Link from 'next/link';

export default function GitLabPage() {
  const { settings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [projects, setProjects] = useState<GitLabProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProjects = async () => {
    if (!settings.gitlabToken) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await listProjects(settings.gitlabToken, settings.gitlabUrl || 'https://gitlab.com');
      setProjects(data);
    } catch { setProjects([]); addToast('error', 'Failed to fetch GitLab projects'); }
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [settings.gitlabToken]);

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input className="w-full rounded-lg border border-border-primary bg-bg-tertiary pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm" variant="secondary" onClick={fetchProjects} loading={loading}><RefreshCw size={14} /> Refresh</Button>
      </div>

      {!settings.gitlabToken && (
        <div className="text-center py-12">
          <GitBranch size={48} className="text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">GitLab Token Required</h2>
          <p className="text-sm text-text-muted mb-4">Add your GitLab personal access token in Settings</p>
        </div>
      )}

      {settings.gitlabToken && loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {settings.gitlabToken && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Card key={project.id} hover className="p-4">
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center shrink-0">
                    <GitBranch size={20} className="text-amber" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{project.name}</p>
                    <p className="text-xs text-text-muted mt-1">{project.nameWithNamespace}</p>
                    <p className="text-xs text-text-muted mt-1 line-clamp-1">{project.description || 'No description'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                      <span className="flex items-center gap-1"><GitFork size={12} /> {project.forkCount}</span>
                      <span className="flex items-center gap-1"><Eye size={12} /> {project.starCount}</span>
                      <Badge variant={project.visibility === 'public' ? 'success' : 'neutral'}>
                        {project.visibility}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-sm text-text-muted">No projects found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
