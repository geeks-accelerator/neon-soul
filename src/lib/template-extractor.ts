/**
 * Template-specific signal extraction for SOUL.md templates.
 * Uses LLM-based semantic classification to determine section types.
 */

import { readFileSync } from 'node:fs';
import type { Signal, SignalType } from '../types/signal.js';
import type { LLMProvider } from '../types/llm.js';
import { parseMarkdown } from './markdown-reader.js';
import { embed } from './embeddings.js';
import { createSignalSource } from './provenance.js';
import { classifySectionType, type SectionType } from './semantic-classifier.js';
import { logger } from './logger.js';

export interface TemplateExtractionResult {
  templatePath: string;
  signals: Signal[];
  metadata: {
    title: string;
    subtitle: string;
    sectionCount: number;
    extractedAt: string;
  };
}

/**
 * Extract signals from a SOUL.md template file.
 * Uses LLM-based semantic classification to identify section types:
 * - Bold statements in "Core Truths" → value signals
 * - Bullet points in "Boundaries" → boundary signals
 * - "Vibe" section → preference signals
 * - Example patterns (do/don't) → correction signals
 *
 * @param templatePath - Path to the template file
 * @param llm - LLM provider for semantic classification (required)
 */
export async function extractFromTemplate(
  templatePath: string,
  llm: LLMProvider
): Promise<TemplateExtractionResult> {
  const content = readFileSync(templatePath, 'utf-8');
  const parsed = parseMarkdown(content);
  const signals: Signal[] = [];

  // Extract title from first h1
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1] ?? 'Unknown Template';

  // Extract subtitle (italic line after title)
  const subtitleMatch = content.match(/^_(.+)_$/m);
  const subtitle = subtitleMatch?.[1] ?? '';

  // Process each section
  for (const section of parsed.sections) {
    const sectionSignals = await extractSectionSignals(
      section.title,
      section.content,
      templatePath,
      section.startLine,
      llm
    );
    signals.push(...sectionSignals);
  }

  return {
    templatePath,
    signals,
    metadata: {
      title,
      subtitle,
      sectionCount: parsed.sections.length,
      extractedAt: new Date().toISOString(),
    },
  };
}

/**
 * Extract signals from a specific section based on its type.
 * Uses LLM-based semantic classification to determine section type.
 */
async function extractSectionSignals(
  sectionTitle: string,
  content: string,
  filePath: string,
  startLine: number,
  llm: LLMProvider
): Promise<Signal[]> {
  const signals: Signal[] = [];

  // Use LLM to classify section type semantically
  const sectionType: SectionType = await classifySectionType(llm, sectionTitle, content);

  switch (sectionType) {
    case 'core-truths': {
      // Extract bold statements as value signals
      const boldPatterns = content.matchAll(/\*\*([^*]+)\*\*/g);
      // IM-10 FIX: Track cumulative position for efficient line counting
      let lastIndex = 0;
      let lineOffset = 0;

      for (const match of boldPatterns) {
        // IM-10 FIX: Calculate line offset BEFORE using it, accumulate incrementally
        const matchIndex = match.index ?? 0;
        const segment = content.slice(lastIndex, matchIndex);
        lineOffset += (segment.match(/\n/g) ?? []).length;
        lastIndex = matchIndex;

        const text = match[1]?.trim();
        if (text && text.length > 10) {
          // Skip very short matches
          const signal = await createSignal(
            text,
            'value',
            0.9,
            filePath,
            startLine + lineOffset,
            content
          );
          signals.push(signal);
        }
      }
      break;
    }

    case 'boundaries': {
      // Extract bullet points as boundary signals
      const bullets = content.matchAll(/^[-*]\s+(.+)$/gm);
      // IM-10 FIX: Track cumulative position for efficient line counting
      let lastIndex = 0;
      let lineOffset = 0;

      for (const match of bullets) {
        // IM-10 FIX: Calculate line offset BEFORE using it, accumulate incrementally
        const matchIndex = match.index ?? 0;
        const segment = content.slice(lastIndex, matchIndex);
        lineOffset += (segment.match(/\n/g) ?? []).length;
        lastIndex = matchIndex;

        const text = match[1]?.trim();
        if (text) {
          const signal = await createSignal(
            text,
            'boundary',
            0.85,
            filePath,
            startLine + lineOffset,
            content
          );
          signals.push(signal);
        }
      }
      break;
    }

    case 'vibe-tone': {
      // Extract vibe description as preference signal
      const lines = content.split('\n').filter((l) => l.trim().length > 20);
      for (let i = 0; i < Math.min(lines.length, 2); i++) {
        const text = lines[i]?.trim();
        if (text) {
          const signal = await createSignal(
            text,
            'preference',
            0.8,
            filePath,
            startLine + i,
            content
          );
          signals.push(signal);
        }
      }
      break;
    }

    case 'examples': {
      // Extract good examples as reinforcement, bad as correction
      const goodPatterns = content.matchAll(/✅\s*\*\*Good:\*\*\s*"([^"]+)"/g);
      const badPatterns = content.matchAll(/❌\s*\*\*Bad:\*\*\s*"([^"]+)"/g);

      for (const match of goodPatterns) {
        const text = match[1]?.trim();
        if (text) {
          const signal = await createSignal(
            `Good pattern: ${text}`,
            'reinforcement',
            0.85,
            filePath,
            startLine,
            content
          );
          signals.push(signal);
        }
      }

      for (const match of badPatterns) {
        const text = match[1]?.trim();
        if (text) {
          const signal = await createSignal(
            `Avoid: ${text}`,
            'correction',
            0.85,
            filePath,
            startLine,
            content
          );
          signals.push(signal);
        }
      }
      break;
    }

    case 'preferences': {
      // Extract preference statements from bullet points
      const bullets = content.matchAll(/^[-*]\s+(.+)$/gm);
      // IM-10 FIX: Track cumulative position for efficient line counting
      let lastIndex = 0;
      let lineOffset = 0;

      for (const match of bullets) {
        // IM-10 FIX: Calculate line offset BEFORE using it, accumulate incrementally
        const matchIndex = match.index ?? 0;
        const segment = content.slice(lastIndex, matchIndex);
        lineOffset += (segment.match(/\n/g) ?? []).length;
        lastIndex = matchIndex;

        const text = match[1]?.trim();
        if (text) {
          const signal = await createSignal(
            text,
            'preference',
            0.8,
            filePath,
            startLine + lineOffset,
            content
          );
          signals.push(signal);
        }
      }
      break;
    }

    case 'other':
      // Unknown section type - no signals extracted
      break;
  }

  return signals;
}

/**
 * Create a signal with embedding.
 */
async function createSignal(
  text: string,
  type: SignalType,
  confidence: number,
  filePath: string,
  line: number,
  context: string
): Promise<Signal> {
  const embedding = await embed(text);
  const source = createSignalSource(filePath, line, context.slice(0, 100));

  return {
    id: generateId(),
    type,
    text,
    confidence,
    embedding,
    source,
  };
}

// MN-2 FIX: Use crypto.randomUUID() for better collision resistance
import { randomUUID } from 'node:crypto';

/**
 * Generate unique ID for signals.
 * Uses crypto.randomUUID() for proper collision resistance.
 */
function generateId(): string {
  return `sig_${randomUUID()}`;
}

/**
 * Batch extract signals from multiple templates.
 *
 * @param templatePaths - Array of paths to template files
 * @param llm - LLM provider for semantic classification (required)
 */
export async function extractFromTemplates(
  templatePaths: string[],
  llm: LLMProvider
): Promise<TemplateExtractionResult[]> {
  const results: TemplateExtractionResult[] = [];

  for (const path of templatePaths) {
    try {
      const result = await extractFromTemplate(path, llm);
      results.push(result);
    } catch (error) {
      // M-5 FIX: Use logger abstraction for configurable output
      logger.error('Failed to extract from template', error, { path });
    }
  }

  return results;
}
