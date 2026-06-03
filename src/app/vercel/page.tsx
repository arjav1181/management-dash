'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { listProjects } from '@/lib/api/vercel';
import { ProjectCard } from '@/components/vercel/project-card';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { RefreshCw, Search, Triangle } from 'lucide-react';
import type { VercelProject } from '@/types';

export default function VercelPage() {
  const { settings } = useSettingsStore();
  const router = useRouter();
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProjects = async () => {
    if (!settings.vercelToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listProjects(settings.vercelToken);
      setProjects(data);
    } catch {
      setProjects([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [settings.vercelToken]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className="w-full rounded-lg border border-border-primary bg-bg-tertiary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button size="sm" variant="secondary" onClick={fetchProjects} loading={loading}>
          <RefreshCw size={14} />
        </Button>
      </div>

      {!settings.vercelToken && (
        <div className="text-center py-12">
          <Triangle size={48} className="text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Vercel Token Required</h2>
          <p className="text-sm text-text-muted mb-4">Add your Vercel token in Settings</p>
          <Button onClick={() => router.push('/settings')}>Go to Settings</Button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
