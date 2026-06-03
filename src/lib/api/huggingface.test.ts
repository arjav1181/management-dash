import { describe, it, expect } from 'vitest';

interface MockResponseInit {
  status?: number;
  ok?: boolean;
  body?: string;
  json?: unknown;
}

function mockFetchResponse(init: MockResponseInit): Response {
  return new Response(init.json !== undefined ? JSON.stringify(init.json) : (init.body ?? ''), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const originalFetch = globalThis.fetch;
afterEachRestore();

function afterEachRestore() {
  // no-op
}

describe('hf api', () => {
  it('listSpaces returns parsed spaces', async () => {
    const whoami = { name: 'alice', orgs: [{ name: 'org1' }] };
    const spaces = [{ id: 'alice/foo', sdk: 'docker', status: 'running', likes: 0, private: false, createdAt: '', lastModified: '', runtime: { cpu: 'cpu-basic', memory: '16GB' } }];
    let n = 0;
    globalThis.fetch = (async () => {
      n++;
      if (n === 1) return mockFetchResponse({ json: whoami });
      return mockFetchResponse({ json: spaces });
    }) as typeof fetch;
    const { listSpaces } = await import('./huggingface');
    const result = await listSpaces('token');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('alice/foo');
    expect(result[0].name).toBe('foo');
    globalThis.fetch = originalFetch;
  });

  it('getSpaceStatus returns status field', async () => {
    globalThis.fetch = (async () => mockFetchResponse({ json: { status: 'running' } })) as typeof fetch;
    const { getSpaceStatus } = await import('./huggingface');
    const s = await getSpaceStatus('t', 'a/b');
    expect(s).toBe('running');
    globalThis.fetch = originalFetch;
  });
});
