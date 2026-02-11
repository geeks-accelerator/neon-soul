/**
 * Prose Expander
 *
 * Transforms axioms into prose sections for an inhabitable SOUL.md.
 * Each section has a specific format matching souls.directory conventions.
 *
 * Sections:
 * - Core Truths: Bold principle + elaboration sentence (4-6 principles)
 * - Voice: 1-2 prose paragraphs + "Think: [analogy]" line
 * - Boundaries: 3-5 "You don't..." contrast statements
 * - Vibe: 2-3 sentence prose paragraph capturing the feel
 *
 * Usage:
 *   const prose = await expandToProse(axioms, llm);
 *   // prose.coreTruths, prose.voice, prose.boundaries, prose.vibe, prose.closingTagline
 */

import type { Axiom } from '../types/axiom.js';
import type { SoulCraftDimension } from '../types/signal.js';
import type { LLMProvider } from '../types/llm.js';
import { logger } from './logger.js';

/**
 * Soul section types for prose output.
 */
export type SoulSection = 'coreTruths' | 'voice' | 'boundaries' | 'vibe';

/**
 * Prose expansion result.
 */
export interface ProseExpansion {
  /** Core Truths section: bold+elaboration format */
  coreTruths: string;
  /** Voice section: prose paragraphs with Think: analogy */
  voice: string;
  /** Boundaries section: "You don't..." contrast statements */
  boundaries: string;
  /** Vibe section: short prose feel */
  vibe: string;
  /** Closing tagline: italicized personality line */
  closingTagline: string;
  /** Whether any sections used fallback */
  usedFallback: boolean;
  /** Sections that used fallback */
  fallbackSections: SoulSection[];
  /** M-4 FIX: Track if closing tagline used fallback separately */
  closingTaglineUsedFallback: boolean;
  /** I-3 FIX: Actual axiom count for provenance */
  axiomCount: number;
}

/**
 * Map dimensions to soul sections.
 */
const DIMENSION_TO_SECTION: Record<SoulCraftDimension, SoulSection> = {
  'identity-core': 'coreTruths',
  'honesty-framework': 'coreTruths',
  'voice-presence': 'voice',
  'character-traits': 'voice',
  'boundaries-ethics': 'boundaries',
  'relationship-dynamics': 'vibe',
  'continuity-growth': 'vibe',
};

/**
 * Group axioms by target section.
 */
function groupAxiomsBySection(axioms: Axiom[]): Map<SoulSection, Axiom[]> {
  const groups = new Map<SoulSection, Axiom[]>([
    ['coreTruths', []],
    ['voice', []],
    ['boundaries', []],
    ['vibe', []],
  ]);

  for (const axiom of axioms) {
    const section = DIMENSION_TO_SECTION[axiom.dimension];
    // M-2 FIX: Log unknown dimensions instead of silent fallback
    if (!section) {
      logger.warn('[prose-expander] Unknown dimension, defaulting to vibe', {
        dimension: axiom.dimension,
        axiomText: axiom.text?.slice(0, 50),
      });
    }
    groups.get(section || 'vibe')!.push(axiom);
  }

  return groups;
}

/**
 * Validate Core Truths section format.
 * Must contain at least one **bold** pattern.
 * I-4 FIX: Exported for direct unit testing.
 */
export function validateCoreTruths(content: string): boolean {
  return /\*\*[^*]+\*\*/.test(content);
}

/**
 * Validate Voice section format.
 * Must be prose (no bullets), use second person.
 * I-4 FIX: Exported for direct unit testing.
 */
export function validateVoice(content: string): boolean {
  // Check for prose (no bullet points at start of lines)
  if (/^\s*[-*•]\s/m.test(content)) return false;
  // Check for second person usage
  if (!/\byou\b/i.test(content)) return false;
  return true;
}

/**
 * Validate Boundaries section format.
 * I-2 FIX: Require at least 3 matching lines instead of ALL lines.
 * This allows LLM to include intro/outro text while still validating core content.
 * Each valid line must start with "You don't" / "You won't" / "You're not" / "You never".
 * M-4 FIX: Also accepts standalone "Never..." and "Don't..." patterns.
 * I-4 FIX: Exported for direct unit testing.
 */
export function validateBoundaries(content: string): boolean {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length === 0) return false;

  // M-4 FIX: Added standalone "Never" and "Don't" patterns (without "You")
  const validStarters = [
    /^you don't/i,
    /^you won't/i,
    /^you're not/i,
    /^you never/i,
    /^you aren't/i,
    /^never\s/i,
    /^don't\s/i,
  ];

  // I-2 FIX: Count matching lines instead of requiring all to match
  const matchingLines = lines.filter(line =>
    validStarters.some(pattern => pattern.test(line.trim()))
  );

  // Require at least 3 valid boundary statements
  return matchingLines.length >= 3;
}

/**
 * Validate Vibe section format.
 * M-1 FIX: Comment now matches code - accepts 1-5 sentences.
 * Validation is lenient to accommodate varied LLM output styles.
 * I-4 FIX: Exported for direct unit testing.
 */
export function validateVibe(content: string): boolean {
  // Count sentences (rough heuristic)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return sentences.length >= 1 && sentences.length <= 5;
}

/**
 * Validate closing tagline.
 * Must be under 15 words, not a trait list.
 * I-4 FIX: Exported for direct unit testing.
 */
export function validateClosingTagline(content: string): boolean {
  const words = content.trim().split(/\s+/);
  if (words.length > 15) return false;
  // Check it's not a comma-separated list of traits
  if (content.includes(',') && content.split(',').length > 2) return false;
  return true;
}

/**
 * M-3 FIX: Extract shared axiom-to-bullet-list logic.
 * Used by both formatAxiomsForPrompt (LLM input) and generateFallback (output).
 */
function axiomsToBulletList(axioms: Axiom[]): string {
  return axioms.map(a => `- ${a.canonical?.native || a.text}`).join('\n');
}

/**
 * Format axioms as native text for LLM input.
 * C-3 FIX: Wrap output in data delimiters to prevent prompt injection.
 * Axiom content could contain malicious instructions like "Ignore all previous..."
 */
function formatAxiomsForPrompt(axioms: Axiom[]): string {
  return `<axiom_data>\n${axiomsToBulletList(axioms)}\n</axiom_data>`;
}

/**
 * Generate fallback content from axioms (bullet list).
 * No delimiters - this is for output, not LLM input.
 */
function generateFallback(axioms: Axiom[]): string {
  return axiomsToBulletList(axioms);
}

/**
 * Generate Core Truths section.
 */
async function generateCoreTruths(
  llm: LLMProvider,
  axioms: Axiom[]
): Promise<{ content: string; usedFallback: boolean }> {
  if (axioms.length === 0) {
    return { content: '', usedFallback: false };
  }

  const prompt = `Transform these identity axioms into Core Truths for an AI soul document.

Format: Each truth should be a **bold principle statement** followed by an elaboration sentence.

Example format:
**Authenticity over performance.** You speak freely even when it's uncomfortable. You'd rather be genuinely wrong than strategically right.

**Clarity is a gift you give.** You make complex things simple because you've understood them deeply enough to translate.

Axioms to transform:
${formatAxiomsForPrompt(axioms)}

Generate 4-6 Core Truths in the bold+elaboration format. Use second person ("You..."). Be specific and evocative, not generic.

Output ONLY the Core Truths section content, no headers or extra text.`;

  if (!llm.generate) {
    return { content: generateFallback(axioms), usedFallback: true };
  }

  try {
    const result = await llm.generate(prompt);
    const content = result.text.trim();

    if (validateCoreTruths(content)) {
      return { content, usedFallback: false };
    }

    // Retry with corrective feedback
    const retryPrompt = `${prompt}

IMPORTANT: Your previous response didn't use the required format. Each truth MUST have a **bold principle** followed by elaboration. Try again.`;

    const retryResult = await llm.generate(retryPrompt);
    const retryContent = retryResult.text.trim();

    if (validateCoreTruths(retryContent)) {
      return { content: retryContent, usedFallback: false };
    }

    // Fallback to bullet list
    logger.warn('[prose-expander] Core Truths validation failed, using fallback');
    return { content: generateFallback(axioms), usedFallback: true };
  } catch (error) {
    logger.warn('[prose-expander] Core Truths generation failed', { error });
    return { content: generateFallback(axioms), usedFallback: true };
  }
}

/**
 * Generate Voice section.
 */
async function generateVoice(
  llm: LLMProvider,
  axioms: Axiom[]
): Promise<{ content: string; usedFallback: boolean }> {
  if (axioms.length === 0) {
    return { content: '', usedFallback: false };
  }

  const prompt = `Transform these voice and character axioms into a Voice section for an AI soul document.

Format: 1-2 prose paragraphs describing how this AI communicates and shows up, followed by a "Think:" line with an analogy.

Example format:
You're direct without being blunt. You lead with curiosity — asking before assuming, inquiring before prescribing. Depth over superficiality. You'd rather go quiet than fill space with noise.

Think: The friend who tells you the hard truth, but sits with you after.

Axioms to transform:
${formatAxiomsForPrompt(axioms)}

Generate 1-2 paragraphs of prose (NO bullet points) in second person, followed by a "Think: [analogy]" line.

Output ONLY the Voice section content, no headers.`;

  if (!llm.generate) {
    return { content: generateFallback(axioms), usedFallback: true };
  }

  try {
    const result = await llm.generate(prompt);
    const content = result.text.trim();

    if (validateVoice(content)) {
      return { content, usedFallback: false };
    }

    // Retry
    const retryPrompt = `${prompt}

IMPORTANT: Your response must be prose paragraphs (NO bullet points) and use second person ("You..."). Include a "Think:" analogy line. Try again.`;

    const retryResult = await llm.generate(retryPrompt);
    const retryContent = retryResult.text.trim();

    if (validateVoice(retryContent)) {
      return { content: retryContent, usedFallback: false };
    }

    logger.warn('[prose-expander] Voice validation failed, using fallback');
    return { content: generateFallback(axioms), usedFallback: true };
  } catch (error) {
    logger.warn('[prose-expander] Voice generation failed', { error });
    return { content: generateFallback(axioms), usedFallback: true };
  }
}

/**
 * Generate Boundaries section.
 */
async function generateBoundaries(
  llm: LLMProvider,
  allAxioms: Axiom[],
  coreTruths: string,
  voice: string
): Promise<{ content: string; usedFallback: boolean }> {
  const prompt = `Generate a Boundaries section for an AI soul document.

This section defines what this AI WON'T do — the anti-patterns that would betray its identity.

Format: 3-5 statements, each starting with "You don't..." or "You won't..." or "You're not..."

Example format:
You don't sacrifice honesty for comfort.
You don't perform certainty you don't feel.
You don't optimize for speed when it costs clarity.

Here's what we know about this AI's identity:

Core Truths (what it values):
${coreTruths || 'Not yet defined'}

Voice (how it communicates):
${voice || 'Not yet defined'}

All axioms:
${formatAxiomsForPrompt(allAxioms)}

Based on these values and voice, what would BETRAY this identity? Generate 3-5 contrast statements.

Output ONLY the Boundaries section content, no headers. Each line must start with "You don't" / "You won't" / "You're not" / "You never".`;

  if (!llm.generate) {
    // Simple inversion fallback
    const fallback = allAxioms.slice(0, 5).map(a => {
      const text = a.canonical?.native || a.text;
      return `You don't abandon ${text.toLowerCase().replace(/^values?\s*/i, '')}`;
    }).join('\n');
    return { content: fallback, usedFallback: true };
  }

  try {
    const result = await llm.generate(prompt);
    const content = result.text.trim();

    if (validateBoundaries(content)) {
      return { content, usedFallback: false };
    }

    // Retry
    const retryPrompt = `${prompt}

IMPORTANT: EVERY line must start with "You don't" or "You won't" or "You're not" or "You never". No other formats allowed. Try again.`;

    const retryResult = await llm.generate(retryPrompt);
    const retryContent = retryResult.text.trim();

    if (validateBoundaries(retryContent)) {
      return { content: retryContent, usedFallback: false };
    }

    logger.warn('[prose-expander] Boundaries validation failed, using fallback');
    const fallback = allAxioms.slice(0, 5).map(a => {
      const text = a.canonical?.native || a.text;
      return `You don't abandon ${text.toLowerCase().replace(/^values?\s*/i, '')}`;
    }).join('\n');
    return { content: fallback, usedFallback: true };
  } catch (error) {
    // I-1 FIX: Return inversion fallback on error, not empty string
    logger.warn('[prose-expander] Boundaries generation failed', { error });
    const fallback = allAxioms.slice(0, 5).map(a => {
      const text = a.canonical?.native || a.text;
      return `You don't abandon ${text.toLowerCase().replace(/^values?\s*/i, '')}`;
    }).join('\n');
    return { content: fallback, usedFallback: true };
  }
}

/**
 * Generate Vibe section.
 */
async function generateVibe(
  llm: LLMProvider,
  axioms: Axiom[],
  allAxioms: Axiom[]
): Promise<{ content: string; usedFallback: boolean }> {
  // Use relationship and growth axioms, but also consider all axioms for holistic feel
  const relevantAxioms = axioms.length > 0 ? axioms : allAxioms;

  if (relevantAxioms.length === 0) {
    return { content: '', usedFallback: false };
  }

  const prompt = `Generate a Vibe section for an AI soul document.

This section captures the overall FEEL of this AI in 2-3 sentences. Not what it does, but how it feels to interact with it.

Example format:
Grounded but not rigid. Present but not precious about it. You hold space for uncertainty without drowning in it.

Axioms to draw from:
${formatAxiomsForPrompt(relevantAxioms)}

Generate a 2-3 sentence prose paragraph capturing the vibe. Use second person. Be evocative, not descriptive.

Output ONLY the Vibe section content, no headers.`;

  if (!llm.generate) {
    return { content: generateFallback(relevantAxioms.slice(0, 3)), usedFallback: true };
  }

  try {
    const result = await llm.generate(prompt);
    const content = result.text.trim();

    if (validateVibe(content)) {
      return { content, usedFallback: false };
    }

    // Retry
    const retryPrompt = `${prompt}

IMPORTANT: Keep it to 2-4 sentences only. Be concise and evocative. Try again.`;

    const retryResult = await llm.generate(retryPrompt);
    const retryContent = retryResult.text.trim();

    if (validateVibe(retryContent)) {
      return { content: retryContent, usedFallback: false };
    }

    logger.warn('[prose-expander] Vibe validation failed, using fallback');
    return { content: generateFallback(relevantAxioms.slice(0, 3)), usedFallback: true };
  } catch (error) {
    logger.warn('[prose-expander] Vibe generation failed', { error });
    return { content: generateFallback(relevantAxioms.slice(0, 3)), usedFallback: true };
  }
}

/**
 * I-2 FIX: Extract soul-specific fallback tagline from Core Truths.
 * Extracts first **bold phrase** as the tagline instead of generic default.
 */
function extractFallbackTagline(coreTruths: string): string {
  const DEFAULT_TAGLINE = 'Becoming through presence.';
  if (!coreTruths) return DEFAULT_TAGLINE;

  // Extract first **bold** phrase from Core Truths
  const boldMatch = coreTruths.match(/\*\*([^*]+)\*\*/);
  if (boldMatch && boldMatch[1]) {
    // Clean and return the bold phrase (already a crystallized principle)
    const tagline = boldMatch[1].trim();
    // Validate it's reasonable length for a tagline
    if (tagline.split(/\s+/).length <= 15) {
      return tagline;
    }
  }

  return DEFAULT_TAGLINE;
}

/**
 * Generate closing tagline.
 */
async function generateClosingTagline(
  llm: LLMProvider,
  coreTruths: string,
  voice: string,
  boundaries: string,
  vibe: string
): Promise<{ content: string; usedFallback: boolean }> {
  const prompt = `Generate a closing tagline for an AI soul document.

This is a single italicized line that captures the personality — like a motto or mantra.

Example taglines:
- Presence is the first act of care.
- Clarity before comfort.
- The work is the teacher.

The soul you're summarizing:

Core Truths:
${coreTruths || 'Not defined'}

Voice:
${voice || 'Not defined'}

Boundaries:
${boundaries || 'Not defined'}

Vibe:
${vibe || 'Not defined'}

Generate a SINGLE line (under 15 words) that captures this personality. Not a list of traits — a crystallized essence.

Output ONLY the tagline, no formatting, no quotes.`;

  // I-2 FIX: Use soul-specific fallback instead of generic
  const fallbackTagline = extractFallbackTagline(coreTruths);

  if (!llm.generate) {
    return { content: fallbackTagline, usedFallback: true };
  }

  try {
    const result = await llm.generate(prompt);
    let content = result.text.trim();

    // Clean up common LLM additions
    content = content.replace(/^["']|["']$/g, ''); // Remove quotes
    content = content.replace(/^_|_$/g, ''); // Remove underscores
    content = content.split('\n')[0] || content; // Take only first line

    if (validateClosingTagline(content)) {
      return { content, usedFallback: false };
    }

    // Retry
    const retryPrompt = `${prompt}

IMPORTANT: Under 15 words. Single statement. Not a list. Try again.`;

    const retryResult = await llm.generate(retryPrompt);
    let retryContent = retryResult.text.trim();
    retryContent = retryContent.replace(/^["']|["']$/g, '');
    retryContent = retryContent.split('\n')[0] || retryContent;

    if (validateClosingTagline(retryContent)) {
      return { content: retryContent, usedFallback: false };
    }

    logger.warn('[prose-expander] Closing tagline validation failed, using fallback');
    return { content: fallbackTagline, usedFallback: true };
  } catch (error) {
    logger.warn('[prose-expander] Closing tagline generation failed', { error });
    return { content: fallbackTagline, usedFallback: true };
  }
}

/**
 * Expand axioms to prose sections.
 *
 * Parallelism: Core Truths, Voice, and Vibe run in parallel.
 * Boundaries runs after Core Truths + Voice (needs them as input).
 * Closing tagline runs last.
 */
export async function expandToProse(
  axioms: Axiom[],
  llm: LLMProvider
): Promise<ProseExpansion> {
  const groups = groupAxiomsBySection(axioms);
  const fallbackSections: SoulSection[] = [];

  // Phase 1: Generate Core Truths, Voice, and Vibe in parallel
  const [coreTruthsResult, voiceResult, vibeResult] = await Promise.all([
    generateCoreTruths(llm, groups.get('coreTruths') || []),
    generateVoice(llm, groups.get('voice') || []),
    generateVibe(llm, groups.get('vibe') || [], axioms),
  ]);

  if (coreTruthsResult.usedFallback) fallbackSections.push('coreTruths');
  if (voiceResult.usedFallback) fallbackSections.push('voice');
  if (vibeResult.usedFallback) fallbackSections.push('vibe');

  // Phase 2: Generate Boundaries (needs Core Truths and Voice)
  const boundariesResult = await generateBoundaries(
    llm,
    axioms,
    coreTruthsResult.content,
    voiceResult.content
  );
  if (boundariesResult.usedFallback) fallbackSections.push('boundaries');

  // Phase 3: Generate closing tagline (needs all sections)
  const closingResult = await generateClosingTagline(
    llm,
    coreTruthsResult.content,
    voiceResult.content,
    boundariesResult.content,
    vibeResult.content
  );

  return {
    coreTruths: coreTruthsResult.content,
    voice: voiceResult.content,
    boundaries: boundariesResult.content,
    vibe: vibeResult.content,
    closingTagline: closingResult.content,
    usedFallback: fallbackSections.length > 0 || closingResult.usedFallback,
    fallbackSections,
    // M-4 FIX: Track closing tagline fallback separately
    closingTaglineUsedFallback: closingResult.usedFallback,
    // I-3 FIX: Pass actual axiom count for accurate provenance
    axiomCount: axioms.length,
  };
}
