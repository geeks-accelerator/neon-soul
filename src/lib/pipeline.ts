/**
 * Pipeline Orchestrator
 *
 * Coordinates the full soul synthesis pipeline from memory ingestion
 * to SOUL.md generation with iterative reflection and trajectory tracking.
 *
 * Usage:
 *   const result = await runPipeline({ memoryPath, outputPath });
 *   const result = await runPipeline({ memoryPath, dryRun: true });
 *
 * Stages:
 *   1. check-threshold - Skip if not enough new memory
 *   2. collect-sources - Gather memory files, SOUL.md, USER.md
 *   3. extract-signals - Extract signals from all sources
 *   4. reflective-synthesis - Iterative principle → axiom synthesis
 *   5. validate-output - Reject empty/malformed output
 *   6. backup-current - Safety backup before write
 *   7. generate-soul - Generate new SOUL.md
 *   8. commit-changes - Auto-commit if git repo
 */

import { existsSync } from 'node:fs';
// CR-2 FIX: Removed unused writeFile import - now using writeFileAtomic from persistence.ts
import { dirname, resolve, normalize } from 'node:path';
import { homedir } from 'node:os';
// TrajectoryTracker removed - single-pass architecture doesn't need iteration tracking
import { collectSources as collectSourcesFromWorkspace, type SourceCollection as CollectedSources } from './source-collector.js';
import { extractSignalsFromContent } from './signal-extractor.js';
import { runReflectiveLoop } from './reflection-loop.js';
import { generateSoul as generateSoulContent } from './soul-generator.js';
import { backupFile, commitSoulUpdate } from './backup.js';
import { loadState, saveState, shouldRunSynthesis } from './state.js';
import { saveSynthesisData, writeFileAtomic } from './persistence.js';
import { logger } from './logger.js';
import type { Signal, SoulCraftDimension } from '../types/signal.js';
import type { Principle } from '../types/principle.js';
import type { Axiom } from '../types/axiom.js';
import type { LLMProvider } from '../types/llm.js';
import { LLMRequiredError } from '../types/llm.js';
import type { ProseExpansion } from './prose-expander.js';
import { expandToProse } from './prose-expander.js';

/**
 * Pipeline configuration options.
 */
export interface PipelineOptions {
  /** Path to OpenClaw memory directory */
  memoryPath: string;
  /** Output path for generated SOUL.md */
  outputPath: string;
  /** LLM provider for semantic classification (required) */
  llm: LLMProvider;
  /** Minimum new content (chars) to trigger synthesis */
  contentThreshold?: number;
  /** Force run even if below threshold */
  force?: boolean;
  /** Preview changes without writing */
  dryRun?: boolean;
  /** Show diff of changes */
  showDiff?: boolean;
  /** Output notation format (legacy, used when outputFormat is 'notation') */
  format?: 'native' | 'notated';
  /** Output format: 'prose' for inhabitable soul, 'notation' for legacy */
  outputFormat?: 'prose' | 'notation';
  /** I-4 FIX: Strict mode fails pipeline on prose expansion errors instead of falling back */
  strictMode?: boolean;
  /** Progress callback */
  onProgress?: (stage: string, progress: number, message: string) => void;
}

/**
 * Default pipeline options.
 */
export const DEFAULT_PIPELINE_OPTIONS: Partial<PipelineOptions> = {
  contentThreshold: 2000,
  force: false,
  dryRun: false,
  showDiff: false,
  format: 'notated',
  outputFormat: 'prose',
  strictMode: false,
};

/**
 * Pipeline execution context passed between stages.
 */
export interface PipelineContext {
  /** Configuration options */
  options: PipelineOptions;
  /** Current stage name */
  currentStage: string;
  /** Whether pipeline was skipped (threshold not met) */
  skipped: boolean;
  /** Skip reason if skipped */
  skipReason?: string;
  /** Collected source files (summary) */
  sources?: SourceCollection;
  /** MN-5 FIX: Full collected sources from source-collector */
  collectedSources?: CollectedSources;
  /** Extracted signals */
  signals?: Signal[];
  /** Generated principles */
  principles?: Principle[];
  /** Generated axioms */
  axioms?: Axiom[];
  /** Synthesis duration in milliseconds */
  synthesisDurationMs?: number;
  /** Effective N-threshold used (from cascade) */
  effectiveThreshold?: number;
  /** Prose expansion result (if outputFormat is 'prose') */
  proseExpansion?: ProseExpansion;
  /** Generated SOUL.md content */
  soulContent?: string;
  /** Backup path if created */
  backupPath?: string;
  /** Whether changes were committed */
  committed?: boolean;
  /** Error if pipeline failed */
  error?: Error;
  /** Timing information */
  timing: {
    startTime: Date;
    endTime?: Date;
    stageTimes: Record<string, number>;
  };
}

/**
 * Source collection from input gathering.
 */
export interface SourceCollection {
  /** Memory files from memory/ directory */
  memoryFiles: string[];
  /** Existing SOUL.md path (if exists) */
  existingSoulPath?: string;
  /** USER.md path (if exists) */
  userContextPath?: string;
  /** Interview response files */
  interviewFiles: string[];
  /** Total source count */
  totalSources: number;
  /** Total content size (chars) */
  totalContentSize: number;
}

/**
 * Pipeline stage definition.
 * IM-5 FIX: Removed unused rollback field - recovery uses backup file
 */
export interface PipelineStage {
  /** Stage name */
  name: string;
  /** Execute the stage */
  execute: (context: PipelineContext) => Promise<PipelineContext>;
  /** Whether to skip this stage in dry-run mode */
  skipInDryRun?: boolean;
}

/**
 * Pipeline result.
 */
export interface PipelineResult {
  /** Whether pipeline completed successfully */
  success: boolean;
  /** Whether pipeline was skipped */
  skipped: boolean;
  /** Skip reason if skipped */
  skipReason: string | undefined;
  /** Error if failed */
  error: Error | undefined;
  /** Final context */
  context: PipelineContext;
  /** Metrics summary */
  metrics: {
    signalCount: number;
    principleCount: number;
    axiomCount: number;
    compressionRatio: number;
    dimensionCoverage: number;
    synthesisDurationMs: number | undefined;
    effectiveThreshold: number | undefined;
  };
}

/**
 * Validation result for soul output.
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
  warnings: string[];
}

/**
 * Run the full soul synthesis pipeline.
 *
 * @throws LLMRequiredError if llm is not provided in options
 */
export async function runPipeline(
  options: PipelineOptions
): Promise<PipelineResult> {
  // Validate LLM provider is present (Option C - no fallback)
  if (!options.llm) {
    throw new LLMRequiredError('runPipeline');
  }

  const mergedOptions = { ...DEFAULT_PIPELINE_OPTIONS, ...options };

  const context: PipelineContext = {
    options: mergedOptions as PipelineOptions,
    currentStage: 'init',
    skipped: false,
    timing: {
      startTime: new Date(),
      stageTimes: {},
    },
  };

  const stages = getStages();

  try {
    for (const stage of stages) {
      // Skip write stages in dry-run mode
      if (mergedOptions.dryRun && stage.skipInDryRun) {
        context.options.onProgress?.(stage.name, 0, 'Skipped (dry-run)');
        continue;
      }

      context.currentStage = stage.name;
      const stageStart = Date.now();

      context.options.onProgress?.(stage.name, 0, 'Starting...');

      const updatedContext = await stage.execute(context);
      Object.assign(context, updatedContext);

      context.timing.stageTimes[stage.name] = Date.now() - stageStart;
      context.options.onProgress?.(stage.name, 100, 'Complete');

      // C-1 FIX: Stop if skipped OR if error occurred (e.g., validation failure)
      if (context.skipped || context.error) {
        break;
      }
    }

    context.timing.endTime = new Date();

    return {
      success: !context.error,
      skipped: context.skipped,
      skipReason: context.skipReason,
      error: context.error,
      context,
      metrics: extractMetrics(context),
    };
  } catch (error) {
    context.error = error instanceof Error ? error : new Error(String(error));
    context.timing.endTime = new Date();

    // IM-5 FIX: Removed dead rollback code - no stages implement rollback()
    // Recovery is handled by backup stage (restoring from .bak file if needed)
    // M-5 FIX: Use logger abstraction for configurable output
    logger.error('Pipeline failed', context.error, { stage: context.currentStage });

    return {
      success: false,
      skipped: false,
      skipReason: undefined,
      error: context.error,
      context,
      metrics: extractMetrics(context),
    };
  }
}

/**
 * Get all pipeline stages.
 * MN-2 FIX: Removed check-threshold stage - threshold check now in collect-sources
 */
function getStages(): PipelineStage[] {
  return [
    {
      name: 'collect-sources',
      execute: collectSources,
    },
    {
      name: 'extract-signals',
      execute: extractSignals,
    },
    {
      name: 'reflective-synthesis',
      execute: reflectiveSynthesis,
    },
    {
      name: 'validate-output',
      execute: validateOutput,
    },
    {
      name: 'prose-expansion',
      execute: proseExpansion,
      // Skip if outputFormat is 'notation'
    },
    {
      name: 'backup-current',
      execute: backupCurrentSoul,
      skipInDryRun: true,
    },
    {
      name: 'generate-soul',
      execute: generateSoul,
      // Note: Stage runs in dry-run to generate content for preview (including essence).
      // File write is skipped inside the stage based on dryRun flag.
      skipInDryRun: false,
    },
    {
      name: 'commit-changes',
      execute: commitChanges,
      skipInDryRun: true,
    },
  ];
}

/**
 * C-2/C-3 FIX: Validate path is within allowed root to prevent path traversal.
 * Only allows paths under user's home directory or /tmp for testing.
 *
 * C-2 FIX: Uses path separator check to prevent prefix attacks like
 * /tmp2/evil bypassing /tmp or /home/user_evil bypassing /home/user.
 */
function validatePath(inputPath: string): string {
  const normalized = normalize(resolve(inputPath));
  const home = homedir();
  const allowedRoots = [home, '/tmp', '/private/tmp']; // /private/tmp for macOS

  // C-2 FIX: Require exact match OR path separator after root
  // Prevents /tmp2/evil from matching /tmp, /home/user_evil from matching /home/user
  const sep = require('node:path').sep;
  const isAllowed = allowedRoots.some(root =>
    normalized === root || normalized.startsWith(root + sep)
  );
  if (!isAllowed) {
    throw new Error(`Path traversal blocked: ${inputPath} resolves outside allowed directories`);
  }

  return normalized;
}

/**
 * Extract workspace path from memory path.
 * Handles both '/memory' and '/memory/' suffixes.
 * C-3 FIX: Validates path to prevent traversal attacks.
 */
function getWorkspacePath(memoryPath: string): string {
  // C-3 FIX: Validate path before processing
  const validatedPath = validatePath(memoryPath);

  // Remove trailing slash if present
  let path = validatedPath.replace(/\/$/, '');

  // Remove '/memory' suffix to get workspace root
  if (path.endsWith('/memory')) {
    return path.replace(/\/memory$/, '');
  }

  // If no /memory suffix, assume it's already workspace path
  return path;
}

/**
 * Stage: Collect input sources.
 * MN-2 FIX: Threshold check integrated here (was separate no-op stage)
 */
async function collectSources(
  context: PipelineContext
): Promise<PipelineContext> {
  const { memoryPath, outputPath, contentThreshold = 2000, force } = context.options;

  // Extract workspace path from memory path (C-1 fix)
  const workspacePath = getWorkspacePath(memoryPath);

  // Collect sources from workspace
  const collected = await collectSourcesFromWorkspace(workspacePath);

  // Build pipeline source collection
  const sources: SourceCollection = {
    memoryFiles: collected.memoryFiles.map(f => f.path),
    interviewFiles: [],
    totalSources: collected.stats.totalSources,
    totalContentSize: collected.stats.memoryContentSize,
  };

  // Check for existing SOUL.md
  if (existsSync(outputPath)) {
    sources.existingSoulPath = outputPath;
  }

  // IM-4 FIX: Check content DELTA threshold (compare to last run)
  const state = loadState(workspacePath);
  const lastRunContentSize = state.lastRun.contentSize || 0;

  if (!force && !shouldRunSynthesis(sources.totalContentSize, contentThreshold, lastRunContentSize)) {
    const delta = sources.totalContentSize - lastRunContentSize;
    context.skipped = true;
    context.skipReason = `Content delta below threshold (${delta} < ${contentThreshold} chars)`;
  }

  // Store collected sources for signal extraction
  // MN-5 FIX: Use proper interface field instead of type assertion
  context.collectedSources = collected;
  context.sources = sources;
  return context;
}

/**
 * Stage: Extract signals from sources.
 */
async function extractSignals(
  context: PipelineContext
): Promise<PipelineContext> {
  // Get collected sources from previous stage
  // MN-5 FIX: Use proper interface field instead of type assertion
  const collected = context.collectedSources;

  // IM-1 FIX: Don't early return on empty memory - check all source types
  if (!collected) {
    context.signals = [];
    return context;
  }

  // IM-1 FIX: Check if ANY sources exist, not just memory files
  const hasAnySources = collected.memoryFiles.length > 0 ||
    collected.existingSoul ||
    (collected.interviewSignals && collected.interviewSignals.length > 0);

  if (!hasAnySources) {
    context.signals = [];
    return context;
  }

  // Get LLM provider from context
  const { llm } = context.options;

  // Extract signals from all memory files
  const allSignals: Signal[] = [];

  for (const memoryFile of collected.memoryFiles) {
    context.options.onProgress?.('extract-signals', 0, `Extracting from ${memoryFile.path}`);

    const signals = await extractSignalsFromContent(llm, memoryFile.content, {
      file: memoryFile.path,
      category: memoryFile.category,
    });

    allSignals.push(...signals);
  }

  // Also extract from existing SOUL.md if present (high-signal input)
  if (collected.existingSoul) {
    const soulSignals = await extractSignalsFromContent(llm, collected.existingSoul.rawContent, {
      file: collected.existingSoul.path,
      category: 'soul',
    });
    allSignals.push(...soulSignals);
  }

  // CR-4: Merge interview signals (already parsed Signal objects from JSON)
  if (collected.interviewSignals && collected.interviewSignals.length > 0) {
    context.options.onProgress?.('extract-signals', 90, `Adding ${collected.interviewSignals.length} interview signals`);
    allSignals.push(...collected.interviewSignals);
  }

  context.signals = allSignals;
  return context;
}

/**
 * Stage: Single-pass reflective synthesis.
 * Architecture (2026-02-10): Single-pass replaces iterative loop.
 */
async function reflectiveSynthesis(
  context: PipelineContext
): Promise<PipelineContext> {
  const { llm } = context.options;

  // Skip if no signals extracted
  if (!context.signals || context.signals.length === 0) {
    context.principles = [];
    context.axioms = [];
    context.synthesisDurationMs = 0;
    context.effectiveThreshold = 3;
    return context;
  }

  // Run single-pass synthesis with LLM provider
  context.options.onProgress?.('reflective-synthesis', 10, 'Starting single-pass synthesis...');

  const result = await runReflectiveLoop(llm, context.signals, {
    onComplete: () => {
      context.options.onProgress?.(
        'reflective-synthesis',
        90,
        `Synthesizing: ${result.principles.length} principles`
      );
    },
  });

  context.principles = result.principles;
  context.axioms = result.axioms;
  context.synthesisDurationMs = result.durationMs;
  context.effectiveThreshold = result.effectiveThreshold;

  // Log effective threshold (observability)
  logger.info(`Effective N-threshold: ${result.effectiveThreshold}`);

  // Guardrail warnings are already logged by compressor.ts
  // Additional pipeline-level logging for cascade usage
  if (result.effectiveThreshold < 3) {
    logger.info(
      `Cascaded from N>=3 to N>=${result.effectiveThreshold} (sparse evidence in input)`
    );
  }

  context.options.onProgress?.(
    'reflective-synthesis',
    100,
    `Complete: ${result.axioms.length} axioms (N>=${result.effectiveThreshold}, ${result.compressionRatio.toFixed(1)}:1 compression)`
  );

  return context;
}

/**
 * Stage: Validate output.
 * Logs warnings but never fails - cascading threshold handles adaptation.
 */
async function validateOutput(
  context: PipelineContext
): Promise<PipelineContext> {
  const validation = validateSoulOutput(context);

  // Log warnings for observability
  if (validation.warnings.length > 0) {
    for (const warning of validation.warnings) {
      logger.warn(warning);
    }
  }

  // Persist synthesis data for commands (status, trace, audit)
  if (!context.options.dryRun) {
    const workspacePath = getWorkspacePath(context.options.memoryPath);
    saveSynthesisData(
      workspacePath,
      context.signals ?? [],
      context.principles ?? [],
      context.axioms ?? []
    );

    // Update state with run metrics
    const state = loadState(workspacePath);
    state.lastRun.timestamp = new Date().toISOString();
    // IM-4 FIX: Track content size for delta comparison on next run
    state.lastRun.contentSize = context.sources?.totalContentSize ?? 0;
    state.metrics.totalSignalsProcessed += context.signals?.length ?? 0;
    state.metrics.totalPrinciplesGenerated = context.principles?.length ?? 0;
    state.metrics.totalAxiomsGenerated = context.axioms?.length ?? 0;
    saveState(workspacePath, state);

    context.options.onProgress?.('validate-output', 100, 'Persisted synthesis data');
  }

  return context;
}

/**
 * Validate generated soul output.
 *
 * Always returns valid=true with warnings. The cascading threshold in
 * compressor.ts handles adaptation - validation just observes and warns.
 * Add --strict flag for CI if hard failures are needed (separate concern).
 */
export function validateSoulOutput(
  context: PipelineContext
): ValidationResult {
  const warnings: string[] = [];

  // Check axiom count - warn if zero
  if (!context.axioms || context.axioms.length === 0) {
    warnings.push('No axioms generated (cascading threshold may have been used)');
  }

  // Track dimension profile (C-3 fix: descriptive, not quality metric)
  // Partial coverage may reflect authentic identity shape, not missing data
  const dimensions = new Set<SoulCraftDimension>();
  for (const axiom of context.axioms ?? []) {
    if (axiom.dimension) {
      dimensions.add(axiom.dimension);
    }
  }

  // Only warn if zero dimensions (indicates synthesis failure, not identity shape)
  if (dimensions.size === 0) {
    warnings.push(`No dimensions expressed (synthesis may have failed)`);
  }

  // Check principle count
  if (!context.principles || context.principles.length < 5) {
    warnings.push(`Low principle count: ${context.principles?.length ?? 0}`);
  }

  return {
    valid: true,
    warnings,
  };
}

/**
 * Stage: Prose expansion.
 * Transforms axioms into inhabitable prose sections.
 */
async function proseExpansion(
  context: PipelineContext
): Promise<PipelineContext> {
  const { llm, outputFormat = 'prose' } = context.options;

  // Skip if using notation format
  if (outputFormat === 'notation') {
    context.options.onProgress?.('prose-expansion', 100, 'Skipped (notation format)');
    return context;
  }

  // Skip if no axioms
  if (!context.axioms || context.axioms.length === 0) {
    context.options.onProgress?.('prose-expansion', 100, 'Skipped (no axioms)');
    return context;
  }

  context.options.onProgress?.('prose-expansion', 10, 'Expanding axioms to prose...');

  try {
    const expansion = await expandToProse(context.axioms, llm);
    context.proseExpansion = expansion;

    if (expansion.usedFallback) {
      logger.warn('[pipeline] Prose expansion used fallback for some sections', {
        sections: expansion.fallbackSections,
        closingTagline: expansion.closingTaglineUsedFallback,
      });
    }

    context.options.onProgress?.(
      'prose-expansion',
      100,
      `Complete (${expansion.fallbackSections.length > 0 ? 'with fallbacks' : 'all sections generated'})`
    );
  } catch (error) {
    // I-4 FIX: In strictMode, propagate error instead of falling back
    if (context.options.strictMode) {
      throw error;
    }
    // Non-fatal - fall back to notation format
    logger.warn('[pipeline] Prose expansion failed, will use notation format', { error });
    context.options.onProgress?.('prose-expansion', 100, 'Failed (will use notation)');
  }

  return context;
}

/**
 * Stage: Backup current SOUL.md.
 */
async function backupCurrentSoul(
  context: PipelineContext
): Promise<PipelineContext> {
  const { outputPath, memoryPath } = context.options;

  // Only backup if file exists (first run has no backup)
  if (existsSync(outputPath)) {
    try {
      // I-1 FIX: Pass workspace path to ensure backups are stored consistently
      const workspacePath = getWorkspacePath(memoryPath);
      const backupPath = backupFile(outputPath, workspacePath);
      context.backupPath = backupPath;
      context.options.onProgress?.('backup-current', 50, `Backed up to ${backupPath}`);
    } catch (error) {
      // Log but don't fail - backup is safety net, not critical path
      // M-5 FIX: Use logger abstraction for configurable output
      logger.warn('Backup failed (non-critical)', { error: error instanceof Error ? error.message : String(error) });
    }
  } else {
    context.options.onProgress?.('backup-current', 50, 'No existing SOUL.md to backup');
  }

  return context;
}

/**
 * Stage: Generate new SOUL.md.
 */
async function generateSoul(
  context: PipelineContext
): Promise<PipelineContext> {
  const { outputPath, format = 'notated', dryRun, llm } = context.options;

  // Build soul generator options
  const soulOptions: Parameters<typeof generateSoulContent>[2] = {
    format,
    outputFormat: context.proseExpansion ? 'prose' : 'notation',
    includeProvenance: true,
    includeMetrics: !context.proseExpansion, // Only for notation format
    llm, // Pass LLM for essence extraction
  };

  // Only add proseExpansion if it exists (exactOptionalPropertyTypes)
  if (context.proseExpansion) {
    soulOptions.proseExpansion = context.proseExpansion;
  }

  // Generate soul content (now async for essence extraction)
  const soul = await generateSoulContent(
    context.axioms ?? [],
    context.principles ?? [],
    soulOptions
  );

  context.soulContent = soul.content;

  // Write to file (unless dry-run)
  if (!dryRun) {
    // Ensure directory exists
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      const { mkdirSync } = await import('node:fs');
      mkdirSync(dir, { recursive: true });
    }

    // CR-2 FIX: Use atomic write to prevent corruption on crash
    writeFileAtomic(outputPath, soul.content);
    context.options.onProgress?.('generate-soul', 100, `Wrote ${outputPath}`);
  } else {
    context.options.onProgress?.('generate-soul', 100, 'Dry-run: SOUL.md not written');
  }

  return context;
}

/**
 * Stage: Commit changes to git.
 */
async function commitChanges(
  context: PipelineContext
): Promise<PipelineContext> {
  const { outputPath, dryRun } = context.options;

  if (dryRun) {
    context.committed = false;
    return context;
  }

  try {
    // Commit will silently skip if not a git repo
    await commitSoulUpdate(
      outputPath,
      `neon-soul: synthesize SOUL.md (${context.axioms?.length ?? 0} axioms)`
    );
    context.committed = true;
    context.options.onProgress?.('commit-changes', 100, 'Committed to git');
  } catch {
    // Not a git repo or commit failed - not critical
    context.committed = false;
    context.options.onProgress?.('commit-changes', 100, 'Skipped git commit');
  }

  return context;
}

/**
 * Extract metrics from pipeline context.
 */
function extractMetrics(context: PipelineContext): PipelineResult['metrics'] {
  const signalCount = context.signals?.length ?? 0;
  const principleCount = context.principles?.length ?? 0;
  const axiomCount = context.axioms?.length ?? 0;

  // Calculate dimension coverage
  const dimensions = new Set<SoulCraftDimension>();
  for (const axiom of context.axioms ?? []) {
    if (axiom.dimension) {
      dimensions.add(axiom.dimension);
    }
  }
  const dimensionCoverage = dimensions.size / 7;

  // Compression ratio (placeholder - needs actual token counting)
  const compressionRatio = axiomCount > 0 ? signalCount / axiomCount : 0;

  return {
    signalCount,
    principleCount,
    axiomCount,
    compressionRatio,
    dimensionCoverage,
    synthesisDurationMs: context.synthesisDurationMs,
    effectiveThreshold: context.effectiveThreshold,
  };
}

/**
 * Format pipeline result as summary.
 */
export function formatPipelineResult(result: PipelineResult): string {
  const lines: string[] = [
    '# Soul Synthesis Result',
    '',
  ];

  if (result.skipped) {
    lines.push(`**Status**: Skipped (${result.skipReason})`);
    return lines.join('\n');
  }

  if (!result.success) {
    lines.push(`**Status**: Failed`);
    lines.push(`**Error**: ${result.error?.message}`);
    return lines.join('\n');
  }

  lines.push(`**Status**: Success`);
  lines.push('');
  lines.push('## Metrics');
  lines.push('');

  // M-3 FIX: Add interpretive guidance for metrics
  const compression = result.metrics.compressionRatio;
  const compressionHealth = compression >= 3 ? 'HEALTHY' : compression >= 1.5 ? 'LOW' : 'MINIMAL';

  const coveragePercent = result.metrics.dimensionCoverage * 100;
  const expressedDims = Math.round(coveragePercent / 100 * 7);

  lines.push(`| Metric | Value | Interpretation |`);
  lines.push(`|--------|-------|----------------|`);
  lines.push(`| Signals | ${result.metrics.signalCount} | Input count |`);
  lines.push(`| Principles | ${result.metrics.principleCount} | Clustered patterns |`);
  lines.push(`| Axioms | ${result.metrics.axiomCount} | Core values (target: 3-10) |`);
  lines.push(`| Compression | ${compression.toFixed(2)}:1 | ${compressionHealth} (target: 3:1+) |`);
  lines.push(`| Dimension profile | ${expressedDims}/7 | Identity shape |`);

  if (result.metrics.effectiveThreshold !== undefined) {
    lines.push(`| Effective N-threshold | ${result.metrics.effectiveThreshold} |`);
  }

  if (result.metrics.synthesisDurationMs !== undefined) {
    lines.push(`| Synthesis time | ${(result.metrics.synthesisDurationMs / 1000).toFixed(1)}s |`);
  }

  // Timing
  const duration = result.context.timing.endTime
    ? (result.context.timing.endTime.getTime() - result.context.timing.startTime.getTime()) / 1000
    : 0;
  lines.push('');
  lines.push(`**Duration**: ${duration.toFixed(1)}s`);

  return lines.join('\n');
}
