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

export type ReaderInteractionMode =
  | "read"
  | "comment"
  | "debugOverlay";
