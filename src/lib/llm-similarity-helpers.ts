/**
 * Internal helpers for LLM-based semantic similarity.
 *
 * Contains parsing, retry logic, and utility functions.
 * Not intended for direct import outside llm-similarity.ts.
 *
 * Cross-Reference: docs/plans/2026-02-12-llm-based-similarity.md (Stage 1)
 */

import { logger } from './logger.js';

/** Default retry configuration */
export const MAX_RETRIES = 3;
export const INITIAL_BACKOFF_MS = 500;

/** Maximum candidates per batch to avoid token limits */
export const MAX_BATCH_SIZE = 20;

/**
 * Escape untrusted text for safe inclusion in prompts.
 * Prevents prompt injection by quoting and escaping special patterns.
 */
export function escapeForPrompt(text: string): string {
  const escaped = text
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')    // Escape double quotes
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r');  // Escape carriage returns
  return `"${escaped}"`;
}

/**
 * Map confidence string to numeric value.
 * Explicit rules from plan: high=0.9, medium=0.7, low=0.5
 */
export function parseConfidence(value: string | number | undefined): number {
  if (typeof value === 'number') {
    return Math.max(0, Math.min(1, value));
  }

  if (typeof value !== 'string') {
    return 0.5;
  }

  const normalized = value.toLowerCase().trim();

  if (normalized === 'high' || normalized === 'yes' || normalized === 'true') {
    return 0.9;
  }
  if (normalized === 'medium' || normalized === 'moderate' || normalized === 'partial') {
    return 0.7;
  }
  if (normalized === 'low' || normalized === 'no' || normalized === 'false') {
    return 0.5;
  }

  const numeric = parseFloat(normalized);
  if (!isNaN(numeric)) {
    return Math.max(0, Math.min(1, numeric));
  }

  logger.warn('[llm-similarity] Unparseable confidence, defaulting to low', {
    value: normalized.slice(0, 50)
  });
  return 0.5;
}

/** LLM refusal patterns indicating inability to compare */
const REFUSAL_PATTERNS = [
  'cannot compare',
  'unable to determine',
  'not enough information',
  'i cannot',
  "i'm unable",
];

/**
 * Parse equivalence response from LLM.
 * Expects format: { "equivalent": boolean, "confidence": "high"|"medium"|"low" }
 */
export function parseEquivalenceResponse(
  response: string
): { equivalent: boolean; confidence: number } {
  const trimmed = response.trim();

  // Try JSON parse first
  try {
    const jsonMatch = trimmed.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const equivalent = parsed['equivalent'] === true ||
                        parsed['equivalent'] === 'true' ||
                        parsed['equivalent'] === 'yes';
      const confidence = parseConfidence(parsed['confidence'] as string | number);
      return { equivalent, confidence };
    }
  } catch {
    // JSON parse failed, try pattern matching
  }

  // Handle LLM refusals gracefully
  const lowerResponse = trimmed.toLowerCase();
  for (const pattern of REFUSAL_PATTERNS) {
    if (lowerResponse.includes(pattern)) {
      return { equivalent: false, confidence: 0.5 };
    }
  }

  // Simple pattern matching for yes/no responses
  if (/^(yes|true|equivalent|same|match)/i.test(trimmed)) {
    return { equivalent: true, confidence: 0.7 };
  }
  if (/^(no|false|different|not equivalent|not the same)/i.test(trimmed)) {
    return { equivalent: false, confidence: 0.7 };
  }

  logger.warn('[llm-similarity] Could not parse equivalence response', {
    response: trimmed.slice(0, 100),
  });
  return { equivalent: false, confidence: 0.5 };
}

/**
 * Parse batch comparison response from LLM.
 * Expects format: { "bestMatchIndex": number, "confidence": "high"|"medium"|"low" }
 */
export function parseBatchResponse(
  response: string,
  candidateCount: number
): { index: number; confidence: number } {
  const trimmed = response.trim();

  // Try JSON parse first
  try {
    const jsonMatch = trimmed.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

      if (parsed['bestMatchIndex'] === -1 ||
          parsed['bestMatchIndex'] === null ||
          parsed['noMatch'] === true) {
        return { index: -1, confidence: 0 };
      }

      const index = parseInt(String(parsed['bestMatchIndex']), 10);
      const confidence = parseConfidence(parsed['confidence'] as string | number);

      if (isNaN(index) || index < 0 || index >= candidateCount) {
        logger.warn('[llm-similarity] Invalid match index in response', {
          index,
          candidateCount,
          response: trimmed.slice(0, 100),
        });
        return { index: -1, confidence: 0 };
      }

      return { index, confidence };
    }
  } catch {
    // JSON parse failed
  }

  // Handle "none" or "no match" responses
  if (/^(none|no match|not found|-1)/i.test(trimmed)) {
    return { index: -1, confidence: 0 };
  }

  // Try to extract a number from the response
  const numberMatch = trimmed.match(/\b(\d+)\b/);
  if (numberMatch && numberMatch[1] !== undefined) {
    const index = parseInt(numberMatch[1], 10);
    if (index >= 0 && index < candidateCount) {
      return { index, confidence: 0.7 };
    }
  }

  logger.warn('[llm-similarity] Could not parse batch response', {
    response: trimmed.slice(0, 100),
  });
  return { index: -1, confidence: 0 };
}

/**
 * Check if an error is transient and should be retried.
 */
export function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('network') ||
    message.includes('econnreset') ||
    message.includes('socket')
  );
}

/**
 * Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with exponential backoff retry.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isTransientError(error) || attempt === maxRetries - 1) {
        throw lastError;
      }

      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      logger.debug('[llm-similarity] Retrying after transient error', {
        attempt: attempt + 1,
        backoffMs,
        error: lastError.message,
      });
      await sleep(backoffMs);
    }
  }

  throw lastError ?? new Error('Retry failed');
}
