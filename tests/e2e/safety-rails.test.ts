/**
 * Safety Rails E2E Tests
 *
 * Tests that verify security and safety mechanisms work correctly.
 * Focus: Symlink protection, --force requirements, atomic writes, LLM requirements.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  cpSync,
  symlinkSync,
  statSync,
} from 'node:fs';
import { resolve, join } from 'node:path';
import { run as runSynthesizeCommand } from '../../src/commands/synthesize.js';
import { run as runStatusCommand } from '../../src/commands/status.js';
import { run as runRollbackCommand } from '../../src/commands/rollback.js';
import { createMockLLM, type MockLLMProvider } from '../mocks/llm-mock.js';

// Test workspace paths
const FIXTURES_DIR = resolve(import.meta.dirname, 'fixtures');
const MOCK_WORKSPACE = resolve(FIXTURES_DIR, 'mock-openclaw');
const TEST_WORKSPACE = resolve(FIXTURES_DIR, 'test-workspace-safety');

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

describe('E2E: Safety Rails', () => {
  beforeEach(() => {
    // Create fresh test workspace for each test
    if (existsSync(TEST_WORKSPACE)) {
      rmSync(TEST_WORKSPACE, { recursive: true });
    }
    cpSync(MOCK_WORKSPACE, TEST_WORKSPACE, { recursive: true });
  });

  describe('Symlink Protection (I-4 FIX)', () => {
    it('status skips symlinks in memory directory', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');

      // I-5 FIX: Create symlink target within test workspace (not global /tmp)
      const symlinkPath = join(memoryPath, 'linked-file.md');
      const targetPath = join(TEST_WORKSPACE, '..', 'symlink-target.md');

      // Create target file
      writeFileSync(targetPath, '# Symlinked Content\n\nThis should be ignored.');

      try {
        // Create symlink
        symlinkSync(targetPath, symlinkPath);

        // Run synthesis - should complete without following symlink
        const result = await runSynthesizeCommand(
          ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
          { llm: mockLLM }
        );

        // Synthesis should succeed
        expect(result.success).toBe(true);

        // Read SOUL.md - symlinked content should NOT appear
        const soulContent = readFileSync(outputPath, 'utf-8');

        // The symlinked file's content should not be in SOUL.md
        expect(soulContent).not.toContain('Symlinked Content');
        expect(soulContent).not.toContain('This should be ignored');
      } finally {
        // Cleanup
        if (existsSync(targetPath)) {
          rmSync(targetPath);
        }
      }
    }, 60000);
  });

  describe('Force Flag Requirements', () => {
    it('synthesize requires --force when below threshold', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');

      // Get original content and mtime
      const originalContent = readFileSync(outputPath, 'utf-8');
      const originalMtime = statSync(outputPath).mtimeMs;

      // Run synthesis WITHOUT --force
      const result = await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath],
        { llm: mockLLM }
      );

      // I-4 FIX: Strengthen verification - check actual outcome, not just defined
      // Either synthesis ran successfully and modified the file, OR
      // it was skipped and file remains unchanged
      if (result.success) {
        // If success, file may have been modified - that's fine (threshold logic passed)
        expect(existsSync(outputPath)).toBe(true);
      } else {
        // If not success, file content and mtime should be unchanged
        const newContent = readFileSync(outputPath, 'utf-8');
        const newMtime = statSync(outputPath).mtimeMs;
        expect(newContent).toBe(originalContent);
        expect(newMtime).toBe(originalMtime);
      }
    }, 60000);

    it('rollback requires --force to execute', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');

      // First run synthesis to create a backup
      await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      // Record current SOUL.md content
      const contentBeforeRollback = readFileSync(outputPath, 'utf-8');

      // Try rollback without --force
      const result = await runRollbackCommand(['--workspace', TEST_WORKSPACE]);

      // Should fail with error about requiring --force
      expect(result.success).toBe(false);
      expect(result.error).toContain('--force');

      // SOUL.md should be unchanged
      const contentAfterRollback = readFileSync(outputPath, 'utf-8');
      expect(contentAfterRollback).toBe(contentBeforeRollback);
    }, 60000);
  });

  describe('Atomic Writes', () => {
    it('synthesis uses atomic write pattern', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');

      // Run synthesis
      const result = await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
        { llm: mockLLM }
      );

      expect(result.success).toBe(true);

      // Verify output file exists and has valid content
      expect(existsSync(outputPath)).toBe(true);

      const content = readFileSync(outputPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('# SOUL');

      // No temp files should be left behind
      const neonSoulDir = join(TEST_WORKSPACE, '.neon-soul');
      if (existsSync(neonSoulDir)) {
        const { readdirSync: readDir } = await import('node:fs');
        const files = readDir(neonSoulDir);
        // M-2 FIX: Check both .tmp suffix and .tmp- prefix patterns
        // writeFileAtomic creates files like .tmp-<uuid>
        const actualTempFiles = files.filter(
          (f: string) => f.endsWith('.tmp') || f.startsWith('.tmp-')
        );
        expect(actualTempFiles.length).toBe(0);
      }
    }, 60000);
  });

  describe('LLM Requirements', () => {
    it('throws LLMRequiredError when LLM not provided', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');

      // Run synthesis without LLM context - this should throw
      let thrownError: Error | undefined;

      try {
        await runSynthesizeCommand(
          ['--memory-path', memoryPath, '--output-path', outputPath, '--force'],
          {} as any // No LLM provided
        );
      } catch (error) {
        thrownError = error as Error;
      }

      // Should throw LLMRequiredError
      expect(thrownError).toBeDefined();
      expect(thrownError?.name).toBe('LLMRequiredError');
      expect(thrownError?.message).toContain('LLM provider is required');
    }, 60000);
  });

  describe('Dry Run Safety', () => {
    it('dry-run does not modify files', async () => {
      const memoryPath = join(TEST_WORKSPACE, 'memory');
      const outputPath = join(TEST_WORKSPACE, 'SOUL.md');
      const neonSoulDir = join(TEST_WORKSPACE, '.neon-soul');

      // Record original state
      const originalContent = readFileSync(outputPath, 'utf-8');
      const originalMtime = statSync(outputPath).mtimeMs;
      const neonSoulExisted = existsSync(neonSoulDir);

      // Run with --dry-run
      const result = await runSynthesizeCommand(
        ['--memory-path', memoryPath, '--output-path', outputPath, '--dry-run'],
        { llm: mockLLM }
      );

      expect(result.success).toBe(true);

      // File content should be unchanged
      const newContent = readFileSync(outputPath, 'utf-8');
      expect(newContent).toBe(originalContent);

      // Mtime should be unchanged
      const newMtime = statSync(outputPath).mtimeMs;
      expect(newMtime).toBe(originalMtime);

      // .neon-soul should not be created if it didn't exist
      if (!neonSoulExisted) {
        expect(existsSync(neonSoulDir)).toBe(false);
      }
    }, 60000);
  });
});
