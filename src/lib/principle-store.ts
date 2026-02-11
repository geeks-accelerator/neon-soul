/**
 * Principle store with embedding index for signal accumulation and matching.
 * Handles bootstrap (first signal creates first principle) and centroid updates.
 */

import { randomUUID } from 'node:crypto';
import type { Signal, GeneralizedSignal, SignalImportance } from '../types/signal.js';
import type { Principle, PrincipleProvenance } from '../types/principle.js';
import type { SoulCraftDimension } from '../types/dimensions.js';
import type { LLMProvider } from '../types/llm.js';
import { cosineSimilarity } from './matcher.js';
import { classifyDimension } from './semantic-classifier.js';
import { logger } from './logger.js';

/**
 * PBD Stage 4: Importance weight factors for principle strength calculation.
 * Core signals boost principle strength 1.5x, peripheral reduce to 0.5x.
 */
const IMPORTANCE_WEIGHT: Record<SignalImportance, number> = {
  core: 1.5, // Boost core signals
  supporting: 1.0, // Normal weight
  peripheral: 0.5, // Reduce peripheral influence
};

export interface PrincipleStore {
  principles: Map<string, Principle>;
  addSignal(signal: Signal, dimension?: SoulCraftDimension): Promise<AddSignalResult>;
  /** Add a generalized signal (uses generalized text for principle, preserves original in provenance) */
  addGeneralizedSignal(generalizedSignal: GeneralizedSignal, dimension?: SoulCraftDimension): Promise<AddSignalResult>;
  getPrinciples(): Principle[];
  getPrinciplesAboveN(threshold: number): Principle[];
  /** Update similarity threshold for future signal matching (N-counts preserved) */
  setThreshold(threshold: number): void;
}

export interface AddSignalResult {
  action: 'created' | 'reinforced' | 'skipped';
  principleId: string;
  similarity: number;
}

/**
 * Normalize a vector to unit length (L2 norm).
 */
function normalize(vector: number[]): number[] {
  let sumSq = 0;
  for (const v of vector) {
    sumSq += v * v;
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vector;
  return vector.map((v) => v / norm);
}

/**
 * Update centroid by incorporating a new signal.
 * Returns L2-normalized centroid.
 */
function updateCentroid(
  currentCentroid: number[],
  currentCount: number,
  newEmbedding: number[]
): number[] {
  const newCentroid = currentCentroid.map((v, i) => {
    const newVal = newEmbedding[i];
    if (newVal === undefined) return v;
    return (v * currentCount + newVal) / (currentCount + 1);
  });
  return normalize(newCentroid);
}

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
 * @param llm - LLM provider for semantic dimension classification
 * @param similarityThreshold - Threshold for principle matching (default 0.75)
 * @see docs/issues/2026-02-10-generalized-signal-threshold-gap.md
 */
export function createPrincipleStore(
  llm: LLMProvider,
  initialThreshold: number = 0.75
): PrincipleStore {
  const principles = new Map<string, Principle>();
  let similarityThreshold = initialThreshold;

  // Stage 1b: Track processed signal IDs to prevent duplicates
  const processedSignalIds = new Set<string>();

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
          },
        ],
        merged_at: new Date().toISOString(),
      };

      const principle: Principle = {
        id: principleId,
        text: signal.text,
        dimension: effectiveDimension,
        strength: Math.min(1.0, initialStrength), // PBD Stage 4
        n_count: 1,
        embedding: [...signal.embedding],
        similarity_threshold: similarityThreshold,
        derived_from: provenance,
        history: [
          {
            type: 'created',
            timestamp: new Date().toISOString(),
            details: `Created from signal ${signal.id} (importance: ${signal.importance ?? 'supporting'})`,
          },
        ],
      };

      principles.set(principleId, principle);
      return { action: 'created', principleId, similarity: 1.0 };
    }

    // Find best match among existing principles
    let bestPrinciple: Principle | null = null;
    let bestSimilarity = -1;

    for (const principle of principles.values()) {
      const similarity = cosineSimilarity(signal.embedding, principle.embedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestPrinciple = principle;
      }
    }

    // Diagnostic: Log matching decision
    const matchDecision = bestSimilarity >= similarityThreshold ? 'MATCH' : 'NO_MATCH';
    logger.debug(`[matching] ${matchDecision}: similarity=${bestSimilarity.toFixed(3)} threshold=${similarityThreshold.toFixed(2)} signal="${signal.text.slice(0, 50)}..."`);

    // If similarity >= threshold, reinforce existing principle
    if (bestPrinciple && bestSimilarity >= similarityThreshold) {
      const currentCount = bestPrinciple.n_count;
      const newCentroid = updateCentroid(
        bestPrinciple.embedding,
        currentCount,
        signal.embedding
      );

      // PBD Stage 4: Calculate importance-weighted strength increment
      const importanceWeight = IMPORTANCE_WEIGHT[signal.importance ?? 'supporting'];

      // Update principle
      bestPrinciple.embedding = newCentroid;
      bestPrinciple.n_count = currentCount + 1;
      bestPrinciple.strength = Math.min(
        1.0,
        bestPrinciple.strength + signal.confidence * 0.1 * importanceWeight // PBD Stage 4
      );
      bestPrinciple.derived_from.signals.push({
        id: signal.id,
        similarity: bestSimilarity,
        source: signal.source,
        // Twin I-2 FIX: Conditionally include stance/provenance (exactOptionalPropertyTypes)
        ...(signal.stance && { stance: signal.stance }),
        ...(signal.provenance && { provenance: signal.provenance }),
      });
      bestPrinciple.history.push({
        type: 'reinforced',
        timestamp: new Date().toISOString(),
        details: `Reinforced by signal ${signal.id} (similarity: ${bestSimilarity.toFixed(3)}, importance: ${signal.importance ?? 'supporting'})`,
      });

      return {
        action: 'reinforced',
        principleId: bestPrinciple.id,
        similarity: bestSimilarity,
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
          ...(signal.provenance && { provenance: signal.provenance })
        },
      ],
      merged_at: new Date().toISOString(),
    };

    const principle: Principle = {
      id: principleId,
      text: signal.text,
      dimension: effectiveDimension,
      strength: Math.min(1.0, initialStrength), // PBD Stage 4
      n_count: 1,
      embedding: [...signal.embedding],
      similarity_threshold: similarityThreshold,
      derived_from: provenance,
      history: [
        {
          type: 'created',
          timestamp: new Date().toISOString(),
          details: `Created from signal ${signal.id} (best match was ${bestSimilarity.toFixed(3)}, importance: ${signal.importance ?? 'supporting'})`,
        },
      ],
    };

    principles.set(principleId, principle);
    return { action: 'created', principleId, similarity: bestSimilarity };
  }

  /**
   * Add a generalized signal to the principle store.
   * Uses generalized text for principle text and matching,
   * while preserving original signal text in provenance.
   *
   * Stage 1b: Includes deduplication - signals with same ID are skipped.
   */
  async function addGeneralizedSignal(
    generalizedSignal: GeneralizedSignal,
    dimension?: SoulCraftDimension
  ): Promise<AddSignalResult> {
    const { original: signal, generalizedText, embedding, provenance } = generalizedSignal;

    // Stage 1b: Check for duplicate signal ID
    if (processedSignalIds.has(signal.id)) {
      logger.warn(`[principle-store] Duplicate signal ID detected: ${signal.id} - skipping`);
      return { action: 'skipped', principleId: '', similarity: 0 };
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
            ...(signal.provenance && { provenance: signal.provenance })
          },
        ],
        merged_at: new Date().toISOString(),
        generalization: provenance,
      };

      const principle: Principle = {
        id: principleId,
        text: generalizedText, // Use generalized text
        dimension: effectiveDimension,
        strength: Math.min(1.0, initialStrength), // PBD Stage 4: Importance-weighted
        n_count: 1,
        embedding: [...embedding], // Use embedding of generalized text
        similarity_threshold: similarityThreshold,
        derived_from: principleProvenance,
        history: [
          {
            type: 'created',
            timestamp: new Date().toISOString(),
            details: `Created from signal ${signal.id} (generalized${provenance.used_fallback ? ', fallback' : ''}, importance: ${signal.importance ?? 'supporting'})`,
          },
        ],
      };

      principles.set(principleId, principle);
      processedSignalIds.add(signal.id); // I-3: Add after successful completion
      return { action: 'created', principleId, similarity: 1.0 };
    }

    // Find best match among existing principles (using generalized embedding)
    let bestPrinciple: Principle | null = null;
    let bestSimilarity = -1;

    for (const principle of principles.values()) {
      const similarity = cosineSimilarity(embedding, principle.embedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestPrinciple = principle;
      }
    }

    // Diagnostic: Log matching decision
    const matchDecision = bestSimilarity >= similarityThreshold ? 'MATCH' : 'NO_MATCH';
    logger.debug(`[matching] ${matchDecision}: similarity=${bestSimilarity.toFixed(3)} threshold=${similarityThreshold.toFixed(2)} generalized="${generalizedText.slice(0, 50)}..."`);

    // If similarity >= threshold, reinforce existing principle
    if (bestPrinciple && bestSimilarity >= similarityThreshold) {
      const currentCount = bestPrinciple.n_count;
      const newCentroid = updateCentroid(
        bestPrinciple.embedding,
        currentCount,
        embedding
      );

      // PBD Stage 4: Calculate importance-weighted strength increment
      const importanceWeight = IMPORTANCE_WEIGHT[signal.importance ?? 'supporting'];

      // Update principle
      bestPrinciple.embedding = newCentroid;
      bestPrinciple.n_count = currentCount + 1;
      bestPrinciple.strength = Math.min(
        1.0,
        bestPrinciple.strength + signal.confidence * 0.1 * importanceWeight // PBD Stage 4
      );
      bestPrinciple.derived_from.signals.push({
        id: signal.id,
        similarity: bestSimilarity,
        source: signal.source,
        original_text: signal.text,
        // Twin I-2 FIX: Conditionally include stance/provenance (exactOptionalPropertyTypes)
        ...(signal.stance && { stance: signal.stance }),
        ...(signal.provenance && { provenance: signal.provenance })
      });
      bestPrinciple.history.push({
        type: 'reinforced',
        timestamp: new Date().toISOString(),
        details: `Reinforced by signal ${signal.id} (similarity: ${bestSimilarity.toFixed(3)}, generalized${provenance.used_fallback ? ', fallback' : ''}, importance: ${signal.importance ?? 'supporting'})`,
      });

      processedSignalIds.add(signal.id); // I-3: Add after successful completion
      return {
        action: 'reinforced',
        principleId: bestPrinciple.id,
        similarity: bestSimilarity,
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
        },
      ],
      merged_at: new Date().toISOString(),
      generalization: provenance,
    };

    const principle: Principle = {
      id: principleId,
      text: generalizedText, // Use generalized text
      dimension: effectiveDimension,
      strength: Math.min(1.0, initialStrength), // PBD Stage 4: Importance-weighted
      n_count: 1,
      embedding: [...embedding], // Use embedding of generalized text
      similarity_threshold: similarityThreshold,
      derived_from: principleProvenance,
      history: [
        {
          type: 'created',
          timestamp: new Date().toISOString(),
          details: `Created from signal ${signal.id} (best match was ${bestSimilarity.toFixed(3)}, generalized${provenance.used_fallback ? ', fallback' : ''}, importance: ${signal.importance ?? 'supporting'})`,
        },
      ],
    };

    principles.set(principleId, principle);
    processedSignalIds.add(signal.id); // I-3: Add after successful completion
    return { action: 'created', principleId, similarity: bestSimilarity };
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
  };
}
