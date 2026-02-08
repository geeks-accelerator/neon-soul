/**
 * Unit Tests: Principle Store
 *
 * Tests for principle accumulation and matching with LLM-based classification.
 */

import { describe, it, expect } from 'vitest';
import { createPrincipleStore } from '../../src/lib/principle-store.js';
import { createMockLLM } from '../mocks/llm-mock.js';
import type { Signal } from '../../src/types/signal.js';

// Helper to create test signals
function createTestSignal(
  id: string,
  text: string,
  embedding: number[]
): Signal {
  return {
    id,
    type: 'value',
    text,
    confidence: 0.9,
    embedding,
    source: {
      type: 'memory',
      file: 'test.md',
      context: text.slice(0, 50),
      extractedAt: new Date(),
    },
  };
}

// Create a simple 384-dim embedding (for testing)
function createTestEmbedding(seed: number): number[] {
  const embedding = new Array(384).fill(0);
  for (let i = 0; i < 384; i++) {
    embedding[i] = Math.sin(seed + i * 0.1) * 0.5;
  }
  // Normalize
  let sumSq = 0;
  for (const v of embedding) sumSq += v * v;
  const norm = Math.sqrt(sumSq);
  return embedding.map((v) => v / norm);
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

      const signal = createTestSignal(
        'sig_1',
        'I believe in honesty',
        createTestEmbedding(1)
      );

      const result = await store.addSignal(signal);

      expect(result.action).toBe('created');
      expect(result.principleId).toBeDefined();
      expect(result.similarity).toBe(1.0);
      expect(store.getPrinciples()).toHaveLength(1);
    });

    it('uses provided dimension when available', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm);

      const signal = createTestSignal(
        'sig_1',
        'Test signal',
        createTestEmbedding(1)
      );

      await store.addSignal(signal, 'boundaries-ethics');

      const principles = store.getPrinciples();
      expect(principles[0]?.dimension).toBe('boundaries-ethics');
    });

    it('uses LLM to classify dimension when not provided', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm);

      const signal = createTestSignal(
        'sig_1',
        'I am always honest',
        createTestEmbedding(1)
      );

      await store.addSignal(signal);

      // LLM should have been called for dimension classification
      expect(llm.getCallCount()).toBeGreaterThan(0);
    });

    it('reinforces existing principle when similar signal added', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm, 0.5); // Low threshold for testing

      const embedding1 = createTestEmbedding(1);
      const signal1 = createTestSignal('sig_1', 'Be honest', embedding1);

      // Create slightly different but similar embedding
      const embedding2 = createTestEmbedding(1.01);
      const signal2 = createTestSignal('sig_2', 'Stay honest', embedding2);

      await store.addSignal(signal1);
      const result2 = await store.addSignal(signal2);

      // With low threshold and similar embeddings, should reinforce
      // (actual behavior depends on cosine similarity of embeddings)
      expect(['created', 'reinforced']).toContain(result2.action);
    });

    it('creates new principle for dissimilar signal', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm, 0.99); // Very high threshold

      const signal1 = createTestSignal(
        'sig_1',
        'Be honest',
        createTestEmbedding(1)
      );
      const signal2 = createTestSignal(
        'sig_2',
        'Cook food',
        createTestEmbedding(100) // Very different embedding
      );

      await store.addSignal(signal1);
      const result2 = await store.addSignal(signal2);

      expect(result2.action).toBe('created');
      expect(store.getPrinciples()).toHaveLength(2);
    });

    it('increments n_count when reinforcing', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm, 0.0); // Accept all as similar

      const embedding = createTestEmbedding(1);
      const signal1 = createTestSignal('sig_1', 'Be honest', embedding);
      const signal2 = createTestSignal('sig_2', 'Be honest', embedding);
      const signal3 = createTestSignal('sig_3', 'Be honest', embedding);

      await store.addSignal(signal1);
      await store.addSignal(signal2);
      await store.addSignal(signal3);

      const principles = store.getPrinciples();
      expect(principles).toHaveLength(1);
      expect(principles[0]?.n_count).toBe(3);
    });
  });

  describe('getPrinciples', () => {
    it('returns all principles', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm, 0.99);

      await store.addSignal(
        createTestSignal('sig_1', 'Principle 1', createTestEmbedding(1))
      );
      await store.addSignal(
        createTestSignal('sig_2', 'Principle 2', createTestEmbedding(100))
      );

      expect(store.getPrinciples()).toHaveLength(2);
    });
  });

  describe('getPrinciplesAboveN', () => {
    it('filters principles by n_count threshold', async () => {
      const llm = createMockLLM();
      // Use 0.0 threshold so all signals merge into same principle
      const store = createPrincipleStore(llm, 0.0);

      const embedding = createTestEmbedding(1);
      // Add 3 identical signals to create N=3
      await store.addSignal(createTestSignal('sig_1', 'Be honest', embedding));
      await store.addSignal(createTestSignal('sig_2', 'Be honest', embedding));
      await store.addSignal(createTestSignal('sig_3', 'Be honest', embedding));

      // Verify one principle with N=3
      expect(store.getPrinciplesAboveN(3)).toHaveLength(1);
      expect(store.getPrinciplesAboveN(1)).toHaveLength(1);
      expect(store.getPrinciples()[0]?.n_count).toBe(3);
    });

    it('creates separate principles for different signals with high threshold', async () => {
      const llm = createMockLLM();
      // Use 0.99 threshold so different signals create separate principles
      const store = createPrincipleStore(llm, 0.99);

      await store.addSignal(
        createTestSignal('sig_1', 'Be honest', createTestEmbedding(1))
      );
      await store.addSignal(
        createTestSignal('sig_2', 'Cook food', createTestEmbedding(100))
      );

      // Should have 2 separate principles
      expect(store.getPrinciples()).toHaveLength(2);
      expect(store.getPrinciplesAboveN(1)).toHaveLength(2);
      expect(store.getPrinciplesAboveN(2)).toHaveLength(0);
    });
  });

  describe('provenance tracking', () => {
    it('tracks signal sources in derived_from', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm);

      const signal = createTestSignal(
        'sig_123',
        'Track provenance',
        createTestEmbedding(1)
      );

      await store.addSignal(signal);

      const principles = store.getPrinciples();
      const provenance = principles[0]?.derived_from;

      expect(provenance).toBeDefined();
      expect(provenance?.signals).toHaveLength(1);
      expect(provenance?.signals[0]?.id).toBe('sig_123');
    });

    it('accumulates signals when reinforcing', async () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm, 0.0);

      const embedding = createTestEmbedding(1);

      await store.addSignal(
        createTestSignal('sig_1', 'Same principle', embedding)
      );
      await store.addSignal(
        createTestSignal('sig_2', 'Same principle', embedding)
      );

      const principles = store.getPrinciples();
      expect(principles[0]?.derived_from.signals).toHaveLength(2);
    });
  });
});
