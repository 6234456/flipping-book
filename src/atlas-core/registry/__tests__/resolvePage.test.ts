import { describe, it, expect, beforeEach } from 'vitest';
import { createBookRegistry } from '../createBookRegistry';
import {
  resolvePageBySlug, resolvePageById, resolveFirstPage,
  resolveNextPage, resolvePreviousPage,
} from '../resolvePage';
import type { BookManifest } from '../../types/manifest';
import type { ImageAsset } from '../../types/image';
import type { OverlayConfig } from '../../types/overlay';
import type { GlossaryEntry } from '../../types/glossary';
import type { LegalRef } from '../../types/legal';
import type { VatScenario } from '../../types/scenario';
import type { AtlasNote } from '../../types/notes';
import type { PageContent } from '../../types/content';
import type { CommentThread } from '../../types/comments';

const empty: never[] = [];

function makeManifestWithPages(count: number): BookManifest {
  const pages = Array.from({ length: count }, (_, i) => ({
    pageId: `page-${i + 1}`,
    slug: `/page-${i + 1}`,
    type: "imageOverlay" as const,
    title: { "zh-CN": `第${i + 1}页` },
    pageNumber: i + 1,
    layout: {
      mode: "single" as const,
      format: "magazine-portrait" as const,
      size: { preset: "magazine-portrait-1000" as const, width: 1000, height: 1414 },
      background: "image" as const,
    },
  }));
  return {
    schemaVersion: "1.0",
    bookId: "test-book",
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
    readingOrder: pages.map(p => p.pageId),
    registries: { imageAssets: "", overlays: "", glossary: "" },
  };
}

describe('resolvePage', () => {
  let registry: ReturnType<typeof createBookRegistry>;

  beforeEach(() => {
    const manifest = makeManifestWithPages(5);
    registry = createBookRegistry(
      manifest, empty, empty, empty, empty, empty, empty, empty, empty,
    );
  });

  describe('resolvePageById', () => {
    it('resolves first page', () => {
      const page = resolvePageById(registry, "page-1");
      expect(page).toBeDefined();
      expect(page!.pageId).toBe("page-1");
    });

    it('resolves last page', () => {
      const page = resolvePageById(registry, "page-5");
      expect(page).toBeDefined();
      expect(page!.pageId).toBe("page-5");
    });

    it('returns undefined for missing page', () => {
      expect(resolvePageById(registry, "page-99")).toBeUndefined();
    });
  });

  describe('resolvePageBySlug', () => {
    it('resolves by slug', () => {
      const page = resolvePageBySlug(registry, "/page-3");
      expect(page).toBeDefined();
      expect(page!.pageId).toBe("page-3");
    });

    it('returns undefined for unknown slug', () => {
      expect(resolvePageBySlug(registry, "/nonexistent")).toBeUndefined();
    });
  });

  describe('resolveFirstPage', () => {
    it('returns first page in readingOrder', () => {
      const page = resolveFirstPage(registry);
      expect(page).toBeDefined();
      expect(page!.pageId).toBe("page-1");
    });

    it('returns undefined for empty readingOrder', () => {
      const emptyManifest = makeManifestWithPages(0);
      const emptyRegistry = createBookRegistry(
        emptyManifest, empty, empty, empty, empty, empty, empty, empty, empty,
      );
      expect(resolveFirstPage(emptyRegistry)).toBeUndefined();
    });
  });

  describe('resolveNextPage', () => {
    it('returns next page', () => {
      const next = resolveNextPage(registry, "page-1");
      expect(next).toBeDefined();
      expect(next!.pageId).toBe("page-2");
    });

    it('returns undefined at last page', () => {
      expect(resolveNextPage(registry, "page-5")).toBeUndefined();
    });

    it('returns undefined for unknown page', () => {
      expect(resolveNextPage(registry, "nonexistent")).toBeUndefined();
    });
  });

  describe('resolvePreviousPage', () => {
    it('returns previous page', () => {
      const prev = resolvePreviousPage(registry, "page-3");
      expect(prev).toBeDefined();
      expect(prev!.pageId).toBe("page-2");
    });

    it('returns undefined at first page', () => {
      expect(resolvePreviousPage(registry, "page-1")).toBeUndefined();
    });

    it('returns undefined for unknown page', () => {
      expect(resolvePreviousPage(registry, "nonexistent")).toBeUndefined();
    });
  });
});
