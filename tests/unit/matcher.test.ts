/**
 * Unit Tests: Semantic Matcher
 *
 * Tests for LLM-based semantic matching.
 * Replaces embedding-based cosine similarity with LLM semantic comparison.
 *
 * Cross-Reference: docs/plans/2026-02-12-llm-based-similarity.md (Stage 2)
 */

import { describe, it, expect } from 'vitest';
import {
  findBestMatch,
  cosineSimilarity,
  DEFAULT_MATCH_THRESHOLD,
  type MatchResult,
} from '../../src/lib/matcher.js';
import type { Principle } from '../../src/types/principle.js';
import { createSimilarityMockLLM } from '../mocks/llm-mock.js';

// Helper to create a minimal principle for testing
function createTestPrinciple(
  id: string,
  text: string,
  dimension: string = 'identity-core'
): Principle {
  return {
    id,
    text,
    dimension: dimension as Principle['dimension'],
    strength: 1.0,
    n_count: 1,
    embedding: [], // Empty - not used in LLM-based matching
    similarity_threshold: 0.75,
    derived_from: { signals: [], merged_at: new Date().toISOString() },
    history: [],
  };
}

describe('Semantic Matcher', () => {
  describe('findBestMatch (LLM-based)', () => {
    it('returns empty result for empty principles array', async () => {
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

    it('finds semantically equivalent principle', async () => {
      const llm = createSimilarityMockLLM();
      const principles = [
        createTestPrinciple('1', 'Optimize database queries'),
        createTestPrinciple('2', 'Be truthful about abilities'),
        createTestPrinciple('3', 'Cook a meal'),
      ];

      const result = await findBestMatch(
        'Be honest about capabilities',
        principles,
        llm
      );

      // Mock LLM should match "honest" with "truthful"
      expect(result.principle).not.toBeNull();
      expect(result.principle?.id).toBe('2');
      expect(result.isMatch).toBe(true);
    });

    it('returns no match when confidence below threshold', async () => {
      const llm = createSimilarityMockLLM();
      const principles = [
        createTestPrinciple('1', 'Cook a meal'),
        createTestPrinciple('2', 'Play music loudly'),
      ];

      const result = await findBestMatch(
        'Be honest about capabilities',
        principles,
        llm,
        0.95 // Very high threshold
      );

      // No semantic equivalence found
      expect(result.isMatch).toBe(false);
    });

    it('uses default threshold of 0.7', async () => {
      expect(DEFAULT_MATCH_THRESHOLD).toBe(0.7);
    });

    it('accepts custom threshold parameter', async () => {
      const llm = createSimilarityMockLLM();
      const principles = [
        createTestPrinciple('1', 'Be truthful about abilities'),
      ];

      // Test with low threshold - should match
      const lowResult = await findBestMatch(
        'Be honest about capabilities',
        principles,
        llm,
        0.5
      );
      expect(lowResult.isMatch).toBe(true);
    });

    it('returns correct MatchResult structure', async () => {
      const llm = createSimilarityMockLLM();
      const principles = [
        createTestPrinciple('1', 'Be truthful about abilities'),
      ];

      const result: MatchResult = await findBestMatch(
        'Be honest about capabilities',
        principles,
        llm
      );

      // Check structure
      expect(result).toHaveProperty('principle');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('isMatch');

      // Confidence should be a number between 0 and 1
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('cosineSimilarity (@deprecated)', () => {
    // These tests verify the deprecated function still works
    // for backward compatibility during migration (Stage 4)

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

    it('throws on dimension mismatch', () => {
      const v1 = [1, 0, 0];
      const v2 = [1, 0];
      expect(() => cosineSimilarity(v1, v2)).toThrow('Vector dimension mismatch');
    });
  });
});

describe('Golden Dataset Validation', () => {
  // Load golden dataset for quality calibration
  // Cross-Reference: test/fixtures/golden-similarity-dataset.json

  it('validates that golden dataset exists and has correct structure', async () => {
    // Dynamic import to validate JSON structure
    const goldenData = await import('../../test/fixtures/golden-similarity-dataset.json');

    expect(goldenData.pairs).toBeDefined();
    expect(Array.isArray(goldenData.pairs)).toBe(true);
    expect(goldenData.pairs.length).toBeGreaterThanOrEqual(10);

    // Validate structure of each pair
    for (const pair of goldenData.pairs) {
      expect(pair).toHaveProperty('signalText');
      expect(pair).toHaveProperty('principleText');
      expect(pair).toHaveProperty('expectedMatch');
      expect(typeof pair.signalText).toBe('string');
      expect(typeof pair.principleText).toBe('string');
      expect(typeof pair.expectedMatch).toBe('boolean');
    }
  });

  // Note: Full golden dataset accuracy test requires real LLM
  // That test belongs in tests/e2e/ or tests/integration/
  // Here we just validate the dataset structure
});
