/**
 * VCR LLM Provider - Record/Replay wrapper for deterministic LLM testing.
 *
 * Implements the RORRD pattern (Record Reality Once, Replay Deterministically)
 * for LLM API calls. Enables fast, deterministic CI testing with real LLM behavior.
 *
 * Modes:
 * - replay (default): Load from fixture, error if missing
 * - record: Call real provider, save to fixture
 * - passthrough: Call real provider, don't save
 *
 * Usage:
 *   const realLLM = new OllamaLLMProvider({ model: 'llama3' });
 *   const vcrLLM = new VCRLLMProvider(realLLM, 'tests/fixtures/vcr', 'replay');
 *
 * Cross-Reference:
 * - docs/observations/http-vcr-pattern-for-api-testing.md (Part 13)
 * - docs/plans/2026-02-09-signal-generalization.md (Stage 4a)
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  LLMProvider,
  ClassifyOptions,
  ClassificationResult,
  GenerationResult,
} from '../../types/llm.js';
import { PROMPT_VERSION } from '../signal-generalizer.js';
import { logger } from '../logger.js';

/**
 * VCR operation modes.
 */
export type VCRMode = 'replay' | 'record' | 'passthrough';

/**
 * Fixture metadata for debugging and cache invalidation.
 */
export interface FixtureMetadata {
  /** Type of LLM operation */
  type: 'classify' | 'generate';
  /** Hash used as fixture key */
  hash: string;
  /** Prompt version for cache invalidation */
  promptVersion: string;
  /** When fixture was recorded */
  recordedAt: string;
  /** Model used (if available) */
  model?: string;
}

/**
 * Classification fixture format.
 */
export interface ClassifyFixture<T extends string = string> {
  _metadata: FixtureMetadata;
  prompt: string;
  categories: readonly T[];
  context?: string;
  result: ClassificationResult<T>;
}

/**
 * Generation fixture format.
 */
export interface GenerateFixture {
  _metadata: FixtureMetadata;
  prompt: string;
  result: GenerationResult;
}

/**
 * VCR statistics for debugging.
 */
export interface VCRStats {
  hits: number;
  misses: number;
  recordings: number;
  errors: number;
}

/**
 * Error thrown when fixture is missing in replay mode.
 */
export class FixtureMissingError extends Error {
  override readonly name = 'FixtureMissingError';
  readonly fixturePath: string;
  readonly hash: string;

  constructor(fixturePath: string, hash: string) {
    super(
      `Fixture not found: ${fixturePath}\n` +
        `Hash: ${hash}\n` +
        'Run with VCR_MODE=record to create fixture.'
    );
    this.fixturePath = fixturePath;
    this.hash = hash;
  }
}

/**
 * VCR LLM Provider - wraps any LLMProvider with record/replay capability.
 */
export class VCRLLMProvider implements LLMProvider {
  private readonly provider: LLMProvider;
  private readonly fixtureDir: string;
  private readonly mode: VCRMode;
  private readonly modelName: string;
  private readonly stats: VCRStats = {
    hits: 0,
    misses: 0,
    recordings: 0,
    errors: 0,
  };

  /**
   * @param provider - Underlying LLM provider
   * @param fixtureDir - Directory for fixture storage
   * @param mode - VCR operation mode (replay/record/passthrough)
   * @param modelName - Model name for fixture key (default: 'unknown')
   */
  constructor(
    provider: LLMProvider,
    fixtureDir: string,
    mode: VCRMode = 'replay',
    modelName: string = 'unknown'
  ) {
    this.provider = provider;
    this.fixtureDir = fixtureDir;
    this.mode = mode;
    this.modelName = modelName;

    // Ensure fixture directory exists
    if (!existsSync(fixtureDir)) {
      mkdirSync(fixtureDir, { recursive: true });
    }

    logger.debug(`[vcr] Initialized in ${mode} mode, fixtures: ${fixtureDir}`);
  }

  /**
   * Generate hash for fixture key.
   * Includes model name and prompt version for cache invalidation.
   * Uses 32 hex chars (128 bits) to prevent birthday paradox collisions.
   *
   * @see docs/issues/2026-02-09-signal-generalization-impl-findings.md (Finding #7, #8)
   */
  private generateHash(
    type: 'classify' | 'generate',
    prompt: string,
    categories?: readonly unknown[]
  ): string {
    const data = JSON.stringify({
      type,
      prompt,
      categories: categories ?? [],
      promptVersion: PROMPT_VERSION,
      model: this.modelName,
    });
    return createHash('sha256').update(data).digest('hex').slice(0, 32);
  }

  /**
   * Get fixture path for a given hash.
   */
  private getFixturePath(hash: string): string {
    return join(this.fixtureDir, `${hash}.json`);
  }

  /**
   * Load fixture from disk.
   */
  private loadFixture<T>(hash: string): T | null {
    const path = this.getFixturePath(hash);
    if (!existsSync(path)) {
      return null;
    }

    try {
      const content = readFileSync(path, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.warn(`[vcr] Failed to load fixture: ${path}: ${errorMsg}`);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Save fixture to disk.
   */
  private saveFixture<T>(hash: string, fixture: T): void {
    const path = this.getFixturePath(hash);
    try {
      writeFileSync(path, JSON.stringify(fixture, null, 2));
      this.stats.recordings++;
      logger.debug(`[vcr] Recorded fixture: ${path}`);
    } catch (error) {
      logger.error(`[vcr] Failed to save fixture: ${path}`, error);
      this.stats.errors++;
    }
  }

  /**
   * Classify text using VCR record/replay.
   */
  async classify<T extends string>(
    prompt: string,
    options: ClassifyOptions<T>
  ): Promise<ClassificationResult<T>> {
    const hash = this.generateHash('classify', prompt, options.categories);
    const fixturePath = this.getFixturePath(hash);

    // Passthrough mode: always call real provider
    if (this.mode === 'passthrough') {
      return this.provider.classify(prompt, options);
    }

    // Try to load existing fixture
    const fixture = this.loadFixture<ClassifyFixture<T>>(hash);

    if (fixture) {
      this.stats.hits++;
      logger.debug(`[vcr] Replay hit: ${hash}`);
      return fixture.result;
    }

    // Fixture missing
    this.stats.misses++;

    if (this.mode === 'replay') {
      throw new FixtureMissingError(fixturePath, hash);
    }

    // Record mode: call real provider and save
    const result = await this.provider.classify(prompt, options);

    const newFixture: ClassifyFixture<T> = {
      _metadata: {
        type: 'classify',
        hash,
        promptVersion: PROMPT_VERSION,
        recordedAt: new Date().toISOString(),
        model: this.modelName,
      },
      prompt,
      categories: options.categories,
      ...(options.context !== undefined && { context: options.context }),
      result,
    };

    this.saveFixture(hash, newFixture);
    return result;
  }

  /**
   * Generate text using VCR record/replay.
   */
  async generate(prompt: string): Promise<GenerationResult> {
    // Note: generate() is required on LLMProvider interface (not optional)
    const hash = this.generateHash('generate', prompt);
    const fixturePath = this.getFixturePath(hash);

    // Passthrough mode: always call real provider
    if (this.mode === 'passthrough') {
      return this.provider.generate(prompt);
    }

    // Try to load existing fixture
    const fixture = this.loadFixture<GenerateFixture>(hash);

    if (fixture) {
      this.stats.hits++;
      logger.debug(`[vcr] Replay hit: ${hash}`);
      return fixture.result;
    }

    // Fixture missing
    this.stats.misses++;

    if (this.mode === 'replay') {
      throw new FixtureMissingError(fixturePath, hash);
    }

    // Record mode: call real provider and save
    const result = await this.provider.generate(prompt);

    const newFixture: GenerateFixture = {
      _metadata: {
        type: 'generate',
        hash,
        promptVersion: PROMPT_VERSION,
        recordedAt: new Date().toISOString(),
        model: this.modelName,
      },
      prompt,
      result,
    };

    this.saveFixture(hash, newFixture);
    return result;
  }

  /**
   * Get VCR statistics for debugging.
   */
  getStats(): VCRStats {
    return { ...this.stats };
  }

  /**
   * Reset VCR statistics.
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.recordings = 0;
    this.stats.errors = 0;
  }

  /**
   * Get the current VCR mode.
   */
  getMode(): VCRMode {
    return this.mode;
  }

  /**
   * Get the fixture directory path.
   */
  getFixtureDir(): string {
    return this.fixtureDir;
  }
}

/**
 * Create VCR provider with mode from environment variable.
 *
 * @param provider - Underlying LLM provider
 * @param fixtureDir - Directory for fixture storage
 * @param modelName - Model name for fixture key (ensures fixtures are model-specific)
 * @returns VCRLLMProvider configured from VCR_MODE env var
 */
const VALID_VCR_MODES = ['replay', 'record', 'passthrough'] as const;

export function createVCRProvider(
  provider: LLMProvider,
  fixtureDir: string,
  modelName: string = 'unknown'
): VCRLLMProvider {
  const envMode = process.env['VCR_MODE'] ?? 'replay';
  if (!VALID_VCR_MODES.includes(envMode as VCRMode)) {
    throw new Error(
      `Invalid VCR_MODE: "${envMode}". Valid modes: ${VALID_VCR_MODES.join(', ')}`
    );
  }
  const mode = envMode as VCRMode;
  return new VCRLLMProvider(provider, fixtureDir, mode, modelName);
}
