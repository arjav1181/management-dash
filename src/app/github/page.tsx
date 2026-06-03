'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { RepoCard } from '@/components/github/repo-card';
import { Button } from '@/components/ui/button';
import { SkeletonCard } from '@/components/ui/skeleton';
import { RefreshCw, GitBranch } from 'lucide-react';
import type { GitHubRepo } from '@/types';

export default function GitHubPage() {
  const { hasToken } = useSettingsStore();
  const router = useRouter();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRepos = async () => {
    if (!hasToken('github')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/github/repos');
      if (!res.ok) {
        setRepos([]);
        return;
      }
      const data = await res.json();
      setRepos(data);
    } catch {
      setRepos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRepos();
  }, [hasToken('github')]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">GitHub Repositories</h2>
          <p className="text-sm text-text-muted">{repos.length} repos</p>
        </div>
        <Button size="sm" variant="secondary" onClick={fetchRepos} loading={loading}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {!hasToken('github') && (
        <div className="text-center py-12">
          <GitBranch size={48} className="text-text-muted mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">GitHub Token Required</h2>
          <p className="text-sm text-text-muted mb-4">Add your GitHub token in Settings</p>
          <Button onClick={() => router.push('/settings')}>Go to Settings</Button>
        </div>
      )}

      {hasToken('github') && loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {hasToken('github') && !loading && repos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-text-muted">No repos found for this account</p>
        </div>
      )}

      {!loading && repos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
