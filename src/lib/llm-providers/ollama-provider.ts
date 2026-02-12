/**
 * Ollama LLM Provider for NEON-SOUL.
 *
 * Implements LLMProvider interface using Ollama's OpenAI-compatible API.
 * Enables real LLM testing without external API keys.
 *
 * Usage:
 *   const llm = new OllamaLLMProvider({ model: 'llama3' });
 *   const result = await llm.classify(prompt, { categories: ['a', 'b'] });
 *
 * Environment Variables:
 *   - OLLAMA_BASE_URL: API base URL (default: http://localhost:11434)
 *   - OLLAMA_MODEL: Model to use (default: llama3)
 *   - OLLAMA_TIMEOUT: Request timeout in ms (default: 120000)
 *
 * Prerequisites:
 *   - Ollama running: docker compose -f docker/docker-compose.ollama.yml up -d
 *   - Model pulled: docker exec neon-soul-ollama ollama pull llama3
 *
 * Cross-Reference: docs/plans/2026-02-08-ollama-llm-provider.md
 */

import type {
  LLMProvider,
  ClassifyOptions,
  ClassificationResult,
  GenerationResult,
} from '../../types/llm.js';
import { logger } from '../logger.js';

/**
 * Configuration options for OllamaLLMProvider.
 */
export interface OllamaConfig {
  /** Ollama API base URL. Default: http://localhost:11434 or OLLAMA_BASE_URL env */
  baseUrl?: string;
  /** Model to use. Default: llama3 or OLLAMA_MODEL env */
  model?: string;
  /** Request timeout in milliseconds. Default: 120000 (120s) or OLLAMA_TIMEOUT env */
  timeout?: number;
}

/**
 * Get default config from environment variables.
 */
function getDefaultConfig(): Required<OllamaConfig> {
  return {
    baseUrl: process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434',
    model: process.env['OLLAMA_MODEL'] ?? 'llama3',
    timeout: parseInt(process.env['OLLAMA_TIMEOUT'] ?? '120000', 10),
  };
}

/**
 * Ollama chat completion response structure.
 */
interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

/**
 * Error thrown when Ollama is not available.
 */
export class OllamaNotAvailableError extends Error {
  override readonly name = 'OllamaNotAvailableError';

  constructor(baseUrl: string, cause?: Error) {
    super(
      `Ollama not available at ${baseUrl}. ` +
        'Start Ollama: docker compose -f docker/docker-compose.ollama.yml up -d'
    );
    this.cause = cause;
  }
}

/**
 * LLM provider implementation using Ollama's API.
 *
 * v0.2.0: Semantic fallback removed. Classification now uses only
 * fast string matching. If LLM returns unparseable category, returns null.
 * @see docs/plans/2026-02-12-llm-based-similarity.md (Stage 4)
 */
export class OllamaLLMProvider implements LLMProvider {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;

  constructor(config: OllamaConfig = {}) {
    const defaults = getDefaultConfig();
    this.baseUrl = config.baseUrl ?? defaults.baseUrl;
    this.model = config.model ?? defaults.model;
    this.timeout = config.timeout ?? defaults.timeout;
  }

  /**
   * Check if Ollama is available at the configured URL.
   */
  static async isAvailable(baseUrl = 'http://localhost:11434'): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${baseUrl}/api/tags`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Send a chat completion request to Ollama.
   */
  private async chat(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as OllamaChatResponse;
      return data.message.content;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Ollama request timed out after ${this.timeout}ms`);
        }
        // Connection errors, URL parsing errors, and fetch failures
        if (
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('fetch failed') ||
          error.message.includes('Failed to parse URL') ||
          error.message.includes('getaddrinfo') ||
          error.message.includes('network')
        ) {
          throw new OllamaNotAvailableError(this.baseUrl, error);
        }
      }
      throw error;
    }
  }

  /**
   * Maximum character distance between negation word and category for rejection.
   * Example: "not identity-core" has distance ~4, "this is not about identity-core" has distance ~16.
   * M-1 FIX: Extracted from magic number for clarity.
   */
  private static readonly NEGATION_PROXIMITY_CHARS = 20;

  /**
   * Negation patterns that indicate a category should NOT be matched.
   * M-3 FIX: Prevents misclassifying "not identity-core" as "identity-core".
   */
  private static readonly NEGATION_PATTERNS = [
    'not ',
    'no ',
    'never ',
    "isn't ",
    "doesn't ",
    'cannot ',
    "can't ",
    'exclude ',
    'without ',
  ];

  /**
   * Check if a category match is negated in the response.
   * Returns true if the category appears after a negation word.
   */
  private isNegated(response: string, category: string): boolean {
    const categoryLower = category.toLowerCase();
    const responseLower = response.toLowerCase();
    const categoryIndex = responseLower.indexOf(categoryLower);

    if (categoryIndex === -1) return false;

    // Check if any negation pattern appears before the category
    for (const negation of OllamaLLMProvider.NEGATION_PATTERNS) {
      const negationIndex = responseLower.lastIndexOf(negation, categoryIndex);
      // Negation must be within proximity threshold of category
      if (negationIndex !== -1 && categoryIndex - negationIndex < OllamaLLMProvider.NEGATION_PROXIMITY_CHARS + negation.length) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract a category from LLM response using fast string matching.
   * v0.2.0: Semantic fallback removed - returns null if no match found.
   * M-3 FIX: Now handles negation patterns to avoid misclassification.
   */
  private extractCategoryFast<T extends string>(
    response: string,
    categories: readonly T[]
  ): T | null {
    const normalizedResponse = response.toLowerCase().trim();

    // Try exact match first (fastest)
    for (const category of categories) {
      if (normalizedResponse === category.toLowerCase()) {
        return category;
      }
    }

    // Try to find category within response (with negation check)
    for (const category of categories) {
      if (normalizedResponse.includes(category.toLowerCase())) {
        // M-3 FIX: Skip if category is negated
        if (this.isNegated(normalizedResponse, category)) {
          logger.debug('[ollama] Skipping negated category', { category, response: response.slice(0, 50) });
          continue;
        }
        return category;
      }
    }

    return null;
  }

  /**
   * Classify text into one of the provided categories.
   *
   * v0.2.0: Semantic fallback removed. If fast string matching fails,
   * returns null category instead of attempting embedding-based fallback.
   * @see docs/plans/2026-02-12-llm-based-similarity.md (Stage 4)
   */
  async classify<T extends string>(
    prompt: string,
    options: ClassifyOptions<T>
  ): Promise<ClassificationResult<T>> {
    const categories = options.categories;

    const systemPrompt = `You are a precise classifier. Your task is to classify the given text into exactly one of the following categories:

${categories.map((c, i) => `${i + 1}. ${c}`).join('\n')}

IMPORTANT: Respond with ONLY the category name, nothing else. No explanation, no punctuation, just the exact category name from the list above.`;

    const userPrompt = options.context
      ? `Context: ${options.context}\n\nText to classify:\n${prompt}`
      : prompt;

    try {
      const response = await this.chat(systemPrompt, userPrompt);

      // Try fast string matching (exact/substring)
      const fastMatch = this.extractCategoryFast(response, categories);
      if (fastMatch) {
        return {
          category: fastMatch,
          confidence: 0.9, // High confidence for exact/substring match
          reasoning: response,
        };
      }

      // v0.2.0: Return null category if fast matching fails (no semantic fallback)
      logger.warn('[ollama] Could not extract category from response', {
        response: response.slice(0, 100),
      });

      return {
        category: null,
        confidence: 0,
        reasoning: `Could not parse category from response: ${response.slice(0, 100)}`,
      };
    } catch (error) {
      // Re-throw availability errors
      if (error instanceof OllamaNotAvailableError) {
        throw error;
      }

      // Return null category on error
      logger.error('OllamaLLMProvider classify error', error);

      return {
        category: null,
        confidence: 0,
        reasoning: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Generate text from a prompt.
   * Used for notation generation.
   */
  async generate(prompt: string): Promise<GenerationResult> {
    const systemPrompt =
      'You are a helpful assistant. Follow the user instructions precisely.';

    try {
      const response = await this.chat(systemPrompt, prompt);
      return { text: response.trim() };
    } catch (error) {
      if (error instanceof OllamaNotAvailableError) {
        throw error;
      }

      // M-5 FIX: Use logger abstraction for configurable output
      logger.error('OllamaLLMProvider generate error', error);
      return {
        text: `[Generation failed: ${error instanceof Error ? error.message : String(error)}]`,
      };
    }
  }
}
