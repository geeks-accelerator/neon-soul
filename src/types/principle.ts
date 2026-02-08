/**
 * Principle types - intermediate stage between signals and axioms.
 */

import type { SignalSource } from './signal.js';
import type { SoulCraftDimension } from './dimensions.js';

export interface PrincipleProvenance {
  signals: Array<{
    id: string;
    similarity: number;
    source: SignalSource;
  }>;
  merged_at: string; // ISO timestamp
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
  similarity_threshold: number; // Default 0.85
  derived_from: PrincipleProvenance;
  history: PrincipleEvent[];
}
