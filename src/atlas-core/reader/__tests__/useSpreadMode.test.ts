import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpreadMode } from '../useSpreadMode';
import type { PageManifest } from '../../types/page';
import type { ReaderConfig } from '../../types/manifest';
import type { SpreadBehaviorConfig } from '../../types/page';

const desktopSpread: SpreadBehaviorConfig = {
  desktopDefault: "spread",
  mobileDefault: "single",
  spreadPageAdvance: "by-spread",
  keyboard: { arrowLeft: "previous", arrowRight: "next" },
  clickZones: { enabled: true, leftEdgePercent: 8, rightEdgePercent: 8 },
};

const desktopSingle: SpreadBehaviorConfig = {
  ...desktopSpread,
  desktopDefault: "single",
};

function makeReader(spreadBehavior: SpreadBehaviorConfig): ReaderConfig {
  return {
    defaultMode: "auto",
    allowModeSwitch: true,
    transition: "magazine-slide",
    enableKeyboardNavigation: true,
    enableSwipeNavigation: true,
    enableProgressBar: true,
    enableTableOfContents: true,
    defaultZoom: "fit-width",
    spreadBehavior,
  };
}

function makeSpreadPage(overrides: Partial<PageManifest> = {}): PageManifest {
  return {
    pageId: "spread-page",
    slug: "/spread",
    type: "appendix",
    title: { "zh-CN": "跨页" },
    layout: {
      mode: "spread",
      format: "magazine-spread",
      size: { preset: "magazine-spread-2000", width: 2000, height: 1414 },
      background: "image",
      spread: {
        sourceMode: "single-spread-image",
        gutterWidthPercent: 2,
        leftPageArea: { x: 0, y: 0, width: 50, height: 100 },
        rightPageArea: { x: 50, y: 0, width: 50, height: 100 },
        allowPageTurnFromLeftEdge: true,
        allowPageTurnFromRightEdge: true,
        collapseToSingleOnMobile: true,
        mobileOrder: "left-first",
      },
    },
    ...overrides,
  };
}

function makeSinglePage(): PageManifest {
  return {
    pageId: "single-page",
    slug: "/single",
    type: "imageOverlay",
    title: { "zh-CN": "单页" },
    layout: {
      mode: "single",
      format: "magazine-portrait",
      size: { preset: "magazine-portrait-1000", width: 1000, height: 1414 },
      background: "image",
    },
  };
}

const originalInnerWidth = window.innerWidth;

describe('useSpreadMode', () => {
  beforeEach(() => {
    // Reset to desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true, configurable: true, value: 1440,
    });
    window.dispatchEvent(new Event('resize'));
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true, configurable: true, value: originalInnerWidth,
    });
    window.dispatchEvent(new Event('resize'));
  });

  it('returns "single" for single-mode page on desktop', () => {
    const reader = makeReader(desktopSpread);
    const { result } = renderHook(() => useSpreadMode(makeSinglePage(), reader));
    expect(result.current.mode).toBe("single");
  });

  it('returns "spread" for spread page on desktop with desktopDefault=spread', () => {
    const reader = makeReader(desktopSpread);
    const { result } = renderHook(() => useSpreadMode(makeSpreadPage(), reader));
    expect(result.current.mode).toBe("spread");
  });

  it('returns "single" for spread page on desktop with desktopDefault=single', () => {
    const reader = makeReader(desktopSingle);
    const { result } = renderHook(() => useSpreadMode(makeSpreadPage(), reader));
    expect(result.current.mode).toBe("single");
  });

  it('returns "single" for spread page on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true, configurable: true, value: 600,
    });
    window.dispatchEvent(new Event('resize'));

    const reader = makeReader(desktopSpread);
    const { result } = renderHook(() => useSpreadMode(makeSpreadPage(), reader));
    expect(result.current.mode).toBe("single");
  });

  it('returns "single" when collapseToSingleOnMobile is false on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true, configurable: true, value: 600,
    });
    window.dispatchEvent(new Event('resize'));

    const spreadPage = makeSpreadPage({
      layout: {
        mode: "spread",
        format: "magazine-spread",
        size: { preset: "magazine-spread-2000", width: 2000, height: 1414 },
        background: "image",
        spread: {
          sourceMode: "single-spread-image",
          gutterWidthPercent: 2,
          leftPageArea: { x: 0, y: 0, width: 50, height: 100 },
          rightPageArea: { x: 50, y: 0, width: 50, height: 100 },
          allowPageTurnFromLeftEdge: true,
          allowPageTurnFromRightEdge: true,
          collapseToSingleOnMobile: false,
        },
      },
    });

    const reader = makeReader(desktopSpread);
    const { result } = renderHook(() => useSpreadMode(spreadPage, reader));
    // mobileDefault is "single" so even with collapseToSingleOnMobile=false, mobile stays single
    expect(result.current.mode).toBe("single");
  });

  it('tracks viewport resize from desktop to mobile', () => {
    const reader = makeReader(desktopSpread);
    const { result, rerender } = renderHook(
      ({ page }) => useSpreadMode(page, reader),
      { initialProps: { page: makeSpreadPage() } }
    );
    expect(result.current.mode).toBe("spread");

    // Resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true, configurable: true, value: 600,
      });
      window.dispatchEvent(new Event('resize'));
    });
    rerender({ page: makeSpreadPage() });

    // After resize, mode should change
    // Note: the hook uses useEffect, so we need the rerender to trigger
    expect(result.current.mode).toBe("single");
  });
});
