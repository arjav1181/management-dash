'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { LLMConfig, GitHubScope, TokenStatus } from '@/types';

export interface ClientSettings {
  githubScope: GitHubScope;
  gitlabUrl: string;
  llmConfig: { provider: LLMConfig['provider']; model: string; baseUrl?: string };
  tokens: TokenStatus;
}

interface SettingsState {
  hydrated: boolean;
  user: { id: string; email: string } | null;
  settings: ClientSettings;
  loading: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  saveTokens: (input: {
    hfToken?: string;
    vercelToken?: string;
    githubToken?: string;
    dockerToken?: string;
    gitlabToken?: string;
    gitlabUrl?: string;
    netlifyToken?: string;
    llmApiKey?: string;
    llmModel?: string;
    llmBaseUrl?: string;
  }) => Promise<void>;
  saveGitHubScope: (scope: GitHubScope) => Promise<void>;
  saveLLMConfig: (config: { provider?: LLMConfig['provider']; model?: string; baseUrl?: string; apiKey?: string }) => Promise<void>;
  hasToken: (service: 'hf' | 'vercel' | 'github' | 'docker' | 'gitlab' | 'netlify') => boolean;
  hasLLM: () => boolean;
  testToken: (
    service: 'hfToken' | 'vercelToken' | 'githubToken' | 'dockerToken' | 'gitlabToken' | 'netlifyToken',
    token: string
  ) => Promise<{ valid: true; identity?: unknown } | { valid: false; error: string }>;
}

const DEFAULT_SETTINGS: ClientSettings = {
  githubScope: 'read',
  gitlabUrl: 'https://gitlab.com',
  llmConfig: { provider: 'groq', model: 'llama-3.1-8b-instant' },
  tokens: { hf: false, vercel: false, github: false, docker: false, gitlab: false, netlify: false, llm: false },
};

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  hydrated: false,
  user: null,
  settings: DEFAULT_SETTINGS,
  loading: false,

  init: async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      set({ hydrated: true, user: null });
      return;
    }
    const user = { id: session.user.id, email: session.user.email || '' };
    set({ user, hydrated: true });
    await get().refreshSettings();
  },

  login: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const user = { id: session.user.id, email: session.user.email || '' };
    set({ user, hydrated: true });
    await get().refreshSettings();
    return true;
  },

  register: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    const user = { id: session.user.id, email: session.user.email || '' };
    set({ user, hydrated: true, settings: DEFAULT_SETTINGS });
    return true;
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, settings: DEFAULT_SETTINGS });
  },

  refreshSettings: async () => {
    try {
      const res = await fetch('/api/settings/config', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      set({
        settings: {
          githubScope: data.githubScope ?? 'read',
          gitlabUrl: data.gitlabUrl ?? 'https://gitlab.com',
          llmConfig: {
            provider: data.llmProvider ?? 'groq',
            model: data.llmModel ?? 'llama-3.1-8b-instant',
            baseUrl: data.llmBaseUrl || undefined,
          },
          tokens: data.tokens ?? DEFAULT_SETTINGS.tokens,
        },
      });
    } catch {}
  },

  saveTokens: async (input) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/settings/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `Save failed (${res.status})`);
      }
      await get().refreshSettings();
    } finally {
      set({ loading: false });
    }
  },

  testToken: async (service: 'hfToken' | 'vercelToken' | 'githubToken' | 'dockerToken' | 'gitlabToken' | 'netlifyToken', token: string) => {
    const res = await fetch('/api/settings/test-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data as { error?: string }).error || `Test failed (${res.status})`;
      return { valid: false, error: msg } as const;
    }
    return { valid: true, identity: (data as { identity?: unknown }).identity } as const;
  },

  saveGitHubScope: async (scope) => {
    const res = await fetch('/api/settings/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ githubScope: scope }),
    });
    if (res.ok) await get().refreshSettings();
  },

  saveLLMConfig: async (config) => {
    const res = await fetch('/api/settings/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) await get().refreshSettings();
  },

  hasToken: (service) => {
    const t = get().settings.tokens;
    return !!t[service];
  },

  hasLLM: () => !!get().settings.tokens.llm,
}));
