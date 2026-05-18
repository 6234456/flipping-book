import { describe, it, expect } from 'vitest';
import { validateManifest, validateImageRefs, validateOverlayRefs, validateAll } from '../validateManifest';
import type { BookManifest } from '../../types/manifest';
import type { ImageAsset } from '../../types/image';
import type { OverlayConfig } from '../../types/overlay';

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

function makePage(pageId: string) {
  return {
    pageId, slug: `/${pageId}`, type: "imageOverlay" as const,
    title: { "zh-CN": pageId },
    layout: {
      mode: "single" as const, format: "magazine-portrait" as const,
      size: { preset: "magazine-portrait-1000" as const, width: 1000, height: 1414 },
      background: "image" as const,
    },
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

// ============================================================
describe('validateImageRefs', () => {
  const images: ImageAsset[] = [{
    assetId: "img-1", src: "/img/1.png", version: "v1",
    width: 1000, height: 1414, format: "png",
    visualSystem: "VAT_ATLAS_MAGAZINE_V2",
    pageFormat: "single", sizePreset: "magazine-portrait-1000",
    alt: { "zh-CN": "img" },
  }];

  it('returns no errors when all images exist', () => {
    const page = { ...makePage("p1"), image: { assetId: "img-1", version: "v1" } };
    const m = makeManifest(["p1"], [page]);
    const errors = validateImageRefs(m, images);
    expect(errors).toHaveLength(0);
  });

  it('detects missing image ref', () => {
    const page = { ...makePage("p1"), image: { assetId: "img-missing", version: "v1" } };
    const m = makeManifest(["p1"], [page]);
    const errors = validateImageRefs(m, images);
    expect(errors).toHaveLength(1);
    expect(errors[0].kind).toBe('missing_image_ref');
    expect(errors[0].pageId).toBe('p1');
  });

  it('detects missing spread image', () => {
    const page = {
      ...makePage("p1"),
      layout: { ...makePage("p1").layout, mode: "spread" as const, format: "magazine-spread" as const, size: { preset: "magazine-spread-2000" as const, width: 2000, height: 1414 } },
      spreadImages: { sourceMode: "single-spread-image" as const, spread: { assetId: "img-missing", version: "v1" } },
    };
    const m = makeManifest(["p1"], [page]);
    const errors = validateImageRefs(m, images);
    expect(errors).toHaveLength(1);
  });

  it('detects missing left/right images in two-page composition', () => {
    const page = {
      ...makePage("p1"),
      layout: { ...makePage("p1").layout, mode: "spread" as const, format: "magazine-spread" as const, size: { preset: "magazine-spread-2000" as const, width: 2000, height: 1414 } },
      spreadImages: {
        sourceMode: "two-page-composition" as const,
        left: { assetId: "img-missing", version: "v1" },
        right: { assetId: "img-1", version: "v1" },
      },
    };
    const m = makeManifest(["p1"], [page]);
    const errors = validateImageRefs(m, images);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('left');
  });
});

// ============================================================
describe('validateOverlayRefs', () => {
  const overlays: OverlayConfig[] = [{
    overlayId: "ov-1",
    imageAssetId: "img-1",
    imageVersion: "v1",
    coordinateSystem: "percentage",
    hotspots: [],
  }];

  it('returns no errors when overlay matches', () => {
    const page = {
      ...makePage("p1"),
      image: { assetId: "img-1", version: "v1" },
      overlay: { overlayId: "ov-1", imageAssetId: "img-1", imageVersion: "v1" },
    };
    const m = makeManifest(["p1"], [page]);
    const errors = validateOverlayRefs(m, overlays);
    expect(errors).toHaveLength(0);
  });

  it('detects missing overlay ref', () => {
    const page = {
      ...makePage("p1"),
      image: { assetId: "img-1", version: "v1" },
      overlay: { overlayId: "ov-missing", imageAssetId: "img-1", imageVersion: "v1" },
    };
    const m = makeManifest(["p1"], [page]);
    const errors = validateOverlayRefs(m, overlays);
    expect(errors).toHaveLength(1);
    expect(errors[0].kind).toBe('missing_overlay_ref');
  });

  it('detects image version mismatch', () => {
    const page = {
      ...makePage("p1"),
      image: { assetId: "img-1", version: "v2" },
      overlay: { overlayId: "ov-1", imageAssetId: "img-1", imageVersion: "v1" },
    };
    const m = makeManifest(["p1"], [page]);
    const errors = validateOverlayRefs(m, overlays);
    expect(errors).toHaveLength(1);
    expect(errors[0].kind).toBe('image_version_mismatch');
  });
});

// ============================================================
describe('validateAll', () => {
  it('combines all validation results', () => {
    const page = { ...makePage("p1"), image: { assetId: "img-missing", version: "v1" } };
    const m = makeManifest(["p1", "p2"], [page]);
    const errors = validateAll(m, [], []);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    // Should have missing_page_ref for p2
    expect(errors.some((e) => e.kind === 'missing_page_ref')).toBe(true);
    // Should have missing_image_ref for img-missing
    expect(errors.some((e) => e.kind === 'missing_image_ref')).toBe(true);
  });
});
