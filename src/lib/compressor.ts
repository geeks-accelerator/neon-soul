/**
 * Axiom synthesizer - compresses principles to axioms when N>=3.
 * Generates canonical forms (native/notated).
 */

import type { Principle } from '../types/principle.js';
import type {
  Axiom,
  AxiomTier,
  CanonicalForm,
  PromotionCriteria,
} from '../types/axiom.js';
import { DEFAULT_PROMOTION_CRITERIA } from '../types/axiom.js';
import type { LLMProvider } from '../types/llm.js';
import { LLMRequiredError } from '../types/llm.js';
import { createAxiomProvenance } from './provenance.js';
import { logger } from './logger.js';
import { checkGuardrails, type GuardrailWarnings } from './guardrails.js';
import { detectTensions, attachTensionsToAxioms } from './tension-detector.js';
import type { ArtifactProvenance } from '../types/provenance.js';

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
  /** Research-backed guardrail warnings (observability only) */
  guardrails: GuardrailWarnings;
  /** Axioms pruned to meet cognitive load cap */
  pruned: Axiom[];
}

// Re-export for backward compatibility
export type { GuardrailWarnings } from './guardrails.js';

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

/**
 * PBD Stage 15: Get provenance diversity count for a principle's supporting signals.
 * C-2 FIX: Access via derived_from.signals, not p.signals
 * I-2 FIX: Guard against undefined signals for legacy/malformed data
 */
export function getProvenanceDiversity(principle: Principle): number {
  const signals = principle.derived_from?.signals ?? [];
  const types = new Set<ArtifactProvenance>();
  for (const s of signals) {
    if (s.provenance) {
      types.add(s.provenance);
    }
  }
  return types.size;
}

/**
 * PBD Stage 15: Check if an axiom candidate meets anti-echo-chamber criteria.
 *
 * Requirements (all must be met):
 * 1. N >= minPrincipleCount (default: 3)
 * 2. Provenance diversity >= minProvenanceDiversity (default: 2)
 * 3. Has EXTERNAL provenance OR QUESTIONING/DENYING stance
 *
 * The third rule is the anti-echo-chamber protection:
 * - EXTERNAL evidence exists independently (can't be fabricated)
 * - QUESTIONING stance provides internal challenge
 * - Self + Curated + Affirming alone = echo chamber
 *
 * C-2 FIX: Uses p.derived_from.signals (correct path) not p.signals.
 *
 * @param principle - The principle to check for promotion eligibility
 * @param criteria - Optional custom criteria
 * @returns Object with promotable boolean and optional blocker reason
 */
export function canPromote(
  principle: Principle,
  criteria: PromotionCriteria = DEFAULT_PROMOTION_CRITERIA
): { promotable: boolean; blocker?: string; diversity: number } {
  const diversity = getProvenanceDiversity(principle);

  // Rule 1: Minimum principle count (using n_count)
  // M-6 FIX: Changed "signals" to "principles" for accuracy
  if (principle.n_count < criteria.minPrincipleCount) {
    return {
      promotable: false,
      blocker: `Insufficient evidence: ${principle.n_count}/${criteria.minPrincipleCount} supporting principles`,
      diversity,
    };
  }

  // Rule 2: Provenance diversity
  if (diversity < criteria.minProvenanceDiversity) {
    return {
      promotable: false,
      blocker: `Insufficient provenance diversity: ${diversity}/${criteria.minProvenanceDiversity} types`,
      diversity,
    };
  }

  // Rule 3: Anti-echo-chamber (external OR questioning/denying)
  // I-2 FIX: Guard against undefined signals for legacy/malformed data
  if (criteria.requireExternalOrQuestioning) {
    const signals = principle.derived_from?.signals ?? [];

    const hasExternal = signals.some((s) => s.provenance === 'external');
    const hasQuestioning = signals.some(
      (s) => s.stance === 'question' || s.stance === 'deny'
    );

    if (!hasExternal && !hasQuestioning) {
      return {
        promotable: false,
        blocker: 'Anti-echo-chamber: requires EXTERNAL provenance OR QUESTIONING/DENYING stance',
        diversity,
      };
    }
  }

  return { promotable: true, diversity };
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
 * PBD Stage 15: Includes anti-echo-chamber promotion check.
 *
 * @param llm - LLM provider for notation generation (required)
 * @param principle - The principle to synthesize into an axiom
 * @param criteria - Optional anti-echo-chamber criteria
 * @returns The synthesized axiom with promotion metadata
 * @throws LLMRequiredError if llm is null/undefined
 */
async function synthesizeAxiom(
  llm: LLMProvider,
  principle: Principle,
  criteria: PromotionCriteria = DEFAULT_PROMOTION_CRITERIA
): Promise<Axiom> {
  // Generate notated form with single LLM call
  const notated = await generateNotatedForm(llm, principle.text);

  const canonical: CanonicalForm = {
    native: principle.text,
    notated,
  };

  // PBD Stage 15: Check anti-echo-chamber criteria
  const promotion = canPromote(principle, criteria);

  const axiom: Axiom = {
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
    // PBD Stage 15: Anti-echo-chamber metadata
    promotable: promotion.promotable,
    provenanceDiversity: promotion.diversity,
  };

  // Only set blocker if present (optional property)
  if (promotion.blocker) {
    axiom.promotionBlocker = promotion.blocker;
  }

  return axiom;
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
 * Maximum axiom count for cognitive load.
 * Based on research: prose expander produces better output from 15-25 focused axioms.
 * Axioms beyond this cap are pruned (kept in pruned[] for auditing).
 */
const COGNITIVE_LOAD_CAP = 25;

// Re-export checkGuardrails for backward compatibility
export { checkGuardrails } from './guardrails.js';

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

  // Enforce cognitive load cap: keep top N axioms by N-count and tier
  let finalAxioms = result.axioms;
  let prunedAxioms: Axiom[] = [];

  if (finalAxioms.length > COGNITIVE_LOAD_CAP) {
    // Sort by N-count descending, then by tier (core > domain > emerging)
    const tierOrder: Record<AxiomTier, number> = { core: 0, domain: 1, emerging: 2 };
    const sorted = [...finalAxioms].sort((a, b) => {
      // C-1 FIX: Access actual n_count from source principle, not array length
      // The principles array always has length 1 (synthesizeAxiom creates single-principle provenance)
      const aNCount = a.derived_from?.principles?.[0]?.n_count ?? 1;
      const bNCount = b.derived_from?.principles?.[0]?.n_count ?? 1;
      if (bNCount !== aNCount) return bNCount - aNCount;
      // Then by tier
      return tierOrder[a.tier] - tierOrder[b.tier];
    });

    finalAxioms = sorted.slice(0, COGNITIVE_LOAD_CAP);
    prunedAxioms = sorted.slice(COGNITIVE_LOAD_CAP);

    logger.info(`[compressor] Pruned ${prunedAxioms.length} axioms to meet cognitive load cap (${COGNITIVE_LOAD_CAP})`);
  }

  // PBD Stage 5: Detect tensions between axioms
  const tensions = await detectTensions(llm, finalAxioms);
  if (tensions.length > 0) {
    finalAxioms = attachTensionsToAxioms(finalAxioms, tensions);
  }

  // Check research-backed guardrails (warnings only, do not block)
  // Signal count approximated from principles (each principle represents clustered signals)
  // For accurate signal count, caller should track original signals
  const signalCount = principles.length; // Approximation: 1 principle ~ 1+ signals
  const guardrails = checkGuardrails(
    finalAxioms.length,
    signalCount,
    effectiveThreshold
  );

  // Log warnings for observability
  for (const message of guardrails.messages) {
    logger.warn(message);
  }

  return {
    ...result,
    axioms: finalAxioms,
    cascade: {
      effectiveThreshold,
      axiomCountByThreshold,
    },
    guardrails,
    pruned: prunedAxioms,
  };
}
