'use client';

import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { VocabEntry } from '@/lib/types';
import {
  loadVocabulary,
  saveVocabulary,
  deleteVocabEntry,
  exportToWispr,
  exportToCsv,
  exportToJson,
  importVocabulary,
  recordLearnedFix,
} from '@/lib/vocab';

export default function VocabPage() {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [vocabulary, setVocabulary] = useState<VocabEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newSpoken, setNewSpoken] = useState('');
  const [newWritten, setNewWritten] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVocabulary(loadVocabulary());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredVocab = useMemo(() => {
    return vocabulary.filter(
      (v) =>
        v.spoken.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.written.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vocabulary, searchQuery]);

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpoken.trim() || !newWritten.trim()) return;

    const updated = recordLearnedFix(newSpoken, newWritten, vocabulary);
    setVocabulary(updated);
    setNewSpoken('');
    setNewWritten('');
    showToast(`Added term mapping: "${newSpoken}" → ${newWritten}`);
  };

  const handleDelete = (spoken: string) => {
    const updated = deleteVocabEntry(spoken, vocabulary);
    setVocabulary(updated);
    showToast(`Deleted mapping for "${spoken}"`);
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

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear your custom vocabulary?')) {
      saveVocabulary([]);
      setVocabulary([]);
      showToast('Cleared all custom vocabulary');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono flex flex-col">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black px-4 py-2 rounded shadow font-bold text-xs animate-bounce">
          ✓ {toastMsg}
        </div>
      )}

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
                  Vocabulary Manager
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Personal Spoken Terminology & Wispr Flow Dictionary Exporter
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-2 text-xs">
            <Link href="/" className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200">
              Landing
            </Link>
            <Link href="/original" className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200">
              Firewall App
            </Link>
            <Link href="/batch" className="px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200">
              Batch Mode
            </Link>
            <Link
              href="/vocab"
              className="px-3 py-1.5 rounded bg-zinc-800 text-emerald-400 font-bold border border-zinc-700"
            >
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
        {/* Action Controls & Exporters */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                Personal Voice Dictionary ({isClient ? vocabulary.length : 0} terms)
              </h2>
              <p className="text-xs text-zinc-400">
                Vocabulary terms auto-learn from accepted firewall repairs and take priority in matching.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  handleDownload('wispr-flow-dictionary.txt', exportToWispr(vocabulary))
                }
                className="px-3 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-xs hover:bg-emerald-900 font-bold"
              >
                Export for Wispr Flow
              </button>
              <button
                onClick={() => handleDownload('mishear-vocab.csv', exportToCsv(vocabulary))}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded text-xs hover:bg-zinc-700"
              >
                CSV
              </button>
              <button
                onClick={() => handleDownload('mishear-vocab.json', exportToJson(vocabulary))}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded text-xs hover:bg-zinc-700"
              >
                JSON
              </button>
              {vocabulary.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 bg-red-950 text-red-300 border border-red-800 rounded text-xs hover:bg-red-900"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Add custom term form */}
          <form
            onSubmit={handleAddManual}
            className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-800"
          >
            <input
              type="text"
              value={newSpoken}
              onChange={(e) => setNewSpoken(e.target.value)}
              placeholder='Spoken sound (e.g. "super base")'
              className="flex-1 min-w-[180px] bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-zinc-500">→</span>
            <input
              type="text"
              value={newWritten}
              onChange={(e) => setNewWritten(e.target.value)}
              placeholder="Written identifier (e.g. Supabase)"
              className="flex-1 min-w-[180px] bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs rounded"
            >
              Add Term +
            </button>
          </form>
        </section>

        {/* Search & List */}
        <section className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter vocabulary by spoken or written token..."
              className="flex-1 min-w-[240px] bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            />

            <div>
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
                className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-zinc-800 file:text-zinc-200"
              />
            </div>
          </div>

          <div className="border border-zinc-800 rounded overflow-hidden">
            <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs font-semibold text-zinc-400 flex justify-between">
              <span>Learned Term Pairs</span>
              <span>Occurrences / Actions</span>
            </div>

            <div className="divide-y divide-zinc-800/80 max-h-[500px] overflow-y-auto">
              {filteredVocab.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  {vocabulary.length === 0
                    ? 'No personal vocabulary recorded yet. Dictate prompts and accept repairs on the main firewall to auto-learn terms!'
                    : 'No vocabulary matches your search query.'}
                </div>
              ) : (
                filteredVocab.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3 text-xs flex items-center justify-between hover:bg-zinc-900/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 line-through bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        {entry.spoken}
                      </span>
                      <span className="text-zinc-600">→</span>
                      <span className="text-emerald-400 font-bold bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                        {entry.written}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-zinc-500">Seen {entry.count}x</span>
                      <button
                        onClick={() => handleDelete(entry.spoken)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-0.5 rounded hover:bg-red-950/40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

