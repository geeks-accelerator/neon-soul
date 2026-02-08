/**
 * Unit Tests: Pipeline
 *
 * Tests for pipeline LLM provider requirement.
 * Integration tests are in tests/integration/pipeline.test.ts
 */

import { describe, it, expect } from 'vitest';
import { runPipeline, type PipelineOptions } from '../../src/lib/pipeline.js';
import { LLMRequiredError } from '../../src/types/llm.js';
import { createMockLLM } from '../mocks/llm-mock.js';

describe('Pipeline', () => {
  describe('runPipeline', () => {
    it('throws LLMRequiredError when LLM not provided', async () => {
      const options = {
        memoryPath: '/fake/path/memory',
        outputPath: '/fake/path/SOUL.md',
      } as PipelineOptions;

      await expect(runPipeline(options)).rejects.toThrow(LLMRequiredError);
    });

    it('throws LLMRequiredError with correct operation name', async () => {
      const options = {
        memoryPath: '/fake/path/memory',
        outputPath: '/fake/path/SOUL.md',
      } as PipelineOptions;

      try {
        await runPipeline(options);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMRequiredError);
        expect((error as LLMRequiredError).operation).toBe('runPipeline');
      }
    });

    it('accepts LLM provider in options', async () => {
      const llm = createMockLLM();
      const options: PipelineOptions = {
        memoryPath: '/fake/nonexistent/memory',
        outputPath: '/fake/nonexistent/SOUL.md',
        llm,
        dryRun: true,
        force: true,
      };

      // This will fail because paths don't exist, but should not throw LLMRequiredError
      try {
        await runPipeline(options);
      } catch (error) {
        // Should not be LLMRequiredError
        expect(error).not.toBeInstanceOf(LLMRequiredError);
      }
    });
  });
});

describe('Pipeline Options', () => {
  it('llm is required in PipelineOptions type', () => {
    // Type check - this verifies the interface includes llm
    const options: PipelineOptions = {
      memoryPath: '/path',
      outputPath: '/path/SOUL.md',
      llm: createMockLLM(),
    };

    expect(options.llm).toBeDefined();
  });
});
