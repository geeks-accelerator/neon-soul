/**
 * SOUL.md Generator
 *
 * Generates the final SOUL.md output with all 7 SoulCraft dimensions,
 * formatted axioms, provenance summary, and compression metrics.
 *
 * Usage:
 *   const soul = generateSoul(axioms, principles, options);
 *   const markdown = formatSoulMarkdown(soul);
 *
 * Output structure:
 *   # SOUL.md
 *   ## Identity Core
 *   [axioms for this dimension]
 *   ## Character Traits
 *   ...
 *   ## Provenance
 *   [compressed audit trail]
 */

import type { Axiom } from '../types/axiom.js';
import type { Principle } from '../types/principle.js';
import type { SoulCraftDimension } from '../types/signal.js';
import type { LLMProvider } from '../types/llm.js';
import { countTokens, compressionRatio } from './metrics.js';
import { extractEssence, DEFAULT_ESSENCE } from './essence-extractor.js';

// Re-export for backward compatibility
export { extractEssence } from './essence-extractor.js';

/**
 * Notation format for axiom display.
 * Simplified: native (plain text) or notated (LLM-generated CJK/emoji/math).
 */
export type NotationFormat = 'native' | 'notated';

/**
 * Generated soul structure.
 */
export interface GeneratedSoul {
  /** Full markdown content */
  content: string;
  /** Axioms organized by dimension */
  byDimension: Map<SoulCraftDimension, Axiom[]>;
  /** Dimension coverage (0-1) */
  coverage: number;
  /** Token count */
  tokenCount: number;
  /** Original token count (for ratio) */
  originalTokenCount: number;
  /** Compression ratio */
  compressionRatio: number;
  /** Generation timestamp */
  generatedAt: Date;
  /** Evocative essence statement (LLM-generated) */
  essenceStatement?: string;
}

/**
 * Soul generator options.
 *
 * Note: includeUnconverged was removed (M-2 fix) - it was never implemented.
 * Unconverged principles are available in ReflectiveLoopResult.unconverged.
 */
export interface SoulGeneratorOptions {
  /** Notation format */
  format: NotationFormat;
  /** Include provenance section */
  includeProvenance?: boolean;
  /** Include metrics section */
  includeMetrics?: boolean;
  /** Original content for compression ratio */
  originalContent?: string;
  /** Custom title */
  title?: string;
  /** LLM provider for essence extraction (optional for backward compat) */
  llm?: LLMProvider;
}

/**
 * Default generator options.
 */
export const DEFAULT_GENERATOR_OPTIONS: SoulGeneratorOptions = {
  format: 'notated',
  includeProvenance: true,
  includeMetrics: true,
};

/**
 * Dimension display configuration.
 */
const DIMENSION_CONFIG: Record<SoulCraftDimension, { title: string; emoji: string }> = {
  'identity-core': { title: 'Identity Core', emoji: '🎯' },
  'character-traits': { title: 'Character Traits', emoji: '🧭' },
  'voice-presence': { title: 'Voice & Presence', emoji: '🎤' },
  'honesty-framework': { title: 'Honesty Framework', emoji: '💎' },
  'boundaries-ethics': { title: 'Boundaries & Ethics', emoji: '🛡️' },
  'relationship-dynamics': { title: 'Relationship Dynamics', emoji: '🤝' },
  'continuity-growth': { title: 'Continuity & Growth', emoji: '🌱' },
};

/**
 * Generate soul from axioms and principles.
 * Now async to support LLM-based essence extraction.
 */
export async function generateSoul(
  axioms: Axiom[],
  principles: Principle[],
  options: Partial<SoulGeneratorOptions> = {}
): Promise<GeneratedSoul> {
  const opts = { ...DEFAULT_GENERATOR_OPTIONS, ...options };

  // Organize axioms by dimension
  const byDimension = new Map<SoulCraftDimension, Axiom[]>();
  const dimensions: SoulCraftDimension[] = [
    'identity-core',
    'character-traits',
    'voice-presence',
    'honesty-framework',
    'boundaries-ethics',
    'relationship-dynamics',
    'continuity-growth',
  ];

  for (const dim of dimensions) {
    byDimension.set(dim, []);
  }

  for (const axiom of axioms) {
    const existing = byDimension.get(axiom.dimension) || [];
    existing.push(axiom);
    byDimension.set(axiom.dimension, existing);
  }

  // Calculate coverage
  const coveredDimensions = dimensions.filter(
    (dim) => (byDimension.get(dim)?.length ?? 0) > 0
  );
  const coverage = coveredDimensions.length / dimensions.length;

  // Extract essence if LLM provided
  let essenceStatement: string | undefined;
  if (opts.llm) {
    essenceStatement = await extractEssence(axioms, opts.llm);
    // Only use if not the default (indicates successful extraction)
    if (essenceStatement === DEFAULT_ESSENCE) {
      essenceStatement = undefined;
    }
  }

  // Generate markdown content
  const content = formatSoulMarkdown(byDimension, principles, opts, essenceStatement);

  // Calculate metrics
  const tokenCount = countTokens(content);
  const originalTokenCount = opts.originalContent
    ? countTokens(opts.originalContent)
    : tokenCount * 7; // Estimate 7:1 if no original

  const result: GeneratedSoul = {
    content,
    byDimension,
    coverage,
    tokenCount,
    originalTokenCount,
    compressionRatio: compressionRatio(originalTokenCount, tokenCount),
    generatedAt: new Date(),
  };

  // Only add essenceStatement if it exists (exactOptionalPropertyTypes compliance)
  if (essenceStatement) {
    result.essenceStatement = essenceStatement;
  }

  return result;
}

/**
 * Format axiom in specified notation.
 * Simplified: native (plain text) or notated (LLM-generated CJK/emoji/math).
 */
export function formatAxiom(axiom: Axiom, format: NotationFormat): string {
  const canonical = axiom.canonical;
  if (!canonical) {
    return `- ${axiom.text}`;
  }

  switch (format) {
    case 'native':
      return `- ${canonical.native}`;

    case 'notated':
      return `- ${canonical.notated}`;

    default:
      return `- ${axiom.text}`;
  }
}

/**
 * Format complete SOUL.md content.
 */
function formatSoulMarkdown(
  byDimension: Map<SoulCraftDimension, Axiom[]>,
  principles: Principle[],
  options: SoulGeneratorOptions,
  essenceStatement?: string
): string {
  const lines: string[] = [];

  // Header - changes based on whether essence is present
  if (essenceStatement) {
    // With essence: "SOUL.md - Who You Are Becoming" (I-5 fix: emphasizes becoming over being)
    const baseTitle = options.title ?? 'SOUL.md';
    lines.push(`# ${baseTitle} - Who You Are Becoming`);
    lines.push('');
    lines.push(`_${essenceStatement}_`);
  } else {
    // Without essence: default format
    lines.push(`# ${options.title ?? 'SOUL.md'}`);
    lines.push('');
    lines.push('*AI identity through grounded principles.*');
  }
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Dimension sections
  const dimensions: SoulCraftDimension[] = [
    'identity-core',
    'character-traits',
    'voice-presence',
    'honesty-framework',
    'boundaries-ethics',
    'relationship-dynamics',
    'continuity-growth',
  ];

  for (const dimension of dimensions) {
    const config = DIMENSION_CONFIG[dimension];
    const axioms = byDimension.get(dimension) || [];

    lines.push(`## ${config.emoji} ${config.title}`);
    lines.push('');

    if (axioms.length === 0) {
      lines.push('*No axioms emerged for this dimension.*');
    } else {
      for (const axiom of axioms) {
        lines.push(formatAxiom(axiom, options.format));
      }
    }

    lines.push('');
  }

  // Provenance section
  if (options.includeProvenance) {
    lines.push('---');
    lines.push('');
    lines.push('## Provenance');
    lines.push('');
    lines.push('Every axiom traces to source signals. Use `/neon-soul audit <axiom>` for full trace.');
    lines.push('');

    // Summary of sources
    const totalAxioms = Array.from(byDimension.values()).reduce(
      (sum, axioms) => sum + axioms.length,
      0
    );
    const totalPrinciples = principles.length;
    const totalSignals = principles.reduce(
      (sum, p) => sum + (p.derived_from?.signals?.length ?? 0),
      0
    );

    lines.push(`| Level | Count |`);
    lines.push(`|-------|-------|`);
    lines.push(`| Axioms | ${totalAxioms} |`);
    lines.push(`| Principles | ${totalPrinciples} |`);
    lines.push(`| Signals | ${totalSignals} |`);
    lines.push('');
  }

  // Metrics section
  if (options.includeMetrics) {
    lines.push('---');
    lines.push('');
    lines.push('## Metrics');
    lines.push('');

    // Calculate dimension coverage
    const coveredCount = dimensions.filter(
      (dim) => (byDimension.get(dim)?.length ?? 0) > 0
    ).length;

    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Dimension coverage | ${coveredCount}/7 (${Math.round((coveredCount / 7) * 100)}%) |`);
    lines.push(`| Notation format | ${options.format} |`);
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*Generated by NEON-SOUL semantic compression pipeline.*');
  lines.push('');

  return lines.join('\n');
}

/**
 * Format axiom with tier badge.
 */
export function formatAxiomWithTier(axiom: Axiom, format: NotationFormat): string {
  const tierBadge = getTierBadge(axiom.tier);
  const formatted = formatAxiom(axiom, format);
  return `${tierBadge} ${formatted}`;
}

/**
 * Get tier badge.
 */
function getTierBadge(tier: string): string {
  switch (tier) {
    case 'core':
      return '⭐';
    case 'domain':
      return '🔹';
    case 'emerging':
      return '◽';
    default:
      return '';
  }
}

/**
 * Generate minimal soul (axioms only, no decorations).
 */
export function generateMinimalSoul(
  axioms: Axiom[],
  format: NotationFormat
): string {
  const lines: string[] = ['# SOUL.md', ''];

  for (const axiom of axioms) {
    lines.push(formatAxiom(axiom, format));
  }

  return lines.join('\n');
}

/**
 * Generate diff between two souls.
 */
export function diffSouls(
  oldSoul: GeneratedSoul,
  newSoul: GeneratedSoul
): string {
  const lines: string[] = [
    '# Soul Diff',
    '',
    `**Old**: ${oldSoul.tokenCount} tokens`,
    `**New**: ${newSoul.tokenCount} tokens`,
    `**Change**: ${newSoul.tokenCount - oldSoul.tokenCount} tokens`,
    '',
  ];

  const dimensions: SoulCraftDimension[] = [
    'identity-core',
    'character-traits',
    'voice-presence',
    'honesty-framework',
    'boundaries-ethics',
    'relationship-dynamics',
    'continuity-growth',
  ];

  for (const dim of dimensions) {
    const oldAxioms = oldSoul.byDimension.get(dim) || [];
    const newAxioms = newSoul.byDimension.get(dim) || [];

    if (oldAxioms.length !== newAxioms.length) {
      const config = DIMENSION_CONFIG[dim];
      lines.push(`## ${config.title}`);
      lines.push(`- Old: ${oldAxioms.length} axioms`);
      lines.push(`- New: ${newAxioms.length} axioms`);
      lines.push('');
    }
  }

  return lines.join('\n');
}
