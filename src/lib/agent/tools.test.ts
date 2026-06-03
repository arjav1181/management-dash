import { describe, it, expect } from 'vitest';
import { AGENT_TOOLS, toolRequiresToken } from './tools';

describe('agent tools', () => {
  it('exposes a non-empty registry', () => {
    expect(AGENT_TOOLS.length).toBeGreaterThan(0);
  });

  it('all tools have names, descriptions, and parameters', () => {
    for (const t of AGENT_TOOLS) {
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.parameters.type).toBe('object');
      expect(t.execute).toBeTypeOf('function');
    }
  });

  it('flags token requirement per tool', () => {
    const settings = {
      hfToken: 'x', vercelToken: '', githubToken: '', dockerToken: '',
      gitlabToken: '', gitlabUrl: 'https://gitlab.com', netlifyToken: '',
      githubScope: 'read' as const,
      llmConfig: { provider: 'groq' as const, apiKey: '', model: 'm' },
    };
    const hfTool = AGENT_TOOLS.find((t) => t.platform === 'hf');
    const vercelTool = AGENT_TOOLS.find((t) => t.platform === 'vercel');
    if (hfTool) expect(toolRequiresToken(hfTool, settings)).toBeNull();
    if (vercelTool) expect(toolRequiresToken(vercelTool, settings)).toBe('Vercel');
  });
});
