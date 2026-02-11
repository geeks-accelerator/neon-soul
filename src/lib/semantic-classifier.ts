/**
 * Semantic Classifier Module
 *
 * Central module for all LLM-based semantic classification.
 * All functions require an LLM provider - no fallback to keyword matching (Option C design).
 *
 * Functions:
 *   - classifyDimension: Classify text into SoulCraft dimensions
 *   - classifySignalType: Classify text into signal types
 *   - classifySectionType: Classify section by title/content
 *   - classifyCategory: Classify memory content category
 *
 * Note: Notation generation (CJK/emoji/math) is handled directly by the LLM
 * in compressor.ts via generateNotatedForm(). No vocabulary mapping here.
 *
 * Language Note (TR-5): Input text can be any language - the LLM understands
 * multilingual content. However, category descriptions in prompts are English.
 * For non-English souls (Japanese, Mandarin, etc.), accuracy may vary. Consider
 * translating category descriptions if building localized versions.
 */

import type { LLMProvider } from '../types/llm.js';
import { requireLLM } from '../types/llm.js';
import type { SignalType } from '../types/signal.js';
import { SOULCRAFT_DIMENSIONS, type SoulCraftDimension } from '../types/dimensions.js';
import type { MemoryCategory } from './memory-walker.js';
import {
  type SectionType,
  SIGNAL_TYPES,
  SECTION_TYPES,
  MEMORY_CATEGORIES,
} from './semantic-vocabulary.js';

// Re-export types for consumers
export type { SectionType };

// TR-4: Using shared requireLLM from llm.ts (removed local duplicate)

/**
 * Sanitize user input to prevent prompt injection.
 * CR-2 FIX: Wrap user content in XML delimiters to separate from instructions.
 */
function sanitizeForPrompt(text: string): string {
  // Escape any XML-like tags in the user content
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Classify text into one of the 7 SoulCraft dimensions.
 *
 * @param llm - LLM provider (required)
 * @param text - Text to classify
 * @returns The classified SoulCraft dimension
 * @throws LLMRequiredError if llm is null/undefined
 */
export async function classifyDimension(
  llm: LLMProvider | null | undefined,
  text: string
): Promise<SoulCraftDimension> {
  requireLLM(llm, 'classifyDimension');

  // CR-2 FIX: Use XML delimiters to separate instructions from user content
  const sanitizedText = sanitizeForPrompt(text);
  const prompt = `Classify the following text into one of these identity dimensions:

- identity-core: Fundamental self-conception, who they are at their core
- character-traits: Behavioral patterns, personality characteristics
- voice-presence: Communication style, how they express themselves
- honesty-framework: Truth-telling approach, transparency preferences
- boundaries-ethics: Ethical limits, moral constraints, what they won't do
- relationship-dynamics: Interpersonal patterns, how they relate to others
- continuity-growth: Development trajectory, learning, evolution over time

<user_content>
${sanitizedText}
</user_content>

Which dimension best describes the text in <user_content>?`;

  const result = await llm.classify(prompt, {
    categories: SOULCRAFT_DIMENSIONS,
    context: 'SoulCraft identity dimension classification',
  });

  // Stage 3: Dimension is required for signal processing - throw if null
  if (result.category === null) {
    throw new Error(`Failed to classify dimension for text: "${text.slice(0, 50)}..."`);
  }

  return result.category;
}

/**
 * Classify text into one of the signal types.
 *
 * @param llm - LLM provider (required)
 * @param text - Text to classify
 * @returns The classified signal type
 * @throws LLMRequiredError if llm is null/undefined
 */
export async function classifySignalType(
  llm: LLMProvider | null | undefined,
  text: string
): Promise<SignalType> {
  requireLLM(llm, 'classifySignalType');

  // CR-2 FIX: Use XML delimiters to separate instructions from user content
  const sanitizedText = sanitizeForPrompt(text);
  const prompt = `Classify the following text into one of these signal types:

- value: Something the person values or finds important
- belief: A core belief or conviction they hold
- preference: Something they prefer or like
- goal: An aspiration or objective they're working toward
- constraint: A limitation or condition they operate under
- relationship: How they relate to or connect with others
- pattern: A recurring behavior or habit
- correction: A clarification or correction of a previous assumption
- boundary: A limit they set, something they won't do
- reinforcement: Strengthening or repeating an existing pattern

<user_content>
${sanitizedText}
</user_content>

Which signal type best describes the text in <user_content>?`;

  const result = await llm.classify(prompt, {
    categories: SIGNAL_TYPES,
    context: 'Identity signal type classification',
  });

  // Stage 3: Default to 'value' if classification failed
  return result.category ?? 'value';
}

/**
 * Classify section by title and optional content.
 *
 * @param llm - LLM provider (required)
 * @param title - Section title
 * @param content - Optional section content for additional context
 * @returns The classified section type
 * @throws LLMRequiredError if llm is null/undefined
 */
export async function classifySectionType(
  llm: LLMProvider | null | undefined,
  title: string,
  content?: string
): Promise<SectionType> {
  requireLLM(llm, 'classifySectionType');

  // CR-2 FIX: Use XML delimiters to separate instructions from user content
  const sanitizedTitle = sanitizeForPrompt(title);
  const sanitizedContent = content ? sanitizeForPrompt(content.slice(0, 200)) : '';
  const contentContext = sanitizedContent ? `\n\n<content_preview>\n${sanitizedContent}...\n</content_preview>` : '';

  const prompt = `Classify this section into one of these types:

- core-truths: Core values, fundamental beliefs, identity statements
- boundaries: Limits, constraints, things they won't do, ethical lines
- vibe-tone: Communication style, voice, personality expression
- examples: Good/bad examples, patterns to follow or avoid
- preferences: Likes, preferences, favored approaches
- other: Sections that don't fit the above categories

<section_title>
${sanitizedTitle}
</section_title>${contentContext}

Which section type best describes the section in <section_title>?`;

  const result = await llm.classify(prompt, {
    categories: SECTION_TYPES,
    context: 'Section type classification for template/memory processing',
  });

  // Stage 3: Default to 'other' if classification failed
  return result.category ?? 'other';
}

/**
 * Classify memory content into a category.
 *
 * @param llm - LLM provider (required)
 * @param text - Memory content to classify
 * @returns The classified memory category
 * @throws LLMRequiredError if llm is null/undefined
 */
export async function classifyCategory(
  llm: LLMProvider | null | undefined,
  text: string
): Promise<MemoryCategory> {
  requireLLM(llm, 'classifyCategory');

  // CR-2 FIX: Use XML delimiters to separate instructions from user content
  const sanitizedText = sanitizeForPrompt(text.slice(0, 500));
  const prompt = `Classify this memory content into one of these categories:

- diary: Journal entries, daily reflections, personal thoughts
- experiences: Event memories, stories, things that happened
- goals: Aspirations, objectives, things to achieve
- knowledge: Learned facts, information, expertise
- relationships: People, connections, social dynamics
- preferences: Likes, dislikes, explicit preferences
- unknown: Content that doesn't clearly fit other categories

<memory_content>
${sanitizedText}${text.length > 500 ? '...' : ''}
</memory_content>

Which category best describes the content in <memory_content>?`;

  const result = await llm.classify(prompt, {
    categories: MEMORY_CATEGORIES,
    context: 'Memory content category classification',
  });

  // Stage 3: Default to 'unknown' if classification failed
  return result.category ?? 'unknown';
}
