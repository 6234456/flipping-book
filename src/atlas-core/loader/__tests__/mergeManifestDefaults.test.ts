import { describe, it, expect } from 'vitest';
import { mergeManifestDefaults } from '../mergeManifestDefaults';

const REQUIRED = {
  schemaVersion: '1.0' as const,
  bookId: 'b-1',
  slug: 'b',
  title: { 'zh-CN': 'T' },
  version: '0.1.0',
};

describe('mergeManifestDefaults', () => {
  it('passes through required fields', () => {
    const m = mergeManifestDefaults({ ...REQUIRED });
    expect(m.bookId).toBe('b-1');
    expect(m.slug).toBe('b');
    expect(m.title['zh-CN']).toBe('T');
    expect(m.version).toBe('0.1.0');
  });

  it('throws when schemaVersion is missing', () => {
    expect(() => mergeManifestDefaults({ ...REQUIRED, schemaVersion: undefined } as never))
      .toThrow(/schemaVersion/);
  });

  it('throws when bookId is missing', () => {
    expect(() => mergeManifestDefaults({ ...REQUIRED, bookId: undefined } as never))
      .toThrow(/bookId/);
  });

  it('throws when slug is missing', () => {
    expect(() => mergeManifestDefaults({ ...REQUIRED, slug: undefined } as never))
      .toThrow(/slug/);
  });

  it('throws when title is missing', () => {
    expect(() => mergeManifestDefaults({ ...REQUIRED, title: undefined } as never))
      .toThrow(/title/);
  });

  it('throws when version is missing', () => {
    expect(() => mergeManifestDefaults({ ...REQUIRED, version: undefined } as never))
      .toThrow(/version/);
  });

  it('fills default reader when omitted', () => {
    const m = mergeManifestDefaults({ ...REQUIRED });
    expect(m.reader.defaultZoom).toBe('fit-page');
    expect(m.reader.enableKeyboardNavigation).toBe(true);
  });

  it('shallow-merges reader: overrides specified keys, defaults others', () => {
    const m = mergeManifestDefaults({
      ...REQUIRED,
      reader: { defaultZoom: 'fit-width' } as never,
    });
    expect(m.reader.defaultZoom).toBe('fit-width');
    expect(m.reader.enableKeyboardNavigation).toBe(true);
  });

  it('shallow-merges featureFlags', () => {
    const m = mergeManifestDefaults({
      ...REQUIRED,
      featureFlags: { notesDrawer: true } as never,
    });
    expect(m.featureFlags?.notesDrawer).toBe(true);
    expect(m.featureFlags?.comments).toBe(true);
  });

  it('shallow-merges navigation', () => {
    const m = mergeManifestDefaults({
      ...REQUIRED,
      navigation: { showTopBar: false } as never,
    });
    expect(m.navigation?.showTopBar).toBe(false);
    expect(m.navigation?.showBottomBar).toBe(true);
  });

  it('uses default supportedLocales when omitted', () => {
    const m = mergeManifestDefaults({ ...REQUIRED });
    expect(m.supportedLocales).toEqual(['zh-CN']);
  });

  it('respects bundle-provided supportedLocales', () => {
    const m = mergeManifestDefaults({ ...REQUIRED, supportedLocales: ['zh-CN', 'en-US'] });
    expect(m.supportedLocales).toEqual(['zh-CN', 'en-US']);
  });

  it('initializes pages and readingOrder as empty (filled later)', () => {
    const m = mergeManifestDefaults({ ...REQUIRED });
    expect(m.pages).toEqual([]);
    expect(m.readingOrder).toEqual([]);
  });

  it('uses default registries pointing at /book/', () => {
    const m = mergeManifestDefaults({ ...REQUIRED });
    expect(m.registries.imageAssets).toBe('/book/images');
    expect(m.registries.overlays).toBe('/book/overlays');
  });
});
