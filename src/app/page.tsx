'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/lib/store/settings';
import { StatCard } from '@/components/widgets/stat-card';
import { ActivityFeed } from '@/components/widgets/activity-feed';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Boxes, Triangle, GitBranch, Bot, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { HFSpace, VercelProject, GitHubRepo, ActivityItem } from '@/types';
import { listSpaces } from '@/lib/api/huggingface';
import { listProjects } from '@/lib/api/vercel';
import { listRepos } from '@/lib/api/github';

export default function Home() {
  const { settings } = useSettingsStore();
  const [spaces, setSpaces] = useState<HFSpace[]>([]);
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (settings.hfToken) {
        const s = await listSpaces(settings.hfToken);
        setSpaces(s);
      }
      if (settings.vercelToken) {
        const p = await listProjects(settings.vercelToken);
        setProjects(p);
      }
      if (settings.githubToken) {
        const r = await listRepos(settings.githubToken, settings.githubScope);
        setRepos(r);
      }
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    if (settings.hfToken || settings.vercelToken || settings.githubToken) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [settings.hfToken, settings.vercelToken, settings.githubToken]);

  useEffect(() => {
    const items: ActivityItem[] = [];
    if (spaces.length > 0) {
      const running = spaces.filter((s) => s.status === 'running').length;
      items.push({
        id: 'hf-summary',
        platform: 'huggingface',
        type: 'summary',
        message: `${running}/${spaces.length} HF Spaces running`,
        timestamp: 'Just now',
      });
    }
    if (projects.length > 0) {
      const ready = projects.filter((p) => p.latestDeployments?.[0]?.state === 'READY').length;
      items.push({
        id: 'vercel-summary',
        platform: 'vercel',
        type: 'summary',
        message: `${ready}/${projects.length} Vercel projects deployed`,
        timestamp: 'Just now',
      });
    }
    if (repos.length > 0) {
      const totalIssues = repos.reduce((sum, r) => sum + r.openIssues, 0);
      items.push({
        id: 'gh-summary',
        platform: 'github',
        type: 'summary',
        message: `${repos.length} repos monitored, ${totalIssues} open issues`,
        timestamp: 'Just now',
      });
    }
    setActivity(items);
  }, [spaces, projects, repos]);

  const runningSpaces = spaces.filter((s) => s.status === 'running').length;
  const readyProjects = projects.filter((p) => p.latestDeployments?.[0]?.state === 'READY').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm">
            {loading ? 'Loading...' : `Last updated ${new Date().toLocaleTimeString()}`}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={fetchData} loading={loading}>
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="HF Spaces"
          value={spaces.length}
          subtitle={`${runningSpaces} running`}
          icon={<Boxes size={28} />}
          trend={spaces.length > 0 ? { value: Math.round((runningSpaces / spaces.length) * 100), positive: true } : undefined}
        />
        <StatCard
          title="Vercel Projects"
          value={projects.length}
          subtitle={`${readyProjects} deployed`}
          icon={<Triangle size={28} />}
        />
        <StatCard
          title="GitHub Repos"
          value={repos.length}
          subtitle={`${repos.reduce((s, r) => s + r.stars, 0)} total stars`}
          icon={<GitBranch size={28} />}
        />
        <StatCard
          title="Total Issues"
          value={repos.reduce((sum, r) => sum + r.openIssues, 0)}
          subtitle="Across all repos"
          icon={<Bot size={28} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes size={16} className="text-accent" />
              HF Spaces
            </CardTitle>
            <Link href="/huggingface">
              <Button size="sm" variant="ghost">
                View All <ArrowRight size={14} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {spaces.slice(0, 5).map((space) => (
                <div key={space.id} className="flex items-center justify-between py-2 border-b border-border-primary last:border-0">
                  <span className="text-sm text-text-primary truncate">{space.name}</span>
                  <Badge
                    variant={
                      space.status === 'running' ? 'success' :
                      space.status === 'sleeping' ? 'info' :
                      space.status === 'building' ? 'warning' :
                      space.status === 'error' ? 'danger' : 'neutral'
                    }
                    dot
                  >
                    {space.status}
                  </Badge>
                </div>
              ))}
              {spaces.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">
                  {settings.hfToken ? 'No spaces found' : 'Add HF token in Settings'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Triangle size={16} className="text-info" />
              Vercel Deployments
            </CardTitle>
            <Link href="/vercel">
              <Button size="sm" variant="ghost">
                View All <ArrowRight size={14} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => {
                const deploy = project.latestDeployments?.[0];
                return (
                  <div key={project.id} className="flex items-center justify-between py-2 border-b border-border-primary last:border-0">
                    <span className="text-sm text-text-primary truncate">{project.name}</span>
                    {deploy && (
                      <Badge
                        variant={
                          deploy.state === 'READY' ? 'success' :
                          deploy.state === 'BUILDING' ? 'warning' :
                          deploy.state === 'ERROR' ? 'danger' : 'neutral'
                        }
                        dot
                      >
                        {deploy.state}
                      </Badge>
                    )}
                  </div>
                );
              })}
              {projects.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">
                  {settings.vercelToken ? 'No projects found' : 'Add Vercel token in Settings'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch size={16} className="text-accent" />
              Recent Repos
            </CardTitle>
            <Link href="/github">
              <Button size="sm" variant="ghost">
                View All <ArrowRight size={14} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {repos.slice(0, 5).map((repo) => (
                <div key={repo.id} className="flex items-center justify-between py-2 border-b border-border-primary last:border-0">
                  <span className="text-sm text-text-primary truncate">{repo.name}</span>
                  <span className="text-xs text-text-muted">{repo.language || 'N/A'}</span>
                </div>
              ))}
              {repos.length === 0 && (
                <p className="text-sm text-text-muted text-center py-4">
                  {settings.githubToken ? 'No repos found' : 'Add GitHub token in Settings'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <ActivityFeed items={activity} />
      </div>
    </div>
  );
}
