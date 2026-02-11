/**
 * Synthesis Guardrails
 *
 * Research-backed limits and warnings for synthesis quality.
 * Extracted from compressor.ts for MCE compliance.
 *
 * These are observability warnings only - they do not block synthesis.
 */

import { logger } from './logger.js';

/**
 * Maximum axiom count before cognitive load warning.
 * Based on research suggesting 7±2 items for working memory,
 * extended to 30 for hierarchical structures.
 */
export const COGNITIVE_LOAD_CAP = 30;

/**
 * Guardrail warning messages for observability.
 * These are warnings only - they do not block synthesis.
 */
export interface GuardrailWarnings {
  /** True if axioms exceed signal count (expansion instead of compression) */
  expansionWarning: boolean;
  /** True if axioms exceed cognitive load limit */
  cognitiveLoadWarning: boolean;
  /** True if cascade fell back to minimum threshold */
  fallbackWarning: boolean;
  /** All warning messages for logging */
  messages: string[];
}

/**
 * Empty guardrail result (no warnings).
 */
export const NO_WARNINGS: GuardrailWarnings = {
  expansionWarning: false,
  cognitiveLoadWarning: false,
  fallbackWarning: false,
  messages: [],
};

/**
 * Check synthesis guardrails and return warnings.
 *
 * Research-backed limits:
 * 1. axioms > signals -> "Expansion instead of compression"
 * 2. axioms > min(signals * 0.5, 30) -> "Exceeds cognitive load research limits"
 * 3. effectiveThreshold === 1 -> "Fell back to minimum threshold"
 *
 * @param axiomCount - Number of axioms produced
 * @param signalCount - Number of input signals
 * @param effectiveThreshold - The N-threshold that produced the result
 * @returns Guardrail warnings for logging
 */
export function checkGuardrails(
  axiomCount: number,
  signalCount: number,
  effectiveThreshold: number
): GuardrailWarnings {
  const messages: string[] = [];

  // Guardrail 1: Expansion check (axioms should be fewer than signals)
  const expansionWarning = axiomCount > signalCount;
  if (expansionWarning) {
    messages.push(
      `[guardrail] Expansion instead of compression: ${axiomCount} axioms > ${signalCount} signals`
    );
  }

  // Guardrail 2: Cognitive load check (axioms should be within research limits)
  const cognitiveLimit = Math.min(signalCount * 0.5, COGNITIVE_LOAD_CAP);
  const cognitiveLoadWarning = axiomCount > cognitiveLimit;
  if (cognitiveLoadWarning) {
    messages.push(
      `[guardrail] Exceeds cognitive load research limits: ${axiomCount} axioms > ${cognitiveLimit.toFixed(0)} limit (min(signals*0.5, ${COGNITIVE_LOAD_CAP}))`
    );
  }

  // Guardrail 3: Fallback threshold check
  const fallbackWarning = effectiveThreshold === 1;
  if (fallbackWarning) {
    messages.push(
      `[guardrail] Fell back to minimum threshold (N>=1): sparse evidence in input`
    );
  }

  // Log warnings
  for (const message of messages) {
    logger.warn(message);
  }

  return {
    expansionWarning,
    cognitiveLoadWarning,
    fallbackWarning,
    messages,
  };
}
