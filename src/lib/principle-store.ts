/**
 * Principle store with LLM-based semantic matching for signal accumulation.
 *
 * v0.2.0: Migrated from embedding-based cosine similarity to LLM-based
 * semantic matching. This eliminates the need for embedding computations
 * and centroid updates - similarity is now determined by LLM semantic comparison.
 *
 * Cross-Reference: docs/plans/2026-02-12-llm-based-similarity.md (Stage 4)
 */

import { randomUUID } from 'node:crypto';
import type { Signal, GeneralizedSignal, SignalImportance } from '../types/signal.js';
import type { Principle, PrincipleProvenance, PrincipleCentrality } from '../types/principle.js';
import type { SoulCraftDimension } from '../types/dimensions.js';
import type { LLMProvider } from '../types/llm.js';
import { findBestMatch, DEFAULT_MATCH_THRESHOLD } from './matcher.js';
import { classifyDimension } from './semantic-classifier.js';
import { logger } from './logger.js';

/**
 * PBD Stage 4: Importance weight factors for principle strength calculation.
 *
 * M-1 FIX: Documented rationale for weight values.
 * Values derived from PBD methodology (docs/architecture/synthesis-philosophy.md):
 * - Core signals (fundamental beliefs) are strong identity anchors → 1.5x multiplier
 * - Supporting signals (evidence/examples) are standard contributions → 1.0x multiplier
 * - Peripheral signals (tangential mentions) are weak contributors → 0.5x multiplier
 *
 * These ratios ensure core values dominate principle strength while allowing
 * peripheral signals to contribute without overwhelming the synthesis.
 */
const IMPORTANCE_WEIGHT: Record<SignalImportance, number> = {
  core: 1.5, // Fundamental beliefs - strong identity anchors
  supporting: 1.0, // Evidence/examples - standard contribution
  peripheral: 0.5, // Tangential mentions - weak contribution
};

/**
 * PBD Stage 7: Centrality thresholds based on core signal ratio.
 *
 * M-1 FIX: Documented rationale for threshold values.
 * I-1 FIX: Renamed centrality tiers to avoid overlap with importance names.
 * M-3 FIX: These constants are internal by design (not exported).
 *
 * Values calibrated for meaningful centrality distinctions:
 * - DEFINING (≥50% core): Identity-defining principles (majority core beliefs)
 * - SIGNIFICANT (≥20% core): Important principles with notable core presence
 * - CONTEXTUAL (<20% core): Context-dependent principles (mostly peripheral)
 *
 * Why internal: Thresholds affect synthesis output quality. Exposing them
 * invites premature tuning. Adjust only after validating with real data.
 * See PBD_VOCABULARY.md for centrality semantics.
 */
const DEFINING_THRESHOLD = 0.5; // ≥50% core signals = defining
const SIGNIFICANT_THRESHOLD = 0.2; // ≥20% core signals = significant

/**
 * PBD Stage 7: Compute centrality based on signal importance distribution.
 * I-1 FIX: Uses defining/significant/contextual (not foundational/core/supporting)
 * to avoid confusion with signal importance levels.
 */
function computeCentrality(
  signals: Array<{ importance?: SignalImportance }>
): PrincipleCentrality {
  // M-4 FIX: Log edge case for debugging data integrity issues
  if (signals.length === 0) {
    logger.debug('[centrality] Empty signals array, defaulting to contextual');
    return 'contextual';
  }

  const coreCount = signals.filter((s) => s.importance === 'core').length;
  const coreRatio = coreCount / signals.length;

  if (coreRatio >= DEFINING_THRESHOLD) return 'defining';
  if (coreRatio >= SIGNIFICANT_THRESHOLD) return 'significant';
  return 'contextual';
}

export interface PrincipleStore {
  principles: Map<string, Principle>;
  addSignal(signal: Signal, dimension?: SoulCraftDimension): Promise<AddSignalResult>;
  /** Add a generalized signal (uses generalized text for principle, preserves original in provenance) */
  addGeneralizedSignal(generalizedSignal: GeneralizedSignal, dimension?: SoulCraftDimension): Promise<AddSignalResult>;
  getPrinciples(): Principle[];
  getPrinciplesAboveN(threshold: number): Principle[];
  /** Update similarity threshold for future signal matching (N-counts preserved) */
  setThreshold(threshold: number): void;
  /**
   * PBD Stage 6: Get signals that didn't cluster to any principle.
   * These are signals where bestSimilarityToExisting < threshold.
   */
  getOrphanedSignals(): OrphanedSignal[];
}

export interface AddSignalResult {
  action: 'created' | 'reinforced' | 'skipped';
  principleId: string;
  similarity: number;
  /**
   * M-1 FIX: Best similarity to ANY existing principle (for orphan tracking).
   * When action='created' and this is below threshold, the signal is orphaned.
   */
  bestSimilarityToExisting: number;
}

/**
 * PBD Stage 6: Orphaned signal with context about why it didn't cluster.
 */
export interface OrphanedSignal {
  /** Original signal that didn't cluster */
  signal: Signal;
  /** Best similarity achieved (below threshold) */
  bestSimilarity: number;
  /** The principle it created (single-signal principle) */
  principleId: string;
}

/**
 * v0.2.0: Centroid-based embedding logic removed.
 *
 * Previously, updateCentroid() computed weighted average of embeddings.
 * Now, we use LLM-based semantic matching via findBestMatch().
 *
 * When merging similar principles, we keep the text from the principle
 * with highest strength (more signal confirmations = more representative).
 *
 * @see docs/plans/2026-02-12-llm-based-similarity.md (Stage 4)
 */

/**
 * Generate unique ID for principles.
 * IM-6 FIX: Use crypto.randomUUID() for consistency with signal-extractor and compressor.
 */
function generatePrincipleId(): string {
  return `pri_${randomUUID()}`;
}

/**
 * Create a new principle store.
 *
 * @param llm - LLM provider for semantic dimension classification and matching
 * @param similarityThreshold - Threshold for principle matching (default 0.7 = "medium" LLM confidence)
 * @see docs/issues/2026-02-10-generalized-signal-threshold-gap.md
 * @see docs/plans/2026-02-12-llm-based-similarity.md (Stage 4)
 */
export function createPrincipleStore(
  llm: LLMProvider,
  initialThreshold: number = DEFAULT_MATCH_THRESHOLD
): PrincipleStore {
  const principles = new Map<string, Principle>();
  let similarityThreshold = initialThreshold;

  // Stage 1b: Track processed signal IDs to prevent duplicates
  const processedSignalIds = new Set<string>();

  // PBD Stage 6: Track orphaned signals (didn't cluster to existing principle)
  const orphanedSignals: OrphanedSignal[] = [];

  /**
   * Update similarity threshold for future signal matching.
   * Existing principles and their N-counts are preserved.
   */
  function setThreshold(threshold: number): void {
    similarityThreshold = threshold;
  }

  async function addSignal(
    signal: Signal,
    dimension?: SoulCraftDimension
  ): Promise<AddSignalResult> {
    // I-3 FIX: Check for duplicate signal ID (same pattern as addGeneralizedSignal)
    if (processedSignalIds.has(signal.id)) {
      logger.debug(`[addSignal] Skipping duplicate signal ${signal.id}`);
      return { action: 'skipped', principleId: '', similarity: 0, bestSimilarityToExisting: -1 };
    }

    // Bootstrap: first signal always creates first principle
    if (principles.size === 0) {
      const principleId = generatePrincipleId();
      // If dimension provided, use it; otherwise classify via LLM
      const effectiveDimension = dimension ?? await classifyDimension(llm, signal.text);

      // PBD Stage 4: Calculate importance-weighted initial strength
      const importanceWeight = IMPORTANCE_WEIGHT[signal.importance ?? 'supporting'];
      const initialStrength = signal.confidence * importanceWeight;

      const provenance: PrincipleProvenance = {
        signals: [
          {
            id: signal.id,
            similarity: 1.0,
            source: signal.source,
            // Twin I-2 FIX: Conditionally include stance/provenance (exactOptionalPropertyTypes)
            ...(signal.stance && { stance: signal.stance }),
            ...(signal.provenance && { provenance: signal.provenance }),
            ...(signal.importance && { importance: signal.importance }),
          },
        ],
        merged_at: new Date().toISOString(),
      };

      // v0.2.0: Principle created without embedding field (optional now)
      const principle: Principle = {
        id: principleId,
        text: signal.text,
        dimension: effectiveDimension,
        strength: Math.min(1.0, initialStrength), // PBD Stage 4
        n_count: 1,
        derived_from: provenance,
        history: [
          {
            type: 'created',
            timestamp: new Date().toISOString(),
            details: `Created from signal ${signal.id} (importance: ${signal.importance ?? 'supporting'})`,
          },
        ],
        // PBD Stage 7: Initial centrality from single signal
        centrality: computeCentrality(signal.importance ? [{ importance: signal.importance }] : [{}]),
      };

      principles.set(principleId, principle);
      processedSignalIds.add(signal.id); // I-3 FIX: Track after successful completion

      // PBD Stage 6: Bootstrap is not an orphan (no existing principles to compare to)
      return { action: 'created', principleId, similarity: 1.0, bestSimilarityToExisting: -1 };
    }

    // v0.2.0: Use LLM-based semantic matching instead of embedding cosine similarity
    const principleList = Array.from(principles.values());
    const matchResult = await findBestMatch(signal.text, principleList, llm, similarityThreshold);

    // Diagnostic: Log matching decision
    const matchDecision = matchResult.isMatch ? 'MATCH' : 'NO_MATCH';
    logger.debug(`[matching] ${matchDecision}: confidence=${matchResult.confidence.toFixed(3)} threshold=${similarityThreshold.toFixed(2)} signal="${signal.text.slice(0, 50)}..."`);

    // If match found, reinforce existing principle
    if (matchResult.isMatch && matchResult.principle) {
      const bestPrinciple = matchResult.principle;
      const bestConfidence = matchResult.confidence;

      // PBD Stage 4: Calculate importance-weighted strength increment
      const importanceWeight = IMPORTANCE_WEIGHT[signal.importance ?? 'supporting'];

      // v0.2.0: Update principle without centroid (no embedding update needed)
      bestPrinciple.n_count = bestPrinciple.n_count + 1;
      bestPrinciple.strength = Math.min(
        1.0,
        bestPrinciple.strength + signal.confidence * 0.1 * importanceWeight // PBD Stage 4
      );
      bestPrinciple.derived_from.signals.push({
        id: signal.id,
        similarity: bestConfidence,
        source: signal.source,
        // Twin I-2 FIX: Conditionally include stance/provenance (exactOptionalPropertyTypes)
        ...(signal.stance && { stance: signal.stance }),
        ...(signal.provenance && { provenance: signal.provenance }),
        ...(signal.importance && { importance: signal.importance }),
      });

      // PBD Stage 7: Recompute centrality after adding signal
      bestPrinciple.centrality = computeCentrality(bestPrinciple.derived_from.signals);

      bestPrinciple.history.push({
        type: 'reinforced',
        timestamp: new Date().toISOString(),
        details: `Reinforced by signal ${signal.id} (confidence: ${bestConfidence.toFixed(3)}, importance: ${signal.importance ?? 'supporting'})`,
      });

      processedSignalIds.add(signal.id); // I-3 FIX: Track after successful completion

      return {
        action: 'reinforced',
        principleId: bestPrinciple.id,
        similarity: bestConfidence,
        bestSimilarityToExisting: bestConfidence, // PBD Stage 6
      };
    }

    // Create new principle candidate
    const principleId = generatePrincipleId();
    // If dimension provided, use it; otherwise classify via LLM
    const effectiveDimension = dimension ?? await classifyDimension(llm, signal.text);

    // PBD Stage 4: Calculate importance-weighted initial strength
    const importanceWeight = IMPORTANCE_WEIGHT[signal.importance ?? 'supporting'];
    const initialStrength = signal.confidence * importanceWeight;

    const provenance: PrincipleProvenance = {
      signals: [
        {
          id: signal.id,
          similarity: 1.0,
          source: signal.source,
          // Twin I-2 FIX: Conditionally include stance/provenance (exactOptionalPropertyTypes)
          ...(signal.stance && { stance: signal.stance }),
          ...(signal.provenance && { provenance: signal.provenance }),
          ...(signal.importance && { importance: signal.importance }),
        },
      ],
      merged_at: new Date().toISOString(),
    };

    // v0.2.0: Principle created without embedding field (optional now)
    const principle: Principle = {
      id: principleId,
      text: signal.text,
      dimension: effectiveDimension,
      strength: Math.min(1.0, initialStrength), // PBD Stage 4
      n_count: 1,
      derived_from: provenance,
      history: [
        {
          type: 'created',
          timestamp: new Date().toISOString(),
          details: `Created from signal ${signal.id} (best confidence was ${matchResult.confidence.toFixed(3)}, importance: ${signal.importance ?? 'supporting'})`,
        },
      ],
      // PBD Stage 7: Initial centrality from single signal
      centrality: computeCentrality(signal.importance ? [{ importance: signal.importance }] : [{}]),
    };

    principles.set(principleId, principle);

    // PBD Stage 6: Track as orphan if confidence was below threshold
    if (matchResult.confidence < similarityThreshold) {
      orphanedSignals.push({
        signal,
        bestSimilarity: matchResult.confidence,
        principleId,
      });
      logger.debug(`[orphan] Signal ${signal.id} is orphaned (best confidence: ${matchResult.confidence.toFixed(3)} < threshold: ${similarityThreshold})`);
    }

    processedSignalIds.add(signal.id); // I-3 FIX: Track after successful completion

    return { action: 'created', principleId, similarity: matchResult.confidence, bestSimilarityToExisting: matchResult.confidence };
  }

  /**
   * Add a generalized signal to the principle store.
   * Uses generalized text for principle text and LLM matching,
   * while preserving original signal text in provenance.
   *
   * Stage 1b: Includes deduplication - signals with same ID are skipped.
   * v0.2.0: Migrated from embedding-based to LLM-based semantic matching.
   */
  async function addGeneralizedSignal(
    generalizedSignal: GeneralizedSignal,
    dimension?: SoulCraftDimension
  ): Promise<AddSignalResult> {
    // v0.2.0: embedding field is now unused (kept in GeneralizedSignal for backward compat)
    const { original: signal, generalizedText, provenance } = generalizedSignal;

    // Stage 1b: Check for duplicate signal ID
    if (processedSignalIds.has(signal.id)) {
      logger.warn(`[principle-store] Duplicate signal ID detected: ${signal.id} - skipping`);
      return { action: 'skipped', principleId: '', similarity: 0, bestSimilarityToExisting: -1 };
    }
    // Note: processedSignalIds.add() moved to after async operations complete (I-3 fix)

    // Bootstrap: first signal always creates first principle
    if (principles.size === 0) {
      const principleId = generatePrincipleId();
      const effectiveDimension = dimension ?? signal.dimension ?? await classifyDimension(llm, generalizedText);

      // PBD Stage 4: Calculate importance-weighted initial strength
      const importanceWeight = IMPORTANCE_WEIGHT[signal.importance ?? 'supporting'];
      const initialStrength = signal.confidence * importanceWeight;

      const principleProvenance: PrincipleProvenance = {
        signals: [
          {
            id: signal.id,
            similarity: 1.0,
            source: signal.source,
            original_text: signal.text,
            // Twin I-2 FIX: Conditionally include stance/provenance (exactOptionalPropertyTypes)
            ...(signal.stance && { stance: signal.stance }),
            ...(signal.provenance && { provenance: signal.provenance }),
            ...(signal.importance && { importance: signal.importance }),
          },
        ],
        merged_at: new Date().toISOString(),
        generalization: provenance,
      };

      // v0.2.0: Principle created without embedding field (optional now)
      const principle: Principle = {
        id: principleId,
        text: generalizedText, // Use generalized text
        dimension: effectiveDimension,
        strength: Math.min(1.0, initialStrength), // PBD Stage 4: Importance-weighted
        n_count: 1,
        derived_from: principleProvenance,
        history: [
          {
            type: 'created',
            timestamp: new Date().toISOString(),
            details: `Created from signal ${signal.id} (generalized${provenance.used_fallback ? ', fallback' : ''}, importance: ${signal.importance ?? 'supporting'})`,
          },
        ],
        // PBD Stage 7: Initial centrality from single signal
        centrality: computeCentrality(signal.importance ? [{ importance: signal.importance }] : [{}]),
      };

      principles.set(principleId, principle);
      processedSignalIds.add(signal.id); // I-3: Add after successful completion

      // PBD Stage 6: Bootstrap is not an orphan (no existing principles to compare to)
      return { action: 'created', principleId, similarity: 1.0, bestSimilarityToExisting: -1 };
    }

    // v0.2.0: Use LLM-based semantic matching instead of embedding cosine similarity
    const principleList = Array.from(principles.values());
    const matchResult = await findBestMatch(generalizedText, principleList, llm, similarityThreshold);

    // Diagnostic: Log matching decision
    const matchDecision = matchResult.isMatch ? 'MATCH' : 'NO_MATCH';
    logger.debug(`[matching] ${matchDecision}: confidence=${matchResult.confidence.toFixed(3)} threshold=${similarityThreshold.toFixed(2)} generalized="${generalizedText.slice(0, 50)}..."`);

    // If match found, reinforce existing principle
    if (matchResult.isMatch && matchResult.principle) {
      const bestPrinciple = matchResult.principle;
      const bestConfidence = matchResult.confidence;

      // PBD Stage 4: Calculate importance-weighted strength increment
      const importanceWeight = IMPORTANCE_WEIGHT[signal.importance ?? 'supporting'];

      // v0.2.0: Update principle without centroid (no embedding update needed)
      bestPrinciple.n_count = bestPrinciple.n_count + 1;
      bestPrinciple.strength = Math.min(
        1.0,
        bestPrinciple.strength + signal.confidence * 0.1 * importanceWeight // PBD Stage 4
      );
      bestPrinciple.derived_from.signals.push({
        id: signal.id,
        similarity: bestConfidence,
        source: signal.source,
        original_text: signal.text,
        // Twin I-2 FIX: Conditionally include stance/provenance (exactOptionalPropertyTypes)
        ...(signal.stance && { stance: signal.stance }),
        ...(signal.provenance && { provenance: signal.provenance }),
        ...(signal.importance && { importance: signal.importance }),
      });

      // PBD Stage 7: Recompute centrality after adding signal
      bestPrinciple.centrality = computeCentrality(bestPrinciple.derived_from.signals);

      bestPrinciple.history.push({
        type: 'reinforced',
        timestamp: new Date().toISOString(),
        details: `Reinforced by signal ${signal.id} (confidence: ${bestConfidence.toFixed(3)}, generalized${provenance.used_fallback ? ', fallback' : ''}, importance: ${signal.importance ?? 'supporting'})`,
      });

      processedSignalIds.add(signal.id); // I-3: Add after successful completion
      return {
        action: 'reinforced',
        principleId: bestPrinciple.id,
        similarity: bestConfidence,
        bestSimilarityToExisting: bestConfidence, // PBD Stage 6
      };
    }

    // Create new principle candidate
    const principleId = generatePrincipleId();
    const effectiveDimension = dimension ?? signal.dimension ?? await classifyDimension(llm, generalizedText);

    // PBD Stage 4: Calculate importance-weighted initial strength
    const importanceWeight = IMPORTANCE_WEIGHT[signal.importance ?? 'supporting'];
    const initialStrength = signal.confidence * importanceWeight;

    const principleProvenance: PrincipleProvenance = {
      signals: [
        {
          id: signal.id,
          similarity: 1.0,
          source: signal.source,
          original_text: signal.text,
          // Twin I-2 FIX: Conditionally include stance/provenance (exactOptionalPropertyTypes)
          ...(signal.stance && { stance: signal.stance }),
          ...(signal.provenance && { provenance: signal.provenance }),
          ...(signal.importance && { importance: signal.importance }),
        },
      ],
      merged_at: new Date().toISOString(),
      generalization: provenance,
    };

    // v0.2.0: Principle created without embedding field (optional now)
    const principle: Principle = {
      id: principleId,
      text: generalizedText, // Use generalized text
      dimension: effectiveDimension,
      strength: Math.min(1.0, initialStrength), // PBD Stage 4: Importance-weighted
      n_count: 1,
      derived_from: principleProvenance,
      history: [
        {
          type: 'created',
          timestamp: new Date().toISOString(),
          details: `Created from signal ${signal.id} (best confidence was ${matchResult.confidence.toFixed(3)}, generalized${provenance.used_fallback ? ', fallback' : ''}, importance: ${signal.importance ?? 'supporting'})`,
        },
      ],
      // PBD Stage 7: Initial centrality from single signal
      centrality: computeCentrality(signal.importance ? [{ importance: signal.importance }] : [{}]),
    };

    principles.set(principleId, principle);
    processedSignalIds.add(signal.id); // I-3: Add after successful completion

    // PBD Stage 6: Track as orphan if confidence was below threshold
    if (matchResult.confidence < similarityThreshold) {
      orphanedSignals.push({
        signal,
        bestSimilarity: matchResult.confidence,
        principleId,
      });
      logger.debug(`[orphan] Generalized signal ${signal.id} is orphaned (best confidence: ${matchResult.confidence.toFixed(3)} < threshold: ${similarityThreshold})`);
    }

    return { action: 'created', principleId, similarity: matchResult.confidence, bestSimilarityToExisting: matchResult.confidence };
  }

  /**
   * PBD Stage 6: Get signals that didn't cluster to any principle.
   */
  function getOrphanedSignals(): OrphanedSignal[] {
    return [...orphanedSignals];
  }

  function getPrinciples(): Principle[] {
    return Array.from(principles.values());
  }

  function getPrinciplesAboveN(threshold: number): Principle[] {
    return Array.from(principles.values()).filter((p) => p.n_count >= threshold);
  }

  return {
    principles,
    addSignal,
    addGeneralizedSignal,
    getPrinciples,
    getPrinciplesAboveN,
    setThreshold,
    getOrphanedSignals, // PBD Stage 6
  };
}
