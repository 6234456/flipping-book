import type { PercentageRect } from '../types/page';
import type { OverlayConfig, Hotspot } from '../types/overlay';
import type { SpreadSourceMode } from '../types/page';

/**
 * Map a single-page percentage rect to spread coordinates.
 * Spec section 8.5 transformation rule.
 */
export function mapSinglePageRectToSpreadRect(
  rect: PercentageRect,
  side: 'left' | 'right',
): PercentageRect {
  return {
    x: side === 'left' ? rect.x / 2 : 50 + rect.x / 2,
    y: rect.y,
    width: rect.width / 2,
    height: rect.height,
  };
}

function mapHotspotToSpread(
  hotspot: Hotspot,
  side: 'left' | 'right',
): Hotspot {
  const mapped: Hotspot = { ...hotspot };

  if (hotspot.rect) {
    mapped.rect = mapSinglePageRectToSpreadRect(hotspot.rect, side);
  }
  if (hotspot.circle) {
    mapped.circle = {
      center: {
        x: mapSinglePageRectToSpreadRect(
          { x: hotspot.circle.center.x, y: hotspot.circle.center.y, width: 0, height: 0 },
          side,
        ).x,
        y: hotspot.circle.center.y,
      },
      radius: hotspot.circle.radius / 2,
    };
  }
  if (hotspot.polygon) {
    mapped.polygon = hotspot.polygon.map((p) => ({
      x: side === 'left' ? p.x / 2 : 50 + p.x / 2,
      y: p.y,
    }));
  }

  return mapped;
}

/**
 * For single-spread-image: overlay coords are already in full-spread 0-100 space.
 * For two-page-composition: transform each page's overlay into spread space.
 */
export function mapOverlayToSpread(
  overlay: OverlayConfig,
  sourceMode: SpreadSourceMode,
  side: 'left' | 'right',
): OverlayConfig {
  if (sourceMode === 'single-spread-image') {
    return overlay;
  }

  return {
    ...overlay,
    hotspots: overlay.hotspots.map((hs) => mapHotspotToSpread(hs, side)),
  };
}
