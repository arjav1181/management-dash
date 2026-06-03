'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { ProjectCard } from '@/components/vercel/project-card';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { RefreshCw, Triangle } from 'lucide-react';
import type { VercelProject } from '@/types';

export default function VercelPage() {
  const { hasToken } = useSettingsStore();
  const router = useRouter();
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!hasToken('vercel')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/vercel/projects');
      if (!res.ok) {
        setProjects([]);
        return;
      }
      const data = await res.json();
      setProjects(data);
    } catch {
      setProjects([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, [hasToken('vercel')]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Vercel Projects</h2>
          <p className="text-sm text-text-muted">{projects.length} projects</p>
        </div>
        <Button size="sm" variant="secondary" onClick={fetchProjects} loading={loading}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {!hasToken('vercel') && (
        <div className="text-center py-12">
          <Triangle size={48} className="text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Vercel Token Required</h2>
          <p className="text-sm text-text-muted mb-4">Add your Vercel token in Settings</p>
          <Button onClick={() => router.push('/settings')}>Go to Settings</Button>
        </div>
      )}

      {hasToken('vercel') && loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {hasToken('vercel') && !loading && projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-text-muted">No projects found for this account</p>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
