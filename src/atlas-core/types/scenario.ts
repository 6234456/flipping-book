import type { ISODate, LocalizedText } from './primitives';
import type { GlossaryTermId, LegalRefId, ScenarioId } from './primitives';
import type { RichTextNode } from './content';

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
