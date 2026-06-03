'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { getCommits, listIssues, listPRs, listActionRuns, createIssue, mergePR } from '@/lib/api/github';
import { CommitList } from '@/components/github/commit-list';
import { IssueList } from '@/components/github/issue-list';
import { PRCard } from '@/components/github/pr-card';
import { CIStatus } from '@/components/github/ci-status';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  const { settings } = useSettingsStore();
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
    if (!settings.githubToken) return;
    setLoading(true);
    try {
      const [c, i, p, a] = await Promise.all([
        getCommits(settings.githubToken, owner, repo),
        listIssues(settings.githubToken, owner, repo),
        listPRs(settings.githubToken, owner, repo),
        listActionRuns(settings.githubToken, owner, repo),
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

  useEffect(() => { fetchAll(); }, [owner, repo, settings.githubToken]);

  const handleCreateIssue = async () => {
    if (!newIssue.title.trim() || !canWrite) return;
    const ok = await createIssue(
      settings.githubToken,
      owner,
      repo,
      newIssue.title,
      newIssue.body || undefined
    );
    if (ok) {
      addToast('success', 'Issue created');
      setShowCreateIssue(false);
      setNewIssue({ title: '', body: '' });
      fetchAll();
    } else addToast('error', 'Failed to create issue');
  };

  const handleMergePR = async (prNumber: number) => {
    if (!canWrite) return;
    const ok = await mergePR(settings.githubToken, owner, repo, prNumber);
    if (ok) {
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
        <Button variant="ghost" size="sm" onClick={() => router.push('/github')}>
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
        <Button size="sm" variant="secondary" onClick={fetchAll} loading={loading}>
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
            <CommitList commits={commits} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'issues' && (
        <Card>
          <CardHeader>
            <CardTitle>Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <IssueList issues={issues} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'pulls' && (
        <Card>
          <CardHeader>
            <CardTitle>Pull Requests</CardTitle>
          </CardHeader>
          <CardContent>
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
                    >
                      <GitMerge size={14} className="text-emerald" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'ci' && (
        <Card>
          <CardHeader>
            <CardTitle>CI/CD Status</CardTitle>
          </CardHeader>
          <CardContent>
            <CIStatus runs={actions} />
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
