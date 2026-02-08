/**
 * Generate Demo Compressed Output
 *
 * Processes technical templates through the full compression pipeline
 * and generates example outputs in all 4 notation formats.
 *
 * Usage:
 *   npx tsx scripts/generate-demo-output.ts
 *
 * Input:
 *   test-fixtures/souls/raw/*.md (technical templates only)
 *
 * Output:
 *   test-fixtures/souls/compressed/
 *   ├── demo-native.md         # Plain English bullets
 *   ├── demo-cjk-labeled.md    # CJK anchor + text
 *   ├── demo-cjk-math.md       # CJK + math notation + text
 *   ├── demo-cjk-math-emoji.md # Emoji + CJK + math + text
 *   └── synthesized-soul.md    # Default output (cjk-math-emoji)
 *
 * Notes:
 *   - Uses N≥1 threshold to demonstrate format (not convergent axioms)
 *   - Uses θ=0.80 similarity threshold for slightly more clustering
 *   - Processes 4 technical templates for domain coherence
 *   - Run after test-pipeline.ts to regenerate demo outputs
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { extractFromTemplate } from '../src/lib/template-extractor.js';
import { createPrincipleStore } from '../src/lib/principle-store.js';
import { compressPrinciples, generateSoulMd } from '../src/lib/compressor.js';
import { countTokens, compressionRatio } from '../src/lib/metrics.js';

async function main() {
  const rawDir = resolve(process.cwd(), 'test-fixtures', 'souls', 'raw');
  const outputDir = resolve(process.cwd(), 'test-fixtures', 'souls');

  // Process just the technical templates for better coherence
  const technicalTemplates = [
    'code-reviewer.md',
    'architect.md',
    'security-auditor.md',
    'devops-engineer.md',
  ];

  console.log('\n🎯 Generating Demo Output (N≥1)\n');

  const store = createPrincipleStore(0.80); // Slightly lower threshold
  let allOriginalText = '';

  for (const file of technicalTemplates) {
    const path = resolve(rawDir, file);
    const templateName = basename(file, '.md');

    const originalContent = readFileSync(path, 'utf-8');
    allOriginalText += originalContent;

    const result = await extractFromTemplate(path);
    console.log(`📄 ${templateName}: ${result.signals.length} signals`);

    for (const signal of result.signals) {
      store.addSignal(signal);
    }
  }

  const principles = store.getPrinciples();
  console.log(`\n📊 Total principles: ${principles.length}`);

  // Generate with N≥1 to show format
  const compression = compressPrinciples(principles, 1);
  console.log(`🎯 Axioms (N≥1): ${compression.axioms.length}`);

  // Generate all 4 output formats
  const formats = ['native', 'cjk-labeled', 'cjk-math', 'cjk-math-emoji'] as const;

  for (const format of formats) {
    const soul = generateSoulMd(compression.axioms, format);
    const filename = `demo-${format}.md`;
    writeFileSync(resolve(outputDir, 'compressed', filename), soul);
    console.log(`   ✓ ${filename}`);
  }

  // Also save the best one as the main example
  const bestSoul = generateSoulMd(compression.axioms, 'cjk-math-emoji');
  writeFileSync(resolve(outputDir, 'compressed', 'synthesized-soul.md'), bestSoul);

  // Calculate compression
  const originalTokens = countTokens(allOriginalText);
  const compressedTokens = countTokens(bestSoul);
  const ratio = compressionRatio(originalTokens, compressedTokens);

  console.log(`\n📈 Compression: ${originalTokens} → ${compressedTokens} tokens (${ratio.toFixed(1)}:1)`);
  console.log(`\n✅ Demo outputs saved to test-fixtures/souls/compressed/`);
}

main().catch(console.error);
