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

/**
 * PBD Stage 5: Structured tension reference between axioms.
 * Preserves description and severity for SOUL.md output.
 */
export interface AxiomTension {
  /** ID of the axiom this one is in tension with */
  axiomId: string;
  /** Description of the tension (1-2 sentences from LLM) */
  description: string;
  /** Severity based on dimension and tier */
  severity: 'high' | 'medium' | 'low';
}

export interface AxiomEvent {
  type: 'created' | 'refined' | 'elevated';
  timestamp: string;
  details: string;
}

/**
 * PBD Stage 15: Minimum requirements for axiom promotion.
 * Implements anti-echo-chamber protection.
 */
export interface PromotionCriteria {
  /** Minimum number of supporting principles */
  minPrincipleCount: number; // Default: 3

  /** Minimum distinct provenance types */
  minProvenanceDiversity: number; // Default: 2

  /** Require external OR questioning evidence (anti-echo-chamber) */
  requireExternalOrQuestioning: boolean; // Default: true
}

export const DEFAULT_PROMOTION_CRITERIA: PromotionCriteria = {
  minPrincipleCount: 3,
  minProvenanceDiversity: 2,
  requireExternalOrQuestioning: true,
};

export interface Axiom {
  id: string;
  text: string;
  tier: AxiomTier;
  dimension: SoulCraftDimension;
  canonical: CanonicalForm;
  derived_from: AxiomProvenance;
  history: AxiomEvent[];

  /**
   * PBD Stage 5: Detected tensions with other axioms.
   * Empty array if no tensions detected.
   */
  tensions?: AxiomTension[];

  /**
   * PBD Stage 15: Whether this axiom meets anti-echo-chamber promotion criteria.
   */
  promotable?: boolean;

  /**
   * PBD Stage 15: Reason if not promotable.
   */
  promotionBlocker?: string;

  /**
   * PBD Stage 15: Provenance diversity count (how many distinct provenance types).
   */
  provenanceDiversity?: number;
}
