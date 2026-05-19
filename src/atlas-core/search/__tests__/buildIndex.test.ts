import { describe, it, expect } from 'vitest';
import { buildIndex } from '../buildIndex';
import { createBookRegistry } from '../../registry';
import type { BookManifest } from '../../types/manifest';

function makeRegistry(overrides: Partial<{
  glossary: unknown[];
  legalRefs: unknown[];
  scenarios: unknown[];
  notes: unknown[];
  contents: unknown[];
}> = {}) {
  const manifest = {
    schemaVersion: '1.0',
    bookId: 'b-1', slug: 'b', version: '0.1',
    title: { 'zh-CN': 'Test' },
    defaultLocale: 'zh-CN', supportedLocales: ['zh-CN'],
    visualSystem: 'VAT_ATLAS_MAGAZINE_V2',
    reader: { defaultMode: 'auto', allowModeSwitch: false, transition: 'fade',
      enableKeyboardNavigation: true, enableSwipeNavigation: true, enableProgressBar: true,
      enableTableOfContents: true, defaultZoom: 'fit-page',
      spreadBehavior: { desktopDefault: 'single', mobileDefault: 'single', spreadPageAdvance: 'by-page',
        keyboard: { arrowLeft: 'previous', arrowRight: 'next' },
        clickZones: { enabled: false, leftEdgePercent: 0, rightEdgePercent: 0 } } },
    pages: [
      { pageId: 'p-1', slug: '/page/p-1', type: 'imageOverlay', sectionCode: '01', pageNumber: 1,
        title: { 'zh-CN': 'Framework' }, subtitle: { 'zh-CN': 'Five steps' },
        layout: { mode: 'single', format: 'custom', size: { preset: 'custom', width: 1086, height: 1448 }, background: 'image' } },
    ] as unknown,
    readingOrder: ['p-1'],
    registries: { imageAssets: '', overlays: '', glossary: '' },
  } as unknown as BookManifest;

  return createBookRegistry(
    manifest, [], [],
    (overrides.glossary ?? []) as never,
    (overrides.legalRefs ?? []) as never,
    (overrides.scenarios ?? []) as never,
    (overrides.notes ?? []) as never,
    (overrides.contents ?? []) as never,
    [],
  );
}

describe('buildIndex', () => {
  it('always produces one page entry per manifest page', () => {
    const items = buildIndex(makeRegistry());
    const pages = items.filter((i) => i.category === 'page');
    expect(pages).toHaveLength(1);
    expect(pages[0].id).toBe('p-1');
    expect(pages[0].display.primary).toBe('Framework');
    expect(pages[0].display.secondary).toBe('Five steps');
    expect(pages[0].haystack).toContain('framework');
    expect(pages[0].haystack).toContain('five steps');
  });

  it('includes glossary terms when present', () => {
    const items = buildIndex(makeRegistry({
      glossary: [{
        termId: 'werklieferung', zh: '加工供货', original: 'Werklieferung',
        abbreviation: 'WL', category: 'goods',
        shortDefinition: '承包人提供主材并交付', firstMentionFormat: '加工供货 (Werklieferung)',
      }],
    }));
    const terms = items.filter((i) => i.category === 'glossary');
    expect(terms).toHaveLength(1);
    expect(terms[0].id).toBe('werklieferung');
    expect(terms[0].display.primary).toContain('加工供货');
    expect(terms[0].haystack).toMatch(/werklieferung/);
    expect(terms[0].haystack).toMatch(/承包人/);
    expect(terms[0].haystack).toMatch(/wl/);
  });

  it('includes legalRefs / scenarios / notes / contents when present', () => {
    const items = buildIndex(makeRegistry({
      legalRefs: [{ legalRefId: '§ 25b', jurisdiction: 'DE', source: 'UStG', ref: '§ 25b',
        title: { 'zh-CN': '三角贸易' }, summary: { 'zh-CN': '简化制度' } }],
      scenarios: [{ scenarioId: 'sc-1', category: 'triangulation',
        title: { 'zh-CN': '三角贸易' }, oneSentence: { 'zh-CN': '中间商免征' } }],
      notes: [{ noteId: 'n-1', bookId: 'b-1', pageId: 'p-1', noteType: 'supplement', visibility: 'reader',
        title: { 'zh-CN': '五步原理' }, body: [{ type: 'text', value: '判例溯源' }] }],
      contents: [{ contentId: 'c-1', pageId: 'p-1', blocks: [
        { blockId: 'b1', type: 'paragraph', text: [{ type: 'text', value: '主体段落' }] },
      ] }],
    }));
    expect(items.filter((i) => i.category === 'legal')).toHaveLength(1);
    expect(items.filter((i) => i.category === 'scenario')).toHaveLength(1);
    expect(items.filter((i) => i.category === 'note')).toHaveLength(1);
    expect(items.filter((i) => i.category === 'content')).toHaveLength(1);
  });

  it('haystack is lowercased', () => {
    const items = buildIndex(makeRegistry());
    expect(items[0].haystack).toBe(items[0].haystack.toLowerCase());
  });
});
