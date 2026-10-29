import { doubleMetaphone } from 'double-metaphone';
import { distance } from 'fastest-levenshtein';

export interface PhoneticKey {
  primary: string;
  secondary: string;
}

export function getDoubleMetaphone(text: string): PhoneticKey {
  if (!text) return { primary: '', secondary: '' };
  try {
    const res = doubleMetaphone(text);
    if (Array.isArray(res)) {
      return { primary: res[0] || '', secondary: res[1] || res[0] || '' };
    }
  } catch {
    // fallback
  }
  return { primary: '', secondary: '' };
}

export function levenshteinDistance(a: string, b: string): number {
  return distance(a, b);
}

export function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const d = distance(a, b);
  return Math.max(0, 1 - d / maxLen);
}
