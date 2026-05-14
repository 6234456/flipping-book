import { describe, it, expect } from 'vitest';
import { validateManifest } from '../validateManifest';
import type { BookManifest } from '../../types/manifest';

function makeManifest(readingOrder: string[], pages: BookManifest['pages']): BookManifest {
  return {
    schemaVersion: "1.0",
    bookId: "test",
    slug: "test",
    title: { "zh-CN": "测试" },
    version: "0.1",
    defaultLocale: "zh-CN",
    supportedLocales: ["zh-CN"],
    visualSystem: "VAT_ATLAS_MAGAZINE_V2",
    reader: {
      defaultMode: "auto", allowModeSwitch: true,
      transition: "magazine-slide",
      enableKeyboardNavigation: true, enableSwipeNavigation: true,
      enableProgressBar: true, enableTableOfContents: true,
      defaultZoom: "fit-width",
      spreadBehavior: {
        desktopDefault: "spread", mobileDefault: "single",
        spreadPageAdvance: "by-spread",
        keyboard: { arrowLeft: "previous", arrowRight: "next" },
        clickZones: { enabled: true, leftEdgePercent: 8, rightEdgePercent: 8 },
      },
    },
    pages,
    readingOrder,
    registries: { imageAssets: "", overlays: "", glossary: "" },
  };
}

describe('validateManifest', () => {
  it('returns no errors for valid manifest', () => {
    const page = {
      pageId: "p1", slug: "/p1", type: "cover" as const,
      title: { "zh-CN": "封面" },
      layout: {
        mode: "single" as const, format: "magazine-portrait" as const,
        size: { preset: "magazine-portrait-1000" as const, width: 1000, height: 1414 },
        background: "image" as const,
      },
    };
    const m = makeManifest(["p1"], [page]);
    const errors = validateManifest(m);
    expect(errors).toHaveLength(0);
  });

  it('detects missing page references in readingOrder', () => {
    const page = {
      pageId: "p1", slug: "/p1", type: "cover" as const,
      title: { "zh-CN": "封面" },
      layout: {
        mode: "single" as const, format: "magazine-portrait" as const,
        size: { preset: "magazine-portrait-1000" as const, width: 1000, height: 1414 },
        background: "image" as const,
      },
    };
    const m = makeManifest(["p1", "p2", "p3"], [page]);
    const errors = validateManifest(m);
    expect(errors).toHaveLength(2);
    expect(errors[0].kind).toBe('missing_page_ref');
    expect(errors[0].pageId).toBe('p2');
    expect(errors[1].pageId).toBe('p3');
  });

  it('returns empty array for empty manifest', () => {
    const m = makeManifest([], []);
    const errors = validateManifest(m);
    expect(errors).toHaveLength(0);
  });
});
