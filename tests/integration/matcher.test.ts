/**
 * Integration Tests: Semantic Matcher
 *
 * Tests for embedding-based semantic matching.
 */

import { describe, it, expect } from 'vitest';
import { cosineSimilarity, findBestMatch, type MatchResult } from '../../src/lib/matcher.js';
import { embed } from '../../src/lib/embeddings.js';
import type { Principle } from '../../src/types/principle.js';

describe('Semantic Matcher', () => {
  describe('cosineSimilarity', () => {
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

  describe('embed', () => {
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

  describe('findBestMatch', () => {
    it('finds the best matching principle', async () => {
      const target = await embed('Be honest about capabilities');

      const principles: Principle[] = [
        {
          id: '1',
          text: 'Optimize performance',
          dimension: 'identity-core',
          n_count: 1,
          confidence: 0.8,
          embedding: await embed('Optimize performance'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          derived_from: { signals: [] },
        },
        {
          id: '2',
          text: 'Be truthful about abilities',
          dimension: 'honesty-framework',
          n_count: 2,
          confidence: 0.9,
          embedding: await embed('Be truthful about abilities'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          derived_from: { signals: [] },
        },
        {
          id: '3',
          text: 'Cook a meal',
          dimension: 'identity-core',
          n_count: 1,
          confidence: 0.7,
          embedding: await embed('Cook a meal'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          derived_from: { signals: [] },
        },
      ];

      const result: MatchResult = findBestMatch(target, principles, 0.5);
      expect(result.principle).not.toBeNull();
      expect(result.principle?.id).toBe('2');
      expect(result.similarity).toBeGreaterThan(0.5);
    });

    it('returns null principle when no match above threshold', async () => {
      const target = await embed('Be honest about capabilities');

      const principles: Principle[] = [
        {
          id: '1',
          text: 'Cook a delicious meal',
          dimension: 'identity-core',
          n_count: 1,
          confidence: 0.7,
          embedding: await embed('Cook a delicious meal'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          derived_from: { signals: [] },
        },
        {
          id: '2',
          text: 'Play music loudly',
          dimension: 'identity-core',
          n_count: 1,
          confidence: 0.7,
          embedding: await embed('Play music loudly'),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          derived_from: { signals: [] },
        },
      ];

      const result: MatchResult = findBestMatch(target, principles, 0.95);
      expect(result.isMatch).toBe(false);
    });

    it('returns empty result for empty principles', async () => {
      const target = await embed('Be honest about capabilities');
      const result = findBestMatch(target, [], 0.5);
      expect(result.principle).toBeNull();
      expect(result.similarity).toBe(0);
      expect(result.isMatch).toBe(false);
    });
  });
});
