import type {
  ISODateTime, LocalizedText,
  GlossaryTermId, ImageAssetId,
  OverlayConfigId, HotspotId,
  CommentThreadId,
} from './primitives';
import type { PercentageRect } from './page';
import type { PageId, LegalRefId, ScenarioId } from './primitives';

export type HotspotShape = "rect" | "circle" | "polygon";

export type PercentagePoint = {
  x: number; // 0-100
  y: number; // 0-100
};

export type HotspotTarget =
  | { kind: "page"; pageId: PageId }
  | { kind: "scenario"; scenarioId: ScenarioId }
  | { kind: "legalRef"; legalRefId: LegalRefId }
  | { kind: "glossary"; termId?: GlossaryTermId }
  | { kind: "external"; href: string; openInNewTab?: boolean }
  | { kind: "commentAnchor"; threadId: CommentThreadId };

export type HotspotStyle = {
  debugColor?: "blue" | "orange" | "green" | "purple" | "red";
  hoverEffect?: "none" | "tint" | "outline" | "glow";
  zIndex?: number;
};

export type Hotspot = {
  hotspotId: HotspotId;
  label: LocalizedText;
  shape: HotspotShape;
  rect?: PercentageRect;
  circle?: { center: PercentagePoint; radius: number };
  polygon?: PercentagePoint[];
  target: HotspotTarget;
  tooltip?: LocalizedText;
  glossaryTermId?: GlossaryTermId;
  style?: HotspotStyle;
  disabled?: boolean;
};

export type OverlayConfig = {
  overlayId: OverlayConfigId;
  imageAssetId: ImageAssetId;
  imageVersion: string;
  coordinateSystem: "percentage";
  hotspots: Hotspot[];
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
};
