/**
 * Full Pipeline Test
 *
 * Runs the complete compression pipeline on all 14 downloaded templates:
 * extraction → principle matching → axiom synthesis → metrics.
 *
 * Usage:
 *   npx tsx scripts/test-pipeline.ts
 *
 * Input:
 *   test-fixtures/souls/raw/*.md (all 14 templates)
 *
 * Output:
 *   test-fixtures/souls/signals/*.json      - Extracted signals per template
 *   test-fixtures/souls/principles/all-principles.json
 *   test-fixtures/souls/axioms/all-axioms.json
 *   test-fixtures/souls/compressed/synthesized-soul.md
 *   docs/research/compression-baseline.md   - Metrics report
 *
 * Notes:
 *   - Uses N≥3 threshold for axiom promotion (cross-template convergence)
 *   - Downloads embedding model on first run (~30MB)
 *   - Run generate-demo-output.ts after for demo formats
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { extractFromTemplate } from '../src/lib/template-extractor.js';
import { createPrincipleStore } from '../src/lib/principle-store.js';
import { compressPrinciples, generateSoulMd } from '../src/lib/compressor.js';
import { calculateMetrics, formatMetricsReport } from '../src/lib/metrics.js';
import { TrajectoryTracker, formatTrajectoryReport } from '../src/lib/trajectory.js';

async function main() {
  const rawDir = resolve(process.cwd(), 'test-fixtures', 'souls', 'raw');
  const outputDir = resolve(process.cwd(), 'test-fixtures', 'souls');

  // Ensure output directories exist
  for (const subdir of ['signals', 'principles', 'axioms', 'compressed']) {
    const dir = resolve(outputDir, subdir);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const files = readdirSync(rawDir).filter(
    (f) => f.endsWith('.md') && f !== 'metadata.json'
  );

  console.log(`\n🔮 NEON-SOUL Pipeline Test`);
  console.log(`   Processing ${files.length} templates...\n`);

  const store = createPrincipleStore(0.85);
  const tracker = new TrajectoryTracker();
  let totalSignals = 0;
  let reinforcedCount = 0;
  let allOriginalText = '';

  // Process each template
  for (const file of files) {
    const path = resolve(rawDir, file);
    const templateName = basename(file, '.md');
    console.log(`📄 ${templateName}`);

    try {
      // Read original content
      const originalContent = readFileSync(path, 'utf-8');
      allOriginalText += originalContent;

      // Extract signals
      const result = await extractFromTemplate(path);
      console.log(`   ├── Extracted ${result.signals.length} signals`);

      // Save signals
      writeFileSync(
        resolve(outputDir, 'signals', `${templateName}-signals.json`),
        JSON.stringify(result.signals.map(s => ({
          id: s.id,
          type: s.type,
          text: s.text,
          confidence: s.confidence,
          source: s.source,
        })), null, 2)
      );

      // Add signals to principle store
      let created = 0;
      let reinforced = 0;

      for (const signal of result.signals) {
        const addResult = store.addSignal(signal);
        if (addResult.action === 'created') {
          created++;
        } else {
          reinforced++;
          reinforcedCount++;
        }
      }

      console.log(`   ├── Principles: +${created} new, ${reinforced} reinforced`);
      totalSignals += result.signals.length;

      // Record trajectory point
      const centroids = new Map<string, number[]>();
      for (const p of store.getPrinciples()) {
        centroids.set(p.id, p.embedding);
      }
      tracker.recordPoint(store.getPrinciples().length, 0, centroids);

    } catch (error) {
      console.error(`   └── Error: ${error}`);
    }
  }

  // Get all principles
  const principles = store.getPrinciples();
  console.log(`\n📊 Principle Store Summary`);
  console.log(`   Total principles: ${principles.length}`);
  console.log(`   Principles with N≥3: ${store.getPrinciplesAboveN(3).length}`);
  console.log(`   Principles with N≥5: ${store.getPrinciplesAboveN(5).length}`);

  // Save principles
  writeFileSync(
    resolve(outputDir, 'principles', 'all-principles.json'),
    JSON.stringify(principles.map(p => ({
      id: p.id,
      text: p.text,
      dimension: p.dimension,
      n_count: p.n_count,
      strength: p.strength,
    })), null, 2)
  );

  // Compress to axioms
  const compression = compressPrinciples(principles, 3);
  console.log(`\n🎯 Axiom Synthesis`);
  console.log(`   Axioms created: ${compression.axioms.length}`);
  console.log(`   Unconverged: ${compression.unconverged.length}`);

  // Save axioms
  writeFileSync(
    resolve(outputDir, 'axioms', 'all-axioms.json'),
    JSON.stringify(compression.axioms.map(a => ({
      id: a.id,
      text: a.text,
      tier: a.tier,
      dimension: a.dimension,
      canonical: a.canonical,
    })), null, 2)
  );

  // Generate compressed SOUL.md
  const compressedSoul = generateSoulMd(compression.axioms, 'cjk-math-emoji');
  writeFileSync(
    resolve(outputDir, 'compressed', 'synthesized-soul.md'),
    compressedSoul
  );

  // Calculate metrics
  const metrics = calculateMetrics(
    allOriginalText,
    compressedSoul,
    [], // We don't have all signals in one array, but counts work
    principles,
    compression.axioms,
    reinforcedCount
  );

  // Override counts since calculateMetrics can't see all signals
  metrics.signalCount = totalSignals;

  console.log(`\n📈 Compression Metrics`);
  console.log(`   Original tokens: ${metrics.originalTokens}`);
  console.log(`   Compressed tokens: ${metrics.compressedTokens}`);
  console.log(`   Compression ratio: ${metrics.compressionRatio.toFixed(2)}:1`);
  console.log(`   Semantic density: ${metrics.semanticDensity.toFixed(2)} principles/100 tokens`);
  console.log(`   Convergence rate: ${(metrics.convergenceRate * 100).toFixed(1)}%`);

  // Trajectory metrics
  const trajectoryMetrics = tracker.getMetrics();
  console.log(`\n🌀 Trajectory Metrics`);
  console.log(`   Stabilization rate: ${trajectoryMetrics.stabilizationRate} iterations`);
  console.log(`   Attractor strength: ${trajectoryMetrics.attractorStrength.toFixed(3)}`);
  console.log(`   Is stable: ${trajectoryMetrics.isStable ? 'Yes' : 'No'}`);

  // Write full report
  const report = [
    '# NEON-SOUL Compression Baseline',
    '',
    `**Date**: ${new Date().toISOString()}`,
    `**Templates processed**: ${files.length}`,
    '',
    formatMetricsReport(metrics),
    '',
    formatTrajectoryReport(trajectoryMetrics),
    '',
    '## Dimension Coverage',
    '',
    '| Dimension | Signals | Principles | Axioms |',
    '|-----------|---------|------------|--------|',
    ...metrics.dimensionCoverage.map(d =>
      `| ${d.dimension} | ${d.signalCount} | ${d.principleCount} | ${d.axiomCount} |`
    ),
  ].join('\n');

  writeFileSync(
    resolve(process.cwd(), 'docs', 'research', 'compression-baseline.md'),
    report
  );

  console.log(`\n✅ Pipeline complete!`);
  console.log(`   Results saved to test-fixtures/souls/`);
  console.log(`   Baseline report: docs/research/compression-baseline.md`);
}

main().catch(console.error);
