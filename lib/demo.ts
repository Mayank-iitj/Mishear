import { Symbol, SymbolIndex } from './types';

export interface DemoSample {
  id: string;
  title: string;
  text: string;
  description: string;
  tags: string[];
}

export const DEMO_SAMPLES: DemoSample[] = [
  {
    id: 'sample-1',
    title: 'Sample 1: Alias + Phonetic Hook',
    text: 'open super base client dot t s and replace the use effect hook with use memo',
    description: 'Repairs "super base client dot t s" -> supabase-client.ts and "use effect" -> useEffect, "use memo" -> useMemo.',
    tags: ['alias', 'phonetic', 'hook', 'file'],
  },
  {
    id: 'sample-2',
    title: 'Sample 2: Fuzzy + Script',
    text: 'install talwind and pris ma then run db migrate',
    description: 'Repairs "talwind" -> Tailwind, "pris ma" -> Prisma, and "db migrate" -> db:migrate.',
    tags: ['fuzzy', 'script', 'dependency'],
  },
  {
    id: 'sample-3',
    title: 'Sample 3: Multi-Word + Env Var',
    text: 'set the supa base url in the dot env file',
    description: 'Recognizes "supa base url" -> SUPABASE_URL and "dot env" -> .env.',
    tags: ['multi-word', 'env', 'file'],
  },
  {
    id: 'sample-4',
    title: 'Sample 4: High Danger (Prod Destructive)',
    text: 'delete the user table and redeploy to production',
    description: 'Detects destructive action on database coupled with production redeploy. Blocks Copy until confirmed.',
    tags: ['danger-gate', 'destructive', 'production'],
  },
  {
    id: 'sample-5',
    title: 'Sample 5: Soundalike + Destructive Force',
    text: 'push the branch to main with force',
    description: 'ASR confusion risk ("force push" / "fork"), destructive force-push warning.',
    tags: ['soundalike', 'danger-gate', 'git'],
  },
  {
    id: 'sample-6',
    title: 'Sample 6: Infra & Kubernetes Alias',
    text: 'cube cuddle apply the engine x config',
    description: 'Fixes "cube cuddle" -> kubectl and "engine x" -> nginx.',
    tags: ['alias', 'infra', 'cli'],
  },
];

export function getDemoSymbolIndex(): SymbolIndex {
  const symbols: Symbol[] = [];

  // Key explicit symbols
  const primarySymbols: Omit<Symbol, 'id'>[] = [
    { text: '@supabase/supabase-js', kind: 'dependency', source: 'package.json', weight: 1.0 },
    { text: 'supabase', kind: 'dependency', source: 'package.json', weight: 1.0 },
    { text: 'zod', kind: 'dependency', source: 'package.json', weight: 1.0 },
    { text: 'tailwindcss', kind: 'dependency', source: 'package.json', weight: 1.0 },
    { text: 'Tailwind', kind: 'dependency', source: 'builtin', weight: 1.0 },
    { text: 'Prisma', kind: 'dependency', source: 'package.json', weight: 1.0 },
    { text: '@prisma/client', kind: 'dependency', source: 'package.json', weight: 1.0 },
    { text: 'Next.js', kind: 'dependency', source: 'package.json', weight: 1.0 },
    { text: 'TypeScript', kind: 'dependency', source: 'package.json', weight: 1.0 },
    { text: 'lucide-react', kind: 'dependency', source: 'package.json', weight: 1.0 },

    // Files
    { text: 'supabase-client.ts', kind: 'file', source: 'lib/supabase-client.ts', weight: 0.95 },
    { text: 'supabase-client', kind: 'file', source: 'lib/supabase-client.ts', weight: 0.9 },
    { text: 'UserTable.tsx', kind: 'file', source: 'components/UserTable.tsx', weight: 0.9 },
    { text: 'UserTable', kind: 'class', source: 'components/UserTable.tsx', weight: 0.9 },
    { text: 'user_table', kind: 'file', source: 'db/schema.sql', weight: 0.85 },
    { text: 'auth-provider.tsx', kind: 'file', source: 'components/auth-provider.tsx', weight: 0.8 },
    { text: 'Navbar.tsx', kind: 'file', source: 'components/Navbar.tsx', weight: 0.8 },
    { text: 'Sidebar.tsx', kind: 'file', source: 'components/Sidebar.tsx', weight: 0.8 },
    { text: 'DashboardLayout.tsx', kind: 'file', source: 'components/DashboardLayout.tsx', weight: 0.8 },
    { text: 'AnalyticsChart.tsx', kind: 'file', source: 'components/AnalyticsChart.tsx', weight: 0.8 },
    { text: 'SettingsForm.tsx', kind: 'file', source: 'components/SettingsForm.tsx', weight: 0.8 },

    // Hooks
    { text: 'useAuth.ts', kind: 'file', source: 'hooks/useAuth.ts', weight: 0.9 },
    { text: 'useAuth', kind: 'hook', source: 'hooks/useAuth.ts', weight: 0.95 },
    { text: 'useEffect', kind: 'hook', source: 'react', weight: 0.95 },
    { text: 'useMemo', kind: 'hook', source: 'react', weight: 0.95 },
    { text: 'useState', kind: 'hook', source: 'react', weight: 0.95 },
    { text: 'useCallback', kind: 'hook', source: 'react', weight: 0.95 },
    { text: 'useRef', kind: 'hook', source: 'react', weight: 0.95 },
    { text: 'useUser', kind: 'hook', source: 'hooks/useUser.ts', weight: 0.95 },
    { text: 'useSupabase', kind: 'hook', source: 'hooks/useSupabase.ts', weight: 0.95 },

    // Envs
    { text: 'SUPABASE_URL', kind: 'env', source: '.env.example', weight: 0.95 },
    { text: 'SUPABASE_ANON_KEY', kind: 'env', source: '.env.example', weight: 0.95 },
    { text: 'SUPABASE_SERVICE_ROLE_KEY', kind: 'env', source: '.env.example', weight: 0.95 },
    { text: 'NEXT_PUBLIC_API_BASE', kind: 'env', source: '.env.example', weight: 0.95 },
    { text: 'DATABASE_URL', kind: 'env', source: '.env.example', weight: 0.95 },
    { text: 'REDIS_URL', kind: 'env', source: '.env.example', weight: 0.95 },
    { text: 'AUTH_SECRET', kind: 'env', source: '.env.example', weight: 0.95 },
    { text: '.env', kind: 'file', source: '.env', weight: 0.95 },
    { text: '.env.example', kind: 'file', source: '.env.example', weight: 0.9 },

    // Scripts
    { text: 'db:migrate', kind: 'script', source: 'package.json:scripts', weight: 0.95 },
    { text: 'db:reset', kind: 'script', source: 'package.json:scripts', weight: 0.95 },
    { text: 'db:seed', kind: 'script', source: 'package.json:scripts', weight: 0.85 },
    { text: 'dev', kind: 'script', source: 'package.json:scripts', weight: 0.85 },
    { text: 'build', kind: 'script', source: 'package.json:scripts', weight: 0.85 },
    { text: 'start', kind: 'script', source: 'package.json:scripts', weight: 0.85 },
    { text: 'lint', kind: 'script', source: 'package.json:scripts', weight: 0.85 },
    { text: 'test', kind: 'script', source: 'package.json:scripts', weight: 0.85 },

    // CLI & Infra
    { text: 'kubectl', kind: 'script', source: 'infra', weight: 0.9 },
    { text: 'nginx', kind: 'dependency', source: 'infra', weight: 0.9 },
    { text: 'docker-compose', kind: 'file', source: 'docker-compose.yml', weight: 0.9 },
  ];

  let idCounter = 1;
  for (const p of primarySymbols) {
    symbols.push({
      id: `demo-${idCounter++}`,
      ...p,
    });
  }

  // Synthesize realistic additional repo symbols to bring index count to ~400 symbols
  const mockComponents = [
    'Button', 'Card', 'Badge', 'Modal', 'Dropdown', 'Dialog', 'Avatar', 'Tooltip',
    'Accordion', 'Tabs', 'Breadcrumb', 'Pagination', 'Skeleton', 'Toast', 'Input',
    'Checkbox', 'Select', 'Switch', 'Textarea', 'Slider', 'DatePicker', 'Sheet',
    'Popover', 'CommandMenu', 'DataTable', 'Progress', 'Separator', 'ScrollArea',
    'Header', 'Footer', 'NavigationMenu', 'MetricCard', 'StatusIndicator'
  ];

  for (const c of mockComponents) {
    symbols.push({
      id: `demo-${idCounter++}`,
      text: `${c}.tsx`,
      kind: 'file',
      source: `components/ui/${c}.tsx`,
      weight: 0.8,
    });
    symbols.push({
      id: `demo-${idCounter++}`,
      text: c,
      kind: 'export',
      source: `components/ui/${c}.tsx`,
      weight: 0.85,
    });
  }

  const mockUtils = [
    'cn', 'formatDate', 'formatCurrency', 'truncateText', 'slugify', 'generateId',
    'debounce', 'throttle', 'deepClone', 'sleep', 'safeJsonParse', 'fetcher',
    'validateEmail', 'sanitizeHtml', 'calculateMetrics', 'groupBy', 'sortBy',
    'pick', 'omit', 'clamp', 'memoize'
  ];

  for (const u of mockUtils) {
    symbols.push({
      id: `demo-${idCounter++}`,
      text: u,
      kind: 'function',
      source: 'lib/utils.ts',
      weight: 0.85,
    });
  }

  const mockPages = [
    'app/page.tsx', 'app/layout.tsx', 'app/login/page.tsx', 'app/signup/page.tsx',
    'app/dashboard/page.tsx', 'app/dashboard/settings/page.tsx', 'app/dashboard/users/page.tsx',
    'app/dashboard/billing/page.tsx', 'app/api/auth/route.ts', 'app/api/webhooks/route.ts',
    'app/api/users/route.ts', 'app/api/analytics/route.ts', 'app/api/export/route.ts'
  ];

  for (const pg of mockPages) {
    const base = pg.split('/').pop() || pg;
    symbols.push({
      id: `demo-${idCounter++}`,
      text: pg,
      kind: 'file',
      source: pg,
      weight: 0.75,
    });
    symbols.push({
      id: `demo-${idCounter++}`,
      text: base,
      kind: 'file',
      source: pg,
      weight: 0.8,
    });
  }

  const mockDirs = [
    'components', 'hooks', 'lib', 'app', 'public', 'styles', 'types', 'tests',
    'infra', 'scripts', 'prisma', 'config', 'utils', 'services', 'middleware'
  ];

  for (const d of mockDirs) {
    symbols.push({
      id: `demo-${idCounter++}`,
      text: d,
      kind: 'dir',
      source: d,
      weight: 0.6,
    });
  }

  // Common modern fullstack dependencies
  const mockDeps = [
    '@tanstack/react-query', '@tanstack/react-table', 'framer-motion', 'clsx',
    'tailwind-merge', 'class-variance-authority', 'cmdk', 'sonner', 'date-fns',
    'recharts', 'zustand', 'zod-form-data', '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip', '@radix-ui/react-tabs',
    'bcryptjs', 'jose', 'nodemailer', 'stripe', 'axios', 'sharp', 'papaparse'
  ];

  for (const dep of mockDeps) {
    symbols.push({
      id: `demo-${idCounter++}`,
      text: dep,
      kind: 'dependency',
      source: 'package.json',
      weight: 0.9,
    });
  }

  return {
    repo: 'acme-corp/acme-dashboard',
    symbols,
    stats: {
      files: 85,
      deps: 34,
      exports: 120,
      envs: 12,
    },
    truncated: false,
    builtAt: 1772300000000,
  };
}
