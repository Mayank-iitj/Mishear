import { describe, it, expect } from 'vitest';
import { splitIdentifier, generateSpokenForms } from '../lib/identifiers';
import { getDoubleMetaphone, levenshteinSimilarity } from '../lib/phonetics';

describe('Identifier Splitting & Spoken Forms', () => {
  it('splits camelCase and PascalCase', () => {
    expect(splitIdentifier('useEffect')).toEqual(['use', 'effect']);
    expect(splitIdentifier('UserTable')).toEqual(['user', 'table']);
    expect(splitIdentifier('HTMLParser')).toEqual(['html', 'parser']);
  });

  it('splits snake_case, kebab-case, dots, and colons', () => {
    expect(splitIdentifier('supabase-client.ts')).toEqual(['supabase', 'client', 'ts']);
    expect(splitIdentifier('NEXT_PUBLIC_API_BASE')).toEqual(['next', 'public', 'api', 'base']);
    expect(splitIdentifier('db:migrate')).toEqual(['db', 'migrate']);
  });

  it('generates spaced and concatenated forms', () => {
    const forms = generateSpokenForms('useEffect');
    expect(forms.spaced).toBe('use effect');
    expect(forms.concatenated).toBe('useeffect');
  });

  it('generates dot-spoken forms for files', () => {
    const forms = generateSpokenForms('client.ts');
    expect(forms.dotSpoken).toBe('client dot t s');
  });

  it('computes double metaphone keys', () => {
    const key = getDoubleMetaphone('supabase');
    expect(key.primary).toBeTruthy();
  });

  it('computes levenshtein similarity', () => {
    expect(levenshteinSimilarity('talwind', 'tailwind')).toBeGreaterThan(0.8);
    expect(levenshteinSimilarity('exact', 'exact')).toBe(1.0);
  });
});

