import type { ISODateTime, LocalizedText, AtlasVisualSystem } from './primitives';
import type { ImageAssetId } from './primitives';
import type { PageSizePreset } from './page';

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
  /** Asset pack status */
  status?: "content-locked-reference" | "visual-draft" | "legacy-draft-needs-review";
};
