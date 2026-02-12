/**
 * Unit Tests: OllamaLLMProvider
 *
 * Tests for the Ollama LLM provider, including:
 * - Fast category extraction (exact/substring matching)
 *
 * v0.2.0: Semantic fallback removed. Classification now uses only
 * fast string matching (exact/substring). If no match found, returns null.
 *
 * @see docs/ARCHITECTURE.md (Classification Design Principles)
 * @see docs/issues/2026-02-10-fragile-category-extraction.md (rationale)
 * @see docs/plans/2026-02-12-llm-based-similarity.md (v0.2.0 changes)
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
