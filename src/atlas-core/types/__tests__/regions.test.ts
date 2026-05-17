import { describe, it, expect } from 'vitest';
import type { RichRegion, RichOverlayConfig, RegionRole, RegionKind, ColorRole } from '../regions';

describe('regions types', () => {
  it('RegionKind is a fixed union of six kinds', () => {
    const kinds: RegionKind[] = ['textRegion', 'section', 'gridRegion', 'imageHotspot', 'navigation', 'legalAnchor'];
    expect(kinds).toHaveLength(6);
  });

  it('RegionRole accepts known roles', () => {
    const roles: RegionRole[] = [
      'pageCode', 'atlasHeader', 'title', 'subtitle',
      'detectedSection', 'gridRegion', 'imageHotspot',
      'bottomNavigation', 'legalAnchor', 'resourceFooter',
    ];
    expect(roles).toHaveLength(10);
  });

  it('ColorRole accepts known palette ids', () => {
    const colors: ColorRole[] = [
      'evidence_green', 'tax_red', 'legal_purple',
      'warning_amber', 'info_blue', 'neutral_slate',
    ];
    expect(colors).toHaveLength(6);
  });

  it('RichRegion is constructable with minimum fields', () => {
    const region: RichRegion = {
      regionId: 'r1',
      kind: 'section',
      role: 'detectedSection',
      rect: { x: 0, y: 0, width: 100, height: 50 },
    };
    expect(region.regionId).toBe('r1');
  });

  it('RichOverlayConfig extends OverlayConfig with canvas + regions', () => {
    const config: RichOverlayConfig = {
      overlayId: 'o1',
      imageAssetId: 'i1',
      imageVersion: '0.6.1',
      coordinateSystem: 'percentage',
      hotspots: [],
      canvas: { width: 1086, height: 1448 },
      regions: [],
    };
    expect(config.canvas.width).toBe(1086);
    expect(config.regions).toEqual([]);
  });
});
