/**
 * Unit Tests: Semantic Classifier
 *
 * Tests for LLM-based semantic classification functions.
 * Verifies LLMRequiredError is thrown when LLM not provided.
 */

import { describe, it, expect } from 'vitest';
import {
  classifyDimension,
  classifySignalType,
  classifySectionType,
  classifyCategory,
} from '../../src/lib/semantic-classifier.js';
import { LLMRequiredError } from '../../src/types/llm.js';
import {
  createMockLLM,
  createSemanticEquivalenceMockLLM,
} from '../mocks/llm-mock.js';

describe('Semantic Classifier', () => {
  describe('classifyDimension', () => {
    it('throws LLMRequiredError when LLM is null', async () => {
      await expect(classifyDimension(null, 'test text')).rejects.toThrow(
        LLMRequiredError
      );
    });

    it('throws LLMRequiredError when LLM is undefined', async () => {
      await expect(classifyDimension(undefined, 'test text')).rejects.toThrow(
        LLMRequiredError
      );
    });

    it('classifies text into a valid SoulCraft dimension', async () => {
      const llm = createMockLLM();
      const result = await classifyDimension(llm, 'I am always honest');

      const validDimensions = [
        'identity-core',
        'character-traits',
        'voice-presence',
        'honesty-framework',
        'boundaries-ethics',
        'relationship-dynamics',
        'continuity-growth',
      ];

      expect(validDimensions).toContain(result);
    });

    it('records classification call', async () => {
      const llm = createMockLLM();
      await classifyDimension(llm, 'Test signal');

      expect(llm.getCallCount()).toBe(1);
      const calls = llm.getCalls();
      expect(calls[0]?.prompt).toContain('Test signal');
    });
  });

  describe('classifySignalType', () => {
    it('throws LLMRequiredError when LLM is null', async () => {
      await expect(classifySignalType(null, 'test text')).rejects.toThrow(
        LLMRequiredError
      );
    });

    it('classifies text into a valid signal type', async () => {
      const llm = createMockLLM();
      const result = await classifySignalType(llm, 'I prefer concise responses');

      const validTypes = [
        'value',
        'belief',
        'preference',
        'goal',
        'constraint',
        'relationship',
        'pattern',
        'correction',
        'boundary',
        'reinforcement',
      ];

      expect(validTypes).toContain(result);
    });
  });

  describe('classifySectionType', () => {
    it('throws LLMRequiredError when LLM is null', async () => {
      await expect(
        classifySectionType(null, 'Core Values')
      ).rejects.toThrow(LLMRequiredError);
    });

    it('classifies section title into valid section type', async () => {
      const llm = createMockLLM();
      const result = await classifySectionType(llm, 'My Boundaries');

      const validTypes = [
        'core-truths',
        'boundaries',
        'vibe-tone',
        'examples',
        'preferences',
        'other',
      ];

      expect(validTypes).toContain(result);
    });

    it('accepts optional content parameter', async () => {
      const llm = createMockLLM();
      const result = await classifySectionType(
        llm,
        'Values',
        'I believe in honesty above all else.'
      );

      expect(result).toBeDefined();
    });
  });

  describe('classifyCategory', () => {
    it('throws LLMRequiredError when LLM is null', async () => {
      await expect(classifyCategory(null, 'My diary entry')).rejects.toThrow(
        LLMRequiredError
      );
    });

    it('classifies content into a valid memory category', async () => {
      const llm = createMockLLM();
      const result = await classifyCategory(llm, 'Today I learned about trees');

      const validCategories = [
        'diary',
        'experiences',
        'goals',
        'knowledge',
        'relationships',
        'preferences',
        'unknown',
      ];

      expect(validCategories).toContain(result);
    });
  });
});

describe('Semantic Equivalence', () => {
  describe('dimension classification', () => {
    it('"be concise" and "prefer brevity" classify to same dimension', async () => {
      const llm = createSemanticEquivalenceMockLLM();

      const result1 = await classifyDimension(llm, 'be concise');
      const result2 = await classifyDimension(llm, 'prefer brevity');

      expect(result1).toBe(result2);
      expect(result1).toBe('voice-presence');
    });

    it('"honest" and "truthful" classify to same dimension', async () => {
      const llm = createSemanticEquivalenceMockLLM();

      const result1 = await classifyDimension(llm, 'I am honest');
      const result2 = await classifyDimension(llm, 'I am truthful');

      expect(result1).toBe(result2);
      expect(result1).toBe('honesty-framework');
    });

    it('"help others" and "assist people" classify to same dimension', async () => {
      const llm = createSemanticEquivalenceMockLLM();

      const result1 = await classifyDimension(llm, 'I help others');
      const result2 = await classifyDimension(llm, 'I assist people');

      expect(result1).toBe(result2);
    });
  });
});

describe('Error Handling', () => {
  it('LLMRequiredError includes operation name', async () => {
    try {
      await classifyDimension(null, 'test');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LLMRequiredError);
      expect((error as LLMRequiredError).operation).toBe('classifyDimension');
      expect((error as LLMRequiredError).message).toContain('classifyDimension');
    }
  });
});
