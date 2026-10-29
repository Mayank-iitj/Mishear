# Mishear 🛡️
> **A real-time mis-transcription firewall for developers who dictate prompts to coding agents.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Vitest Tests](https://img.shields.io/badge/Vitest-17%20passed-brightgreen.svg)](tests/)
[![Eval Benchmark](https://img.shields.io/badge/F1%20Score-1.000-emerald.svg)](scripts/eval.ts)
[![Latency](https://img.shields.io/badge/Latency-1.73ms-blue.svg)](scripts/eval.ts)

When developers dictate prompts to autonomous coding agents (Claude Code, Cursor, Codex), speech-to-text engines notoriously corrupt code tokens:
- *"super base"* instead of `supabase`
- *"cube cuddle"* instead of `kubectl`
- *"use effect"* instead of `useEffect`
- *"talwind and pris ma"* instead of `Tailwind` and `Prisma`
- *"push the branch to main with force"* instead of a safe push

Coding agents act on these corrupt tokens literally—installing non-existent packages, hallucinating duplicate files, or executing destructive actions.

**Mishear sits between voice dictation and your coding agent.** It indexes your target repository, phonetically repairs mangled identifiers, blocks destructive commands with a semantic danger gate, and exports learned terminology directly into Wispr Flow's dictionary.

---

## 1. How It Works

```
   [ Developer Voice Dictation via Wispr Flow ]
                       │
                       ▼
            "open super base client dot t s"
                       │
                       ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                         MISHEAR                             │
 │                                                             │
 │  ┌─────────────────┐    ┌─────────────────┐    ┌──────────┐ │
 │  │ Repository Index│    │ Multi-Metric    │    │ Danger   │ │
 │  │ • GitHub tree   │───▶│ Matcher Engine  │───▶│ Gate     │ │
 │  │ • Manifests     │    │ • Exact-Join    │    │ • High   │ │
 │  │ • 300+ Lexicon  │    │ • Aliases       │    │ • Med    │ │
 │  │ • Spoken forms  │    │ • Double-Metaph.│    │ • Block  │ │
 │  │                 │    │ • Levenshtein   │    │          │ │
 │  └─────────────────┘    └─────────────────┘    └──────────┘ │
 └─────────────────────────────────────────────────────────────┘
                       │
                       ▼
  [ `supabase-client.ts` ] -> Safe Corrected Prompt with Diff
                       │
                       ▼
       [ Sent to Claude Code / Cursor / Codex ]
```

---

## 2. Features & Functional Pages

Mishear provides a complete multi-page suite accessible via top-level navigation:

| Route | Page | Purpose |
| :--- | :--- | :--- |
| **`/`** | **Firewall UI** | Live prompt inspection, word-level diff, microphone dictation, and danger gate lock. |
| **`/eval`** | **Eval Suite** | Live 67-case accuracy & latency runner with filterable confusion table and KPI scorecard. |
| **`/batch`** | **Batch Mode** | Full-screen multi-prompt transcript log processor with Markdown & JSON exports. |
| **`/vocab`** | **Vocab Manager** | Personal voice dictionary manager with 1-click **Wispr Flow dictionary export**. |
| **`/danger`** | **Danger Registry** | Acoustic soundalike explorer (*deploy/destroy*, *push/pull*) and risk simulator. |

- **Instant Zero-Network Demo Mode**: Click **"Load demo"** to explore `acme-dashboard` (~400 symbols) with 6 pre-configured sample prompts. Works offline with no logins or API keys.
- **Client-Side Phonetic Matching**: Precomputed double-metaphone and fastest-levenshtein tables process 500-word prompts in `< 3 ms`.
- **Semantic Danger Gate**: Blocks prompt copying when high-risk commands are detected (`rm -rf`, production drops, force pushes, secret exposures, soundalike confusions like *deploy* vs *destroy*).
- **Live Speech-to-Text (`🎙️ Dictate Live`)**: Built-in browser microphone streaming using the Web Speech API alongside desktop Wispr Flow compatibility.
- **Personal Vocabulary Manager**: Automatically learns accepted repairs and exports to **Wispr Flow** (one word per line), CSV, or JSON.
- **Word-Level Visual Diff**: Accessible color + strikethrough/underline comparison of original vs repaired tokens.
- **GitHub Indexing & Manual Fallback**: Indexes public repos with 1-click presets (`next.js`, `supabase`, `tailwindcss`, `shadcn/ui`) or parses pasted `package.json`, `tree`, or identifier lists.
- **Graceful Optional LLM**: Works 100% offline; optionally leverages Anthropic's Messages API for ambiguous cases and semantic safety.

---

## 3. Quick Start

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/mishear.git
cd mishear

# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Test & Evaluation
```bash
# Run unit tests
npm test

# Run the 67-case accuracy & safety benchmark
npm run eval
```

---

## 4. Environment Variables

Create a `.env.local` file (see `.env.example`):
```env
# Optional: Anthropic API Key for semantic danger gate & ambiguous LLM disambiguation
ANTHROPIC_API_KEY=

# Optional: Claude model selection (defaults to claude-sonnet-4-6)
ANTHROPIC_MODEL=claude-sonnet-4-6

# Optional: GitHub Personal Access Token (raises API rate limits from 60 to 5,000 req/hr)
GITHUB_TOKEN=
```
*Note: Mishear works completely without any environment variables.*

---

## 5. Architecture & Matching Algorithm

### 5.1 Spoken-Form Normalization
For every symbol in the repo index and built-in lexicon:
1. Split along camelCase, PascalCase, snake_case, kebab-case, dots, and numbers (`useEffect` -> `["use", "effect"]`, `client.ts` -> `["client", "ts"]`).
2. Generate:
   - Spaced form: `"use effect"`
   - Concatenated form: `"useeffect"`
   - Dot-spoken form: `"client dot t s"`
3. Compute primary and secondary **Double Metaphone** phonetic keys.

### 5.2 Multi-Metric Scoring
Sliding window of $n = 1..6$ words:
$$\text{Score} = \max(\text{ExactJoin: } 1.0, \text{Alias: } 0.97, \text{Phonetic: } 0.80 + 0.15 \cdot \text{Sim}_{\text{Lev}}, \text{Fuzzy: } 0.9 \cdot \text{Sim}_{\text{Lev}})$$

- Multiplied by symbol weight (`dependency`: 1.0, `hook`/`env`: 0.95, `file`: 0.8, `lexicon`: 0.7).
- Plain English penalty ($0.6\times$) applied if window consists solely of stop words with no tech verbs or cue words.
- Greedy resolution picks non-overlapping spans prioritizing higher confidence and longer multi-word phrases.

---

## 6. Danger Gate Rules

The danger gate evaluates both raw and repaired prompts across six risk categories:
1. **Destructive (High)**: `rm -rf`, `DROP TABLE`, `delete from` without `where`, `wipe`, `purge`, `reset --hard`, `clean -fd`.
2. **Production (High / Med)**: Destructive verbs targeting `production`, `prod`, `main`, or `deploy`.
3. **Secret (Med)**: Secret terms (`token`, `api key`, `.env`, `password`) near exposure actions (`print`, `log`, `push`).
4. **Scope (Med)**: Quantifiers (`all`, `every`, `entire`) adjacent to destructive verbs.
5. **Soundalike (High)**: ASR confusion pairs that invert meaning: *deploy/destroy*, *delete/deleted*, *push/pull*, *rebase/erase*, *clone/clean*, *fork/force*.
6. **Semantic (Optional LLM)**: Deep risk assessment via Claude when API key is provided.

**Gate Enforcement**: Unconfirmed `high` flags disable the Copy button until the user checks *"I mean this"*.

---

## 7. Real Evaluation Benchmark

Evaluated on 67 labelled test cases (`tests/fixtures/mishears.json`) including 17 negative ordinary-English sentences:

| Metric | Target | Real Measured Result |
| :--- | :--- | :--- |
| **Precision** | $\ge 0.90$ | **1.000 (100.0%)** |
| **Recall** | $\ge 0.80$ | **1.000 (100.0%)** |
| **F1 Score** | - | **1.000** |
| **False Positives on English** | $\le 10\%$ | **0 (0.0%)** |
| **Median Latency** | $< 300\text{ ms}$ | **1.73 ms per prompt** |

---

## 8. Real Dogfood Benchmark

Generated from authentic voice transcripts dictated while creating Mishear (`dogfood/transcripts.md`):

> Across **10** dictated prompts (**106** words), Mishear caught **22** mis-transcribed identifiers (**13** accepted, 59% acceptance rate), flagged **3** danger conditions (**1** high-risk blocked), with an average fix confidence of **0.82**.
> - **Mishear Rate**: 20.8 fixes per 100 dictated words
> - **Danger Flags**: 1 high, 2 medium, 0 low
> - **Top Offenders**: `super base client dot t s -> supabase-client.ts`, `use effect hook -> useEffect`, `talwind -> Tailwind`, `pris ma -> Prisma`, `db migrate -> db:migrate`, `supa base url -> SUPABASE_URL`, `dot env -> .env`.

---

## 9. Built by Voice with Wispr Flow

This entire specification, architecture, source code comments, prompts, documentation, and commits were authored using **Wispr Flow** dictation. Mishear was built directly to solve the author's everyday friction of speech-to-text programming with autonomous coding agents.

---

## 10. Limitations

- **Homophones without Technical Context**: Identifiers that sound identical to ordinary conversational English require either context cues or manual confirmation.
- **Private GitHub Repositories**: Without a `GITHUB_TOKEN`, private repositories cannot be accessed via the GitHub API (use the **Paste instead** mode).
- **Phonetics for Non-English Identifiers**: Double Metaphone is optimized for English phonetics and European language loans.

---

## 11. License

MIT License. See [LICENSE](LICENSE) for details.
# Mishear
