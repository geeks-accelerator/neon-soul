/**
 * Unit Tests: Principle Store
 *
 * Tests for principle accumulation and matching with LLM-based semantic similarity.
 *
 * v0.2.0: Migrated from embedding-based to LLM-based similarity matching.
 * Tests now use createSimilarityMockLLM() which provides deterministic
 * semantic equivalence detection for reproducible tests.
 *
 * @see docs/plans/2026-02-12-llm-based-similarity.md
 */

import { describe, it, expect } from 'vitest';
import { createPrincipleStore } from '../../src/lib/principle-store.js';
import { createMockLLM, createSimilarityMockLLM } from '../mocks/llm-mock.js';
import type { Signal } from '../../src/types/signal.js';

// Helper to create test signals (embedding now optional in v0.2.0)
function createTestSignal(
  id: string,
  text: string,
  embedding?: number[]
): Signal {
  return {
    id,
    type: 'value',
    text,
    confidence: 0.9,
    embedding: embedding ?? [], // Optional in v0.2.0
    source: {
      type: 'memory',
      file: 'test.md',
      context: text.slice(0, 50),
      extractedAt: new Date(),
    },
  };
}

describe('Principle Store', () => {
  describe('createPrincipleStore', () => {
    it('creates store with LLM provider', () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm);

      expect(store).toBeDefined();
      expect(store.principles).toBeInstanceOf(Map);
      expect(store.getPrinciples()).toEqual([]);
    });

    it('accepts custom similarity threshold', () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm, 0.9);

      expect(store).toBeDefined();
    });
  });

  describe('addSignal', () => {
    it('creates first principle from first signal (bootstrap)', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm);

      const signal = createTestSignal('sig_1', 'I believe in honesty');

      const result = await store.addSignal(signal);

      expect(result.action).toBe('created');
      expect(result.principleId).toBeDefined();
      expect(result.similarity).toBe(1.0);
      expect(store.getPrinciples()).toHaveLength(1);
    });

    it('uses provided dimension when available', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm);

      const signal = createTestSignal('sig_1', 'Test signal');

      await store.addSignal(signal, 'boundaries-ethics');

      const principles = store.getPrinciples();
      expect(principles[0]?.dimension).toBe('boundaries-ethics');
    });

    it('uses LLM to classify dimension when not provided', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm);

      const signal = createTestSignal('sig_1', 'I am always honest');

      await store.addSignal(signal);

      // LLM should have been called for dimension classification
      expect(llm.getCallCount()).toBeGreaterThan(0);
    });

    it('reinforces existing principle when semantically similar signal added', async () => {
      // Use similarity mock that understands semantic equivalences
      const llm = createSimilarityMockLLM();
      const store = createPrincipleStore(llm, 0.7); // Medium threshold

      // "honest" and "truthful" are semantic equivalents in the mock
      const signal1 = createTestSignal('sig_1', 'I always try to be honest');
      const signal2 = createTestSignal('sig_2', 'Being truthful matters to me');

      await store.addSignal(signal1);
      const result2 = await store.addSignal(signal2);

      // Should reinforce due to semantic equivalence (honest <-> truthful)
      expect(result2.action).toBe('reinforced');
      expect(store.getPrinciples()).toHaveLength(1);
      expect(store.getPrinciples()[0]?.n_count).toBe(2);
    });

    it('creates new principle for semantically different signal', async () => {
      const llm = createSimilarityMockLLM();
      const store = createPrincipleStore(llm, 0.7);

      // These signals have no semantic equivalence in the mock
      const signal1 = createTestSignal('sig_1', 'I value honesty');
      const signal2 = createTestSignal('sig_2', 'I enjoy cooking');

      await store.addSignal(signal1);
      const result2 = await store.addSignal(signal2);

      // Should create new principle (no semantic match)
      expect(result2.action).toBe('created');
      expect(store.getPrinciples()).toHaveLength(2);
    });

    it('increments n_count when reinforcing with semantically equivalent signals', async () => {
      const llm = createSimilarityMockLLM();
      const store = createPrincipleStore(llm, 0.7);

      // "capabilities" and "abilities" are semantic equivalents in the mock
      const signal1 = createTestSignal('sig_1', 'I know my capabilities');
      const signal2 = createTestSignal('sig_2', 'Understanding my abilities');
      const signal3 = createTestSignal('sig_3', 'My capabilities define me');

      await store.addSignal(signal1);
      await store.addSignal(signal2);
      await store.addSignal(signal3);

      const principles = store.getPrinciples();
      expect(principles).toHaveLength(1);
      expect(principles[0]?.n_count).toBe(3);
    });

    it('skips duplicate signal IDs', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm);

      const signal = createTestSignal('sig_dup', 'Test signal');

      await store.addSignal(signal);
      const result2 = await store.addSignal(signal); // Same ID

      expect(result2.action).toBe('skipped');
      expect(store.getPrinciples()).toHaveLength(1);
    });
  });

  describe('getPrinciples', () => {
    it('returns all principles', async () => {
      const llm = createSimilarityMockLLM();
      const store = createPrincipleStore(llm, 0.7);

      // Different semantic concepts -> different principles
      await store.addSignal(createTestSignal('sig_1', 'I value honesty'));
      await store.addSignal(createTestSignal('sig_2', 'I enjoy cooking'));

      expect(store.getPrinciples()).toHaveLength(2);
    });
  });

  describe('getPrinciplesAboveN', () => {
    it('filters principles by n_count threshold', async () => {
      const llm = createSimilarityMockLLM();
      const store = createPrincipleStore(llm, 0.7);

      // Add 3 semantically equivalent signals for N=3
      // "concise" and "brief" are equivalents in the mock
      await store.addSignal(createTestSignal('sig_1', 'I prefer concise writing'));
      await store.addSignal(createTestSignal('sig_2', 'Being brief is important'));
      await store.addSignal(createTestSignal('sig_3', 'Concise communication'));

      // Should have 1 principle with N=3
      expect(store.getPrinciplesAboveN(3)).toHaveLength(1);
      expect(store.getPrinciplesAboveN(1)).toHaveLength(1);
      expect(store.getPrinciples()[0]?.n_count).toBe(3);
    });

    it('creates separate principles for different semantic concepts', async () => {
      const llm = createSimilarityMockLLM();
      const store = createPrincipleStore(llm, 0.7);

      // Different semantic concepts, no equivalence
      await store.addSignal(createTestSignal('sig_1', 'I value honesty'));
      await store.addSignal(createTestSignal('sig_2', 'Safety is important'));

      // Should have 2 separate principles with N=1 each
      expect(store.getPrinciples()).toHaveLength(2);
      expect(store.getPrinciplesAboveN(1)).toHaveLength(2);
      expect(store.getPrinciplesAboveN(2)).toHaveLength(0);
    });
  });

  describe('setThreshold', () => {
    it('updates threshold for future signal matching', async () => {
      const llm = createSimilarityMockLLM();
      // Start with low threshold (signals more likely to merge)
      const store = createPrincipleStore(llm, 0.5);

      await store.addSignal(createTestSignal('sig_1', 'I value readability'));
      await store.addSignal(createTestSignal('sig_2', 'Make it readable'));

      // Should have 1 principle (readability <-> readable equivalence)
      expect(store.getPrinciples()).toHaveLength(1);
      expect(store.getPrinciples()[0]?.n_count).toBe(2);

      // Change to very high threshold (signals less likely to merge)
      store.setThreshold(0.99);

      // Semantically different signal at high threshold -> new principle
      await store.addSignal(createTestSignal('sig_3', 'I enjoy cooking'));

      // Should now have 2 principles
      expect(store.getPrinciples()).toHaveLength(2);
    });

    it('preserves existing principles and N-counts when threshold changes', async () => {
      const llm = createSimilarityMockLLM();
      const store = createPrincipleStore(llm, 0.5);

      // Build up N=3 principle using semantic equivalence
      await store.addSignal(createTestSignal('sig_1', 'I value concise writing'));
      await store.addSignal(createTestSignal('sig_2', 'Brief is better'));
      await store.addSignal(createTestSignal('sig_3', 'Keep it concise'));

      // Verify N=3 principle exists
      expect(store.getPrinciples()[0]?.n_count).toBe(3);

      // Change threshold - existing principles should remain
      store.setThreshold(0.99);

      // Principles still there with same N-count
      expect(store.getPrinciples()).toHaveLength(1);
      expect(store.getPrinciples()[0]?.n_count).toBe(3);
    });
  });

  describe('provenance tracking', () => {
    it('tracks signal sources in derived_from', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm);

      const signal = createTestSignal('sig_123', 'Track provenance');

      await store.addSignal(signal);

      const principles = store.getPrinciples();
      const provenance = principles[0]?.derived_from;

      expect(provenance).toBeDefined();
      expect(provenance?.signals).toHaveLength(1);
      expect(provenance?.signals[0]?.id).toBe('sig_123');
    });

    it('accumulates signals when reinforcing', async () => {
      const llm = createSimilarityMockLLM();
      const store = createPrincipleStore(llm, 0.7);

      // Use semantic equivalence to force reinforcement
      await store.addSignal(createTestSignal('sig_1', 'I value honesty'));
      await store.addSignal(createTestSignal('sig_2', 'Being truthful matters'));

      const principles = store.getPrinciples();
      expect(principles[0]?.derived_from.signals).toHaveLength(2);
    });
  });

  describe('principle text (v0.2.0)', () => {
    it('creates principles without embedding field', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm);

      const signal = createTestSignal('sig_1', 'Test principle');
      await store.addSignal(signal);

      const principle = store.getPrinciples()[0];
      // v0.2.0: embedding is now optional, may not be present
      expect(principle?.text).toBe('Test principle');
      expect(principle?.n_count).toBe(1);
    });

    it('preserves principle text when reinforced (highest strength wins)', async () => {
      const llm = createSimilarityMockLLM();
      const store = createPrincipleStore(llm, 0.7);

      // First signal creates principle with its text
      await store.addSignal(createTestSignal('sig_1', 'I value honesty above all'));

      // Second signal reinforces but does not change text
      await store.addSignal(createTestSignal('sig_2', 'Being truthful is important'));

      const principle = store.getPrinciples()[0];
      // Original text preserved (first signal established the principle)
      expect(principle?.text).toBe('I value honesty above all');
      expect(principle?.n_count).toBe(2);
    });
  });
});
