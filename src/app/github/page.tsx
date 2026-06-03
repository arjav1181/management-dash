'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { listRepos } from '@/lib/api/github';
import { RepoCard } from '@/components/github/repo-card';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { RefreshCw, Search, GitBranch } from 'lucide-react';
import type { GitHubRepo } from '@/types';

export default function GitHubPage() {
  const { settings } = useSettingsStore();
  const router = useRouter();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRepos = async () => {
    if (!settings.githubToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listRepos(settings.githubToken, settings.githubScope);
      setRepos(data);
    } catch {
      setRepos([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRepos(); }, [settings.githubToken, settings.githubScope]);

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.language || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className="w-full rounded-lg border border-border-primary bg-bg-tertiary pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
            placeholder="Search repos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button size="sm" variant="secondary" onClick={fetchRepos} loading={loading}>
          <RefreshCw size={14} />
        </Button>
      </div>

      {!settings.githubToken && (
        <div className="text-center py-12">
          <GitBranch size={48} className="text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">GitHub Token Required</h2>
          <p className="text-sm text-text-muted mb-4">Add your GitHub token in Settings</p>
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
          {filtered.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
