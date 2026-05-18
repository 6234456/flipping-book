import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import sampleCatalog from './fixtures/sample-catalog.json';
import sampleOverlay from '../../../atlas-core/overlay/__tests__/fixtures/sample-overlay.json';
import { loadDeEuVat, __resetCache } from '../loader';

const BASE = '/books/de-eu-vat/v0.6.1';

function setupFetchMock(opts?: { catalogOk?: boolean; overlayOkExcept?: string }) {
  const catalogOk = opts?.catalogOk ?? true;
  const overlayOkExcept = opts?.overlayOkExcept;

  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith('/data/page_catalog.json')) {
      return new Response(catalogOk ? JSON.stringify(sampleCatalog) : '', {
        status: catalogOk ? 200 : 500,
      });
    }
    if (url.includes('/overlays/')) {
      const file = url.split('/').pop() ?? '';
      const secCode = file.replace('_interactive_overlay_v0.6.1.json', '');
      if (overlayOkExcept === secCode) {
        return new Response('', { status: 404 });
      }
      const overlay = { ...sampleOverlay, pageId: `${secCode}-page`, sectionCode: secCode };
      return new Response(JSON.stringify(overlay), { status: 200 });
    }
    return new Response('', { status: 404 });
  });
}

describe('loadDeEuVat', () => {
  beforeEach(() => {
    __resetCache();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns manifest + images + overlays + glossary', async () => {
    setupFetchMock();
    const data = await loadDeEuVat(BASE);
    expect(data.manifest.bookId).toBe('de-eu-vat-atlas');
    expect(data.manifest.readingOrder).toHaveLength(2);
    expect(data.images).toHaveLength(2);
    expect(data.overlays).toHaveLength(2);
    expect(Array.isArray(data.glossary)).toBe(true);
  });

  it('caches the promise across repeat calls', async () => {
    const fetchMock = setupFetchMock();
    await loadDeEuVat(BASE);
    await loadDeEuVat(BASE);
    const catalogCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).endsWith('/data/page_catalog.json'),
    );
    expect(catalogCalls).toHaveLength(1);
  });

  it('throws when page_catalog cannot be loaded', async () => {
    setupFetchMock({ catalogOk: false });
    await expect(loadDeEuVat(BASE)).rejects.toThrow();
  });

  it('continues with empty regions when a single overlay fails', async () => {
    setupFetchMock({ overlayOkExcept: 'TOC' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const data = await loadDeEuVat(BASE);
    const tocOverlay = data.overlays.find((o) => o.overlayId === 'TOC-overlay-v06');
    expect(tocOverlay?.regions).toEqual([]);
    expect(tocOverlay?.hotspots).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});
