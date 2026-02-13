/**
 * Tests for Cycle Manager
 *
 * Stage 13: Verifies cycle mode detection and soul persistence.
 * @see docs/plans/2026-02-10-pbd-alignment.md Stage 13 Acceptance Criteria
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import {
  decideCycleMode,
  loadSoul,
  saveSoul,
  createSoul,
  updateSoul,
  acquireLock,
  formatCycleDecision,
} from '../../src/lib/cycle-manager.js';
import type { Soul } from '../../src/types/synthesis.js';
import type { Principle } from '../../src/types/principle.js';
import type { Axiom } from '../../src/types/axiom.js';

// Test workspace
let testWorkspace: string;

beforeEach(() => {
  testWorkspace = resolve(tmpdir(), `neon-soul-test-${randomUUID()}`);
  mkdirSync(testWorkspace, { recursive: true });
});

afterEach(() => {
  rmSync(testWorkspace, { recursive: true, force: true });
});

/**
 * Create a mock principle for testing.
 */
function createMockPrinciple(text: string): Principle {
  return {
    id: randomUUID(),
    text,
    dimension: 'values',
    strength: 1.0,
    n_count: 1,
    derived_from: {
      signals: [],
      merged_at: new Date().toISOString(),
    },
    history: [],
  };
}

/**
 * Create a mock axiom for testing.
 */
function createMockAxiom(text: string): Axiom {
  return {
    id: randomUUID(),
    text,
    tier: 'core',
    dimension: 'values',
    canonical: { native: text, notated: text },
    derived_from: {
      principles: [],
      promoted_at: new Date().toISOString(),
    },
    history: [],
  };
}

/**
 * Create a mock soul for testing.
 */
function createMockSoul(options?: {
  principleCount?: number;
  axiomCount?: number;
}): Soul {
  const principleCount = options?.principleCount ?? 10;
  const axiomCount = options?.axiomCount ?? 3;

  const principles: Principle[] = [];
  for (let i = 0; i < principleCount; i++) {
    principles.push(createMockPrinciple(`Test principle ${i}`));
  }

  const axioms: Axiom[] = [];
  for (let i = 0; i < axiomCount; i++) {
    axioms.push(createMockAxiom(`Test axiom ${i}`));
  }

  return createSoul(axioms, principles);
}

describe('decideCycleMode', () => {
  it('returns initial mode when no existing soul', () => {
    // Acceptance Criteria: First run → mode: initial
    const decision = decideCycleMode(null, []);

    expect(decision.mode).toBe('initial');
    expect(decision.reason).toBe('No existing soul state');
    expect(decision.triggers).toHaveLength(0);
  });

  it('returns incremental mode for minor additions', () => {
    // Acceptance Criteria: New memory file with minor additions → mode: incremental
    const existingSoul = createMockSoul({ principleCount: 10 });
    const newPrinciples = [
      createMockPrinciple('New principle 1'), // 1 new principle = 10% < 30% threshold
    ];

    const decision = decideCycleMode(existingSoul, newPrinciples);

    expect(decision.mode).toBe('incremental');
    expect(decision.reason).toBe('Merge new principles into existing soul');
  });

  it('returns full-resynthesis when exceeding new principle threshold', () => {
    // Acceptance Criteria: >30% new principles triggers full-resynthesis
    const existingSoul = createMockSoul({ principleCount: 10 });
    const newPrinciples = [
      createMockPrinciple('Completely new principle A'),
      createMockPrinciple('Completely new principle B'),
      createMockPrinciple('Completely new principle C'),
      createMockPrinciple('Completely new principle D'), // 4 new = 40% > 30%
    ];

    const decision = decideCycleMode(existingSoul, newPrinciples);

    expect(decision.mode).toBe('full-resynthesis');
    expect(decision.triggers.some(t => t.includes('exceed threshold'))).toBe(true);
  });

  it('returns full-resynthesis when axioms are contradicted', () => {
    // Acceptance Criteria: New memory file contradicting core axiom → mode: full-resynthesis
    const existingSoul = createMockSoul({ axiomCount: 3 });
    // Set up axioms without negation
    existingSoul.axioms[0] = createMockAxiom('prioritize speed in delivery');
    existingSoul.axioms[1] = createMockAxiom('prioritize quality in work');

    // New principles with negation on same topic (triggering contradiction detection)
    // The detection uses: similar topic + one has negation, other doesn't
    const newPrinciples = [
      createMockPrinciple('never prioritize speed in delivery'),
      createMockPrinciple('avoid prioritize quality in work'),
    ];

    const decision = decideCycleMode(existingSoul, newPrinciples, {
      newPrincipleRatio: 0.3,
      contradictionCount: 2, // Requires 2 contradictions
      hierarchyChanged: false,
    });

    expect(decision.mode).toBe('full-resynthesis');
    expect(decision.triggers.some(t => t.includes('contradicted'))).toBe(true);
  });

  it('respects --force-resynthesis flag', () => {
    // Acceptance Criteria: --force-resynthesis flag overrides to full mode
    const existingSoul = createMockSoul({ principleCount: 10 });
    const newPrinciples: Principle[] = []; // No new principles

    const decision = decideCycleMode(
      existingSoul,
      newPrinciples,
      { newPrincipleRatio: 0.3, contradictionCount: 2, hierarchyChanged: false },
      true // forceResynthesis = true
    );

    expect(decision.mode).toBe('full-resynthesis');
    expect(decision.triggers).toContain('--force-resynthesis flag set');
  });

  it('considers hierarchy changes as trigger', () => {
    const existingSoul = createMockSoul({ principleCount: 10 });

    const decision = decideCycleMode(
      existingSoul,
      [],
      { newPrincipleRatio: 0.3, contradictionCount: 2, hierarchyChanged: true }
    );

    expect(decision.mode).toBe('full-resynthesis');
    expect(decision.triggers).toContain('Axiom hierarchy has changed');
  });
});

describe('Soul persistence', () => {
  it('saves and loads soul state', () => {
    // Acceptance Criteria: I-6 loadSoul() and saveSoul() functions implemented
    const soul = createMockSoul({ principleCount: 5, axiomCount: 2 });

    saveSoul(testWorkspace, soul);
    const loaded = loadSoul(testWorkspace);

    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe(soul.id);
    expect(loaded!.principles).toHaveLength(5);
    expect(loaded!.axioms).toHaveLength(2);
    expect(loaded!.cycleCount).toBe(1);
  });

  it('returns null when no soul exists', () => {
    const loaded = loadSoul(testWorkspace);
    expect(loaded).toBeNull();
  });

  it('preserves axiom IDs in incremental mode', () => {
    // Acceptance Criteria: Incremental mode preserves existing axiom IDs
    const originalSoul = createMockSoul({ axiomCount: 2 });
    const originalAxiomIds = originalSoul.axioms.map(a => a.id);

    // Update with same axioms
    const updatedSoul = updateSoul(
      originalSoul,
      originalSoul.axioms,
      originalSoul.principles
    );

    const updatedAxiomIds = updatedSoul.axioms.map(a => a.id);
    expect(updatedAxiomIds).toEqual(originalAxiomIds);
  });

  it('increments cycle count on update', () => {
    const originalSoul = createMockSoul();
    expect(originalSoul.cycleCount).toBe(1);

    const updatedSoul = updateSoul(
      originalSoul,
      originalSoul.axioms,
      originalSoul.principles
    );

    expect(updatedSoul.cycleCount).toBe(2);
  });
});

describe('Lock management', () => {
  it('acquires and releases lock', async () => {
    // Acceptance Criteria: I-6 PID lockfile prevents concurrent synthesis
    const release = await acquireLock(testWorkspace);

    const lockPath = resolve(testWorkspace, '.neon-soul', 'soul-synthesis.lock');
    expect(existsSync(lockPath)).toBe(true);

    release();
    expect(existsSync(lockPath)).toBe(false);
  });

  it('throws when lock already held', async () => {
    const release = await acquireLock(testWorkspace);

    await expect(acquireLock(testWorkspace)).rejects.toThrow('Synthesis already in progress');

    release();
  });

  it('rejects concurrent lock acquisition (I-5 race condition test)', async () => {
    // I-5 FIX: Test that atomic lock prevents concurrent acquisition
    // This verifies the C-1 fix (TOCTOU race condition) works correctly
    const results = await Promise.allSettled([
      acquireLock(testWorkspace),
      acquireLock(testWorkspace),
      acquireLock(testWorkspace),
    ]);

    const fulfilled = results.filter((r): r is PromiseFulfilledResult<() => void> =>
      r.status === 'fulfilled'
    );
    const rejected = results.filter((r): r is PromiseRejectedResult =>
      r.status === 'rejected'
    );

    // Exactly one should succeed, others should fail
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(2);

    // All rejected should have the "already in progress" error
    for (const result of rejected) {
      expect(result.reason.message).toContain('Synthesis already in progress');
    }

    // Release the successful lock
    fulfilled[0].value();
  });
});

describe('formatCycleDecision', () => {
  it('formats decision with triggers', () => {
    const decision = decideCycleMode(
      createMockSoul({ principleCount: 5 }),
      [
        createMockPrinciple('New A'),
        createMockPrinciple('New B'),
        createMockPrinciple('New C'),
      ]
    );

    const formatted = formatCycleDecision(decision);

    expect(formatted).toContain('Mode:');
    expect(formatted).toContain('Reason:');
  });

  it('formats initial mode decision', () => {
    const decision = decideCycleMode(null, []);
    const formatted = formatCycleDecision(decision);

    expect(formatted).toContain('initial');
    expect(formatted).toContain('No existing soul state');
    expect(formatted).not.toContain('Triggers:');
  });
});

describe('M-2: Stale lock detection', () => {
  it('auto-removes stale lock from dead process', async () => {
    // M-2 FIX: Create a lock file with a PID that doesn't exist
    const neonSoulDir = resolve(testWorkspace, '.neon-soul');
    mkdirSync(neonSoulDir, { recursive: true });
    const lockPath = resolve(neonSoulDir, 'soul-synthesis.lock');

    // Use a PID that definitely doesn't exist (very high number)
    // PID 999999999 won't exist on any system
    writeFileSync(lockPath, '999999999');
    expect(existsSync(lockPath)).toBe(true);

    // Should auto-remove stale lock and acquire successfully
    const release = await acquireLock(testWorkspace);
    expect(typeof release).toBe('function');

    // Lock should now be held by us
    release();
    expect(existsSync(lockPath)).toBe(false);
  });

  it('still blocks on lock held by live process', async () => {
    // When lock is held by our process (which is alive), should still throw
    const release = await acquireLock(testWorkspace);

    // Try to acquire again - should fail since current process is alive
    await expect(acquireLock(testWorkspace)).rejects.toThrow('Synthesis already in progress');

    release();
  });
});

describe('M-3: Zod schema validation', () => {
  it('rejects corrupted soul state', () => {
    // M-3 FIX: Create a corrupted soul state file
    const neonSoulDir = resolve(testWorkspace, '.neon-soul');
    mkdirSync(neonSoulDir, { recursive: true });
    const statePath = resolve(neonSoulDir, 'soul-state.json');

    // Write invalid structure (missing required fields)
    writeFileSync(statePath, JSON.stringify({
      id: 'not-a-uuid', // Invalid UUID format
      updatedAt: 'not-a-date',
      // Missing axioms, principles, cycleCount
    }));

    // Should return null (graceful failure) instead of crashing
    const loaded = loadSoul(testWorkspace);
    expect(loaded).toBeNull();
  });

  it('rejects soul with invalid axiom structure', () => {
    const neonSoulDir = resolve(testWorkspace, '.neon-soul');
    mkdirSync(neonSoulDir, { recursive: true });
    const statePath = resolve(neonSoulDir, 'soul-state.json');

    // Write soul with malformed axiom
    writeFileSync(statePath, JSON.stringify({
      id: randomUUID(),
      updatedAt: new Date().toISOString(),
      axioms: [
        { id: 123, text: null }, // Invalid types
      ],
      principles: [],
      cycleCount: 1,
    }));

    const loaded = loadSoul(testWorkspace);
    expect(loaded).toBeNull();
  });

  it('accepts valid soul state', () => {
    // Valid soul should pass validation
    const soul = createMockSoul({ principleCount: 2, axiomCount: 1 });
    saveSoul(testWorkspace, soul);

    const loaded = loadSoul(testWorkspace);
    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe(soul.id);
    expect(loaded!.cycleCount).toBe(1);
  });
});
