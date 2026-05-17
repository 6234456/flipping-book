import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider, TooltipProvider } from '../atlas-ui/primitives';
import { MagazineReader } from '../atlas-ui/reader/MagazineReader';
import { createBookRegistry } from '../atlas-core/registry';
import type { BookManifest } from '../atlas-core/types/manifest';

const fixtureManifest: BookManifest = {
  schemaVersion: '1.0',
  bookId: 'de-eu-vat-atlas',
  slug: 'de-eu-vat',
  title: { 'zh-CN': 'Fixture' },
  version: '0.6.1-fixture',
  defaultLocale: 'zh-CN',
  supportedLocales: ['zh-CN'],
  visualSystem: 'VAT_ATLAS_MAGAZINE_V2',
  reader: {
    defaultMode: 'auto',
    allowModeSwitch: false,
    transition: 'fade',
    enableKeyboardNavigation: true,
    enableSwipeNavigation: true,
    enableProgressBar: true,
    enableTableOfContents: true,
    defaultZoom: 'fit-page',
    spreadBehavior: {
      desktopDefault: 'single',
      mobileDefault: 'single',
      spreadPageAdvance: 'by-page',
      keyboard: { arrowLeft: 'previous', arrowRight: 'next' },
      clickZones: { enabled: false, leftEdgePercent: 0, rightEdgePercent: 0 },
    },
  },
  pages: [
    {
      pageId: 'toc',
      slug: '/page/toc',
      type: 'imageOverlay',
      title: { 'zh-CN': 'TOC' },
      pageNumber: 1,
      layout: {
        mode: 'single', format: 'custom',
        size: { preset: 'custom', width: 1086, height: 1448 },
        background: 'image',
      },
      image: { assetId: 'toc-img', version: '0.6.1' },
      overlay: { overlayId: 'toc-overlay', imageAssetId: 'toc-img', imageVersion: '0.6.1' },
    },
  ],
  readingOrder: ['toc'],
  registries: { imageAssets: '', overlays: '', glossary: '' },
  featureFlags: {
    glossaryTooltips: true, notesDrawer: false, comments: true,
    debugOverlay: false, pageFlip: false, search: false, exportComments: true,
  },
};

function build() {
  return createBookRegistry(fixtureManifest, [], [], [], [], [], [], [], []);
}

describe('Rail persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists collapsed state across remount', () => {
    const registry = build();
    const bookId = registry.manifest.bookId;

    localStorage.setItem(
      `atlas-rail-${bookId}`,
      JSON.stringify({ open: false, tab: 'notes', width: 320 }),
    );

    const { container } = render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={registry} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    const slim = container.querySelector('[role="toolbar"][aria-label="侧栏"]');
    expect(slim).not.toBeNull();
  });
});
