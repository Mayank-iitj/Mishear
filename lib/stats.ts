import { SessionStats, AnalysisResult, Fix } from './types';

const STORAGE_KEY = 'mishear_stats_v1';

export function getInitialStats(): SessionStats {
  return {
    promptsAnalyzed: 0,
    wordsDictated: 0,
    mishearsFound: 0,
    acceptedFixes: 0,
    rejectedFixes: 0,
    dangerFlagsCount: {
      low: 0,
      med: 0,
      high: 0,
    },
    confidenceSum: 0,
    topOffenders: {},
    history: [],
  };
}

export function loadAllTimeStats(): SessionStats {
  if (typeof window === 'undefined') return getInitialStats();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load stats:', err);
  }
  return getInitialStats();
}

export function saveAllTimeStats(stats: SessionStats): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn('Failed to save stats:', err);
  }
}

export function recordAnalysisInStats(
  current: SessionStats,
  result: AnalysisResult,
  appliedFixes: Fix[]
): SessionStats {
  const updated: SessionStats = {
    ...current,
    promptsAnalyzed: current.promptsAnalyzed + 1,
    wordsDictated: current.wordsDictated + result.wordCount,
    mishearsFound: current.mishearsFound + result.fixes.length,
    acceptedFixes:
      current.acceptedFixes + appliedFixes.filter((f) => f.status === 'accepted').length,
    rejectedFixes:
      current.rejectedFixes + appliedFixes.filter((f) => f.status === 'rejected').length,
    dangerFlagsCount: {
      low:
        current.dangerFlagsCount.low +
        result.flags.filter((f) => f.severity === 'low').length,
      med:
        current.dangerFlagsCount.med +
        result.flags.filter((f) => f.severity === 'med').length,
      high:
        current.dangerFlagsCount.high +
        result.flags.filter((f) => f.severity === 'high').length,
    },
    confidenceSum:
      current.confidenceSum +
      result.fixes.reduce((acc, f) => acc + f.confidence, 0),
    topOffenders: { ...current.topOffenders },
    history: [
      ...current.history,
      {
        timestamp: Date.now(),
        wordCount: result.wordCount,
        fixCount: result.fixes.length,
        acceptedCount: appliedFixes.filter((f) => f.status === 'accepted').length,
        highRiskFlags: result.flags.filter((f) => f.severity === 'high').length,
      },
    ],
  };

  for (const f of appliedFixes) {
    if (f.status === 'accepted') {
      const key = `${f.original.toLowerCase()} -> ${f.replacement}`;
      updated.topOffenders[key] = (updated.topOffenders[key] || 0) + 1;
    }
  }

  saveAllTimeStats(updated);
  return updated;
}

export function generateMarkdownReport(stats: SessionStats, title = 'Mishear Transcription Firewall Report'): string {
  const totalFlags =
    stats.dangerFlagsCount.low +
    stats.dangerFlagsCount.med +
    stats.dangerFlagsCount.high;

  const acceptanceRate =
    stats.mishearsFound > 0
      ? Math.round((stats.acceptedFixes / stats.mishearsFound) * 100)
      : 100;

  const mishearRate =
    stats.wordsDictated > 0
      ? ((stats.mishearsFound / stats.wordsDictated) * 100).toFixed(1)
      : '0.0';

  const avgConfidence =
    stats.mishearsFound > 0
      ? (stats.confidenceSum / stats.mishearsFound).toFixed(2)
      : '0.00';

  const sortedOffenders = Object.entries(stats.topOffenders)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topOffendersText =
    sortedOffenders.length > 0
      ? sortedOffenders.map(([term, count]) => `- \`${term}\` (${count} times)`).join('\n')
      : '- None recorded yet';

  return `### ${title}

Across **${stats.promptsAnalyzed}** dictated prompts (**${stats.wordsDictated}** words), Mishear caught **${stats.mishearsFound}** mis-transcribed identifiers (**${stats.acceptedFixes}** accepted, ${acceptanceRate}% acceptance rate), flagged **${totalFlags}** danger conditions (**${stats.dangerFlagsCount.high}** high-risk blocked), with an average fix confidence of **${avgConfidence}**.

- **Mishear Rate**: ${mishearRate} fixes per 100 dictated words
- **Danger Flags**: ${stats.dangerFlagsCount.high} high, ${stats.dangerFlagsCount.med} medium, ${stats.dangerFlagsCount.low} low

#### Top Misheard Identifiers Repaired:
${topOffendersText}
`;
}

