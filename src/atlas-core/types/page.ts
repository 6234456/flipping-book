import type { ISODateTime, ISODate, LocalizedText } from './primitives';
import type {
  BookId, PageId, ImageAssetId, OverlayConfigId, HotspotId,
  ContentId, ContentBlockId, GlossaryTermId, LegalRefId,
  ScenarioId, NoteId, CommentThreadId, UserId,
  AtlasVisualSystem, ManifestSchemaVersion, ReaderInteractionMode,
} from './primitives';

// ============================================================
// Page size & format types (spec section 7)
// ============================================================

export type PageSizePreset =
  | "magazine-portrait-1000"
  | "magazine-portrait-2x"
  | "magazine-spread-2000"
  | "magazine-spread-2x"
  | "custom";

export type PageSize = {
  preset: PageSizePreset;
  width: number;
  height: number;
  aspectRatioLabel?: string;
};

export const MAGAZINE_PORTRAIT_1000: PageSize = {
  preset: "magazine-portrait-1000",
  width: 1000,
  height: 1414,
  aspectRatioLabel: "A4-like portrait",
};

export const MAGAZINE_SPREAD_2000: PageSize = {
  preset: "magazine-spread-2000",
  width: 2000,
  height: 1414,
  aspectRatioLabel: "double-page magazine spread",
};

// ============================================================
// Safe area & percentage rect (spec section 7 & 8)
// ============================================================

export type SafeArea = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type PercentageRect = {
  x: number;      // 0-100
  y: number;      // 0-100
  width: number;  // 0-100
  height: number; // 0-100
};

// ============================================================
// Spread layout (spec section 8)
// ============================================================

export type SpreadSourceMode =
  | "single-spread-image"
  | "two-page-composition";

export type SpreadLayoutConfig = {
  sourceMode: SpreadSourceMode;
  gutterWidthPercent: number;
  leftPageArea: PercentageRect;
  rightPageArea: PercentageRect;
  allowPageTurnFromLeftEdge: boolean;
  allowPageTurnFromRightEdge: boolean;
  collapseToSingleOnMobile: boolean;
  mobileOrder?: "left-first" | "right-first";
};

export const DEFAULT_SPREAD_LAYOUT: SpreadLayoutConfig = {
  sourceMode: "single-spread-image",
  gutterWidthPercent: 2,
  leftPageArea: { x: 0, y: 0, width: 50, height: 100 },
  rightPageArea: { x: 50, y: 0, width: 50, height: 100 },
  allowPageTurnFromLeftEdge: true,
  allowPageTurnFromRightEdge: true,
  collapseToSingleOnMobile: true,
  mobileOrder: "left-first",
};

// ============================================================
// Spread behavior (spec section 8.4)
// ============================================================

export type SpreadBehaviorConfig = {
  desktopDefault: "single" | "spread";
  mobileDefault: "single";
  spreadPageAdvance: "by-spread" | "by-page";
  keyboard: {
    arrowLeft: "previous";
    arrowRight: "next";
  };
  clickZones: {
    enabled: boolean;
    leftEdgePercent: number;
    rightEdgePercent: number;
  };
};

export const DEFAULT_SPREAD_BEHAVIOR: SpreadBehaviorConfig = {
  desktopDefault: "spread",
  mobileDefault: "single",
  spreadPageAdvance: "by-spread",
  keyboard: {
    arrowLeft: "previous",
    arrowRight: "next",
  },
  clickZones: {
    enabled: true,
    leftEdgePercent: 8,
    rightEdgePercent: 8,
  },
};

// ============================================================
// Reader config (spec section 6)
// ============================================================

export type ReaderMode = "singlePage" | "spread" | "auto";

export type PageTransition =
  | "none"
  | "fade"
  | "slide"
  | "magazine-slide"
  | "page-flip";

export type ReaderConfig = {
  defaultMode: ReaderMode;
  allowModeSwitch: boolean;
  transition: PageTransition;
  enableKeyboardNavigation: boolean;
  enableSwipeNavigation: boolean;
  enableProgressBar: boolean;
  enableTableOfContents: boolean;
  defaultZoom?: "fit-width" | "fit-page" | "actual-size";
  spreadBehavior: SpreadBehaviorConfig;
};

// ============================================================
// ImageAssetRef & SpreadImageRefs (spec section 9.1)
// ============================================================

export type ImageAssetRef = {
  assetId: ImageAssetId;
  version: string;
};

export type SpreadImageRefs =
  | {
      sourceMode: "single-spread-image";
      spread: ImageAssetRef;
    }
  | {
      sourceMode: "two-page-composition";
      left: ImageAssetRef;
      right: ImageAssetRef;
    };

// ============================================================
// Content & overlay refs (spec section 9)
// ============================================================

export type OverlayConfigRef = {
  overlayId: OverlayConfigId;
  imageAssetId: ImageAssetId;
  imageVersion: string;
};

export type ContentRef = {
  contentId: ContentId;
};

export type NotesConfigRef = {
  enabled: boolean;
  noteIds?: NoteId[];
  defaultOpen?: boolean;
};

export type CommentsConfigRef = {
  enabled: boolean;
  allowImagePointAnchors: boolean;
  allowImageRectAnchors: boolean;
  allowHotspotAnchors: boolean;
  allowContentBlockAnchors: boolean;
  allowTermAnchors: boolean;
  allowLegalRefAnchors: boolean;
  storage: "local" | "remote" | "disabled";
};

// ============================================================
// Page layout & manifest (spec section 9)
// ============================================================

export type PageMode = "single" | "spread";

export type PageFormat =
  | "magazine-portrait"
  | "magazine-spread"
  | "custom";

export type PageLayout = {
  mode: PageMode;
  format: PageFormat;
  size: PageSize;
  background: "image" | "html" | "hybrid";
  safeArea?: SafeArea;
  spread?: SpreadLayoutConfig;
};

export type PageType =
  | "cover"
  | "toc"
  | "imageOverlay"
  | "chapter"
  | "decisionFlow"
  | "caseStudy"
  | "appendix"
  | "glossary"
  | "scenarioDetail"
  | "legalReference";

export type PageNavigation = {
  previousPageId?: PageId;
  nextPageId?: PageId;
  parentPageId?: PageId;
  breadcrumb?: BreadcrumbItem[];
};

export type BreadcrumbItem = {
  label: LocalizedText;
  target: NavigationTarget;
};

export type NavigationTarget =
  | { kind: "page"; pageId: PageId }
  | { kind: "scenario"; scenarioId: ScenarioId }
  | { kind: "legalRef"; legalRefId: LegalRefId }
  | { kind: "glossary"; termId?: GlossaryTermId };

export type PageMeta = {
  status?: "draft" | "review" | "approved" | "published";
  author?: string;
  reviewer?: string;
  lastReviewed?: ISODate;
  tags?: string[];
};

export type PageManifest = {
  pageId: PageId;
  slug: string;
  type: PageType;
  title: LocalizedText;
  subtitle?: LocalizedText;
  sectionCode?: string;
  pageNumber?: number;
  layout: PageLayout;
  image?: ImageAssetRef;
  spreadImages?: SpreadImageRefs;
  overlay?: OverlayConfigRef;
  content?: ContentRef;
  notes?: NotesConfigRef;
  comments?: CommentsConfigRef;
  glossaryTermIds?: GlossaryTermId[];
  legalRefIds?: LegalRefId[];
  scenarioIds?: ScenarioId[];
  navigation?: PageNavigation;
  meta?: PageMeta;
};
