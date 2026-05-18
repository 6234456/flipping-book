import type { GlossaryTermId, LegalRefId } from './primitives';

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
  /** 使用警示 */
  warning?: string;
};
