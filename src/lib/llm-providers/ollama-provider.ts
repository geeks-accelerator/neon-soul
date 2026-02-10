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
import { embed } from '../embeddings.js';
import { cosineSimilarity } from '../matcher.js';

/**
 * Cache for category embeddings to avoid re-computing.
 * Key: category name, Value: embedding vector
 */
const categoryEmbeddingCache = new Map<string, number[]>();

/**
 * Configuration options for OllamaLLMProvider.
 */
export interface OllamaConfig {
  /** Ollama API base URL. Default: http://localhost:11434 */
  baseUrl?: string;
  /** Model to use. Default: llama3 */
  model?: string;
  /** Request timeout in milliseconds. Default: 30000 (30s) */
  timeout?: number;
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
 */
export class OllamaLLMProvider implements LLMProvider {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'http://localhost:11434';
    this.model = config.model ?? 'llama3';
    this.timeout = config.timeout ?? 30000;
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
   * Extract a category from LLM response using fast string matching.
   * Returns null if no match found (caller should use semantic fallback).
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

    // Try to find category within response
    for (const category of categories) {
      if (normalizedResponse.includes(category.toLowerCase())) {
        return category;
      }
    }

    return null;
  }

  /**
   * Extract a category using semantic similarity (embedding-based).
   * Used when fast string matching fails.
   *
   * This handles cases like "continuity" → "continuity-growth" where
   * the LLM response is semantically related but not an exact match.
   */
  private async extractCategorySemantic<T extends string>(
    response: string,
    categories: readonly T[]
  ): Promise<{ category: T; similarity: number } | null> {
    try {
      // Embed the LLM response
      const responseEmbedding = await embed(response.toLowerCase().trim());

      let bestCategory: T | null = null;
      let bestSimilarity = -1;

      // Compare against each category
      for (const category of categories) {
        // Get or compute category embedding
        let categoryEmbedding = categoryEmbeddingCache.get(category);
        if (!categoryEmbedding) {
          // Embed with human-readable form (replace hyphens with spaces)
          categoryEmbedding = await embed(category.replace(/-/g, ' '));
          categoryEmbeddingCache.set(category, categoryEmbedding);
        }

        const similarity = cosineSimilarity(responseEmbedding, categoryEmbedding);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestCategory = category;
        }
      }

      // Require minimum similarity threshold (0.3 is lenient but filters noise)
      const MIN_SIMILARITY = 0.3;
      if (bestCategory && bestSimilarity >= MIN_SIMILARITY) {
        logger.debug('[ollama] Semantic category match', {
          response: response.slice(0, 50),
          category: bestCategory,
          similarity: bestSimilarity.toFixed(3),
        });
        return { category: bestCategory, similarity: bestSimilarity };
      }

      return null;
    } catch (error) {
      logger.warn('[ollama] Semantic matching failed, returning null', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Classify text into one of the provided categories.
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

      // Stage 1: Try fast string matching (exact/substring)
      const fastMatch = this.extractCategoryFast(response, categories);
      if (fastMatch) {
        return {
          category: fastMatch,
          confidence: 0.9, // High confidence for exact/substring match
          reasoning: response,
        };
      }

      // Stage 2: Fall back to semantic similarity (embedding-based)
      // This handles cases like "continuity" → "continuity-growth"
      const semanticMatch = await this.extractCategorySemantic(response, categories);
      if (semanticMatch) {
        return {
          category: semanticMatch.category,
          confidence: semanticMatch.similarity, // Use actual similarity as confidence
          reasoning: response,
        };
      }

      // Stage 3: Return null category if both methods fail
      logger.warn('Could not extract category from response', {
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

      // Stage 3: Return null category on error instead of fallback
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
