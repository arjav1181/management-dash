import { describe, it, expect } from 'vitest';
import { extractFallbackToolCalls } from './llm';

describe('llm fallback tool calls', () => {
  it('parses fenced JSON', () => {
    const tools = [{ name: 'list_hf_spaces', description: '', parameters: { type: 'object', properties: {}, required: [] } }];
    const text = 'I will check ```json\n{"name": "list_hf_spaces", "arguments": {}}\n```';
    const calls = extractFallbackToolCalls(text, tools as never);
    expect(calls.length).toBe(1);
    expect(calls[0].name).toBe('list_hf_spaces');
  });

  it('parses bare JSON object', () => {
    const tools = [{ name: 'foo', description: '', parameters: { type: 'object', properties: {}, required: [] } }];
    const text = 'Plan: {"name":"foo","arguments":{"x":1}}';
    const calls = extractFallbackToolCalls(text, tools as never);
    expect(calls.length).toBe(1);
    expect(calls[0].arguments).toEqual({ x: 1 });
  });

  it('ignores unknown tools', () => {
    const tools = [{ name: 'known', description: '', parameters: { type: 'object', properties: {}, required: [] } }];
    const text = '```json\n{"name":"unknown","arguments":{}}\n```';
    const calls = extractFallbackToolCalls(text, tools as never);
    expect(calls.length).toBe(0);
  });

  it('returns empty for plain prose', () => {
    const tools: unknown[] = [];
    expect(extractFallbackToolCalls('Just chatting', tools as never)).toEqual([]);
  });
});
