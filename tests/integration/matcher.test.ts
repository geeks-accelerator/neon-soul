/**
 * Integration Tests: Semantic Matcher
 *
 * Tests for LLM-based semantic matching (v0.2.0+).
 * Also includes legacy tests for embedding-based functions during migration.
 *
 * Cross-Reference: docs/plans/2026-02-12-llm-based-similarity.md (Stage 2)
 */

import { describe, it, expect } from 'vitest';
import {
  cosineSimilarity,
  findBestMatch,
  DEFAULT_MATCH_THRESHOLD,
  type MatchResult,
} from '../../src/lib/matcher.js';
import { embed } from '../../src/lib/embeddings.js';
import type { Principle } from '../../src/types/principle.js';
import { createSimilarityMockLLM } from '../mocks/llm-mock.js';

// Helper to create a minimal principle for testing
function createTestPrinciple(
  id: string,
  text: string,
  dimension: Principle['dimension'] = 'identity-core',
  embedding: number[] = []
): Principle {
  return {
    id,
    text,
    dimension,
    strength: 1.0,
    n_count: 1,
    embedding,
    similarity_threshold: 0.75,
    derived_from: { signals: [], merged_at: new Date().toISOString() },
    history: [],
  };
}

describe('Semantic Matcher', () => {
  /**
   * @deprecated cosineSimilarity tests - kept for backward compatibility
   * These functions will be removed when Stage 4 migrates all callers
   */
  describe('cosineSimilarity (@deprecated)', () => {
    it('returns 1.0 for identical vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [1, 0, 0];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0, 5);
    });

    it('returns 0.0 for orthogonal vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [0, 1, 0];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(0.0, 5);
    });

    it('returns -1.0 for opposite vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [-1, 0, 0];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1.0, 5);
    });

    it('handles normalized vectors', () => {
      const v1 = [0.6, 0.8, 0];
      const v2 = [0.6, 0.8, 0];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0, 5);
    });
  });

  /**
   * @deprecated embed tests - kept until Stage 5 removes embeddings.ts
   * These tests will be deleted when @xenova/transformers is removed
   */
  describe('embed (@deprecated)', () => {
    it('generates 384-dimensional embeddings', async () => {
      const embedding = await embed('Be honest about capabilities');
      expect(embedding).toHaveLength(384);
    });

    it('generates similar embeddings for similar texts', async () => {
      const e1 = await embed('Be honest about capabilities');
      const e2 = await embed('Be truthful about abilities');
      const similarity = cosineSimilarity(e1, e2);
      // Relaxed threshold - semantic similarity varies
      expect(similarity).toBeGreaterThan(0.5);
    });

    it('generates different embeddings for different texts', async () => {
      const e1 = await embed('Be honest about capabilities');
      const e2 = await embed('Optimize database queries');
      const similarity = cosineSimilarity(e1, e2);
      expect(similarity).toBeLessThan(0.5);
    });
  });

  /**
   * findBestMatch tests - v0.2.0 LLM-based API
   * New signature: (text: string, principles: Principle[], llm: LLMProvider, threshold?: number)
   */
  describe('findBestMatch (LLM-based)', () => {
    it('finds the best matching principle', async () => {
      const llm = createSimilarityMockLLM();

      const principles = [
        createTestPrinciple('1', 'Optimize performance', 'identity-core'),
        createTestPrinciple('2', 'Be truthful about abilities', 'honesty-framework'),
        createTestPrinciple('3', 'Cook a meal', 'identity-core'),
      ];

      const result: MatchResult = await findBestMatch(
        'Be honest about capabilities',
        principles,
        llm
      );

      expect(result.principle).not.toBeNull();
      expect(result.principle?.id).toBe('2');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.isMatch).toBe(true);
    });

    it('returns no match when confidence below threshold', async () => {
      const llm = createSimilarityMockLLM();

      const principles = [
        createTestPrinciple('1', 'Cook a delicious meal'),
        createTestPrinciple('2', 'Play music loudly'),
      ];

      const result: MatchResult = await findBestMatch(
        'Be honest about capabilities',
        principles,
        llm,
        0.95 // Very high threshold
      );

      expect(result.isMatch).toBe(false);
    });

    it('returns empty result for empty principles', async () => {
      const llm = createSimilarityMockLLM();

      const result = await findBestMatch(
        'Be honest about capabilities',
        [],
        llm
      );

      expect(result.principle).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.isMatch).toBe(false);
    });

    it('uses default threshold of 0.7', () => {
      expect(DEFAULT_MATCH_THRESHOLD).toBe(0.7);
    });

    it('handles custom threshold parameter', async () => {
      const llm = createSimilarityMockLLM();

      const principles = [
        createTestPrinciple('1', 'Be truthful about abilities'),
      ];

      // Test with low threshold
      const result = await findBestMatch(
        'Be honest about capabilities',
        principles,
        llm,
        0.5
      );

      expect(result.isMatch).toBe(true);
    });
  });
});
