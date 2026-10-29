export interface DiffToken {
  type: 'equal' | 'insert' | 'delete';
  value: string;
}

/**
 * Computes word-level diff between original and corrected string using Myers-like LCS algorithm.
 */
export function computeWordDiff(original: string, corrected: string): DiffToken[] {
  const origWords = original ? original.split(/(\s+)/) : [];
  const corrWords = corrected ? corrected.split(/(\s+)/) : [];

  const n = origWords.length;
  const m = corrWords.length;

  // LCS Matrix
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (origWords[i - 1] === corrWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  let i = n;
  let j = m;
  const result: DiffToken[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1] === corrWords[j - 1]) {
      result.unshift({ type: 'equal', value: origWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'insert', value: corrWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: 'delete', value: origWords[i - 1] });
      i--;
    }
  }

  // Merge adjacent diff tokens of same type
  const merged: DiffToken[] = [];
  for (const token of result) {
    if (merged.length > 0 && merged[merged.length - 1].type === token.type) {
      merged[merged.length - 1].value += token.value;
    } else {
      merged.push({ ...token });
    }
  }

  return merged;
}

