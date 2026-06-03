import { describe, it, expect } from 'vitest';
import { encryptToken, decryptToken } from './crypto';
import { rowToSettings, settingsToRow } from './settings';

describe('settings security', () => {
  it('round-trips a token via settings', () => {
    const flat = {
      hfToken: 'hf_supersecret',
      vercelToken: 'vc_token',
      githubToken: '',
      dockerToken: '',
      gitlabToken: '',
      gitlabUrl: 'https://gitlab.com',
      netlifyToken: '',
      githubScope: 'read' as const,
      llmConfig: { provider: 'groq' as const, apiKey: 'gsk_xyz', model: 'llama-3.1-8b-instant' },
    };
    const row = settingsToRow(flat);
    expect(row.hf_token).not.toContain('hf_supersecret');
    expect(row.llm_api_key).not.toContain('gsk_xyz');
    const back = rowToSettings({ ...row, id: 'u' } as Parameters<typeof rowToSettings>[0]);
    expect(back.hfToken).toBe('hf_supersecret');
    expect(back.llmConfig.apiKey).toBe('gsk_xyz');
  });

  it('legacy plaintext token is detected', () => {
    const flat = {
      hfToken: 'hf_legacyvalue',
      vercelToken: '',
      githubToken: '',
      dockerToken: '',
      gitlabToken: '',
      gitlabUrl: '',
      netlifyToken: '',
      githubScope: 'read' as const,
      llmConfig: { provider: 'groq' as const, apiKey: '', model: 'm' },
    };
    const back = rowToSettings({ ...settingsToRow(flat), hf_token: 'hf_legacyvalue', id: 'u' } as Parameters<typeof rowToSettings>[0]);
    expect(back.hfToken).toBe('hf_legacyvalue');
  });

  it('github scope must be a valid value', () => {
    const flat = {
      hfToken: '', vercelToken: '', githubToken: 'gh_x', dockerToken: '',
      gitlabToken: '', gitlabUrl: '', netlifyToken: '',
      githubScope: 'admin' as const,
      llmConfig: { provider: 'groq' as const, apiKey: '', model: 'm' },
    };
    const back = rowToSettings({ ...settingsToRow(flat), id: 'u' } as Parameters<typeof rowToSettings>[0]);
    expect(['read', 'write', 'admin']).toContain(back.githubScope);
  });

  it('encrypted ciphertext has random IV per call', () => {
    const a = encryptToken('same-input');
    const b = encryptToken('same-input');
    expect(a).not.toBe(b);
    expect(decryptToken(a)).toBe('same-input');
    expect(decryptToken(b)).toBe('same-input');
  });
});
