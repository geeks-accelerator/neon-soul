/**
 * Threshold Ablation Study
 *
 * Tests 4 combinations to isolate threshold vs generalization effects:
 * 1. Raw signals at 0.85 threshold (baseline)
 * 2. Raw signals at 0.45 threshold
 * 3. Generalized signals at 0.85 threshold (current production)
 * 4. Generalized signals at 0.45 threshold (tested behavior)
 *
 * @see docs/issues/2026-02-10-generalized-signal-threshold-gap.md
 * @see docs/issues/2026-02-09-signal-generalization-impl-findings.md (Finding #13)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createPrincipleStore } from '../../src/lib/principle-store.js';
import { generalizeSignalsWithCache } from '../../src/lib/signal-generalizer.js';
import { embed } from '../../src/lib/embeddings.js';
import { cosineSimilarity } from '../../src/lib/matcher.js';
import type { Signal } from '../../src/types/signal.js';
import type { LLMProvider } from '../../src/types/llm.js';

// Mock LLM for deterministic tests
const mockLLM: LLMProvider = {
  async classify() {
    return { category: 'identity-core' as const, confidence: 0.9, reasoning: 'mock' };
  },
  async generate() {
    return { text: 'mock generation' };
  },
};

// Test signals that should cluster (authenticity theme)
const authenticitySignals: Partial<Signal>[] = [
  { id: 'sig_1', text: 'I always try to be authentic in my interactions' },
  { id: 'sig_2', text: 'Being genuine matters more than being liked' },
  { id: 'sig_3', text: 'I value authenticity over appearance' },
  { id: 'sig_4', text: 'Showing my true self is important to me' },
  { id: 'sig_5', text: 'I prefer honest feedback over polite lies' },
];

// Test signals that should cluster (transparency theme)
const transparencySignals: Partial<Signal>[] = [
  { id: 'sig_6', text: 'I believe in being transparent about my process' },
  { id: 'sig_7', text: 'Openness builds trust in relationships' },
  { id: 'sig_8', text: 'I share my reasoning, not just conclusions' },
  { id: 'sig_9', text: 'Transparency is more valuable than privacy' },
  { id: 'sig_10', text: 'I tell people what I am thinking' },
];

// Test signals that should NOT cluster (distinct themes)
const distinctSignals: Partial<Signal>[] = [
  { id: 'sig_11', text: 'I love cooking Italian food on weekends' },
  { id: 'sig_12', text: 'Software architecture fascinates me' },
  { id: 'sig_13', text: 'I prefer morning workouts' },
];

async function createFullSignals(partials: Partial<Signal>[]): Promise<Signal[]> {
  return Promise.all(
    partials.map(async (p) => ({
      id: p.id!,
      text: p.text!,
      type: 'preference' as const,
      confidence: 0.8,
      embedding: await embed(p.text!),
      source: { file: 'test.md', line: 1, context: p.text! },
      dimension: 'identity-core' as const,
    }))
  );
}

interface AblationResult {
  threshold: number;
  signalType: 'raw' | 'generalized';
  principleCount: number;
  compressionRatio: number;
  avgWithinClusterSimilarity: number;
  clusterSizes: number[];
}

describe('Threshold Ablation Study', () => {
  let allSignals: Signal[];
  let authenticityGroup: Signal[];
  let transparencyGroup: Signal[];
  let distinctGroup: Signal[];

  beforeAll(async () => {
    authenticityGroup = await createFullSignals(authenticitySignals);
    transparencyGroup = await createFullSignals(transparencySignals);
    distinctGroup = await createFullSignals(distinctSignals);
    allSignals = [...authenticityGroup, ...transparencyGroup, ...distinctGroup];
  });

  describe('Similarity Distribution Analysis', () => {
    it('measures within-group similarity for authenticity signals', async () => {
      const similarities: number[] = [];
      for (let i = 0; i < authenticityGroup.length; i++) {
        for (let j = i + 1; j < authenticityGroup.length; j++) {
          const sim = cosineSimilarity(
            authenticityGroup[i].embedding,
            authenticityGroup[j].embedding
          );
          similarities.push(sim);
        }
      }

      const avg = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      const min = Math.min(...similarities);
      const max = Math.max(...similarities);

      console.log('\n=== Authenticity Group (Raw) ===');
      console.log(`  Pairs: ${similarities.length}`);
      console.log(`  Min similarity: ${min.toFixed(3)}`);
      console.log(`  Max similarity: ${max.toFixed(3)}`);
      console.log(`  Avg similarity: ${avg.toFixed(3)}`);
      console.log(`  Would cluster at 0.85? ${avg >= 0.85 ? 'YES' : 'NO'}`);
      console.log(`  Would cluster at 0.45? ${avg >= 0.45 ? 'YES' : 'NO'}`);

      // These related signals should have meaningful similarity
      expect(avg).toBeGreaterThan(0.3);
    });

    it('measures within-group similarity for transparency signals', async () => {
      const similarities: number[] = [];
      for (let i = 0; i < transparencyGroup.length; i++) {
        for (let j = i + 1; j < transparencyGroup.length; j++) {
          const sim = cosineSimilarity(
            transparencyGroup[i].embedding,
            transparencyGroup[j].embedding
          );
          similarities.push(sim);
        }
      }

      const avg = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      const min = Math.min(...similarities);
      const max = Math.max(...similarities);

      console.log('\n=== Transparency Group (Raw) ===');
      console.log(`  Pairs: ${similarities.length}`);
      console.log(`  Min similarity: ${min.toFixed(3)}`);
      console.log(`  Max similarity: ${max.toFixed(3)}`);
      console.log(`  Avg similarity: ${avg.toFixed(3)}`);
      console.log(`  Would cluster at 0.85? ${avg >= 0.85 ? 'YES' : 'NO'}`);
      console.log(`  Would cluster at 0.45? ${avg >= 0.45 ? 'YES' : 'NO'}`);

      // Transparency signals may have lower similarity than authenticity
      expect(avg).toBeGreaterThan(0.2);
    });

    it('measures cross-group similarity (should be lower)', async () => {
      const similarities: number[] = [];
      for (const authSig of authenticityGroup) {
        for (const transSig of transparencyGroup) {
          const sim = cosineSimilarity(authSig.embedding, transSig.embedding);
          similarities.push(sim);
        }
      }

      const avg = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      const min = Math.min(...similarities);
      const max = Math.max(...similarities);

      console.log('\n=== Cross-Group (Authenticity vs Transparency) ===');
      console.log(`  Pairs: ${similarities.length}`);
      console.log(`  Min similarity: ${min.toFixed(3)}`);
      console.log(`  Max similarity: ${max.toFixed(3)}`);
      console.log(`  Avg similarity: ${avg.toFixed(3)}`);

      // Cross-group should be lower than within-group
      // This helps determine threshold that separates clusters
    });
  });

  describe('Ablation: 4 Combinations', () => {
    const results: AblationResult[] = [];

    it('1. Raw signals at 0.85 threshold (baseline)', async () => {
      const store = createPrincipleStore(mockLLM, 0.85);

      for (const signal of allSignals) {
        await store.addSignal(signal);
      }

      const principles = store.getPrinciples();
      const compressionRatio = allSignals.length / principles.length;

      console.log('\n=== Raw @ 0.85 (Baseline) ===');
      console.log(`  Signals: ${allSignals.length}`);
      console.log(`  Principles: ${principles.length}`);
      console.log(`  Compression: ${compressionRatio.toFixed(2)}:1`);
      console.log(`  N-counts: [${principles.map((p) => p.n_count).join(', ')}]`);

      results.push({
        threshold: 0.85,
        signalType: 'raw',
        principleCount: principles.length,
        compressionRatio,
        avgWithinClusterSimilarity: 0, // Would need more complex calc
        clusterSizes: principles.map((p) => p.n_count),
      });

      // At 0.85, raw signals likely won't cluster much
      expect(principles.length).toBeGreaterThan(0);
    });

    it('2. Raw signals at 0.45 threshold', async () => {
      const store = createPrincipleStore(mockLLM, 0.45);

      for (const signal of allSignals) {
        await store.addSignal(signal);
      }

      const principles = store.getPrinciples();
      const compressionRatio = allSignals.length / principles.length;

      console.log('\n=== Raw @ 0.45 ===');
      console.log(`  Signals: ${allSignals.length}`);
      console.log(`  Principles: ${principles.length}`);
      console.log(`  Compression: ${compressionRatio.toFixed(2)}:1`);
      console.log(`  N-counts: [${principles.map((p) => p.n_count).join(', ')}]`);

      results.push({
        threshold: 0.45,
        signalType: 'raw',
        principleCount: principles.length,
        compressionRatio,
        avgWithinClusterSimilarity: 0,
        clusterSizes: principles.map((p) => p.n_count),
      });
    });

    it('3. Generalized signals at 0.85 threshold (current production)', async () => {
      const generalized = await generalizeSignalsWithCache(mockLLM, allSignals, 'test-ablation');
      const store = createPrincipleStore(mockLLM, 0.85);

      for (const genSig of generalized) {
        await store.addGeneralizedSignal(genSig, genSig.original.dimension);
      }

      const principles = store.getPrinciples();
      const compressionRatio = allSignals.length / principles.length;

      console.log('\n=== Generalized @ 0.85 (Current Production) ===');
      console.log(`  Signals: ${allSignals.length}`);
      console.log(`  Principles: ${principles.length}`);
      console.log(`  Compression: ${compressionRatio.toFixed(2)}:1`);
      console.log(`  N-counts: [${principles.map((p) => p.n_count).join(', ')}]`);

      // Log some generalized texts
      console.log(`  Sample generalized texts:`);
      generalized.slice(0, 3).forEach((g) => {
        console.log(`    - "${g.generalizedText.slice(0, 60)}..."`);
      });

      // Measure similarity between generalized signals
      const genSimilarities: number[] = [];
      for (let i = 0; i < generalized.length; i++) {
        for (let j = i + 1; j < generalized.length; j++) {
          const sim = cosineSimilarity(generalized[i].embedding, generalized[j].embedding);
          genSimilarities.push(sim);
        }
      }
      const avgGenSim = genSimilarities.reduce((a, b) => a + b, 0) / genSimilarities.length;
      const minGenSim = Math.min(...genSimilarities);
      const maxGenSim = Math.max(...genSimilarities);
      console.log(`  Generalized similarity range: ${minGenSim.toFixed(3)} - ${maxGenSim.toFixed(3)}`);
      console.log(`  Generalized avg similarity: ${avgGenSim.toFixed(3)}`);

      results.push({
        threshold: 0.85,
        signalType: 'generalized',
        principleCount: principles.length,
        compressionRatio,
        avgWithinClusterSimilarity: 0,
        clusterSizes: principles.map((p) => p.n_count),
      });
    });

    it('4. Generalized signals at 0.45 threshold (tested behavior)', async () => {
      const generalized = await generalizeSignalsWithCache(mockLLM, allSignals, 'test-ablation');
      const store = createPrincipleStore(mockLLM, 0.45);

      for (const genSig of generalized) {
        await store.addGeneralizedSignal(genSig, genSig.original.dimension);
      }

      const principles = store.getPrinciples();
      const compressionRatio = allSignals.length / principles.length;

      console.log('\n=== Generalized @ 0.45 (Tested Behavior) ===');
      console.log(`  Signals: ${allSignals.length}`);
      console.log(`  Principles: ${principles.length}`);
      console.log(`  Compression: ${compressionRatio.toFixed(2)}:1`);
      console.log(`  N-counts: [${principles.map((p) => p.n_count).join(', ')}]`);

      results.push({
        threshold: 0.45,
        signalType: 'generalized',
        principleCount: principles.length,
        compressionRatio,
        avgWithinClusterSimilarity: 0,
        clusterSizes: principles.map((p) => p.n_count),
      });
    });

    it('prints summary table', () => {
      console.log('\n');
      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║                    ABLATION STUDY RESULTS                      ║');
      console.log('╠════════════════════════════════════════════════════════════════╣');
      console.log('║  Signal Type  │  Threshold  │  Principles  │  Compression     ║');
      console.log('╠═══════════════╪═════════════╪══════════════╪══════════════════╣');

      for (const r of results) {
        const type = r.signalType.padEnd(11);
        const thresh = r.threshold.toFixed(2).padStart(6);
        const princ = r.principleCount.toString().padStart(8);
        const comp = `${r.compressionRatio.toFixed(2)}:1`.padStart(10);
        console.log(`║  ${type}  │    ${thresh}    │    ${princ}    │    ${comp}      ║`);
      }

      console.log('╚════════════════════════════════════════════════════════════════╝');
      console.log('\n');

      // Verify we have results (may be less than 4 if tests failed)
      expect(results.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Threshold Recommendation', () => {
    it('suggests optimal threshold based on results', async () => {
      // Run a sweep of thresholds to find optimal
      const thresholds = [0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85];
      const generalized = await generalizeSignalsWithCache(mockLLM, allSignals, 'test-sweep');

      console.log('\n=== Threshold Sweep (Generalized Signals) ===');
      console.log('  Threshold │ Principles │ Compression │ Largest Cluster');
      console.log('  ──────────┼────────────┼─────────────┼─────────────────');

      for (const threshold of thresholds) {
        const store = createPrincipleStore(mockLLM, threshold);
        for (const genSig of generalized) {
          await store.addGeneralizedSignal(genSig, genSig.original.dimension);
        }
        const principles = store.getPrinciples();
        const compression = allSignals.length / principles.length;
        const largestCluster = Math.max(...principles.map((p) => p.n_count));

        console.log(
          `     ${threshold.toFixed(2)}   │     ${principles.length.toString().padStart(2)}     │    ${compression.toFixed(2)}:1    │        ${largestCluster}`
        );
      }

      console.log('\n  Recommendation: Choose threshold where:');
      console.log('  - Compression is good (3:1 to 5:1)');
      console.log('  - Related signals cluster (N >= 2 for themes)');
      console.log('  - Distinct signals stay separate');
    });
  });
});
