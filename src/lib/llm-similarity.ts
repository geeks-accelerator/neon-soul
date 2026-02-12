/**
 * LLM-based semantic similarity module.
 *
 * Replaces vector-based cosine similarity with LLM semantic comparison.
 * Uses the agent's existing LLM, eliminating third-party embedding dependencies.
 *
 * Cross-Reference: docs/plans/2026-02-12-llm-based-similarity.md (Stage 1)
 */

import type { LLMProvider } from '../types/llm.js';
import { logger } from './logger.js';
import {
  escapeForPrompt,
  parseEquivalenceResponse,
  parseBatchResponse,
  withRetry,
  MAX_BATCH_SIZE,
} from './llm-similarity-helpers.js';

/**
 * Result from a semantic equivalence check.
 */
export interface SemanticEquivalenceResult {
  /** Whether the texts are semantically equivalent */
  equivalent: boolean;
  /** Confidence score (0-1): high=0.9, medium=0.7, low=0.5 */
  confidence: number;
}

/**
 * Result from finding the best semantic match.
 */
export interface SemanticMatchResult {
  /** The best matching text (null if no match meets threshold) */
  match: string | null;
  /** Index of best match in candidates array (-1 if no match) */
  index: number;
  /** Confidence score of best match (0-1) */
  confidence: number;
}

/** Candidate with original index tracking */
interface IndexedCandidate {
  text: string;
  originalIndex: number;
}

/**
 * Check if two texts are semantically equivalent using LLM.
 *
 * @param textA - First text to compare
 * @param textB - Second text to compare
 * @param llm - LLM provider for semantic comparison
 * @returns Equivalence result with confidence score
 */
export async function isSemanticallyEquivalent(
  textA: string,
  textB: string,
  llm: LLMProvider
): Promise<SemanticEquivalenceResult> {
  if (!textA.trim() || !textB.trim()) {
    return { equivalent: false, confidence: 1.0 };
  }

  const escapedA = escapeForPrompt(textA);
  const escapedB = escapeForPrompt(textB);

  const prompt = `Compare these two statements for semantic equivalence. Do they express the same core meaning, even if worded differently?

Statement A: ${escapedA}

Statement B: ${escapedB}

Respond with ONLY a JSON object in this exact format:
{"equivalent": true/false, "confidence": "high"/"medium"/"low"}

where confidence reflects how certain you are of your assessment.`;

  return withRetry(async () => {
    const result = await llm.generate(prompt);
    return parseEquivalenceResponse(result.text);
  });
}

/**
 * Find the best semantic match for a text among candidates using LLM.
 *
 * Uses batch optimization to reduce LLM calls from O(n) to O(1) for most cases.
 * Falls back to iterative comparison on malformed batch responses.
 *
 * @param text - Text to find match for
 * @param candidates - Array of candidate texts to match against
 * @param llm - LLM provider for semantic comparison
 * @param threshold - Minimum confidence threshold (default: 0.7)
 * @returns Best match result with index and confidence
 */
export async function findBestSemanticMatch(
  text: string,
  candidates: string[],
  llm: LLMProvider,
  threshold: number = 0.7
): Promise<SemanticMatchResult> {
  if (!text.trim()) {
    return { match: null, index: -1, confidence: 0 };
  }

  if (candidates.length === 0) {
    return { match: null, index: -1, confidence: 0 };
  }

  // Filter empty candidates and track original indices
  const validCandidates: IndexedCandidate[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate && candidate.trim()) {
      validCandidates.push({ text: candidate, originalIndex: i });
    }
  }

  if (validCandidates.length === 0) {
    return { match: null, index: -1, confidence: 0 };
  }

  // For small batches, use batch optimization
  if (validCandidates.length <= MAX_BATCH_SIZE) {
    const batchResult = await tryBatchComparison(text, validCandidates, llm);
    if (batchResult !== null) {
      const { index, confidence } = batchResult;
      if (index === -1 || confidence < threshold) {
        return { match: null, index: -1, confidence };
      }
      const matched = validCandidates[index];
      return {
        match: matched?.text ?? null,
        index: matched?.originalIndex ?? -1,
        confidence,
      };
    }
  }

  // Large batches or batch failure: use iterative comparison
  return iterativeComparison(text, validCandidates, llm, threshold);
}

/**
 * Try batch comparison for efficiency.
 * Returns null if batch response is malformed (triggers fallback).
 */
async function tryBatchComparison(
  text: string,
  candidates: IndexedCandidate[],
  llm: LLMProvider
): Promise<{ index: number; confidence: number } | null> {
  const escapedText = escapeForPrompt(text);

  const candidateList = candidates
    .map((c, i) => `${i}. ${escapeForPrompt(c.text)}`)
    .join('\n');

  const prompt = `Find the candidate that is semantically equivalent to the target statement. The statements should express the same core meaning, even if worded differently.

Target statement: ${escapedText}

Candidates:
${candidateList}

If one candidate matches, respond with ONLY a JSON object:
{"bestMatchIndex": <number>, "confidence": "high"/"medium"/"low"}

If NO candidate is semantically equivalent, respond with:
{"bestMatchIndex": -1, "noMatch": true}`;

  try {
    const result = await withRetry(async () => {
      const response = await llm.generate(prompt);
      return response.text;
    });

    const parsed = parseBatchResponse(result, candidates.length);

    // Validate response makes sense
    if (parsed.index >= 0 && parsed.confidence === 0) {
      logger.warn('[llm-similarity] Batch response has match but no confidence', {
        index: parsed.index,
      });
      return null; // Trigger fallback
    }

    return parsed;
  } catch (error) {
    logger.warn('[llm-similarity] Batch comparison failed, will use iterative', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Iterative comparison for large batches or fallback from batch failure.
 */
async function iterativeComparison(
  text: string,
  candidates: IndexedCandidate[],
  llm: LLMProvider,
  threshold: number
): Promise<SemanticMatchResult> {
  let bestMatch: SemanticMatchResult = { match: null, index: -1, confidence: 0 };

  // Split into batches
  const batches: IndexedCandidate[][] = [];
  for (let i = 0; i < candidates.length; i += MAX_BATCH_SIZE) {
    batches.push(candidates.slice(i, i + MAX_BATCH_SIZE));
  }

  for (const batch of batches) {
    const batchResult = await tryBatchComparison(text, batch, llm);

    if (batchResult !== null && batchResult.index >= 0) {
      const candidate = batch[batchResult.index];
      if (batchResult.confidence > bestMatch.confidence && candidate) {
        bestMatch = {
          match: candidate.text,
          index: candidate.originalIndex,
          confidence: batchResult.confidence,
        };
      }
    } else if (batchResult === null) {
      // Batch failed, fall back to individual comparisons
      for (const candidate of batch) {
        try {
          const result = await isSemanticallyEquivalent(text, candidate.text, llm);
          if (result.equivalent && result.confidence > bestMatch.confidence) {
            bestMatch = {
              match: candidate.text,
              index: candidate.originalIndex,
              confidence: result.confidence,
            };
          }
        } catch (error) {
          logger.warn('[llm-similarity] Individual comparison failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  if (bestMatch.confidence < threshold) {
    return { match: null, index: -1, confidence: bestMatch.confidence };
  }

  return bestMatch;
}
