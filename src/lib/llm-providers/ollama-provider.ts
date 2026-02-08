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
   * Extract a category from LLM response text.
   * Handles various response formats:
   * - Direct category name: "identity-core"
   * - With explanation: "identity-core - this is about..."
   * - Quoted: "The category is 'identity-core'"
   */
  private extractCategory<T extends string>(
    response: string,
    categories: readonly T[]
  ): T | null {
    const normalizedResponse = response.toLowerCase().trim();

    // Try exact match first
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

    // Try fuzzy match (category words)
    for (const category of categories) {
      const categoryWords = category.toLowerCase().split('-');
      if (categoryWords.every((word) => normalizedResponse.includes(word))) {
        return category;
      }
    }

    return null;
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
      const category = this.extractCategory(response, categories);

      if (category) {
        // Note: Confidence scores are synthetic indicators, not derived from actual
        // LLM response patterns. They indicate extraction quality, not semantic certainty.
        // - 0.85: Successfully extracted category from response
        // - 0.30: Could not parse response, using fallback
        // - 0.10: Error occurred during classification
        // Future: Implement actual confidence scoring based on response patterns.
        return {
          category,
          confidence: 0.85,
          reasoning: response,
        };
      }

      // Fallback: use first category with low confidence
      // M-5 FIX: Use logger abstraction for configurable output
      logger.warn('Could not extract category from response, using fallback', {
        response: response.slice(0, 100),
        fallback: categories[0],
      });

      return {
        category: categories[0] as T,
        confidence: 0.3,
        reasoning: `Fallback - could not parse: ${response}`,
      };
    } catch (error) {
      // Re-throw availability errors
      if (error instanceof OllamaNotAvailableError) {
        throw error;
      }

      // For other errors, fallback with very low confidence
      // M-5 FIX: Use logger abstraction for configurable output
      logger.error('OllamaLLMProvider classify error', error);

      return {
        category: categories[0] as T,
        confidence: 0.1,
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
