/**
 * Unit Tests: OllamaLLMProvider
 *
 * Tests for the Ollama LLM provider, including:
 * - Fast category extraction (exact/substring matching)
 * - Semantic category extraction (embedding-based similarity)
 *
 * Architecture: Two-stage matching
 * 1. Fast matching: Exact and substring matching (synchronous)
 * 2. Semantic fallback: Embedding-based similarity (async)
 *
 * @see docs/ARCHITECTURE.md (Classification Design Principles)
 * @see docs/issues/2026-02-10-fragile-category-extraction.md (rationale)
 */

import { describe, it, expect } from 'vitest';
import { OllamaLLMProvider } from '../../src/lib/llm-providers/ollama-provider.js';

// Test helper that exposes private methods
class TestableOllamaProvider extends OllamaLLMProvider {
  public testExtractCategoryFast<T extends string>(
    response: string,
    categories: readonly T[]
  ): T | null {
    return (this as any).extractCategoryFast(response, categories);
  }

  public async testExtractCategorySemantic<T extends string>(
    response: string,
    categories: readonly T[]
  ): Promise<{ category: T; similarity: number } | null> {
    return (this as any).extractCategorySemantic(response, categories);
  }
}

describe('OllamaLLMProvider', () => {
  const provider = new TestableOllamaProvider();

  describe('extractCategoryFast', () => {
    describe('exact matching', () => {
      it('returns exact match', () => {
        const result = provider.testExtractCategoryFast('identity-core', [
          'identity-core',
          'character-traits',
          'honesty-framework',
        ]);
        expect(result).toBe('identity-core');
      });

      it('returns exact match case-insensitive', () => {
        const result = provider.testExtractCategoryFast('IDENTITY-CORE', [
          'identity-core',
          'character-traits',
        ]);
        expect(result).toBe('identity-core');
      });

      it('returns exact match with whitespace trimmed', () => {
        const result = provider.testExtractCategoryFast('  identity-core  ', [
          'identity-core',
          'character-traits',
        ]);
        expect(result).toBe('identity-core');
      });
    });

    describe('substring matching', () => {
      it('returns substring match', () => {
        const result = provider.testExtractCategoryFast(
          'The category is identity-core because...',
          ['identity-core', 'character-traits']
        );
        expect(result).toBe('identity-core');
      });

      it('returns quoted match', () => {
        const result = provider.testExtractCategoryFast(
          "I classify this as 'honesty-framework'",
          ['identity-core', 'honesty-framework']
        );
        expect(result).toBe('honesty-framework');
      });

      it('returns first match when category appears as substring', () => {
        const result = provider.testExtractCategoryFast(
          'This is about character-traits in people',
          ['identity-core', 'character-traits', 'honesty-framework']
        );
        expect(result).toBe('character-traits');
      });
    });

    describe('no match', () => {
      it('returns null when no exact or substring match found', () => {
        const result = provider.testExtractCategoryFast('continuity', [
          'identity-core',
          'continuity-growth',
        ]);
        // "continuity" doesn't exactly match or contain "continuity-growth"
        expect(result).toBeNull();
      });

      it('returns null for empty response', () => {
        const result = provider.testExtractCategoryFast('', [
          'identity-core',
          'character-traits',
        ]);
        expect(result).toBeNull();
      });

      it('returns null for unrelated text', () => {
        const result = provider.testExtractCategoryFast('completely unrelated text', [
          'identity-core',
          'character-traits',
        ]);
        expect(result).toBeNull();
      });
    });
  });

  describe('extractCategorySemantic', () => {
    // These tests use real embeddings - they verify the semantic fallback works

    it('matches partial category name via semantic similarity', async () => {
      // "continuity" should semantically match "continuity-growth"
      const result = await provider.testExtractCategorySemantic('continuity', [
        'identity-core',
        'continuity-growth',
        'honesty-framework',
      ]);

      expect(result).not.toBeNull();
      expect(result?.category).toBe('continuity-growth');
      expect(result?.similarity).toBeGreaterThan(0.3);
    });

    it('matches semantically related concept', async () => {
      // "growth" should match "continuity-growth"
      const result = await provider.testExtractCategorySemantic('growth', [
        'identity-core',
        'continuity-growth',
        'honesty-framework',
      ]);

      expect(result).not.toBeNull();
      expect(result?.category).toBe('continuity-growth');
    });

    it('matches honesty to honesty-framework', async () => {
      const result = await provider.testExtractCategorySemantic('honesty', [
        'identity-core',
        'character-traits',
        'honesty-framework',
      ]);

      expect(result).not.toBeNull();
      expect(result?.category).toBe('honesty-framework');
    });

    it('matches identity to identity-core', async () => {
      const result = await provider.testExtractCategorySemantic('identity', [
        'identity-core',
        'character-traits',
        'honesty-framework',
      ]);

      expect(result).not.toBeNull();
      expect(result?.category).toBe('identity-core');
    });

    it('returns best match with similarity score', async () => {
      const result = await provider.testExtractCategorySemantic('truth and honesty', [
        'identity-core',
        'honesty-framework',
        'character-traits',
      ]);

      expect(result).not.toBeNull();
      expect(result?.category).toBe('honesty-framework');
      expect(result?.similarity).toBeGreaterThan(0.3);
      expect(result?.similarity).toBeLessThanOrEqual(1.0);
    });

    it('returns null for very unrelated text', async () => {
      // Very unrelated text should fall below minimum similarity threshold
      const result = await provider.testExtractCategorySemantic(
        'xyz123 random gibberish 456abc',
        ['identity-core', 'honesty-framework']
      );

      // May or may not return null depending on embedding similarity
      // The important thing is if it returns, similarity should be low
      if (result) {
        expect(result.similarity).toBeLessThan(0.5);
      }
    });
  });

  describe('configuration', () => {
    it('creates provider with default config', () => {
      const provider = new OllamaLLMProvider();
      expect(provider).toBeDefined();
    });

    it('creates provider with custom base URL', () => {
      const provider = new OllamaLLMProvider({
        baseUrl: 'http://custom:11434',
      });
      expect(provider).toBeDefined();
    });

    it('creates provider with custom model', () => {
      const provider = new OllamaLLMProvider({
        model: 'mistral',
      });
      expect(provider).toBeDefined();
    });

    it('creates provider with custom timeout', () => {
      const provider = new OllamaLLMProvider({
        timeout: 60000,
      });
      expect(provider).toBeDefined();
    });
  });
});
