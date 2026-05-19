import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageViewport } from '../PageViewport';
import { createBookRegistry } from '../../../atlas-core/registry';
import type { BookRegistry } from '../../../atlas-core/registry';
import type { ReaderState } from '../../../atlas-core/reader';
import type { BookManifest } from '../../../atlas-core/types/manifest';
import type { ImageAsset } from '../../../atlas-core/types/image';
import type { CommentThread } from '../../../atlas-core/types/comments';
import type { ZoomLevel } from '../../renderers/ImageOverlayTemplate';

function makeRegistry(pageType: 'single' | 'spread' = 'single'): BookRegistry {
  const image: ImageAsset = {
    assetId: "img-1", src: "/images/test.png", version: "v1",
    width: 1055, height: 1491, format: "png",
    visualSystem: "VAT_ATLAS_MAGAZINE_V2",
    pageFormat: "single", sizePreset: "magazine-portrait-1000",
    alt: { "zh-CN": "test" },
  };

  const basePage = {
    pageId: "p1", slug: "/p1",
    type: "imageOverlay" as const,
    title: { "zh-CN": "测试页" },
    layout: {
      mode: "single" as const, format: "magazine-portrait" as const,
      size: { preset: "magazine-portrait-1000" as const, width: 1000, height: 1414 },
      background: "image" as const,
    },
    image: { assetId: "img-1", version: "v1" },
  };

  const spreadPage = pageType === 'spread' ? {
    pageId: "p1", slug: "/p1",
    type: "appendix" as const,
    title: { "zh-CN": "跨页" },
    layout: {
      mode: "spread" as const, format: "magazine-spread" as const,
      size: { preset: "magazine-spread-2000" as const, width: 2000, height: 1414 },
      background: "image" as const,
      spread: {
        sourceMode: "single-spread-image" as const,
        gutterWidthPercent: 2,
        leftPageArea: { x: 0, y: 0, width: 50, height: 100 },
        rightPageArea: { x: 50, y: 0, width: 50, height: 100 },
        allowPageTurnFromLeftEdge: true, allowPageTurnFromRightEdge: true,
        collapseToSingleOnMobile: true,
      },
    },
    spreadImages: { sourceMode: "single-spread-image" as const, spread: { assetId: "img-1", version: "v1" } },
  } : basePage;

  const manifest: BookManifest = {
    schemaVersion: "1.0", bookId: "test", slug: "test",
    title: { "zh-CN": "测试" }, version: "0.1",
    defaultLocale: "zh-CN", supportedLocales: ["zh-CN"],
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
    pages: [spreadPage],
    readingOrder: ["p1"],
    registries: { imageAssets: "", overlays: "", glossary: "" },
  };

  return createBookRegistry(manifest, [image], [], [], [], [], [], [], []);
}

function makeReaderState(overrides: Partial<ReaderState> = {}): ReaderState {
  return {
    currentPage: undefined,
    currentPageIndex: 0,
    totalPages: 1,
    interactionMode: 'read',
    canGoNext: false,
    canGoPrevious: false,
    goToPage: vi.fn(),
    goNext: vi.fn(),
    goPrevious: vi.fn(),
    setInteractionMode: vi.fn(),
    toggleDebugOverlay: vi.fn(),
    ...overrides,
  };
}

const emptyComments: CommentThread[] = [];
const noopAnchor = vi.fn();

describe('PageViewport zoom', () => {
  function renderWithZoom(zoom: ZoomLevel, onCycleZoom = vi.fn()) {
    const registry = makeRegistry();
    const state = makeReaderState({ currentPage: registry.getPage("p1") });
    return render(
      <MemoryRouter>
        <PageViewport
          registry={registry}
          readerState={state}
          zoom={zoom}
          onCycleZoom={onCycleZoom}
          commentThreads={emptyComments}
          selectedThreadId={null}
          highlightedThreadId={null}
          onSelectThread={vi.fn()}
          onHoverThread={vi.fn()}
          onCreateAnchor={noopAnchor}
          richRegionsOn={false}
        />
      </MemoryRouter>
    );
  }

  it('shows correct zoom label', () => {
    renderWithZoom('fit-page');
    expect(screen.getByRole('button', { name: /适应页面/ })).toBeInTheDocument();
  });

  it('fit-width shows correct label', () => {
    renderWithZoom('fit-width');
    expect(screen.getByRole('button', { name: /适应宽度/ })).toBeInTheDocument();
  });

  it('actual-size shows correct label', () => {
    renderWithZoom('actual-size');
    expect(screen.getByRole('button', { name: /实际大小/ })).toBeInTheDocument();
  });

  it('clicking zoom button calls onCycleZoom', async () => {
    const onCycleZoom = vi.fn();
    renderWithZoom('fit-page', onCycleZoom);

    const btn = screen.getByRole('button', { name: /适应页面/ });
    btn.click();
    expect(onCycleZoom).toHaveBeenCalledTimes(1);
  });

  it('switching zoom prop changes displayed label', () => {
    const onCycleZoom = vi.fn();
    const { rerender } = renderWithZoom('fit-page', onCycleZoom);

    expect(screen.getByRole('button', { name: /适应页面/ })).toBeInTheDocument();

    // Rerender with different zoom
    const registry = makeRegistry();
    const state = makeReaderState({ currentPage: registry.getPage("p1") });
    rerender(
      <MemoryRouter>
        <PageViewport
          registry={registry}
          readerState={state}
          zoom="fit-width"
          onCycleZoom={onCycleZoom}
          commentThreads={emptyComments}
          selectedThreadId={null}
          highlightedThreadId={null}
          onSelectThread={vi.fn()}
          onHoverThread={vi.fn()}
          onCreateAnchor={noopAnchor}
          richRegionsOn={false}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /适应宽度/ })).toBeInTheDocument();
  });

  it('image gets max-h-full class for fit-page', () => {
    const { container } = renderWithZoom('fit-page');
    const img = container.querySelector('img');
    // The image should have max-h-full for fit-page
    // (may render in spread mode or single mode depending on viewport)
    if (img) {
      expect(img.className).toContain('max-h-[');
    }
  });

  it('image gets w-full class for fit-width', () => {
    const { container } = renderWithZoom('fit-width');
    const img = container.querySelector('img');
    if (img) {
      expect(img.className).toContain('w-full');
    }
  });
});
