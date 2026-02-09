/**
 * Axiom synthesizer - compresses principles to axioms when N>=3.
 * Generates canonical forms (native/notated).
 */

import type { Principle } from '../types/principle.js';
import type { Axiom, AxiomTier, CanonicalForm } from '../types/axiom.js';
import type { LLMProvider } from '../types/llm.js';
import { LLMRequiredError } from '../types/llm.js';
import { createAxiomProvenance } from './provenance.js';

export interface CompressionResult {
  axioms: Axiom[];
  unconverged: Principle[];
  metrics: {
    principlesProcessed: number;
    axiomsCreated: number;
    compressionRatio: number;
  };
}

/**
 * Cascade metadata for threshold selection observability.
 */
export interface CascadeMetadata {
  /** The N-threshold that produced the final result */
  effectiveThreshold: number;
  /** How many axioms qualified at each threshold level */
  axiomCountByThreshold: Record<number, number>;
}

/**
 * Extended compression result with cascade metadata.
 */
export interface CascadeCompressionResult extends CompressionResult {
  cascade: CascadeMetadata;
}

/**
 * Generate notated form of a principle using LLM.
 *
 * The LLM generates a compact representation with:
 * - CJK anchor character (semantic core)
 * - Emoji indicator (visual categorization)
 * - Mathematical notation (relationships)
 *
 * Example output: "🎯 誠: honesty > performance"
 *
 * @param llm - LLM provider (required)
 * @param text - Native principle text
 * @returns Notated form with CJK/emoji/math as appropriate
 * @throws LLMRequiredError if llm is null/undefined
 */
async function generateNotatedForm(
  llm: LLMProvider,
  text: string
): Promise<string> {
  if (!llm) {
    throw new LLMRequiredError('generateNotatedForm');
  }

  const prompt = `Express this principle in compact notation with:
1. An emoji indicator that captures the essence (e.g., 🎯 for focus, 💎 for truth, 🛡️ for safety)
2. A single CJK character anchor (e.g., 誠 for honesty, 安 for safety, 明 for clarity)
3. Mathematical notation if there's a relationship (e.g., "A > B" for priority, "¬X" for negation)

Principle: "${text}"

Format your response as: [emoji] [CJK]: [math or brief summary]
Example: "🎯 誠: honesty > performance"

If no clear mathematical relationship, use a brief 2-3 word summary instead.
Respond with ONLY the formatted notation, nothing else.`;

  // IM-2 FIX: Use generate() for text generation instead of classify()
  if (llm.generate) {
    const result = await llm.generate(prompt);
    return result.text.trim() || `📌 理: ${text.slice(0, 30)}`;
  }

  // Fallback for providers without generate(): use classify with reasoning extraction
  const result = await llm.classify(prompt, {
    categories: ['notation'] as const,
    context: 'Notation generation for axiom synthesis',
  });

  // Extract from reasoning if available, otherwise use placeholder
  return result.reasoning?.trim() || `📌 理: ${text.slice(0, 30)}`;
}

/**
 * Determine axiom tier based on N-count.
 */
function determineTier(nCount: number): AxiomTier {
  if (nCount >= 5) return 'core';
  if (nCount >= 3) return 'domain';
  return 'emerging';
}

// MN-2 FIX: Use crypto.randomUUID() for better collision resistance
import { randomUUID } from 'node:crypto';

/**
 * Generate unique ID for axioms.
 * Uses crypto.randomUUID() for proper collision resistance.
 */
function generateAxiomId(): string {
  return `ax_${randomUUID()}`;
}

/**
 * Synthesize an axiom from a converged principle.
 *
 * @param llm - LLM provider for notation generation (required)
 * @param principle - The principle to synthesize into an axiom
 * @returns The synthesized axiom
 * @throws LLMRequiredError if llm is null/undefined
 */
async function synthesizeAxiom(
  llm: LLMProvider,
  principle: Principle
): Promise<Axiom> {
  // Generate notated form with single LLM call
  const notated = await generateNotatedForm(llm, principle.text);

  const canonical: CanonicalForm = {
    native: principle.text,
    notated,
  };

  return {
    id: generateAxiomId(),
    text: principle.text,
    tier: determineTier(principle.n_count),
    dimension: principle.dimension,
    canonical,
    derived_from: createAxiomProvenance([principle]),
    history: [
      {
        type: 'created',
        timestamp: new Date().toISOString(),
        details: `Promoted from principle ${principle.id} (N=${principle.n_count})`,
      },
    ],
  };
}

/**
 * Compress principles to axioms.
 * Principles with N>=threshold are promoted to axioms.
 *
 * @param llm - LLM provider for semantic classification (required)
 * @param principles - Array of principles to compress
 * @param nThreshold - Minimum N-count for axiom promotion (default: 3)
 * @returns Compression result with axioms, unconverged principles, and metrics
 * @throws LLMRequiredError if llm is null/undefined
 */
export async function compressPrinciples(
  llm: LLMProvider,
  principles: Principle[],
  nThreshold: number = 3
): Promise<CompressionResult> {
  const axiomPromises: Promise<Axiom>[] = [];
  const unconverged: Principle[] = [];

  for (const principle of principles) {
    if (principle.n_count >= nThreshold) {
      axiomPromises.push(synthesizeAxiom(llm, principle));
    } else {
      unconverged.push(principle);
    }
  }

  // Await all axiom synthesis in parallel
  const axioms = await Promise.all(axiomPromises);

  // IM-6 FIX: Renamed to wordCount (not tokens) for clarity.
  // True token counting requires a tokenizer like tiktoken.
  // Word count is an approximation (roughly 0.75 tokens per word for English).
  const originalWordCount = principles.reduce(
    (sum, p) => sum + p.text.split(/\s+/).length,
    0
  );
  const compressedWordCount = axioms.reduce(
    (sum, a) => sum + a.canonical.notated.split(/\s+/).length,
    0
  );

  return {
    axioms,
    unconverged,
    metrics: {
      principlesProcessed: principles.length,
      axiomsCreated: axioms.length,
      compressionRatio:
        compressedWordCount > 0 ? originalWordCount / compressedWordCount : 0,
    },
  };
}

/**
 * Generate SOUL.md content from axioms.
 *
 * @param axioms - Array of axioms to render
 * @param format - 'native' for plain text, 'notated' for CJK/emoji/math notation
 */
export function generateSoulMd(
  axioms: Axiom[],
  format: 'native' | 'notated' = 'native'
): string {
  const lines: string[] = ['# SOUL.md', '', '## Core Axioms', ''];

  // Group by tier
  const core = axioms.filter((a) => a.tier === 'core');
  const domain = axioms.filter((a) => a.tier === 'domain');
  const emerging = axioms.filter((a) => a.tier === 'emerging');

  function formatAxiom(axiom: Axiom): string {
    if (format === 'notated') {
      return `- ${axiom.canonical.notated}`;
    }
    return `- ${axiom.canonical.native}`;
  }

  if (core.length > 0) {
    lines.push('### Core (N≥5)', '');
    for (const axiom of core) {
      lines.push(formatAxiom(axiom));
    }
    lines.push('');
  }

  if (domain.length > 0) {
    lines.push('### Domain (N≥3)', '');
    for (const axiom of domain) {
      lines.push(formatAxiom(axiom));
    }
    lines.push('');
  }

  if (emerging.length > 0) {
    lines.push('### Emerging (N<3)', '');
    for (const axiom of emerging) {
      lines.push(formatAxiom(axiom));
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Minimum axiom count target for cascade threshold selection.
 * Based on research (Miller's Law, Jim Collins): 3-4 chunks in working memory.
 * See docs/research/optimal-axiom-count.md
 */
const MIN_AXIOM_TARGET = 3;

/**
 * Cascade thresholds to try, from strictest to most lenient.
 */
const CASCADE_THRESHOLDS = [3, 2, 1] as const;

/**
 * Count how many principles would qualify as axioms at a given threshold.
 * Does not create axioms (cheap counting operation).
 */
function countAxiomsAtThreshold(
  principles: Principle[],
  threshold: number
): number {
  return principles.filter((p) => p.n_count >= threshold).length;
}

/**
 * Compress principles to axioms with cascading threshold selection.
 *
 * Automatically adapts threshold based on axiom yield:
 * 1. Try N>=3 -> if >= 3 axioms, use result (high confidence)
 * 2. If < 3 axioms, try N>=2 -> if >= 3 axioms, use result (medium confidence)
 * 3. If < 3 axioms, try N>=1 -> use whatever we got (low confidence)
 *
 * Tier assignment is based on ACTUAL N-count, not cascade level.
 * An axiom with N=1 is always "Emerging" regardless of which cascade produced it.
 *
 * @param llm - LLM provider for notation generation (required)
 * @param principles - Array of principles to compress
 * @returns Cascade compression result with axioms, unconverged, metrics, and cascade metadata
 * @throws LLMRequiredError if llm is null/undefined
 */
export async function compressPrinciplesWithCascade(
  llm: LLMProvider,
  principles: Principle[]
): Promise<CascadeCompressionResult> {
  // Count axioms at each threshold level (cheap operation)
  const axiomCountByThreshold: Record<number, number> = {};
  for (const threshold of CASCADE_THRESHOLDS) {
    axiomCountByThreshold[threshold] = countAxiomsAtThreshold(
      principles,
      threshold
    );
  }

  // Find the highest threshold that produces >= MIN_AXIOM_TARGET axioms
  // Default to most lenient threshold (1) if none meet target
  let effectiveThreshold: number = 1;
  for (const threshold of CASCADE_THRESHOLDS) {
    const count = axiomCountByThreshold[threshold];
    if (count !== undefined && count >= MIN_AXIOM_TARGET) {
      effectiveThreshold = threshold;
      break;
    }
  }

  // Run actual compression with the selected threshold
  const result = await compressPrinciples(llm, principles, effectiveThreshold);

  return {
    ...result,
    cascade: {
      effectiveThreshold,
      axiomCountByThreshold,
    },
  };
}
