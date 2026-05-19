import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { MagazineReader } from '../MagazineReader';
import { createBookRegistry } from '../../../atlas-core/registry/createBookRegistry';
import { ToastProvider, TooltipProvider } from '../../primitives';
import type { BookManifest } from '../../../atlas-core/types/manifest';
import type { ImageAsset } from '../../../atlas-core/types/image';
import type { RichOverlayConfig } from '../../../atlas-core/types/regions';
import type { PageManifest } from '../../../atlas-core/types/page';

const page1: PageManifest = {
  pageId: 'page-1',
  sectionCode: 'SC-01',
  pageNumber: 1,
  slug: 'sc-01',
  type: 'imageOverlay',
  title: { 'zh-CN': '页面 1' },
  layout: { mode: 'single', format: 'custom', size: { preset: 'custom', width: 100, height: 100, aspectRatioLabel: '1:1' }, background: 'image' },
  image: { assetId: 'img-1', version: '1' },
  overlay: { overlayId: 'ov-1', imageAssetId: 'img-1', imageVersion: '1' },
};

const page2: PageManifest = {
  pageId: 'page-2',
  sectionCode: 'SC-02',
  pageNumber: 2,
  slug: 'sc-02',
  type: 'imageOverlay',
  title: { 'zh-CN': '页面 2' },
  layout: { mode: 'single', format: 'custom', size: { preset: 'custom', width: 100, height: 100, aspectRatioLabel: '1:1' }, background: 'image' },
  image: { assetId: 'img-2', version: '1' },
  overlay: { overlayId: 'ov-2', imageAssetId: 'img-2', imageVersion: '1' },
};

const manifest: BookManifest = {
  schemaVersion: '1.0',
  bookId: 'test-book',
  slug: 'test-book',
  title: { 'zh-CN': 'Test' },
  version: '0.0.1',
  defaultLocale: 'zh-CN',
  supportedLocales: ['zh-CN'],
  visualSystem: 'VAT_ATLAS_MAGAZINE_V2',
  reader: {
    defaultMode: 'auto', allowModeSwitch: false, transition: 'fade',
    enableKeyboardNavigation: true, enableSwipeNavigation: true,
    enableProgressBar: true, enableTableOfContents: true,
    spreadBehavior: {
      desktopDefault: 'single', mobileDefault: 'single',
      spreadPageAdvance: 'by-page',
      keyboard: { arrowLeft: 'previous', arrowRight: 'next' },
      clickZones: { enabled: false, leftEdgePercent: 0, rightEdgePercent: 0 },
    },
  },
  pages: [page1, page2],
  readingOrder: ['page-1', 'page-2'],
  registries: { imageAssets: '/book/images', overlays: '/book/overlays', glossary: '/book/data/glossary.json' },
  navigation: { showTopBar: true, showBottomBar: false, showPageNumbers: true, showBreadcrumbs: false, showThumbnailStrip: false, showTableOfContentsButton: true },
  featureFlags: { glossaryTooltips: true, notesDrawer: false, comments: false, debugOverlay: false, pageFlip: false, search: false, exportComments: true },
};

const imgA: ImageAsset = { assetId: 'img-1', src: 'a.png', width: 100, height: 100, format: 'png', visualSystem: 'VAT_ATLAS_MAGAZINE_V2', pageFormat: 'single', sizePreset: 'custom', alt: { 'zh-CN': 'a' }, version: '1' };
const imgB: ImageAsset = { assetId: 'img-2', src: 'b.png', width: 100, height: 100, format: 'png', visualSystem: 'VAT_ATLAS_MAGAZINE_V2', pageFormat: 'single', sizePreset: 'custom', alt: { 'zh-CN': 'b' }, version: '1' };

const overlay1: RichOverlayConfig = {
  overlayId: 'ov-1',
  imageAssetId: 'img-1',
  imageVersion: '1',
  coordinateSystem: 'percentage',
  hotspots: [],
  canvas: { width: 100, height: 100 },
  regions: [
    {
      regionId: 'sec-A',
      kind: 'section',
      role: 'detectedSection',
      rect: { x: 5, y: 5, width: 50, height: 50 },
    },
  ],
};

const overlay2: RichOverlayConfig = {
  overlayId: 'ov-2',
  imageAssetId: 'img-2',
  imageVersion: '1',
  coordinateSystem: 'percentage',
  hotspots: [],
  canvas: { width: 100, height: 100 },
  regions: [
    {
      regionId: 'sec-B',
      kind: 'section',
      role: 'detectedSection',
      rect: { x: 5, y: 5, width: 50, height: 50 },
    },
  ],
};

function harness(initialPageId = 'page-1') {
  const registry = createBookRegistry(manifest, [imgA, imgB], [overlay1, overlay2], [], [], [], [], [], []);
  return render(
    <MemoryRouter initialEntries={[`/book/test-book/page/${initialPageId}`]}>
      <TooltipProvider>
        <ToastProvider>
          <RadixTooltip.Provider>
            <MagazineReader registry={registry} initialPageId={initialPageId} />
          </RadixTooltip.Provider>
        </ToastProvider>
      </TooltipProvider>
    </MemoryRouter>,
  );
}

function harnessPage2() {
  return harness('page-2');
}

describe('Rich Region toggle integration', () => {
  it('layer is hidden by default; appears after clicking 区域', () => {
    harness();
    expect(screen.queryByTestId('rich-region-layer')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '切换区域高亮' }));
    expect(screen.getByTestId('rich-region-layer')).toBeInTheDocument();
  });

  it('selected section persists within the page, then clears after page navigation', () => {
    const { unmount } = harness();
    fireEvent.click(screen.getByRole('button', { name: '切换区域高亮' }));

    const secA = screen.getByTestId('section-item-sec-A');
    expect(secA.getAttribute('data-selected')).toBe('false');
    fireEvent.click(secA);
    expect(secA.getAttribute('data-selected')).toBe('true');

    // Re-render with page 2 to simulate navigation
    unmount();
    harnessPage2();
    fireEvent.click(screen.getByRole('button', { name: '切换区域高亮' }));

    // sec-A not present; sec-B should be unselected on fresh page
    expect(screen.queryByTestId('section-item-sec-A')).toBeNull();
    const secB = screen.getByTestId('section-item-sec-B');
    expect(secB.getAttribute('data-selected')).toBe('false');
  });

  it('clicking again deselects', () => {
    harness();
    fireEvent.click(screen.getByRole('button', { name: '切换区域高亮' }));
    const secA = screen.getByTestId('section-item-sec-A');
    fireEvent.click(secA);
    expect(secA.getAttribute('data-selected')).toBe('true');
    fireEvent.click(secA);
    expect(secA.getAttribute('data-selected')).toBe('false');
  });
});
