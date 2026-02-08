/**
 * Single Template Analysis
 *
 * Analyzes one template (code-reviewer.md) with detailed diagnostics:
 * - Signal similarity matrix
 * - Threshold sensitivity analysis (0.7 - 0.9)
 * - Compression ratio calculation
 *
 * Usage:
 *   npx tsx scripts/test-single-template.ts
 *
 * Input:
 *   test-fixtures/souls/raw/code-reviewer.md
 *
 * Output:
 *   Console output only (no files written)
 *
 * Notes:
 *   - Useful for debugging similarity matching
 *   - Shows why signals don't cluster (pre-curated, non-redundant)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractFromTemplate } from '../src/lib/template-extractor.js';
import { createPrincipleStore } from '../src/lib/principle-store.js';
import { compressPrinciples, generateSoulMd } from '../src/lib/compressor.js';
import { countTokens, compressionRatio } from '../src/lib/metrics.js';
import { cosineSimilarity } from '../src/lib/matcher.js';

async function main() {
  const templatePath = resolve(
    process.cwd(),
    'test-fixtures',
    'souls',
    'raw',
    'code-reviewer.md'
  );

  console.log('\n🔬 Single Template Compression Test\n');

  // Read original
  const originalContent = readFileSync(templatePath, 'utf-8');
  const originalTokens = countTokens(originalContent);
  console.log(`Original: ${originalTokens} tokens`);

  // Extract signals
  const result = await extractFromTemplate(templatePath);
  console.log(`Signals: ${result.signals.length}`);

  // Show signal similarity matrix (first 5)
  console.log('\n📊 Signal Similarity Matrix (first 5):');
  const sample = result.signals.slice(0, 5);
  console.log('     ' + sample.map((_, i) => `S${i + 1}`.padStart(6)).join(''));
  for (let i = 0; i < sample.length; i++) {
    const row = sample.map((s2) =>
      cosineSimilarity(sample[i]!.embedding, s2.embedding).toFixed(2).padStart(6)
    );
    console.log(`S${i + 1}  ` + row.join(''));
  }

  // Test different thresholds
  console.log('\n📈 Threshold Sensitivity:');
  for (const threshold of [0.9, 0.85, 0.8, 0.75, 0.7]) {
    const store = createPrincipleStore(threshold);
    let reinforced = 0;

    for (const signal of result.signals) {
      const addResult = store.addSignal(signal);
      if (addResult.action === 'reinforced') reinforced++;
    }

    const principles = store.getPrinciples();
    const compression = compressPrinciples(principles, 2); // Lower N for single template

    console.log(
      `  θ=${threshold}: ${principles.length} principles, ` +
        `${reinforced} reinforced, ${compression.axioms.length} axioms (N≥2)`
    );
  }

  // Generate compressed output at 0.75 threshold with N≥2
  const store = createPrincipleStore(0.75);
  for (const signal of result.signals) {
    store.addSignal(signal);
  }

  const principles = store.getPrinciples();
  const compression = compressPrinciples(principles, 2);
  const compressedSoul = generateSoulMd(compression.axioms, 'cjk-math-emoji');
  const compressedTokens = countTokens(compressedSoul);

  console.log(`\n🎯 Compression Result (θ=0.75, N≥2):`);
  console.log(`   Original: ${originalTokens} tokens`);
  console.log(`   Compressed: ${compressedTokens} tokens`);
  console.log(`   Ratio: ${compressionRatio(originalTokens, compressedTokens).toFixed(2)}:1`);
  console.log(`   Axioms: ${compression.axioms.length}`);

  console.log('\n📝 Generated SOUL.md:\n');
  console.log(compressedSoul);
}

main().catch(console.error);
