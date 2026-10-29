import { getDoubleMetaphone, PhoneticKey } from './phonetics';

export interface SpokenForm {
  parts: string[];
  spaced: string; // (a) space-joined: "use effect"
  concatenated: string; // (b) concatenated: "useeffect"
  acronymSpelled?: string; // (c) "j w t"
  dotSpoken?: string; // e.g. "supabase client dot t s" or "client dot ts"
  keys: {
    concat: PhoneticKey;
    parts: PhoneticKey[];
  };
}

/**
 * Split an identifier into spoken words.
 * Examples:
 * - "useEffect" -> ["use", "effect"]
 * - "UserTable.tsx" -> ["user", "table", "tsx"]
 * - "NEXT_PUBLIC_API_BASE" -> ["next", "public", "api", "base"]
 * - "supabase-client.ts" -> ["supabase", "client", "ts"]
 * - "db:migrate" -> ["db", "migrate"]
 */
export function splitIdentifier(ident: string): string[] {
  if (!ident) return [];

  // Remove leading @ or ./
  let s = ident.replace(/^[@./\\]+/, '');

  // Replace separators with spaces: -, _, ., /, \, :, @
  s = s.replace(/[-_./\\:@]+/g, ' ');

  // Split camelCase and PascalCase: "useEffect" -> "use Effect", "HTMLParser" -> "HTML Parser"
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  s = s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  // Split digits: "v2Api" -> "v 2 Api"
  s = s.replace(/([a-zA-Z])(\d)/g, '$1 $2');
  s = s.replace(/(\d)([a-zA-Z])/g, '$1 $2');

  // Lowercase and trim
  const parts = s
    .toLowerCase()
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return parts;
}

export function generateSpokenForms(ident: string): SpokenForm {
  const parts = splitIdentifier(ident);
  const spaced = parts.join(' ');
  const concatenated = parts.join('');

  let acronymSpelled: string | undefined;
  if (/^[A-Za-z]{2,5}$/.test(ident.replace(/[^A-Za-z]/g, '')) && parts.length === 1) {
    // e.g. "JWT" -> "j w t", "AWS" -> "a w s", "NPM" -> "n p m"
    acronymSpelled = ident.toLowerCase().split('').join(' ');
  }

  // Check dot spoken representation for files like "client.ts" -> "client dot t s" or "client dot ts"
  let dotSpoken: string | undefined;
  if (ident.includes('.')) {
    const segments = ident.split('.');
    if (segments.length === 2) {
      const baseParts = splitIdentifier(segments[0]);
      const ext = segments[1].toLowerCase();
      // "dot t s" or "dot ts"
      const extSpaced = ext.length > 1 ? ext.split('').join(' ') : ext;
      dotSpoken = `${baseParts.join(' ')} dot ${extSpaced}`;
    }
  }

  const concatKey = getDoubleMetaphone(concatenated);
  const partKeys = parts.map((p) => getDoubleMetaphone(p));

  return {
    parts,
    spaced,
    concatenated,
    acronymSpelled,
    dotSpoken,
    keys: {
      concat: concatKey,
      parts: partKeys,
    },
  };
}

