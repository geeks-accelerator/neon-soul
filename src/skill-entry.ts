/**
 * NEON-SOUL Skill Entry Point
 *
 * OpenClaw skill loader entry point.
 * Exports skill metadata and command dispatch function.
 *
 * Usage (OpenClaw):
 *   /neon-soul synthesize [options]
 *   /neon-soul status
 *   /neon-soul rollback [--list]
 *   /neon-soul audit [--list|--stats|<axiom-id>]
 *   /neon-soul trace <axiom-id>
 */

import type { PipelineOptions, PipelineResult } from './lib/pipeline.js';
import type { LLMProvider } from './types/llm.js';
import { LLMRequiredError } from './types/llm.js';

/**
 * Command result structure.
 */
export interface CommandResult {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}

/**
 * C-2 FIX: Command context provided by OpenClaw dispatcher.
 * Allows forwarding LLM provider to commands that require it.
 */
export interface CommandContext {
  /** LLM provider for semantic classification */
  llm?: LLMProvider;
}

/**
 * Command handler function type.
 * C-2 FIX: Now accepts optional context for LLM forwarding.
 */
export type CommandHandler = (args: string[], context?: CommandContext) => Promise<CommandResult>;

/**
 * Skill metadata.
 */
export const skill = {
  name: 'neon-soul',
  version: '0.1.6',
  description: 'AI Identity Through Grounded Principles - soul synthesis with semantic compression',

  /**
   * Available commands.
   * Each command is a lazy-loaded module with a run() function.
   */
  commands: {
    synthesize: () => import('./commands/synthesize.js'),
    status: () => import('./commands/status.js'),
    rollback: () => import('./commands/rollback.js'),
    audit: () => import('./commands/audit.js'),
    trace: () => import('./commands/trace.js'),
  } as Record<string, () => Promise<{ run?: CommandHandler }>>,
};

/**
 * Run a skill command.
 *
 * C-2 FIX: Added context parameter to forward LLM provider to commands.
 *
 * @param command - Command name (synthesize, status, rollback, audit, trace)
 * @param args - Command arguments
 * @param context - Optional context with LLM provider (required for synthesize)
 * @returns Command result
 */
export async function runCommand(
  command: string,
  args: string[] = [],
  context?: CommandContext
): Promise<CommandResult> {
  const commandLoader = skill.commands[command];

  if (!commandLoader) {
    return {
      success: false,
      error: `Unknown command: ${command}. Available: ${Object.keys(skill.commands).join(', ')}`,
    };
  }

  try {
    const module = await commandLoader();

    if (typeof module.run === 'function') {
      // C-2 FIX: Forward context to command for LLM access
      return await module.run(args, context);
    }

    // M-6 FIX: Log warning for legacy mode (command doesn't export run())
    if (process.env['DEBUG'] || process.env['NEON_SOUL_DEBUG']) {
      console.debug(`Command ${command} loaded in legacy mode (no run() export)`);
    }
    return {
      success: true,
      message: `Command ${command} executed (legacy mode)`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Synthesis options with required LLM provider.
 */
export interface SynthesisOptions extends Partial<Omit<PipelineOptions, 'llm'>> {
  /** LLM provider for semantic classification (required) */
  llm: LLMProvider;
}

/**
 * Run synthesis pipeline directly.
 * Convenience export for programmatic usage.
 *
 * @param options - Synthesis options with required LLM provider
 * @returns Pipeline result
 * @throws LLMRequiredError if llm is not provided
 */
export async function synthesize(
  options: SynthesisOptions
): Promise<PipelineResult> {
  // Validate LLM provider
  if (!options.llm) {
    throw new LLMRequiredError('synthesize');
  }

  const { runPipeline } = await import('./lib/pipeline.js');
  const { getDefaultMemoryPath, getDefaultOutputPath } = await import('./lib/paths.js');

  // Extract llm and rest of options, then build full options
  const { llm, memoryPath, outputPath, format, ...rest } = options;

  const fullOptions: PipelineOptions = {
    memoryPath: memoryPath ?? getDefaultMemoryPath(),
    outputPath: outputPath ?? getDefaultOutputPath(),
    llm,
    format: format ?? 'notated',
    ...rest,
  };

  return runPipeline(fullOptions);
}

/**
 * Get skill status.
 * Convenience export for programmatic usage.
 */
export async function getStatus(workspacePath?: string): Promise<{
  lastRun: string;
  counts: { signals: number; principles: number; axioms: number };
  dimensionCoverage: number;
}> {
  const { getDefaultWorkspacePath } = await import('./lib/paths.js');
  const { loadState } = await import('./lib/state.js');
  const { loadSynthesisData } = await import('./lib/persistence.js');

  const workspace = workspacePath ?? getDefaultWorkspacePath();
  const state = loadState(workspace);
  const data = loadSynthesisData(workspace);

  return {
    lastRun: state.lastRun.timestamp,
    counts: {
      signals: data?.metrics.signalCount ?? 0,
      principles: data?.metrics.principleCount ?? 0,
      axioms: data?.metrics.axiomCount ?? 0,
    },
    dimensionCoverage: data?.metrics.dimensionCoverage ?? 0,
  };
}

// Re-export commonly used types
export type { PipelineOptions, PipelineResult } from './lib/pipeline.js';
export type { Signal } from './types/signal.js';
export type { Principle } from './types/principle.js';
export type { Axiom } from './types/axiom.js';
export type { LLMProvider, ClassifyOptions, ClassificationResult } from './types/llm.js';
export { LLMRequiredError } from './types/llm.js';
