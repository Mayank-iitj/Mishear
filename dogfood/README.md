# Mishear Dogfood Logging Guide

This directory documents real, authentic voice transcripts dictated using **Wispr Flow** while building and testing Mishear.

## Instructions
1. As you build by voice, save every raw transcript directly into `dogfood/transcripts.md`.
2. Separate individual dictated prompts with a single line containing `---`.
3. To generate the real performance report against Mishear's repository index:
   - Use the **Batch mode** in the UI or run `npm run eval`.
   - The generated report is exported to `dogfood/report.md`.
4. Never alter or cherry-pick transcripts; the numbers embedded in README and documentation must reflect computed results from these transcripts.

