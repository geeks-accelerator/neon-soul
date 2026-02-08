/**
 * State Persistence E2E Tests
 *
 * Tests that verify state persists correctly across multiple synthesis runs.
 * Focus: Multi-run behavior, rollback, provenance tracing.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  cpSync,
  readdirSync,
} from 'node:fs';
import { resolve, join } from 'node:path';
import { run as runSynthesizeCommand } from '../../src/commands/synthesize.js';
import { run as runStatusCommand } from '../../src/commands/status.js';
import { run as runRollbackCommand } from '../../src/commands/rollback.js';
import { run as runAuditCommand } from '../../src/commands/audit.js';
import { createMockLLM, type MockLLMProvider } from '../mocks/llm-mock.js';

// Test workspace paths
const FIXTURES_DIR = resolve(import.meta.dirname, 'fixtures');
const MOCK_WORKSPACE = resolve(FIXTURES_DIR, 'mock-openclaw');
const TEST_WORKSPACE = resolve(FIXTURES_DIR, 'test-workspace-persistence');

// Shared mock LLM
let mockLLM: MockLLMProvider;

beforeAll(() => {
  mockLLM = createMockLLM();
});

afterAll(() => {
  // Cleanup test workspace
  if (existsSync(TEST_WORKSPACE)) {
    rmSync(TEST_WORKSPACE, { recursive: true });
  }
});

describe('E2E: State Persistence', () => {
  beforeEach(() => {
    // Create fresh test workspace for each test
    if (existsSync(TEST_WORKSPACE)) {
      rmSync(TEST_WORKSPACE, { recursive: true });
    }
    cpSync(MOCK_WORKSPACE, TEST_WORKSPACE, { recursive: true });
  });

  describe('Status Tracking', () => {
    it('status reflects last synthesis run', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');

      // Record time before synthesis
      const beforeSynthesis = new Date();

      // Run synthesis
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get status
      const statusResult = await runStatusCommand(['--workspace', TEST_WORKSPACE]);

      expect(statusResult.success).toBe(true);
      expect(statusResult.data).toBeDefined();

      const data = statusResult.data as {
        lastRun: string;
        counts: { signals: number; principles: number; axioms: number };
      };

      // Verify lastRun is recent (within the test window)
      const lastRunDate = new Date(data.lastRun);
      expect(lastRunDate.getTime()).toBeGreaterThanOrEqual(beforeSynthesis.getTime());

      // Verify counts are populated
      expect(data.counts.signals).toBeGreaterThan(0);
      expect(data.counts.principles).toBeGreaterThan(0);
      expect(data.counts.axioms).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Multi-Run Synthesis', () => {
    it('second synthesis builds on first', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');

      // Run first synthesis
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Get initial counts
      const statusBefore = await runStatusCommand(['--workspace', TEST_WORKSPACE]);
      const countsBefore = (statusBefore.data as { counts: { axioms: number; signals: number } }).counts;

      // Add new memory file with additional signals
      const newMemoryFile = join(memoryPath, 'new-insights.md');
      writeFileSync(
        newMemoryFile,
        `# New Insights

## The Observation

**Iteration beats perfection.** Start with something that works, then improve.

The pattern emerges from practice:
- Ship early, learn fast
- Feedback loops matter more than planning
- Working software over comprehensive documentation

## Why This Matters

Perfectionism is a trap. Done is better than perfect.
`
      );

      // Run second synthesis
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Get updated counts
      const statusAfter = await runStatusCommand(['--workspace', TEST_WORKSPACE]);
      const countsAfter = (statusAfter.data as { counts: { signals: number } }).counts;

      // Signals should have increased (or at least not decreased)
      expect(countsAfter.signals).toBeGreaterThanOrEqual(countsBefore.signals);
    }, 120000);

    it('signals accumulate across runs', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');

      // Run first synthesis
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Get initial signal count
      const statusBefore = await runStatusCommand(['--workspace', TEST_WORKSPACE]);
      const signalsBefore = (statusBefore.data as { counts: { signals: number } }).counts
        .signals;

      // Add memory file with new signals
      const reflectionsDir = join(memoryPath, 'reflections');
      const newReflection = join(reflectionsDir, 'new-learning.md');
      writeFileSync(
        newReflection,
        `# A New Learning

## The Insight

**Presence matters more than productivity.** Being fully here beats being partially everywhere.

## Evidence

- Deep work produces better results than shallow multitasking
- Context switching has hidden costs
- Focus is a skill that can be trained

## The Principle

**Depth over breadth.** Master one thing before moving to the next.
`
      );

      // Run second synthesis
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Get updated signal count
      const statusAfter = await runStatusCommand(['--workspace', TEST_WORKSPACE]);
      const signalsAfter = (statusAfter.data as { counts: { signals: number } }).counts
        .signals;

      // Signal count should increase
      expect(signalsAfter).toBeGreaterThan(signalsBefore);
    }, 120000);
  });

  describe('Rollback', () => {
    it('rollback restores previous state', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');

      // Run first synthesis (version A)
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Read version A content
      const versionA = readFileSync(outputPath, 'utf-8');

      // Modify memory and run synthesis (version B)
      const newFile = join(memoryPath, 'reflections', 'change-for-version-b.md');
      writeFileSync(
        newFile,
        `# Version B Change

## Major Shift

This is a completely different perspective that should change the synthesis output.

**Speed over safety.** Move fast and break things.

This is intentionally different from our usual principles.
`
      );

      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Read version B and verify it differs from version A
      const versionB = readFileSync(outputPath, 'utf-8');

      // I-3 FIX: Assert versions differ before rollback to ensure rollback is meaningful
      // With mock LLM, content may be similar but timestamps in the file should differ
      // If they're identical, the test is not exercising rollback correctly
      expect(versionB).not.toBe(versionA);

      // Track backup count before rollback
      const backupDir = join(TEST_WORKSPACE, '.neon-soul', 'backups');
      const backupsBefore = existsSync(backupDir) ? readdirSync(backupDir) : [];

      // Run rollback
      const rollbackResult = await runRollbackCommand([
        '--workspace',
        TEST_WORKSPACE,
        '--force',
      ]);

      expect(rollbackResult.success).toBe(true);

      // Verify SOUL.md was restored
      const restored = readFileSync(outputPath, 'utf-8');

      // Restored should match version A (the backup)
      expect(restored).toBe(versionA);

      // I-2 NOTE: Rollback only restores SOUL.md, NOT internal state files
      // (.neon-soul/state.json, signals.json, principles.json, axioms.json)
      // This is by design - state files are regenerable from source.
      // Next synthesis will reconcile any state inconsistency.
    }, 180000);

    it('rollback requires --force to execute', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');

      // Run synthesis to create a backup
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Try rollback without --force
      const result = await runRollbackCommand(['--workspace', TEST_WORKSPACE]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('--force');
    }, 60000);
  });

  describe('Provenance Audit', () => {
    it('audit shows correct provenance after synthesis', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');

      // Run synthesis
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // List axioms
      const listResult = await runAuditCommand([
        '--workspace',
        TEST_WORKSPACE,
        '--list',
      ]);

      expect(listResult.success).toBe(true);
      expect(listResult.data).toBeDefined();

      const data = listResult.data as {
        axioms: Array<{
          id: string;
          text: string;
          dimension: string;
          principleCount: number;
        }>;
      };

      expect(data.axioms.length).toBeGreaterThan(0);

      // Pick the first axiom and trace it
      const firstAxiom = data.axioms[0];
      expect(firstAxiom).toBeDefined();

      const traceResult = await runAuditCommand([
        '--workspace',
        TEST_WORKSPACE,
        firstAxiom!.id,
      ]);

      expect(traceResult.success).toBe(true);

      const traceData = traceResult.data as {
        axiom: { id: string; dimension: string };
        principles: Array<{
          id: string;
          text: string;
          nCount: number;
          signals: Array<{ id: string; source: { file: string; line?: number } }>;
        }>;
      };

      expect(traceData.axiom.id).toBe(firstAxiom!.id);
      expect(traceData.principles.length).toBeGreaterThan(0);

      // Verify signal sources exist
      for (const principle of traceData.principles) {
        for (const signal of principle.signals) {
          // Signal source file path should be defined
          expect(signal.source.file).toBeDefined();

          // M-1 FIX: Check multiple path resolutions
          // Source file path may be: absolute, relative to workspace, or relative to memory
          const possiblePaths = [
            signal.source.file, // Absolute path
            join(TEST_WORKSPACE, signal.source.file), // Relative to workspace
            join(memoryPath, signal.source.file), // Relative to memory
            join(memoryPath, '..', signal.source.file), // Parent of memory
          ];

          const exists = possiblePaths.some((p) => existsSync(p));
          // Note: If path resolution fails, log for debugging
          if (!exists) {
            console.warn(`Source file not found: ${signal.source.file}`);
            console.warn(`Tried paths: ${possiblePaths.join(', ')}`);
          }
          expect(exists).toBe(true);
        }
      }
    }, 60000);
  });

  // I-6 FIX: Tests for corrupted state files
  describe('Corrupted State File Recovery', () => {
    it('handles corrupted signals.json gracefully', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');
      const neonSoulDir = join(TEST_WORKSPACE, '.neon-soul');

      // First run synthesis to create valid state
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Corrupt the signals.json file with invalid JSON
      const signalsPath = join(neonSoulDir, 'signals.json');
      if (existsSync(signalsPath)) {
        writeFileSync(signalsPath, '{ invalid json here :::');
      }

      // Status should still work (graceful recovery to empty state)
      const statusResult = await runStatusCommand(['--workspace', TEST_WORKSPACE]);

      // Should not crash - gracefully handles corruption
      expect(statusResult.success).toBe(true);
    }, 60000);

    it('handles missing state.json gracefully', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');
      const neonSoulDir = join(TEST_WORKSPACE, '.neon-soul');

      // First run synthesis to create valid state
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Remove state.json
      const statePath = join(neonSoulDir, 'state.json');
      if (existsSync(statePath)) {
        rmSync(statePath);
      }

      // Status should still work (treats as no previous run)
      const statusResult = await runStatusCommand(['--workspace', TEST_WORKSPACE]);

      // Should not crash
      expect(statusResult.success).toBe(true);
    }, 60000);

    it('synthesis recovers from corrupted state', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');
      const neonSoulDir = join(TEST_WORKSPACE, '.neon-soul');

      // First run synthesis to create valid state
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Corrupt all state files
      const filesToCorrupt = ['state.json', 'signals.json', 'principles.json', 'axioms.json'];
      for (const file of filesToCorrupt) {
        const filePath = join(neonSoulDir, file);
        if (existsSync(filePath)) {
          writeFileSync(filePath, 'corrupted{{{not-json');
        }
      }

      // Re-run synthesis - should work (regenerates from source)
      const result = await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Should succeed despite corrupted state
      expect(result.success).toBe(true);

      // Should have regenerated valid state
      const statusResult = await runStatusCommand(['--workspace', TEST_WORKSPACE]);
      expect(statusResult.success).toBe(true);
    }, 120000);
  });
});
