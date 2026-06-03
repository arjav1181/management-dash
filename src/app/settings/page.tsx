'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { useSettingsStore } from '@/lib/store/settings';
import { useToastStore } from '@/components/ui/toast';
import { LLM_PROVIDERS, type LLMConfig } from '@/types';
import { Key, Bot, Shield, Eye, EyeOff, Save, Globe, Container, GitBranch } from 'lucide-react';

const SCOPE_OPTIONS = [
  { value: 'read', label: 'Read-only (repos, commits, issues, CI)' },
  { value: 'write', label: 'Read + Write (create issues, comment, merge)' },
  { value: 'admin', label: 'Admin (full repo management)' },
];

export default function SettingsPage() {
  const { settings, updateToken, updateGitLabUrl, updateGitHubScope, updateLLMConfig, persistSettings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState('api');
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState({
    hfToken: '',
    vercelToken: '',
    githubToken: '',
    dockerToken: '',
    gitlabToken: '',
    gitlabUrl: 'https://gitlab.com',
    netlifyToken: '',
    llmApiKey: '',
    llmModel: '',
    llmBaseUrl: '',
  });

  useEffect(() => {
    setLocal({
      hfToken: settings.hfToken,
      vercelToken: settings.vercelToken,
      githubToken: settings.githubToken,
      dockerToken: settings.dockerToken,
      gitlabToken: settings.gitlabToken,
      gitlabUrl: settings.gitlabUrl,
      netlifyToken: settings.netlifyToken,
      llmApiKey: settings.llmConfig.apiKey,
      llmModel: settings.llmConfig.model,
      llmBaseUrl: settings.llmConfig.baseUrl || '',
    });
  }, [settings]);

  const saveAllTokens = async () => {
    setSaving(true);
    updateToken('hf', local.hfToken);
    updateToken('vercel', local.vercelToken);
    updateToken('github', local.githubToken);
    updateToken('docker', local.dockerToken);
    updateToken('gitlab', local.gitlabToken);
    updateToken('netlify', local.netlifyToken);
    updateGitLabUrl(local.gitlabUrl);
    await persistSettings();
    addToast('success', 'All tokens saved');
    setSaving(false);
  };

  const saveLLM = async () => {
    setSaving(true);
    updateLLMConfig({ apiKey: local.llmApiKey, model: local.llmModel, baseUrl: local.llmBaseUrl || undefined });
    await persistSettings();
    addToast('success', 'LLM config saved');
    setSaving(false);
  };

  const tabs = [
    { id: 'api', label: 'API Tokens' },
    { id: 'llm', label: 'AI Agent' },
    { id: 'github', label: 'GitHub Scope' },
  ];

  const toggleShow = (key: string) => setShowTokens((prev) => ({ ...prev, [key]: !prev[key] }));

  const providerOptions = LLM_PROVIDERS.map((p) => ({ value: p.value, label: p.label }));
  const currentProvider = LLM_PROVIDERS.find((p) => p.value === settings.llmConfig.provider);
  const modelOptions = (currentProvider?.models || []).map((m) => ({ value: m, label: m }));

  const TokenInput = ({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <div className="relative">
      <Input label={label} type={showTokens[id] ? 'text' : 'password'} placeholder={placeholder || `${label}...`} value={value} onChange={(e) => onChange(e.target.value)} />
      <button onClick={() => toggleShow(id)} className="absolute right-3 top-[38px] text-text-muted hover:text-text-primary transition-colors">
        {showTokens[id] ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6 animate-fadeIn">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'api' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key size={18} className="text-accent" /> API Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-xs text-text-muted">Tokens are encrypted at rest in Supabase. Never shared.</p>

            <TokenInput id="hf" label="Hugging Face" value={local.hfToken} onChange={(v) => setLocal({ ...local, hfToken: v })} placeholder="hf_..." />
            <TokenInput id="vercel" label="Vercel" value={local.vercelToken} onChange={(v) => setLocal({ ...local, vercelToken: v })} placeholder="vercel_..." />
            <TokenInput id="github" label="GitHub" value={local.githubToken} onChange={(v) => setLocal({ ...local, githubToken: v })} placeholder="ghp_..." />

            <div className="h-px bg-border-primary" />

            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Container size={16} className="text-info" /> Docker Hub
            </div>
            <TokenInput id="docker" label="Docker Token" value={local.dockerToken} onChange={(v) => setLocal({ ...local, dockerToken: v })} placeholder="dckr_..." />

            <div className="h-px bg-border-primary" />

            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <GitBranch size={16} className="text-amber" /> GitLab
            </div>
            <TokenInput id="gitlab" label="GitLab Token" value={local.gitlabToken} onChange={(v) => setLocal({ ...local, gitlabToken: v })} placeholder="glpat_..." />
            <Input label="GitLab URL" type="text" placeholder="https://gitlab.com" value={local.gitlabUrl} onChange={(e) => setLocal({ ...local, gitlabUrl: e.target.value })} />

            <div className="h-px bg-border-primary" />

            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Globe size={16} className="text-emerald" /> Netlify
            </div>
            <TokenInput id="netlify" label="Netlify Token" value={local.netlifyToken} onChange={(v) => setLocal({ ...local, netlifyToken: v })} placeholder="nfpt_..." />

            <Button onClick={saveAllTokens} loading={saving} className="mt-2">
              <Save size={14} /> Save All Tokens
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'llm' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot size={18} className="text-accent" /> AI Agent Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select label="Provider" options={providerOptions} value={settings.llmConfig.provider} onChange={(e) => updateLLMConfig({ provider: e.target.value as LLMConfig['provider'] })} />
            <TokenInput id="llm" label="API Key" value={local.llmApiKey} onChange={(v) => setLocal({ ...local, llmApiKey: v })} placeholder="Enter provider API key..." />
            <Select label="Model" options={modelOptions} value={local.llmModel} onChange={(e) => { setLocal({ ...local, llmModel: e.target.value }); updateLLMConfig({ model: e.target.value }); }} />
            {settings.llmConfig.provider === 'custom' && (
              <Input label="Base URL" type="text" placeholder="https://your-api.com/v1" value={local.llmBaseUrl} onChange={(e) => setLocal({ ...local, llmBaseUrl: e.target.value })} />
            )}
            <div className="flex gap-2">
              <Button onClick={saveLLM} loading={saving}><Save size={14} /> Save LLM Config</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'github' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield size={18} className="text-accent" /> GitHub Scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select label="Permission Level" options={SCOPE_OPTIONS} value={settings.githubScope} onChange={(e) => { updateGitHubScope(e.target.value as 'read' | 'write' | 'admin'); }} />
            <Button size="sm" onClick={async () => { setSaving(true); await persistSettings(); addToast('success', 'GitHub scope saved'); setSaving(false); }} loading={saving}>
              <Save size={14} /> Save Scope
            </Button>
            <div className="p-3 rounded-lg bg-bg-tertiary border border-border-primary">
              <p className="text-xs text-text-muted">
                {settings.githubScope === 'read' && 'Can view repos, commits, issues, PRs, and CI status.'}
                {settings.githubScope === 'write' && 'Can also create issues, comment on PRs, and merge pull requests.'}
                {settings.githubScope === 'admin' && 'Full access: manage repos, deploy keys, branch protection, and more.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
