import type { ContentBlockId, ContentId, GlossaryTermId, LegalRefId, ScenarioId } from './primitives';
import type { PageId } from './primitives';

// ============================================================
// Rich Text Nodes (spec section 12.2)
// ============================================================

export type RichTextNode =
  | { type: "text"; value: string }
  | { type: "strong"; children: RichTextNode[] }
  | { type: "em"; children: RichTextNode[] }
  | { type: "term"; termId: GlossaryTermId; first?: boolean }
  | { type: "legalRef"; legalRefId: LegalRefId }
  | { type: "scenarioLink"; scenarioId: ScenarioId; label?: string }
  | { type: "pageLink"; pageId: PageId; label?: string };

// ============================================================
// Content Blocks (spec section 12.1)
// ============================================================

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

export type ScenarioSummaryBlock = {
  blockId: ContentBlockId;
  type: "scenarioSummary";
  scenarioId: ScenarioId;
};

export type DecisionFlowBlock = {
  blockId: ContentBlockId;
  type: "decisionFlow";
  scenarioId: ScenarioId;
};

export type GlossaryBlock = {
  blockId: ContentBlockId;
  type: "glossary";
  termIds: GlossaryTermId[];
  layout: "list" | "grid";
};

export type ImageCaptionBlock = {
  blockId: ContentBlockId;
  type: "imageCaption";
  imageAssetId: string;
  caption: RichTextNode[];
};

export type NotesPlaceholderBlock = {
  blockId: ContentBlockId;
  type: "notesPlaceholder";
  noteIds: string[];
};

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

// ============================================================
// Page Content (spec section 12)
// ============================================================

export type PageContent = {
  contentId: ContentId;
  pageId: PageId;
  blocks: ContentBlock[];
};
