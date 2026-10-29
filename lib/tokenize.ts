export interface WordToken {
  word: string; // cleaned lower-case or alpha-numeric word
  raw: string;  // original word with punctuation
  start: number;
  end: number;
  isCodeSpan: boolean;
  isUrl: boolean;
}

export function tokenize(text: string): WordToken[] {
  const tokens: WordToken[] = [];
  if (!text) return tokens;

  // Identify code spans `...`
  const codeSpanRanges: { start: number; end: number }[] = [];
  const codeRegex = /`[^`]*`/g;
  let codeMatch: RegExpExecArray | null;
  while ((codeMatch = codeRegex.exec(text)) !== null) {
    codeSpanRanges.push({ start: codeMatch.index, end: codeMatch.index + codeMatch[0].length });
  }

  // Identify URLs
  const urlRanges: { start: number; end: number }[] = [];
  const urlRegex = /https?:\/\/[^\s)]+/gi;
  let urlMatch: RegExpExecArray | null;
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    urlRanges.push({ start: urlMatch.index, end: urlMatch.index + urlMatch[0].length });
  }

  // Match words: alphanumeric sequences, possibly with hyphens or underscores or dots if inside word
  // But for voice dictation, words are mostly whitespace-separated chunks like "super", "base", "client.ts"
  const wordRegex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = start + raw.length;

    const inCode = codeSpanRanges.some((r) => start >= r.start && end <= r.end);
    const inUrl = urlRanges.some((r) => start >= r.start && end <= r.end);

    // Strip leading and trailing punctuation for matching
    // Keep internal punctuation like dot in "client.ts" or hyphen in "docker-compose"
    const cleaned = raw.replace(/^[^\w$@]+|[^\w$@]+$/g, '').toLowerCase();

    tokens.push({
      word: cleaned,
      raw,
      start,
      end,
      isCodeSpan: inCode,
      isUrl: inUrl,
    });
  }

  return tokens;
}

