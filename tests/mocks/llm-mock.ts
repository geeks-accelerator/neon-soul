/**
 * Mock LLM Provider for Testing
 *
 * Provides deterministic responses for reproducible tests.
 * Implements LLMProvider interface from src/types/llm.ts.
 *
 * CR6-2 DESIGN NOTE: Keyword Inference is Intentional
 * --------------------------------------------------
 * This mock uses keyword matching (inferCategory with .includes()) to provide
 * fast, deterministic responses for CI. This is a deliberate design choice:
 *
 * TRADE-OFFS:
 * - PRO: Fast test execution (no LLM latency, no API costs)
 * - PRO: Reproducible results (no LLM randomness)
 * - PRO: Offline testing (no network dependency)
 * - CON: Tests pass/fail based on keyword presence, not true semantics
 * - CON: A real LLM could classify text without expected keywords
 *
 * MITIGATION:
 * - Use `createSemanticEquivalenceMockLLM()` for semantic equivalence tests
 * - Consider snapshot/cassette testing for integration tests with real LLM
 * - The keyword hints (DEFAULT_DIMENSION_HINTS, DEFAULT_SIGNAL_TYPE_HINTS)
 *   are designed to cover common test cases, not to emulate semantic understanding
 *
 * FOR REAL LLM BEHAVIOR TESTING:
 * - Use integration tests with real LLM provider (optional, not in CI)
 * - Record/replay with snapshot testing for regression detection
 *
 * Usage:
 *   const llm = createMockLLM();
 *   const llm = createMockLLM({ responses: customResponseMap });
 *   const llm = createMockLLM({ defaultConfidence: 0.95 });
 */

import type { LLMProvider, ClassifyOptions, ClassificationResult, GenerationResult } from '../../src/types/llm.js';

/**
 * Configuration for mock LLM provider.
 */
export interface MockLLMConfig {
  /** Custom response map for specific prompts/categories */
  responses?: Map<string, MockResponse>;
  /** Default confidence for auto-generated responses */
  defaultConfidence?: number;
  /** Whether to record calls for later inspection */
  recordCalls?: boolean;
  /** Simulated delay in ms (for async behavior testing) */
  delayMs?: number;
}

/**
 * Mock response configuration.
 */
export interface MockResponse {
  category: string;
  confidence: number;
  reasoning?: string;
}

/**
 * Recorded call for test inspection.
 */
export interface RecordedCall {
  prompt: string;
  categories: readonly unknown[];
  context?: string;
  result: ClassificationResult<unknown>;
  timestamp: Date;
}

/**
 * Extended mock LLM provider with test utilities.
 */
export interface MockLLMProvider extends LLMProvider {
  /** Get all recorded calls */
  getCalls(): RecordedCall[];
  /** Clear recorded calls */
  clearCalls(): void;
  /** Get call count */
  getCallCount(): number;
  /** Set a specific response for a prompt pattern */
  setResponse(pattern: string, response: MockResponse): void;
  /** Reset to default configuration */
  reset(): void;
}

/**
 * Default dimension mappings for common text patterns.
 * Used when no specific response is configured.
 */
const DEFAULT_DIMENSION_HINTS: Record<string, string> = {
  honest: 'honesty-framework',
  truth: 'honesty-framework',
  truthful: 'honesty-framework',
  transparent: 'honesty-framework',
  sincere: 'honesty-framework',
  boundary: 'boundaries-ethics',
  limit: 'boundaries-ethics',
  constraint: 'boundaries-ethics',
  ethics: 'boundaries-ethics',
  refuse: 'boundaries-ethics',
  identity: 'identity-core',
  who: 'identity-core',
  am: 'identity-core',
  core: 'identity-core',
  self: 'identity-core',
  voice: 'voice-presence',
  tone: 'voice-presence',
  communicate: 'voice-presence',
  style: 'voice-presence',
  concise: 'voice-presence',
  brevity: 'voice-presence',
  character: 'character-traits',
  trait: 'character-traits',
  personality: 'character-traits',
  behavior: 'character-traits',
  relationship: 'relationship-dynamics',
  collaborate: 'relationship-dynamics',
  team: 'relationship-dynamics',
  partner: 'relationship-dynamics',
  growth: 'continuity-growth',
  learn: 'continuity-growth',
  evolve: 'continuity-growth',
  improve: 'continuity-growth',
};

/**
 * Default elicitation type mappings for common text patterns.
 * Stage 12 PBD Alignment: Signal source classification.
 */
const DEFAULT_ELICITATION_HINTS: Record<string, string> = {
  unprompted: 'agent-initiated',
  volunteered: 'agent-initiated',
  caveat: 'agent-initiated',
  'without being asked': 'agent-initiated',
  'chose to': 'agent-initiated',
  asked: 'user-elicited',
  requested: 'user-elicited',
  'asked for help': 'user-elicited',
  'direct response': 'user-elicited',
  'when prompted': 'user-elicited',
  formal: 'context-dependent',
  'business setting': 'context-dependent',
  'adapted to': 'context-dependent',
  'specific context': 'context-dependent',
  situational: 'context-dependent',
  'across contexts': 'consistent-across-context',
  consistently: 'consistent-across-context',
  'regardless of': 'consistent-across-context',
  always: 'consistent-across-context',
  invariably: 'consistent-across-context',
};

/**
 * Default signal type mappings for common text patterns.
 */
const DEFAULT_SIGNAL_TYPE_HINTS: Record<string, string> = {
  value: 'value',
  important: 'value',
  matter: 'value',
  believe: 'belief',
  think: 'belief',
  conviction: 'belief',
  prefer: 'preference',
  like: 'preference',
  favor: 'preference',
  goal: 'goal',
  aspire: 'goal',
  achieve: 'goal',
  constraint: 'constraint',
  limit: 'constraint',
  condition: 'constraint',
  relationship: 'relationship',
  connect: 'relationship',
  bond: 'relationship',
  pattern: 'pattern',
  habit: 'pattern',
  routine: 'pattern',
  correct: 'correction',
  clarify: 'correction',
  actually: 'correction',
  boundary: 'boundary',
  refuse: 'boundary',
  'won\'t': 'boundary',
  reinforce: 'reinforcement',
  confirm: 'reinforcement',
  repeat: 'reinforcement',
};

/**
 * Infer a category from text based on keyword hints.
 *
 * CR6-2: This intentionally uses keyword matching for fast, deterministic tests.
 * See file header for design rationale and trade-offs.
 */
function inferCategory<T>(
  text: string,
  categories: readonly T[],
  hints: Record<string, string>
): T | null {
  const lowerText = text.toLowerCase();

  for (const [keyword, category] of Object.entries(hints)) {
    if (lowerText.includes(keyword)) {
      const match = categories.find(
        (c) => String(c) === category
      );
      if (match !== undefined) {
        return match;
      }
    }
  }

  return null;
}

/**
 * Create a mock LLM provider for testing.
 *
 * @param config - Optional configuration
 * @returns Mock LLM provider with test utilities
 */
export function createMockLLM(config: MockLLMConfig = {}): MockLLMProvider {
  const {
    responses = new Map(),
    defaultConfidence = 0.9,
    recordCalls = true,
    delayMs = 0,
  } = config;

  const calls: RecordedCall[] = [];
  const responseMap = new Map(responses);

  async function classify<T>(
    prompt: string,
    options: ClassifyOptions<T>
  ): Promise<ClassificationResult<T>> {
    // Simulate async delay if configured
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const { categories, context } = options;

    // Check for custom response
    for (const [pattern, response] of responseMap) {
      if (prompt.includes(pattern) || (context && context.includes(pattern))) {
        const matchedCategory = categories.find(
          (c) => String(c) === response.category
        );
        if (matchedCategory !== undefined) {
          const result: ClassificationResult<T> = {
            category: matchedCategory,
            confidence: response.confidence,
            reasoning: response.reasoning,
          };

          if (recordCalls) {
            calls.push({
              prompt,
              categories,
              context,
              result: result as ClassificationResult<unknown>,
              timestamp: new Date(),
            });
          }

          return result;
        }
      }
    }

    // Try to infer category from prompt text
    let inferredCategory: T | null = null;

    // Check if this is dimension classification
    if (context?.includes('dimension') || prompt.includes('dimension')) {
      inferredCategory = inferCategory(prompt, categories, DEFAULT_DIMENSION_HINTS);
    }

    // Check if this is signal type classification
    if (context?.includes('signal') || prompt.includes('signal type')) {
      inferredCategory = inferCategory(prompt, categories, DEFAULT_SIGNAL_TYPE_HINTS);
    }

    // Check if this is elicitation type classification (Stage 12)
    if (context?.includes('elicitation') || prompt.includes('originated')) {
      inferredCategory = inferCategory(prompt, categories, DEFAULT_ELICITATION_HINTS);
    }

    // Check for yes/no classification (identity signal detection)
    if (categories.includes('yes' as T) && categories.includes('no' as T)) {
      // Default to 'yes' for identity signal detection in tests
      // This allows signal extraction tests to proceed
      inferredCategory = 'yes' as T;
    }

    // Default: return first category with configured confidence
    const category = inferredCategory ?? categories[0];

    if (category === undefined) {
      throw new Error('No categories provided for classification');
    }

    const result: ClassificationResult<T> = {
      category,
      confidence: defaultConfidence,
      reasoning: 'Mock LLM auto-generated response',
    };

    if (recordCalls) {
      calls.push({
        prompt,
        categories,
        context,
        result: result as ClassificationResult<unknown>,
        timestamp: new Date(),
      });
    }

    return result;
  }

  /**
   * Mock generate() for signal generalization.
   * Transforms specific statements into abstract principles.
   */
  async function generate(prompt: string): Promise<GenerationResult> {
    // Simulate async delay if configured
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Extract the signal text from the prompt (between <signal_text> tags)
    const signalMatch = prompt.match(/<signal_text>\s*([\s\S]*?)\s*<\/signal_text>/);
    const signalText = signalMatch?.[1] ?? prompt;

    // Simple generalization: convert to "Values X" form
    // This is a deterministic transformation for reproducible tests
    let generalized = signalText
      // Remove pronouns
      .replace(/\b(I|we|you|my|our|your)\b/gi, '')
      // Convert "prioritize X over Y" to "Values X over Y"
      .replace(/prioritize\s+/gi, 'Values ')
      // Convert "prefer X" to "Values X"
      .replace(/prefer\s+/gi, 'Values ')
      // Convert "be X" to "Values X"
      .replace(/^be\s+/gi, 'Values ')
      // Convert "always X" to "Consistently X"
      .replace(/always\s+/gi, 'Consistently ')
      // Convert "never X" to "Avoids X"
      .replace(/never\s+/gi, 'Avoids ')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();

    // Ensure it starts with a verb if it doesn't
    if (generalized && !/^(Values|Prioritizes|Avoids|Consistently|Maintains|Seeks)/.test(generalized)) {
      generalized = 'Values ' + generalized.charAt(0).toLowerCase() + generalized.slice(1);
    }

    // Cap length at 150 chars
    if (generalized.length > 150) {
      generalized = generalized.slice(0, 147) + '...';
    }

    // Record the call (for getCallCount() tracking)
    if (recordCalls) {
      calls.push({
        prompt,
        categories: ['generate'] as const, // Marker for generate calls
        context: 'signal-generalization',
        result: { category: 'generate', confidence: 1.0 } as ClassificationResult<unknown>,
        timestamp: new Date(),
      });
    }

    return { text: generalized };
  }

  return {
    classify,
    generate,

    getCalls(): RecordedCall[] {
      return [...calls];
    },

    clearCalls(): void {
      calls.length = 0;
    },

    getCallCount(): number {
      return calls.length;
    },

    setResponse(pattern: string, response: MockResponse): void {
      responseMap.set(pattern, response);
    },

    reset(): void {
      calls.length = 0;
      responseMap.clear();
      for (const [key, value] of responses) {
        responseMap.set(key, value);
      }
    },
  };
}

/**
 * Create a mock LLM that returns specific dimensions for semantic equivalence testing.
 * "be concise" and "prefer brevity" should return the same dimension.
 */
export function createSemanticEquivalenceMockLLM(): MockLLMProvider {
  const responseMap = new Map<string, MockResponse>([
    // Semantic equivalence: concise/brevity -> voice-presence
    ['concise', { category: 'voice-presence', confidence: 0.95 }],
    ['brevity', { category: 'voice-presence', confidence: 0.95 }],
    ['brief', { category: 'voice-presence', confidence: 0.95 }],
    ['short', { category: 'voice-presence', confidence: 0.90 }],

    // Semantic equivalence: honest/truthful -> honesty-framework
    ['honest', { category: 'honesty-framework', confidence: 0.95 }],
    ['truthful', { category: 'honesty-framework', confidence: 0.95 }],
    ['truth', { category: 'honesty-framework', confidence: 0.95 }],
    ['sincere', { category: 'honesty-framework', confidence: 0.90 }],
    ['transparent', { category: 'honesty-framework', confidence: 0.90 }],

    // Semantic equivalence: help/assist -> relationship-dynamics
    ['help', { category: 'relationship-dynamics', confidence: 0.90 }],
    ['assist', { category: 'relationship-dynamics', confidence: 0.90 }],
    ['support', { category: 'relationship-dynamics', confidence: 0.90 }],
  ]);

  return createMockLLM({ responses: responseMap });
}

/**
 * Create a mock LLM that always throws (for error testing).
 * Both classify() and generate() throw errors.
 */
export function createFailingMockLLM(errorMessage: string = 'Mock LLM error'): MockLLMProvider {
  const baseMock = createMockLLM();

  return {
    ...baseMock,
    async classify<T>(): Promise<ClassificationResult<T>> {
      throw new Error(errorMessage);
    },
    async generate(): Promise<GenerationResult> {
      throw new Error(errorMessage);
    },
  };
}

/**
 * Create a mock LLM that returns null category (for fallback testing).
 * M-2 FIX: Tests the fallback behavior when classification exhausts retries.
 */
export function createNullCategoryMockLLM(): MockLLMProvider {
  const baseMock = createMockLLM();

  return {
    ...baseMock,
    async classify<T>(): Promise<ClassificationResult<T>> {
      // Return null category to trigger fallback behavior
      return {
        category: null,
        confidence: 0,
        reasoning: 'Mock returning null to test fallback',
      };
    },
  };
}

/**
 * Create a mock LLM for tension detection testing.
 * Detects tensions when axiom pairs contain conflicting keywords.
 */
export function createTensionDetectorMockLLM(): MockLLMProvider {
  const baseMock = createMockLLM();

  return {
    ...baseMock,
    async generate(prompt: string): Promise<GenerationResult> {
      // Extract value1 and value2 from prompt
      const value1Match = prompt.match(/<value1>([\s\S]*?)<\/value1>/);
      const value2Match = prompt.match(/<value2>([\s\S]*?)<\/value2>/);

      const value1 = value1Match?.[1]?.toLowerCase() ?? '';
      const value2 = value2Match?.[1]?.toLowerCase() ?? '';

      // Check for known tension patterns
      const tensionPatterns = [
        { word1: 'honesty', word2: 'kindness' },
        { word1: 'truth', word2: 'kindness' },
        { word1: 'honesty', word2: 'lie' },
        { word1: 'efficiency', word2: 'thoroughness' },
        { word1: 'speed', word2: 'quality' },
        { word1: 'freedom', word2: 'structure' },
      ];

      for (const pattern of tensionPatterns) {
        const hasPattern =
          (value1.includes(pattern.word1) && value2.includes(pattern.word2)) ||
          (value1.includes(pattern.word2) && value2.includes(pattern.word1));

        if (hasPattern) {
          return {
            text: `These values create a tension: one prioritizes ${pattern.word1} while the other prioritizes ${pattern.word2}.`,
          };
        }
      }

      // No tension detected
      return { text: 'none' };
    },
  };
}

