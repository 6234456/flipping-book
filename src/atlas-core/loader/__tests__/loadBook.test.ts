import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import minimalManifest from './fixtures/minimal-manifest.json';
import fullManifest from './fixtures/full-manifest.json';
import samplePages from './fixtures/sample-pages.json';
import sampleGlossary from './fixtures/sample-glossary.json';
import sampleOverlay from '../../overlay/__tests__/fixtures/sample-overlay.json';
import { loadBook, __resetCache } from '../loadBook';

const BASE = '/book';

type FetchSpec = {
  manifest?: object | null;
  manifestStatus?: number;
  pages?: object | null;
  pagesStatus?: number;
  glossary?: object | null;
  notes?: object | null;
  scenarios?: object | null;
  contents?: object | null;
  legalRefs?: object | null;
  overlayMissing?: string[]; // sectionCodes whose overlay 404s
};

function setupFetchMock(spec: FetchSpec = {}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    const json = (body: object | null | undefined, fallback: object) =>
      new Response(JSON.stringify(body ?? fallback), { status: 200 });
    const r404 = () => new Response('', { status: 404 });

    if (url.endsWith('/manifest.json')) {
      if (spec.manifest === null) return r404();
      if (spec.manifestStatus && spec.manifestStatus !== 200)
        return new Response('', { status: spec.manifestStatus });
      return json(spec.manifest, fullManifest);
    }
    if (url.endsWith('/data/pages.json')) {
      if (spec.pages === null) return r404();
      return json(spec.pages, samplePages);
    }
    if (url.endsWith('/data/glossary.json')) {
      return spec.glossary === null ? r404() : json(spec.glossary, sampleGlossary);
    }
    if (url.endsWith('/data/notes.json')) {
      return spec.notes === null ? r404() : json(spec.notes, []);
    }
    if (url.endsWith('/data/scenarios.json')) {
      return spec.scenarios === null ? r404() : json(spec.scenarios, []);
    }
    if (url.endsWith('/data/contents.json')) {
      return spec.contents === null ? r404() : json(spec.contents, []);
    }
    if (url.endsWith('/data/legal-refs.json')) {
      return spec.legalRefs === null ? r404() : json(spec.legalRefs, []);
    }
    if (url.includes('/overlays/')) {
      const file = url.split('/').pop() ?? '';
      const sectionCode = file.replace('_interactive_overlay_v0.6.1.json', '');
      if (spec.overlayMissing?.includes(sectionCode)) return r404();
      const overlay = { ...sampleOverlay, pageId: `${sectionCode}-page`, sectionCode };
      return new Response(JSON.stringify(overlay), { status: 200 });
    }
    return new Response('', { status: 404 });
  });
}

describe('loadBook', () => {
  beforeEach(() => __resetCache());
  afterEach(() => vi.restoreAllMocks());

  it('returns LoadedBook with all sections populated when full bundle is served', async () => {
    setupFetchMock();
    const data = await loadBook(BASE);
    expect(data.manifest.bookId).toBe('de-eu-vat-atlas');
    expect(data.manifest.readingOrder).toEqual(['toc', '01-vat-framework']);
    expect(data.images).toHaveLength(2);
    expect(data.overlays).toHaveLength(2);
    expect(data.glossary).toHaveLength(1);
    expect(data.notes).toEqual([]);
    expect(data.scenarios).toEqual([]);
    expect(data.contents).toEqual([]);
    expect(data.legalRefs).toEqual([]);
  });

  it('applies manifest defaults when only minimal fields are provided', async () => {
    setupFetchMock({ manifest: minimalManifest });
    const data = await loadBook(BASE);
    expect(data.manifest.featureFlags?.comments).toBe(true);
    expect(data.manifest.reader.defaultZoom).toBe('fit-page');
  });

  it('shallow-merges partial reader override', async () => {
    setupFetchMock({ manifest: fullManifest });
    const data = await loadBook(BASE);
    expect(data.manifest.reader.defaultZoom).toBe('fit-width');
    expect(data.manifest.reader.enableKeyboardNavigation).toBe(true);
  });

  it('throws when manifest.json returns 404', async () => {
    setupFetchMock({ manifest: null });
    await expect(loadBook(BASE)).rejects.toThrow(/manifest/);
  });

  it('throws when manifest is missing a required field', async () => {
    setupFetchMock({ manifest: { schemaVersion: '1.0' } });
    await expect(loadBook(BASE)).rejects.toThrow(/bookId|slug|title|version/);
  });

  it('throws when pages.json is empty', async () => {
    setupFetchMock({ pages: [] });
    await expect(loadBook(BASE)).rejects.toThrow(/pages/);
  });

  it('falls back to [] for missing glossary.json', async () => {
    setupFetchMock({ glossary: null });
    const data = await loadBook(BASE);
    expect(data.glossary).toEqual([]);
  });

  it('falls back to empty overlay for a single missing overlay JSON', async () => {
    setupFetchMock({ overlayMissing: ['01'] });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const data = await loadBook(BASE);
    const broken = data.overlays.find((o) => o.overlayId === '01-overlay-v06');
    expect(broken?.regions).toEqual([]);
    expect(broken?.hotspots).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });

  it('caches the result and does not refetch on repeat call with same baseUrl', async () => {
    const fetchMock = setupFetchMock();
    await loadBook(BASE);
    await loadBook(BASE);
    const manifestCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).endsWith('/manifest.json'),
    );
    expect(manifestCalls).toHaveLength(1);
  });

  it('rebuilds cache when baseUrl differs', async () => {
    const fetchMock = setupFetchMock();
    await loadBook('/book');
    await loadBook('/other-book');
    const manifestCalls = fetchMock.mock.calls.filter((c) =>
      String(c[0]).endsWith('/manifest.json'),
    );
    expect(manifestCalls).toHaveLength(2);
  });

  it('per-page notes / contentId / scenarioIds / legalRefIds are propagated to PageManifest', async () => {
    setupFetchMock({
      pages: [
        {
          sectionCode: '01',
          pageId: '01-vat-framework',
          title: 'P1',
          imageFile: 'p1.png',
          canvas: { width: 1086, height: 1448 },
          noteIds: ['n1', 'n2'],
          contentId: 'c1',
          scenarioIds: ['s1'],
          legalRefIds: ['§ 1'],
        },
      ],
    });
    const data = await loadBook(BASE);
    const page = data.manifest.pages[0];
    expect(page.notes?.noteIds).toEqual(['n1', 'n2']);
    expect(page.content?.contentId).toBe('c1');
    expect(page.scenarioIds).toEqual(['s1']);
    expect(page.legalRefIds).toEqual(['§ 1']);
  });

  it('builds image src under baseUrl/images/', async () => {
    setupFetchMock();
    const data = await loadBook(BASE);
    expect(data.images[0].src).toBe('/book/images/TOC_current_final.png');
    expect(data.images[1].src).toBe('/book/images/01_current_final.png');
  });
});
