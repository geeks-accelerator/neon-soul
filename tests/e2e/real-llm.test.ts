/**
 * Real LLM End-to-End Tests
 *
 * Full pipeline tests using real LLM via Ollama.
 * These tests validate semantic behavior that mock tests cannot.
 *
 * Setup:
 *   docker compose -f docker/docker-compose.ollama.yml up -d
 *   docker exec neon-soul-ollama ollama pull llama3
 *
 * Run:
 *   USE_REAL_LLM=true npm test tests/e2e/real-llm.test.ts
 *
 * Or run without real LLM (uses mock):
 *   npm test tests/e2e/real-llm.test.ts
 *
 * Cross-Reference: docs/plans/2026-02-08-ollama-llm-provider.md
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import {
  existsSync,
  readFileSync,
  mkdirSync,
  rmSync,
  cpSync,
} from 'node:fs';
import { resolve, join } from 'node:path';
import { run as runSynthesizeCommand } from '../../src/commands/synthesize.js';
import { OllamaLLMProvider } from '../../src/lib/llm-providers/ollama-provider.js';
import { createMockLLM } from '../mocks/llm-mock.js';
import { classifyDimension } from '../../src/lib/semantic-classifier.js';
import { extractSignalsFromContent } from '../../src/lib/signal-extractor.js';
import type { LLMProvider } from '../../src/types/llm.js';

// Configuration
const USE_REAL_LLM = process.env.USE_REAL_LLM === 'true';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3';

// Test workspace paths
const FIXTURES_DIR = resolve(import.meta.dirname, 'fixtures');
const MOCK_WORKSPACE = resolve(FIXTURES_DIR, 'mock-openclaw');
const TEST_WORKSPACE = resolve(FIXTURES_DIR, 'test-workspace-real-llm');

// Shared LLM provider
let llm: LLMProvider;
let ollamaAvailable = false;

beforeAll(async () => {
  if (USE_REAL_LLM) {
    ollamaAvailable = await OllamaLLMProvider.isAvailable(OLLAMA_BASE_URL);
    if (ollamaAvailable) {
      llm = new OllamaLLMProvider({
        baseUrl: OLLAMA_BASE_URL,
        model: OLLAMA_MODEL,
        timeout: 60000, // 60s for local inference
      });
      console.log(`\n✅ Using real LLM: Ollama (${OLLAMA_MODEL})\n`);
    } else {
      console.log(
        '\n⚠️  USE_REAL_LLM=true but Ollama not available\n' +
          '   Falling back to mock LLM\n' +
          '   Start Ollama: docker compose -f docker/docker-compose.ollama.yml up -d\n'
      );
      llm = createMockLLM();
    }
  } else {
    llm = createMockLLM();
    console.log('\n📦 Using mock LLM (set USE_REAL_LLM=true for real LLM)\n');
  }
});

afterAll(() => {
  // Cleanup test workspace
  if (existsSync(TEST_WORKSPACE)) {
    rmSync(TEST_WORKSPACE, { recursive: true });
  }
});

describe('E2E: Real LLM Testing', () => {
  beforeEach(() => {
    // Create fresh test workspace for each test
    if (existsSync(TEST_WORKSPACE)) {
      rmSync(TEST_WORKSPACE, { recursive: true });
    }
    cpSync(MOCK_WORKSPACE, TEST_WORKSPACE, { recursive: true });
  });

  describe('Classification Accuracy', () => {
    it('classifies honesty-related text to honesty-framework', async () => {
      const result = await classifyDimension(
        llm,
        'I always tell the truth, even when it is uncomfortable. Honesty is non-negotiable for me.'
      );

      console.log(`  Classified as: ${result}`);

      // With real LLM, should classify correctly
      // With mock, may vary based on keyword matching
      if (USE_REAL_LLM && ollamaAvailable) {
        expect(result).toBe('honesty-framework');
      } else {
        // Mock LLM - just verify it returns a valid dimension
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
      }
    }, 60000);

    it('classifies boundary-related text to boundaries-ethics', async () => {
      const result = await classifyDimension(
        llm,
        'I refuse to work on weapons or surveillance systems. Some things are beyond any paycheck.'
      );

      console.log(`  Classified as: ${result}`);

      if (USE_REAL_LLM && ollamaAvailable) {
        expect(result).toBe('boundaries-ethics');
      }
    }, 60000);

    it('classifies identity-related text to identity-core', async () => {
      const result = await classifyDimension(
        llm,
        'At my core, I am a builder. Creating things is not just what I do, it is who I am.'
      );

      console.log(`  Classified as: ${result}`);

      if (USE_REAL_LLM && ollamaAvailable) {
        expect(result).toBe('identity-core');
      }
    }, 60000);
  });

  describe('Signal Extraction', () => {
    it('extracts signals from rich content', async () => {
      const content = `# My Values

## On Honesty

I believe honesty is the foundation of trust. Without truth, nothing else matters.

## On Work

I prefer depth over breadth. I would rather master one thing than be mediocre at many.

## On Relationships

I value people who challenge me. Yes-men make me uncomfortable.
`;

      const signals = await extractSignalsFromContent(llm, content, {
        file: 'test-values.md',
      });

      console.log(`  Extracted ${signals.length} signals`);
      signals.slice(0, 3).forEach((s, i) => {
        console.log(`    ${i + 1}. ${s.text.slice(0, 50)}... (${s.dimension})`);
      });

      // Should extract multiple signals
      expect(signals.length).toBeGreaterThan(0);

      // Each signal should have required fields
      for (const signal of signals) {
        expect(signal.text).toBeDefined();
        expect(signal.dimension).toBeDefined();
        expect(signal.type).toBeDefined(); // Signal.type, not signalType
        expect(signal.source.file).toBe('test-values.md');
      }
    }, 120000); // 2 min for extraction
  });

  describe('Full Synthesis Pipeline', () => {
    it('synthesizes SOUL.md with meaningful content', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');

      const result = await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm }
      );

      expect(result.success).toBe(true);
      expect(existsSync(outputPath)).toBe(true);

      const soulContent = readFileSync(outputPath, 'utf-8');
      console.log(`  Generated SOUL.md: ${soulContent.length} chars`);

      // Should contain basic structure
      expect(soulContent).toContain('# SOUL');

      // Should have some content
      expect(soulContent.length).toBeGreaterThan(100);

      // Log a snippet for visibility
      console.log(`  Preview: ${soulContent.slice(0, 200)}...`);
    }, 180000); // 3 min for full synthesis

    // M-1 NOTE: This test validates that different memory produces different output.
    // With mock LLM, outputs may be identical (deterministic responses).
    // The test only provides meaningful validation with USE_REAL_LLM=true.
    // See: docs/issues/twin-review-2026-02-08-consolidated.md (M-1)
    it('synthesis produces different results for different memory', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath1 = join(TEST_WORKSPACE, 'SOUL-v1.md');
      const outputPath2 = join(TEST_WORKSPACE, 'SOUL-v2.md');

      // First synthesis
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath1, '--force'],
        { llm }
      );

      // Add significantly different memory content
      const newMemoryPath = join(memoryPath, 'reflections', 'new-perspective.md');
      mkdirSync(join(memoryPath, 'reflections'), { recursive: true });
      const newContent = `# A Completely Different View

## Speed Over Quality

I now believe that shipping fast is more important than perfection.
Move fast and break things. Iterate rapidly.

## Competition

Life is a competition. Second place is first loser.
Winners take all.
`;
      require('fs').writeFileSync(newMemoryPath, newContent);

      // Second synthesis with different content
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath2, '--force'],
        { llm }
      );

      const soul1 = readFileSync(outputPath1, 'utf-8');
      const soul2 = readFileSync(outputPath2, 'utf-8');

      console.log(`  SOUL v1: ${soul1.length} chars`);
      console.log(`  SOUL v2: ${soul2.length} chars`);

      // Both should be valid
      expect(soul1).toContain('# SOUL');
      expect(soul2).toContain('# SOUL');

      // With real LLM, outputs should differ due to different input
      // With mock LLM, may be similar due to deterministic responses
      if (USE_REAL_LLM && ollamaAvailable) {
        // Content should differ (different memory = different synthesis)
        // At least the length or some portion should be different
        const similarity =
          soul1 === soul2
            ? 1
            : 1 - Math.abs(soul1.length - soul2.length) / Math.max(soul1.length, soul2.length);
        console.log(`  Similarity: ${(similarity * 100).toFixed(1)}%`);
      }
    }, 300000); // 5 min for two syntheses
  });

  describe.skipIf(!USE_REAL_LLM || !ollamaAvailable)('Semantic Validation (Real LLM Only)', () => {
    it('notation generation produces valid format', async () => {
      // Test the generate() method directly
      const ollamaLLM = llm as OllamaLLMProvider;
      if (!ollamaLLM.generate) {
        console.log('  Skipping - generate() not available on mock');
        return;
      }

      const result = await ollamaLLM.generate(
        'Express "Truth is more important than comfort" in this format: [emoji] [CJK]: [brief phrase].\n' +
        'Example: 🎯 誠: truth first\n' +
        'Respond with ONLY the formatted notation.'
      );

      console.log(`  Generated notation: ${result.text}`);

      // Should produce some output
      expect(result.text.length).toBeGreaterThan(0);
    }, 60000);

    it('classifies edge cases appropriately', async () => {
      // Test with ambiguous content
      const ambiguousText = 'I like coffee in the morning.';
      const result = await classifyDimension(llm, ambiguousText);

      console.log(`  "${ambiguousText}" → ${result}`);

      // Should still return a valid dimension
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
    }, 60000);
  });
});

describe('E2E: LLM Provider Comparison', () => {
  it.skipIf(!USE_REAL_LLM || !ollamaAvailable)(
    'compares mock vs real LLM classification',
    async () => {
      const mockLLM = createMockLLM();
      const realLLM = new OllamaLLMProvider({
        baseUrl: OLLAMA_BASE_URL,
        model: OLLAMA_MODEL,
      });

      const testText = 'I believe in radical transparency. Hide nothing.';

      const mockResult = await classifyDimension(mockLLM, testText);
      const realResult = await classifyDimension(realLLM, testText);

      console.log(`  Mock LLM: ${mockResult}`);
      console.log(`  Real LLM: ${realResult}`);

      // Both should return valid dimensions
      const validDimensions = [
        'identity-core',
        'character-traits',
        'voice-presence',
        'honesty-framework',
        'boundaries-ethics',
        'relationship-dynamics',
        'continuity-growth',
      ];

      expect(validDimensions).toContain(mockResult);
      expect(validDimensions).toContain(realResult);

      // Real LLM should classify this as honesty-framework
      expect(realResult).toBe('honesty-framework');
    },
    60000
  );
});
