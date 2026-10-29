'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { matchMishears, prepareIndex } from '@/lib/matcher';
import { getDemoSymbolIndex } from '@/lib/demo';
import { Fix } from '@/lib/types';
import { generateMarkdownReport, getInitialStats, recordAnalysisInStats } from '@/lib/stats';

const SAMPLE_BATCH_TRANSCRIPT = `open super base client dot t s and replace the use effect hook with use memo
---
install talwind and pris ma then run db migrate
---
set the supa base url in the dot env file
---
cube cuddle apply the engine x config
---
delete the user table and redeploy to production
---
push the branch to main with force
---
query with try pc and validate with zod
---
restart system d service and check journal c t l
---
verify jason web token and authenticate with o auth
---
she will call back when she gets a chance`;

export default function BatchPage() {
  const [transcript, setTranscript] = useState(SAMPLE_BATCH_TRANSCRIPT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<
    | {
        id: number;
        raw: string;
        words: number;
        fixes: Fix[];
        highFlags: number;
        corrected: string;
      }[]
    | null
  >(null);
  const [reportMd, setReportMd] = useState<string | null>(null);

  const demoIndex = useMemo(() => getDemoSymbolIndex(), []);
  const preparedIndex = useMemo(() => prepareIndex(demoIndex), [demoIndex]);

  const handleProcessBatch = () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);

    const prompts = transcript
      .split(/\r?\n---\r?\n|\n\s*\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    let stats = getInitialStats();
    const batchItems: {
      id: number;
      raw: string;
      words: number;
      fixes: Fix[];
      highFlags: number;
      corrected: string;
    }[] = [];

    prompts.forEach((rawPrompt, idx) => {
      const res = matchMishears(rawPrompt, preparedIndex, { wrapBackticks: true });
      const applied = res.fixes.map((f) => ({
        ...f,
        status: (f.confidence >= 0.75 ? 'accepted' : 'rejected') as Fix['status'],
      }));

      stats = recordAnalysisInStats(stats, res, applied);
      const highFlags = res.flags.filter((f) => f.severity === 'high').length;

      batchItems.push({
        id: idx + 1,
        raw: rawPrompt,
        words: res.wordCount,
        fixes: res.fixes,
        highFlags,
        corrected: res.corrected,
      });
    });

    const report = generateMarkdownReport(stats, 'Mishear Voice Transcription Batch Report');
    setResults(batchItems);
    setReportMd(report);
    setIsProcessing(false);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-8 h-8 rounded bg-emerald-500 text-black flex items-center justify-center font-bold text-lg hover:scale-105 transition"
            >
              M
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link href="/" className="font-bold text-lg text-white hover:text-emerald-400">
                  Mishear
                </Link>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Batch Processor
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Multi-Prompt Transcript Log Analysis & Report Generation
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-xs">
            <Link href="/" className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200">
              Firewall UI
            </Link>
            <Link
              href="/batch"
              className="px-3 py-1.5 rounded bg-zinc-800 text-emerald-400 font-bold border border-zinc-700"
            >
              Batch Mode
            </Link>
            <Link href="/vocab" className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200">
              Vocabulary
            </Link>
            <Link href="/danger" className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200">
              Danger Gate
            </Link>
            <Link href="/eval" className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200">
              Eval Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 space-y-6">
        {/* Input Panel */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Dictated Transcript Stream</h2>
              <p className="text-xs text-zinc-400">
                Paste transcripts separated by lines with <code className="text-emerald-400">---</code> or upload a file.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".txt,.md,.json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  setTranscript(text);
                }}
                className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-zinc-800 file:text-zinc-200"
              />
              <button
                onClick={handleProcessBatch}
                disabled={isProcessing}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-black font-bold text-xs rounded transition shadow"
              >
                {isProcessing ? 'Processing...' : 'Process All Prompts ⚡'}
              </button>
            </div>
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={8}
            className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 leading-relaxed font-mono"
            placeholder="Prompt 1&#10;---&#10;Prompt 2"
          />
        </section>

        {/* Results Section */}
        {results && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white">
                Batch Analysis Results ({results.length} Prompts)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload('mishear-report.md', reportMd || '')}
                  className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-xs hover:bg-emerald-900"
                >
                  Download mishear-report.md
                </button>
                <button
                  onClick={() =>
                    handleDownload('mishear-log.json', JSON.stringify(results, null, 2))
                  }
                  className="px-3 py-1 bg-zinc-900 text-zinc-300 border border-zinc-700 rounded text-xs hover:bg-zinc-800"
                >
                  Download mishear-log.json
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-400">Prompt #{item.id}</span>
                      <span className="text-zinc-500">({item.words} words)</span>
                      {item.highFlags > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold">
                          {item.highFlags} High Danger Flag(s)
                        </span>
                      )}
                    </div>

                    <span className="text-emerald-400 font-semibold">
                      {item.fixes.length} repair(s)
                    </span>
                  </div>

                  <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800/80 space-y-1">
                    <div className="text-zinc-400">
                      <span className="text-[10px] uppercase text-zinc-500 font-bold block">
                        Raw Transcript:
                      </span>
                      {item.raw}
                    </div>
                    <div className="text-emerald-300 pt-1 border-t border-zinc-900">
                      <span className="text-[10px] uppercase text-zinc-500 font-bold block">
                        Corrected Agent Output:
                      </span>
                      {item.corrected}
                    </div>
                  </div>

                  {item.fixes.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.fixes.map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] text-zinc-300 border border-zinc-700"
                        >
                          <span className="line-through text-red-400">{f.original}</span> →{' '}
                          <span className="text-emerald-400 font-bold">{f.replacement}</span> (
                          {f.method})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

