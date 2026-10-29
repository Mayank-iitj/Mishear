import { Symbol, SymbolIndex } from './types';

export function parseManualInput(text: string, repoName = 'manual-input'): SymbolIndex {
  const trimmed = text.trim();
  const symbols: Symbol[] = [];
  let depsCount = 0;
  let filesCount = 0;
  let exportsCount = 0;
  let envsCount = 0;
  let idCounter = 1;

  // 1. Try parsing as JSON (e.g. package.json)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const pkg = JSON.parse(trimmed);
      if (pkg.name) {
        repoName = pkg.name;
        symbols.push({
          id: `man-${idCounter++}`,
          text: pkg.name,
          kind: 'dependency',
          source: 'package.json:name',
          weight: 1.0,
        });
      }

      if (pkg.dependencies && typeof pkg.dependencies === 'object') {
        for (const dep of Object.keys(pkg.dependencies)) {
          symbols.push({
            id: `man-${idCounter++}`,
            text: dep,
            kind: 'dependency',
            source: 'package.json:dependencies',
            weight: 1.0,
          });
          depsCount++;
        }
      }

      if (pkg.devDependencies && typeof pkg.devDependencies === 'object') {
        for (const dep of Object.keys(pkg.devDependencies)) {
          symbols.push({
            id: `man-${idCounter++}`,
            text: dep,
            kind: 'dependency',
            source: 'package.json:devDependencies',
            weight: 1.0,
          });
          depsCount++;
        }
      }

      if (pkg.scripts && typeof pkg.scripts === 'object') {
        for (const script of Object.keys(pkg.scripts)) {
          symbols.push({
            id: `man-${idCounter++}`,
            text: script,
            kind: 'script',
            source: 'package.json:scripts',
            weight: 0.85,
          });
        }
      }

      return {
        repo: repoName,
        symbols,
        stats: { files: filesCount, deps: depsCount, exports: exportsCount, envs: envsCount },
        truncated: false,
        builtAt: Date.now(),
      };
    } catch {
      // fallback to line-by-line parsing
    }
  }

  // 2. Line by line parsing for tree, ls -R, or list of identifiers
  const lines = trimmed.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Tree output formatting lines like │, ├──, └──
    const cleanLine = line.replace(/^[│├└─\s\t|`+-]+/, '').trim();
    if (!cleanLine) continue;

    // Detect if environment variable (ALL_CAPS_WITH_UNDERSCORES)
    if (/^[A-Z][A-Z0-9_]{3,}$/.test(cleanLine)) {
      symbols.push({
        id: `man-${idCounter++}`,
        text: cleanLine,
        kind: 'env',
        source: 'manual',
        weight: 0.95,
      });
      envsCount++;
      continue;
    }

    // Detect if hook (useSomething)
    if (/^use[A-Z]\w+$/.test(cleanLine)) {
      symbols.push({
        id: `man-${idCounter++}`,
        text: cleanLine,
        kind: 'hook',
        source: 'manual',
        weight: 0.95,
      });
      exportsCount++;
      continue;
    }

    // Detect if file with extension
    if (/\.[a-zA-Z0-9]{1,6}$/.test(cleanLine) && !cleanLine.includes(' ')) {
      symbols.push({
        id: `man-${idCounter++}`,
        text: cleanLine,
        kind: 'file',
        source: 'manual',
        weight: 0.8,
      });
      filesCount++;

      // Also add file basename without extension
      const base = cleanLine.replace(/\.[a-zA-Z0-9]+$/, '');
      if (base.length >= 3 && base !== cleanLine) {
        symbols.push({
          id: `man-${idCounter++}`,
          text: base,
          kind: 'file',
          source: 'manual',
          weight: 0.8,
        });
      }
      continue;
    }

    // Detect directory trailing slash
    if (cleanLine.endsWith('/')) {
      const dirName = cleanLine.slice(0, -1);
      symbols.push({
        id: `man-${idCounter++}`,
        text: dirName,
        kind: 'dir',
        source: 'manual',
        weight: 0.6,
      });
      continue;
    }

    // General identifier / symbol
    symbols.push({
      id: `man-${idCounter++}`,
      text: cleanLine,
      kind: 'export',
      source: 'manual',
      weight: 0.85,
    });
    exportsCount++;
  }

  return {
    repo: repoName,
    symbols,
    stats: { files: filesCount, deps: depsCount, exports: exportsCount, envs: envsCount },
    truncated: false,
    builtAt: Date.now(),
  };
}

