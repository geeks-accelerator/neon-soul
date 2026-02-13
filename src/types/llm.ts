/**
 * LLM provider interface for semantic classification.
 *
 * All classification functions in semantic-classifier.ts require an LLM provider.
 * No fallback to keyword matching - LLM is mandatory (Option C design).
 */

/**
 * Options for classification requests.
 * CR6-8: Generic constrained to string - categories must be strings for prompt interpolation.
 */
export interface ClassifyOptions<T extends string> {
  /** Valid categories to choose from */
  categories: readonly T[];
  /** Additional context for the LLM */
  context?: string;
}

/**
 * Result from a classification request.
 * CR6-8: Generic constrained to string for consistency with ClassifyOptions.
 *
 * Stage 3 (2026-02-10): category is now nullable. When the LLM response
 * cannot be parsed into a valid category, category is null with confidence 0.
 * Callers must handle null category appropriately.
 */
export interface ClassificationResult<T extends string> {
  /** The classified category (null if parse failed) */
  category: T | null;
  /** Confidence score (0-1, 0 when category is null) */
  confidence: number;
  /** Optional explanation of the classification reasoning */
  reasoning?: string;
}

/**
 * LLM provider interface for semantic classification.
 *
 * Implementations should handle:
 * - Retry logic for transient failures
 * - Rate limiting
 * - Token budget management
 */
/**
 * Result from a text generation request.
 * IM-2 FIX: Added for notation generation use case.
 */
export interface GenerationResult {
  /** The generated text */
  text: string;
}

export interface LLMProvider {
  /**
   * I-3 FIX: Get model identifier for cache keying and provenance.
   * Optional for backward compatibility with existing implementations.
   */
  getModelId?(): string;

  /**
   * Classify text into one of the provided categories.
   *
   * @param prompt - The text to classify
   * @param options - Classification options including valid categories
   * @returns Classification result with category, confidence, and optional reasoning
   */
  classify<T extends string>(
    prompt: string,
    options: ClassifyOptions<T>
  ): Promise<ClassificationResult<T>>;

  /**
   * CR6-6: Optional batch classification for performance optimization.
   * Implementations may provide more efficient batch processing than
   * sequential classify() calls.
   *
   * TR-7 Optimization Path: This method is defined but not yet consumed.
   * When implementing batch processing optimizations:
   * 1. Check if provider supports classifyBatch before using
   * 2. Fall back to Promise.all(items.map(classify)) if not available
   * 3. Consider chunking large batches to avoid token limits
   *
   * @param prompts - Array of texts to classify
   * @param options - Classification options (same for all prompts)
   * @returns Array of classification results in same order as prompts
   */
  classifyBatch?<T extends string>(
    prompts: string[],
    options: ClassifyOptions<T>
  ): Promise<ClassificationResult<T>[]>;

  /**
   * Generate text from a prompt.
   * Used for notation generation and essence extraction.
   *
   * @param prompt - The generation prompt
   * @returns Generated text result
   */
  generate(prompt: string): Promise<GenerationResult>;
}

/**
 * Error thrown when LLM provider is required but not provided.
 *
 * This is the Option C fallback behavior - no degraded keyword matching.
 * Callers must provide an LLM provider for all semantic classification.
 *
 * Consumer Error Handling Guidance (TR-6):
 * - Display to user: "Unable to analyze - AI service unavailable"
 * - The `operation` field identifies which function failed (for logging)
 * - This error is recoverable - retry with valid LLM provider
 * - Do NOT fall back to keyword matching - that defeats semantic accuracy
 *
 * Related errors:
 * - Network errors from LLM: May retry with exponential backoff
 * - Invalid category errors: Bug in prompt/schema - should not reach users
 */
export class LLMRequiredError extends Error {
  override readonly name = 'LLMRequiredError';
  readonly operation: string;

  constructor(operation: string) {
    super(`LLM provider is required for ${operation}. No fallback available.`);
    this.operation = operation;
  }
}

/**
 * TR-4: Shared LLM validation utility.
 * Validates LLM provider is present and throws LLMRequiredError if not.
 *
 * @param llm - LLM provider to validate
 * @param operation - Operation name for error message
 * @throws LLMRequiredError if llm is null or undefined
 */
export function requireLLM(
  llm: LLMProvider | null | undefined,
  operation: string
): asserts llm is LLMProvider {
  if (!llm) {
    throw new LLMRequiredError(operation);
  }
}
