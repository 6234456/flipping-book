import type {
  RichOverlayConfig,
  RichRegion,
  RegionKind,
  ColorRole,
} from '../../atlas-core/types/regions';
import type { Hotspot, HotspotTarget } from '../../atlas-core/types/overlay';
import type { PercentageRect } from '../../atlas-core/types/page';
import type { RawBBox, RawOverlay, RawRegion } from './types';

const KNOWN_COLOR_ROLES: ReadonlySet<string> = new Set([
  'evidence_green',
  'tax_red',
  'legal_purple',
  'warning_amber',
  'info_blue',
  'neutral_slate',
]);

function makeToPct(width: number, height: number) {
  return (b: RawBBox): PercentageRect => ({
    x: (b.x / width) * 100,
    y: (b.y / height) * 100,
    width: (b.w / width) * 100,
    height: (b.h / height) * 100,
  });
}

function buildRegion(
  kind: RegionKind,
  raw: RawRegion,
  toPct: (b: RawBBox) => PercentageRect,
): RichRegion {
  const colorRole =
    raw.colorRole && KNOWN_COLOR_ROLES.has(raw.colorRole)
      ? (raw.colorRole as ColorRole)
      : undefined;

  return {
    regionId: raw.id,
    kind,
    role: raw.role as RichRegion['role'],
    colorRole,
    rect: toPct(raw.bbox),
    text: raw.text,
    confidence: raw.confidence,
    source: raw.source,
  };
}

function deriveTarget(region: RichRegion, sectionPageId: string): HotspotTarget {
  if (region.kind === 'navigation') {
    return { kind: 'page', pageId: 'toc' };
  }
  if (region.kind === 'legalAnchor') {
    return { kind: 'glossary' };
  }
  return { kind: 'page', pageId: sectionPageId };
}

export function convertOverlay(raw: RawOverlay): RichOverlayConfig {
  const { width, height } = raw.canvas;
  const toPct = makeToPct(width, height);

  const regions: RichRegion[] = [
    ...raw.textRegions.map((r) => buildRegion('textRegion', r, toPct)),
    ...raw.sections.map((r) => buildRegion('section', r, toPct)),
    ...raw.gridRegions.map((r) => buildRegion('gridRegion', r, toPct)),
    ...raw.imageHotspots.map((r) => buildRegion('imageHotspot', r, toPct)),
    ...raw.navigationRegions.map((r) => buildRegion('navigation', r, toPct)),
    ...raw.legalAnchors.map((r) => buildRegion('legalAnchor', r, toPct)),
  ];

  const hotspots: Hotspot[] = regions
    .filter(
      (r) =>
        r.kind === 'imageHotspot' ||
        r.kind === 'navigation' ||
        r.kind === 'legalAnchor',
    )
    .map((r) => ({
      hotspotId: r.regionId,
      shape: 'rect' as const,
      rect: r.rect,
      target: deriveTarget(r, raw.pageId),
      label: { 'zh-CN': r.role },
      tooltip: r.text ? { 'zh-CN': r.text } : undefined,
    }));

  return {
    overlayId: `${raw.sectionCode}-overlay-v06`,
    imageAssetId: `${raw.sectionCode}-current-final-v06`,
    imageVersion: '0.6.1',
    coordinateSystem: 'percentage',
    hotspots,
    canvas: { width, height },
    regions,
  };
}
