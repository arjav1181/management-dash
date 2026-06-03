'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { fetchSettings, saveSettings } from '@/lib/supabase/db';
import type { LLMConfig, GitHubScope } from '@/types';

interface FlatSettings {
  hfToken: string;
  vercelToken: string;
  githubToken: string;
  githubScope: GitHubScope;
  llmConfig: LLMConfig;
}

interface SettingsState {
  hydrated: boolean;
  user: { id: string; email: string } | null;
  settings: FlatSettings;
  loading: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateToken: (service: 'hf' | 'vercel' | 'github', token: string) => void;
  updateGitHubScope: (scope: GitHubScope) => void;
  updateLLMConfig: (config: Partial<LLMConfig>) => void;
  persistSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: FlatSettings = {
  hfToken: '',
  vercelToken: '',
  githubToken: '',
  githubScope: 'read',
  llmConfig: { provider: 'groq', apiKey: '', model: 'llama-3.1-8b-instant' },
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
    const { settings } = await fetchSettings(supabase);
    set({ hydrated: true, user, settings });
  },

  login: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const user = { id: session.user.id, email: session.user.email || '' };
    const { settings } = await fetchSettings(supabase);
    set({ user, settings, hydrated: true });
    return true;
  },

  register: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return false;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const user = { id: session.user.id, email: session.user.email || '' };
    await fetchSettings(supabase);
    set({ user, settings: DEFAULT_SETTINGS, hydrated: true });
    return true;
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, settings: DEFAULT_SETTINGS });
  },

  updateToken: (service, token) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...(service === 'hf' && { hfToken: token }),
        ...(service === 'vercel' && { vercelToken: token }),
        ...(service === 'github' && { githubToken: token }),
      },
    })),

  updateGitHubScope: (scope) =>
    set((state) => ({
      settings: { ...state.settings, githubScope: scope },
    })),

  updateLLMConfig: (config) =>
    set((state) => ({
      settings: {
        ...state.settings,
        llmConfig: { ...state.settings.llmConfig, ...config },
      },
    })),

  persistSettings: async () => {
    const { user, settings } = get();
    if (!user) return;
    const supabase = createClient();
    await saveSettings(supabase, settings);
  },
}));
