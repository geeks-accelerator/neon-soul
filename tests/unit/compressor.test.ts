/**
 * Unit Tests: Compressor
 *
 * Tests for axiom synthesis with LLM-based notation generation.
 */

import { describe, it, expect } from 'vitest';
import { compressPrinciples } from '../../src/lib/compressor.js';
import { createMockLLM } from '../mocks/llm-mock.js';
import type { Principle } from '../../src/types/principle.js';

// Helper to create test principles
function createTestPrinciple(
  id: string,
  text: string,
  nCount: number,
  dimension: Principle['dimension'] = 'honesty-framework'
): Principle {
  return {
    id,
    text,
    dimension,
    n_count: nCount,
    confidence: 0.9,
    embedding: new Array(384).fill(0.1),
    similarity_threshold: 0.85,
    derived_from: {
      signals: [],
      merged_at: new Date().toISOString(),
    },
    history: [],
  };
}

describe('Compressor', () => {
  describe('compressPrinciples', () => {
    it('promotes principles with N >= threshold to axioms', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Be honest', 5), // Should promote
        createTestPrinciple('p2', 'Be clear', 3), // Should promote
        createTestPrinciple('p3', 'Be brief', 2), // Should NOT promote
      ];

      const result = await compressPrinciples(llm, principles, 3);

      expect(result.axioms).toHaveLength(2);
      expect(result.unconverged).toHaveLength(1);
      expect(result.unconverged[0]?.id).toBe('p3');
    });

    it('assigns correct tier based on N-count', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Core principle', 7), // core (N >= 5)
        createTestPrinciple('p2', 'Domain principle', 4), // domain (3 <= N < 5)
        createTestPrinciple('p3', 'Another domain', 3), // domain
      ];

      const result = await compressPrinciples(llm, principles, 3);

      const tiers = result.axioms.map((a) => a.tier);
      expect(tiers).toContain('core');
      expect(tiers).toContain('domain');
    });

    it('generates canonical forms with native and notated fields', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Be honest about limitations', 5),
      ];

      const result = await compressPrinciples(llm, principles, 3);

      const axiom = result.axioms[0];
      expect(axiom?.canonical).toBeDefined();
      expect(axiom?.canonical.native).toBe('Be honest about limitations');
      expect(axiom?.canonical.notated).toBeDefined();
      expect(typeof axiom?.canonical.notated).toBe('string');
    });

    it('calculates compression metrics', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Be honest about your capabilities', 5),
        createTestPrinciple('p2', 'Maintain clear communication', 4),
      ];

      const result = await compressPrinciples(llm, principles, 3);

      expect(result.metrics.principlesProcessed).toBe(2);
      expect(result.metrics.axiomsCreated).toBe(2);
      expect(result.metrics.compressionRatio).toBeGreaterThan(0);
    });

    it('preserves dimension from principle', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Test', 5, 'boundaries-ethics'),
      ];

      const result = await compressPrinciples(llm, principles, 3);

      expect(result.axioms[0]?.dimension).toBe('boundaries-ethics');
    });

    it('handles empty principles list', async () => {
      const llm = createMockLLM();
      const result = await compressPrinciples(llm, [], 3);

      expect(result.axioms).toEqual([]);
      expect(result.unconverged).toEqual([]);
      expect(result.metrics.axiomsCreated).toBe(0);
    });

    it('handles all principles below threshold', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Low N principle 1', 1),
        createTestPrinciple('p2', 'Low N principle 2', 2),
      ];

      const result = await compressPrinciples(llm, principles, 3);

      expect(result.axioms).toEqual([]);
      expect(result.unconverged).toHaveLength(2);
    });

    it('creates provenance linking back to principles', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Be honest', 5),
      ];

      const result = await compressPrinciples(llm, principles, 3);

      const axiom = result.axioms[0];
      expect(axiom?.derived_from).toBeDefined();
      expect(axiom?.derived_from.principles).toBeDefined();
      expect(axiom?.derived_from.promoted_at).toBeDefined();
    });

    it('uses LLM for notation generation', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Be honest about everything', 5),
      ];

      await compressPrinciples(llm, principles, 3);

      // LLM should have been called for notation generation
      expect(llm.getCallCount()).toBeGreaterThanOrEqual(1);
    });
  });
});
