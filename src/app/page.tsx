'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/lib/store/settings';
import { StatCard } from '@/components/widgets/stat-card';
import { ActivityFeed } from '@/components/widgets/activity-feed';
import { StatusPill } from '@/components/widgets/status-pill';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonStatCard, SkeletonTable } from '@/components/ui/skeleton';
import {
  Boxes, Triangle, GitBranch, Bot, RefreshCw, ArrowRight,
  Container, Bell, Search, User, Activity, Clock, Zap, Shield,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import {
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, BarChart, Bar, Legend,
} from 'recharts';
import type { HFSpace, VercelProject, GitHubRepo, ActivityItem, Platform } from '@/types';

const platformColors: Record<Platform, string> = {
  huggingface: '#f59e0b',
  vercel: '#06b6d4',
  github: '#f5f5f7',
  agent: '#6366f1',
  docker: '#06b6d4',
  gitlab: '#f59e0b',
  netlify: '#22c55e',
};

const statusColors: Record<string, string> = {
  running: '#22c55e',
  sleeping: '#06b6d4',
  building: '#f59e0b',
  error: '#ef4444',
  unknown: '#6b6b76',
  READY: '#22c55e',
  BUILDING: '#f59e0b',
  ERROR: '#ef4444',
};

const deploymentData = [
  { name: 'Mon', deploys: 4, success: 3 },
  { name: 'Tue', deploys: 7, success: 6 },
  { name: 'Wed', deploys: 5, success: 5 },
  { name: 'Thu', deploys: 8, success: 7 },
  { name: 'Fri', deploys: 6, success: 4 },
  { name: 'Sat', deploys: 3, success: 3 },
  { name: 'Sun', deploys: 2, success: 2 },
];

export default function Home() {
  const { settings, hasToken } = useSettingsStore();
  const [spaces, setSpaces] = useState<HFSpace[]>([]);
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, p, r] = await Promise.all([
        hasToken('hf') ? fetch('/api/hf/spaces').then((r) => r.ok ? r.json() : []).catch(() => []) : Promise.resolve([]),
        hasToken('vercel') ? fetch('/api/vercel/projects').then((r) => r.ok ? r.json() : []).catch(() => []) : Promise.resolve([]),
        hasToken('github') ? fetch('/api/github/repos').then((r) => r.ok ? r.json() : []).catch(() => []) : Promise.resolve([]),
      ]);
      setSpaces(s);
      setProjects(p);
      setRepos(r);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (hasToken('hf') || hasToken('vercel') || hasToken('github')) fetchData();
    else setLoading(false);
  }, [hasToken('hf'), hasToken('vercel'), hasToken('github')]);

  useEffect(() => {
    const items: ActivityItem[] = [];
    if (spaces.length) {
      const running = spaces.filter((s) => s.status === 'running').length;
      items.push({ id: 'hf-summary', platform: 'huggingface', type: 'summary', message: `${running}/${spaces.length} HF Spaces running`, timestamp: 'Just now' });
    }
    if (projects.length) {
      const ready = projects.filter((p) => p.latestDeployments?.[0]?.state === 'READY').length;
      items.push({ id: 'v-summary', platform: 'vercel', type: 'summary', message: `${ready}/${projects.length} Vercel projects deployed`, timestamp: 'Just now' });
    }
    if (repos.length) {
      const total = repos.reduce((sum, r) => sum + r.openIssues, 0);
      items.push({ id: 'gh-summary', platform: 'github', type: 'summary', message: `${repos.length} repos monitored, ${total} open issues`, timestamp: 'Just now' });
    }
    setActivity(items);
  }, [spaces, projects, repos]);

  const runningSpaces = spaces.filter((s) => s.status === 'running').length;
  const readyProjects = projects.filter((p) => p.latestDeployments?.[0]?.state === 'READY').length;
  const totalIssues = repos.reduce((s, r) => s + r.openIssues, 0);
  const totalStars = repos.reduce((s, r) => s + r.stars, 0);
  const hasTokens = hasToken('hf') || hasToken('vercel') || hasToken('github');

  const spaceStatuses = [
    { name: 'Running', value: runningSpaces, color: '#22c55e' },
    { name: 'Sleeping', value: spaces.filter((s) => s.status === 'sleeping').length, color: '#06b6d4' },
    { name: 'Building', value: spaces.filter((s) => s.status === 'building').length, color: '#f59e0b' },
    { name: 'Error', value: spaces.filter((s) => s.status === 'error').length, color: '#ef4444' },
  ].filter((s) => s.value > 0);

  const deployStates = [
    { name: 'Ready', value: readyProjects, color: '#22c55e' },
    { name: 'Building', value: projects.filter((p) => p.latestDeployments?.[0]?.state === 'BUILDING').length, color: '#f59e0b' },
    { name: 'Error', value: projects.filter((p) => p.latestDeployments?.[0]?.state === 'ERROR').length, color: '#ef4444' },
  ].filter((s) => s.value > 0);

  const healthScore = hasTokens
    ? Math.round(
        ((runningSpaces / (spaces.length || 1)) * 0.3 +
        (readyProjects / (projects.length || 1)) * 0.3 +
        (repos.length > 0 ? 1 : 0) * 0.2 +
        (totalIssues === 0 ? 1 : Math.max(0, 1 - totalIssues * 0.02)) * 0.2) * 100
      )
    : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Activity size={22} className="text-accent" />
            Dashboard
          </h2>
          <p className="text-sm text-text-muted">
            {loading ? 'Loading...' : `Updated ${new Date().toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => { setRefreshing(true); fetchData(); }} loading={loading || refreshing}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {hasTokens && !loading && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-accent/5 to-accent/[0.02] border border-accent/10">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6366f1" strokeWidth="3"
                strokeDasharray={`${healthScore / 100 * 97.4} 97.4`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-primary">{healthScore}%</span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary flex items-center gap-1.5">
              <Shield size={14} className="text-accent" /> System Health
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {healthScore >= 80 ? 'All platforms operating normally' :
               healthScore >= 50 ? 'Some platforms need attention' :
               'Multiple platforms experiencing issues'}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/search"><Button size="sm" variant="secondary"><Search size={14} /> Search</Button></Link>
        <Link href="/notifications"><Button size="sm" variant="secondary"><Bell size={14} /> Notifications</Button></Link>
        <Link href="/profile"><Button size="sm" variant="secondary"><User size={14} /> Profile</Button></Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard title="HF Spaces" value={spaces.length} subtitle={`${runningSpaces} running`} icon={<Boxes size={28} />}
              trend={spaces.length ? { value: Math.round((runningSpaces / spaces.length) * 100), positive: true } : undefined} />
            <StatCard title="Vercel Projects" value={projects.length} subtitle={`${readyProjects} deployed`} icon={<Triangle size={28} />} />
            <StatCard title="GitHub Repos" value={repos.length} subtitle={`${totalStars} stars`} icon={<GitBranch size={28} />} />
            <StatCard title="Open Issues" value={totalIssues} subtitle="Across all repos" icon={<Bot size={28} />}
              trend={totalIssues ? { value: totalIssues, positive: false } : undefined} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap size={16} className="text-accent" /> Deployment Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <SkeletonTable rows={4} /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deploymentData}>
                  <XAxis dataKey="name" tick={{ fill: '#6b6b76', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b6b76', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#121216', border: '1px solid #272730', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="deploys" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="success" fill="#22c55e" radius={[4, 4, 0, 0]} name="Success" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Boxes size={16} className="text-accent" /> HF Space Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <SkeletonTable rows={4} /> : spaceStatuses.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={spaceStatuses} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" stroke="none">
                      {spaceStatuses.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {spaceStatuses.map((s) => (
                    <div key={s.name} className="flex items-center gap-2 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-text-secondary">{s.name}</span>
                      <span className="text-text-primary font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted text-center py-8">
                {hasToken('hf') ? 'No spaces found' : 'Add HF token in Settings'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Boxes size={16} className="text-accent" /> HF Spaces
            </CardTitle>
            <Link href="/huggingface"><Button size="sm" variant="ghost">View All <ArrowRight size={14} /></Button></Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {loading ? <SkeletonTable rows={4} /> : spaces.slice(0, 5).map((space) => (
                <Link key={space.id} href={`/huggingface/${space.id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors -mx-3">
                  <span className="text-sm text-text-primary truncate">{space.name}</span>
                  <StatusPill status={space.status} />
                </Link>
              ))}
              {!loading && spaces.length === 0 && (
                <p className="text-sm text-text-muted text-center py-6">
                  {hasToken('hf') ? 'No spaces found' : 'Add HF token in Settings'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Triangle size={16} className="text-info" /> Vercel Projects
            </CardTitle>
            <Link href="/vercel"><Button size="sm" variant="ghost">View All <ArrowRight size={14} /></Button></Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {loading ? <SkeletonTable rows={4} /> : projects.slice(0, 5).map((project) => {
                const deploy = project.latestDeployments?.[0];
                return (
                  <Link key={project.id} href={`/vercel/${project.id}`}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors -mx-3">
                    <span className="text-sm text-text-primary truncate">{project.name}</span>
                    {deploy && <StatusPill status={deploy.state} />}
                  </Link>
                );
              })}
              {!loading && projects.length === 0 && (
                <p className="text-sm text-text-muted text-center py-6">
                  {hasToken('vercel') ? 'No projects found' : 'Add Vercel token in Settings'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <GitBranch size={16} className="text-accent" /> Recent Repos
            </CardTitle>
            <Link href="/github"><Button size="sm" variant="ghost">View All <ArrowRight size={14} /></Button></Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {loading ? <SkeletonTable rows={4} /> : repos.slice(0, 5).map((repo) => (
                <Link key={repo.id} href={`/github/${repo.fullName}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-tertiary/50 transition-colors -mx-3">
                  <span className="text-sm text-text-primary truncate">{repo.name}</span>
                  <span className="text-xs text-text-muted">{repo.language || 'N/A'}</span>
                </Link>
              ))}
              {!loading && repos.length === 0 && (
                <p className="text-sm text-text-muted text-center py-6">
                  {hasToken('github') ? 'No repos found' : 'Add GitHub token in Settings'}
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
