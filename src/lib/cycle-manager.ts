/**
 * Cycle Management for Soul Evolution
 *
 * Stage 13: Manages incremental vs full re-synthesis behavior for evolving souls.
 *
 * The pipeline promises continuous evolution ("the soul gets richer every cycle").
 * This module implements:
 * - Cycle mode detection (initial/incremental/full-resynthesis)
 * - Soul state persistence
 * - Lock file for concurrency protection
 *
 * @see docs/plans/2026-02-10-pbd-alignment.md Stage 13
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  renameSync,
  mkdirSync,
  readdirSync,
  openSync,
  closeSync,
  writeSync,
} from 'node:fs';
import { z } from 'zod';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Principle } from '../types/principle.js';
import type { Axiom } from '../types/axiom.js';
import type {
  Soul,
  CycleDecision,
  CycleThresholds,
} from '../types/synthesis.js';
import { logger } from './logger.js';

/** Soul state file name */
const SOUL_STATE_FILE = 'soul-state.json';

/** Lock file for preventing concurrent synthesis */
const LOCK_FILE = 'soul-synthesis.lock';

/**
 * M-2 FIX: Check if a process is still alive using signal 0.
 * Signal 0 doesn't send anything, just checks if process exists.
 *
 * @returns true if process exists, false if dead
 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error: unknown) {
    // ESRCH = No such process (process is dead)
    // EPERM = Permission denied (process exists but we can't signal it)
    if (error instanceof Error && 'code' in error) {
      if (error.code === 'ESRCH') {
        return false;
      }
      if (error.code === 'EPERM') {
        // Process exists but we can't signal it - treat as alive
        return true;
      }
    }
    // Unknown error - assume alive to be safe
    return true;
  }
}

/**
 * M-3 FIX: Zod schema for runtime validation of Soul state.
 * Validates structure when loading from disk to catch corruption/tampering.
 * Uses passthrough() for nested objects to be permissive with optional fields.
 */
const SoulSchema = z.object({
  id: z.string().uuid(),
  updatedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  axioms: z.array(z.object({
    id: z.string(),
    text: z.string(),
    tier: z.enum(['core', 'domain', 'emerging']),
    dimension: z.string(),
    canonical: z.object({
      native: z.string(),
      notated: z.string(),
    }),
    derived_from: z.object({
      principles: z.array(z.object({
        id: z.string(),
        text: z.string(),
        n_count: z.number(),
      })),
      promoted_at: z.string(),
    }),
    history: z.array(z.object({
      type: z.enum(['created', 'refined', 'elevated']),
      timestamp: z.string(),
      details: z.string(),
    })),
  }).passthrough()),
  principles: z.array(z.object({
    id: z.string(),
    text: z.string(),
    dimension: z.string(),
    strength: z.number(),
    n_count: z.number(),
    derived_from: z.object({
      signals: z.array(z.object({
        id: z.string(),
        similarity: z.number(),
        source: z.object({
          file: z.string(),
          line: z.number().optional(),
        }).passthrough(),
      }).passthrough()),
      merged_at: z.string(),
    }).passthrough(),
    history: z.array(z.object({
      type: z.enum(['created', 'reinforced', 'merged', 'promoted']),
      timestamp: z.string(),
      details: z.string(),
    })),
  }).passthrough()),
  cycleCount: z.number().int().positive(),
});

/**
 * Get the .neon-soul directory path.
 */
function getNeonSoulDir(workspacePath: string): string {
  return resolve(workspacePath, '.neon-soul');
}

/**
 * Ensure .neon-soul directory exists.
 */
function ensureNeonSoulDir(workspacePath: string): string {
  const dir = getNeonSoulDir(workspacePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Load existing soul state if available.
 * Returns null if no previous synthesis exists.
 *
 * M-3 FIX: Uses Zod schema for runtime validation to catch corruption/tampering.
 */
export function loadSoul(workspacePath: string): Soul | null {
  const statePath = resolve(getNeonSoulDir(workspacePath), SOUL_STATE_FILE);

  if (!existsSync(statePath)) {
    return null;
  }

  try {
    const content = readFileSync(statePath, 'utf-8');
    const parsed = JSON.parse(content);

    // M-3 FIX: Validate structure with Zod
    const result = SoulSchema.safeParse(parsed);
    if (!result.success) {
      logger.warn('Soul state validation failed', {
        path: statePath,
        errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      });
      // Return null to trigger fresh synthesis rather than crash
      return null;
    }

    return result.data as Soul;
  } catch (error) {
    logger.warn('Failed to load soul state', {
      path: statePath,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * I-4 FIX: Clean up orphaned temp files from crashed synthesis.
 * Called at startup before acquiring lock to prevent accumulation.
 */
function cleanupOrphanedTempFiles(dir: string): void {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      if (file.startsWith('.tmp-soul-')) {
        try {
          unlinkSync(resolve(dir, file));
          logger.debug('Cleaned orphaned temp file', { file });
        } catch {
          // Ignore individual file cleanup errors
        }
      }
    }
  } catch {
    // Ignore directory read errors (e.g., dir doesn't exist yet)
  }
}

/**
 * Save soul state for incremental synthesis.
 * Uses atomic write pattern to prevent corruption.
 *
 * I-6 FIX: Atomic write using temp file + rename
 */
export function saveSoul(workspacePath: string, soul: Soul): void {
  const dir = ensureNeonSoulDir(workspacePath);
  const statePath = resolve(dir, SOUL_STATE_FILE);
  const tempPath = resolve(dir, `.tmp-soul-${randomUUID()}`);

  try {
    writeFileSync(tempPath, JSON.stringify(soul, null, 2), 'utf-8');
    renameSync(tempPath, statePath);
    logger.debug('Soul state saved', { path: statePath, cycleCount: soul.cycleCount });
  } catch (error) {
    // Clean up temp file on failure
    try {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath);
      }
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Create a new soul with initial state.
 */
export function createSoul(axioms: Axiom[], principles: Principle[]): Soul {
  return {
    id: randomUUID(),
    updatedAt: new Date().toISOString(),
    axioms,
    principles,
    cycleCount: 1,
  };
}

/**
 * Update an existing soul with new synthesis results.
 */
export function updateSoul(
  existingSoul: Soul,
  axioms: Axiom[],
  principles: Principle[]
): Soul {
  return {
    ...existingSoul,
    updatedAt: new Date().toISOString(),
    axioms,
    principles,
    cycleCount: existingSoul.cycleCount + 1,
  };
}

/**
 * Acquire synthesis lock.
 * Returns a release function that MUST be called when synthesis completes.
 *
 * C-1 FIX: Uses atomic fs.open('wx') to prevent TOCTOU race condition.
 * I-4 FIX: Cleans up orphaned temp files before acquiring lock.
 * I-6 FIX: PID lockfile prevents concurrent synthesis.
 *
 * @throws Error if synthesis is already in progress
 */
export async function acquireLock(workspacePath: string): Promise<() => void> {
  const dir = ensureNeonSoulDir(workspacePath);
  const lockPath = resolve(dir, LOCK_FILE);
  const pid = process.pid.toString();

  // I-4 FIX: Clean up orphaned temp files from crashed synthesis
  cleanupOrphanedTempFiles(dir);

  try {
    // C-1 FIX: 'wx' flag opens for writing but fails atomically if file exists
    // This eliminates the TOCTOU race between existsSync and writeFileSync
    const fd = openSync(lockPath, 'wx');
    writeSync(fd, pid);
    closeSync(fd);
    logger.debug('Acquired synthesis lock', { lockPath, pid });

    // Return synchronous release function
    return () => {
      try {
        if (existsSync(lockPath)) {
          unlinkSync(lockPath);
          logger.debug('Released synthesis lock', { lockPath });
        }
      } catch (error) {
        logger.warn('Failed to release lock', {
          lockPath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };
  } catch (error: unknown) {
    // Handle EEXIST error (lock already held)
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      let existingPid = 'unknown';
      try {
        existingPid = readFileSync(lockPath, 'utf-8').trim();
      } catch {
        // Ignore read errors
      }

      // M-2 FIX: Check if lock-holding process is still alive
      const pidNum = parseInt(existingPid, 10);
      if (!isNaN(pidNum) && !isProcessAlive(pidNum)) {
        // Stale lock - process is dead, auto-remove and retry
        logger.info('Removing stale lock from dead process', { lockPath, pid: pidNum });
        try {
          unlinkSync(lockPath);
          // Retry lock acquisition after removing stale lock
          return acquireLock(workspacePath);
        } catch (unlinkError) {
          logger.warn('Failed to remove stale lock', {
            lockPath,
            error: unlinkError instanceof Error ? unlinkError.message : String(unlinkError),
          });
        }
      }

      throw new Error(
        `Synthesis already in progress (PID: ${existingPid}). ` +
        `Remove ${lockPath} if stale.`
      );
    }
    throw error;
  }
}

/**
 * Calculate text-based similarity between two principle texts.
 * Simple Jaccard similarity on normalized tokens.
 *
 * Note: This is a fallback for when embeddings aren't available.
 * The LLM-based similarity in matcher.ts is more accurate.
 */
function textSimilarity(text1: string, text2: string): number {
  const normalize = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  const tokens1 = new Set(normalize(text1));
  const tokens2 = new Set(normalize(text2));

  if (tokens1.size === 0 && tokens2.size === 0) return 1;
  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) intersection++;
  }

  const union = tokens1.size + tokens2.size - intersection;
  return intersection / union;
}

/**
 * Detect if a new principle contradicts an existing axiom.
 * Uses text similarity threshold to find potential contradictions.
 */
function detectContradictions(
  existingAxioms: Axiom[],
  newPrinciples: Principle[]
): Array<{ axiom: Axiom; principle: Principle }> {
  const contradictions: Array<{ axiom: Axiom; principle: Principle }> = [];

  for (const axiom of existingAxioms) {
    for (const principle of newPrinciples) {
      // Check for negation patterns in similar-topic principles
      const similarity = textSimilarity(axiom.text, principle.text);

      // High similarity but with negation markers suggests contradiction
      if (similarity > 0.5) {
        const negationPatterns = [
          /\bnot\b/i, /\bnever\b/i, /\bavoid\b/i, /\bdon't\b/i,
          /\bshouldn't\b/i, /\bwon't\b/i, /\bexcept\b/i,
        ];

        const axiomHasNegation = negationPatterns.some(p => p.test(axiom.text));
        const principleHasNegation = negationPatterns.some(p => p.test(principle.text));

        // One has negation and other doesn't = potential contradiction
        if (axiomHasNegation !== principleHasNegation) {
          contradictions.push({ axiom, principle });
        }
      }
    }
  }

  return contradictions;
}

/**
 * Count truly new principles (not similar to existing).
 */
function countNewPrinciples(
  existingPrinciples: Principle[],
  candidatePrinciples: Principle[],
  similarityThreshold: number = 0.7
): number {
  let newCount = 0;

  for (const candidate of candidatePrinciples) {
    const hasMatch = existingPrinciples.some(
      existing => textSimilarity(existing.text, candidate.text) > similarityThreshold
    );
    if (!hasMatch) {
      newCount++;
    }
  }

  return newCount;
}

/**
 * Decide cycle mode based on existing soul and new principles.
 *
 * Decision logic:
 * - No existing soul → initial
 * - >30% new principles OR ≥2 contradictions → full-resynthesis
 * - Otherwise → incremental
 *
 * @param existingSoul - Previously synthesized soul (null for first run)
 * @param newPrinciples - Principles from current synthesis
 * @param thresholds - Configurable thresholds for mode detection
 * @param forceResynthesis - Override to force full resynthesis
 */
export function decideCycleMode(
  existingSoul: Soul | null,
  newPrinciples: Principle[],
  thresholds: CycleThresholds = {
    newPrincipleRatio: 0.3,
    contradictionCount: 2,
    hierarchyChanged: false,
  },
  forceResynthesis: boolean = false
): CycleDecision {
  // Force resynthesis flag overrides detection
  if (forceResynthesis) {
    return {
      mode: 'full-resynthesis',
      reason: 'Manual override via --force-resynthesis',
      triggers: ['--force-resynthesis flag set'],
    };
  }

  // No existing soul → initial synthesis
  if (!existingSoul) {
    return {
      mode: 'initial',
      reason: 'No existing soul state',
      triggers: [],
    };
  }

  const triggers: string[] = [];

  // Check new principle ratio
  const existingCount = existingSoul.principles.length;
  if (existingCount > 0) {
    const newCount = countNewPrinciples(existingSoul.principles, newPrinciples);
    const ratio = newCount / existingCount;

    if (ratio > thresholds.newPrincipleRatio) {
      triggers.push(
        `New principles (${(ratio * 100).toFixed(0)}%) exceed threshold (${(thresholds.newPrincipleRatio * 100).toFixed(0)}%)`
      );
    }
  }

  // Check contradictions
  const contradictions = detectContradictions(existingSoul.axioms, newPrinciples);
  if (contradictions.length >= thresholds.contradictionCount) {
    triggers.push(
      `${contradictions.length} axioms contradicted by new evidence`
    );
  }

  // Check hierarchy change
  if (thresholds.hierarchyChanged) {
    triggers.push('Axiom hierarchy has changed');
  }

  // Decide based on triggers
  if (triggers.length > 0) {
    return {
      mode: 'full-resynthesis',
      reason: 'Significant changes detected',
      triggers,
    };
  }

  return {
    mode: 'incremental',
    reason: 'Merge new principles into existing soul',
    triggers: [],
  };
}

/**
 * Format cycle decision as human-readable summary.
 */
export function formatCycleDecision(decision: CycleDecision): string {
  const lines: string[] = [
    `Mode: ${decision.mode}`,
    `Reason: ${decision.reason}`,
  ];

  if (decision.triggers.length > 0) {
    lines.push('Triggers:');
    for (const trigger of decision.triggers) {
      lines.push(`  - ${trigger}`);
    }
  }

  return lines.join('\n');
}
