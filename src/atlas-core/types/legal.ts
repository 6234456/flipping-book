import type { ISODate, LocalizedText } from './primitives';
import type { GlossaryTermId, LegalRefId, ScenarioId } from './primitives';

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
