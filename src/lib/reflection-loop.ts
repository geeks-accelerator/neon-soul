/**
 * Single-Pass Soul Synthesis
 *
 * Implements single-pass synthesis: generalize signals once, add to
 * PrincipleStore once, compress to axioms once. No iteration loop.
 *
 * Architecture Decision (2026-02-10):
 * The original iterative design was flawed - re-adding signals each iteration
 * caused self-matching (similarity=1.000) and N-count inflation. Moving
 * ingestion outside the loop made the loop vestigial. Single-pass is simpler
 * and produces the same correct outcome.
 *
 * Usage:
 *   const result = await runReflectiveLoop(signals, options);
 */

import { createPrincipleStore } from './principle-store.js';
import { compressPrinciplesWithCascade, type GuardrailWarnings } from './compressor.js';
import { generalizeSignalsWithCache } from './signal-generalizer.js';
import type { Signal } from '../types/signal.js';
import type { Principle } from '../types/principle.js';
import type { Axiom } from '../types/axiom.js';
import type { LLMProvider } from '../types/llm.js';
import { logger } from './logger.js';

/**
 * Synthesis configuration.
 *
 * Note: axiomNThreshold was removed (I-4 fix) - the compressor uses
 * fixed cascading thresholds (3/2/1). See compressPrinciplesWithCascade().
 */
export interface ReflectiveLoopConfig {
  /** Similarity threshold for principle matching */
  principleThreshold: number;
  /** Progress callback (called once after synthesis completes) */
  onComplete?: (result: ReflectiveLoopResult) => void;
}

/**
 * Default synthesis configuration.
 *
 * Note: principleThreshold default changed from 0.85 to 0.75 based on
 * empirical analysis showing generalized signals have similarity ~0.78-0.83.
 * @see docs/issues/2026-02-10-generalized-signal-threshold-gap.md
 */
export const DEFAULT_REFLECTIVE_CONFIG: ReflectiveLoopConfig = {
  principleThreshold: 0.75,
};

/**
 * PBD Stage 16: Promotion statistics for anti-echo-chamber reporting.
 */
export interface PromotionStats {
  /** Axioms meeting all promotion criteria */
  promotable: number;
  /** Axioms blocked by anti-echo-chamber rules */
  blocked: number;
  /** Count by blocker reason */
  reasons: Record<string, number>;
}

/**
 * Result of single-pass synthesis.
 */
export interface ReflectiveLoopResult {
  /** Final principles */
  principles: Principle[];
  /** Final axioms */
  axioms: Axiom[];
  /** Unconverged principles (N < threshold) */
  unconverged: Principle[];
  /** Effective N-threshold used (from cascade) */
  effectiveThreshold: number;
  /** Research-backed guardrail warnings */
  guardrails: GuardrailWarnings;
  /** Synthesis timing */
  durationMs: number;
  /** Signal count processed */
  signalCount: number;
  /** Compression ratio (signals / axioms) */
  compressionRatio: number;
  /** PBD Stage 16: Provenance distribution across signals */
  provenanceDistribution?: Record<string, number>;
  /** PBD Stage 16: Axioms blocked by anti-echo-chamber rule */
  echoBlockedAxioms?: number;
  /** PBD Stage 16: Promotion statistics */
  promotionStats?: PromotionStats;
}

/**
 * Run single-pass synthesis.
 *
 * Architecture (2026-02-10):
 * Single-pass: generalize once → add to store once → compress once.
 * No iteration loop. This eliminates the self-matching bug where signals
 * were re-added each iteration, matching themselves with similarity=1.000.
 *
 * @param llm - LLM provider for semantic classification (required)
 * @param signals - Array of signals to process
 * @param config - Optional configuration overrides
 * @returns Synthesis result with principles, axioms, and guardrails
 */
export async function runReflectiveLoop(
  llm: LLMProvider,
  signals: Signal[],
  config: Partial<ReflectiveLoopConfig> = {}
): Promise<ReflectiveLoopResult> {
  const startTime = Date.now();
  const mergedConfig = { ...DEFAULT_REFLECTIVE_CONFIG, ...config };
  const { principleThreshold } = mergedConfig;

  logger.info(`[synthesis] Starting single-pass synthesis with ${signals.length} signals`);

  // Initialize principle store
  const store = createPrincipleStore(llm, principleThreshold);

  // Phase 1: Generalize all signals (batch-first approach for efficiency)
  // Generalized signals cluster better because surface form variance is abstracted away.
  // I-3 FIX: Use actual model ID instead of hard-coded 'ollama' for cache keying
  const modelId = llm.getModelId?.() ?? 'unknown';
  const generalizationStart = Date.now();
  const generalizedSignals = await generalizeSignalsWithCache(llm, signals, modelId);
  const generalizationMs = Date.now() - generalizationStart;
  logger.info(`[synthesis] Generalized ${signals.length} signals in ${generalizationMs}ms`);

  // Phase 2: Add generalized signals to principle store (ONCE - no iteration)
  // N-counts accumulate as generalized signals match existing principles
  let addedCount = 0;
  let skippedCount = 0;
  for (const generalizedSignal of generalizedSignals) {
    const result = await store.addGeneralizedSignal(generalizedSignal, generalizedSignal.original.dimension);
    if (result.action === 'skipped') {
      skippedCount++;
    } else {
      addedCount++;
    }
  }
  logger.info(`[synthesis] Added ${addedCount} signals to principle store (${skippedCount} duplicates skipped)`);

  // Phase 3: Get principles and compress to axioms (requires LLM for CJK/emoji mapping)
  const principles = store.getPrinciples();
  logger.info(`[synthesis] ${principles.length} principles formed`);

  const compression = await compressPrinciplesWithCascade(llm, principles);
  const durationMs = Date.now() - startTime;

  const compressionRatio = compression.axioms.length > 0
    ? signals.length / compression.axioms.length
    : 0;

  // PBD Stage 16: Compute provenance distribution from signals
  const provenanceDistribution: Record<string, number> = {};
  for (const signal of signals) {
    const prov = signal.provenance ?? 'unknown';
    provenanceDistribution[prov] = (provenanceDistribution[prov] ?? 0) + 1;
  }

  // PBD Stage 16: Compute promotion statistics from axioms
  const promotionStats: PromotionStats = {
    promotable: 0,
    blocked: 0,
    reasons: {},
  };
  for (const axiom of compression.axioms) {
    if (axiom.promotable) {
      promotionStats.promotable++;
    } else {
      promotionStats.blocked++;
      const reason = axiom.promotionBlocker ?? 'Unknown';
      promotionStats.reasons[reason] = (promotionStats.reasons[reason] ?? 0) + 1;
    }
  }
  const echoBlockedAxioms = promotionStats.blocked;

  logger.info(
    `[synthesis] Complete: ${signals.length} signals → ${principles.length} principles → ${compression.axioms.length} axioms ` +
    `(${compressionRatio.toFixed(1)}:1 compression) in ${durationMs}ms`
  );

  // PBD Stage 16: Log promotion stats if any blocked
  if (echoBlockedAxioms > 0) {
    logger.info(
      `[synthesis] Anti-echo-chamber: ${promotionStats.promotable} promotable, ${echoBlockedAxioms} blocked`
    );
  }

  const result: ReflectiveLoopResult = {
    principles,
    axioms: compression.axioms,
    unconverged: compression.unconverged,
    effectiveThreshold: compression.cascade.effectiveThreshold,
    guardrails: compression.guardrails,
    durationMs,
    signalCount: signals.length,
    compressionRatio,
    // PBD Stage 16: Provenance and anti-echo-chamber metrics
    provenanceDistribution,
    echoBlockedAxioms,
    promotionStats,
  };

  // Call completion callback if provided
  config.onComplete?.(result);

  return result;
}

/**
 * Format synthesis result as report.
 */
export function formatReflectiveLoopReport(result: ReflectiveLoopResult): string {
  const lines: string[] = [
    '# Synthesis Report',
    '',
    `**Duration**: ${result.durationMs}ms`,
    `**Compression**: ${result.compressionRatio.toFixed(1)}:1`,
    '',
    '## Results',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Signals | ${result.signalCount} |`,
    `| Principles | ${result.principles.length} |`,
    `| Axioms | ${result.axioms.length} |`,
    `| Unconverged | ${result.unconverged.length} |`,
    `| Effective Threshold | ${result.effectiveThreshold} |`,
    '',
  ];

  // PBD Stage 16: Provenance distribution
  if (result.provenanceDistribution && Object.keys(result.provenanceDistribution).length > 0) {
    lines.push('## Provenance Distribution');
    lines.push('');
    lines.push('| Type | Count |');
    lines.push('|------|-------|');
    for (const [type, count] of Object.entries(result.provenanceDistribution)) {
      lines.push(`| ${type} | ${count} |`);
    }
    lines.push('');
  }

  // PBD Stage 16: Anti-echo-chamber promotion stats
  if (result.promotionStats) {
    const stats = result.promotionStats;
    lines.push('## Axiom Promotion');
    lines.push('');
    lines.push(`| Status | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Promotable | ${stats.promotable} |`);
    lines.push(`| Blocked | ${stats.blocked} |`);
    lines.push('');

    if (stats.blocked > 0 && Object.keys(stats.reasons).length > 0) {
      lines.push('### Block Reasons');
      lines.push('');
      for (const [reason, count] of Object.entries(stats.reasons)) {
        lines.push(`- ${reason}: ${count}`);
      }
      lines.push('');
    }
  }

  if (result.guardrails.messages.length > 0) {
    lines.push('## Guardrail Warnings');
    lines.push('');
    for (const message of result.guardrails.messages) {
      lines.push(`- ${message}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
