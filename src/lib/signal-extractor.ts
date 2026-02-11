/**
 * Generic signal extraction with LLM-based semantic detection.
 * Uses LLM to identify identity signals (no keyword matching).
 * LLM provider required for all signal extraction operations.
 *
 * Environment Variables:
 *   - NEON_SOUL_LLM_CONCURRENCY: Batch size for parallel LLM calls (default: 10)
 */

import type { Signal } from '../types/signal.js';
import type { LLMProvider } from '../types/llm.js';
import { requireLLM } from '../types/llm.js';
import { embed } from './embeddings.js';
import { createSignalSource } from './provenance.js';
import type { MemoryFile } from './memory-walker.js';
import {
  classifyDimension as semanticClassifyDimension,
  classifySignalType as semanticClassifySignalType,
} from './semantic-classifier.js';

export interface ExtractionConfig {
  promptTemplate: string; // With {content}, {path}, {category} placeholders
  sourceType: 'template' | 'memory' | 'interview';
}

/**
 * Result from signal detection LLM call.
 */
interface SignalDetectionResult {
  isSignal: boolean;
  confidence: number;
}

// Stage 4: Removed dead code - extractSignals(), callLLMForSignals(), ExtractedSignal interface
// Use extractSignalsFromContent() instead

// MN-2 FIX: Use crypto.randomUUID() for better collision resistance
import { randomUUID } from 'node:crypto';

/**
 * Generate unique ID for signals.
 * Uses crypto.randomUUID() for proper collision resistance.
 */
function generateId(): string {
  return `sig_${randomUUID()}`;
}

// TR-4: Using shared requireLLM from llm.ts (removed local duplicate)

/**
 * IM-7 FIX: Sanitize user input to prevent prompt injection.
 * Escapes XML-like tags in user content.
 */
function sanitizeForPrompt(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Detect if a line is an identity signal using LLM.
 * Returns detection result with confidence score.
 * IM-7 FIX: Uses XML delimiters to prevent prompt injection.
 */
async function isIdentitySignal(
  llm: LLMProvider,
  line: string
): Promise<SignalDetectionResult> {
  // IM-7 FIX: Sanitize and wrap user content in XML delimiters
  const sanitizedLine = sanitizeForPrompt(line);
  const prompt = `Is this line an identity signal? An identity signal is a statement that reveals:
- Core values, beliefs, or principles
- Preferences or inclinations
- Goals or aspirations
- Boundaries or constraints
- Relationship patterns
- Behavioral patterns or habits

<user_content>
${sanitizedLine}
</user_content>

Answer yes or no based on the content in <user_content>, with a confidence from 0.0 to 1.0.`;

  const result = await llm.classify(prompt, {
    categories: ['yes', 'no'] as const,
    context: 'Identity signal detection',
  });

  // Stage 3: If category is null (parse failed), treat as not a signal
  return {
    isSignal: result.category === 'yes',
    confidence: result.confidence,
  };
}

/** Default confidence threshold for signal detection */
const DEFAULT_CONFIDENCE_THRESHOLD = 0.5;

/**
 * Batch size for parallel LLM processing.
 * Configurable via NEON_SOUL_LLM_CONCURRENCY env var.
 * Default: 10 (limits concurrent LLM calls to ~30: 10 signals × 3 calls each)
 */
const BATCH_SIZE = parseInt(process.env['NEON_SOUL_LLM_CONCURRENCY'] ?? '10', 10);

/**
 * Extract signals from markdown content using LLM-based semantic detection.
 * LLM provider is required - no fallback to keyword matching.
 *
 * Performance optimizations (CR6-1):
 * - Collects candidate lines first, then batch processes
 * - Parallelizes dimension + signalType classification (independent operations)
 * - Processes detection in parallel batches
 *
 * @param llm - LLM provider (required)
 * @param content - Markdown content to extract signals from
 * @param source - Source file information
 * @param options - Optional configuration
 * @returns Array of extracted signals
 * @throws LLMRequiredError if llm is null/undefined
 */
export async function extractSignalsFromContent(
  llm: LLMProvider | null | undefined,
  content: string,
  source: { file: string; category?: string },
  options: { confidenceThreshold?: number } = {}
): Promise<Signal[]> {
  requireLLM(llm, 'extractSignalsFromContent');

  const confidenceThreshold =
    options.confidenceThreshold ?? DEFAULT_CONFIDENCE_THRESHOLD;

  // Phase 1: Collect candidate lines (no LLM calls yet)
  const candidates: Array<{ text: string; lineNum: number; originalLine: string }> =
    [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? '';
    if (!line || line.length < 10) continue;

    // Extract text from structured markdown
    let text = line;

    // Strip bullet point markers
    if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
      text = line.replace(/^[-*]\s+|\d+\.\s+/, '');
    }

    // Strip heading markers
    if (line.startsWith('#')) {
      text = line.replace(/^#+\s*/, '');
    }

    // Skip short text after stripping
    if (text.length < 10) continue;

    candidates.push({ text, lineNum: i + 1, originalLine: line });
  }

  // Phase 2: Detect identity signals in parallel batches
  const detectionResults: Array<{
    candidate: (typeof candidates)[0];
    detection: { isSignal: boolean; confidence: number };
  }> = [];

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (candidate) => ({
        candidate,
        detection: await isIdentitySignal(llm, candidate.text),
      }))
    );
    detectionResults.push(...batchResults);
  }

  // Phase 3: Filter to confirmed signals
  const confirmedSignals = detectionResults.filter(
    (r) => r.detection.isSignal && r.detection.confidence >= confidenceThreshold
  );

  // Phase 4: Classify and embed confirmed signals in BATCHES
  // Fix: Unbounded parallelism was causing Ollama to timeout under load
  // See docs/issues/2026-02-10-llm-classification-failures.md
  const signals: Signal[] = [];

  for (let i = 0; i < confirmedSignals.length; i += BATCH_SIZE) {
    const batch = confirmedSignals.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async ({ candidate, detection }) => {
        // Parallelize dimension, signalType, and embedding (independent operations)
        const [dimension, signalType, embedding] = await Promise.all([
          semanticClassifyDimension(llm, candidate.text),
          semanticClassifySignalType(llm, candidate.text),
          embed(candidate.text),
        ]);

        const signalSource = createSignalSource(
          source.file,
          candidate.lineNum,
          candidate.originalLine.slice(0, 100)
        );

        return {
          id: generateId(),
          type: signalType,
          text: candidate.text,
          confidence: detection.confidence,
          embedding,
          source: signalSource,
          dimension,
        };
      })
    );
    signals.push(...batchResults);
  }

  return signals;
}

/**
 * Extract signals from multiple memory files.
 * LLM provider is required for all extraction operations.
 *
 * @param llm - LLM provider (required)
 * @param memoryFiles - Array of memory files to process
 * @returns Array of extracted signals from all files
 * @throws LLMRequiredError if llm is null/undefined
 */
export async function extractSignalsFromMemoryFiles(
  llm: LLMProvider | null | undefined,
  memoryFiles: MemoryFile[]
): Promise<Signal[]> {
  requireLLM(llm, 'extractSignalsFromMemoryFiles');

  // TR-2: Parallelize file-level extraction (files are independent)
  const signalArrays = await Promise.all(
    memoryFiles.map((file) =>
      extractSignalsFromContent(llm, file.content, {
        file: file.path,
        category: file.category,
      })
    )
  );

  return signalArrays.flat();
}
