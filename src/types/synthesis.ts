/**
 * Synthesis types for cycle management and soul persistence.
 *
 * Stage 13: Cycle Management - defines the modes and state for
 * incremental vs full re-synthesis of souls.
 */

import type { Principle } from './principle.js';
import type { Axiom } from './axiom.js';

/**
 * Cycle mode for synthesis operations.
 *
 * - initial: First synthesis (no existing soul)
 * - incremental: Merge new principles into existing soul
 * - full-resynthesis: Complete re-synthesis (significant changes detected)
 */
export type CycleMode = 'initial' | 'incremental' | 'full-resynthesis';

/**
 * Decision from cycle mode detection.
 */
export interface CycleDecision {
  /** Selected synthesis mode */
  mode: CycleMode;
  /** Human-readable reason for mode selection */
  reason: string;
  /** List of triggers that influenced the decision */
  triggers: string[];
}

/**
 * Thresholds for cycle mode detection.
 */
export interface CycleThresholds {
  /**
   * New principles as percentage of existing.
   * Above this triggers full resynthesis.
   * @default 0.3 (30%)
   */
  newPrincipleRatio: number;

  /**
   * Number of existing axioms contradicted by new evidence.
   * At or above this triggers full resynthesis.
   * @default 2
   */
  contradictionCount: number;

  /**
   * Whether axiom hierarchy has changed.
   * Triggers essence regeneration even in incremental mode.
   */
  hierarchyChanged: boolean;
}

/**
 * Default cycle thresholds.
 */
export const DEFAULT_CYCLE_THRESHOLDS: CycleThresholds = {
  newPrincipleRatio: 0.3,
  contradictionCount: 2,
  hierarchyChanged: false,
};

/**
 * Persisted soul state for cycle management.
 *
 * I-6 FIX: Represents the complete persisted state needed for
 * incremental synthesis.
 */
export interface Soul {
  /** Unique identifier for this soul instance */
  id: string;
  /** When this soul was last updated (ISO timestamp) */
  updatedAt: string;
  /** Promoted axioms with their metadata */
  axioms: Axiom[];
  /** All principles (including non-promoted) */
  principles: Principle[];
  /** Cycle count for periodic full-resynthesis */
  cycleCount: number;
}

/**
 * Result of cycle synthesis operation.
 */
export interface CycleSynthesisResult {
  /** Mode used for this synthesis */
  mode: CycleMode;
  /** Decision details */
  decision: CycleDecision;
  /** Updated soul state */
  soul: Soul;
  /** Statistics about the synthesis */
  stats: {
    /** New principles discovered */
    newPrinciples: number;
    /** Principles merged with existing */
    mergedPrinciples: number;
    /** Axioms added or updated */
    axiomChanges: number;
    /** Whether essence was regenerated */
    essenceRegenerated: boolean;
  };
}
