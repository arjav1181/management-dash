import { describe, it, expect, afterEach } from 'vitest';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    return handler(url, init);
  }) as typeof fetch;
}

describe('hf api', () => {
  it('whoami parses v2 response', async () => {
    mockFetch(() => mockResponse({ id: 'u1', name: 'alice', fullname: 'Alice', orgs: [{ name: 'org1', fullname: 'Org' }], type: 'user', isPro: false }));
    const { whoami } = await import('./huggingface');
    const me = await whoami('token');
    expect(me.name).toBe('alice');
    expect(me.orgs).toHaveLength(1);
    expect(me.orgs[0].name).toBe('org1');
  });

  it('listSpaces uses /me/spaces and parses full payload', async () => {
    mockFetch(() => mockResponse([
      { id: 'alice/foo', sdk: 'docker', status: 'running', likes: 5, private: false, createdAt: '2024-01-01', lastModified: '2024-06-01', runtime: { cpu: 'cpu-basic', memory: '16GB' } },
    ]));
    const { listSpaces } = await import('./huggingface');
    const result = await listSpaces('token');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('alice/foo');
    expect(result[0].name).toBe('foo');
    expect(result[0].url).toBe('https://huggingface.co/spaces/alice/foo');
  });

  it('listSpaces returns [] on empty payload', async () => {
    mockFetch(() => mockResponse([]));
    const { listSpaces } = await import('./huggingface');
    const result = await listSpaces('token');
    expect(result).toEqual([]);
  });

  it('getSpaceStatus throws on 401 with typed code', async () => {
    mockFetch(() => mockResponse({ error: 'invalid token' }, 401));
    const { getSpaceStatus, HFError } = await import('./huggingface');
    await expect(getSpaceStatus('bad', 'a/b')).rejects.toBeInstanceOf(HFError);
    try { await getSpaceStatus('bad', 'a/b'); } catch (e) {
      expect((e as InstanceType<typeof HFError>).code).toBe('unauthorized');
    }
  });

  it('getSpaceStatus throws on 404', async () => {
    mockFetch(() => mockResponse('not found', 404));
    const { getSpaceStatus, HFError } = await import('./huggingface');
    try { await getSpaceStatus('t', 'missing/x'); } catch (e) {
      expect((e as InstanceType<typeof HFError>).code).toBe('not_found');
    }
  });

  it('does not retry on 401', async () => {
    let calls = 0;
    mockFetch(() => { calls++; return mockResponse('nope', 401); });
    const { listSpaces } = await import('./huggingface');
    await expect(listSpaces('bad')).rejects.toThrow();
    expect(calls).toBe(1);
  });

  it('retries on 500 then succeeds', async () => {
    let calls = 0;
    mockFetch(() => {
      calls++;
      if (calls < 2) return mockResponse('boom', 500);
      return mockResponse([]);
    });
    const { listSpaces } = await import('./huggingface');
    const r = await listSpaces('t');
    expect(r).toEqual([]);
    expect(calls).toBe(2);
  });

  it('throws HFError on timeout', async () => {
    mockFetch(() => new Promise<Response>((_, reject) => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      reject(err);
    }));
    const { listSpaces, HFError } = await import('./huggingface');
    try { await listSpaces('t'); } catch (e) {
      expect((e as InstanceType<typeof HFError>).code).toBe('timeout');
    }
  });

  it('getSpaceWssUrl builds correct host', async () => {
    const { getSpaceWssUrl } = await import('./huggingface');
    expect(getSpaceWssUrl('alice/foo')).toBe('wss://foo.hf.space/_mgmt-dash/ws/');
    expect(getSpaceWssUrl('alice/foo', '/x/')).toBe('wss://foo.hf.space/x/');
  });
});
