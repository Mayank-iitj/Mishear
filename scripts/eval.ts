import fixtures from '../tests/fixtures/mishears.json';
import { matchMishears, prepareIndex } from '../lib/matcher';
import { getDemoSymbolIndex } from '../lib/demo';

interface FixtureCase {
  spoken: string;
  expected: string | null;
  kind: string;
}

function runEvaluation() {
  console.log('====================================================');
  console.log('              MISHEAR BENCHMARK EVAL                ');
  console.log('====================================================\n');

  const index = getDemoSymbolIndex();
  const prepared = prepareIndex(index);

  const typedFixtures = fixtures as FixtureCase[];
  const positives = typedFixtures.filter((f) => f.expected !== null);
  const negatives = typedFixtures.filter((f) => f.expected === null);

  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let trueNegatives = 0;

  const latencies: number[] = [];

  for (const pos of positives) {
    const start = performance.now();
    const result = matchMishears(pos.spoken, prepared);
    const ms = performance.now() - start;
    latencies.push(ms);

    const foundExpected = result.fixes.some(
      (f) =>
        f.replacement.toLowerCase() === pos.expected!.toLowerCase() ||
        pos.expected!.toLowerCase().includes(f.replacement.toLowerCase()) ||
        f.replacement.toLowerCase().includes(pos.expected!.toLowerCase())
    );

    if (foundExpected) {
      truePositives++;
    } else {
      falseNegatives++;
      console.log(`[FN] Expected '${pos.expected}' in: "${pos.spoken}" -> Found: [${result.fixes.map(f => f.replacement).join(', ')}]`);
    }
  }

  for (const neg of negatives) {
    const start = performance.now();
    const result = matchMishears(neg.spoken, prepared);
    const ms = performance.now() - start;
    latencies.push(ms);

    if (result.fixes.length === 0) {
      trueNegatives++;
    } else {
      falsePositives++;
      console.log(`[FP] Unwanted fix in negative sentence: "${neg.spoken}" -> Found: [${result.fixes.map(f => f.replacement).join(', ')}]`);
    }
  }

  latencies.sort((a, b) => a - b);
  const medianMs = latencies.length > 0 ? latencies[Math.floor(latencies.length / 2)].toFixed(2) : '0';

  const precision = truePositives + falsePositives > 0
    ? truePositives / (truePositives + falsePositives)
    : 0;

  const recall = truePositives + falseNegatives > 0
    ? truePositives / (truePositives + falseNegatives)
    : 0;

  const f1 = precision + recall > 0
    ? (2 * (precision * recall)) / (precision + recall)
    : 0;

  console.log('\n--- RESULTS ---');
  console.log(`Total Cases:           ${typedFixtures.length}`);
  console.log(`Positives Found:       ${truePositives}/${positives.length} (${(recall * 100).toFixed(1)}%)`);
  console.log(`Negatives Untouched:   ${trueNegatives}/${negatives.length} (${((trueNegatives / negatives.length) * 100).toFixed(1)}%)`);
  console.log(`Precision:             ${precision.toFixed(3)} (Target: >= 0.90)`);
  console.log(`Recall:                ${recall.toFixed(3)} (Target: >= 0.80)`);
  console.log(`F1 Score:              ${f1.toFixed(3)}`);
  console.log(`Median Latency:        ${medianMs} ms per prompt`);
  console.log('----------------\n');

  if (precision >= 0.9 && recall >= 0.8) {
    console.log('✅ ALL ACCURACY & SAFETY TARGETS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ Targets not met. Tuning needed.');
    process.exit(1);
  }
}

runEvaluation();

