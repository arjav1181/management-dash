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

interface TokenInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  show: boolean;
  onToggleShow: () => void;
}

function TokenInput({ id, label, value, onChange, placeholder, show, onToggleShow }: TokenInputProps) {
  return (
    <div className="relative">
      <Input
        label={label}
        type={show ? 'text' : 'password'}
        placeholder={placeholder || `${label}...`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        aria-label={show ? `Hide ${label}` : `Show ${label}`}
        onClick={onToggleShow}
        className="absolute right-3 top-[38px] text-text-muted hover:text-text-primary transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, saveTokens, saveGitHubScope, saveLLMConfig, testToken, loading } = useSettingsStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState('api');
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [hfIdentity, setHfIdentity] = useState<{ name: string; orgs: { name: string }[] } | null>(null);
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
      hfToken: '',
      vercelToken: '',
      githubToken: '',
      dockerToken: '',
      gitlabToken: '',
      gitlabUrl: settings.gitlabUrl,
      netlifyToken: '',
      llmApiKey: '',
      llmModel: settings.llmConfig.model,
      llmBaseUrl: settings.llmConfig.baseUrl || '',
    });
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    if (settings.tokens.hf && activeTab === 'api') {
      fetch('/api/hf/whoami', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (!cancelled && d) setHfIdentity({ name: d.name, orgs: d.orgs || [] }); })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [settings.tokens.hf, activeTab]);

  const handleTest = async (service: 'hfToken' | 'vercelToken' | 'githubToken' | 'dockerToken' | 'gitlabToken' | 'netlifyToken', value: string) => {
    if (!value) {
      addToast('error', `Enter a ${service} first`);
      return;
    }
    setTesting((p) => ({ ...p, [service]: true }));
    try {
      const r = await testToken(service, value);
      if (r.valid) {
        addToast('success', `${service} is valid`);
      } else {
        addToast('error', r.error);
      }
    } finally {
      setTesting((p) => ({ ...p, [service]: false }));
    }
  };

  const saveAllTokens = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        gitlabUrl: local.gitlabUrl,
      };
      if (local.hfToken) payload.hfToken = local.hfToken;
      if (local.vercelToken) payload.vercelToken = local.vercelToken;
      if (local.githubToken) payload.githubToken = local.githubToken;
      if (local.dockerToken) payload.dockerToken = local.dockerToken;
      if (local.gitlabToken) payload.gitlabToken = local.gitlabToken;
      if (local.netlifyToken) payload.netlifyToken = local.netlifyToken;
      await saveTokens(payload);
      addToast('success', 'All tokens saved');
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveLLM = async () => {
    setSaving(true);
    try {
      await saveLLMConfig({
        apiKey: local.llmApiKey,
        model: local.llmModel,
        baseUrl: local.llmBaseUrl || undefined,
      });
      addToast('success', 'LLM config saved');
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
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

  const t = settings.tokens;

  return (
    <div className="max-w-2xl space-y-6 animate-fadeIn">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'api' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key size={18} className="text-accent" /> API Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-xs text-text-muted">
              Tokens are encrypted at rest with AES-256-GCM. Leave blank to keep existing value.
            </p>

            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className={`w-1.5 h-1.5 rounded-full ${t.hf ? 'bg-emerald' : 'bg-text-muted'}`} />
              HF: {t.hf ? 'configured' : 'not set'}
              {hfIdentity && <span className="text-text-muted">— signed in as <span className="text-text-primary">{hfIdentity.name}</span>{hfIdentity.orgs.length > 0 ? `, ${hfIdentity.orgs.length} org${hfIdentity.orgs.length === 1 ? '' : 's'}` : ''}</span>}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <TokenInput id="hf" label="Hugging Face" value={local.hfToken} onChange={(v) => setLocal({ ...local, hfToken: v })} placeholder="hf_..." show={!!showTokens.hf} onToggleShow={() => toggleShow('hf')} />
              </div>
              <div className="pt-7">
                <Button type="button" onClick={() => handleTest('hfToken', local.hfToken)} loading={testing.hfToken} variant="secondary">Test</Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className={`w-1.5 h-1.5 rounded-full ${t.vercel ? 'bg-emerald' : 'bg-text-muted'}`} />
              Vercel: {t.vercel ? 'configured' : 'not set'}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <TokenInput id="vercel" label="Vercel" value={local.vercelToken} onChange={(v) => setLocal({ ...local, vercelToken: v })} placeholder="vercel_..." show={!!showTokens.vercel} onToggleShow={() => toggleShow('vercel')} />
              </div>
              <div className="pt-7">
                <Button type="button" onClick={() => handleTest('vercelToken', local.vercelToken)} loading={testing.vercelToken} variant="secondary">Test</Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className={`w-1.5 h-1.5 rounded-full ${t.github ? 'bg-emerald' : 'bg-text-muted'}`} />
              GitHub: {t.github ? 'configured' : 'not set'}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <TokenInput id="github" label="GitHub" value={local.githubToken} onChange={(v) => setLocal({ ...local, githubToken: v })} placeholder="ghp_..." show={!!showTokens.github} onToggleShow={() => toggleShow('github')} />
              </div>
              <div className="pt-7">
                <Button type="button" onClick={() => handleTest('githubToken', local.githubToken)} loading={testing.githubToken} variant="secondary">Test</Button>
              </div>
            </div>

            <div className="h-px bg-border-primary" />

            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Container size={16} className="text-info" />
              <span className={`w-1.5 h-1.5 rounded-full ${t.docker ? 'bg-emerald' : 'bg-text-muted'}`} />
              Docker Hub: {t.docker ? 'configured' : 'not set'}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <TokenInput id="docker" label="Docker Token" value={local.dockerToken} onChange={(v) => setLocal({ ...local, dockerToken: v })} placeholder="dckr_..." show={!!showTokens.docker} onToggleShow={() => toggleShow('docker')} />
              </div>
              <div className="pt-7">
                <Button type="button" onClick={() => handleTest('dockerToken', local.dockerToken)} loading={testing.dockerToken} variant="secondary">Test</Button>
              </div>
            </div>

            <div className="h-px bg-border-primary" />

            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <GitBranch size={16} className="text-amber" />
              <span className={`w-1.5 h-1.5 rounded-full ${t.gitlab ? 'bg-emerald' : 'bg-text-muted'}`} />
              GitLab: {t.gitlab ? 'configured' : 'not set'}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <TokenInput id="gitlab" label="GitLab Token" value={local.gitlabToken} onChange={(v) => setLocal({ ...local, gitlabToken: v })} placeholder="glpat_..." show={!!showTokens.gitlab} onToggleShow={() => toggleShow('gitlab')} />
              </div>
              <div className="pt-7">
                <Button type="button" onClick={() => handleTest('gitlabToken', local.gitlabToken)} loading={testing.gitlabToken} variant="secondary">Test</Button>
              </div>
            </div>
            <Input label="GitLab URL" type="text" placeholder="https://gitlab.com" value={local.gitlabUrl} onChange={(e) => setLocal({ ...local, gitlabUrl: e.target.value })} />

            <div className="h-px bg-border-primary" />

            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Globe size={16} className="text-emerald" />
              <span className={`w-1.5 h-1.5 rounded-full ${t.netlify ? 'bg-emerald' : 'bg-text-muted'}`} />
              Netlify: {t.netlify ? 'configured' : 'not set'}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <TokenInput id="netlify" label="Netlify Token" value={local.netlifyToken} onChange={(v) => setLocal({ ...local, netlifyToken: v })} placeholder="nfpt_..." show={!!showTokens.netlify} onToggleShow={() => toggleShow('netlify')} />
              </div>
              <div className="pt-7">
                <Button type="button" onClick={() => handleTest('netlifyToken', local.netlifyToken)} loading={testing.netlifyToken} variant="secondary">Test</Button>
              </div>
            </div>

            <Button onClick={saveAllTokens} loading={saving || loading} className="mt-2">
              <Save size={14} /> Save Tokens
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
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className={`w-1.5 h-1.5 rounded-full ${t.llm ? 'bg-emerald' : 'bg-text-muted'}`} />
              API key: {t.llm ? 'configured' : 'not set'}
            </div>
            <Select label="Provider" options={providerOptions} value={settings.llmConfig.provider} onChange={(e) => saveLLMConfig({ provider: e.target.value as LLMConfig['provider'] })} />
            <TokenInput id="llm" label="API Key" value={local.llmApiKey} onChange={(v) => setLocal({ ...local, llmApiKey: v })} placeholder="Enter provider API key..." show={!!showTokens.llm} onToggleShow={() => toggleShow('llm')} />
            <Select label="Model" options={modelOptions} value={local.llmModel} onChange={(e) => { setLocal({ ...local, llmModel: e.target.value }); saveLLMConfig({ model: e.target.value }); }} />
            {settings.llmConfig.provider === 'custom' && (
              <Input label="Base URL" type="text" placeholder="https://your-api.com/v1" value={local.llmBaseUrl} onChange={(e) => setLocal({ ...local, llmBaseUrl: e.target.value })} />
            )}
            <p className="text-xs text-text-muted">
              Configure provider + key + model, then click Save. After save, test by sending a message in the AI Agent page.
            </p>
            <div className="flex gap-2">
              <Button onClick={saveLLM} loading={saving || loading}><Save size={14} /> Save LLM Config</Button>
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
            <Select label="Permission Level" options={SCOPE_OPTIONS} value={settings.githubScope} onChange={(e) => { saveGitHubScope(e.target.value as 'read' | 'write' | 'admin'); }} />
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
