import fs from 'fs';
import path from 'path';
import { matchMishears, prepareIndex } from '../lib/matcher';
import { getDemoSymbolIndex } from '../lib/demo';
import { generateMarkdownReport, recordAnalysisInStats, getInitialStats } from '../lib/stats';
import { Fix } from '../lib/types';

function generateDogfoodReport() {
  const transcriptsPath = path.join(__dirname, '../dogfood/transcripts.md');
  const reportPath = path.join(__dirname, '../dogfood/report.md');

  if (!fs.existsSync(transcriptsPath)) {
    console.error('No transcripts.md found');
    return;
  }

  const content = fs.readFileSync(transcriptsPath, 'utf-8');
  const prompts = content
    .split(/\r?\n---\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const index = getDemoSymbolIndex();
  const prepared = prepareIndex(index);

  let stats = getInitialStats();

  for (const p of prompts) {
    const res = matchMishears(p, prepared);
    const fixesApplied = res.fixes.map((f) => ({
      ...f,
      status: (f.confidence >= 0.75 ? 'accepted' : 'rejected') as Fix['status'],
    }));
    stats = recordAnalysisInStats(stats, res, fixesApplied);
  }

  const markdown = generateMarkdownReport(stats, 'Mishear Dogfood Benchmark Report (Wispr Flow Transcripts)');
  fs.writeFileSync(reportPath, markdown, 'utf-8');
  console.log('Generated dogfood/report.md:');
  console.log(markdown);
}

generateDogfoodReport();

