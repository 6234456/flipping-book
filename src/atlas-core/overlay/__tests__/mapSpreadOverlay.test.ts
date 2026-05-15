import { describe, it, expect } from 'vitest';
import { mapSinglePageRectToSpreadRect, mapOverlayToSpread } from '../mapSpreadOverlay';
import type { PercentageRect } from '../../types/page';
import type { OverlayConfig } from '../../types/overlay';

describe('mapSinglePageRectToSpreadRect', () => {
  it('maps left page rect to spread coordinates', () => {
    const rect: PercentageRect = { x: 10, y: 20, width: 30, height: 40 };
    const result = mapSinglePageRectToSpreadRect(rect, 'left');
    expect(result).toEqual({ x: 5, y: 20, width: 15, height: 40 });
  });

  it('maps right page rect to spread coordinates', () => {
    const rect: PercentageRect = { x: 10, y: 20, width: 30, height: 40 };
    const result = mapSinglePageRectToSpreadRect(rect, 'right');
    expect(result).toEqual({ x: 55, y: 20, width: 15, height: 40 });
  });

  it('maps full-width rect correctly', () => {
    const rect: PercentageRect = { x: 0, y: 0, width: 100, height: 100 };
    const left = mapSinglePageRectToSpreadRect(rect, 'left');
    expect(left).toEqual({ x: 0, y: 0, width: 50, height: 100 });
  });
});

describe('mapOverlayToSpread', () => {
  const baseOverlay: OverlayConfig = {
    overlayId: "test-overlay",
    imageAssetId: "img-1",
    imageVersion: "v1",
    coordinateSystem: "percentage",
    hotspots: [
      {
        hotspotId: "hs-1",
        label: { "zh-CN": "热点" },
        shape: "rect",
        rect: { x: 10, y: 20, width: 30, height: 15 },
        target: { kind: "page", pageId: "p1" },
      },
    ],
  };

  it('returns overlay unchanged for single-spread-image mode', () => {
    const result = mapOverlayToSpread(baseOverlay, 'single-spread-image', 'left');
    expect(result.hotspots[0].rect).toEqual({ x: 10, y: 20, width: 30, height: 15 });
  });

  it('transforms overlay for two-page-composition left side', () => {
    const result = mapOverlayToSpread(baseOverlay, 'two-page-composition', 'left');
    expect(result.hotspots[0].rect).toEqual({ x: 5, y: 20, width: 15, height: 15 });
  });

  it('transforms overlay for two-page-composition right side', () => {
    const result = mapOverlayToSpread(baseOverlay, 'two-page-composition', 'right');
    expect(result.hotspots[0].rect).toEqual({ x: 55, y: 20, width: 15, height: 15 });
  });
});
