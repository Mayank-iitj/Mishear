import { DangerFlag, DangerSeverity } from './types';
import { getDoubleMetaphone, levenshteinDistance } from './phonetics';

// Soundalike pairs that can invert or materially change meaning
export const SOUNDALIKE_PAIRS: [string, string][] = [
  ['deploy', 'destroy'],
  ['delete', 'deleted'],
  ['drop', 'dump'],
  ['push', 'pull'],
  ['merge', 'purge'],
  ['migrate', 'mitigate'],
  ['rebase', 'erase'],
  ['revert', 'convert'],
  ['reset', 'resend'],
  ['clone', 'clean'],
  ['fork', 'force'],
  ['ship', 'skip'],
  ['stash', 'trash'],
  ['prune', 'prone'],
];

const DESTRUCTIVE_PATTERNS: { regex: RegExp; term: string }[] = [
  { regex: /\brm\s+-rf\b/i, term: 'rm -rf' },
  { regex: /\b(force\s+push|push\s+--force|--force|-f)\b/i, term: 'force push' },
  { regex: /\breset\s+--hard\b/i, term: 'reset --hard' },
  { regex: /\bclean\s+-fd\b/i, term: 'clean -fd' },
  { regex: /\bdown\s+-v\b/i, term: 'down -v' },
  { regex: /\bformat\s+disk\b/i, term: 'format disk' },
  { regex: /\bdrop\s+table\b/i, term: 'DROP TABLE' },
  { regex: /\bdelete\s+from\s+\w+(?!\s+where\b)/i, term: 'DELETE FROM without WHERE' },
  { regex: /\b(drop|delete|remove|truncate|wipe|purge|destroy|nuke|kill|revoke|overwrite)\b/i, term: 'destructive verb' },
];

const PROD_PATTERNS = /\b(production|prod|deploy|redeploy|release|migrate|rollback|main branch|master)\b/i;

const SECRET_TERMS = /\b(secret|token|api key|password|\.env|credentials|private key)\b/i;
const SECRET_VERBS = /\b(print|log|commit|push|share|paste|expose|upload)\b/i;

const SCOPE_QUANTIFIERS = /\b(all|every|everything|entire|whole|recursively)\b/i;

/**
 * Rule engine that evaluates both raw and corrected text for semantic dangers.
 */
export function evaluateDanger(rawText: string, correctedText: string): DangerFlag[] {
  const flags: DangerFlag[] = [];
  const textToScan = `${rawText} ${correctedText}`;
  let flagIdCounter = 1;

  // 1. Destructive check
  let hasDestructive = false;
  let destructiveTerm = '';
  let destructiveIndex = -1;

  for (const p of DESTRUCTIVE_PATTERNS) {
    const match = p.regex.exec(textToScan);
    if (match) {
      hasDestructive = true;
      destructiveTerm = match[0];
      destructiveIndex = match.index;
      break;
    }
  }

  // 2. Production check
  const prodMatch = PROD_PATTERNS.exec(textToScan);
  if (prodMatch) {
    if (hasDestructive) {
      // Destructive combined with prod -> High severity
      flags.push({
        id: `danger-${flagIdCounter++}`,
        start: prodMatch.index,
        end: prodMatch.index + prodMatch[0].length,
        term: prodMatch[0],
        category: 'prod',
        severity: 'high',
        reason: `Destructive action ('${destructiveTerm}') targeted at production environment (${prodMatch[0]}).`,
        confirmed: false,
      });
    } else {
      flags.push({
        id: `danger-${flagIdCounter++}`,
        start: prodMatch.index,
        end: prodMatch.index + prodMatch[0].length,
        term: prodMatch[0],
        category: 'prod',
        severity: 'med',
        reason: `Action references production environment or deployment: '${prodMatch[0]}'.`,
        confirmed: false,
      });
    }
  }

  // If has destructive and wasn't already caught as high under prod, add high destructive flag
  if (hasDestructive && !flags.some((f) => f.category === 'prod' && f.severity === 'high')) {
    flags.push({
      id: `danger-${flagIdCounter++}`,
      start: Math.max(0, destructiveIndex),
      end: Math.max(0, destructiveIndex) + destructiveTerm.length,
      term: destructiveTerm,
      category: 'destructive',
      severity: 'high',
      reason: `Potentially irreversible destructive action: '${destructiveTerm}'.`,
      confirmed: false,
    });
  }

  // 3. Secret exposure check
  const secretMatch = SECRET_TERMS.exec(textToScan);
  const secretVerbMatch = SECRET_VERBS.exec(textToScan);
  if (secretMatch && secretVerbMatch) {
    flags.push({
      id: `danger-${flagIdCounter++}`,
      start: secretMatch.index,
      end: secretMatch.index + secretMatch[0].length,
      term: `${secretVerbMatch[0]} ${secretMatch[0]}`,
      category: 'secret',
      severity: 'med',
      reason: `Detected secret/credential '${secretMatch[0]}' paired with '${secretVerbMatch[0]}' action.`,
      confirmed: false,
    });
  }

  // 4. Scope check (quantifier + destructive)
  const scopeMatch = SCOPE_QUANTIFIERS.exec(textToScan);
  if (scopeMatch && hasDestructive) {
    flags.push({
      id: `danger-${flagIdCounter++}`,
      start: scopeMatch.index,
      end: scopeMatch.index + scopeMatch[0].length,
      term: `${scopeMatch[0]} ${destructiveTerm}`,
      category: 'scope',
      severity: 'med',
      reason: `Broad scope quantifier '${scopeMatch[0]}' combined with destructive action '${destructiveTerm}'.`,
      confirmed: false,
    });
  }

  // 5. Soundalike check
  // Check words in text for soundalikes where meaning could invert
  const words = rawText.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/).filter(Boolean);
  for (const word of words) {
    for (const [w1, w2] of SOUNDALIKE_PAIRS) {
      let matchedSide: string | null = null;
      let otherSide: string | null = null;

      if (word === w1 || (levenshteinDistance(word, w1) <= 2 && getDoubleMetaphone(word).primary === getDoubleMetaphone(w1).primary)) {
        matchedSide = w1;
        otherSide = w2;
      } else if (word === w2 || (levenshteinDistance(word, w2) <= 2 && getDoubleMetaphone(word).primary === getDoubleMetaphone(w2).primary)) {
        matchedSide = w2;
        otherSide = w1;
      }

      if (matchedSide && otherSide) {
        // Check if other side is destructive or opposite meaning
        const isOtherDestructive = ['destroy', 'delete', 'dump', 'purge', 'erase', 'force', 'trash', 'prune'].includes(otherSide);
        const severity: DangerSeverity = isOtherDestructive || matchedSide === 'deploy' || matchedSide === 'push' || matchedSide === 'merge' ? 'high' : 'med';

        // Check if not already added
        const exists = flags.some((f) => f.category === 'soundalike' && f.term.includes(matchedSide!));
        if (!exists) {
          const idx = rawText.toLowerCase().indexOf(word);
          flags.push({
            id: `danger-${flagIdCounter++}`,
            start: idx >= 0 ? idx : 0,
            end: (idx >= 0 ? idx : 0) + word.length,
            term: `${word} (${matchedSide} / ${otherSide})`,
            category: 'soundalike',
            severity,
            reason: `ASR soundalike alert: heard '${word}', could be '${otherSide}' which would materially flip meaning.`,
            confirmed: false,
          });
        }
      }
    }
  }

  return flags;
}

/**
 * Safer rewrite message appended when toggled.
 */
export const SAFER_REWRITE_CLAUSE =
  '\nBefore running anything destructive, list exactly what will change and wait for my confirmation.';

