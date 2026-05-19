export interface ValidationError {
  kind: string;
  field?: string;
  file?: string;
  index?: number;
  message?: string;
  refType?: string;
  value?: string;
  sourceIndex?: number;
  expected?: string;
  actual?: string;
  indices?: number[];
}

export interface ValidationWarning {
  kind: string;
  file?: string;
}

export interface ValidationStats {
  pages: number;
  glossary: number;
  notes: number;
  scenarios: number;
  contents: number;
  legalRefs: number;
  images: number;
  overlays: number;
}

export interface ValidationResult {
  bundlePath: string;
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
}

export interface FormatOptions {
  mode: 'text' | 'json';
  quiet: boolean;
}

export function validateBundle(bundlePath: string): Promise<ValidationResult>;
export function formatResult(result: ValidationResult, options: FormatOptions): string;
