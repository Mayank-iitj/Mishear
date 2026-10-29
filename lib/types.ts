export type SymbolKind =
  | 'dependency'
  | 'file'
  | 'dir'
  | 'export'
  | 'function'
  | 'class'
  | 'hook'
  | 'env'
  | 'script'
  | 'lexicon';

export interface Symbol {
  id: string;
  text: string;
  kind: SymbolKind;
  source: string;
  weight: number;
}

export interface SymbolIndex {
  repo: string;
  symbols: Symbol[];
  stats: {
    files: number;
    deps: number;
    exports: number;
    envs: number;
  };
  truncated: boolean;
  builtAt: number;
}

export type FixMethod = 'exact-join' | 'alias' | 'phonetic' | 'fuzzy' | 'llm';
export type FixStatus = 'pending' | 'accepted' | 'rejected';

export interface FixAlternative {
  text: string;
  confidence: number;
}

export interface Fix {
  id: string;
  start: number;
  end: number;
  original: string;
  replacement: string;
  symbolKind: SymbolKind;
  confidence: number; // 0-1
  method: FixMethod;
  alternatives: FixAlternative[];
  status: FixStatus;
  needsLLM?: boolean;
}

export type DangerCategory =
  | 'destructive'
  | 'prod'
  | 'secret'
  | 'soundalike'
  | 'scope'
  | 'semantic';

export type DangerSeverity = 'low' | 'med' | 'high';

export interface DangerFlag {
  id: string;
  start: number;
  end: number;
  term: string;
  category: DangerCategory;
  severity: DangerSeverity;
  reason: string;
  confirmed: boolean;
}

export interface AnalysisResult {
  raw: string;
  fixes: Fix[];
  flags: DangerFlag[];
  corrected: string;
  wordCount: number;
  ms: number;
}

export interface VocabEntry {
  spoken: string;
  written: string;
  count: number;
  lastSeen: number;
}

export interface SessionStats {
  promptsAnalyzed: number;
  wordsDictated: number;
  mishearsFound: number;
  acceptedFixes: number;
  rejectedFixes: number;
  dangerFlagsCount: {
    low: number;
    med: number;
    high: number;
  };
  confidenceSum: number;
  topOffenders: Record<string, number>; // "spoken -> replacement" -> count
  history: {
    timestamp: number;
    wordCount: number;
    fixCount: number;
    acceptedCount: number;
    highRiskFlags: number;
  }[];
}

