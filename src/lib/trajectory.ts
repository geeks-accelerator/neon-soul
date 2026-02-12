/**
 * Trajectory tracking for soul synthesis cross-run stability analysis.
 *
 * v0.2.0: Migrated from centroid-based drift to text hash stability.
 * Used by evolution.ts for cross-run analysis (comparing today's synthesis
 * to previous runs), NOT within-run convergence. The synthesis is single-pass.
 *
 * Cross-Reference: docs/plans/2026-02-12-llm-based-similarity.md (Stage 4)
 */

import { createHash } from 'node:crypto';

// IM-11 FIX: Cap trajectory points to prevent unbounded memory growth
const MAX_TRAJECTORY_POINTS = 100;

export interface TrajectoryPoint {
  iteration: number;
  principleCount: number;
  axiomCount: number;
  /**
   * v0.2.0: Changed from centroid drift to text stability.
   * Represents percentage of principles unchanged since last run (0-1).
   * Higher = more stable (e.g., 0.9 = 90% of principles unchanged).
   */
  textStability: number;
  timestamp: string;
  /** SHA256 hashes of principle texts for stability comparison */
  principleTextHashes?: string[];
}

export interface TrajectoryMetrics {
  stabilizationRate: number; // Iterations to converge (target: 3-5)
  attractorStrength: number; // Consistency of convergence (0-1)
  trajectoryVariance: number; // Spread before stabilization
  /**
   * v0.2.0: Renamed from semanticDrift to stabilityHistory.
   * Each entry is the text stability percentage for that iteration (0-1).
   */
  stabilityHistory: number[];
  isStable: boolean; // Whether trajectory has stabilized
}

export interface StyleMetrics {
  voiceCoherence: number; // Style embedding similarity
  contentSimilarity: number; // Semantic embedding similarity
  styleContentRatio: number; // Balance (target: style >= 0.7)
}

/**
 * Compute SHA256 hash of normalized principle text.
 * Normalization: lowercase, collapse whitespace, trim.
 */
function hashText(text: string): string {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Track trajectory over multiple synthesis runs (cross-run analysis).
 *
 * v0.2.0: Migrated from centroid-based drift to text hash stability.
 * Text stability = percentage of principle texts unchanged between runs.
 *
 * IM-11: Uses sliding window to prevent unbounded memory growth.
 * Keeps only the most recent MAX_TRAJECTORY_POINTS points.
 */
export class TrajectoryTracker {
  private points: TrajectoryPoint[] = [];
  private previousTextHashes: Set<string> = new Set();
  private stabilizationThreshold = 0.85; // 85% stability = stable
  private maxPoints = MAX_TRAJECTORY_POINTS;

  /**
   * Record a trajectory point.
   *
   * @param principleCount - Number of principles in current run
   * @param axiomCount - Number of axioms in current run
   * @param currentPrincipleTexts - Array of principle texts from current run
   */
  recordPoint(
    principleCount: number,
    axiomCount: number,
    currentPrincipleTexts: string[]
  ): TrajectoryPoint {
    // Compute hashes for current principle texts
    const currentHashes = currentPrincipleTexts.map(hashText);
    const currentHashSet = new Set(currentHashes);

    // Calculate text stability (percentage unchanged)
    let unchangedCount = 0;
    if (this.previousTextHashes.size > 0) {
      for (const hash of currentHashSet) {
        if (this.previousTextHashes.has(hash)) {
          unchangedCount++;
        }
      }
    }

    // Stability = unchanged / max(current, previous) to handle growth/shrink
    const maxCount = Math.max(currentHashSet.size, this.previousTextHashes.size);
    const textStability = maxCount > 0 ? unchangedCount / maxCount : 1.0;

    const point: TrajectoryPoint = {
      iteration: this.points.length + 1,
      principleCount,
      axiomCount,
      textStability,
      timestamp: new Date().toISOString(),
      principleTextHashes: currentHashes,
    };

    this.points.push(point);

    // IM-11 FIX: Enforce sliding window - remove oldest points if over limit
    if (this.points.length > this.maxPoints) {
      this.points = this.points.slice(-this.maxPoints);
    }

    // Update previous hashes for next comparison
    this.previousTextHashes = currentHashSet;

    return point;
  }

  /**
   * Calculate trajectory metrics.
   */
  getMetrics(): TrajectoryMetrics {
    if (this.points.length < 2) {
      return {
        stabilizationRate: 0,
        attractorStrength: 0,
        trajectoryVariance: 0,
        stabilityHistory: [],
        isStable: false,
      };
    }

    const stabilityValues = this.points.map((p) => p.textStability);

    // Find stabilization point (first iteration where stability stays above threshold)
    let stabilizationPoint = this.points.length;
    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      if (point && point.textStability >= this.stabilizationThreshold) {
        // Check if it stays stable
        const remainingStabilities = stabilityValues.slice(i);
        const allStable = remainingStabilities.every(
          (s) => s >= this.stabilizationThreshold
        );
        if (allStable) {
          stabilizationPoint = i;
          break;
        }
      }
    }

    // Calculate variance of pre-stabilization stability values
    const preStabStabilities = stabilityValues.slice(0, stabilizationPoint);
    const variance = this.calculateVariance(preStabStabilities);

    // Attractor strength: how consistently do we converge?
    // Higher stability = stronger attractor
    const lastStability = stabilityValues[stabilityValues.length - 1] ?? 0;
    const attractorStrength = lastStability;

    return {
      stabilizationRate: stabilizationPoint,
      attractorStrength,
      trajectoryVariance: variance,
      stabilityHistory: stabilityValues,
      isStable: lastStability >= this.stabilizationThreshold,
    };
  }

  /**
   * Calculate variance of a number array.
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Get trajectory points for logging/visualization.
   */
  getPoints(): TrajectoryPoint[] {
    return [...this.points];
  }

  /**
   * Reset tracker for new synthesis run.
   */
  reset(): void {
    this.points = [];
    this.previousTextHashes.clear();
  }
}

/**
 * Calculate style metrics for voice preservation.
 *
 * v0.2.0: This function uses embeddings for style analysis.
 * It is NOT used in the synthesis pipeline (which now uses LLM similarity).
 * Kept for post-synthesis analysis in evolution.ts.
 *
 * Note: If voiceCoherence/contentSimilarity tracking is needed without
 * embeddings, use LLM-based semantic comparison instead.
 */
export function calculateStyleMetrics(
  originalEmbedding: number[],
  compressedEmbedding: number[]
): StyleMetrics {
  // v0.2.0: cosineSimilarity removed from matcher.ts
  // This function needs embeddings - if called, use direct dot product
  // (assumes embeddings are L2 normalized)
  const contentSimilarity = dotProduct(originalEmbedding, compressedEmbedding);

  // Voice coherence approximated by checking if similarity is high
  // In production, would use style-specific embeddings
  const voiceCoherence = Math.min(1, contentSimilarity * 1.1);

  return {
    voiceCoherence,
    contentSimilarity,
    styleContentRatio:
      voiceCoherence / Math.max(0.1, voiceCoherence + contentSimilarity),
  };
}

/**
 * Dot product for normalized vectors (cosine similarity).
 * Moved from matcher.ts since it's only used here now.
 */
function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    const aVal = a[i];
    const bVal = b[i];
    if (aVal !== undefined && bVal !== undefined) {
      dot += aVal * bVal;
    }
  }
  return dot;
}

/**
 * Format trajectory metrics as report.
 */
export function formatTrajectoryReport(metrics: TrajectoryMetrics): string {
  const lines = [
    '## Trajectory Metrics',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Stabilization rate | ${metrics.stabilizationRate} iterations |`,
    `| Attractor strength | ${metrics.attractorStrength.toFixed(3)} |`,
    `| Trajectory variance | ${metrics.trajectoryVariance.toFixed(4)} |`,
    `| Is stable | ${metrics.isStable ? 'Yes' : 'No'} |`,
    '',
    '### Text Stability per Iteration',
    '',
  ];

  for (let i = 0; i < metrics.stabilityHistory.length; i++) {
    const stability = metrics.stabilityHistory[i];
    if (stability !== undefined) {
      const bar = '█'.repeat(Math.min(20, Math.round(stability * 20)));
      const pct = Math.round(stability * 100);
      lines.push(`${i + 1}. ${pct}% ${bar}`);
    }
  }

  return lines.join('\n');
}
