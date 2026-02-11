/**
 * Principle types - intermediate stage between signals and axioms.
 */

import type { SignalSource, GeneralizationProvenance } from './signal.js';
import type { SoulCraftDimension } from './dimensions.js';

export interface PrincipleProvenance {
  signals: Array<{
    id: string;
    similarity: number;
    source: SignalSource;
    /** Original signal text (preserved for voice) */
    original_text?: string;
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
}
