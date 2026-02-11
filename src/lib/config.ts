/**
 * Configuration system for NEON-SOUL.
 * Loads from .neon-soul/config.json with sensible defaults.
 */

import { z } from 'zod';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const NotationFormatSchema = z.enum([
  'native',
  'cjk-labeled',
  'cjk-math',
  'cjk-math-emoji',
]);

const NeonSoulConfigSchema = z.object({
  notation: z
    .object({
      format: NotationFormatSchema.default('native'),
      fallback: NotationFormatSchema.default('native'),
    })
    .default({}),
  matching: z
    .object({
      /**
       * Similarity threshold for principle clustering.
       *
       * For generalized signals (abstract "Values X over Y" patterns),
       * a lower threshold is recommended because:
       * 1. Generalized forms use standardized patterns
       * 2. Semantic similarity is measured on abstract concepts
       * 3. Within-cluster similarities typically range 0.75-0.85
       *
       * Default: 0.75 (based on empirical analysis of generalized signals)
       * @see docs/issues/2026-02-10-generalized-signal-threshold-gap.md
       */
      similarityThreshold: z.number().min(0).max(1).default(0.75),
      embeddingModel: z.string().default('Xenova/all-MiniLM-L6-v2'),
    })
    .default({}),
  paths: z
    .object({
      memory: z.string().default('~/.openclaw/workspace/memory/'),
      distilled: z.string().default('.neon-soul/distilled/'),
      output: z.string().default('.neon-soul/'),
    })
    .default({}),
  synthesis: z
    .object({
      contentThreshold: z.number().int().positive().default(2000),
      autoCommit: z.boolean().default(true),
    })
    .default({}),
});

export type NeonSoulConfig = z.infer<typeof NeonSoulConfigSchema>;

/**
 * Expand ~ to home directory in paths.
 */
function expandPath(p: string): string {
  if (p.startsWith('~/')) {
    return resolve(homedir(), p.slice(2));
  }
  return resolve(p);
}

/**
 * Load configuration from .neon-soul/config.json.
 * Falls back to defaults if file doesn't exist.
 */
export function loadConfig(workspacePath?: string): NeonSoulConfig {
  const basePath = workspacePath ?? process.cwd();
  const configPath = resolve(basePath, '.neon-soul', 'config.json');

  let rawConfig: unknown = {};

  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      rawConfig = JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to parse config at ${configPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const result = NeonSoulConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid configuration:\n${issues}`);
  }

  // Expand paths
  const config = result.data;
  config.paths.memory = expandPath(config.paths.memory);
  config.paths.distilled = expandPath(config.paths.distilled);
  config.paths.output = expandPath(config.paths.output);

  return config;
}
