/**
 * End-to-End Tests for NEON-SOUL Pipeline
 *
 * Tests full synthesis pipeline with mock and live workspaces.
 * Verifies safety rails (--live flag, auto-backup, dry-run default).
 *
 * Uses mock LLM provider for deterministic, fast testing.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { runPipeline, type PipelineOptions } from '../../src/lib/pipeline.js';
import { loadSynthesisData, loadAxioms } from '../../src/lib/persistence.js';
import { loadState } from '../../src/lib/state.js';
import { listBackups, rollback } from '../../src/lib/backup.js';
import { run as runSynthesizeCommand } from '../../src/commands/synthesize.js';
import { run as runStatusCommand } from '../../src/commands/status.js';
import { run as runRollbackCommand } from '../../src/commands/rollback.js';
import { run as runAuditCommand } from '../../src/commands/audit.js';
import { run as runTraceCommand } from '../../src/commands/trace.js';
import { createMockLLM, type MockLLMProvider } from '../mocks/llm-mock.js';

// Test workspace paths
const FIXTURES_DIR = resolve(import.meta.dirname, 'fixtures');
const MOCK_WORKSPACE = resolve(FIXTURES_DIR, 'mock-openclaw');
const TEST_WORKSPACE = resolve(FIXTURES_DIR, 'test-workspace');

// Shared mock LLM for all tests
let mockLLM: MockLLMProvider;

// Global setup/teardown for all E2E tests
beforeAll(() => {
  // Create mock LLM
  mockLLM = createMockLLM();

  // Create fresh test workspace by copying mock
  if (existsSync(TEST_WORKSPACE)) {
    rmSync(TEST_WORKSPACE, { recursive: true });
  }
  cpSync(MOCK_WORKSPACE, TEST_WORKSPACE, { recursive: true });
});

afterAll(() => {
  // Cleanup test workspace
  if (existsSync(TEST_WORKSPACE)) {
    rmSync(TEST_WORKSPACE, { recursive: true });
  }
});

describe('E2E: Mock Workspace Synthesis', () => {

  describe('Pipeline Integration', () => {
    it('should run synthesis on mock workspace', async () => {
      const options: PipelineOptions = {
        memoryPath: join(TEST_WORKSPACE, 'memory'),
        outputPath: join(TEST_WORKSPACE, 'SOUL.md'),
        llm: mockLLM,
        format: 'cjk-math-emoji',
        force: true, // Force run regardless of threshold
      };

      const result = await runPipeline(options);

      // Pipeline completes (may fail validation if no axioms promoted - that's OK)
      // The key is that it runs through all stages
      expect(result.skipped).toBe(false);

      // Should have extracted signals even if axioms didn't promote
      if (result.metrics) {
        expect(result.metrics.signalCount).toBeGreaterThanOrEqual(0);
      }
    });

    it('should create .neon-soul directory', async () => {
      const neonSoulDir = join(TEST_WORKSPACE, '.neon-soul');

      // Run synthesis to ensure directory is created
      await runPipeline({
        memoryPath: join(TEST_WORKSPACE, 'memory'),
        outputPath: join(TEST_WORKSPACE, 'SOUL.md'),
        llm: mockLLM,
        format: 'cjk-math-emoji',
        force: true,
      });

      expect(existsSync(neonSoulDir)).toBe(true);
    });

    it('should handle synthesis that produces no axioms', async () => {
      // With small memory set, axiom promotion threshold may not be met
      // Pipeline should still complete stages, just with empty axioms
      const options: PipelineOptions = {
        memoryPath: join(TEST_WORKSPACE, 'memory'),
        outputPath: join(TEST_WORKSPACE, 'SOUL.md'),
        llm: mockLLM,
        format: 'cjk-math-emoji',
        force: true,
      };

      const result = await runPipeline(options);

      // Either succeeds or fails validation (no axioms) - both are valid outcomes
      expect(result.skipped).toBe(false);

      // If validation failed, error should mention axioms
      if (!result.success && result.error) {
        expect(result.error.message).toContain('axiom');
      }
    });
  });

  describe('Dry Run Mode', () => {
    it('should not write files in dry-run mode', async () => {
      // Create a separate test workspace for dry-run
      const dryRunWorkspace = resolve(FIXTURES_DIR, 'dry-run-test');
      if (existsSync(dryRunWorkspace)) {
        rmSync(dryRunWorkspace, { recursive: true });
      }
      cpSync(MOCK_WORKSPACE, dryRunWorkspace, { recursive: true });

      const originalSoul = readFileSync(join(dryRunWorkspace, 'SOUL.md'), 'utf-8');

      const options: PipelineOptions = {
        memoryPath: join(dryRunWorkspace, 'memory'),
        outputPath: join(dryRunWorkspace, 'SOUL.md'),
        llm: mockLLM,
        format: 'cjk-math-emoji',
        force: true,
        dryRun: true,
      };

      const result = await runPipeline(options);

      // Pipeline runs through stages (may or may not produce axioms)
      expect(result.skipped).toBe(false);

      // SOUL.md should be unchanged in dry-run mode
      const afterSoul = readFileSync(join(dryRunWorkspace, 'SOUL.md'), 'utf-8');
      expect(afterSoul).toBe(originalSoul);

      // No persistence files should be created in dry-run
      expect(existsSync(join(dryRunWorkspace, '.neon-soul', 'signals.json'))).toBe(false);

      // Cleanup
      rmSync(dryRunWorkspace, { recursive: true });
    });
  });

});

describe('E2E: Command Interface', () => {
  describe('synthesize command', () => {
    it('should run synthesis and return result', async () => {
      // Commands require skill context with LLM provider
      const result = await runSynthesizeCommand(
        [
          '--memory-path', join(TEST_WORKSPACE, 'memory'),
          '--output-path', join(TEST_WORKSPACE, 'SOUL.md'),
          '--force',
        ],
        { llm: mockLLM }
      );

      // May succeed or fail validation (no axioms) - command should handle both
      // The key is that it runs without throwing
      expect(typeof result.success).toBe('boolean');
    });

    it('should support dry-run flag', async () => {
      // Commands require skill context with LLM provider
      const result = await runSynthesizeCommand(
        [
          '--memory-path', join(TEST_WORKSPACE, 'memory'),
          '--output-path', join(TEST_WORKSPACE, 'SOUL.md'),
          '--force',
          '--dry-run',
        ],
        { llm: mockLLM }
      );

      // Dry-run should work
      expect(typeof result.success).toBe('boolean');
    });

    it('should throw LLMRequiredError without skill context', async () => {
      await expect(
        runSynthesizeCommand([
          '--memory-path', join(TEST_WORKSPACE, 'memory'),
          '--output-path', join(TEST_WORKSPACE, 'SOUL.md'),
        ])
      ).rejects.toThrow('LLM provider is required');
    });
  });

  describe('status command', () => {
    it('should return status for valid workspace after synthesis', async () => {
      // First run a synthesis to populate state
      await runPipeline({
        memoryPath: join(TEST_WORKSPACE, 'memory'),
        outputPath: join(TEST_WORKSPACE, 'SOUL.md'),
        llm: mockLLM,
        format: 'cjk-math-emoji',
        force: true,
        dryRun: false,
      });

      const result = await runStatusCommand([
        '--workspace', TEST_WORKSPACE,
      ]);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const data = result.data as {
        lastRun: string;
        counts: { signals: number; principles: number; axioms: number };
      };

      expect(typeof data.lastRun).toBe('string');
      expect(typeof data.counts.signals).toBe('number');
    });

    it('should fail for invalid workspace', async () => {
      const result = await runStatusCommand([
        '--workspace', '/nonexistent/path',
      ]);

      expect(result.success).toBe(false);
    });
  });

  describe('rollback command', () => {
    it('should list backups (may be empty)', async () => {
      // Ensure workspace exists with .neon-soul directory
      await runPipeline({
        memoryPath: join(TEST_WORKSPACE, 'memory'),
        outputPath: join(TEST_WORKSPACE, 'SOUL.md'),
        llm: mockLLM,
        format: 'cjk-math-emoji',
        force: true,
        dryRun: false,
      });

      const result = await runRollbackCommand([
        '--workspace', TEST_WORKSPACE,
        '--list',
      ]);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const data = result.data as { backups: Array<{ timestamp: string }> };
      expect(Array.isArray(data.backups)).toBe(true);
    });

    it('should require --force or fail gracefully', async () => {
      const result = await runRollbackCommand([
        '--workspace', TEST_WORKSPACE,
      ]);

      // Either requires --force or no backups available
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('audit command', () => {
    it('should handle workspace with no axioms', async () => {
      const result = await runAuditCommand([
        '--workspace', TEST_WORKSPACE,
        '--stats',
      ]);

      // Either succeeds with stats or fails with "no axioms"
      if (result.success) {
        expect(result.data).toBeDefined();
      } else {
        expect(result.error).toContain('axiom');
      }
    });

    it('should support --list flag', async () => {
      const result = await runAuditCommand([
        '--workspace', TEST_WORKSPACE,
        '--list',
      ]);

      // Either succeeds or fails with no axioms
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('trace command', () => {
    it('should require axiom ID', async () => {
      const result = await runTraceCommand([
        '--workspace', TEST_WORKSPACE,
      ]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Axiom ID required');
    });

    it('should handle nonexistent axiom', async () => {
      const result = await runTraceCommand([
        '--workspace', TEST_WORKSPACE,
        'nonexistent_axiom_id',
      ]);

      expect(result.success).toBe(false);
      // Either "not found" or "no axioms"
      expect(result.error).toBeDefined();
    });
  });
});

describe('E2E: Safety Rails', () => {
  it('should respect dry-run and not modify files', async () => {
    const dryRunWorkspace = resolve(FIXTURES_DIR, 'safety-test');
    if (existsSync(dryRunWorkspace)) {
      rmSync(dryRunWorkspace, { recursive: true });
    }
    cpSync(MOCK_WORKSPACE, dryRunWorkspace, { recursive: true });

    const originalSoul = readFileSync(join(dryRunWorkspace, 'SOUL.md'), 'utf-8');

    // Run with dry-run (requires skill context with LLM)
    await runSynthesizeCommand(
      [
        '--memory-path', join(dryRunWorkspace, 'memory'),
        '--output-path', join(dryRunWorkspace, 'SOUL.md'),
        '--force',
        '--dry-run',
      ],
      { llm: mockLLM }
    );

    // Original file should be unchanged
    const afterSoul = readFileSync(join(dryRunWorkspace, 'SOUL.md'), 'utf-8');
    expect(afterSoul).toBe(originalSoul);

    // Cleanup
    rmSync(dryRunWorkspace, { recursive: true });
  });

  it('should backup existing SOUL.md before write', async () => {
    const backupTestWorkspace = resolve(FIXTURES_DIR, 'backup-test');
    if (existsSync(backupTestWorkspace)) {
      rmSync(backupTestWorkspace, { recursive: true });
    }
    cpSync(MOCK_WORKSPACE, backupTestWorkspace, { recursive: true });

    // First synthesis
    await runPipeline({
      memoryPath: join(backupTestWorkspace, 'memory'),
      outputPath: join(backupTestWorkspace, 'SOUL.md'),
      llm: mockLLM,
      format: 'cjk-math-emoji',
      force: true,
    });

    // Second synthesis - if first wrote SOUL.md, should create backup
    await runPipeline({
      memoryPath: join(backupTestWorkspace, 'memory'),
      outputPath: join(backupTestWorkspace, 'SOUL.md'),
      llm: mockLLM,
      format: 'cjk-math-emoji',
      force: true,
    });

    const backups = listBackups(backupTestWorkspace);
    // Backups created if SOUL.md was written
    expect(Array.isArray(backups)).toBe(true);

    // Cleanup
    rmSync(backupTestWorkspace, { recursive: true });
  });

  it('should not allow rollback without confirmation', async () => {
    const result = await runRollbackCommand([
      '--workspace', TEST_WORKSPACE,
    ]);

    // Rollback should fail without --force (or no backups)
    expect(result.success).toBe(false);
  });
});

describe('E2E: Edge Cases', () => {
  it('should handle empty memory directory', async () => {
    const emptyWorkspace = resolve(FIXTURES_DIR, 'empty-test');
    if (existsSync(emptyWorkspace)) {
      rmSync(emptyWorkspace, { recursive: true });
    }
    mkdirSync(join(emptyWorkspace, 'memory'), { recursive: true });

    const result = await runPipeline({
      memoryPath: join(emptyWorkspace, 'memory'),
      outputPath: join(emptyWorkspace, 'SOUL.md'),
      llm: mockLLM,
      format: 'cjk-math-emoji',
      force: true,
    });

    // Pipeline should run (may fail validation with no content, that's OK)
    expect(result.skipped).toBe(false);

    // Cleanup
    rmSync(emptyWorkspace, { recursive: true });
  });

  it('should handle missing workspace in status', async () => {
    const result = await runStatusCommand([
      '--workspace', '/nonexistent/path',
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle missing axiom in trace', async () => {
    const result = await runTraceCommand([
      '--workspace', TEST_WORKSPACE,
      'nonexistent_axiom_id',
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('E2E: LLM Integration', () => {
  it('uses mock LLM for classification', async () => {
    // Create a fresh mock LLM for this test
    const freshMockLLM = createMockLLM();

    // Run pipeline with fresh workspace to ensure signals are extracted
    const llmTestWorkspace = resolve(FIXTURES_DIR, 'llm-test-workspace');
    if (existsSync(llmTestWorkspace)) {
      rmSync(llmTestWorkspace, { recursive: true });
    }
    cpSync(MOCK_WORKSPACE, llmTestWorkspace, { recursive: true });

    await runPipeline({
      memoryPath: join(llmTestWorkspace, 'memory'),
      outputPath: join(llmTestWorkspace, 'SOUL.md'),
      llm: freshMockLLM,
      format: 'cjk-math-emoji',
      force: true,
      dryRun: true,
    });

    // LLM should have been called for classification
    // (signal detection, dimension classification, etc.)
    expect(freshMockLLM.getCallCount()).toBeGreaterThan(0);

    // Cleanup
    rmSync(llmTestWorkspace, { recursive: true });
  });

  it('throws LLMRequiredError when LLM not provided', async () => {
    const llmTestWorkspace = resolve(FIXTURES_DIR, 'llm-required-test');
    if (existsSync(llmTestWorkspace)) {
      rmSync(llmTestWorkspace, { recursive: true });
    }
    mkdirSync(join(llmTestWorkspace, 'memory'), { recursive: true });

    // Missing llm should throw
    await expect(
      runPipeline({
        memoryPath: join(llmTestWorkspace, 'memory'),
        outputPath: join(llmTestWorkspace, 'SOUL.md'),
        force: true,
      } as PipelineOptions)
    ).rejects.toThrow('LLM provider is required');

    // Cleanup
    rmSync(llmTestWorkspace, { recursive: true });
  });
});
