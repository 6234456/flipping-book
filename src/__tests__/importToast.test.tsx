import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
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

describe('Import comments toast', () => {
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    alertSpy = vi.spyOn(globalThis, 'alert').mockImplementation(() => {});
  });
  afterEach(() => {
    alertSpy.mockRestore();
  });

  function renderApp() {
    const registry = createBookRegistry(fixtureManifest, [], [], [], [], [], [], [], []);
    return render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={registry} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );
  }

  it('shows a toast (not native alert) after importing JSON', async () => {
    renderApp();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    const fileContent = JSON.stringify({ version: 1, comments: [] });
    const file = new File([fileContent], 'comments.json', { type: 'application/json' });
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    // Wait for FileReader.onload
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(alertSpy).not.toHaveBeenCalled();
    expect(await screen.findByText(/导入/)).toBeInTheDocument();
  });
});
