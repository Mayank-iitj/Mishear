'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  SymbolIndex,
  Fix,
  DangerFlag,
  VocabEntry,
  SessionStats,
} from '@/lib/types';
import { matchMishears, prepareIndex, PreparedIndex, renderCorrectedText } from '@/lib/matcher';
import { getDemoSymbolIndex, DEMO_SAMPLES, DemoSample } from '@/lib/demo';
import { parseManualInput } from '@/lib/manualIndex';
import { computeWordDiff } from '@/lib/diff';
import { SAFER_REWRITE_CLAUSE } from '@/lib/danger';
import {
  loadVocabulary,
  recordLearnedFix,
  deleteVocabEntry,
  exportToWispr,
  exportToCsv,
  exportToJson,
  importVocabulary,
} from '@/lib/vocab';
import {
  loadAllTimeStats,
  recordAnalysisInStats,
  generateMarkdownReport,
  getInitialStats,
} from '@/lib/stats';

export default function MishearPage() {
  // --- STATE ---
  const [index, setIndex] = useState<SymbolIndex>(() => getDemoSymbolIndex());
  const [repoUrl, setRepoUrl] = useState('https://github.com/acme-corp/acme-dashboard');
  const [manualInput, setManualInput] = useState('');
  const [activeRepoTab, setActiveRepoTab] = useState<'github' | 'manual'>('github');
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState(
    'open super base client dot t s and replace the use effect hook with use memo'
  );
  const [wrapBackticks, setWrapBackticks] = useState(true);
  const [saferRewrite, setSaferRewrite] = useState(false);

  const [vocabulary, setVocabulary] = useState<VocabEntry[]>(() =>
    typeof window !== 'undefined' ? loadVocabulary() : []
  );
  const [stats, setStats] = useState<SessionStats>(() =>
    typeof window !== 'undefined' ? loadAllTimeStats() : getInitialStats()
  );

  // Fix overrides and flag confirmations (pure declarative state)
  const [fixOverrides, setFixOverrides] = useState<
    Record<string, { status?: Fix['status']; replacement?: string; method?: Fix['method'] }>
  >({});
  const [confirmedFlags, setConfirmedFlags] = useState<Record<string, boolean>>({});
  const [isLlmUnavailable, setIsLlmUnavailable] = useState(false);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  // Drawers & Modals
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isSymbolsOpen, setIsSymbolsOpen] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [symbolKindFilter, setSymbolKindFilter] = useState('all');

  // Batch Mode
  const [batchText, setBatchText] = useState('');
  const [batchResults, setBatchResults] = useState<
    { id: number; raw: string; words: number; fixes: number; highFlags: number }[] | null
  >(null);
  const [batchReport, setBatchReport] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Precomputed index
  const preparedIndex: PreparedIndex = useMemo(() => {
    return prepareIndex(index, vocabulary);
  }, [index, vocabulary]);

  // Purely computed analysis from prompt & index
  const analysis = useMemo(() => {
    if (!prompt.trim()) return null;
    return matchMishears(prompt, preparedIndex, { wrapBackticks });
  }, [prompt, preparedIndex, wrapBackticks]);

  // Derived applied fixes reflecting user accepts/rejects/alternatives
  const appliedFixes: Fix[] = useMemo(() => {
    if (!analysis) return [];
    return analysis.fixes.map((f) => {
      const override = fixOverrides[f.id];
      return {
        ...f,
        status: override?.status ?? f.status,
        replacement: override?.replacement ?? f.replacement,
        method: override?.method ?? f.method,
      };
    });
  }, [analysis, fixOverrides]);

  const hasAmbiguousFixes = useMemo(() => {
    return Boolean(analysis?.fixes.some((f) => f.needsLLM));
  }, [analysis]);

  const llmBadgeMessage = useMemo(() => {
    if (hasAmbiguousFixes && isLlmUnavailable) {
      return 'LLM unavailable: ambiguous fixes left for manual review';
    }
    return null;
  }, [hasAmbiguousFixes, isLlmUnavailable]);

  // Section 6.5: LLM Disambiguation for needsLLM cases
  useEffect(() => {
    if (!analysis) return;

    const ambiguousFixes = analysis.fixes.filter((f) => f.needsLLM);
    if (ambiguousFixes.length === 0) return;

    const payload = {
      items: ambiguousFixes.map((f) => ({
        id: f.id,
        sentence: analysis.raw,
        span: f.original,
        candidates: [f.replacement, ...f.alternatives.map((a) => a.text)].slice(0, 5),
      })),
    };

    let isMounted = true;
    fetch('/api/disambiguate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (!data.available) {
          setIsLlmUnavailable(true);
        } else if (Array.isArray(data.results)) {
          setIsLlmUnavailable(false);
          setFixOverrides((prev) => {
            const next = { ...prev };
            for (const r of data.results) {
              if (r.choice) {
                next[r.id] = { status: 'accepted', replacement: r.choice, method: 'llm' };
              }
            }
            return next;
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLlmUnavailable(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [analysis]);

  // Derived danger flags reflecting confirmation state
  const flags: DangerFlag[] = useMemo(() => {
    if (!analysis) return [];
    return analysis.flags.map((fl) => ({
      ...fl,
      confirmed: confirmedFlags[fl.id] ?? fl.confirmed,
    }));
  }, [analysis, confirmedFlags]);

  // Compute live corrected prompt text
  const liveCorrectedText = useMemo(() => {
    if (!analysis) return prompt;
    let base = renderCorrectedText(analysis.raw, appliedFixes, wrapBackticks);
    if (saferRewrite) {
      base += SAFER_REWRITE_CLAUSE;
    }
    return base;
  }, [analysis, appliedFixes, wrapBackticks, saferRewrite, prompt]);

  // Compute word diff
  const wordDiff = useMemo(() => {
    return computeWordDiff(prompt, liveCorrectedText);
  }, [prompt, liveCorrectedText]);

  // High danger unconfirmed count
  const unconfirmedHighRiskCount = useMemo(() => {
    return flags.filter((f) => f.severity === 'high' && !f.confirmed).length;
  }, [flags]);

  // Handlers for Indexing
  const handleIndexGitHub = async () => {
    if (!repoUrl.trim()) return;
    setIsIndexing(true);
    setIndexError(null);

    try {
      const res = await fetch('/api/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to index GitHub repository');
      }

      setIndex(data);
      showToast(`Indexed ${data.symbols.length} symbols from ${data.repo}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error indexing repository';
      setIndexError(msg);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleManualParse = () => {
    if (!manualInput.trim()) return;
    try {
      const parsed = parseManualInput(manualInput);
      setIndex(parsed);
      setIndexError(null);
      showToast(`Parsed ${parsed.symbols.length} symbols manually!`);
    } catch {
      setIndexError('Failed to parse input. Please check syntax.');
    }
  };

  const handleLoadDemo = () => {
    const demo = getDemoSymbolIndex();
    setIndex(demo);
    setRepoUrl('https://github.com/acme-corp/acme-dashboard');
    showToast('Loaded demo repo: acme-dashboard (~400 symbols)');
  };

  const handleTrySample = (sample: DemoSample) => {
    setPrompt(sample.text);
    setFixOverrides({});
    setConfirmedFlags({});
    showToast(`Loaded: ${sample.title}`);
  };

  // Fix status handlers
  const handleAcceptFix = (fixId: string) => {
    const fix = appliedFixes.find((f) => f.id === fixId);
    if (fix) {
      const updated = recordLearnedFix(fix.original, fix.replacement, vocabulary);
      setVocabulary(updated);
    }
    setFixOverrides((prev) => ({
      ...prev,
      [fixId]: { ...prev[fixId], status: 'accepted' },
    }));
  };

  const handleRejectFix = (fixId: string) => {
    setFixOverrides((prev) => ({
      ...prev,
      [fixId]: { ...prev[fixId], status: 'rejected' },
    }));
  };

  const handleSelectAlternative = (fixId: string, altText: string) => {
    const fix = appliedFixes.find((f) => f.id === fixId);
    if (fix) {
      const updated = recordLearnedFix(fix.original, altText, vocabulary);
      setVocabulary(updated);
    }
    setFixOverrides((prev) => ({
      ...prev,
      [fixId]: { status: 'accepted', replacement: altText },
    }));
  };

  const handleAcceptAllHighConf = () => {
    const newOverrides = { ...fixOverrides };
    for (const f of appliedFixes) {
      if (f.confidence >= 0.75) {
        recordLearnedFix(f.original, f.replacement, vocabulary);
        newOverrides[f.id] = { ...newOverrides[f.id], status: 'accepted' };
      }
    }
    setFixOverrides(newOverrides);
    showToast('Accepted all fixes with confidence >= 75%');
  };

  const handleRejectAll = () => {
    const newOverrides = { ...fixOverrides };
    for (const f of appliedFixes) {
      newOverrides[f.id] = { ...newOverrides[f.id], status: 'rejected' };
    }
    setFixOverrides(newOverrides);
    showToast('Rejected all proposed fixes');
  };

  const handleToggleConfirmFlag = (flagId: string) => {
    setConfirmedFlags((prev) => ({
      ...prev,
      [flagId]: !prev[flagId],
    }));
  };

  // Copy Handlers
  const handleCopyCorrected = () => {
    if (unconfirmedHighRiskCount > 0) return;
    navigator.clipboard.writeText(liveCorrectedText);
    showToast('Copied corrected prompt to clipboard!');

    if (analysis) {
      const updatedStats = recordAnalysisInStats(stats, analysis, appliedFixes);
      setStats(updatedStats);
    }
  };

  const handleCopySummary = () => {
    if (unconfirmedHighRiskCount > 0) return;
    const acceptedList = appliedFixes
      .filter((f) => f.status === 'accepted')
      .map((f) => `- "${f.original}" -> \`${f.replacement}\` (${f.method})`);

    const summary = `${liveCorrectedText}\n\n[Repaired by Mishear]:\n${acceptedList.join('\n')}`;
    navigator.clipboard.writeText(summary);
    showToast('Copied prompt with repair summary!');

    if (analysis) {
      const updatedStats = recordAnalysisInStats(stats, analysis, appliedFixes);
      setStats(updatedStats);
    }
  };

  // Filtered Symbols for Symbol Drawer
  const filteredSymbols = useMemo(() => {
    return index.symbols.filter((sym) => {
      const matchesSearch =
        sym.text.toLowerCase().includes(symbolSearch.toLowerCase()) ||
        sym.source.toLowerCase().includes(symbolSearch.toLowerCase());
      const matchesKind = symbolKindFilter === 'all' || sym.kind === symbolKindFilter;
      return matchesSearch && matchesKind;
    });
  }, [index.symbols, symbolSearch, symbolKindFilter]);

  // Batch Mode Execution
  const handleRunBatch = () => {
    if (!batchText.trim()) return;

    // Prompts separated by '---' or double newlines
    const rawPrompts = batchText
      .split(/\r?\n---\r?\n|\n\s*\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    let totalWords = 0;
    let totalFixes = 0;
    let totalAccepted = 0;
    let totalHighFlags = 0;
    let currentStats = { ...stats };

    const promptSummaries: {
      id: number;
      raw: string;
      words: number;
      fixes: number;
      highFlags: number;
    }[] = [];

    rawPrompts.forEach((rawP, idx) => {
      const res = matchMishears(rawP, preparedIndex, { wrapBackticks: true });
      const fixesApplied = res.fixes.map((f) => ({
        ...f,
        status: (f.confidence >= 0.9 ? 'accepted' : 'rejected') as Fix['status'],
      }));

      const acceptedCount = fixesApplied.filter((f) => f.status === 'accepted').length;
      const highFlags = res.flags.filter((f) => f.severity === 'high').length;

      totalWords += res.wordCount;
      totalFixes += res.fixes.length;
      totalAccepted += acceptedCount;
      totalHighFlags += highFlags;

      currentStats = recordAnalysisInStats(currentStats, res, fixesApplied);

      promptSummaries.push({
        id: idx + 1,
        raw: rawP,
        words: res.wordCount,
        fixes: res.fixes.length,
        highFlags,
      });
    });

    setStats(currentStats);
    setBatchResults(promptSummaries);

    const reportMd = `# Mishear Batch Mode Report
Generated: ${new Date().toISOString()}

Across **${rawPrompts.length}** dictated prompts (**${totalWords}** words):
- **Mishears Repaired**: ${totalFixes} total (${totalAccepted} auto-accepted at >=90% confidence)
- **High-Risk Flags**: ${totalHighFlags} blocked
- **Mishear Rate**: ${totalWords > 0 ? ((totalFixes / totalWords) * 100).toFixed(1) : 0}%

## Detailed Log
${promptSummaries
  .map(
    (p) =>
      `### Prompt #${p.id} (${p.words} words, ${p.fixes} fixes, ${p.highFlags} high risk flags)\n> ${p.raw}`
  )
  .join('\n\n')}
`;

    setBatchReport(reportMd);
    showToast(`Batch completed: ${rawPrompts.length} prompts processed!`);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black px-4 py-2.5 rounded shadow-lg font-mono text-sm font-semibold flex items-center gap-2 animate-bounce"
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER */}
      <header className="border-b border-zinc-800 bg-zinc-900/70 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500 text-black flex items-center justify-center font-mono font-black text-lg shadow-emerald-500/30 shadow-md">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-xl font-bold tracking-tight text-white">
                  Mishear
                </h1>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ASR Firewall v0.1.0
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Fix what voice dictation breaks before your coding agent acts on it.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemo}
              className="px-3 py-1.5 text-xs font-mono rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow"
            >
              Load Demo
            </button>
            <button
              onClick={() => setIsBatchOpen(true)}
              className="px-3 py-1.5 text-xs font-mono rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700"
            >
              Batch Mode
            </button>
            <button
              onClick={() => setIsVocabOpen(true)}
              className="px-3 py-1.5 text-xs font-mono rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700 flex items-center gap-1.5"
            >
              <span>Vocabulary</span>
              <span className="bg-zinc-900 text-zinc-400 text-[10px] px-1.5 py-0.2 rounded-full">
                {vocabulary.length}
              </span>
            </button>
            <button
              onClick={() => setIsStatsOpen(true)}
              className="px-3 py-1.5 text-xs font-mono rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition border border-zinc-700"
            >
              Stats
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* STEP 1: REPOSITORY INDEX */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-bold border border-zinc-700">
                STEP 1
              </span>
              <span className="text-sm font-medium text-zinc-200">
                Target Repository Symbol Index
              </span>
            </div>

            <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800">
              <button
                onClick={() => setActiveRepoTab('github')}
                className={`text-xs font-mono px-3 py-1 rounded transition ${
                  activeRepoTab === 'github'
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                GitHub URL
              </button>
              <button
                onClick={() => setActiveRepoTab('manual')}
                className={`text-xs font-mono px-3 py-1 rounded transition ${
                  activeRepoTab === 'manual'
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Paste Instead
              </button>
            </div>
          </div>

          {activeRepoTab === 'github' ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="flex-1 min-w-[280px] bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 font-mono text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleIndexGitHub}
                disabled={isIndexing}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-mono text-xs font-medium rounded transition flex items-center gap-2"
              >
                {isIndexing ? 'Indexing...' : 'Index Repo'}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste package.json, tree / ls -R output, or symbol identifiers (one per line)..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2.5 font-mono text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleManualParse}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs rounded border border-zinc-700"
              >
                Parse Input
              </button>
            </div>
          )}

          {indexError && (
            <div className="p-3 bg-red-950/40 border border-red-800/80 rounded text-red-300 text-xs font-mono flex items-center justify-between">
              <span>{indexError}</span>
              <button
                onClick={() => setActiveRepoTab('manual')}
                className="underline hover:text-white"
              >
                Use Paste Instead
              </button>
            </div>
          )}

          {/* Index summary chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono">
            <span className="text-zinc-400">Current Index:</span>
            <span className="text-white font-semibold bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {index.repo}
            </span>
            <span className="bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/50">
              {index.symbols.length} symbols
            </span>
            <span className="bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded">
              {index.stats.deps} deps
            </span>
            <span className="bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded">
              {index.stats.files} files
            </span>
            <span className="bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded">
              {index.stats.exports} exports
            </span>
            <span className="bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded">
              {index.stats.envs} envs
            </span>
            {index.truncated && (
              <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                ⚠ Tree Truncated
              </span>
            )}
            <button
              onClick={() => setIsSymbolsOpen(true)}
              className="ml-auto text-emerald-400 hover:text-emerald-300 hover:underline text-xs"
            >
              Browse symbols →
            </button>
          </div>
        </section>

        {/* SAMPLE PROMPTS BAR */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Interactive Test Samples (1-Click Try)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {DEMO_SAMPLES.map((s) => (
              <div
                key={s.id}
                className="bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 rounded p-2 flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[11px] font-semibold text-emerald-400">
                      {s.title.split(':')[0]}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {s.tags[0]}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-mono line-clamp-2 mb-2 italic">
                    &ldquo;{s.text}&rdquo;
                  </p>
                </div>
                <button
                  onClick={() => handleTrySample(s)}
                  className="w-full text-center py-1 bg-zinc-900 hover:bg-emerald-950 text-zinc-300 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-800/50 rounded font-mono text-[11px] font-medium transition"
                >
                  Try Sample →
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* STEP 2: DICTATED PROMPT INPUT */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-bold border border-zinc-700">
                STEP 2
              </span>
              <label htmlFor="dictated-prompt" className="text-sm font-medium text-zinc-200">
                Dictated Prompt
              </label>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
              <span>{prompt.trim() ? prompt.trim().split(/\s+/).length : 0} words</span>
              <span className="hidden sm:inline">Ctrl+Enter = Analyze</span>
            </div>
          </div>

          <textarea
            id="dictated-prompt"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setFixOverrides({});
              setConfirmedFlags({});
            }}
            rows={4}
            placeholder="e.g. open super base client dot t s and replace the use effect hook with use memo"
            className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded p-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={wrapBackticks}
                  onChange={(e) => setWrapBackticks(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
                />
                <span>Wrap code tokens in backticks</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saferRewrite}
                  onChange={(e) => setSaferRewrite(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
                />
                <span className="text-amber-400">Safer rewrite clause</span>
              </label>
            </div>

            <button
              onClick={() => {
                setFixOverrides({});
                setConfirmedFlags({});
                showToast('Re-analyzed prompt!');
              }}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-mono text-xs font-bold rounded transition shadow-md shadow-emerald-950"
            >
              Analyze Prompt ⚡
            </button>
          </div>
        </section>

        {/* STEP 3: REVIEW & REPAIRS */}
        {analysis && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-bold border border-zinc-700">
                  STEP 3
                </span>
                <span className="text-sm font-medium text-zinc-200">
                  Firewall Inspection & Diff
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  ({analysis.ms} ms)
                </span>
              </div>

              {appliedFixes.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAcceptAllHighConf}
                    className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 rounded font-mono text-xs transition"
                  >
                    Accept all ≥ 75%
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono text-xs transition border border-zinc-700"
                  >
                    Reject all
                  </button>
                </div>
              )}
            </div>

            {/* DANGER GATE ALERTS */}
            {flags.length > 0 && (
              <div
                role="alert"
                aria-live="assertive"
                className="space-y-2 bg-zinc-900/60 border border-zinc-800 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-mono text-xs font-bold">
                      ⚠ DANGER GATE ACTIVE
                    </span>
                    <span className="text-xs text-zinc-400">
                      {flags.length} semantic safety flag(s) identified
                    </span>
                  </div>
                  {unconfirmedHighRiskCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-950 border border-red-700 text-red-300 font-mono text-xs rounded animate-pulse">
                      {unconfirmedHighRiskCount} HIGH RISK BLOCKING COPY
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  {flags.map((flag) => (
                    <div
                      key={flag.id}
                      className={`p-2.5 rounded font-mono text-xs flex flex-wrap items-center justify-between gap-3 border ${
                        flag.severity === 'high'
                          ? 'bg-red-950/40 border-red-800 text-red-200'
                          : flag.severity === 'med'
                          ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                          : 'bg-zinc-800/50 border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-start gap-2 max-w-2xl">
                        <span
                          className={`uppercase text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            flag.severity === 'high'
                              ? 'bg-red-900 text-red-100'
                              : 'bg-amber-900 text-amber-100'
                          }`}
                        >
                          {flag.category} ({flag.severity})
                        </span>
                        <span>{flag.reason}</span>
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer bg-zinc-950/60 px-2 py-1 rounded border border-zinc-700 hover:border-zinc-500">
                        <input
                          type="checkbox"
                          checked={flag.confirmed}
                          onChange={() => handleToggleConfirmFlag(flag.id)}
                          className="rounded text-emerald-500 bg-zinc-900 focus:ring-0"
                        />
                        <span className="text-[11px] text-zinc-200">I mean this</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LLM DISAMBIGUATION STATUS BADGE */}
            {llmBadgeMessage && (
              <div className="px-3 py-1.5 bg-zinc-900 border border-amber-800/80 rounded flex items-center justify-between text-xs font-mono text-amber-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>{llmBadgeMessage}</span>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase">Optional LLM</span>
              </div>
            )}

            {/* SIDE-BY-SIDE WORD DIFF VIEW & INLINE HIGHLIGHTED ORIGINAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1 relative">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-bold uppercase text-[10px]">
                    Original Spoken Input (Hover spans for fix cards)
                  </span>
                  <span className="text-[10px] text-zinc-500">Interactive</span>
                </div>
                <div className="text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                  {(() => {
                    if (appliedFixes.length === 0) return prompt;
                    const elements: React.ReactNode[] = [];
                    let lastIdx = 0;
                    const sortedFixes = [...appliedFixes].sort((a, b) => a.start - b.start);

                    sortedFixes.forEach((fix, idx) => {
                      if (fix.start > lastIdx) {
                        elements.push(
                          <span key={`text-${idx}`}>{prompt.slice(lastIdx, fix.start)}</span>
                        );
                      }

                      const isOpen = activeTooltipId === fix.id;

                      elements.push(
                        <span
                          key={fix.id}
                          className="relative inline-block"
                          onMouseEnter={() => setActiveTooltipId(fix.id)}
                          onMouseLeave={() => setActiveTooltipId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveTooltipId(isOpen ? null : fix.id)}
                            onFocus={() => setActiveTooltipId(fix.id)}
                            onBlur={() => setActiveTooltipId(null)}
                            className={`underline decoration-2 decoration-wavy cursor-pointer font-semibold transition px-0.5 rounded ${
                              fix.status === 'accepted'
                                ? 'decoration-emerald-500 text-emerald-400 bg-emerald-950/30'
                                : fix.status === 'rejected'
                                ? 'decoration-zinc-600 text-zinc-500 line-through'
                                : 'decoration-amber-500 text-amber-300 bg-amber-950/30'
                            }`}
                          >
                            {fix.original}
                          </button>

                          {/* Hover / Focus Fix Card */}
                          {isOpen && (
                            <div
                              role="tooltip"
                              className="absolute bottom-full left-0 mb-2 z-40 w-64 p-2.5 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl text-xs font-mono space-y-2 pointer-events-auto"
                            >
                              <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                                <span className="text-[10px] uppercase text-zinc-500 font-bold">
                                  {fix.method} · {fix.symbolKind}
                                </span>
                                <span className="text-emerald-400 font-bold text-[10px]">
                                  {Math.round(fix.confidence * 100)}% match
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="text-zinc-400 text-[11px]">
                                  Heard: <span className="text-red-400 line-through">{fix.original}</span>
                                </div>
                                <div className="text-zinc-200 text-[11px]">
                                  Suggested: <span className="text-emerald-300 font-bold">{fix.replacement}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptFix(fix.id);
                                  }}
                                  className="flex-1 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-[10px] rounded"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectFix(fix.id);
                                  }}
                                  className="flex-1 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] rounded"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </span>
                      );

                      lastIdx = fix.end;
                    });

                    if (lastIdx < prompt.length) {
                      elements.push(<span key="text-end">{prompt.slice(lastIdx)}</span>);
                    }

                    return elements;
                  })()}
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-500 font-bold uppercase text-[10px]">
                    Repaired Prompt (Live Diff)
                  </span>
                  <span className="text-[10px] text-zinc-500">Word-level changes</span>
                </div>
                <div className="text-zinc-100 leading-relaxed break-words whitespace-pre-wrap">
                  {wordDiff.map((token, idx) => {
                    if (token.type === 'delete') {
                      return (
                        <span
                          key={idx}
                          className="bg-red-950/80 text-red-300 line-through px-0.5 rounded mx-0.5"
                        >
                          {token.value}
                        </span>
                      );
                    }
                    if (token.type === 'insert') {
                      return (
                        <span
                          key={idx}
                          className="bg-emerald-950 text-emerald-300 underline font-semibold px-0.5 rounded mx-0.5"
                        >
                          {token.value}
                        </span>
                      );
                    }
                    return <span key={idx}>{token.value}</span>;
                  })}
                </div>
              </div>
            </div>

            {/* FIX LIST TABLE */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-zinc-300">
                  Detected Mis-transcriptions ({appliedFixes.length})
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Accepted repairs automatically update your vocabulary
                </span>
              </div>

              {appliedFixes.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 font-mono text-xs">
                  No misheard identifiers detected in prompt.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {appliedFixes.map((fix) => (
                    <div
                      key={fix.id}
                      className={`p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono transition ${
                        fix.status === 'accepted'
                          ? 'bg-emerald-950/20'
                          : fix.status === 'rejected'
                          ? 'bg-zinc-950/40 opacity-60'
                          : 'bg-zinc-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-red-400 line-through bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          {fix.original}
                        </span>
                        <span className="text-zinc-500">→</span>
                        <span className="text-emerald-300 font-bold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          {fix.replacement}
                        </span>

                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-400">
                          {fix.method}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-400">
                          {fix.symbolKind}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Confidence bar */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-zinc-800 h-1.5 rounded overflow-hidden">
                            <div
                              className={`h-full ${
                                fix.confidence >= 0.85
                                  ? 'bg-emerald-500'
                                  : fix.confidence >= 0.75
                                  ? 'bg-amber-500'
                                  : 'bg-zinc-500'
                              }`}
                              style={{ width: `${Math.round(fix.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {Math.round(fix.confidence * 100)}%
                          </span>
                        </div>

                        {/* Alternatives dropdown */}
                        {fix.alternatives.length > 0 && (
                          <select
                            onChange={(e) => handleSelectAlternative(fix.id, e.target.value)}
                            value={fix.replacement}
                            className="bg-zinc-950 border border-zinc-700 text-zinc-300 rounded px-1.5 py-0.5 text-xs font-mono"
                          >
                            <option value={fix.replacement}>{fix.replacement} (Top)</option>
                            {fix.alternatives.map((alt, idx) => (
                              <option key={idx} value={alt.text}>
                                {alt.text} ({Math.round(alt.confidence * 100)}%)
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAcceptFix(fix.id)}
                            className={`px-2.5 py-1 rounded font-mono text-[11px] transition ${
                              fix.status === 'accepted'
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                            }`}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectFix(fix.id)}
                            className={`px-2.5 py-1 rounded font-mono text-[11px] transition ${
                              fix.status === 'rejected'
                                ? 'bg-red-900 text-white font-bold'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                            }`}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. OUTPUT BAR */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Corrected Agent Prompt
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Ready for Claude Code / Cursor / Codex
                </span>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded p-3 font-mono text-sm text-emerald-300 whitespace-pre-wrap break-words">
                {liveCorrectedText}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs font-mono text-zinc-400">
                  {unconfirmedHighRiskCount > 0 ? (
                    <span className="text-red-400 font-semibold">
                      ⛔ Copy blocked: Confirm {unconfirmedHighRiskCount} high-risk flag(s) above
                    </span>
                  ) : (
                    <span className="text-emerald-400">✓ Safe to send to agent</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCorrected}
                    disabled={unconfirmedHighRiskCount > 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-black font-mono text-xs font-bold rounded transition shadow-md shadow-emerald-950"
                  >
                    {unconfirmedHighRiskCount > 0
                      ? `Confirm ${unconfirmedHighRiskCount} high-risk flags`
                      : 'Copy corrected prompt'}
                  </button>
                  <button
                    onClick={handleCopySummary}
                    disabled={unconfirmedHighRiskCount > 0}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-700 text-zinc-200 border border-zinc-700 rounded font-mono text-xs transition"
                  >
                    Copy with fix summary
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* 6. VOCABULARY DRAWER */}
      {isVocabOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full p-6 flex flex-col justify-between space-y-4 font-mono">
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 className="text-base font-bold text-white">Learned Vocabulary</h2>
                <button
                  onClick={() => setIsVocabOpen(false)}
                  className="text-zinc-400 hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-400">
                Personal voice dictionary auto-learned from accepted fixes. Entries take priority in
                the matcher as high-weight spoken aliases.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() =>
                    handleDownloadFile('wispr-dictionary.txt', exportToWispr(vocabulary))
                  }
                  className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-xs hover:bg-emerald-900"
                >
                  Export for Wispr Flow
                </button>
                <button
                  onClick={() =>
                    handleDownloadFile('mishear-vocab.csv', exportToCsv(vocabulary))
                  }
                  className="px-2.5 py-1 bg-zinc-900 text-zinc-300 border border-zinc-700 rounded text-xs hover:bg-zinc-800"
                >
                  CSV
                </button>
                <button
                  onClick={() =>
                    handleDownloadFile('mishear-vocab.json', exportToJson(vocabulary))
                  }
                  className="px-2.5 py-1 bg-zinc-900 text-zinc-300 border border-zinc-700 rounded text-xs hover:bg-zinc-800"
                >
                  JSON
                </button>
              </div>

              <div className="border border-zinc-800 rounded bg-zinc-900/40 divide-y divide-zinc-800/80 max-h-96 overflow-y-auto">
                {vocabulary.length === 0 ? (
                  <div className="p-4 text-center text-zinc-500 text-xs">
                    No custom vocabulary learned yet. Accept repairs to auto-learn terms!
                  </div>
                ) : (
                  vocabulary.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 flex items-center justify-between text-xs hover:bg-zinc-900/60"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">&ldquo;{entry.spoken}&rdquo;</span>
                          <span>→</span>
                          <span className="text-emerald-400 font-bold">{entry.written}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">Seen {entry.count}x</span>
                      </div>
                      <button
                        onClick={() => setVocabulary(deleteVocabEntry(entry.spoken, vocabulary))}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-0.5 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-3">
              <label className="text-xs text-zinc-400 block mb-1.5">
                Import CSV / JSON Vocabulary:
              </label>
              <input
                type="file"
                accept=".csv,.json,.txt"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  const res = importVocabulary(text, vocabulary);
                  setVocabulary(res.entries);
                  showToast(`Imported ${res.added} vocabulary terms!`);
                }}
                className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700"
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. STATS DRAWER */}
      {isStatsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full p-6 flex flex-col justify-between space-y-4 font-mono overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 className="text-base font-bold text-white">Firewall Analytics</h2>
                <button
                  onClick={() => setIsStatsOpen(false)}
                  className="text-zinc-400 hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-900/60 p-3 rounded border border-zinc-800">
                  <span className="text-zinc-400 block">Prompts Analyzed</span>
                  <span className="text-xl font-bold text-white">{stats.promptsAnalyzed}</span>
                </div>
                <div className="bg-zinc-900/60 p-3 rounded border border-zinc-800">
                  <span className="text-zinc-400 block">Words Dictated</span>
                  <span className="text-xl font-bold text-white">{stats.wordsDictated}</span>
                </div>
                <div className="bg-zinc-900/60 p-3 rounded border border-zinc-800">
                  <span className="text-zinc-400 block">Mishears Found</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {stats.mishearsFound}
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-3 rounded border border-zinc-800">
                  <span className="text-zinc-400 block">Mishear Rate</span>
                  <span className="text-xl font-bold text-white">
                    {stats.wordsDictated > 0
                      ? ((stats.mishearsFound / stats.wordsDictated) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </span>
                </div>
              </div>

              {/* Danger severity counts */}
              <div className="bg-zinc-900/40 p-3 rounded border border-zinc-800 space-y-1 text-xs">
                <span className="text-zinc-400 font-semibold block mb-1">
                  Danger Flags Prevented:
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-red-400 font-bold">
                    {stats.dangerFlagsCount.high} High
                  </span>
                  <span className="text-amber-400 font-bold">
                    {stats.dangerFlagsCount.med} Med
                  </span>
                  <span className="text-zinc-400">{stats.dangerFlagsCount.low} Low</span>
                </div>
              </div>

              {/* Top offenders bar chart */}
              <div className="bg-zinc-900/40 p-3 rounded border border-zinc-800 space-y-2">
                <span className="text-zinc-400 font-semibold text-xs block">
                  Top Misheard Terms Repaired:
                </span>
                <div className="space-y-1.5 text-xs">
                  {Object.keys(stats.topOffenders).length === 0 ? (
                    <span className="text-zinc-500 text-xs">No repairs recorded yet.</span>
                  ) : (
                    Object.entries(stats.topOffenders)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map(([term, count], idx) => {
                        const maxCount = Math.max(...Object.values(stats.topOffenders));
                        const pct = Math.round((count / maxCount) * 100);
                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between text-[11px] text-zinc-300">
                              <span className="truncate">{term}</span>
                              <span className="text-emerald-400">{count}</span>
                            </div>
                            <div className="w-full bg-zinc-800 h-1.5 rounded overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Generate Report Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    const report = generateMarkdownReport(stats);
                    navigator.clipboard.writeText(report);
                    showToast('Copied hackathon benchmark report to clipboard!');
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs rounded transition"
                >
                  Generate Result Report (Copy Markdown)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. BATCH MODE MODAL */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-2xl w-full p-6 space-y-4 font-mono max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Batch Transcript Analyzer</h2>
                <p className="text-xs text-zinc-400">
                  Analyze transcripts containing multiple dictated prompts separated by &ldquo;---&rdquo;.
                </p>
              </div>
              <button
                onClick={() => setIsBatchOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder="Paste voice transcript log here...&#10;Prompt 1&#10;---&#10;Prompt 2"
              rows={6}
              className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            />

            <div className="flex items-center justify-between">
              <input
                type="file"
                accept=".txt,.md,.json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  setBatchText(text);
                }}
                className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-zinc-800 file:text-zinc-200"
              />

              <button
                onClick={handleRunBatch}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs rounded"
              >
                Analyze All Prompts
              </button>
            </div>

            {batchResults && (
              <div className="space-y-3 pt-2">
                <div className="border border-zinc-800 rounded overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Words</th>
                        <th className="p-2">Fixes</th>
                        <th className="p-2">High Risk</th>
                        <th className="p-2">Prompt Preview</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80">
                      {batchResults.map((r) => (
                        <tr key={r.id} className="hover:bg-zinc-900/40">
                          <td className="p-2 font-bold">{r.id}</td>
                          <td className="p-2">{r.words}</td>
                          <td className="p-2 text-emerald-400">{r.fixes}</td>
                          <td className="p-2 text-red-400">{r.highFlags}</td>
                          <td className="p-2 text-zinc-400 truncate max-w-xs">{r.raw}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() =>
                      handleDownloadFile('mishear-report.md', batchReport || '')
                    }
                    className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-xs hover:bg-emerald-900"
                  >
                    Export mishear-report.md
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadFile('mishear-log.json', JSON.stringify(batchResults, null, 2))
                    }
                    className="px-3 py-1 bg-zinc-900 text-zinc-300 border border-zinc-700 rounded text-xs hover:bg-zinc-800"
                  >
                    Export mishear-log.json
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SYMBOL EXPLORER DRAWER */}
      {isSymbolsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 h-full p-6 flex flex-col justify-between space-y-4 font-mono">
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-white">Symbol Explorer</h2>
                  <span className="text-xs text-zinc-400">{index.symbols.length} total symbols</span>
                </div>
                <button
                  onClick={() => setIsSymbolsOpen(false)}
                  className="text-zinc-400 hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={symbolSearch}
                  onChange={(e) => setSymbolSearch(e.target.value)}
                  placeholder="Search symbols..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
                />
                <select
                  value={symbolKindFilter}
                  onChange={(e) => setSymbolKindFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300"
                >
                  <option value="all">All Kinds</option>
                  <option value="dependency">Dependencies</option>
                  <option value="file">Files</option>
                  <option value="hook">Hooks</option>
                  <option value="env">Envs</option>
                  <option value="script">Scripts</option>
                  <option value="export">Exports</option>
                </select>
              </div>

              <div className="border border-zinc-800 rounded bg-zinc-900/30 divide-y divide-zinc-800/80 max-h-[60vh] overflow-y-auto">
                {filteredSymbols.slice(0, 150).map((sym) => (
                  <div key={sym.id} className="p-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-zinc-200">{sym.text}</span>
                      <span className="text-[10px] text-zinc-500 block">{sym.source}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {sym.kind}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. FOOTER */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-4 text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <p>
            Matching and danger gates run client-side in your browser. Prompts are never stored.
          </p>
          <div className="flex items-center gap-4">
            <span>Built by voice with Wispr Flow</span>
            <span className="text-zinc-700">|</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
