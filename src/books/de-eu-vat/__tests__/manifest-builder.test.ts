import { describe, it, expect } from 'vitest';
import sample from './fixtures/sample-catalog.json';
import {
  buildPageManifest,
  buildImageAsset,
  buildManifest,
} from '../manifest-builder';
import type { RawPageCatalog } from '../../../atlas-core/overlay/rawSchema';

const catalog = sample as RawPageCatalog;

describe('manifest-builder', () => {
  describe('buildImageAsset', () => {
    it('builds asset with canonical id and src URL', () => {
      const asset = buildImageAsset(catalog[1]);
      expect(asset.assetId).toBe('01-current-final-v06');
      expect(asset.version).toBe('0.6.1');
      expect(asset.src).toBe('/books/de-eu-vat/v0.6.1/images/01_current_final.png');
      expect(asset.width).toBe(1086);
      expect(asset.height).toBe(1448);
      expect(asset.alt?.['zh-CN']).toBe('VAT 判断总框架');
    });
  });

  describe('buildPageManifest', () => {
    it('builds page with type imageOverlay, slug, image+overlay refs', () => {
      const page = buildPageManifest(catalog[1], 2);
      expect(page.pageId).toBe('01-vat-framework');
      expect(page.type).toBe('imageOverlay');
      expect(page.slug).toBe('/page/01-vat-framework');
      expect(page.pageNumber).toBe(2);
      expect(page.sectionCode).toBe('01');
      expect(page.title['zh-CN']).toBe('VAT 判断总框架');
      expect(page.image?.assetId).toBe('01-current-final-v06');
      expect(page.overlay?.overlayId).toBe('01-overlay-v06');
      expect(page.layout.mode).toBe('single');
      expect(page.layout.size.width).toBe(1086);
      expect(page.layout.size.height).toBe(1448);
    });

    it('uses page 1 for TOC at index 0', () => {
      const page = buildPageManifest(catalog[0], 1);
      expect(page.pageId).toBe('toc');
      expect(page.pageNumber).toBe(1);
    });
  });

  describe('buildManifest', () => {
    it('builds top-level manifest with readingOrder and pages', () => {
      const m = buildManifest(catalog);
      expect(m.bookId).toBe('de-eu-vat-atlas');
      expect(m.slug).toBe('de-eu-vat');
      expect(m.version).toBe('0.6.1');
      expect(m.readingOrder).toEqual(['toc', '01-vat-framework']);
      expect(m.pages).toHaveLength(2);
      expect(m.pages[0].pageNumber).toBe(1);
      expect(m.pages[1].pageNumber).toBe(2);
    });

    it('disables notesDrawer and enables comments + debugOverlay', () => {
      const m = buildManifest(catalog);
      expect(m.featureFlags?.notesDrawer).toBe(false);
      expect(m.featureFlags?.comments).toBe(true);
      expect(m.featureFlags?.debugOverlay).toBe(true);
    });

    it('uses single-page spread behavior on desktop and mobile', () => {
      const m = buildManifest(catalog);
      expect(m.reader.spreadBehavior.desktopDefault).toBe('single');
      expect(m.reader.spreadBehavior.mobileDefault).toBe('single');
    });

    it('registries fields point at the v0.6.1 asset URLs', () => {
      const m = buildManifest(catalog);
      expect(m.registries.imageAssets).toContain('/books/de-eu-vat/v0.6.1/images');
      expect(m.registries.overlays).toContain('/books/de-eu-vat/v0.6.1/overlays');
    });
  });
});
