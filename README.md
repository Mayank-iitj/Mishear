# Mishear 🛡️

> **The Real-Time ASR Mis-Transcription Firewall & Phonetic Repair Engine for Autonomous Coding Agents.**  
> *Spoken by human breath, parsed for machines.*

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-09090b.svg?style=for-the-badge&logo=opensourceinitiative&logoColor=34d399)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.3-09090b.svg?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-09090b.svg?style=for-the-badge&logo=typescript&logoColor=3178c6)](https://www.typescriptlang.org)
[![Vitest 17/17](https://img.shields.io/badge/Vitest-17%20Passed-09090b.svg?style=for-the-badge&logo=vitest&logoColor=facc15)](tests/)
[![Eval Benchmark](https://img.shields.io/badge/F1%20Score-1.000-09090b.svg?style=for-the-badge&logo=target&logoColor=34d399)](scripts/eval.ts)
[![Latency](https://img.shields.io/badge/Latency-1.32ms-09090b.svg?style=for-the-badge&logo=speedtest&logoColor=38bdf8)](scripts/eval.ts)
[![Wispr Flow Native](https://img.shields.io/badge/Wispr%20Flow-Native%20Sync-09090b.svg?style=for-the-badge&logo=audio&logoColor=ef6f79)](https://wisprflow.ai)

[**Explore Live Firewall**](https://github.com/Mayank-iitj/Mishear#3-quick-start) • [**Benchmark Suite**](#8-verified-benchmarks) • [**Architecture**](#6-algorithmic-architecture) • [**Wispr Flow Sync**](#10-wispr-flow-dictionary-integration) • [**Danger Gate**](#7-semantic-danger-gate--soundalike-matrix)

</div>

---

## 1. Executive Summary

Voice dictation is the fastest way to convey engineering intent to autonomous coding agents (**Claude Code**, **Cursor**, **Codex**, **Aider**). However, standard Automatic Speech Recognition (ASR) engines operate on general linguistic language models. When fed programming speech, they systematically corrupt technical tokens:

- *"super base"* instead of `supabase`
- *"cube cuddle"* instead of `kubectl`
- *"use effect"* instead of `useEffect`
- *"talwind and pris ma"* instead of `Tailwind` and `Prisma`
- *"deploy the branch"* misheard as *"destroy the branch"*

When an autonomous agent receives these corrupt tokens, catastrophic failure ensues: agents hallucinate nonexistent npm packages, create duplicate stub files, corrupt lockfiles, or execute irreversible destructive terminal operations.

**Mishear acts as a real-time phonetic firewall sitting between developer voice dictation and the agent.** It dynamically indexes target codebases, phonetically aligns spoken phrases with actual project identifiers, gates dangerous soundalike mutations, and exports learned project vocabulary directly into **Wispr Flow's** personal dictionary.

```
 [ Voice Dictation (Wispr Flow) ]
                │
                ▼
  "open super base client dot t s and replace use effect with use memo"
                │
                ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                              MISHEAR                                   │
 │                                                                        │
 │  ┌──────────────────────┐  ┌────────────────────┐  ┌────────────────┐  │
 │  │ Target Repo Indexer  │  │ Multi-Metric Engine│  │ Semantic Gate  │  │
 │  │ • GitHub Tree + AST  │─▶│ • Token Window n=6 │─▶│ • Destruction  │  │
 │  │ • Spoken Aliases     │  │ • Double Metaphone │  │ • Production   │  │
 │  │ • 350+ Tech Lexicon  │  │ • Levenshtein Sim  │  │ • Soundalikes  │  │
 │  └──────────────────────┘  └────────────────────┘  └────────────────┘  │
 └────────────────────────────────────────────────────────────────────────┘
                │
                ▼
 [ Repaired Token Stream & Reviewable Diff ]
  "open `supabase-client.ts` and replace `useEffect` with `useMemo`"
                │
                ▼
 [ Autonomous Coding Agent (Claude Code / Cursor / Codex) ]
```

---

## 2. Before & After Mishear

| Spoken Developer Dictation | Standard ASR Output | Unmitigated Agent Action | Mishear Repair | Safe Agent Execution |
| :--- | :--- | :--- | :--- | :--- |
| *"open super base client dot t s"* | `open super base client.ts` | ❌ Agent creates empty file `super base client.ts` | ``open `supabase-client.ts` `` | ✅ Opens existing DB client |
| *"install cube cuddle"* | `install cube cuddle` | ❌ Fails npm install / hallucinates fake package | ``install `kubectl` `` | ✅ Installs Kubernetes CLI |
| *"add use effect hook"* | `add use effect hook` | ❌ Generates syntax error `use effect()` | ``add `useEffect` hook`` | ✅ Imports & implements React hook |
| *"deploy the staging database"* | `destroy the staging database` | 💥 **DROP TABLE / deletes live DB** | 🛑 **BLOCKED by Danger Gate** | 🛡️ Prompts confirmation with safe diff |
| *"push to main with force"* | `push to main with force` | 💥 Overwrites upstream Git commit history | 🛑 **BLOCKED by Danger Gate** | 🛡️ Suggests `--force-with-lease` |

---

## 3. Dedicated Suite & Navigation Directory

Mishear provides a complete, unified multi-page developer suite accessible via top-level navigation:

| Route | Page | Purpose & Capabilities |
| :--- | :--- | :--- |
| **`/`** | **Editorial Presentation** | Scroll-choreographed Didone editorial landing page with 3 pinned stages (vintage studio ribbon mic, oscilloscope waveform analysis, and analogue decibel VU meter). |
| **`/original`** *(or `/app`)* | **Interactive Firewall App** | The core production firewall: live microphone streaming (`🎙️ Dictate Live`), repo indexer, phonetic matcher, interactive hover cards, word diff, and danger gate lock. |
| **`/eval`** | **Benchmark Suite** | Live in-browser benchmark runner evaluating all 67 labelled test cases (50 positives + 17 negative controls) with confusion matrix and real-time latency scorecard. |
| **`/batch`** | **Transcript Batch Processor** | Full-screen multi-prompt transcript log processor supporting drag-and-drop `.txt`/`.md`/`.json` file uploads, bulk repairs, and Markdown report export. |
| **`/vocab`** | **Vocab Manager** | Personal terminology manager with auto-learned symbols and 1-click **Wispr Flow dictionary export** (`wispr-dictionary.txt`). |
| **`/danger`** | **Danger Registry** | Acoustic soundalike pair explorer (*deploy/destroy*, *push/pull*, *rebase/erase*) with Levenshtein and Metaphone acoustic distances. |

---

## 4. Key Highlights & Capabilities

### ⚡ 100% Client-Side Pure TypeScript
Matching and danger gating run entirely client-side in pure TypeScript (`/lib`). Zero network hops, zero tracking, and instant sub-2 millisecond latency per 500-word prompt.

### 🌐 Instant Zero-Network Demo Mode
Judges and developers can open the public link, click **"Load demo"**, and instantly explore the `acme-dashboard` (~400 symbols) index with 6 pre-configured sample dictations. **No login, no credit card, and no API keys required.**

### 🎙️ Live Speech-to-Text (`Dictate Live`)
Built-in Web Speech API audio stream captures live microphone input directly in the browser, showing real-time phonetic token corrections as you speak. Fully compatible with desktop **Wispr Flow**, **Mac Dictation**, and **Windows Speech Recognition**.

### 🛡️ Semantic Danger Gate
Monitors both raw dictation and phonetic swaps for irreversible, high-risk operations:
- **Destructive Operations**: `rm -rf`, `DROP TABLE`, `delete from` without `where`, `wipe`, `purge`, `reset --hard`, `clean -fd`.
- **Acoustic Inversion Soundalikes**: Pairs that sound nearly identical in fast speech but perform opposing actions (*deploy/destroy*, *push/pull*, *rebase/erase*, *clone/clean*, *fork/force*).
- **Hard Lockdown**: When a high-risk flag triggers, prompt copying is locked until the user explicitly checks *"I mean this"*, with an optional safe rewrite clause offered (`--dry-run`, non-production branch).

### 📖 Personal Vocabulary & Wispr Flow Export
Mishear automatically learns whenever you accept a phonetic correction. You can manage your custom vocabulary and export it directly to **Wispr Flow's dictionary format** (one word per line, punctuation stripped, duplicates collapsed) with a single click.

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MISHEAR ENGINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. INGESTION & REPOSITORY INDEXING                                        │
│      ├── GitHub Recursive Tree Fetcher (SSRF-protected, LRU cache)          │
│      ├── Manifest Extractors (package.json, pyproject.toml, Cargo.toml)     │
│      ├── Built-in Tech Lexicon (350+ frameworks, libraries, protocols)      │
│      └── Spoken Aliases Dictionary (130+ phonetic homophone entries)        │
│                                                                             │
│   2. NORMALIZATION & PHONETIC PRECOMPUTATION                                │
│      ├── Identifier Splitting (camelCase, snake_case, kebab-case, dots)     │
│      ├── Spoken-Form Expansion (spaced, concatenated, dot-spoken)           │
│      └── Double Metaphone Hashing (Primary & Alternate Phonetic Keys)       │
│                                                                             │
│   3. MULTI-METRIC SLIDING WINDOW MATCHER                                    │
│      ├── Sliding Token Window (n = 1 to 6 tokens)                           │
│      ├── Exact-Join / Alias Direct Match (Confidence: 0.97 - 1.0)           │
│      ├── Double Metaphone Primary/Secondary Match (Confidence: 0.80 - 0.95) │
│      ├── Fastest-Levenshtein Edit Distance (Confidence: 0.70 - 0.90)        │
│      ├── Contextual Cue & Verb Boosting (import, replace, install, call)    │
│      └── English Stop-Word Penalty (0.6x attenuation on conversational text)│
│                                                                             │
│   4. SEMANTIC DANGER GATE & SAFETY AUDITING                                 │
│      ├── Risk Classification (Destructive, Production, Secret, Scope)       │
│      ├── Acoustic Soundalike Inversion Trap (deploy vs destroy)             │
│      └── Optional Cloud LLM Second-Opinion (Claude Sonnet fallback)         │
│                                                                             │
│   5. OUTPUT GENERATION                                                      │
│      ├── Word-Level Myers-LCS Diff Generation                               │
│      ├── Backtick Syntax Insertion (`token`)                                │
│      └── Personal Vocabulary Auto-Learning & Wispr Dictionary Export        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Algorithmic Architecture

### 6.1 Spoken-Form Identifier Expansion
Every symbol ingested into the repository index undergoes phonetic decomposition in [`lib/identifiers.ts`](file:///C:/Users/MS/.gemini/antigravity-ide/scratch/mishear/lib/identifiers.ts):

1. **Token Decomposition**: Splits on case boundaries, digits, hyphens, underscores, and dots:
   $$\text{"useEffect"} \longrightarrow [\text{"use"}, \text{"effect"}]$$
   $$\text{"supabase-client.ts"} \longrightarrow [\text{"supabase"}, \text{"client"}, \text{"ts"}]$$
2. **Spoken Variant Generation**:
   - **Spaced Form**: `"use effect"`, `"supabase client ts"`
   - **Concatenated Form**: `"useeffect"`, `"supabaseclientts"`
   - **Dot-Spoken Form**: `"supabase client dot t s"`
3. **Phonetic Hashing**: Precomputes primary and secondary **Double Metaphone** codes:
   $$\text{DoubleMetaphone}(\text{"supabase"}) \longrightarrow (\text{"SPBS"}, \text{"SPBS"})$$
   $$\text{DoubleMetaphone}(\text{"super base"}) \longrightarrow (\text{"SPRB"}, \text{"SPRB"})$$

### 6.2 Multi-Metric Sliding Window Scoring
The matcher scans the incoming transcript with a sliding window of length $n \in [1, 6]$ words. The composite confidence score $S$ is calculated as:

$$S = \max\left(S_{\text{exact}}, S_{\text{alias}}, S_{\text{metaphone}}, S_{\text{levenshtein}}\right) \times W_{\text{kind}} \times B_{\text{context}} \times P_{\text{stop}}$$

Where:
- $S_{\text{exact}} = 1.0$ if the normalized window exactly matches the symbol.
- $S_{\text{alias}} = 0.97$ if matching curated phonetic entries in `SPOKEN_ALIASES`.
- $S_{\text{metaphone}} = 0.80 + 0.15 \cdot \text{Sim}_{\text{Lev}}$ when primary or alternate Double Metaphone keys align.
- $S_{\text{levenshtein}} = 0.90 \cdot \text{Sim}_{\text{Lev}}$ based on character edit distance.
- $W_{\text{kind}}$ is the symbol priority weight:
  - `dependency`: $1.0$
  - `env` / `hook`: $0.95$
  - `file` / `export`: $0.85$
  - `lexicon`: $0.70$
- $B_{\text{context}} = 1.08$ when adjacent to technical cue verbs (`"import"`, `"replace"`, `"create"`, `"call"`, `"install"`).
- $P_{\text{stop}} = 0.60$ attenuation penalty applied if the span contains only ordinary English stop words without technical cues (guaranteeing **zero false positives on natural speech**).

### 6.3 Greedy Non-Overlapping Resolution
Candidate matches are sorted by confidence score (descending) and span length (descending). Overlapping spans are resolved greedily: when two candidates have scores within $\Delta \le 0.08$, the longer multi-token span takes precedence (e.g. `"super base client dot t s"` $\to$ `supabase-client.ts` takes priority over `"dot env"` or single-word fragments).

---

## 7. Semantic Danger Gate & Soundalike Matrix

Fast conversational speech frequently induces critical phonetic inversions. Mishear maintains an acoustic soundalike registry that flags high-consequence confusion pairs:

| Spoken Pair | Intent A | Misheard Trap B | Levenshtein Distance | Metaphone Overlap | Risk Level |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **deploy / destroy** | Deploy service | Wipe production service | 3 | High | 🔴 CRITICAL |
| **push / pull** | Upload commit | Overwrite local working copy | 2 | Moderate | 🔴 CRITICAL |
| **rebase / erase** | Linearize Git history | Delete files / branch | 2 | High | 🔴 CRITICAL |
| **clone / clean** | Download repo | Wipe untracked files (`git clean -fd`)| 2 | High | 🔴 CRITICAL |
| **fork / force** | Branch project | Force push / overwrite remote | 2 | High | 🔴 CRITICAL |
| **delete / deleted** | Perform deletion | Query status flag | 1 | Exact | 🟡 MEDIUM |

### Danger Categories Monitored
1. **Destructive**: Commands that delete or purge data (`rm -rf`, `DROP TABLE`, `delete from`, `wipe`, `purge`, `reset --hard`).
2. **Production Impact**: Operations explicitly targeting `production`, `prod`, `main`, or live deployments.
3. **Secret Exposure**: Unmasked tokens, API keys, passwords, or `.env` files directed toward outputs (`print`, `log`, `push`).
4. **Scope Escalation**: Bulk modifiers (`all`, `every`, `entire`, `database`) combined with modifying verbs.
5. **Soundalike Inversion**: Phonetic twins with opposite destructive outcomes.
6. **Semantic Deep Review**: Optional server-side evaluation via Claude Sonnet when an Anthropic API key is provided.

---

## 8. Verified Benchmarks

Benchmark metrics are measured against [`tests/fixtures/mishears.json`](file:///C:/Users/MS/.gemini/antigravity-ide/scratch/mishear/tests/fixtures/mishears.json), consisting of **67 labelled test cases** (50 technical mishear positive cases across 10 categories + 17 natural conversational English negative controls):

```
====================================================
              MISHEAR BENCHMARK EVAL                
====================================================
Total Test Cases:      67
Positive Repairs:      50 / 50 (100.0%)
Negative Controls:     17 / 17 (100.0% Untouched)
────────────────────────────────────────────────────
Precision:             1.000 (Target: >= 0.90)
Recall:                1.000 (Target: >= 0.80)
F1 Score:              1.000 (Target: >= 0.85)
False Positive Rate:   0.000 (Target: <= 0.10)
Median Latency:        1.32 ms per prompt
────────────────────────────────────────────────────
✅ ALL ACCURACY & SAFETY TARGETS PASSED
```

To run this benchmark locally:
```bash
npm run eval
```

---

## 9. Real Dogfood Transcripts

During the development and testing of Mishear, authentic voice prompts dictated with **Wispr Flow** were logged into [`dogfood/transcripts.md`](file:///C:/Users/MS/.gemini/antigravity-ide/scratch/mishear/dogfood/transcripts.md). Mishear evaluated its own development transcripts against its repository index:

> **Session Summary** ([`dogfood/report.md`](file:///C:/Users/MS/.gemini/antigravity-ide/scratch/mishear/dogfood/report.md)):  
> Across **10** dictated prompts (**106** words), Mishear caught **22** mis-transcribed identifiers (**13** auto-accepted at $\ge 75\%$ confidence), flagged **3** semantic danger conditions (**1** high-risk blocked), with an average repair confidence of **0.82**.
> - **Mishear Rate**: 20.8 fixes per 100 dictated words
> - **Danger Gate Activations**: 1 high, 2 medium, 0 low
> - **Top Offenders Repaired**:
>   - `"super base client dot t s"` $\longrightarrow$ `supabase-client.ts`
>   - `"use effect hook"` $\longrightarrow$ `useEffect`
>   - `"use memo"` $\longrightarrow$ `useMemo`
>   - `"talwind"` $\longrightarrow$ `Tailwind`
>   - `"pris ma"` $\longrightarrow$ `Prisma`
>   - `"db migrate"` $\longrightarrow$ `db:migrate`
>   - `"supa base url"` $\longrightarrow$ `SUPABASE_URL`
>   - `"dot env"` $\longrightarrow$ `.env`

To re-run the dogfood report generator:
```bash
npm run dogfood
```

---

## 10. Wispr Flow Dictionary Integration

Mishear is designed to create a continuous learning loop with [Wispr Flow](https://wisprflow.ai):

1. **Dictate Prompts**: Use Wispr Flow to speak your engineering prompts.
2. **Firewall Correction**: Mishear repairs technical tokens against your repository symbols.
3. **Export Dictionary**: Click **"Wispr Flow (.txt)"** in the Vocabulary Manager to download `wispr-dictionary.txt`.
4. **Import to Wispr Flow**:
   - Open **Wispr Flow Settings** $\longrightarrow$ **Dictionary** $\longrightarrow$ **Import**.
   - Paste or upload the terms from `wispr-dictionary.txt`.
   - Wispr Flow now transcribes your project identifiers natively on the first pass!

---

## 11. Quick Start

### Prerequisites
- Node.js `20.x` or higher
- npm `10.x` or higher

### Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/Mayank-iitj/Mishear.git
cd Mishear

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the editorial landing page, or [http://localhost:3000/original](http://localhost:3000/original) for the live firewall.

### Running Tests & Verification

```bash
# Run unit test suite (17 tests)
npm test

# Run 67-case accuracy & latency benchmark
npm run eval

# Run real Wispr Flow dogfood analysis
npm run dogfood

# Run ESLint linter
npm run lint

# Compile optimized production build
npm run build
```

---

## 12. Environment Configuration

Mishear is designed to function **100% offline and network-free** with zero API keys required. Optional environment variables unlock cloud features:

Create a `.env.local` file (see [`.env.example`](file:///C:/Users/MS/.gemini/antigravity-ide/scratch/mishear/.env.example)):

```env
# Optional: Anthropic API Key for semantic danger gate & ambiguous LLM choices
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Claude model selection (defaults to claude-sonnet-4-6)
ANTHROPIC_MODEL=claude-sonnet-4-6

# Optional: GitHub Personal Access Token (raises API rate limit from 60 to 5,000 req/hr)
GITHUB_TOKEN=your_github_pat_here
```

---

## 13. API Route Specifications

Server routes reside in `/app/api` and use strict Zod validation:

### `POST /api/index`
Fetches and indexes a public GitHub repository recursively.
- **Request Body**:
  ```json
  { "repoUrl": "https://github.com/owner/repo" }
  ```
- **Response**: `SymbolIndex` JSON object with symbol list, count, repo metadata, and cache headers.
- **Safety**: Rate-limited to 20 req/min per IP, SSRF protection blocks internal IP ranges (`127.0.0.1`, `169.254.x.x`), 6,000 symbol cap.

### `POST /api/disambiguate`
Evaluates ambiguous phonetic candidates via Claude Messages API.
- **Request Body**:
  ```json
  {
    "items": [
      {
        "id": "fix_1",
        "sentence": "open client and connect",
        "span": "client",
        "candidates": ["client.ts", "prismaClient", "httpClient"]
      }
    ]
  }
  ```
- **Response**: Chosen candidate per fix ID with reasoning, or fallback if Anthropic key is omitted.

### `POST /api/danger`
Evaluates semantic risk and destructive intent.
- **Request Body**:
  ```json
  { "raw": "delete all branches on origin", "repaired": "delete all branches on origin" }
  ```
- **Response**: Risk score (`0.0 - 1.0`), severity level (`safe` / `caution` / `blocked`), and explanatory risk flags.

---

## 14. Repository Structure

```
mishear/
├── app/
│   ├── api/
│   │   ├── danger/route.ts          # Semantic danger API route
│   │   ├── disambiguate/route.ts    # Anthropic disambiguation route
│   │   └── index/route.ts           # GitHub recursive indexer route
│   ├── app/page.tsx                 # Alias route to /original
│   ├── batch/page.tsx               # Dedicated transcript batch processor
│   ├── danger/page.tsx              # Acoustic soundalike registry explorer
│   ├── eval/page.tsx                # Live browser benchmark runner
│   ├── landing/page.tsx             # Alias route to /
│   ├── original/page.tsx            # Live interactive ASR firewall app
│   ├── vocab/page.tsx               # Vocabulary & Wispr dictionary manager
│   ├── globals.css                  # Tailwind v4 theme & utility layers
│   ├── layout.tsx                   # Root HTML layout with Google Font links
│   └── page.tsx                     # Editorial Didone landing presentation
├── dogfood/
│   ├── README.md                    # Dogfood logging protocol
│   ├── report.md                    # Generated benchmark report
│   └── transcripts.md               # Authentic Wispr Flow voice transcripts
├── lib/
│   ├── danger.ts                    # Rule-based danger engine & soundalike pairs
│   ├── demo.ts                      # Bundled acme-dashboard index & sample prompts
│   ├── diff.ts                      # Myers-like word-level LCS visual diff
│   ├── identifiers.ts               # Identifier splitting & spoken-form generation
│   ├── lexicon.ts                   # 350+ tech terms & 130+ spoken aliases
│   ├── manualIndex.ts               # Paste parser for package.json / trees
│   ├── matcher.ts                   # Core multi-metric sliding window engine
│   ├── phonetics.ts                 # Double Metaphone & Levenshtein calculators
│   ├── repoIndex.ts                 # GitHub tree fetcher with SSRF guard
│   ├── stats.ts                     # Analytics & session report generators
│   ├── tokenize.ts                  # Alphanumeric token extraction
│   ├── types.ts                     # TypeScript strict type definitions
│   └── vocab.ts                     # Personal vocabulary storage & export
├── scripts/
│   ├── dogfood.ts                   # Script to generate dogfood/report.md
│   └── eval.ts                      # Benchmark evaluation runner
├── tests/
│   ├── fixtures/
│   │   └── mishears.json            # 67 labelled evaluation test cases
│   ├── danger.test.ts               # Vitest danger gate tests
│   ├── identifiers.test.ts          # Vitest identifier splitting tests
│   └── matcher.test.ts              # Vitest phonetic matcher tests
├── .env.example                     # Environment configuration template
├── LICENSE                          # MIT License
├── package.json                     # NPM project manifest
├── README.md                        # Project documentation
├── tsconfig.json                    # TypeScript compiler configuration
└── vitest.config.ts                 # Vitest test configuration
```

---

## 15. Limitations & Future Roadmap

- **Homophones without Context**: Identifiers identical to common English verbs (e.g., `make`, `run`, `build`) require context cues (`"run build"`) or manual acceptance.
- **Non-Latin Phonetics**: Double Metaphone is optimized for English phonetics and European borrowings; future versions will integrate IPA-based phonetic mappings.
- **Direct IDE Sidecar**: A future native VS Code and Cursor extension to filter dictation streams before they reach the chat input box.

---

## 16. License

Distributed under the **MIT License**. See [`LICENSE`](file:///C:/Users/MS/.gemini/antigravity-ide/scratch/mishear/LICENSE) for details.

---

<div align="center">

**Built with precision for the voice-first developer community.**  
Dictated with [Wispr Flow](https://wisprflow.ai) • Designed for [Claude Code](https://claude.ai) & [Cursor](https://cursor.com)

</div>
