/**
 * Signal Generalization Helpers
 *
 * Pure functions for prompt building and validation.
 * Extracted from signal-generalizer.ts for MCE compliance.
 */

/** Maximum allowed length for generalized output */
export const MAX_OUTPUT_LENGTH = 150;

/** Maximum input length for prompt safety */
export const MAX_INPUT_LENGTH = 500;

/**
 * Regex pattern for pronouns that should not appear in actor-agnostic output.
 * Uses word boundaries to catch all cases (end of string, punctuation, etc.)
 */
export const PRONOUN_PATTERN = /\b(I|we|you|my|our|your|me|us|myself|ourselves|yourself|yourselves)\b/i;

/**
 * Sanitize user input to prevent prompt injection.
 * Escapes XML-like tags, markdown, and limits length.
 */
export function sanitizeForPrompt(text: string): string {
  return text
    .slice(0, MAX_INPUT_LENGTH)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`/g, "'")
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Build the generalization prompt for a signal.
 */
export function buildPrompt(signalText: string, dimension?: string): string {
  const sanitizedText = sanitizeForPrompt(signalText);
  const dimensionContext = dimension ?? 'general';

  return `Transform this specific statement into an abstract principle.

The principle should:
- Capture the core value or preference
- Be general enough to match similar statements
- Be actionable (can guide behavior)
- Stay under 150 characters
- Use imperative form (e.g., "Values X over Y", "Prioritizes Z")
- Do NOT add policies or concepts not present in the original
- Do NOT use pronouns (I, we, you) - abstract the actor
- If the original has conditions, preserve them

<signal_text>
${sanitizedText}
</signal_text>

<dimension_context>
${dimensionContext}
</dimension_context>

Output ONLY the generalized principle, nothing else.`;
}

/**
 * Validation result for generalized output.
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate generalized output meets constraints.
 * Returns validation result with reason if failed.
 */
export function validateGeneralization(
  original: string,
  generalized: string
): ValidationResult {
  // Check non-empty
  if (!generalized || generalized.trim().length === 0) {
    return { valid: false, reason: 'empty output' };
  }

  // Check length cap
  if (generalized.length > MAX_OUTPUT_LENGTH) {
    return { valid: false, reason: `exceeds ${MAX_OUTPUT_LENGTH} chars (got ${generalized.length})` };
  }

  // Check for forbidden pronouns using word boundary regex
  const pronounMatch = generalized.match(PRONOUN_PATTERN);
  if (pronounMatch) {
    return { valid: false, reason: `contains pronoun "${pronounMatch[0]}"` };
  }

  // Basic sanity check - output shouldn't be dramatically longer than input
  // (allows for some expansion but catches runaway generation)
  if (generalized.length > original.length * 3 && generalized.length > 100) {
    return { valid: false, reason: 'output too long relative to input' };
  }

  return { valid: true };
}
