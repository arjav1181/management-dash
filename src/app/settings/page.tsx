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
import { Key, Bot, Shield, Eye, EyeOff, Save } from 'lucide-react';

const SCOPE_OPTIONS = [
  { value: 'read', label: 'Read-only (repos, commits, issues, CI)' },
  { value: 'write', label: 'Read + Write (create issues, comment, merge)' },
  { value: 'admin', label: 'Admin (full repo management)' },
];

export default function SettingsPage() {
  const { settings, updateToken, updateGitHubScope, updateLLMConfig, persistSettings } = useSettingsStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState('api');
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState({
    hfToken: '',
    vercelToken: '',
    githubToken: '',
    llmApiKey: '',
    llmModel: '',
    llmBaseUrl: '',
  });

  useEffect(() => {
    setLocal({
      hfToken: settings.hfToken,
      vercelToken: settings.vercelToken,
      githubToken: settings.githubToken,
      llmApiKey: settings.llmConfig.apiKey,
      llmModel: settings.llmConfig.model,
      llmBaseUrl: settings.llmConfig.baseUrl || '',
    });
  }, [settings]);

  const saveTokens = async () => {
    setSaving(true);
    updateToken('hf', local.hfToken);
    updateToken('vercel', local.vercelToken);
    updateToken('github', local.githubToken);
    await persistSettings();
    addToast('success', 'API keys saved');
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
    { id: 'api', label: 'API Keys' },
    { id: 'llm', label: 'AI Agent' },
    { id: 'github', label: 'GitHub Scope' },
  ];

  const toggleShow = (key: string) =>
    setShowTokens((prev) => ({ ...prev, [key]: !prev[key] }));

  const providerOptions = LLM_PROVIDERS.map((p) => ({
    value: p.value,
    label: p.label,
  }));

  const currentProvider = LLM_PROVIDERS.find((p) => p.value === settings.llmConfig.provider);
  const modelOptions = (currentProvider?.models || []).map((m) => ({ value: m, label: m }));

  return (
    <div className="max-w-2xl space-y-6 animate-fadeIn">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'api' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key size={18} className="text-accent" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                label="Hugging Face Token"
                type={showTokens.hf ? 'text' : 'password'}
                placeholder="hf_..."
                value={local.hfToken}
                onChange={(e) => setLocal({ ...local, hfToken: e.target.value })}
              />
              <button
                onClick={() => toggleShow('hf')}
                className="absolute right-3 top-[38px] text-text-muted hover:text-text-primary"
              >
                {showTokens.hf ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="Vercel Token"
                type={showTokens.vercel ? 'text' : 'password'}
                placeholder="vercel_..."
                value={local.vercelToken}
                onChange={(e) => setLocal({ ...local, vercelToken: e.target.value })}
              />
              <button
                onClick={() => toggleShow('vercel')}
                className="absolute right-3 top-[38px] text-text-muted hover:text-text-primary"
              >
                {showTokens.vercel ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="relative">
              <Input
                label="GitHub Token"
                type={showTokens.github ? 'text' : 'password'}
                placeholder="ghp_..."
                value={local.githubToken}
                onChange={(e) => setLocal({ ...local, githubToken: e.target.value })}
              />
              <button
                onClick={() => toggleShow('github')}
                className="absolute right-3 top-[38px] text-text-muted hover:text-text-primary"
              >
                {showTokens.github ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Button onClick={saveTokens} loading={saving}>
              <Save size={14} />
              Save Tokens
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'llm' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot size={18} className="text-accent" />
              AI Agent Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Provider"
              options={providerOptions}
              value={settings.llmConfig.provider}
              onChange={(e) => updateLLMConfig({ provider: e.target.value as LLMConfig['provider'] })}
            />
            <div className="relative">
              <Input
                label="API Key"
                type={showTokens.llm ? 'text' : 'password'}
                placeholder="Enter provider API key..."
                value={local.llmApiKey}
                onChange={(e) => setLocal({ ...local, llmApiKey: e.target.value })}
              />
              <button
                onClick={() => toggleShow('llm')}
                className="absolute right-3 top-[38px] text-text-muted hover:text-text-primary"
              >
                {showTokens.llm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Select
              label="Model"
              options={modelOptions}
              value={local.llmModel}
              onChange={(e) => {
                setLocal({ ...local, llmModel: e.target.value });
                updateLLMConfig({ model: e.target.value });
              }}
            />
            {settings.llmConfig.provider === 'custom' && (
              <Input
                label="Base URL"
                type="text"
                placeholder="https://your-api.com/v1"
                value={local.llmBaseUrl}
                onChange={(e) => setLocal({ ...local, llmBaseUrl: e.target.value })}
              />
            )}
            <div className="flex gap-2">
              <Button onClick={saveLLM} loading={saving}>
                <Save size={14} />
                Save LLM Config
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'github' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={18} className="text-accent" />
              GitHub Scope
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Permission Level"
              options={SCOPE_OPTIONS}
              value={settings.githubScope}
              onChange={(e) => { updateGitHubScope(e.target.value as 'read' | 'write' | 'admin'); }}
            />
            <Button
              size="sm"
              onClick={async () => { setSaving(true); await persistSettings(); addToast('success', 'GitHub scope saved'); setSaving(false); }}
              loading={saving}
            >
              <Save size={14} />
              Save Scope
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
