import { describe, it, expect } from 'vitest';
import { rowToSettings, settingsToRow, settingsToTokenStatus, isLegacyPlaintext } from './settings';

describe('settings converters', () => {
  it('round-trips a settings row', () => {
    const flat = {
      hfToken: 'hf_x',
      vercelToken: 'vc_y',
      githubToken: 'gh_z',
      dockerToken: '',
      gitlabToken: '',
      gitlabUrl: 'https://gitlab.com',
      netlifyToken: '',
      githubScope: 'write' as const,
      llmConfig: { provider: 'groq' as const, apiKey: 'k', model: 'llama-3.1-8b-instant' },
    };
    const row = settingsToRow(flat);
    const back = rowToSettings({ ...row, id: 'u' } as Parameters<typeof rowToSettings>[0]);
    expect(back.hfToken).toBe(flat.hfToken);
    expect(back.vercelToken).toBe(flat.vercelToken);
    expect(back.githubScope).toBe('write');
    expect(back.llmConfig.provider).toBe('groq');
  });

  it('masks tokens in token status', () => {
    const flat = {
      hfToken: 'x',
      vercelToken: 'x',
      githubToken: 'x',
      dockerToken: '',
      gitlabToken: '',
      gitlabUrl: 'https://gitlab.com',
      netlifyToken: '',
      githubScope: 'read' as const,
      llmConfig: { provider: 'groq' as const, apiKey: '', model: 'm' },
    };
    const status = settingsToTokenStatus(flat);
    expect(status.hf).toBe(true);
    expect(status.docker).toBe(false);
    expect(status.llm).toBe(false);
  });

  it('detects legacy plaintext', () => {
    expect(isLegacyPlaintext('hf_shorttoken')).toBe(true);
    expect(isLegacyPlaintext('enc:xyzabc...')).toBe(false);
  });
});
