/**
 * VCR-Based Generalization Tests
 *
 * Tests signal generalization using VCR fixture replay.
 * Enables fast, deterministic testing with real LLM behavior.
 *
 * Usage:
 *   npm test tests/e2e/generalization-vcr.test.ts
 *
 * To re-record fixtures:
 *   npm run vcr:record
 *
 * ## Threshold Tuning Process
 *
 * The similarity thresholds were determined empirically:
 *
 * 1. **Raw signals at 0.85**: High threshold required because raw signals
 *    have high lexical variance ("I always tell the truth" vs "be honest").
 *    Result: ~1:1 compression (no clustering).
 *
 * 2. **Generalized signals at 0.45**: Lower threshold works because
 *    generalization normalizes to similar forms ("Values truthfulness").
 *    Observed within-cluster similarities: 0.36-0.58.
 *    Result: ~5:1 compression.
 *
 * The ablation study test validates this by comparing all 4 combinations:
 * raw/gen x high/low threshold.
 *
 * @see docs/issues/2026-02-09-signal-generalization-impl-findings.md (Finding #12)
 *
 * Cross-Reference:
 * - docs/plans/2026-02-09-signal-generalization.md (Stage 4c)
 * - docs/observations/http-vcr-pattern-for-api-testing.md (Part 13)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OllamaLLMProvider } from '../../src/lib/llm-providers/ollama-provider.js';
import { VCRLLMProvider, type VCRMode } from '../../src/lib/llm-providers/vcr-provider.js';
import { generalizeSignal, generalizeSignals, PROMPT_VERSION } from '../../src/lib/signal-generalizer.js';
import { createPrincipleStore } from '../../src/lib/principle-store.js';
import { embed } from '../../src/lib/embeddings.js';
// v0.2.0: cosineSimilarity is deprecated, embedding-based tests need migration
// import { cosineSimilarity } from '../../src/lib/matcher.js';
import type { Signal } from '../../src/types/signal.js';
import type { LLMProvider } from '../../src/types/llm.js';

// Configuration
const FIXTURE_DIR = resolve(import.meta.dirname, '../fixtures/vcr/golden-set');
const GOLDEN_SET_PATH = resolve(import.meta.dirname, '../fixtures/golden-set-signals.json');
const VCR_MODE = (process.env.VCR_MODE ?? 'replay') as VCRMode;

interface GoldenSetSignal {
  id: string;
  text: string;
  dimension: string;
  group: string;
  expectedGeneralization: string;
}

interface ExpectedCluster {
  name: string;
  signals: string[];
  expectedNCount: number;
}

interface GoldenSetData {
  signals: GoldenSetSignal[];
  expectedClusters: ExpectedCluster[];
}

// Shared state
let llm: LLMProvider;
let goldenSet: GoldenSetData;

/** Model used for fixtures - changing this requires re-recording */
const MODEL_NAME = 'llama3';

beforeAll(async () => {
  // Load golden set
  goldenSet = JSON.parse(readFileSync(GOLDEN_SET_PATH, 'utf-8'));

  // Create VCR-wrapped LLM (model name included in fixture key for proper invalidation)
  const realLLM = new OllamaLLMProvider({ model: MODEL_NAME });
  llm = new VCRLLMProvider(realLLM, FIXTURE_DIR, VCR_MODE, MODEL_NAME);

  console.log(`\n🎬 VCR Mode: ${VCR_MODE}`);
  console.log(`📂 Fixtures: ${FIXTURE_DIR}`);
  console.log(`🤖 Model: ${MODEL_NAME}`);
  console.log(`📋 Golden Set: ${goldenSet.signals.length} signals\n`);
});

/**
 * Convert golden set signal to Signal type.
 */
async function toSignal(gs: GoldenSetSignal): Promise<Signal> {
  return {
    id: gs.id,
    text: gs.text,
    dimension: gs.dimension as Signal['dimension'],
    type: 'value',
    confidence: 0.9,
    embedding: await embed(gs.text),
    source: {
      file: 'golden-set',
      line: 0,
      context: 'VCR test',
    },
  };
}

describe('VCR Generalization Tests', () => {
  describe('Signal Generalization', () => {
    it('generalizes signals to abstract principles', async () => {
      const signal = await toSignal(goldenSet.signals[0]!);
      const result = await generalizeSignal(llm, signal, 'llama3');

      expect(result.generalizedText).toBeDefined();
      expect(result.generalizedText.length).toBeGreaterThan(0);
      expect(result.generalizedText.length).toBeLessThan(150);
      expect(result.provenance.used_fallback).toBe(false);
      expect(result.provenance.prompt_version).toBe(PROMPT_VERSION);

      console.log(`  Original: "${signal.text}"`);
      console.log(`  Generalized: "${result.generalizedText}"`);
    });

    it('generalizations use imperative form', async () => {
      const signals = await Promise.all(goldenSet.signals.slice(0, 5).map(toSignal));
      const results = await generalizeSignals(llm, signals, 'llama3');

      for (const result of results) {
        const text = result.generalizedText;
        // Should start with Values, Prioritizes, Avoids, or similar
        const hasImperativeForm = /^(Values|Prioritizes|Avoids|Maintains|Embraces|Approaches)/i.test(text);
        expect(hasImperativeForm).toBe(true);
        console.log(`  ✓ "${text.slice(0, 60)}..."`);
      }
    });

    it('removes pronouns from generalizations', async () => {
      const signals = await Promise.all(goldenSet.signals.map(toSignal));
      const results = await generalizeSignals(llm, signals, 'llama3');

      const pronounPattern = /\b(I|we|you|my|our|your)\b/i;
      for (const result of results) {
        const hasPronouns = pronounPattern.test(result.generalizedText);
        if (hasPronouns) {
          console.log(`  ⚠️ Pronoun found: "${result.generalizedText}"`);
        }
        expect(hasPronouns).toBe(false);
      }
    });
  });

  /**
   * v0.2.0: Semantic similarity tests depend on cosineSimilarity (embedding-based).
   * TODO: Re-record VCR fixtures and update tests for LLM-based matching.
   * @see docs/plans/2026-02-12-llm-based-similarity.md (Stage 5)
   */
  describe('Semantic Similarity', () => {
    // v0.2.0: Skipped - uses cosineSimilarity which is deprecated
    it.todo('similar signals produce similar generalizations (v0.2.0 update needed)');

    // v0.2.0: Skipped - uses cosineSimilarity which is deprecated
    it.todo('different clusters have lower similarity (v0.2.0 update needed)');
  });

  /**
   * v0.2.0: Clustering tests depend on embedding-based similarity.
   * TODO: Re-record VCR fixtures and update tests for LLM-based matching.
   * @see docs/plans/2026-02-12-llm-based-similarity.md (Stage 5)
   */
  describe('Clustering Improvement', () => {
    // v0.2.0: Skipped - requires VCR re-recording for LLM similarity
    it.todo('achieves N-count accumulation through generalization (v0.2.0 update needed)');

    // v0.2.0: Skipped - requires VCR re-recording for LLM similarity
    it.todo('measures compression vs baseline (v0.2.0 update needed)');

    // v0.2.0: Skipped - requires VCR re-recording for LLM similarity
    it.todo('ablation study: isolates generalization vs threshold effects (v0.2.0 update needed)');
  });

  describe('VCR Performance', () => {
    it('replays fixtures quickly', async () => {
      const signals = await Promise.all(goldenSet.signals.map(toSignal));

      const startTime = Date.now();
      await generalizeSignals(llm, signals, 'llama3');
      const elapsed = Date.now() - startTime;

      console.log(`  Time for ${signals.length} signals: ${elapsed}ms`);
      console.log(`  Per signal: ${(elapsed / signals.length).toFixed(1)}ms`);

      // VCR replay should be fast (< 100ms per signal)
      const perSignal = elapsed / signals.length;
      expect(perSignal).toBeLessThan(500); // Allow for embedding time
    });

    it('reports VCR stats', () => {
      const vcrLLM = llm as VCRLLMProvider;
      const stats = vcrLLM.getStats();

      console.log(`\n  VCR Stats:`);
      console.log(`    Hits: ${stats.hits}`);
      console.log(`    Misses: ${stats.misses}`);
      console.log(`    Recordings: ${stats.recordings}`);
      console.log(`    Errors: ${stats.errors}`);

      // In replay mode, should have hits and no recordings
      if (VCR_MODE === 'replay') {
        expect(stats.hits).toBeGreaterThan(0);
        expect(stats.recordings).toBe(0);
      }
    });
  });
});
