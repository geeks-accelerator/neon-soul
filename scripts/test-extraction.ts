/**
 * Test Template Extraction
 *
 * Quick test of signal extraction on first 3 downloaded templates.
 * Shows extracted signals with types and embedding dimensions.
 *
 * Usage:
 *   npx tsx scripts/test-extraction.ts
 *
 * Input:
 *   test-fixtures/souls/raw/*.md (first 3 templates)
 *
 * Output:
 *   Console output only (no files written)
 *
 * Notes:
 *   - Downloads embedding model on first run (~30MB)
 *   - Use test-pipeline.ts for full pipeline test
 */

import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { extractFromTemplate } from '../src/lib/template-extractor.js';

async function main() {
  const rawDir = resolve(process.cwd(), 'test-fixtures', 'souls', 'raw');
  const files = readdirSync(rawDir).filter(
    (f) => f.endsWith('.md') && f !== 'metadata.json'
  );

  console.log(`Testing extraction on ${files.length} templates...\n`);

  let totalSignals = 0;

  for (const file of files.slice(0, 3)) {
    // Test first 3 templates
    const path = resolve(rawDir, file);
    console.log(`\n=== ${file} ===`);

    try {
      const result = await extractFromTemplate(path);
      console.log(`  Title: ${result.metadata.title}`);
      console.log(`  Subtitle: ${result.metadata.subtitle.slice(0, 50)}...`);
      console.log(`  Sections: ${result.metadata.sectionCount}`);
      console.log(`  Signals: ${result.signals.length}`);

      for (const signal of result.signals.slice(0, 5)) {
        console.log(`    [${signal.type}] ${signal.text.slice(0, 60)}...`);
        console.log(`      Embedding: ${signal.embedding.length} dims`);
      }

      totalSignals += result.signals.length;
    } catch (error) {
      console.error(`  Error: ${error}`);
    }
  }

  console.log(`\n\nTotal signals extracted: ${totalSignals}`);
}

main().catch(console.error);
