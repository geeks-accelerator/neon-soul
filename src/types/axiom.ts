/**
 * Axiom types - highest tier of compressed soul identity.
 */

import type { SoulCraftDimension } from './dimensions.js';

export type AxiomTier = 'core' | 'domain' | 'emerging';

/**
 * Canonical form for axiom representation.
 *
 * Two forms are stored:
 * - native: Plain text principle (e.g., "Prioritize honesty over performance")
 * - notated: With CJK/emoji/math notation (e.g., "🎯 誠: honesty > performance")
 *
 * The LLM generates the notated form directly, choosing appropriate notation
 * based on semantic meaning. No constrained vocabulary mapping.
 */
export interface CanonicalForm {
  /** Plain text principle */
  native: string;
  /** With CJK anchor, emoji indicator, and math notation as appropriate */
  notated: string;
}

export interface AxiomProvenance {
  principles: Array<{
    id: string;
    text: string;
    n_count: number;
  }>;
  promoted_at: string; // ISO timestamp
}

export interface AxiomEvent {
  type: 'created' | 'refined' | 'elevated';
  timestamp: string;
  details: string;
}

export interface Axiom {
  id: string;
  text: string;
  tier: AxiomTier;
  dimension: SoulCraftDimension;
  canonical: CanonicalForm;
  derived_from: AxiomProvenance;
  history: AxiomEvent[];
}
