/**
 * Cosine similarity matching for semantic deduplication.
 */

import type { Principle } from '../types/principle.js';

export interface MatchResult {
  principle: Principle | null;
  similarity: number;
  isMatch: boolean; // similarity >= threshold
}

/**
 * Compute cosine similarity between two embeddings.
 * Assumes vectors are L2-normalized (dot product = cosine similarity).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector dimension mismatch: ${a.length} vs ${b.length}`
    );
  }

  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    const aVal = a[i];
    const bVal = b[i];
    if (aVal !== undefined && bVal !== undefined) {
      dot += aVal * bVal;
    }
  }

  return dot;
}

/**
 * Find the best matching principle for an embedding.
 */
export function findBestMatch(
  embedding: number[],
  principles: Principle[],
  threshold: number = 0.75
): MatchResult {
  if (principles.length === 0) {
    return { principle: null, similarity: 0, isMatch: false };
  }

  let bestPrinciple: Principle | null = null;
  let bestSimilarity = -1;

  for (const principle of principles) {
    const similarity = cosineSimilarity(embedding, principle.embedding);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestPrinciple = principle;
    }
  }

  return {
    principle: bestPrinciple,
    similarity: bestSimilarity,
    isMatch: bestSimilarity >= threshold,
  };
}
