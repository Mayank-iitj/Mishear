import { Symbol, SymbolIndex, SymbolKind } from './types';

interface LRUEntry {
  index: SymbolIndex;
  expiresAt: number;
}

// In-memory LRU cache (50 entries, 10 min TTL)
const CACHE = new Map<string, LRUEntry>();
const MAX_CACHE_SIZE = 50;
const CACHE_TTL_MS = 10 * 60 * 1000;

// Simple in-memory rate limiter per IP: 20 requests/min
const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(ip);

  if (!entry || now > entry.resetAt) {
    RATE_LIMIT_MAP.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

export function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
  if (!url || url.length > 200) return null;
  // Strict regex for SSRF protection: only https://github.com/{owner}/{repo}
  const match = /^https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/tree\/([a-zA-Z0-9_./-]+))?$/.exec(url.trim());
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
    branch: match[3],
  };
}

const SKIP_PATHS = [
  'node_modules/', '.git/', 'dist/', 'build/', '.next/', '.turbo/',
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'Cargo.lock', 'go.sum'
];

const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.mp3', '.mp4',
  '.zip', '.tar', '.gz', '.pdf', '.woff', '.woff2', '.ttf', '.eot'
]);

export async function fetchAndIndexGitHubRepo(
  repoUrl: string,
  githubToken?: string
): Promise<SymbolIndex> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error('Invalid GitHub repository URL. Must match https://github.com/{owner}/{repo}');
  }

  const { owner, repo, branch: requestedBranch } = parsed;
  const cacheKey = `${owner}/${repo}:${requestedBranch || 'default'}`.toLowerCase();

  // Check cache
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.index;
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Mishear-Voice-Firewall',
  };
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  // 1. Fetch repo metadata
  const repoMetaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    signal: AbortSignal.timeout(6000),
  });

  if (!repoMetaRes.ok) {
    if (repoMetaRes.status === 404) {
      throw new Error(`Repository '${owner}/${repo}' not found or is private.`);
    }
    if (repoMetaRes.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please use "Paste instead" or provide GITHUB_TOKEN.');
    }
    throw new Error(`GitHub API error: HTTP ${repoMetaRes.status}`);
  }

  const repoMeta = await repoMetaRes.json();
  const defaultBranch = requestedBranch || repoMeta.default_branch || 'main';

  // 2. Fetch git tree recursively
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    { headers, signal: AbortSignal.timeout(8000) }
  );

  if (!treeRes.ok) {
    if (treeRes.status === 404) {
      throw new Error(`Branch '${defaultBranch}' not found in ${owner}/${repo}`);
    }
    if (treeRes.status === 403) {
      throw new Error('GitHub API rate limit reached while fetching repository tree.');
    }
    throw new Error(`Failed to fetch tree: HTTP ${treeRes.status}`);
  }

  const treeData = await treeRes.json();
  const isTruncated = Boolean(treeData.truncated);
  const treeItems: { path: string; type: 'blob' | 'tree'; size?: number }[] = treeData.tree || [];

  const symbolsMap = new Map<string, Symbol>();
  let idCounter = 1;

  function addSymbol(text: string, kind: SymbolKind, source: string, weight: number) {
    const clean = text.trim();
    if (!clean || clean.length < 2) return;
    const lower = clean.toLowerCase();
    if (!symbolsMap.has(lower) || symbolsMap.get(lower)!.weight < weight) {
      symbolsMap.set(lower, {
        id: `gh-${idCounter++}`,
        text: clean,
        kind,
        source,
        weight,
      });
    }
  }

  let fileCount = 0;
  let depsCount = 0;
  let exportsCount = 0;
  let envsCount = 0;

  const candidateSourceFiles: { path: string; size?: number; rank: number }[] = [];
  const candidateManifests: string[] = [];

  for (const item of treeItems) {
    const path = item.path;

    // Check skips
    if (SKIP_PATHS.some((p) => path.startsWith(p) || path.includes('/' + p))) continue;

    const ext = path.includes('.') ? path.slice(path.lastIndexOf('.')).toLowerCase() : '';
    if (BINARY_EXTS.has(ext)) continue;

    const segments = path.split('/');
    const basename = segments[segments.length - 1];

    if (item.type === 'tree') {
      addSymbol(basename, 'dir', path, 0.6);
    } else if (item.type === 'blob') {
      fileCount++;
      addSymbol(basename, 'file', path, 0.8);

      const nameWithoutExt = basename.replace(/\.[^/.]+$/, '');
      if (nameWithoutExt && nameWithoutExt !== basename && nameWithoutExt.length >= 3) {
        addSymbol(nameWithoutExt, 'file', path, 0.8);
      }

      // Check for manifests
      const lowerBase = basename.toLowerCase();
      if (
        ['package.json', 'requirements.txt', 'pyproject.toml', 'cargo.toml', 'go.mod', '.env.example', 'docker-compose.yml', 'docker-compose.yaml'].includes(lowerBase)
      ) {
        if (candidateManifests.length < 7) {
          candidateManifests.push(path);
        }
      }

      // Check for source files
      if (['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs'].includes(ext)) {
        if (!item.size || item.size < 60000) {
          let rank = segments.length; // closeness to root
          if (/index|app|main|route|client|server|hook|util/i.test(basename)) {
            rank -= 5;
          }
          candidateSourceFiles.push({ path, size: item.size, rank });
        }
      }
    }
  }

  // 3. Fetch manifests in parallel (raw.githubusercontent.com, 5s timeout each)
  const manifestPromises = candidateManifests.map(async (mPath) => {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${mPath}`;
      const res = await fetch(rawUrl, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return;
      const content = await res.text();
      const lowerPath = mPath.toLowerCase();

      if (lowerPath.endsWith('package.json')) {
        const pkg = JSON.parse(content);
        if (pkg.name) addSymbol(pkg.name, 'dependency', mPath, 1.0);
        if (pkg.dependencies) {
          for (const d of Object.keys(pkg.dependencies)) {
            addSymbol(d, 'dependency', mPath, 1.0);
            depsCount++;
          }
        }
        if (pkg.devDependencies) {
          for (const d of Object.keys(pkg.devDependencies)) {
            addSymbol(d, 'dependency', mPath, 1.0);
            depsCount++;
          }
        }
        if (pkg.scripts) {
          for (const s of Object.keys(pkg.scripts)) {
            addSymbol(s, 'script', mPath, 0.85);
          }
        }
      } else if (lowerPath.endsWith('.env.example')) {
        const lines = content.split('\n');
        for (const l of lines) {
          const match = /^([A-Z0-9_]{3,})\s*=/i.exec(l.trim());
          if (match) {
            addSymbol(match[1], 'env', mPath, 0.95);
            envsCount++;
          }
        }
      } else if (lowerPath.endsWith('requirements.txt')) {
        const lines = content.split('\n');
        for (const l of lines) {
          const line = l.trim().split(/[=<>~#;]/)[0].trim();
          if (line) {
            addSymbol(line, 'dependency', mPath, 1.0);
            depsCount++;
          }
        }
      } else if (lowerPath.endsWith('cargo.toml')) {
        const lines = content.split('\n');
        let inDeps = false;
        for (const l of lines) {
          const trimmed = l.trim();
          if (trimmed.startsWith('[')) {
            inDeps = /\[.*dependencies.*\]/i.test(trimmed);
            continue;
          }
          if (inDeps) {
            const m = /^([a-zA-Z0-9_-]+)\s*=/i.exec(trimmed);
            if (m) {
              addSymbol(m[1], 'dependency', mPath, 1.0);
              depsCount++;
            }
          }
        }
      } else if (lowerPath.endsWith('go.mod')) {
        const lines = content.split('\n');
        for (const l of lines) {
          const m = /^\s*([a-zA-Z0-9_./-]+)\s+v[0-9]/i.exec(l);
          if (m) {
            const modName = m[1].split('/').pop() || m[1];
            addSymbol(modName, 'dependency', mPath, 1.0);
            depsCount++;
          }
        }
      }
    } catch {
      // non-blocking
    }
  });

  await Promise.allSettled(manifestPromises);

  // 4. Fetch up to 25 source files ranked
  candidateSourceFiles.sort((a, b) => a.rank - b.rank);
  const topSourceFiles = candidateSourceFiles.slice(0, 25);

  const sourcePromises = topSourceFiles.map(async (sf) => {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${sf.path}`;
      const res = await fetch(rawUrl, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return;
      const content = await res.text();

      // Regex extracts
      // export (default )?(function|class|const|let|type|interface) Name
      const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|type|interface)\s+([A-Za-z0-9_]+)/g;
      let expMatch: RegExpExecArray | null;
      while ((expMatch = exportRegex.exec(content)) !== null) {
        addSymbol(expMatch[1], 'export', sf.path, 0.9);
        exportsCount++;
      }

      // Hooks matching use[A-Z]\w+
      const hookRegex = /\b(use[A-Z]\w+)\b/g;
      let hookMatch: RegExpExecArray | null;
      while ((hookMatch = hookRegex.exec(content)) !== null) {
        addSymbol(hookMatch[1], 'hook', sf.path, 0.95);
      }

      // Python / Go / Rust definitions
      const defRegex = /\bdef\s+([a-zA-Z0-9_]+)/g;
      let defMatch: RegExpExecArray | null;
      while ((defMatch = defRegex.exec(content)) !== null) {
        addSymbol(defMatch[1], 'function', sf.path, 0.9);
      }

      const classRegex = /\bclass\s+([a-zA-Z0-9_]+)/g;
      let classMatch: RegExpExecArray | null;
      while ((classMatch = classRegex.exec(content)) !== null) {
        addSymbol(classMatch[1], 'class', sf.path, 0.9);
      }

      const funcRegex = /\bfunc\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)/g;
      let funcMatch: RegExpExecArray | null;
      while ((funcMatch = funcRegex.exec(content)) !== null) {
        addSymbol(funcMatch[1], 'function', sf.path, 0.9);
      }

      // Envs
      const envRegex = /process\.env\.([A-Z0-9_]+)|os\.environ(?:\["|get\(")([A-Z0-9_]+)/g;
      let envMatch: RegExpExecArray | null;
      while ((envMatch = envRegex.exec(content)) !== null) {
        const envName = envMatch[1] || envMatch[2];
        if (envName) {
          addSymbol(envName, 'env', sf.path, 0.95);
          envsCount++;
        }
      }
    } catch {
      // non-blocking
    }
  });

  await Promise.allSettled(sourcePromises);

  // Cap total symbols at 6000
  const finalSymbols = Array.from(symbolsMap.values()).slice(0, 6000);

  const index: SymbolIndex = {
    repo: `${owner}/${repo}`,
    symbols: finalSymbols,
    stats: {
      files: fileCount,
      deps: depsCount,
      exports: exportsCount,
      envs: envsCount,
    },
    truncated: isTruncated,
    builtAt: Date.now(),
  };

  // Cache result
  if (CACHE.size >= MAX_CACHE_SIZE) {
    const oldestKey = CACHE.keys().next().value;
    if (oldestKey) CACHE.delete(oldestKey);
  }
  CACHE.set(cacheKey, { index, expiresAt: Date.now() + CACHE_TTL_MS });

  return index;
}

