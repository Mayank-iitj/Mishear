'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { evaluateDanger, SOUNDALIKE_PAIRS, SAFER_REWRITE_CLAUSE } from '@/lib/danger';
import { getDoubleMetaphone, levenshteinDistance } from '@/lib/phonetics';

const RISKY_SAMPLES = [
  'delete the user table and redeploy to production',
  'push the branch to main with force',
  'rm -rf /var/data/build and clean -fd',
  'print the secret api key in console',
  'drop table accounts and reset --hard',
  'please deploy the latest branch now',
];

export default function DangerGatePage() {
  const [testPrompt, setTestPrompt] = useState(
    'delete the user table and redeploy to production'
  );
  const [saferEnabled, setSaferEnabled] = useState(false);

  const fullPrompt = useMemo(() => {
    return saferEnabled ? `${testPrompt}${SAFER_REWRITE_CLAUSE}` : testPrompt;
  }, [testPrompt, saferEnabled]);

  const flags = useMemo(() => {
    return evaluateDanger(testPrompt, fullPrompt);
  }, [testPrompt, fullPrompt]);

  const highFlagsCount = useMemo(() => {
    return flags.filter((f) => f.severity === 'high').length;
  }, [flags]);

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
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                  Danger Gate
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Rule Engine & Soundalike Acoustic Risk Analysis
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-xs">
            <Link href="/" className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200">
              Firewall UI
            </Link>
            <Link href="/batch" className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200">
              Batch Mode
            </Link>
            <Link href="/vocab" className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200">
              Vocabulary
            </Link>
            <Link
              href="/danger"
              className="px-3 py-1.5 rounded bg-zinc-800 text-emerald-400 font-bold border border-zinc-700"
            >
              Danger Gate
            </Link>
            <Link href="/eval" className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200">
              Eval Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1 space-y-6">
        {/* Interactive Risk Simulator */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Live Semantic Risk Simulator</h2>
              <p className="text-xs text-zinc-400">
                Test prompts against destructive operations, soundalike confusions, and secret exposure rules.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-amber-400">
                <input
                  type="checkbox"
                  checked={saferEnabled}
                  onChange={(e) => setSaferEnabled(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0"
                />
                <span>Toggle Safer Rewrite Clause</span>
              </label>
            </div>
          </div>

          {/* Quick test buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500">Quick Test Risky Prompts:</span>
            {RISKY_SAMPLES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTestPrompt(sample)}
                className="text-[11px] px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
              >
                Sample {idx + 1}
              </button>
            ))}
          </div>

          <textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            rows={3}
            className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 text-xs text-zinc-200 focus:outline-none focus:border-red-500 font-mono"
            placeholder="Type a prompt to test danger evaluation..."
          />

          {/* Gate Status & Flags Output */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-300">Evaluation Outcome:</span>
                {highFlagsCount > 0 ? (
                  <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-bold text-xs animate-pulse">
                    ⛔ GATE BLOCKED: {highFlagsCount} HIGH-RISK THREAT(S)
                  </span>
                ) : flags.length > 0 ? (
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-xs">
                    ⚠ ADVISORY: {flags.length} MEDIUM/LOW FLAG(S)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs">
                    ✓ SAFE: NO DANGER CONDITIONS IDENTIFIED
                  </span>
                )}
              </div>
            </div>

            {flags.length > 0 && (
              <div className="space-y-2">
                {flags.map((f) => (
                  <div
                    key={f.id}
                    className={`p-3 rounded border text-xs flex items-start gap-3 ${
                      f.severity === 'high'
                        ? 'bg-red-950/40 border-red-800 text-red-200'
                        : 'bg-amber-950/40 border-amber-800 text-amber-200'
                    }`}
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        f.severity === 'high' ? 'bg-red-900 text-white' : 'bg-amber-900 text-white'
                      }`}
                    >
                      {f.category} ({f.severity})
                    </span>
                    <div className="space-y-0.5">
                      <div className="font-semibold">{f.reason}</div>
                      <div className="text-[11px] text-zinc-400">Trigger token: &ldquo;{f.term}&rdquo;</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Soundalike Confusion Pair Showcase */}
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">
              ASR Soundalike Risk Registry ({SOUNDALIKE_PAIRS.length} Pairs)
            </h3>
            <p className="text-xs text-zinc-400">
              Voice recognition engines regularly confuse these phonetic near-twins with catastrophic consequences.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SOUNDALIKE_PAIRS.map(([w1, w2], idx) => {
              const meta1 = getDoubleMetaphone(w1);
              const meta2 = getDoubleMetaphone(w2);
              const dist = levenshteinDistance(w1, w2);

              return (
                <div
                  key={idx}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                    <span className="font-bold text-emerald-400">{w1}</span>
                    <span className="text-zinc-600">vs</span>
                    <span className="font-bold text-red-400">{w2}</span>
                  </div>

                  <div className="space-y-1 text-[11px] text-zinc-400">
                    <div className="flex justify-between">
                      <span>Edit Distance:</span>
                      <span className="text-zinc-200 font-bold">{dist} char(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phonetic Keys:</span>
                      <span className="text-zinc-300">
                        [{meta1.primary || '-'}] / [{meta2.primary || '-'}]
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 text-[10px] text-zinc-500">
                    Risk:{' '}
                    {w2 === 'destroy' || w2 === 'purge' || w2 === 'erase' || w2 === 'force'
                      ? 'Destructive Inversion'
                      : 'Semantic Shift'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
