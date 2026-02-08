/**
 * Unit Tests: LLM Types
 *
 * Tests for LLM provider interface and error types.
 */

import { describe, it, expect } from 'vitest';
import { LLMRequiredError } from '../../src/types/llm.js';
import type { LLMProvider, ClassificationResult, ClassifyOptions } from '../../src/types/llm.js';
import { createMockLLM, createFailingMockLLM } from '../mocks/llm-mock.js';

describe('LLMRequiredError', () => {
  it('extends Error', () => {
    const error = new LLMRequiredError('testOperation');
    expect(error).toBeInstanceOf(Error);
  });

  it('has name property set to LLMRequiredError', () => {
    const error = new LLMRequiredError('testOperation');
    expect(error.name).toBe('LLMRequiredError');
  });

  it('includes operation in message', () => {
    const error = new LLMRequiredError('classifyDimension');
    expect(error.message).toContain('classifyDimension');
    expect(error.message).toContain('required');
  });

  it('stores operation name', () => {
    const error = new LLMRequiredError('myOperation');
    expect(error.operation).toBe('myOperation');
  });

  it('indicates no fallback available', () => {
    const error = new LLMRequiredError('test');
    expect(error.message.toLowerCase()).toContain('no fallback');
  });
});

describe('LLMProvider Interface', () => {
  it('classify method returns ClassificationResult', async () => {
    const llm = createMockLLM();

    const result = await llm.classify('Test prompt', {
      categories: ['a', 'b', 'c'] as const,
    });

    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('confidence');
    expect(['a', 'b', 'c']).toContain(result.category);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('classify accepts context in options', async () => {
    const llm = createMockLLM();

    const result = await llm.classify('Test prompt', {
      categories: ['yes', 'no'] as const,
      context: 'Identity signal detection',
    });

    expect(result.category).toBeDefined();
  });

  it('classify can return reasoning', async () => {
    const llm = createMockLLM();

    const result = await llm.classify('Test prompt', {
      categories: ['category1'] as const,
    });

    // Mock LLM includes reasoning
    expect(result.reasoning).toBeDefined();
  });
});

describe('Mock LLM Provider', () => {
  describe('createMockLLM', () => {
    it('returns first category by default', async () => {
      const llm = createMockLLM();

      const result = await llm.classify('Unknown prompt', {
        categories: ['first', 'second', 'third'] as const,
      });

      expect(result.category).toBe('first');
    });

    it('uses custom response map', async () => {
      const responses = new Map([
        ['specific', { category: 'matched', confidence: 0.99 }],
      ]);
      const llm = createMockLLM({ responses });

      const result = await llm.classify('This is a specific prompt', {
        categories: ['matched', 'unmatched'] as const,
      });

      expect(result.category).toBe('matched');
      expect(result.confidence).toBe(0.99);
    });

    it('records calls when enabled', async () => {
      const llm = createMockLLM({ recordCalls: true });

      await llm.classify('First call', { categories: ['a'] as const });
      await llm.classify('Second call', { categories: ['b'] as const });

      expect(llm.getCallCount()).toBe(2);
      expect(llm.getCalls()).toHaveLength(2);
    });

    it('can clear recorded calls', async () => {
      const llm = createMockLLM();

      await llm.classify('Test', { categories: ['a'] as const });
      expect(llm.getCallCount()).toBe(1);

      llm.clearCalls();
      expect(llm.getCallCount()).toBe(0);
    });

    it('can set response dynamically', async () => {
      const llm = createMockLLM();

      llm.setResponse('dynamic', { category: 'dynamicCategory', confidence: 0.8 });

      const result = await llm.classify('This is dynamic', {
        categories: ['dynamicCategory', 'other'] as const,
      });

      expect(result.category).toBe('dynamicCategory');
    });

    it('can reset to initial state', async () => {
      const llm = createMockLLM();

      llm.setResponse('custom', { category: 'x', confidence: 1 });
      await llm.classify('Test', { categories: ['a'] as const });

      llm.reset();

      expect(llm.getCallCount()).toBe(0);
    });
  });

  describe('createFailingMockLLM', () => {
    it('throws error on classify', async () => {
      const llm = createFailingMockLLM('Test error');

      await expect(
        llm.classify('Any prompt', { categories: ['a'] as const })
      ).rejects.toThrow('Test error');
    });

    it('uses default error message', async () => {
      const llm = createFailingMockLLM();

      await expect(
        llm.classify('Any prompt', { categories: ['a'] as const })
      ).rejects.toThrow('Mock LLM error');
    });
  });
});

describe('ClassificationResult Type', () => {
  it('supports generic category type', async () => {
    const llm = createMockLLM();

    // String categories
    const stringResult = await llm.classify<string>('Test', {
      categories: ['a', 'b'],
    });
    expect(typeof stringResult.category).toBe('string');

    // Literal type categories
    type Dimension = 'identity-core' | 'honesty-framework';
    const dimensionResult = await llm.classify<Dimension>('Test', {
      categories: ['identity-core', 'honesty-framework'] as Dimension[],
    });
    expect(['identity-core', 'honesty-framework']).toContain(dimensionResult.category);
  });
});
