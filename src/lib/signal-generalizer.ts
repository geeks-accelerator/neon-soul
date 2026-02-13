/**
 * Signal Generalization - LLM-based transformation of signals to abstract principles.
 * Implements PBD "Principle Synthesis" for better semantic clustering.
 * @see docs/plans/2026-02-09-signal-generalization.md
 */

import { createHash } from 'node:crypto';
import type { Signal, GeneralizedSignal, GeneralizationProvenance } from '../types/signal.js';
import type { LLMProvider } from '../types/llm.js';
import { requireLLM } from '../types/llm.js';
import { logger } from './logger.js';
import { LRUCache } from 'lru-cache';
import { buildPrompt, validateGeneralization } from './generalization-helpers.js';

/** Prompt version for cache invalidation. Bump when changing prompt or validation. */
export const PROMPT_VERSION = 'v1.0.0';

// Re-export helpers for backward compatibility
export { buildPrompt, validateGeneralization, MAX_OUTPUT_LENGTH } from './generalization-helpers.js';

/**
 * Generalize a single signal using LLM.
 *
 * @param llm - LLM provider (required)
 * @param signal - Signal to generalize
 * @param model - Model name for provenance (default: 'unknown')
 * @returns GeneralizedSignal with abstract principle and embedding
 * @throws LLMRequiredError if llm is null/undefined
 */
export async function generalizeSignal(
  llm: LLMProvider | null | undefined,
  signal: Signal,
  model: string = 'unknown'
): Promise<GeneralizedSignal> {
  requireLLM(llm, 'generalizeSignal');

  const prompt = buildPrompt(signal.text, signal.dimension);
  let generalizedText: string;
  let usedFallback = false;

  try {
    // Use generate() if available, otherwise fallback to original
    if (llm.generate) {
      const result = await llm.generate(prompt);
      generalizedText = result.text.trim();
    } else {
      // Provider lacks generate() - fallback to original signal text
      generalizedText = signal.text;
      usedFallback = true;
      logger.warn(`[generalizer] LLM lacks generate(), falling back to original for signal ${signal.id}`);
    }

    // Validate the generalization
    const validation = validateGeneralization(signal.text, generalizedText);
    if (!validation.valid) {
      logger.warn(`[generalizer] Validation failed for signal ${signal.id}: ${validation.reason}`);
      generalizedText = signal.text;
      usedFallback = true;
    }
  } catch (error) {
    // LLM failure - fallback to original
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.warn(`[generalizer] LLM failed for signal ${signal.id}: ${errorMsg}`);
    generalizedText = signal.text;
    usedFallback = true;
  }

  const provenance: GeneralizationProvenance = {
    original_text: signal.text,
    generalized_text: generalizedText,
    model,
    prompt_version: PROMPT_VERSION,
    timestamp: new Date().toISOString(),
    used_fallback: usedFallback,
  };

  return {
    original: signal,
    generalizedText,
    provenance,
  };
}

/**
 * Generalize multiple signals in batch.
 *
 * Uses batch processing for efficiency with partial failure handling:
 * - Successful generalizations proceed normally
 * - Failed generalizations use original text as fallback
 *
 * @param llm - LLM provider (required)
 * @param signals - Signals to generalize
 * @param model - Model name for provenance (default: 'unknown')
 * @param options - Batch processing options
 * @returns Array of GeneralizedSignal in same order as input
 * @throws LLMRequiredError if llm is null/undefined
 */
export async function generalizeSignals(
  llm: LLMProvider | null | undefined,
  signals: Signal[],
  model: string = 'unknown',
  options: {
    /** Maximum signals per batch (default: 50) */
    batchSize?: number;
    /** Log first N generalizations per batch (default: 3) */
    logSampleSize?: number;
    /** Log random percentage of remainder (default: 0.05 = 5%) */
    logSamplePercent?: number;
  } = {}
): Promise<GeneralizedSignal[]> {
  requireLLM(llm, 'generalizeSignals');

  if (signals.length === 0) {
    return [];
  }

  const {
    batchSize = 50,
    logSampleSize = 3,
    logSamplePercent = 0.05,
  } = options;

  const results: GeneralizedSignal[] = [];
  let fallbackCount = 0;

  // Process in batches
  for (let i = 0; i < signals.length; i += batchSize) {
    const batch = signals.slice(i, i + batchSize);
    const batchResults: GeneralizedSignal[] = [];

    // Generate all prompts for this batch
    const prompts = batch.map((s) => buildPrompt(s.text, s.dimension));

    // Try to generalize each signal
    const generalizedTexts: string[] = [];
    const usedFallbacks: boolean[] = [];

    for (let j = 0; j < batch.length; j++) {
      const signal = batch[j]!;
      const prompt = prompts[j]!;
      let generalizedText: string;
      let usedFallback = false;

      try {
        if (llm.generate) {
          const result = await llm.generate(prompt);
          generalizedText = result.text.trim();

          // Validate
          const validation = validateGeneralization(signal.text, generalizedText);
          if (!validation.valid) {
            logger.warn(`[generalizer] Batch validation failed for signal ${signal.id}: ${validation.reason}`);
            generalizedText = signal.text;
            usedFallback = true;
          }
        } else {
          logger.warn(`[generalizer] Batch LLM lacks generate() for signal ${signal.id}`);
          generalizedText = signal.text;
          usedFallback = true;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.warn(`[generalizer] Batch LLM failed for signal ${signal.id}: ${errorMsg}`);
        generalizedText = signal.text;
        usedFallback = true;
      }

      generalizedTexts.push(generalizedText);
      usedFallbacks.push(usedFallback);
      if (usedFallback) fallbackCount++;
    }

    // Build results
    for (let j = 0; j < batch.length; j++) {
      const signal = batch[j]!;
      const genText = generalizedTexts[j]!;
      const fallback = usedFallbacks[j]!;

      const provenance: GeneralizationProvenance = {
        original_text: signal.text,
        generalized_text: genText,
        model,
        prompt_version: PROMPT_VERSION,
        timestamp: new Date().toISOString(),
        used_fallback: fallback,
      };

      batchResults.push({
        original: signal,
        generalizedText: genText,
        provenance,
      });
    }

    // Log samples from this batch
    const samplesToLog = Math.min(logSampleSize, batchResults.length);
    for (let j = 0; j < samplesToLog; j++) {
      const r = batchResults[j];
      if (r) {
        logger.debug(
          `[generalizer] "${r.provenance.original_text.slice(0, 40)}..." → "${r.generalizedText.slice(0, 40)}..."${r.provenance.used_fallback ? ' (fallback)' : ''}`
        );
      }
    }

    // Log random sample of remainder (avoiding duplicates)
    const remainder = batchResults.slice(samplesToLog);
    const randomSampleCount = Math.min(
      Math.ceil(remainder.length * logSamplePercent),
      remainder.length
    );
    const usedIndices = new Set<number>();
    for (let j = 0; j < randomSampleCount && usedIndices.size < remainder.length; j++) {
      let idx: number;
      do {
        idx = Math.floor(Math.random() * remainder.length);
      } while (usedIndices.has(idx));
      usedIndices.add(idx);
      const r = remainder[idx];
      if (r) {
        logger.debug(
          `[generalizer] (sample) "${r.provenance.original_text.slice(0, 40)}..." → "${r.generalizedText.slice(0, 40)}..."`
        );
      }
    }

    results.push(...batchResults);
  }

  // Log summary
  const fallbackRate = (fallbackCount / signals.length) * 100;
  logger.info(
    `[generalizer] Processed ${signals.length} signals, ${fallbackCount} used fallback (${fallbackRate.toFixed(1)}%)`
  );

  if (fallbackRate > 10) {
    logger.warn(`[generalizer] High fallback rate (${fallbackRate.toFixed(1)}%) - investigate LLM issues`);
  }

  return results;
}

/** Maximum cache size (each entry ~1.5KB with 384-float embedding) */
const CACHE_MAX_SIZE = 1000;

/**
 * LRU cache for generalized signals.
 * Key: signal.id + textHash + promptVersion
 * Size-bounded to prevent memory leaks in long-running processes.
 *
 * @see docs/issues/2026-02-09-signal-generalization-impl-findings.md (Finding #4)
 */
const generalizationCache = new LRUCache<string, GeneralizedSignal>({
  max: CACHE_MAX_SIZE,
});
let cachedPromptVersion = PROMPT_VERSION;

/**
 * Generate content hash for cache key.
 * Ensures stale cache entries are not returned when signal content changes.
 *
 * @see docs/issues/2026-02-09-signal-generalization-impl-findings.md (Finding #1)
 */
function getContentHash(signalText: string): string {
  return createHash('sha256').update(signalText).digest('hex').slice(0, 16);
}

/**
 * Get cache key for a signal.
 * Includes signal ID, content hash, and prompt version for proper invalidation.
 */
/**
 * I-3 FIX: Cache key now includes model to prevent cross-model contamination.
 */
function getCacheKey(signalId: string, signalText: string, model: string): string {
  const textHash = getContentHash(signalText);
  return `${signalId}:${textHash}:${PROMPT_VERSION}:${model}`;
}

/**
 * Generalize signals with caching.
 * Cache is invalidated when prompt version changes.
 *
 * Note on fallback behavior: When a signal uses fallback (usedFallback: true),
 * the embedding is generated from the original signal text, not generalized text.
 * This creates a mixed embedding space. Monitor fallback rate and keep below 10%.
 *
 * @param llm - LLM provider (required)
 * @param signals - Signals to generalize
 * @param model - Model name for provenance
 * @param options - Batch processing options (forwarded to generalizeSignals)
 * @returns Array of GeneralizedSignal (from cache or freshly generated)
 *
 * @see docs/issues/2026-02-09-signal-generalization-impl-findings.md (Finding #2, #9)
 */
export async function generalizeSignalsWithCache(
  llm: LLMProvider | null | undefined,
  signals: Signal[],
  model: string = 'unknown',
  options: {
    batchSize?: number;
    logSampleSize?: number;
    logSamplePercent?: number;
  } = {}
): Promise<GeneralizedSignal[]> {
  // Invalidate cache if prompt version changed
  if (cachedPromptVersion !== PROMPT_VERSION) {
    generalizationCache.clear();
    cachedPromptVersion = PROMPT_VERSION;
    logger.info('[generalizer] Cache invalidated due to prompt version change');
  }

  const uncached: Signal[] = [];
  const cachedResults = new Map<string, GeneralizedSignal>();

  // Check cache for each signal (key includes content hash and model)
  // I-3 FIX: Include model in cache key to prevent cross-model contamination
  for (const signal of signals) {
    const key = getCacheKey(signal.id, signal.text, model);
    const cached = generalizationCache.get(key);
    if (cached) {
      cachedResults.set(signal.id, cached);
    } else {
      uncached.push(signal);
    }
  }

  const cacheHits = signals.length - uncached.length;
  if (cacheHits > 0) {
    logger.debug(`[generalizer] Cache hits: ${cacheHits}/${signals.length}`);
  }

  // Generalize uncached signals (forwarding options)
  let freshResults: GeneralizedSignal[] = [];
  if (uncached.length > 0) {
    freshResults = await generalizeSignals(llm, uncached, model, options);

    // Store in cache (key includes content hash and model)
    for (const result of freshResults) {
      const key = getCacheKey(result.original.id, result.original.text, model);
      generalizationCache.set(key, result);
    }
  }

  // Combine results in original order
  const freshMap = new Map(freshResults.map((r) => [r.original.id, r]));
  return signals.map((signal) => {
    return cachedResults.get(signal.id) ?? freshMap.get(signal.id)!;
  });
}

/**
 * Clear the generalization cache.
 * Useful for testing or when prompt template is updated.
 */
export function clearGeneralizationCache(): void {
  generalizationCache.clear();
  logger.debug('[generalizer] Cache cleared');
}

/**
 * Get cache statistics for monitoring.
 * @returns Current cache size and max size
 */
export function getCacheStats(): { size: number; maxSize: number } {
  return {
    size: generalizationCache.size,
    maxSize: CACHE_MAX_SIZE,
  };
}
