/**
 * Principle types - intermediate stage between signals and axioms.
 */

import type {
  SignalSource,
  GeneralizationProvenance,
  SignalStance,
  SignalImportance,
} from './signal.js';
import type { SoulCraftDimension } from './dimensions.js';
import type { ArtifactProvenance } from './provenance.js';

export interface PrincipleProvenance {
  signals: Array<{
    id: string;
    similarity: number;
    source: SignalSource;
    /** Original signal text (preserved for voice) */
    original_text?: string;
    /**
     * C-2 FIX: Persist stance for anti-echo-chamber checks.
     * Required for Stage 15 canPromote() to check questioning stance.
     */
    stance?: SignalStance;
    /**
     * C-2 FIX: Persist provenance for anti-echo-chamber checks.
     * Required for Stage 15 canPromote() to check external provenance.
     */
    provenance?: ArtifactProvenance;
    /**
     * PBD Stage 7: Persist importance for centrality calculation.
     */
    importance?: SignalImportance;
  }>;
  merged_at: string; // ISO timestamp
  /** Generalization metadata for the principle text */
  generalization?: GeneralizationProvenance;
}

export interface PrincipleEvent {
  type: 'created' | 'reinforced' | 'merged' | 'promoted';
  timestamp: string;
  details: string;
}

/**
 * PBD centrality levels based on signal importance distribution.
 * - foundational: 50%+ signals are core importance
 * - core: 20-50% signals are core importance
 * - supporting: <20% signals are core importance
 */
export type PrincipleCentrality = 'foundational' | 'core' | 'supporting';

export interface Principle {
  id: string;
  text: string;
  dimension: SoulCraftDimension;
  strength: number;
  n_count: number; // Reinforcement count (equals derived_from.signals.length)
  embedding: number[]; // Centroid of merged signals
  similarity_threshold: number; // Default 0.75 (see docs/issues/2026-02-10-generalized-signal-threshold-gap.md)
  derived_from: PrincipleProvenance;
  history: PrincipleEvent[];

  /**
   * PBD Stage 7: Centrality derived from importance of contributing signals.
   * A principle can be foundational (rare but core) even with low N-count.
   */
  centrality?: PrincipleCentrality;

  /**
   * PBD Stage 7: Estimated coverage - what % of total signals this represents.
   * Set by pipeline after all signals processed (requires total count).
   */
  coveragePct?: number;
}
