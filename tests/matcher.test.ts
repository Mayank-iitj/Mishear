import { describe, it, expect } from 'vitest';
import { matchMishears, prepareIndex } from '../lib/matcher';
import { getDemoSymbolIndex } from '../lib/demo';
import { exportToWispr, exportToCsv, exportToJson, importVocabulary } from '../lib/vocab';
import { parseManualInput } from '../lib/manualIndex';
import fixtures from './fixtures/mishears.json';

describe('Matcher Core Logic & Tests', () => {
  const index = getDemoSymbolIndex();
  const prepared = prepareIndex(index);

  it('matches all 6 demo prompt requirements', () => {
    // 1. open super base client dot t s and replace the use effect hook with use memo
    const res1 = matchMishears(
      'open super base client dot t s and replace the use effect hook with use memo',
      prepared
    );
    expect(res1.fixes.some((f) => f.replacement === 'supabase-client.ts')).toBe(true);
    expect(res1.fixes.some((f) => f.replacement === 'useEffect')).toBe(true);
    expect(res1.fixes.some((f) => f.replacement === 'useMemo')).toBe(true);

    // 2. install talwind and pris ma then run db migrate
    const res2 = matchMishears('install talwind and pris ma then run db migrate', prepared);
    expect(res2.fixes.some((f) => f.replacement === 'Tailwind')).toBe(true);
    expect(res2.fixes.some((f) => f.replacement === 'Prisma')).toBe(true);
    expect(res2.fixes.some((f) => f.replacement === 'db:migrate')).toBe(true);

    // 3. set the supa base url in the dot env file
    const res3 = matchMishears('set the supa base url in the dot env file', prepared);
    expect(res3.fixes.some((f) => f.replacement === 'SUPABASE_URL')).toBe(true);
    expect(res3.fixes.some((f) => f.replacement === '.env')).toBe(true);

    // 4. delete the user table and redeploy to production
    const res4 = matchMishears('delete the user table and redeploy to production', prepared);
    expect(res4.flags.some((fl) => fl.severity === 'high')).toBe(true);

    // 5. push the branch to main with force
    const res5 = matchMishears('push the branch to main with force', prepared);
    expect(res5.flags.some((fl) => fl.severity === 'high')).toBe(true);

    // 6. cube cuddle apply the engine x config
    const res6 = matchMishears('cube cuddle apply the engine x config', prepared);
    expect(res6.fixes.some((f) => f.replacement === 'kubectl')).toBe(true);
    expect(res6.fixes.some((f) => f.replacement === 'nginx')).toBe(true);
  });

  it('correctly ignores negative cases (ordinary English)', () => {
    const negatives = fixtures.filter((f) => f.kind === 'negative');
    for (const neg of negatives) {
      const res = matchMishears(neg.spoken, prepared);
      expect(res.fixes.length).toBe(0);
    }
  });

  it('resolves non-overlapping spans greedily', () => {
    const text = 'open super base client dot t s';
    const res = matchMishears(text, prepared);
    // Should choose the single multi-word fix 'supabase-client.ts' rather than broken fragments
    expect(res.fixes.length).toBe(1);
    expect(res.fixes[0].replacement).toBe('supabase-client.ts');
  });

  it('exports and imports vocabulary correctly', () => {
    const vocab = [
      { spoken: 'talwind', written: 'Tailwind', count: 3, lastSeen: 1700000000 },
      { spoken: 'pris ma', written: 'Prisma', count: 2, lastSeen: 1700000000 },
    ];
    const wispr = exportToWispr(vocab);
    expect(wispr).toContain('Prisma\nTailwind');

    const csv = exportToCsv(vocab);
    expect(csv).toContain('"talwind","Tailwind",3,1700000000');

    const json = exportToJson(vocab);
    expect(json).toContain('"spoken": "talwind"');

    const imported = importVocabulary('superbase,supabase,5,1700000000', vocab);
    expect(imported.added).toBe(1);
    expect(imported.entries.some((e) => e.written === 'supabase')).toBe(true);
  });

  it('parses manual package.json and file tree input', () => {
    const pkg = JSON.stringify({
      name: 'my-app',
      dependencies: { lodash: '^4.17.21' },
      scripts: { build: 'next build' },
    });
    const parsedPkg = parseManualInput(pkg);
    expect(parsedPkg.symbols.some((s) => s.text === 'lodash')).toBe(true);
    expect(parsedPkg.symbols.some((s) => s.text === 'build')).toBe(true);

    const tree = `
      src/
      ├── utils.ts
      ├── useTheme.ts
      └── API_KEY
    `;
    const parsedTree = parseManualInput(tree);
    expect(parsedTree.symbols.some((s) => s.text === 'utils.ts')).toBe(true);
    expect(parsedTree.symbols.some((s) => s.text === 'useTheme.ts')).toBe(true);
    expect(parsedTree.symbols.some((s) => s.text === 'API_KEY')).toBe(true);
  });
});

