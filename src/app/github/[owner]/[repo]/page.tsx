'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { CommitList } from '@/components/github/commit-list';
import { IssueList } from '@/components/github/issue-list';
import { PRCard } from '@/components/github/pr-card';
import { CIStatus } from '@/components/github/ci-status';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { SkeletonTable } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { useToastStore } from '@/components/ui/toast';
import { ArrowLeft, GitBranch, RefreshCw, Plus, GitMerge } from 'lucide-react';
import type { GitHubCommit, GitHubIssue, GitHubPR, GitHubActionRun } from '@/types';

export default function GitHubRepoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const { hasToken, settings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [prs, setPRs] = useState<GitHubPR[]>([]);
  const [actions, setActions] = useState<GitHubActionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('commits');
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: '', body: '' });

  const canWrite = settings.githubScope === 'write' || settings.githubScope === 'admin';

  const fetchAll = async () => {
    if (!hasToken('github')) return;
    setLoading(true);
    try {
      const [c, i, p, a] = await Promise.all([
        fetch(`/api/github/repos/${owner}/${repo}/commits`).then((r) => r.ok ? r.json() : []).catch(() => []),
        fetch(`/api/github/repos/${owner}/${repo}/issues`).then((r) => r.ok ? r.json() : []).catch(() => []),
        fetch(`/api/github/repos/${owner}/${repo}/pulls`).then((r) => r.ok ? r.json() : []).catch(() => []),
        fetch(`/api/github/repos/${owner}/${repo}/actions`).then((r) => r.ok ? r.json() : []).catch(() => []),
      ]);
      setCommits(c);
      setIssues(i);
      setPRs(p);
      setActions(a);
    } catch {
      addToast('error', 'Failed to load repo data');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [owner, repo, hasToken('github')]);

  const handleCreateIssue = async () => {
    if (!newIssue.title.trim() || !canWrite) return;
    const res = await fetch(`/api/github/repos/${owner}/${repo}/issues/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newIssue),
    });
    const data = await res.json();
    if (data.success) {
      addToast('success', 'Issue created');
      setShowCreateIssue(false);
      setNewIssue({ title: '', body: '' });
      fetchAll();
    } else addToast('error', 'Failed to create issue');
  };

  const handleMergePR = async (prNumber: number) => {
    if (!canWrite) return;
    const res = await fetch(`/api/github/repos/${owner}/${repo}/pulls/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pullNumber: prNumber }),
    });
    const data = await res.json();
    if (data.success) {
      addToast('success', `PR #${prNumber} merged`);
      fetchAll();
    } else addToast('error', 'Failed to merge PR');
  };

  const tabs = [
    { id: 'commits', label: 'Commits' },
    { id: 'issues', label: `Issues (${issues.filter(i => i.state === 'open').length})` },
    { id: 'pulls', label: `PRs (${prs.filter(p => p.state === 'open').length})` },
    { id: 'ci', label: 'CI' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/github')} aria-label="Back to repos">
          <ArrowLeft size={16} />
        </Button>
        <div className="flex items-center gap-2">
          <GitBranch size={20} className="text-accent" />
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{repo}</h2>
            <p className="text-xs text-text-muted">{owner}</p>
          </div>
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="secondary" onClick={fetchAll} loading={loading} aria-label="Refresh">
          <RefreshCw size={14} />
        </Button>
        {canWrite && activeTab === 'issues' && (
          <Button size="sm" onClick={() => setShowCreateIssue(true)}>
            <Plus size={14} />
            New Issue
          </Button>
        )}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'commits' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Commits</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <SkeletonTable rows={8} /> : <CommitList commits={commits} />}
          </CardContent>
        </Card>
      )}

      {activeTab === 'issues' && (
        <Card>
          <CardHeader>
            <CardTitle>Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <SkeletonTable rows={8} /> : <IssueList issues={issues} />}
          </CardContent>
        </Card>
      )}

      {activeTab === 'pulls' && (
        <Card>
          <CardHeader>
            <CardTitle>Pull Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <SkeletonTable rows={6} /> : (
              <div className="space-y-1">
                {prs.map((pr) => (
                  <div key={pr.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <PRCard pr={pr} />
                    </div>
                    {canWrite && pr.state === 'open' && !pr.draft && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMergePR(pr.number)}
                        aria-label={`Merge PR ${pr.number}`}
                      >
                        <GitMerge size={14} className="text-emerald" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'ci' && (
        <Card>
          <CardHeader>
            <CardTitle>CI/CD Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <SkeletonTable rows={6} /> : <CIStatus runs={actions} />}
          </CardContent>
        </Card>
      )}

      <Modal
        open={showCreateIssue}
        onClose={() => setShowCreateIssue(false)}
        title="Create Issue"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={newIssue.title}
            onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
            placeholder="Issue title..."
          />
          <Input
            label="Description"
            value={newIssue.body}
            onChange={(e) => setNewIssue({ ...newIssue, body: e.target.value })}
            placeholder="Optional description..."
          />
          <Button onClick={handleCreateIssue} disabled={!newIssue.title.trim()}>
            Create Issue
          </Button>
        </div>
      </Modal>
    </div>
  );
}
