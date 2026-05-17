import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
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

describe('+ button flow', () => {
  beforeEach(() => localStorage.clear());

  it('shows banner when + button clicked, then dismisses after ESC', async () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={build()} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    const plus = await screen.findByRole('button', { name: /新增评论/ });
    await userEvent.click(plus);

    expect(screen.getByText(/点击图片任意位置添加评论/)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText(/点击图片任意位置添加评论/)).not.toBeInTheDocument();
  });

  it('N keyboard shortcut also triggers the flow', async () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={build()} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: 'n' });
    expect(await screen.findByText(/点击图片任意位置添加评论/)).toBeInTheDocument();
  });

  it('auto-exits comment mode after a pin is created', async () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <ToastProvider>
            <MagazineReader registry={build()} />
          </ToastProvider>
        </TooltipProvider>
      </MemoryRouter>,
    );

    const plus = await screen.findByRole('button', { name: /新增评论/ });
    await userEvent.click(plus);
    expect(screen.getByText(/点击图片任意位置添加评论/)).toBeInTheDocument();

    // Simulate creating a pin via CommentCaptureLayer
    const capture = document.querySelector('.cursor-crosshair') as HTMLElement | null;
    expect(capture).not.toBeNull();
    fireEvent.click(capture!, { clientX: 100, clientY: 100 });

    // Banner should disappear (comment mode auto-exited)
    expect(screen.queryByText(/点击图片任意位置添加评论/)).not.toBeInTheDocument();
  });
});
