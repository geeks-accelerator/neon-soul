/**
 * Reflective Loop for Iterative Soul Synthesis
 *
 * Implements the iterative synthesis approach from the Reflective Manifold
 * Trajectory Metrics research. Each iteration refines principles and axioms
 * until convergence or max iterations reached.
 *
 * Usage:
 *   const result = await runReflectiveLoop(signals, options);
 *
 * Convergence detection:
 *   - Centroid drift below threshold (0.02)
 *   - Principle count stabilizes
 *   - Axiom set consistent across iterations
 */

import { createPrincipleStore } from './principle-store.js';
import { compressPrinciples } from './compressor.js';
import { TrajectoryTracker, type TrajectoryMetrics } from './trajectory.js';
import { embed } from './embeddings.js';
import { cosineSimilarity } from './matcher.js';
import type { Signal } from '../types/signal.js';
import type { Principle } from '../types/principle.js';
import type { Axiom } from '../types/axiom.js';
import type { LLMProvider } from '../types/llm.js';

/**
 * Reflective loop configuration.
 */
export interface ReflectiveLoopConfig {
  /** Maximum iterations before stopping */
  maxIterations: number;
  /** Convergence threshold (cosine similarity of axiom set) */
  convergenceThreshold: number;
  /** Minimum drift to consider stable */
  stabilizationThreshold: number;
  /** N-count threshold for axiom promotion */
  axiomNThreshold: number;
  /** Similarity threshold for principle matching */
  principleThreshold: number;
  /** Progress callback */
  onIteration?: (iteration: IterationResult) => void;
}

/**
 * Default reflective loop configuration.
 */
export const DEFAULT_REFLECTIVE_CONFIG: ReflectiveLoopConfig = {
  maxIterations: 5,
  convergenceThreshold: 0.95,
  stabilizationThreshold: 0.02,
  axiomNThreshold: 3,
  principleThreshold: 0.85,
};

/**
 * Result of a single iteration.
 * MN-1 FIX: Stores only metrics, not full arrays, to reduce memory pressure.
 */
export interface IterationResult {
  /** Iteration number (1-indexed) */
  iteration: number;
  /** Number of principles after this iteration */
  principleCount: number;
  /** Number of axioms after this iteration */
  axiomCount: number;
  /** Centroid drift from previous iteration */
  centroidDrift: number;
  /** Whether convergence detected */
  converged: boolean;
  /** Embedding of axiom set (for convergence tracking) */
  axiomSetEmbedding: number[];
  /** Duration of iteration (ms) */
  durationMs: number;
}

/**
 * Final result of reflective loop.
 */
export interface ReflectiveLoopResult {
  /** Final principles */
  principles: Principle[];
  /** Final axioms */
  axioms: Axiom[];
  /** Unconverged principles (N < threshold) */
  unconverged: Principle[];
  /** All iteration results */
  iterations: IterationResult[];
  /** Trajectory metrics */
  trajectoryMetrics: TrajectoryMetrics;
  /** Total iterations run */
  totalIterations: number;
  /** Whether loop converged */
  converged: boolean;
  /** Convergence iteration (if converged) */
  convergenceIteration: number | undefined;
}

/**
 * Run the reflective synthesis loop.
 *
 * CR-2 Architecture Note (Revised 2026-02-09):
 * This loop preserves the PrincipleStore across iterations while tightening
 * the similarity threshold progressively (+0.02 per iteration). This enables
 * N-count accumulation while still ensuring cleaner clustering over time.
 *
 * Design rationale:
 * - Single store across iterations preserves N-counts
 * - setThreshold() updates matching strictness without losing state
 * - Later iterations with stricter thresholds may not match existing
 *   principles (acceptable - only strong matches reinforce)
 * - N-counts accumulate, enabling axiom emergence (N>=3)
 *
 * Convergence is measured by axiom set stability (cosine similarity >= 0.95).
 *
 * @param llm - LLM provider for semantic classification (required)
 * @param signals - Array of signals to process
 * @param config - Optional configuration overrides
 * @returns Reflective loop result with principles, axioms, and trajectory metrics
 */
export async function runReflectiveLoop(
  llm: LLMProvider,
  signals: Signal[],
  config: Partial<ReflectiveLoopConfig> = {}
): Promise<ReflectiveLoopResult> {
  const mergedConfig = { ...DEFAULT_REFLECTIVE_CONFIG, ...config };
  const {
    maxIterations,
    convergenceThreshold,
    axiomNThreshold,
    principleThreshold,
  } = mergedConfig;

  const tracker = new TrajectoryTracker();
  const iterations: IterationResult[] = [];
  let previousAxiomEmbedding: number[] | null = null;
  let converged = false;
  let convergenceIteration: number | undefined;

  // Initialize principle store (persists across iterations to accumulate N-counts)
  const store = createPrincipleStore(llm, principleThreshold);

  for (let i = 0; i < maxIterations; i++) {
    const iterationStart = Date.now();
    const iterationNum = i + 1;

    // CR-2 Revised: Update threshold for this iteration (store persists, N-counts accumulate)
    // Each iteration tightens the threshold by 0.02, but existing principles remain.
    // Signals that still match (above stricter threshold) will reinforce existing principles.
    // Signals that no longer match will create new principles.
    const iterationThreshold = principleThreshold + i * 0.02;
    store.setThreshold(iterationThreshold);

    // Phase 1: Feed signals into principle store
    // N-counts accumulate as signals re-match existing principles
    for (const signal of signals) {
      // IM-3 FIX: Pass signal's existing dimension to avoid redundant LLM classification
      await store.addSignal(signal, signal.dimension);
    }

    // Phase 2: Get principles and compress to axioms (requires LLM for CJK/emoji mapping)
    const principles = store.getPrinciples();
    const compression = await compressPrinciples(llm, principles, axiomNThreshold);
    const axioms = compression.axioms;

    // Phase 3: Calculate axiom set embedding
    const axiomSetEmbedding = await calculateSetEmbedding(axioms);

    // Phase 4: Calculate convergence
    let centroidDrift = 0;
    let iterationConverged = false;

    if (previousAxiomEmbedding && axiomSetEmbedding.length > 0) {
      const similarity = cosineSimilarity(previousAxiomEmbedding, axiomSetEmbedding);
      centroidDrift = 1 - similarity;
      iterationConverged = similarity >= convergenceThreshold;

      if (iterationConverged && !converged) {
        converged = true;
        convergenceIteration = iterationNum;
      }
    }

    // Record trajectory point
    const centroids = new Map<string, number[]>();
    for (const p of principles) {
      centroids.set(p.id, p.embedding);
    }
    tracker.recordPoint(principles.length, axioms.length, centroids);

    // Create iteration result
    // MN-1 FIX: Store only counts, not full arrays
    const result: IterationResult = {
      iteration: iterationNum,
      principleCount: principles.length,
      axiomCount: axioms.length,
      centroidDrift,
      converged: iterationConverged,
      axiomSetEmbedding,
      durationMs: Date.now() - iterationStart,
    };

    iterations.push(result);
    config.onIteration?.(result);

    // Update previous embedding
    previousAxiomEmbedding = axiomSetEmbedding;

    // Early exit if converged
    if (converged) {
      break;
    }
  }

  // Get final state
  const finalPrinciples = store.getPrinciples();
  const finalCompression = await compressPrinciples(llm, finalPrinciples, axiomNThreshold);

  return {
    principles: finalPrinciples,
    axioms: finalCompression.axioms,
    unconverged: finalCompression.unconverged,
    iterations,
    trajectoryMetrics: tracker.getMetrics(),
    totalIterations: iterations.length,
    converged,
    convergenceIteration,
  };
}

/**
 * Calculate a single embedding representing the axiom set.
 * Uses mean pooling of axiom embeddings.
 */
async function calculateSetEmbedding(axioms: Axiom[]): Promise<number[]> {
  if (axioms.length === 0) {
    return [];
  }

  // Get embeddings for each axiom text
  const embeddings: number[][] = [];
  for (const axiom of axioms) {
    const embedding = await embed(axiom.text);
    embeddings.push(embedding);
  }

  // Mean pooling
  const dim = embeddings[0]?.length ?? 0;
  if (dim === 0) return [];

  const mean = new Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      mean[i] += emb[i] ?? 0;
    }
  }

  for (let i = 0; i < dim; i++) {
    mean[i] /= embeddings.length;
  }

  return mean;
}

/**
 * Format reflective loop result as report.
 */
export function formatReflectiveLoopReport(result: ReflectiveLoopResult): string {
  const lines: string[] = [
    '# Reflective Loop Report',
    '',
    `**Total iterations**: ${result.totalIterations}`,
    `**Converged**: ${result.converged ? `Yes (iteration ${result.convergenceIteration})` : 'No'}`,
    '',
    '## Final State',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Principles | ${result.principles.length} |`,
    `| Axioms | ${result.axioms.length} |`,
    `| Unconverged | ${result.unconverged.length} |`,
    '',
    '## Iteration History',
    '',
    '| # | Principles | Axioms | Drift | Converged |',
    '|---|------------|--------|-------|-----------|',
  ];

  for (const iter of result.iterations) {
    lines.push(
      `| ${iter.iteration} | ${iter.principleCount} | ${iter.axiomCount} | ` +
      `${iter.centroidDrift.toFixed(4)} | ${iter.converged ? 'Yes' : 'No'} |`
    );
  }

  if (result.trajectoryMetrics) {
    lines.push('');
    lines.push('## Trajectory Metrics');
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Stabilization rate | ${result.trajectoryMetrics.stabilizationRate} |`);
    lines.push(`| Attractor strength | ${result.trajectoryMetrics.attractorStrength.toFixed(3)} |`);
    lines.push(`| Is stable | ${result.trajectoryMetrics.isStable ? 'Yes' : 'No'} |`);
  }

  return lines.join('\n');
}
