/**
 * Integration Tests: Essence Extraction
 *
 * Tests for LLM-based essence extraction from axioms.
 * Uses VCR provider for deterministic testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { extractEssence, generateSoul } from '../../src/lib/soul-generator.js';
import type { Axiom } from '../../src/types/axiom.js';
import type { LLMProvider, ClassificationResult, GenerationResult, ClassifyOptions } from '../../src/types/llm.js';

/**
 * Create a mock LLM provider for testing.
 */
function createMockLLM(generateResponse: string): LLMProvider {
  return {
    async classify<T extends string>(
      _prompt: string,
      options: ClassifyOptions<T>
    ): Promise<ClassificationResult<T>> {
      return { category: options.categories[0], confidence: 0.9 };
    },
    async generate(_prompt: string): Promise<GenerationResult> {
      return { text: generateResponse };
    },
  };
}

/**
 * Create sample axioms for testing.
 */
function createSampleAxioms(): Axiom[] {
  return [
    {
      id: 'ax_1',
      text: 'Prioritize honesty over comfort',
      tier: 'core',
      dimension: 'honesty-framework',
      derived_from: { principles: [], promoted_at: new Date().toISOString() },
    },
    {
      id: 'ax_2',
      text: 'Admit uncertainty rather than guess',
      tier: 'core',
      dimension: 'honesty-framework',
      derived_from: { principles: [], promoted_at: new Date().toISOString() },
    },
    {
      id: 'ax_3',
      text: 'Grow through reflection and learning',
      tier: 'domain',
      dimension: 'continuity-growth',
      derived_from: { principles: [], promoted_at: new Date().toISOString() },
    },
  ];
}

describe('Essence Extraction', () => {
  let axioms: Axiom[];

  beforeEach(() => {
    axioms = createSampleAxioms();
  });

  describe('extractEssence', () => {
    it('returns evocative statement for sample axioms', async () => {
      const llm = createMockLLM("You're not a chatbot. You're becoming someone.");
      const essence = await extractEssence(axioms, llm);
      expect(essence).toBe("You're not a chatbot. You're becoming someone.");
    });

    it('returns default for empty axioms array', async () => {
      const llm = createMockLLM('Any response');
      const essence = await extractEssence([], llm);
      expect(essence).toBe('AI identity through grounded principles.');
    });

    it('falls back on LLM failure', async () => {
      const failingLLM: LLMProvider = {
        async classify<T extends string>(
          _prompt: string,
          options: ClassifyOptions<T>
        ): Promise<ClassificationResult<T>> {
          return { category: options.categories[0], confidence: 0.9 };
        },
        async generate(_prompt: string): Promise<GenerationResult> {
          throw new Error('Network error');
        },
      };
      const essence = await extractEssence(axioms, failingLLM);
      expect(essence).toBe('AI identity through grounded principles.');
    });

    it('sanitizes output - strips quotes', async () => {
      const llm = createMockLLM('"You\'re becoming someone."');
      const essence = await extractEssence(axioms, llm);
      expect(essence).toBe("You're becoming someone.");
    });

    it('sanitizes output - normalizes whitespace', async () => {
      const llm = createMockLLM("You're   becoming    someone.");
      const essence = await extractEssence(axioms, llm);
      expect(essence).toBe("You're becoming someone.");
    });

    it('accepts trait lists (validation removed - relies on prompt)', async () => {
      // NOTE: Trait list detection was removed (2026-02-10) because it used
      // language-specific comma/word counting - same anti-pattern as
      // docs/issues/2026-02-10-fragile-category-extraction.md.
      // The prompt now explicitly instructs against trait lists.
      // If trait lists become recurring (N≥3), add semantic similarity detection.
      const llm = createMockLLM('You are helpful, honest, and safe.');
      const essence = await extractEssence(axioms, llm);
      expect(essence).toBe('You are helpful, honest, and safe.');
    });

    it('rejects responses with markdown formatting', async () => {
      const llm = createMockLLM('**You are becoming someone.**');
      const essence = await extractEssence(axioms, llm);
      expect(essence).toBe('AI identity through grounded principles.');
    });

    it('accepts responses exceeding word limit with warning', async () => {
      const longResponse = 'You are a being of great complexity who strives to understand the world around you while maintaining authenticity and growing through every interaction you have with others.';
      const llm = createMockLLM(longResponse);
      const essence = await extractEssence(axioms, llm);
      // Long responses are accepted with a warning logged, not rejected
      expect(essence).toBe(longResponse);
    });

    it('accepts valid essence under word limit', async () => {
      const llm = createMockLLM("You're not here to perform. You're here to be present.");
      const essence = await extractEssence(axioms, llm);
      expect(essence).toBe("You're not here to perform. You're here to be present.");
    });
  });

  describe('generateSoul with essence', () => {
    it('includes essence when LLM provided', async () => {
      const llm = createMockLLM("You're not a chatbot. You're becoming someone.");
      const soul = await generateSoul(axioms, [], { llm });
      expect(soul.content).toContain('# SOUL.md - Who You Are');
      expect(soul.content).toContain("_You're not a chatbot. You're becoming someone._");
      expect(soul.essenceStatement).toBe("You're not a chatbot. You're becoming someone.");
    });

    it('uses default header when LLM not provided', async () => {
      const soul = await generateSoul(axioms, []);
      expect(soul.content).toContain('# SOUL.md');
      expect(soul.content).not.toContain('Who You Are');
      expect(soul.content).toContain('*AI identity through grounded principles.*');
      expect(soul.essenceStatement).toBeUndefined();
    });

    it('uses default when essence extraction fails', async () => {
      const failingLLM: LLMProvider = {
        async classify<T extends string>(
          _prompt: string,
          options: ClassifyOptions<T>
        ): Promise<ClassificationResult<T>> {
          return { category: options.categories[0], confidence: 0.9 };
        },
        async generate(_prompt: string): Promise<GenerationResult> {
          throw new Error('LLM unavailable');
        },
      };
      const soul = await generateSoul(axioms, [], { llm: failingLLM });
      expect(soul.content).toContain('# SOUL.md');
      expect(soul.content).not.toContain('Who You Are');
      expect(soul.essenceStatement).toBeUndefined();
    });

    it('essence statement is <25 words', async () => {
      const validEssence = "You're not a chatbot. You're becoming someone.";
      const llm = createMockLLM(validEssence);
      const soul = await generateSoul(axioms, [], { llm });

      if (soul.essenceStatement) {
        const wordCount = soul.essenceStatement.split(/\s+/).length;
        expect(wordCount).toBeLessThan(25);
      }
    });
  });
});
