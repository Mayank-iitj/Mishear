import { Symbol, SymbolIndex, Fix, FixAlternative, AnalysisResult, VocabEntry } from './types';
import { tokenize } from './tokenize';
import { generateSpokenForms, SpokenForm } from './identifiers';
import { getDoubleMetaphone, levenshteinSimilarity } from './phonetics';
import { SPOKEN_ALIASES, getBuiltinLexiconSymbols } from './lexicon';
import { evaluateDanger } from './danger';

// Tech verbs that provide technical context when near a window
export const TECH_VERBS = new Set([
  'install', 'import', 'deploy', 'run', 'edit', 'open', 'add', 'configure',
  'migrate', 'query', 'fix', 'update', 'delete', 'remove', 'create', 'build',
  'test', 'push', 'pull', 'commit', 'checkout', 'rebase', 'merge', 'clone',
  'start', 'stop', 'restart', 'exec', 'invoke', 'refactor', 'set',
  'get', 'post', 'put', 'patch', 'connect', 'apply', 'replace', 'generate',
  'scaffold', 'seed', 'lint', 'format', 'compile', 'bundle', 'serve', 'launch',
  'validate', 'inspect', 'provision', 'authenticate', 'verify', 'hash', 'activate'
]);

// Cue words matching symbol kinds
export const CUE_WORDS = new Set([
  'file', 'files', 'package', 'packages', 'hook', 'hooks', 'env', 'environment',
  'command', 'commands', 'function', 'functions', 'component',
  'components', 'script', 'scripts', 'dependency', 'dependencies', 'library',
  'variable', 'endpoint', 'route', 'database', 'schema', 'module', 'dir', 'folder'
]);

// Common English words (stoplist) to prevent false positives
export const COMMON_ENGLISH_WORDS = new Set([
  'a', 'about', 'above', 'across', 'after', 'again', 'against', 'all', 'almost', 'alone',
  'along', 'already', 'also', 'although', 'always', 'among', 'an', 'and', 'another', 'any',
  'anybody', 'anyone', 'anything', 'anywhere', 'are', 'area', 'areas', 'around', 'as', 'ask',
  'asked', 'asking', 'asks', 'at', 'away', 'b', 'back', 'backed', 'backing', 'backs', 'be',
  'became', 'because', 'become', 'becomes', 'becoming', 'been', 'before', 'began', 'behind',
  'being', 'beings', 'best', 'better', 'between', 'big', 'both', 'building', 'buildings', 'but',
  'by', 'c', 'came', 'can', 'cannot', 'case', 'cases', 'certain', 'certainly', 'clear', 'clearly',
  'come', 'could', 'd', 'did', 'differ', 'different', 'differently', 'do', 'does', 'done', 'down',
  'downed', 'downing', 'downs', 'during', 'e', 'each', 'early', 'either', 'end', 'ended', 'ending',
  'ends', 'enough', 'even', 'evenly', 'ever', 'every', 'everybody', 'everyone', 'everything',
  'everywhere', 'f', 'face', 'faces', 'fact', 'facts', 'far', 'felt', 'few', 'fewer', 'find',
  'finds', 'first', 'for', 'four', 'from', 'full', 'fully', 'further', 'furthered', 'furthering',
  'furthers', 'g', 'gave', 'general', 'generally', 'get', 'gets', 'getting', 'give', 'given',
  'gives', 'go', 'going', 'good', 'goods', 'got', 'great', 'greater', 'greatest', 'group',
  'grouped', 'grouping', 'groups', 'h', 'had', 'has', 'have', 'having', 'he', 'her', 'here',
  'herself', 'high', 'higher', 'highest', 'him', 'himself', 'his', 'how', 'however', 'i', 'if',
  'important', 'in', 'interest', 'interested', 'interesting', 'interests', 'into', 'is', 'it',
  'its', 'itself', 'j', 'just', 'k', 'keep', 'keeps', 'kind', 'knew', 'know', 'known', 'knows',
  'l', 'large', 'largely', 'last', 'later', 'latest', 'least', 'less', 'let', 'lets', 'like',
  'likely', 'long', 'longer', 'longest', 'look', 'looked', 'looking', 'looks', 'm', 'made', 'make',
  'making', 'man', 'many', 'may', 'me', 'member', 'members', 'men', 'might', 'more', 'most',
  'mostly', 'mr', 'mrs', 'much', 'must', 'my', 'myself', 'n', 'necessary', 'need', 'needed',
  'needing', 'needs', 'never', 'new', 'newer', 'newest', 'next', 'no', 'nobody', 'non', 'noone',
  'not', 'nothing', 'now', 'nowhere', 'number', 'numbers', 'o', 'of', 'off', 'often', 'old',
  'older', 'oldest', 'on', 'once', 'one', 'only', 'open', 'opened', 'opening', 'opens', 'or',
  'order', 'ordered', 'ordering', 'orders', 'other', 'others', 'our', 'out', 'over', 'own', 'p',
  'part', 'parted', 'parting', 'parts', 'per', 'perhaps', 'place', 'places', 'point', 'pointed',
  'pointing', 'points', 'possible', 'present', 'presented', 'presenting', 'presents', 'problem',
  'problems', 'put', 'puts', 'q', 'quite', 'r', 'rather', 'really', 'right', 'room', 'rooms',
  's', 'said', 'same', 'saw', 'say', 'says', 'second', 'seconds', 'see', 'seem', 'seemed',
  'seeming', 'seems', 'sees', 'several', 'shall', 'she', 'should', 'show', 'showed', 'showing',
  'shows', 'side', 'sides', 'since', 'small', 'smaller', 'smallest', 'so', 'some', 'somebody',
  'someone', 'something', 'somewhere', 'state', 'states', 'still', 'such', 'sure', 't', 'take',
  'taken', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'therefore', 'these', 'they',
  'thing', 'things', 'think', 'thinks', 'this', 'those', 'though', 'thought', 'thoughts', 'three',
  'through', 'thus', 'to', 'today', 'together', 'too', 'took', 'toward', 'turn', 'turned',
  'turning', 'turns', 'two', 'u', 'under', 'until', 'up', 'upon', 'us', 'use', 'used', 'uses',
  'v', 'very', 'w', 'want', 'wanted', 'wanting', 'wants', 'was', 'way', 'ways', 'we', 'well',
  'wells', 'went', 'were', 'what', 'when', 'where', 'whether', 'which', 'while', 'who', 'whole',
  'whose', 'why', 'will', 'with', 'within', 'without', 'work', 'worked', 'working', 'works',
  'would', 'x', 'y', 'year', 'years', 'yet', 'you', 'young', 'younger', 'youngest', 'your',
  'yours', 'z', 'method', 'methods', 'effective', 'base', 'super', 'table', 'tables', 'chair',
  'house', 'street', 'city', 'office', 'school', 'water', 'food', 'road', 'car', 'tree', 'sun',
  'sky', 'light', 'sound', 'voice', 'morning', 'night', 'person', 'people', 'team', 'meeting'
]);

export interface PreparedSymbol {
  symbol: Symbol;
  spoken: SpokenForm;
  primaryKey: string;
  secondaryKey: string;
}

export interface PreparedIndex {
  symbols: PreparedSymbol[];
  exactConcatMap: Map<string, PreparedSymbol[]>;
  spacedMap: Map<string, PreparedSymbol[]>;
  primaryKeyMap: Map<string, PreparedSymbol[]>;
  aliasMap: Map<string, { target: string; kind?: Symbol['kind'] }>;
  allSymbolTexts: Set<string>;
}

/**
 * Precomputes lookup structures for O(1) matching and high performance (<300ms for 500 words).
 */
export function prepareIndex(index: SymbolIndex, extraVocab: VocabEntry[] = []): PreparedIndex {
  const allSymbols = [...index.symbols];
  const seenTexts = new Set(allSymbols.map((s) => s.text.toLowerCase()));

  // Merge built-in lexicon symbols if not already in index
  const builtinSymbols = getBuiltinLexiconSymbols();
  for (const b of builtinSymbols) {
    if (!seenTexts.has(b.text.toLowerCase())) {
      allSymbols.push(b);
      seenTexts.add(b.text.toLowerCase());
    }
  }

  const prepared: PreparedSymbol[] = [];
  const exactConcatMap = new Map<string, PreparedSymbol[]>();
  const spacedMap = new Map<string, PreparedSymbol[]>();
  const primaryKeyMap = new Map<string, PreparedSymbol[]>();
  const allSymbolTexts = new Set<string>();

  for (const sym of allSymbols) {
    allSymbolTexts.add(sym.text.toLowerCase());
    const spoken = generateSpokenForms(sym.text);
    const primaryKey = spoken.keys.concat.primary;
    const secondaryKey = spoken.keys.concat.secondary;

    const prep: PreparedSymbol = {
      symbol: sym,
      spoken,
      primaryKey,
      secondaryKey,
    };
    prepared.push(prep);

    // Exact concat
    const c = spoken.concatenated;
    if (c) {
      const arr = exactConcatMap.get(c) || [];
      arr.push(prep);
      exactConcatMap.set(c, arr);
    }

    // Spaced
    const s = spoken.spaced;
    if (s) {
      const arr = spacedMap.get(s) || [];
      arr.push(prep);
      spacedMap.set(s, arr);
    }
    if (spoken.dotSpoken) {
      const arr = spacedMap.get(spoken.dotSpoken) || [];
      arr.push(prep);
      spacedMap.set(spoken.dotSpoken, arr);
    }

    // Phonetic key
    if (primaryKey) {
      const arr = primaryKeyMap.get(primaryKey) || [];
      arr.push(prep);
      primaryKeyMap.set(primaryKey, arr);
    }
    if (secondaryKey && secondaryKey !== primaryKey) {
      const arr = primaryKeyMap.get(secondaryKey) || [];
      arr.push(prep);
      primaryKeyMap.set(secondaryKey, arr);
    }
  }

  // Build alias map: SPOKEN_ALIASES + extraVocab (priority 1.0)
  const aliasMap = new Map<string, { target: string; kind?: Symbol['kind'] }>();
  for (const [k, v] of Object.entries(SPOKEN_ALIASES)) {
    aliasMap.set(k.toLowerCase().trim(), { target: v });
  }
  for (const v of extraVocab) {
    aliasMap.set(v.spoken.toLowerCase().trim(), { target: v.written });
  }

  return {
    symbols: prepared,
    exactConcatMap,
    spacedMap,
    primaryKeyMap,
    aliasMap,
    allSymbolTexts,
  };
}

interface RawCandidate {
  symbol: Symbol;
  score: number;
  method: Fix['method'];
  start: number;
  end: number;
  original: string;
}

/**
 * Match misheard identifiers against a prepared index.
 */
export function matchMishears(
  text: string,
  preparedIndex: PreparedIndex,
  options: { wrapBackticks?: boolean } = {}
): AnalysisResult {
  const startTime = performance.now();
  const tokens = tokenize(text);
  const wordCount = tokens.length;

  if (wordCount === 0) {
    const danger = evaluateDanger(text, text);
    return {
      raw: text,
      fixes: [],
      flags: danger,
      corrected: text,
      wordCount: 0,
      ms: Math.round(performance.now() - startTime),
    };
  }

  // Detect technical context in entire prompt or per sentence
  const lowerPrompt = text.toLowerCase();
  const hasTechVerb = Array.from(TECH_VERBS).some((v) =>
    new RegExp(`\\b${v}\\b`, 'i').test(lowerPrompt)
  );
  const hasTechCue = Array.from(CUE_WORDS).some((c) =>
    new RegExp(`\\b${c}\\b`, 'i').test(lowerPrompt)
  );

  const candidatesBySpan: Map<string, RawCandidate[]> = new Map();

  // Slide windows of n = 1..6 words (allows multi-word terms with spoken extensions like "super base client dot t s")
  const maxN = 6;
  for (let i = 0; i < tokens.length; i++) {
    for (let len = 1; len <= maxN && i + len <= tokens.length; len++) {
      const windowTokens = tokens.slice(i, i + len);

      // Skip if any token is inside a code span or URL
      if (windowTokens.some((t) => t.isCodeSpan || t.isUrl)) {
        continue;
      }

      const originalSpanText = text.slice(windowTokens[0].start, windowTokens[len - 1].end);
      const spaced = windowTokens.map((t) => t.word).join(' ').trim();
      const joined = windowTokens.map((t) => t.word).join('').trim();

      if (!spaced || !joined) continue;

      // Skip tokens already exactly equal to an indexed symbol
      if (len === 1 && preparedIndex.allSymbolTexts.has(joined)) {
        continue;
      }

      // Check context cues near this window (-3 to +3 tokens)
      const contextWindow = tokens.slice(Math.max(0, i - 4), Math.min(tokens.length, i + len + 4));
      const nearTechVerb = contextWindow.some((t) => TECH_VERBS.has(t.word));
      const nearTechCue = contextWindow.some((t) => CUE_WORDS.has(t.word));

      // Check if all tokens in window are common English stop words
      const allCommon = windowTokens.every((t) => COMMON_ENGLISH_WORDS.has(t.word));

      // Check if window is a plain English phrase with no technical context
      const isPlainEnglishNoTech = allCommon && !nearTechVerb && !nearTechCue && !hasTechVerb && !hasTechCue;

      const candidates: RawCandidate[] = [];

      // 1. Check ALIAS map (exact match on spaced or joined)
      const aliasTarget = preparedIndex.aliasMap.get(spaced) || preparedIndex.aliasMap.get(joined);
      if (aliasTarget) {
        let sym = preparedIndex.symbols.find(
          (s) => s.symbol.text.toLowerCase() === aliasTarget.target.toLowerCase()
        )?.symbol;

        if (!sym) {
          sym = {
            id: `alias-${aliasTarget.target.toLowerCase()}`,
            text: aliasTarget.target,
            kind: 'lexicon',
            source: 'alias',
            weight: 1.0,
          };
        }

        let score = 0.97;
        if (isPlainEnglishNoTech) {
          // Penalize if plain English phrase with no technical context
          score *= 0.6;
        }

        candidates.push({
          symbol: sym,
          score,
          method: 'alias',
          start: windowTokens[0].start,
          end: windowTokens[len - 1].end,
          original: originalSpanText,
        });
      }

      // 2. Exact-join: joined == symbol concatenated form
      const exactHits = preparedIndex.exactConcatMap.get(joined);
      if (exactHits) {
        for (const hit of exactHits) {
          // If all tokens are common words and not an alias, check length
          if (hit.symbol.text.length < 4 && len > 1) continue;
          let score = 1.0 * hit.symbol.weight;
          if (hit.symbol.weight >= 0.9) score = Math.max(score, 0.95);
          if (isPlainEnglishNoTech) score *= 0.6;

          candidates.push({
            symbol: hit.symbol,
            score,
            method: 'exact-join',
            start: windowTokens[0].start,
            end: windowTokens[len - 1].end,
            original: originalSpanText,
          });
        }
      }

      // 3. Spaced match (e.g. dot-spoken like "client dot t s")
      const spacedHits = preparedIndex.spacedMap.get(spaced);
      if (spacedHits) {
        for (const hit of spacedHits) {
          let score = 0.98 * hit.symbol.weight;
          if (isPlainEnglishNoTech) score *= 0.6;
          candidates.push({
            symbol: hit.symbol,
            score,
            method: 'exact-join',
            start: windowTokens[0].start,
            end: windowTokens[len - 1].end,
            original: originalSpanText,
          });
        }
      }

      // 4. Phonetic & Fuzzy matching (only if joined length >= 3 and has some tech context or non-common words)
      if (joined.length >= 3 && !allCommon && (hasTechVerb || hasTechCue || nearTechVerb || nearTechCue)) {
        const joinedMeta = getDoubleMetaphone(joined);

        // Candidate pool from primary phonetic key
        const pool = new Set<PreparedSymbol>();
        if (joinedMeta.primary) {
          const mHits = preparedIndex.primaryKeyMap.get(joinedMeta.primary) || [];
          for (const h of mHits) pool.add(h);
        }
        if (joinedMeta.secondary && joinedMeta.secondary !== joinedMeta.primary) {
          const mHits = preparedIndex.primaryKeyMap.get(joinedMeta.secondary) || [];
          for (const h of mHits) pool.add(h);
        }

        for (const prep of pool) {
          // Rule 6.2: very short symbols (< 4 chars) require exact-join or alias
          if (prep.symbol.text.length < 4) continue;

          const symConcat = prep.spoken.concatenated;
          const sim = levenshteinSimilarity(joined, symConcat);

          // Phonetic match: primary or secondary matches
          const matchPrimary =
            joinedMeta.primary === prep.primaryKey || joinedMeta.primary === prep.secondaryKey;
          const matchSecondary =
            joinedMeta.secondary &&
            (joinedMeta.secondary === prep.primaryKey || joinedMeta.secondary === prep.secondaryKey);

          if (matchPrimary || matchSecondary) {
            let score = 0.80 + 0.15 * sim;
            score *= prep.symbol.weight;

            if (nearTechVerb) score += 0.05;
            if (nearTechCue) score += 0.05;

            candidates.push({
              symbol: prep.symbol,
              score: Math.min(1.0, score),
              method: 'phonetic',
              start: windowTokens[0].start,
              end: windowTokens[len - 1].end,
              original: originalSpanText,
            });
          }
        }

        // Fuzzy match: levenshtein similarity >= 0.82 and length >= 5
        if (joined.length >= 5) {
          for (const prep of preparedIndex.symbols) {
            if (prep.symbol.text.length < 4) continue;
            const symConcat = prep.spoken.concatenated;
            if (Math.abs(symConcat.length - joined.length) > 3) continue;

            const sim = levenshteinSimilarity(joined, symConcat);
            if (sim >= 0.82) {
              let score = sim * 0.9 * prep.symbol.weight;
              if (nearTechVerb) score += 0.05;
              if (nearTechCue) score += 0.05;

              candidates.push({
                symbol: prep.symbol,
                score: Math.min(1.0, score),
                method: 'fuzzy',
                start: windowTokens[0].start,
                end: windowTokens[len - 1].end,
                original: originalSpanText,
              });
            }
          }
        }
      }

      if (candidates.length > 0) {
        const spanKey = `${windowTokens[0].start}-${windowTokens[len - 1].end}`;
        const existing = candidatesBySpan.get(spanKey) || [];
        existing.push(...candidates);
        candidatesBySpan.set(spanKey, existing);
      }
    }
  }

  // Collapse candidates per span and pick best + alternatives
  interface SpanBest {
    start: number;
    end: number;
    original: string;
    best: RawCandidate;
    alternatives: FixAlternative[];
    needsLLM: boolean;
  }

  const spanBests: SpanBest[] = [];

  for (const [, cList] of candidatesBySpan.entries()) {
    // Deduplicate candidates by symbol text
    const bySymbol = new Map<string, RawCandidate>();
    for (const c of cList) {
      const existing = bySymbol.get(c.symbol.text);
      if (!existing || c.score > existing.score) {
        bySymbol.set(c.symbol.text, c);
      }
    }

    const sorted = Array.from(bySymbol.values()).sort((a, b) => b.score - a.score);
    if (sorted.length === 0) continue;

    const top = sorted[0];
    if (top.score < 0.62) continue;

    // Check ambiguity: if top two candidates within 0.07, or confidence in 0.62-0.8
    const second = sorted[1];
    const diff = second ? top.score - second.score : 1.0;
    const needsLLM = (second !== undefined && diff <= 0.07) || (top.score >= 0.62 && top.score <= 0.8);

    const alternatives: FixAlternative[] = sorted.slice(1, 4).map((c) => ({
      text: c.symbol.text,
      confidence: Math.round(c.score * 100) / 100,
    }));

    spanBests.push({
      start: top.start,
      end: top.end,
      original: top.original,
      best: top,
      alternatives,
      needsLLM,
    });
  }

  // 6.3 Resolution: Greedy select non-overlapping fixes by (score, span length) descending
  spanBests.sort((a, b) => {
    const aLen = a.end - a.start;
    const bLen = b.end - b.start;
    // Prefer longer multi-word spans if scores are close (e.g. "v env" over "env")
    if (Math.abs(b.best.score - a.best.score) <= 0.08 && aLen !== bLen) {
      return bLen - aLen;
    }
    return b.best.score - a.best.score;
  });

  const selectedFixes: Fix[] = [];
  const occupiedRanges: { start: number; end: number }[] = [];

  for (const sb of spanBests) {
    // Check overlap
    const overlaps = occupiedRanges.some(
      (r) => Math.max(sb.start, r.start) < Math.min(sb.end, r.end)
    );
    if (overlaps) continue;

    occupiedRanges.push({ start: sb.start, end: sb.end });

    const confidence = Math.round(sb.best.score * 100) / 100;
    // Status label bands: >= 0.9 auto-accepted, 0.75-0.9 accepted, 0.62-0.75 pending
    let status: Fix['status'] = 'pending';
    if (confidence >= 0.75) {
      status = 'accepted';
    }

    selectedFixes.push({
      id: `fix-${sb.start}-${sb.end}`,
      start: sb.start,
      end: sb.end,
      original: sb.original,
      replacement: sb.best.symbol.text,
      symbolKind: sb.best.symbol.kind,
      confidence,
      method: sb.best.method,
      alternatives: sb.alternatives,
      status,
      needsLLM: sb.needsLLM,
    });
  }

  // Sort fixes in text order (ascending by start position)
  selectedFixes.sort((a, b) => a.start - b.start);

  // 6.4 Replacement rendering
  const wrapBackticks = options.wrapBackticks ?? true;
  const corrected = renderCorrectedText(text, selectedFixes, wrapBackticks);

  // Danger Gate evaluation
  const flags = evaluateDanger(text, corrected);

  const durationMs = Math.round(performance.now() - startTime);

  return {
    raw: text,
    fixes: selectedFixes,
    flags,
    corrected,
    wordCount,
    ms: durationMs,
  };
}

/**
 * Render corrected text by applying accepted fixes and formatting.
 */
export function renderCorrectedText(
  text: string,
  fixes: Fix[],
  wrapBackticks: boolean = true
): string {
  if (fixes.length === 0) return text;

  let result = '';
  let lastIndex = 0;

  for (const fix of fixes) {
    if (fix.status !== 'accepted') {
      result += text.slice(lastIndex, fix.end);
      lastIndex = fix.end;
      continue;
    }

    result += text.slice(lastIndex, fix.start);

    // Format replacement
    let rep = fix.replacement;

    // Check if backticks should be applied
    const shouldWrap =
      wrapBackticks &&
      (fix.symbolKind === 'file' ||
        fix.symbolKind === 'script' ||
        fix.symbolKind === 'env' ||
        fix.symbolKind === 'hook' ||
        fix.symbolKind === 'dependency');

    if (shouldWrap) {
      rep = `\`${rep}\``;
    }

    // Preserve trailing punctuation from original if present
    const trailingPunctMatch = fix.original.match(/([.,;:!?]+)$/);
    if (trailingPunctMatch && !rep.endsWith(trailingPunctMatch[1])) {
      rep += trailingPunctMatch[1];
    }

    result += rep;
    lastIndex = fix.end;
  }

  result += text.slice(lastIndex);
  return result;
}
