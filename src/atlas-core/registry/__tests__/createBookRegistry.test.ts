import { describe, it, expect } from 'vitest';
import { createBookRegistry } from '../createBookRegistry';
import type { BookManifest } from '../../types/manifest';
import type { ImageAsset } from '../../types/image';
import type { OverlayConfig } from '../../types/overlay';
import type { GlossaryEntry } from '../../types/glossary';
import type { LegalRef } from '../../types/legal';
import type { VatScenario } from '../../types/scenario';
import type { AtlasNote } from '../../types/notes';
import type { PageContent } from '../../types/content';
import type { CommentThread } from '../../types/comments';

function makeTestManifest(overrides: Partial<BookManifest> = {}): BookManifest {
  return {
    schemaVersion: "1.0",
    bookId: "test-book",
    slug: "test",
    title: { "zh-CN": "测试图册" },
    version: "0.1",
    defaultLocale: "zh-CN",
    supportedLocales: ["zh-CN"],
    visualSystem: "VAT_ATLAS_MAGAZINE_V2",
    reader: {
      defaultMode: "auto",
      allowModeSwitch: true,
      transition: "magazine-slide",
      enableKeyboardNavigation: true,
      enableSwipeNavigation: true,
      enableProgressBar: true,
      enableTableOfContents: true,
      defaultZoom: "fit-width",
      spreadBehavior: {
        desktopDefault: "spread",
        mobileDefault: "single",
        spreadPageAdvance: "by-spread",
        keyboard: { arrowLeft: "previous", arrowRight: "next" },
        clickZones: { enabled: true, leftEdgePercent: 8, rightEdgePercent: 8 },
      },
    },
    pages: [
      {
        pageId: "page-1",
        slug: "/page-1",
        type: "cover",
        title: { "zh-CN": "封面" },
        pageNumber: 1,
        layout: {
          mode: "single",
          format: "magazine-portrait",
          size: { preset: "magazine-portrait-1000", width: 1000, height: 1414 },
          background: "image",
        },
      },
    ],
    readingOrder: ["page-1"],
    registries: {
      imageAssets: "/books/test/imageAssets",
      overlays: "/books/test/overlays",
      glossary: "/books/test/glossary",
    },
    ...overrides,
  };
}

const emptyImageAssets: ImageAsset[] = [];
const emptyOverlays: OverlayConfig[] = [];
const emptyGlossary: GlossaryEntry[] = [];
const emptyLegalRefs: LegalRef[] = [];
const emptyScenarios: VatScenario[] = [];
const emptyNotes: AtlasNote[] = [];
const emptyContents: PageContent[] = [];
const emptyComments: CommentThread[] = [];

describe('createBookRegistry', () => {
  it('creates a registry with the manifest', () => {
    const manifest = makeTestManifest();
    const registry = createBookRegistry(
      manifest, emptyImageAssets, emptyOverlays, emptyGlossary,
      emptyLegalRefs, emptyScenarios, emptyNotes, emptyContents, emptyComments,
    );
    expect(registry.manifest.bookId).toBe("test-book");
  });

  it('looks up pages by ID', () => {
    const manifest = makeTestManifest();
    const registry = createBookRegistry(
      manifest, emptyImageAssets, emptyOverlays, emptyGlossary,
      emptyLegalRefs, emptyScenarios, emptyNotes, emptyContents, emptyComments,
    );
    const page = registry.getPage("page-1");
    expect(page).toBeDefined();
    expect(page!.title["zh-CN"]).toBe("封面");
  });

  it('returns undefined for unknown page ID', () => {
    const manifest = makeTestManifest();
    const registry = createBookRegistry(
      manifest, emptyImageAssets, emptyOverlays, emptyGlossary,
      emptyLegalRefs, emptyScenarios, emptyNotes, emptyContents, emptyComments,
    );
    expect(registry.getPage("nonexistent")).toBeUndefined();
  });

  it('looks up pages by slug', () => {
    const manifest = makeTestManifest();
    const registry = createBookRegistry(
      manifest, emptyImageAssets, emptyOverlays, emptyGlossary,
      emptyLegalRefs, emptyScenarios, emptyNotes, emptyContents, emptyComments,
    );
    const page = registry.pagesBySlug.get("/page-1");
    expect(page).toBeDefined();
    expect(page!.pageId).toBe("page-1");
  });

  it('looks up images by assetId', () => {
    const manifest = makeTestManifest();
    const images: ImageAsset[] = [
      {
        assetId: "img-1",
        src: "/img/test.png",
        version: "v1",
        width: 1000, height: 1414,
        format: "png",
        visualSystem: "VAT_ATLAS_MAGAZINE_V2",
        pageFormat: "single",
        sizePreset: "magazine-portrait-1000",
        alt: { "zh-CN": "test" },
      },
    ];
    const registry = createBookRegistry(
      manifest, images, emptyOverlays, emptyGlossary,
      emptyLegalRefs, emptyScenarios, emptyNotes, emptyContents, emptyComments,
    );
    const img = registry.getImage("img-1");
    expect(img).toBeDefined();
    expect(img!.src).toBe("/img/test.png");
  });

  it('looks up overlays by overlayId', () => {
    const manifest = makeTestManifest();
    const overlays: OverlayConfig[] = [
      {
        overlayId: "overlay-1",
        imageAssetId: "img-1",
        imageVersion: "v1",
        coordinateSystem: "percentage",
        hotspots: [],
      },
    ];
    const registry = createBookRegistry(
      manifest, emptyImageAssets, overlays, emptyGlossary,
      emptyLegalRefs, emptyScenarios, emptyNotes, emptyContents, emptyComments,
    );
    const ov = registry.getOverlay("overlay-1");
    expect(ov).toBeDefined();
    expect(ov!.imageAssetId).toBe("img-1");
  });

  it('looks up glossary terms by termId', () => {
    const manifest = makeTestManifest();
    const glossary: GlossaryEntry[] = [
      {
        termId: "term-1",
        zh: "测试",
        original: "Test",
        category: "vat-basic",
        shortDefinition: "A test term",
        firstMentionFormat: "测试（Test）",
      },
    ];
    const registry = createBookRegistry(
      manifest, emptyImageAssets, emptyOverlays, glossary,
      emptyLegalRefs, emptyScenarios, emptyNotes, emptyContents, emptyComments,
    );
    const term = registry.getTerm("term-1");
    expect(term).toBeDefined();
    expect(term!.zh).toBe("测试");
  });
});
