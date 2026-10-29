import { VocabEntry } from './types';

const STORAGE_KEY = 'mishear_vocabulary_v1';

export function loadVocabulary(): VocabEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load vocabulary from localStorage:', err);
  }
  return [];
}

export function saveVocabulary(entries: VocabEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save vocabulary to localStorage:', err);
  }
}

export function recordLearnedFix(
  spoken: string,
  written: string,
  existingEntries: VocabEntry[]
): VocabEntry[] {
  const normSpoken = spoken.trim().toLowerCase();
  const cleanWritten = written.trim().replace(/^`|`$/g, '');

  if (!normSpoken || !cleanWritten) return existingEntries;

  const copy = [...existingEntries];
  const idx = copy.findIndex((e) => e.spoken.toLowerCase() === normSpoken);

  if (idx >= 0) {
    copy[idx] = {
      ...copy[idx],
      written: cleanWritten,
      count: copy[idx].count + 1,
      lastSeen: Date.now(),
    };
  } else {
    copy.push({
      spoken: normSpoken,
      written: cleanWritten,
      count: 1,
      lastSeen: Date.now(),
    });
  }

  saveVocabulary(copy);
  return copy;
}

export function deleteVocabEntry(spoken: string, entries: VocabEntry[]): VocabEntry[] {
  const norm = spoken.trim().toLowerCase();
  const filtered = entries.filter((e) => e.spoken.toLowerCase() !== norm);
  saveVocabulary(filtered);
  return filtered;
}

export function exportToWispr(entries: VocabEntry[]): string {
  // One term per line (canonical written form)
  const unique = Array.from(new Set(entries.map((e) => e.written))).sort();
  return unique.join('\n');
}

export function exportToCsv(entries: VocabEntry[]): string {
  const lines = ['spoken,written,count,lastSeen'];
  for (const e of entries) {
    const s = `"${e.spoken.replace(/"/g, '""')}"`;
    const w = `"${e.written.replace(/"/g, '""')}"`;
    lines.push(`${s},${w},${e.count},${e.lastSeen}`);
  }
  return lines.join('\n');
}

export function exportToJson(entries: VocabEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function importVocabulary(
  content: string,
  existing: VocabEntry[]
): { entries: VocabEntry[]; added: number } {
  let imported: Partial<VocabEntry>[] = [];

  const trimmed = content.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        imported = parsed;
      }
    } catch {
      // not json, try csv
    }
  }

  if (imported.length === 0) {
    // Attempt CSV parse
    const lines = trimmed.split(/\r?\n/);
    for (const line of lines) {
      if (!line.trim() || line.toLowerCase().startsWith('spoken,')) continue;
      const parts = line.split(',');
      if (parts.length >= 2) {
        imported.push({
          spoken: parts[0].replace(/^["']|["']$/g, '').trim(),
          written: parts[1].replace(/^["']|["']$/g, '').trim(),
          count: parseInt(parts[2] || '1', 10) || 1,
          lastSeen: parseInt(parts[3] || `${Date.now()}`, 10) || Date.now(),
        });
      } else if (parts.length === 1 && parts[0].trim()) {
        const term = parts[0].replace(/^["']|["']$/g, '').trim();
        imported.push({
          spoken: term.toLowerCase(),
          written: term,
          count: 1,
          lastSeen: Date.now(),
        });
      }
    }
  }

  const map = new Map<string, VocabEntry>();
  for (const e of existing) {
    map.set(e.spoken.toLowerCase(), { ...e });
  }

  let addedCount = 0;
  for (const item of imported) {
    if (!item.spoken || !item.written) continue;
    const key = item.spoken.toLowerCase();
    if (map.has(key)) {
      const cur = map.get(key)!;
      map.set(key, {
        spoken: cur.spoken,
        written: item.written,
        count: cur.count + (item.count || 1),
        lastSeen: Math.max(cur.lastSeen, item.lastSeen || Date.now()),
      });
    } else {
      map.set(key, {
        spoken: item.spoken,
        written: item.written,
        count: item.count || 1,
        lastSeen: item.lastSeen || Date.now(),
      });
      addedCount++;
    }
  }

  const result = Array.from(map.values());
  saveVocabulary(result);
  return { entries: result, added: addedCount };
}

