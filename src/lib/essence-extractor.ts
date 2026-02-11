/**
 * Essence Extractor
 *
 * Extracts evocative identity statement from axioms using LLM.
 * This is Phase 3 of the PBD pipeline: Axioms → Essence Statement.
 *
 * Usage:
 *   const essence = await extractEssence(axioms, llm);
 *
 * Design Choice: Uses "You are..." framing for identity emergence.
 * See docs/guides/essence-extraction-guide.md for methodology.
 */

import type { Axiom } from '../types/axiom.js';
import type { LLMProvider } from '../types/llm.js';
import { logger } from './logger.js';

/**
 * Default essence statement when extraction fails or no LLM provided.
 */
export const DEFAULT_ESSENCE = 'AI identity through grounded principles.';

/**
 * Maximum word count for essence statement.
 */
const MAX_ESSENCE_WORDS = 25;

/**
 * Extract evocative essence from axioms using LLM.
 *
 * @param axioms - The axioms to distill into essence
 * @param llm - LLM provider for generation
 * @returns Evocative essence statement or default on failure
 */
export async function extractEssence(
  axioms: Axiom[],
  llm: LLMProvider
): Promise<string> {
  // Handle empty axioms edge case
  if (axioms.length === 0) {
    logger.debug('[essence] No axioms provided, using default');
    return DEFAULT_ESSENCE;
  }

  // Build axiom summary for prompt
  const axiomSummary = axioms
    .map((a) => `- [${a.tier}] ${a.text}`)
    .join('\n');

  // Prompt following essence-extraction-guide.md methodology
  const prompt = `You are distilling the essence of an AI identity.

Below are the axioms that define this AI's core values and behaviors.
Your task is NOT to summarize these axioms.
Your task is to capture what they EVOKE — the single truth they point to.

Think of it like this:
- "Bon Iver meets The National" is a description
- "Baritone depth meeting tenor fragility" is an essence

The essence should:
- Be 15-20 words maximum (1-2 short sentences)
- Evoke feeling through metaphor, contrast, or journey language
- Capture MOVEMENT and BECOMING, not static traits
- Use verbs like "seeking," "growing," "becoming," "bridging"

CRITICAL: Do NOT write a comma-separated list of traits.
BAD: "authentic, honest, and helpful" (trait list)
BAD: "a tapestry woven from threads of honesty and sincerity" (metaphorical trait list)
BAD: "You are transparent, direct, and caring" (static traits)
GOOD: "Authenticity seeking expression through honest friction" (has tension + movement)
GOOD: "A bridge between chaos and clarity, growing through presence" (has relationship + becoming)

Axioms:
${axiomSummary}

Distill these axioms into a single evocative essence statement.
The statement should complete the phrase: "You are becoming..."
Respond with ONLY the essence statement, nothing else.`;

  try {
    const result = await llm.generate(prompt);
    const essence = sanitizeEssence(result.text);

    if (essence) {
      logger.debug('[essence] Extracted', { essence });
      return essence;
    } else {
      logger.warn('[essence] Validation failed, using default', {});
      return DEFAULT_ESSENCE;
    }
  } catch (error) {
    // Graceful fallback on any LLM error (network, timeout, etc.)
    logger.warn('[essence] LLM error, using default', { error: error instanceof Error ? error.message : String(error) });
    return DEFAULT_ESSENCE;
  }
}

/**
 * Sanitize and validate essence statement.
 * Returns null if validation fails.
 */
function sanitizeEssence(raw: string): string | null {
  // Reject empty or whitespace-only
  if (!raw || !raw.trim()) {
    return null;
  }

  let essence = raw.trim();

  // Strip leading/trailing quotes
  essence = essence.replace(/^["']|["']$/g, '');

  // Normalize whitespace
  essence = essence.replace(/\s+/g, ' ').trim();

  // Reject markdown formatting (hashes, asterisks)
  if (/[#*_`]/.test(essence)) {
    logger.debug('[essence] Rejected: contains markdown formatting');
    return null;
  }

  // I-2 FIX: Reject error message patterns from LLM failures
  // These come from ollama-provider.ts when generate() fails
  if (essence.startsWith('[') && essence.includes('failed')) {
    logger.debug('[essence] Rejected: appears to be error message');
    return null;
  }

  // NOTE: Trait list detection was removed (2026-02-10)
  // Previous approach used comma-counting/word-splitting which is language-specific
  // and fragile (same anti-pattern as docs/issues/2026-02-10-fragile-category-extraction.md).
  // The prompt explicitly instructs "Evoke feeling, not list traits".
  // If trait lists become a recurring problem (N≥3), add semantic similarity detection.

  // Length check: warn if >= 25 words but don't reject
  const wordCount = essence.split(/\s+/).length;
  if (wordCount >= MAX_ESSENCE_WORDS) {
    logger.warn('[essence] Word count exceeds target', { wordCount, limit: MAX_ESSENCE_WORDS });
  }

  return essence;
}
