// Minimal local type bridge for VAT Atlas assets. The canonical type definitions are in spec_v0.2.md.
export type LocaleCode = "zh-CN" | "de-DE" | "en-US";
export type LocalizedText = Partial<Record<LocaleCode, string>>;
export type PageId = string;
export type ImageAssetId = string;
export type OverlayConfigId = string;
export type GlossaryTermId = string;
export type LegalRefId = string;

export type PercentageRect = { x: number; y: number; width: number; height: number };
export type ImageAssetRef = { assetId: ImageAssetId; version: string };

export type AssetPackStatus = "content-locked-reference" | "visual-draft" | "legacy-draft-needs-review";
