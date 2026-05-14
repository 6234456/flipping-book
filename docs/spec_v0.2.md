# Interactive Atlas Framework Spec v0.2

> Project codename: **Interactive Atlas Framework**  
> First book: **德国 / 欧盟 VAT 财务速查图册**  
> Implementation target: **B-lite 可复用框架**  
> Primary deliverable: reusable framework + first VAT demo book

---

## 0. Scope

This spec defines a reusable interactive illustrated handbook framework.

The first use case is a German / EU VAT quick-reference atlas, but the framework must not contain hard-coded VAT-specific logic. VAT content must live under a book-specific directory or data registry.

The framework must support:

1. Magazine-style sequential reading.
2. Single-page and double-spread page layouts.
3. GPT-Image / generated image assets as visual pages.
4. Transparent overlay hotspots for navigation and drill-down.
5. Glossary terms with dotted underline and tooltip.
6. PPT-like notes / supplementary material.
7. Office-style anchored comments.
8. Debug overlay mode.
9. Data-driven page rendering through a strongly typed manifest.

---

## 1. Goals and Non-goals

### 1.1 Goals

- Build a reusable atlas engine, not a one-off VAT website.
- Render books from a strongly typed `BookManifest`.
- Keep visual assets, content, overlays, notes, and comments separated.
- Support high-quality static image pages with HTML overlay interactions.
- Support both direct access mode and sequential magazine reading mode.
- Support local comments in the MVP, with a path toward server-backed collaboration.
- Ensure image replacement does not silently break overlay or comment anchors.

### 1.2 Non-goals for MVP

- No user login.
- No multi-user real-time collaboration.
- No CMS admin backend.
- No automatic PDF export.
- No true 3D page flip as the default reader.
- No automatic AI correction of overlay coordinates.
- No legal/tax correctness engine.

---

## 2. Recommended Technical Stack

### 2.1 Frontend

- React
- TypeScript
- Vite
- React Router
- Motion / Framer-style transition library
- Tailwind CSS or equivalent utility CSS

### 2.2 Optional Later Enhancements

- Page-flip library adapter for realistic magazine/book flipping.
- IndexedDB for local comment persistence.
- Server API and database for collaboration.

### 2.3 Implementation Rule

The framework should not depend on a specific book. The book must be loaded from a manifest and registries.

```text
atlas-core    = generic framework logic
atlas-ui      = reusable UI components and templates
books/de-eu-vat = first book content and assets
```

---

## 3. Global Type Principles

All major objects must have explicit TypeScript types.

Rules:

1. All IDs are strings but should use semantic prefixes where practical.
2. Page rendering must be driven by `BookManifest.pages` and `BookManifest.readingOrder`.
3. Images must be referenced through `ImageAssetRef`; do not hard-code image paths in templates.
4. Overlays must bind to `imageAssetId + imageVersion`.
5. Comments with image coordinates must bind to `imageAssetId + imageVersion`.
6. Glossary terms must be referenced by `termId`, not duplicated as free text.
7. Notes and comments must be separate object types.

---

## 4. Shared Primitive Types

```ts
export type ISODateTime = string;
export type ISODate = string;

export type LocaleCode = "zh-CN" | "de-DE" | "en-US";

export type LocalizedText = Partial<Record<LocaleCode, string>>;

export type BookId = string;
export type PageId = string;
export type ImageAssetId = string;
export type OverlayConfigId = string;
export type HotspotId = string;
export type ContentId = string;
export type ContentBlockId = string;
export type GlossaryTermId = string;
export type LegalRefId = string;
export type ScenarioId = string;
export type NoteId = string;
export type CommentThreadId = string;
export type UserId = string;

export type AtlasVisualSystem =
  | "VAT_ATLAS_MAGAZINE_V2"
  | "CUSTOM";

export type ManifestSchemaVersion = "1.0";
```

---

## 5. Book Manifest

The `BookManifest` is the top-level contract for a book.

```ts
export type BookManifest = {
  schemaVersion: ManifestSchemaVersion;

  bookId: BookId;
  slug: string;

  title: LocalizedText;
  subtitle?: LocalizedText;

  version: string;
  defaultLocale: LocaleCode;
  supportedLocales: LocaleCode[];

  visualSystem: AtlasVisualSystem;

  reader: ReaderConfig;

  pages: PageManifest[];
  readingOrder: PageId[];

  registries: RegistryRefs;

  navigation?: BookNavigationConfig;
  featureFlags?: FeatureFlags;

  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
};
```

### 5.1 Manifest Rules

- `readingOrder` must reference only valid `PageManifest.pageId` values.
- A `PageManifest` may exist outside `readingOrder` if it is accessible only through drill-down or search.
- `slug` must be unique within the book.
- `bookId + pageId` must uniquely identify a page.

---

## 6. Reader Configuration

```ts
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
```

---

## 7. Image Size and Page Format Specification

### 7.1 Logical Page Sizes

The framework uses logical sizes for layout and coordinate normalization.

```ts
export type PageSizePreset =
  | "magazine-portrait-1000"
  | "magazine-portrait-2x"
  | "magazine-spread-2000"
  | "magazine-spread-2x"
  | "custom";
```

Recommended logical dimensions:

| Preset | Width | Height | Use |
|---|---:|---:|---|
| `magazine-portrait-1000` | 1000 | 1414 | Default single page |
| `magazine-portrait-2x` | 2000 | 2828 | High-resolution single page |
| `magazine-spread-2000` | 2000 | 1414 | Default double-page spread |
| `magazine-spread-2x` | 4000 | 2828 | High-resolution double-page spread |

Allowed legacy / generated sizes:

| Width | Height | Notes |
|---:|---:|---|
| 1054 | 1492 | Existing generated portrait assets |
| 1055 | 1491 | Existing generated portrait assets |
| 1448 | 1086 | Legacy 4:3 slide-style asset; not preferred |

### 7.2 PageSize Type

```ts
export type PageSize = {
  preset: PageSizePreset;
  width: number;
  height: number;
  aspectRatioLabel?: string;
};
```

Examples:

```ts
export const MAGAZINE_PORTRAIT_1000: PageSize = {
  preset: "magazine-portrait-1000",
  width: 1000,
  height: 1414,
  aspectRatioLabel: "A4-like portrait"
};

export const MAGAZINE_SPREAD_2000: PageSize = {
  preset: "magazine-spread-2000",
  width: 2000,
  height: 1414,
  aspectRatioLabel: "double-page magazine spread"
};
```

### 7.3 Image Rendering Rules

- Images must render with `width: 100%; height: auto`.
- Do not use `object-fit: cover` for interactive image pages.
- Do not crop the image container.
- Overlay coordinates are normalized to the displayed image bounding box.
- Safe areas are advisory for design, not coordinate clipping.

---

## 8. Single Page vs Double Spread Behavior

### 8.1 Page Layout Type

```ts
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

export type SafeArea = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};
```

### 8.2 Spread Layout Config

```ts
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
```

Default spread layout:

```ts
export const DEFAULT_SPREAD_LAYOUT: SpreadLayoutConfig = {
  sourceMode: "single-spread-image",
  gutterWidthPercent: 2,
  leftPageArea: { x: 0, y: 0, width: 50, height: 100 },
  rightPageArea: { x: 50, y: 0, width: 50, height: 100 },
  allowPageTurnFromLeftEdge: true,
  allowPageTurnFromRightEdge: true,
  collapseToSingleOnMobile: true,
  mobileOrder: "left-first"
};
```

### 8.3 Double Spread Modes

#### Mode A: Single Spread Image

A full double-page image is generated as one asset.

```text
asset width: 2000
asset height: 1414
coordinate system: full spread, x/y range 0-100
left page: x 0-50
right page: x 50-100
```

Use this for:

- Cover spread.
- Chapter opener spread.
- Large flowchart spread.
- Appendix master table.

#### Mode B: Two-page Composition

Two individual portrait images are rendered side by side.

```text
left image: 1000 x 1414
right image: 1000 x 1414
rendered spread: 2000 x 1414 logical composition
```

Use this for:

- Consecutive content pages.
- Cases where left and right pages are independently addressable.
- Mobile mode where pages should collapse to one page at a time.

### 8.4 Spread Navigation Behavior

```ts
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
```

Default:

```ts
export const DEFAULT_SPREAD_BEHAVIOR: SpreadBehaviorConfig = {
  desktopDefault: "spread",
  mobileDefault: "single",
  spreadPageAdvance: "by-spread",
  keyboard: {
    arrowLeft: "previous",
    arrowRight: "next"
  },
  clickZones: {
    enabled: true,
    leftEdgePercent: 8,
    rightEdgePercent: 8
  }
};
```

### 8.5 Spread Overlay Rules

For `single-spread-image`:

- Overlay coordinates are relative to the full spread image.
- A hotspot on the left page should have `x < 50`.
- A hotspot on the right page should have `x >= 50`.
- Gutter areas should not contain critical hotspots.

For `two-page-composition`:

- Each page keeps its own overlay config.
- The renderer maps each page overlay into the composed spread area.
- Left page overlay is transformed into x range `0-50`.
- Right page overlay is transformed into x range `50-100`.

Transformation rule:

```ts
function mapSinglePageRectToSpreadRect(
  rect: PercentageRect,
  side: "left" | "right"
): PercentageRect {
  return {
    x: side === "left" ? rect.x / 2 : 50 + rect.x / 2,
    y: rect.y,
    width: rect.width / 2,
    height: rect.height
  };
}
```

---

## 9. Page Manifest

```ts
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
```

### 9.1 Spread Image References

```ts
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
```

### 9.2 Page Navigation

```ts
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
```

### 9.3 Page Meta

```ts
export type PageMeta = {
  status?: "draft" | "review" | "approved" | "published";
  author?: string;
  reviewer?: string;
  lastReviewed?: ISODate;
  tags?: string[];
};
```

---

## 10. Image Asset Registry

```ts
export type ImageAsset = {
  assetId: ImageAssetId;

  src: string;
  version: string;

  width: number;
  height: number;

  format: "png" | "jpg" | "webp" | "svg";

  visualSystem: AtlasVisualSystem;

  pageFormat: "single" | "spread";
  sizePreset: PageSizePreset;

  generatedBy?: "gpt-image" | "manual" | "figma" | "other";
  promptId?: string;

  alt: LocalizedText;

  createdAt?: ISODateTime;
};
```

### 10.1 Image Asset Rules

- `width` and `height` must match the actual image file.
- `pageFormat: "spread"` implies the image is one full double-spread image.
- `pageFormat: "single"` implies the image is a single portrait page.
- New generated image = new `version`.
- Do not overwrite an image while keeping the same version.

---

## 11. Overlay System

### 11.1 Overlay Config

```ts
export type OverlayConfigRef = {
  overlayId: OverlayConfigId;
  imageAssetId: ImageAssetId;
  imageVersion: string;
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
```

### 11.2 Hotspot

```ts
export type HotspotShape = "rect" | "circle" | "polygon";

export type PercentageRect = {
  x: number;      // 0-100
  y: number;      // 0-100
  width: number;  // 0-100
  height: number; // 0-100
};

export type PercentagePoint = {
  x: number; // 0-100
  y: number; // 0-100
};

export type Hotspot = {
  hotspotId: HotspotId;

  label: LocalizedText;

  shape: HotspotShape;

  rect?: PercentageRect;
  circle?: {
    center: PercentagePoint;
    radius: number;
  };
  polygon?: PercentagePoint[];

  target: HotspotTarget;

  tooltip?: LocalizedText;

  glossaryTermId?: GlossaryTermId;

  style?: HotspotStyle;

  disabled?: boolean;
};
```

### 11.3 Hotspot Target

```ts
export type HotspotTarget =
  | { kind: "page"; pageId: PageId }
  | { kind: "scenario"; scenarioId: ScenarioId }
  | { kind: "legalRef"; legalRefId: LegalRefId }
  | { kind: "glossary"; termId: GlossaryTermId }
  | { kind: "external"; href: string; openInNewTab?: boolean }
  | { kind: "commentAnchor"; threadId: CommentThreadId };
```

### 11.4 Hotspot Style

```ts
export type HotspotStyle = {
  debugColor?: "blue" | "orange" | "green" | "purple" | "red";
  hoverEffect?: "none" | "tint" | "outline" | "glow";
  zIndex?: number;
};
```

### 11.5 Overlay Validation Rules

- If `shape === "rect"`, `rect` is required.
- If `shape === "circle"`, `circle` is required.
- If `shape === "polygon"`, `polygon` must contain at least three points.
- All percentage coordinates must be between 0 and 100.
- `overlay.imageAssetId` and `overlay.imageVersion` must match the image used by the page.

---

## 12. Content Model

The content registry stores rich structured content. It must not be embedded directly in the manifest except by reference.

```ts
export type ContentRef = {
  contentId: ContentId;
};

export type PageContent = {
  contentId: ContentId;
  pageId: PageId;
  blocks: ContentBlock[];
};
```

### 12.1 Content Blocks

```ts
export type ContentBlock =
  | HeadingBlock
  | ParagraphBlock
  | CalloutBlock
  | ChecklistBlock
  | ComparisonTableBlock
  | ScenarioSummaryBlock
  | DecisionFlowBlock
  | GlossaryBlock
  | ImageCaptionBlock
  | NotesPlaceholderBlock;
```

```ts
export type HeadingBlock = {
  blockId: ContentBlockId;
  type: "heading";
  level: 1 | 2 | 3 | 4;
  text: RichTextNode[];
};

export type ParagraphBlock = {
  blockId: ContentBlockId;
  type: "paragraph";
  text: RichTextNode[];
};

export type CalloutBlock = {
  blockId: ContentBlockId;
  type: "callout";
  variant: "info" | "warning" | "risk" | "legal" | "evidence";
  title?: RichTextNode[];
  body: RichTextNode[];
};

export type ChecklistBlock = {
  blockId: ContentBlockId;
  type: "checklist";
  title?: RichTextNode[];
  items: RichTextNode[][];
};

export type ComparisonTableBlock = {
  blockId: ContentBlockId;
  type: "comparisonTable";
  columns: TableColumn[];
  rows: TableRow[];
};

export type TableColumn = {
  columnId: string;
  header: RichTextNode[];
  width?: string;
};

export type TableRow = {
  rowId: string;
  cells: Record<string, RichTextNode[]>;
};
```

### 12.2 Rich Text Nodes

```ts
export type RichTextNode =
  | { type: "text"; value: string }
  | { type: "strong"; children: RichTextNode[] }
  | { type: "em"; children: RichTextNode[] }
  | { type: "term"; termId: GlossaryTermId; first?: boolean }
  | { type: "legalRef"; legalRefId: LegalRefId }
  | { type: "scenarioLink"; scenarioId: ScenarioId; label?: LocalizedText }
  | { type: "pageLink"; pageId: PageId; label?: LocalizedText };
```

---

## 13. Glossary System

### 13.1 Glossary Entry

```ts
export type GlossaryCategory =
  | "vat-basic"
  | "goods"
  | "services"
  | "invoice"
  | "reporting"
  | "legal"
  | "customs"
  | "reader-ui";

export type GlossaryEntry = {
  termId: GlossaryTermId;

  zh: string;
  original: string;
  abbreviation?: string;

  category: GlossaryCategory;

  shortDefinition: string;
  longDefinition?: string;

  firstMentionFormat: string;

  relatedTermIds?: GlossaryTermId[];
  legalRefIds?: LegalRefId[];
};
```

### 13.2 Term Rendering Rules

- First occurrence: render `firstMentionFormat`.
- Later occurrences: render `abbreviation` if available; otherwise render `original` or `zh` depending on display mode.
- All rendered terms must have dotted underline.
- Hover, focus, or tap opens tooltip.
- Tooltip links to full glossary entry.

CSS requirement:

```css
.term {
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-underline-offset: 4px;
  cursor: help;
}
```

---

## 14. Legal Reference Model

```ts
export type LegalJurisdiction = "DE" | "EU" | "OTHER";

export type LegalSource =
  | "UStG"
  | "UStAE"
  | "VAT_DIRECTIVE"
  | "BMF"
  | "EU_GUIDANCE"
  | "CASE_LAW"
  | "OTHER";

export type LegalRef = {
  legalRefId: LegalRefId;

  jurisdiction: LegalJurisdiction;
  source: LegalSource;

  ref: string;
  title?: LocalizedText;

  summary: LocalizedText;

  url?: string;

  relatedTermIds?: GlossaryTermId[];
  relatedScenarioIds?: ScenarioId[];

  lastReviewed?: ISODate;
};
```

---

## 15. Scenario Model

```ts
export type ScenarioCategory =
  | "classification"
  | "domestic-b2b"
  | "eu-goods"
  | "eu-services"
  | "reverse-charge"
  | "import-export"
  | "chain-transaction"
  | "triangulation"
  | "invoice-reporting"
  | "appendix-quick-reference";

export type VatScenario = {
  scenarioId: ScenarioId;

  title: LocalizedText;
  subtitle?: LocalizedText;

  category: ScenarioCategory;

  oneSentence: LocalizedText;

  facts?: ScenarioFacts;

  decisionFlow?: DecisionNode[];

  result?: VatResult;

  invoiceHints?: RichTextNode[][];
  reportingHints?: RichTextNode[][];
  evidenceHints?: RichTextNode[][];
  redFlags?: RichTextNode[][];

  legalRefIds?: LegalRefId[];
  glossaryTermIds?: GlossaryTermId[];
  relatedScenarioIds?: ScenarioId[];

  lastReviewed?: ISODate;
};
```

```ts
export type ScenarioFacts = {
  supplier?: string;
  customer?: string;
  transactionType?: string;
  goodsMovement?: string;
  servicePlace?: string;
  vatIdStatus?: string;
  incoterms?: string;
};

export type VatResult = {
  treatment: LocalizedText;
  taxableInGermany?: boolean;
  taxRate?: "19%" | "7%" | "0%" | "exempt" | "not-taxable" | "reverse-charge" | "depends";
  taxLiability?: "supplier" | "customer" | "importer" | "depends";
};
```

### 15.1 Decision Node

```ts
export type DecisionNode = {
  nodeId: string;
  question: LocalizedText;

  answerType: "yes_no" | "single_choice" | "multi_choice" | "info";

  options?: DecisionOption[];

  explanation?: RichTextNode[];

  legalRefIds?: LegalRefId[];
  glossaryTermIds?: GlossaryTermId[];
};

export type DecisionOption = {
  value: string;
  label: LocalizedText;
  nextNodeId?: string;
  resultHint?: LocalizedText;
};
```

---

## 16. Notes Layer

Notes are PPT-like supplementary materials. They are not user comments.

```ts
export type NotesConfigRef = {
  enabled: boolean;
  noteIds?: NoteId[];
  defaultOpen?: boolean;
};

export type AtlasNote = {
  noteId: NoteId;

  bookId: BookId;
  pageId: PageId;

  anchor?: NoteAnchor;

  title?: LocalizedText;
  body: RichTextNode[];

  noteType:
    | "speaker-note"
    | "supplement"
    | "legal-background"
    | "example"
    | "authoring-note"
    | "image-prompt-note"
    | "review-note";

  visibility: "reader" | "presenter" | "editor-only";

  tags?: string[];

  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
};
```

```ts
export type NoteAnchor =
  | { kind: "page"; pageId: PageId }
  | { kind: "hotspot"; pageId: PageId; hotspotId: HotspotId }
  | { kind: "contentBlock"; pageId: PageId; blockId: ContentBlockId }
  | { kind: "term"; termId: GlossaryTermId }
  | { kind: "legalRef"; legalRefId: LegalRefId };
```

### 16.1 Notes UI Behavior

- Reader mode: notes hidden by default.
- Study mode: notes expandable.
- Presenter mode: notes drawer open by default.
- Editor mode: all notes visible.

---

## 17. Comments / Annotation Layer

Comments are Office-style anchored comment threads.

### 17.1 Comments Config

```ts
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
```

### 17.2 Annotation Anchor

```ts
export type AnchorStatus = "valid" | "needs-review" | "orphaned";

export type AnnotationAnchor =
  | {
      kind: "imagePoint";
      pageId: PageId;
      imageAssetId: ImageAssetId;
      imageVersion: string;
      x: number;
      y: number;
      status?: AnchorStatus;
    }
  | {
      kind: "imageRect";
      pageId: PageId;
      imageAssetId: ImageAssetId;
      imageVersion: string;
      rect: PercentageRect;
      status?: AnchorStatus;
    }
  | {
      kind: "hotspot";
      pageId: PageId;
      hotspotId: HotspotId;
    }
  | {
      kind: "contentBlock";
      pageId: PageId;
      blockId: ContentBlockId;
    }
  | {
      kind: "term";
      termId: GlossaryTermId;
    }
  | {
      kind: "legalRef";
      legalRefId: LegalRefId;
    };
```

### 17.3 Comment Thread

```ts
export type CommentThread = {
  threadId: CommentThreadId;

  bookId: BookId;
  pageId: PageId;

  anchor: AnnotationAnchor;

  status: "open" | "resolved" | "archived";

  category:
    | "question"
    | "correction"
    | "tax-risk"
    | "legal-source"
    | "design"
    | "translation"
    | "todo"
    | "general";

  priority?: "low" | "normal" | "high";

  assignedTo?: UserId;

  messages: CommentMessage[];

  createdBy: UserId;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  resolvedAt?: ISODateTime;
};

export type CommentMessage = {
  messageId: string;
  authorId: UserId;
  body: RichTextNode[];
  mentions?: UserId[];
  createdAt: ISODateTime;
  updatedAt?: ISODateTime;
};
```

### 17.4 Comment Mode Behavior

- Default mode is `read`.
- In read mode, clicking hotspots navigates.
- In comment mode, image clicks create `imagePoint` anchors.
- In comment mode, hotspot navigation is suspended.
- Created comment pins must appear at percentage coordinates.
- Clicking a pin opens the corresponding thread in the comment panel.
- Comments can be resolved and reopened.

```ts
export type ReaderInteractionMode =
  | "read"
  | "comment"
  | "debugOverlay";
```

---

## 18. Registry References

```ts
export type RegistryRefs = {
  imageAssets: string;
  overlays: string;
  glossary: string;
  pages?: string;
  contents?: string;
  scenarios?: string;
  legalRefs?: string;
  notes?: string;
  comments?: string;
};
```

Example:

```ts
registries: {
  imageAssets: "/books/de-eu-vat/imageAssets",
  overlays: "/books/de-eu-vat/overlays",
  glossary: "/books/de-eu-vat/glossary",
  contents: "/books/de-eu-vat/contents",
  scenarios: "/books/de-eu-vat/scenarios",
  legalRefs: "/books/de-eu-vat/legalRefs",
  notes: "/books/de-eu-vat/notes",
  comments: "local"
}
```

---

## 19. Feature Flags

```ts
export type FeatureFlags = {
  glossaryTooltips: boolean;
  notesDrawer: boolean;
  comments: boolean;
  debugOverlay: boolean;
  pageFlip: boolean;
  search: boolean;
  exportComments: boolean;
};
```

---

## 20. Book Navigation Config

```ts
export type BookNavigationConfig = {
  showTopBar: boolean;
  showBottomBar: boolean;
  showPageNumbers: boolean;
  showBreadcrumbs: boolean;
  showThumbnailStrip: boolean;
  showTableOfContentsButton: boolean;
};
```

---

## 21. Complete Example Manifest

```ts
export const vatAtlasManifest: BookManifest = {
  schemaVersion: "1.0",

  bookId: "de-eu-vat-atlas",
  slug: "de-eu-vat",

  title: {
    "zh-CN": "德国 / 欧盟 VAT 财务速查图册"
  },

  subtitle: {
    "zh-CN": "常用 B2B 场景 · 法规提示 · 可点击 Drill-down 导览"
  },

  version: "0.3",

  defaultLocale: "zh-CN",
  supportedLocales: ["zh-CN", "de-DE", "en-US"],

  visualSystem: "VAT_ATLAS_MAGAZINE_V2",

  reader: {
    defaultMode: "auto",
    allowModeSwitch: true,
    transition: "magazine-slide",
    enableKeyboardNavigation: true,
    enableSwipeNavigation: true,
    enableProgressBar: true,
    enableTableOfContents: true,
    defaultZoom: "fit-width",
    spreadBehavior: DEFAULT_SPREAD_BEHAVIOR
  },

  readingOrder: [
    "cover",
    "toc",
    "vat-framework",
    "transaction-classification",
    "einheitliche-leistung",
    "unentgeltliche-wertabgabe",
    "eu-goods",
    "appendix-goods-quick-reference",
    "glossary"
  ],

  pages: [
    {
      pageId: "cover",
      slug: "/cover",
      type: "cover",
      title: {
        "zh-CN": "德国 / 欧盟 VAT 财务速查图册"
      },
      subtitle: {
        "zh-CN": "常用 B2B 场景 · 法规提示 · 可点击 Drill-down 导览"
      },
      pageNumber: 1,
      layout: {
        mode: "single",
        format: "magazine-portrait",
        size: MAGAZINE_PORTRAIT_1000,
        background: "image"
      },
      image: {
        assetId: "atlas-cover-v01",
        version: "v01"
      },
      overlay: {
        overlayId: "atlas-cover-v01-overlay",
        imageAssetId: "atlas-cover-v01",
        imageVersion: "v01"
      },
      notes: {
        enabled: true,
        noteIds: ["cover-speaker-note-01"],
        defaultOpen: false
      },
      comments: {
        enabled: true,
        allowImagePointAnchors: true,
        allowImageRectAnchors: true,
        allowHotspotAnchors: true,
        allowContentBlockAnchors: false,
        allowTermAnchors: false,
        allowLegalRefAnchors: false,
        storage: "local"
      }
    },
    {
      pageId: "appendix-goods-spread",
      slug: "/appendix/goods-spread",
      type: "appendix",
      title: {
        "zh-CN": "附录A｜常用货物场景速查"
      },
      subtitle: {
        "zh-CN": "德国公司视角 · 一般货物（非车辆） · EXW / Abholfall"
      },
      pageNumber: 20,
      layout: {
        mode: "spread",
        format: "magazine-spread",
        size: MAGAZINE_SPREAD_2000,
        background: "image",
        spread: DEFAULT_SPREAD_LAYOUT
      },
      spreadImages: {
        sourceMode: "single-spread-image",
        spread: {
          assetId: "appendix-goods-spread-v01",
          version: "v01"
        }
      },
      overlay: {
        overlayId: "appendix-goods-spread-v01-overlay",
        imageAssetId: "appendix-goods-spread-v01",
        imageVersion: "v01"
      },
      glossaryTermIds: [
        "exw",
        "abholfall",
        "ausfuhrlieferung",
        "innergemeinschaftliche-lieferung",
        "chain-supply",
        "ust-idnr",
        "zm"
      ],
      notes: {
        enabled: true,
        noteIds: ["appendix-goods-note-01"],
        defaultOpen: false
      },
      comments: {
        enabled: true,
        allowImagePointAnchors: true,
        allowImageRectAnchors: true,
        allowHotspotAnchors: true,
        allowContentBlockAnchors: true,
        allowTermAnchors: true,
        allowLegalRefAnchors: true,
        storage: "local"
      }
    }
  ],

  registries: {
    imageAssets: "/books/de-eu-vat/imageAssets",
    overlays: "/books/de-eu-vat/overlays",
    glossary: "/books/de-eu-vat/glossary",
    contents: "/books/de-eu-vat/contents",
    scenarios: "/books/de-eu-vat/scenarios",
    legalRefs: "/books/de-eu-vat/legalRefs",
    notes: "/books/de-eu-vat/notes",
    comments: "local"
  },

  navigation: {
    showTopBar: true,
    showBottomBar: true,
    showPageNumbers: true,
    showBreadcrumbs: true,
    showThumbnailStrip: false,
    showTableOfContentsButton: true
  },

  featureFlags: {
    glossaryTooltips: true,
    notesDrawer: true,
    comments: true,
    debugOverlay: true,
    pageFlip: false,
    search: false,
    exportComments: false
  }
};
```

---

## 22. Routing

Recommended routes:

```text
/book/:bookId
/book/:bookId/page/:pageId
/book/:bookId/scenario/:scenarioId
/book/:bookId/legal/:legalRefId
/book/:bookId/glossary
```

Route behavior:

- `/book/:bookId` opens the first page in `readingOrder`.
- `/page/:pageId` opens the specific page.
- Scenario, legal, and glossary routes are drill-down routes.
- Reader state should preserve current page and interaction mode.

---

## 23. Component Architecture

```text
MagazineReader
  ReaderShell
    ReaderTopBar
    PageViewport
      PageRenderer
        CoverPageTemplate
        ImageOverlayTemplate
        ChapterTemplate
        AppendixTemplate
        GlossaryTemplate
      OverlayRenderer
        HotspotLayer
        CommentPinLayer
        CommentCaptureLayer
    ReaderBottomBar
    NotesDrawer
    CommentPanel
    TooltipProvider
```

### 23.1 PageRenderer

```ts
export type PageRendererProps = {
  manifest: BookManifest;
  page: PageManifest;
  locale: LocaleCode;
  interactionMode: ReaderInteractionMode;
};
```

### 23.2 OverlayRenderer

```ts
export type OverlayRendererProps = {
  overlay: OverlayConfig;
  imageAsset: ImageAsset;
  debug: boolean;
  interactionMode: ReaderInteractionMode;
  onNavigate: (target: HotspotTarget) => void;
  onCreateCommentAnchor: (anchor: AnnotationAnchor) => void;
};
```

---

## 24. Folder Structure

```text
src/
  app/
    App.tsx
    router.tsx

  atlas-core/
    types/
      primitives.ts
      manifest.ts
      page.ts
      image.ts
      overlay.ts
      content.ts
      glossary.ts
      legal.ts
      scenario.ts
      notes.ts
      comments.ts
      navigation.ts
    registry/
      createBookRegistry.ts
      resolvePage.ts
      resolveTarget.ts
      resolveGlossaryTerm.ts
      validateManifest.ts
    reader/
      useReaderState.ts
      useSpreadMode.ts
      useKeyboardNavigation.ts
      useSwipeNavigation.ts
    annotations/
      resolveAnchor.ts
      migrateAnchors.ts
      commentStore.ts
    notes/
      noteStore.ts

  atlas-ui/
    reader/
      MagazineReader.tsx
      ReaderShell.tsx
      ReaderTopBar.tsx
      ReaderBottomBar.tsx
      PageViewport.tsx
      ReaderProgress.tsx
    renderers/
      PageRenderer.tsx
      ContentBlockRenderer.tsx
      RichTextRenderer.tsx
    overlay/
      ImageOverlayTemplate.tsx
      HotspotLayer.tsx
      HotspotOverlay.tsx
    glossary/
      Term.tsx
      Tooltip.tsx
      GlossaryPage.tsx
    notes/
      NotesDrawer.tsx
      NotesPanel.tsx
    comments/
      AnnotationToolbar.tsx
      CommentCaptureLayer.tsx
      CommentPinLayer.tsx
      CommentPin.tsx
      CommentPanel.tsx
      CommentComposer.tsx

  books/
    de-eu-vat/
      manifest.ts
      pages.ts
      imageAssets.ts
      glossary.ts
      legalRefs.ts
      scenarios.ts
      contents.ts
      notes.ts
      overlays/
        atlas-cover-v01.overlay.ts
        appendix-goods-spread-v01.overlay.ts

  styles/
    globals.css
    vat-atlas-theme.css
```

---

## 25. MVP Pages

The first implementation must include at least:

1. Cover / atlas home page.
2. Table of contents page.
3. Transaction classification chapter page.
4. Einheitliche Leistung page.
5. EU goods chapter page.
6. Appendix A quick-reference page.
7. Glossary page.

The pages may use placeholder images except the cover and appendix page if assets are available.

---

## 26. Acceptance Criteria

### 26.1 Manifest

- App loads a `BookManifest` and renders pages from it.
- No hard-coded VAT routes are required to render book pages.
- Invalid `readingOrder` references are detected.
- Missing image or overlay references are detected.

### 26.2 Image and Spread

- Single portrait image renders without cropping.
- Double-spread image renders as one full spread on desktop.
- Two single pages can be composed into one spread.
- Mobile mode collapses spreads into single-page reading.
- Overlay coordinates remain aligned after browser resize.

### 26.3 Overlay

- Hotspots render as transparent buttons in read mode.
- Debug overlay mode shows semi-transparent hotspot rectangles.
- Clicking a hotspot navigates by semantic target.
- Overlay configs are bound to image version.

### 26.4 Glossary

- Terms render with dotted underline.
- First term occurrence can show Chinese + original + abbreviation.
- Hover/focus/tap opens tooltip.
- Tooltip links to glossary page.

### 26.5 Notes

- Notes drawer can open and close.
- Page-level notes are displayed.
- Notes can be filtered by note type.

### 26.6 Comments

- User can switch to comment mode.
- Clicking image creates a comment anchor.
- Comment pin appears at correct normalized coordinate.
- User can add message and resolve the thread.
- Read mode restores hotspot navigation.

### 26.7 Reader

- Previous / next navigation works.
- Keyboard navigation works if enabled.
- Progress indicator reflects reading order.
- Direct URL to a page works.

---

## 27. Development Phases

### Phase 1: Core Skeleton

- Types
- Manifest loader
- Reader shell
- Page renderer
- Single image page
- Basic routing

### Phase 2: Overlay and Glossary

- Hotspot layer
- Debug overlay
- Semantic navigation targets
- Glossary registry
- Term component and tooltip

### Phase 3: Spread Support

- Single spread image rendering
- Two-page composition
- Spread-to-single mobile collapse
- Spread overlay coordinate mapping

### Phase 4: Notes and Comments

- Notes drawer
- Comment mode
- Image point anchors
- Comment pins
- Comment panel
- Resolve / reopen

### Phase 5: Stabilization

- Manifest validation
- Local persistence
- Import / export comments
- Accessibility pass
- Demo book content polish

---

## 28. Future Extensions

- Server-backed comments.
- User accounts and permissions.
- Real-time collaboration.
- @mentions and assigned tasks.
- Overlay editor.
- Search.
- PDF / DOCX export.
- True 3D page flip adapter.
- CMS-style page and glossary editor.

---

## 29. Reference Notes

The framework is designed around React + TypeScript with Vite as the project scaffold, React Router for URL routing, Motion-style animation for page transitions, and optional later page-flip enhancement. The implementation must remain adapter-friendly so the page transition mechanism can change without rewriting the page model.
