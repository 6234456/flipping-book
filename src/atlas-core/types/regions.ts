import type { LocalizedText } from './primitives';
import type { PercentageRect } from './page';
import type { HotspotTarget, OverlayConfig } from './overlay';

export type RegionKind =
  | 'textRegion'
  | 'section'
  | 'gridRegion'
  | 'imageHotspot'
  | 'navigation'
  | 'legalAnchor';

export type RegionRole =
  | 'pageCode'
  | 'atlasHeader'
  | 'title'
  | 'subtitle'
  | 'detectedSection'
  | 'gridRegion'
  | 'imageHotspot'
  | 'bottomNavigation'
  | 'legalAnchor'
  | 'resourceFooter';

export type ColorRole =
  | 'evidence_green'
  | 'tax_red'
  | 'legal_purple'
  | 'warning_amber'
  | 'info_blue'
  | 'neutral_slate';

export type RichRegion = {
  regionId: string;
  kind: RegionKind;
  role: RegionRole;
  colorRole?: ColorRole;
  rect: PercentageRect;
  text?: string;
  confidence?: number;
  source?: string;
  target?: HotspotTarget;
  tooltip?: LocalizedText;
};

export type RichOverlayConfig = OverlayConfig & {
  canvas: { width: number; height: number };
  regions: RichRegion[];
};
