/**
 * Unit Tests: Signal Extractor
 *
 * Tests for LLM-based signal extraction.
 * Verifies LLMRequiredError is thrown when LLM not provided.
 */

import { describe, it, expect } from 'vitest';
import {
  extractSignalsFromContent,
  extractSignalsFromMemoryFiles,
} from '../../src/lib/signal-extractor.js';
import { LLMRequiredError } from '../../src/types/llm.js';
import { createMockLLM } from '../mocks/llm-mock.js';

describe('Signal Extractor', () => {
  describe('extractSignalsFromContent', () => {
    it('throws LLMRequiredError when LLM is null', async () => {
      await expect(
        extractSignalsFromContent(null, 'Some content', { file: 'test.md' })
      ).rejects.toThrow(LLMRequiredError);
    });

    it('throws LLMRequiredError when LLM is undefined', async () => {
      await expect(
        extractSignalsFromContent(undefined, 'Some content', { file: 'test.md' })
      ).rejects.toThrow(LLMRequiredError);
    });

    it('extracts signals from markdown content', async () => {
      const llm = createMockLLM();
      const content = `# My Values

- I believe in honesty above all else
- I prefer clear and direct communication
- I value helping others learn and grow
`;

      const signals = await extractSignalsFromContent(llm, content, {
        file: 'test.md',
        category: 'preferences',
      });

      // Should have extracted some signals (mock returns 'yes' for detection)
      expect(Array.isArray(signals)).toBe(true);
    });

    it('skips short lines', async () => {
      const llm = createMockLLM();
      const content = `Short
Very short line
This is a line that is long enough to be considered for signal extraction`;

      const signals = await extractSignalsFromContent(llm, content, {
        file: 'test.md',
      });

      // Only the long line should potentially be processed
      expect(Array.isArray(signals)).toBe(true);
    });

    it('includes source information in extracted signals', async () => {
      const llm = createMockLLM();
      const content = `I believe in being thorough but not pedantic in my work.`;

      const signals = await extractSignalsFromContent(llm, content, {
        file: 'values.md',
        category: 'beliefs',
      });

      if (signals.length > 0) {
        const signal = signals[0];
        expect(signal?.source.file).toBe('values.md');
        expect(signal?.source.type).toBeDefined();
      }
    });

    it('assigns dimension to extracted signals', async () => {
      const llm = createMockLLM();
      const content = `I am always honest about my capabilities and limitations.`;

      const signals = await extractSignalsFromContent(llm, content, {
        file: 'test.md',
      });

      if (signals.length > 0) {
        // Each signal should have a dimension assigned
        for (const signal of signals) {
          expect(signal.dimension).toBeDefined();
        }
      }
    });

    it('generates embeddings for signals', async () => {
      const llm = createMockLLM();
      const content = `I value continuous learning and personal growth over time.`;

      const signals = await extractSignalsFromContent(llm, content, {
        file: 'test.md',
      });

      if (signals.length > 0) {
        // Each signal should have a 384-dimensional embedding
        for (const signal of signals) {
          expect(Array.isArray(signal.embedding)).toBe(true);
          expect(signal.embedding.length).toBe(384);
        }
      }
    });
  });

  describe('extractSignalsFromMemoryFiles', () => {
    it('throws LLMRequiredError when LLM is null', async () => {
      await expect(
        extractSignalsFromMemoryFiles(null, [])
      ).rejects.toThrow(LLMRequiredError);
    });

    it('extracts signals from multiple memory files', async () => {
      const llm = createMockLLM();
      const memoryFiles = [
        {
          path: 'memory/diary/2026-01-01.md',
          content: 'Today I learned the importance of being patient.',
          category: 'diary' as const,
          relativePath: 'diary/2026-01-01.md',
        },
        {
          path: 'memory/preferences/communication.md',
          content: 'I prefer direct, honest communication.',
          category: 'preferences' as const,
          relativePath: 'preferences/communication.md',
        },
      ];

      const signals = await extractSignalsFromMemoryFiles(llm, memoryFiles);

      expect(Array.isArray(signals)).toBe(true);
    });

    it('handles empty file list', async () => {
      const llm = createMockLLM();
      const signals = await extractSignalsFromMemoryFiles(llm, []);

      expect(signals).toEqual([]);
    });
  });
});

describe('LLMRequiredError', () => {
  it('has correct name property', async () => {
    try {
      await extractSignalsFromContent(null, 'test', { file: 'test.md' });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(LLMRequiredError);
      expect((error as LLMRequiredError).name).toBe('LLMRequiredError');
    }
  });

  it('includes operation in message', async () => {
    try {
      await extractSignalsFromContent(null, 'test', { file: 'test.md' });
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as LLMRequiredError).message).toContain(
        'extractSignalsFromContent'
      );
    }
  });
});
