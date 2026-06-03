'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSettings, AuthUser, GitHubScope, LLMConfig } from '@/types';

interface SettingsState {
  settings: UserSettings;
  auth: AuthUser;
  _hydrated: boolean;
  updateToken: (service: 'hf' | 'vercel' | 'github', token: string) => void;
  updateGitHubScope: (scope: GitHubScope) => void;
  updateLLMConfig: (config: Partial<LLMConfig>) => void;
  login: (email: string, password: string) => boolean;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + str.length;
}

const DEFAULT_SETTINGS: UserSettings = {
  hfToken: '',
  vercelToken: '',
  githubToken: '',
  githubScope: 'read',
  llmConfig: { provider: 'groq', apiKey: '', model: 'llama-3.1-8b-instant' },
  email: '',
  passwordHash: '',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      auth: { email: '', isLoggedIn: false },
      _hydrated: false,

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

      login: (email, password) => {
        const state = get();
        const hash = simpleHash(password + email);
        if (state.settings.email === email && state.settings.passwordHash === hash) {
          set({ auth: { email, isLoggedIn: true } });
          return true;
        }
        return false;
      },

      register: async (email, password) => {
        const state = get();
        if (state.settings.email) return false;
        const hash = simpleHash(password + email);
        set({
          settings: { ...state.settings, email, passwordHash: hash },
          auth: { email, isLoggedIn: true },
        });
        return true;
      },

      logout: () => set({ auth: { email: '', isLoggedIn: false } }),
    }),
    {
      name: 'mgmt-dash-settings',
      partialize: (state) => ({
        settings: state.settings,
        auth: state.auth,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<SettingsState>),
        _hydrated: true,
      }),
    }
  )
);
