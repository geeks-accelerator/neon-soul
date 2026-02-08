/**
 * Persistence Layer for Synthesis Data
 *
 * Persists signals, principles, and axioms to .neon-soul/ directory
 * for consumption by status, trace, and audit commands.
 *
 * Directory structure:
 *   .neon-soul/
 *     state.json       # Synthesis state (handled by state.ts)
 *     signals.json     # Extracted signals with provenance
 *     principles.json  # Generated principles with N-counts
 *     axioms.json      # Promoted axioms with full provenance
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, renameSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Signal } from '../types/signal.js';
import type { Principle } from '../types/principle.js';
import type { Axiom } from '../types/axiom.js';
import { loadState } from './state.js';
import { logger } from './logger.js';

/**
 * Persisted synthesis data.
 */
export interface SynthesisData {
  /** Synthesis timestamp (null if never run) */
  timestamp: string | null;
  /** Extracted signals */
  signals: Signal[];
  /** Generated principles */
  principles: Principle[];
  /** Promoted axioms */
  axioms: Axiom[];
  /** Metrics */
  metrics: {
    signalCount: number;
    principleCount: number;
    axiomCount: number;
    dimensionCoverage: number;
  };
}

/**
 * Get .neon-soul directory path for workspace.
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
 * IM-4 FIX: Atomic file write using temp file + rename.
 * Prevents corruption if process crashes mid-write.
 * CR-2 FIX: Exported for use in pipeline.ts SOUL.md write.
 * I-5 FIX: Clean up temp file on rename failure.
 */
export function writeFileAtomic(filePath: string, content: string): void {
  const dir = dirname(filePath);
  const tempPath = resolve(dir, `.tmp-${randomUUID()}`);

  // Write to temp file first
  writeFileSync(tempPath, content, 'utf-8');

  // I-5 FIX: Atomic rename with cleanup on failure
  try {
    renameSync(tempPath, filePath);
  } catch (error) {
    // Clean up temp file on rename failure (e.g., cross-filesystem, permissions)
    try {
      unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors - temp file may already be gone
    }
    throw error;
  }
}

/**
 * Save signals to .neon-soul/signals.json.
 */
export function saveSignals(workspacePath: string, signals: Signal[]): void {
  const dir = ensureNeonSoulDir(workspacePath);
  const filePath = resolve(dir, 'signals.json');

  // Convert signals to serializable format (embeddings are large, include them for tracing)
  // CR-1 FIX: Handle both Date objects and ISO strings for extractedAt
  const serializable = signals.map((s) => ({
    ...s,
    source: {
      ...s.source,
      extractedAt: s.source.extractedAt instanceof Date
        ? s.source.extractedAt.toISOString()
        : s.source.extractedAt,
    },
  }));

  writeFileAtomic(filePath, JSON.stringify(serializable, null, 2));
}

/**
 * Save principles to .neon-soul/principles.json.
 */
export function savePrinciples(workspacePath: string, principles: Principle[]): void {
  const dir = ensureNeonSoulDir(workspacePath);
  const filePath = resolve(dir, 'principles.json');

  writeFileAtomic(filePath, JSON.stringify(principles, null, 2));
}

/**
 * Save axioms to .neon-soul/axioms.json.
 */
export function saveAxioms(workspacePath: string, axioms: Axiom[]): void {
  const dir = ensureNeonSoulDir(workspacePath);
  const filePath = resolve(dir, 'axioms.json');

  writeFileAtomic(filePath, JSON.stringify(axioms, null, 2));
}

/**
 * Save all synthesis data at once.
 *
 * I-3 NOTE: These writes are sequential, not transactional. A crash between
 * writes could leave files in inconsistent state. This is acceptable because:
 * 1. Files can be regenerated from source memory on next run
 * 2. State file tracks last successful run timestamp
 * 3. Atomic directory rename adds significant complexity
 *
 * If strict consistency is needed, consider writing to temp dir then renaming.
 */
export function saveSynthesisData(
  workspacePath: string,
  signals: Signal[],
  principles: Principle[],
  axioms: Axiom[]
): void {
  saveSignals(workspacePath, signals);
  savePrinciples(workspacePath, principles);
  saveAxioms(workspacePath, axioms);
}

/**
 * Load signals from .neon-soul/signals.json.
 */
export function loadSignals(workspacePath: string): Signal[] {
  const filePath = resolve(getNeonSoulDir(workspacePath), 'signals.json');

  if (!existsSync(filePath)) {
    return [];
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content) as Array<Signal & { source: { extractedAt: string } }>;

    // Convert extractedAt back to Date
    return parsed.map((s) => ({
      ...s,
      source: {
        ...s.source,
        extractedAt: new Date(s.source.extractedAt),
      },
    }));
  } catch (error) {
    // CR-3 FIX: Log warning for corrupted files instead of silent failure
    // M-5 FIX: Use logger abstraction for configurable output
    logger.warn('Failed to load signals', { filePath, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Load principles from .neon-soul/principles.json.
 */
export function loadPrinciples(workspacePath: string): Principle[] {
  const filePath = resolve(getNeonSoulDir(workspacePath), 'principles.json');

  if (!existsSync(filePath)) {
    return [];
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as Principle[];
  } catch (error) {
    // CR-3 FIX: Log warning for corrupted files instead of silent failure
    // M-5 FIX: Use logger abstraction for configurable output
    logger.warn('Failed to load principles', { filePath, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Load axioms from .neon-soul/axioms.json.
 */
export function loadAxioms(workspacePath: string): Axiom[] {
  const filePath = resolve(getNeonSoulDir(workspacePath), 'axioms.json');

  if (!existsSync(filePath)) {
    return [];
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as Axiom[];
  } catch (error) {
    // CR-3 FIX: Log warning for corrupted files instead of silent failure
    // M-5 FIX: Use logger abstraction for configurable output
    logger.warn('Failed to load axioms', { filePath, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Load all synthesis data.
 */
export function loadSynthesisData(workspacePath: string): SynthesisData | null {
  const signals = loadSignals(workspacePath);
  const principles = loadPrinciples(workspacePath);
  const axioms = loadAxioms(workspacePath);

  if (signals.length === 0 && principles.length === 0 && axioms.length === 0) {
    return null;
  }

  // M-2 FIX: Calculate dimension coverage, filtering undefined values
  const dimensions = new Set(axioms.map((a) => a.dimension).filter(Boolean));
  const dimensionCoverage = dimensions.size / 7;

  // M-3 FIX: Get timestamp from state file instead of current time
  // This accurately reflects when synthesis last ran
  // Return null if state unavailable to distinguish "never run" from "just ran"
  const state = loadState(workspacePath);
  const timestamp = state?.lastRun?.timestamp || null;

  return {
    timestamp,
    signals,
    principles,
    axioms,
    metrics: {
      signalCount: signals.length,
      principleCount: principles.length,
      axiomCount: axioms.length,
      dimensionCoverage,
    },
  };
}
