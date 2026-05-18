import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchOptional } from '../fetchOptional';

describe('fetchOptional', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns parsed JSON array on 200', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ a: 1 }]), { status: 200 }),
    );
    const out = await fetchOptional<{ a: number }>('/x');
    expect(out).toEqual([{ a: 1 }]);
  });

  it('returns [] on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }));
    expect(await fetchOptional('/missing')).toEqual([]);
  });

  it('returns [] and warns on 500', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await fetchOptional('/broken')).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('returns [] when JSON is not an array', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ not: 'array' }), { status: 200 }),
    );
    expect(await fetchOptional('/wrong-shape')).toEqual([]);
  });

  it('returns [] and warns on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network down'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await fetchOptional('/offline')).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});
