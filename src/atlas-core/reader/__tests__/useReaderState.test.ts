import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReaderState } from '../useReaderState';
import { createBookRegistry } from '../../registry/createBookRegistry';
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

function makeManifest(pageCount: number): BookManifest {
  const pages = Array.from({ length: pageCount }, (_, i) => ({
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
    readingOrder: pages.map(p => p.pageId),
    registries: { imageAssets: "", overlays: "", glossary: "" },
  };
}

function makeRegistry(pageCount = 5) {
  return createBookRegistry(
    makeManifest(pageCount), empty, empty, empty, empty, empty, empty, empty, empty,
  );
}

describe('useReaderState', () => {
  it('starts at first page', () => {
    const registry = makeRegistry(3);
    const { result } = renderHook(() => useReaderState(registry));
    expect(result.current.currentPage?.pageId).toBe("page-1");
    expect(result.current.currentPageIndex).toBe(0);
    expect(result.current.totalPages).toBe(3);
  });

  it('starts at specified page', () => {
    const registry = makeRegistry(5);
    const { result } = renderHook(() => useReaderState(registry, "page-3"));
    expect(result.current.currentPage?.pageId).toBe("page-3");
    expect(result.current.currentPageIndex).toBe(2);
  });

  it('falls back to first page for unknown initialPageId', () => {
    const registry = makeRegistry(3);
    const { result } = renderHook(() => useReaderState(registry, "nonexistent"));
    expect(result.current.currentPage?.pageId).toBe("page-1");
  });

  it('canGoNext is true except at last page', () => {
    const registry = makeRegistry(3);
    const { result } = renderHook(() => useReaderState(registry));
    expect(result.current.canGoNext).toBe(true);
    act(() => { result.current.goNext(); });
    expect(result.current.canGoNext).toBe(true);
    act(() => { result.current.goNext(); });
    expect(result.current.canGoNext).toBe(false);
  });

  it('canGoPrevious is false at first page', () => {
    const registry = makeRegistry(3);
    const { result } = renderHook(() => useReaderState(registry));
    expect(result.current.canGoPrevious).toBe(false);
  });

  it('goNext navigates forward', () => {
    const registry = makeRegistry(5);
    const { result } = renderHook(() => useReaderState(registry));
    act(() => { result.current.goNext(); });
    expect(result.current.currentPage?.pageId).toBe("page-2");
    act(() => { result.current.goNext(); });
    expect(result.current.currentPage?.pageId).toBe("page-3");
  });

  it('goNext does nothing at last page', () => {
    const registry = makeRegistry(2);
    const { result } = renderHook(() => useReaderState(registry, "page-2"));
    act(() => { result.current.goNext(); });
    expect(result.current.currentPage?.pageId).toBe("page-2");
  });

  it('goPrevious navigates backward', () => {
    const registry = makeRegistry(5);
    const { result } = renderHook(() => useReaderState(registry, "page-3"));
    act(() => { result.current.goPrevious(); });
    expect(result.current.currentPage?.pageId).toBe("page-2");
  });

  it('goPrevious does nothing at first page', () => {
    const registry = makeRegistry(3);
    const { result } = renderHook(() => useReaderState(registry, "page-1"));
    act(() => { result.current.goPrevious(); });
    expect(result.current.currentPage?.pageId).toBe("page-1");
  });

  it('goToPage navigates to specific page', () => {
    const registry = makeRegistry(5);
    const { result } = renderHook(() => useReaderState(registry));
    act(() => { result.current.goToPage("page-4"); });
    expect(result.current.currentPage?.pageId).toBe("page-4");
    expect(result.current.currentPageIndex).toBe(3);
  });

  it('goToPage ignores unknown page', () => {
    const registry = makeRegistry(3);
    const { result } = renderHook(() => useReaderState(registry));
    act(() => { result.current.goToPage("nonexistent"); });
    expect(result.current.currentPage?.pageId).toBe("page-1");
  });

  it('interactionMode defaults to read', () => {
    const registry = makeRegistry(3);
    const { result } = renderHook(() => useReaderState(registry));
    expect(result.current.interactionMode).toBe("read");
  });

  it('toggles debug overlay', () => {
    const registry = makeRegistry(3);
    const { result } = renderHook(() => useReaderState(registry));
    act(() => { result.current.toggleDebugOverlay(); });
    expect(result.current.interactionMode).toBe("debugOverlay");
    act(() => { result.current.toggleDebugOverlay(); });
    expect(result.current.interactionMode).toBe("read");
  });

  it('handles single page manifest', () => {
    const registry = makeRegistry(1);
    const { result } = renderHook(() => useReaderState(registry));
    expect(result.current.canGoNext).toBe(false);
    expect(result.current.canGoPrevious).toBe(false);
    expect(result.current.totalPages).toBe(1);
  });
});
