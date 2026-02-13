/**
 * Unit Tests: Compressor
 *
 * Tests for axiom synthesis with LLM-based notation generation.
 */

import { describe, it, expect } from 'vitest';
import {
  compressPrinciples,
  checkGuardrails,
  canPromote,
  getProvenanceDiversity,
} from '../../src/lib/compressor.js';
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

  describe('compressPrinciplesWithCascade', () => {
    it('uses highest threshold (3) when >= 3 axioms qualify', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Principle A', 5), // N>=3
        createTestPrinciple('p2', 'Principle B', 4), // N>=3
        createTestPrinciple('p3', 'Principle C', 3), // N>=3
        createTestPrinciple('p4', 'Principle D', 2), // N<3
      ];

      const { compressPrinciplesWithCascade } = await import(
        '../../src/lib/compressor.js'
      );
      const result = await compressPrinciplesWithCascade(llm, principles);

      expect(result.axioms).toHaveLength(3);
      expect(result.cascade.effectiveThreshold).toBe(3);
      expect(result.cascade.axiomCountByThreshold[3]).toBe(3);
    });

    it('cascades to threshold 2 when < 3 axioms at threshold 3', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Principle A', 4), // N>=3, N>=2
        createTestPrinciple('p2', 'Principle B', 3), // N>=3, N>=2
        createTestPrinciple('p3', 'Principle C', 2), // N>=2 only
        createTestPrinciple('p4', 'Principle D', 2), // N>=2 only
        createTestPrinciple('p5', 'Principle E', 1), // N<2
      ];

      const { compressPrinciplesWithCascade } = await import(
        '../../src/lib/compressor.js'
      );
      const result = await compressPrinciplesWithCascade(llm, principles);

      // At N>=3: only 2 axioms (p1, p2), so cascade to N>=2
      // At N>=2: 4 axioms (p1, p2, p3, p4) >= 3, so use this
      expect(result.axioms).toHaveLength(4);
      expect(result.cascade.effectiveThreshold).toBe(2);
      expect(result.cascade.axiomCountByThreshold[3]).toBe(2);
      expect(result.cascade.axiomCountByThreshold[2]).toBe(4);
    });

    it('cascades to threshold 1 when < 3 axioms at threshold 2', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Principle A', 2), // N>=2
        createTestPrinciple('p2', 'Principle B', 1), // N>=1 only
        createTestPrinciple('p3', 'Principle C', 1), // N>=1 only
      ];

      const { compressPrinciplesWithCascade } = await import(
        '../../src/lib/compressor.js'
      );
      const result = await compressPrinciplesWithCascade(llm, principles);

      // At N>=3: 0 axioms, cascade
      // At N>=2: 1 axiom (p1), < 3, cascade
      // At N>=1: 3 axioms (p1, p2, p3), use this
      expect(result.axioms).toHaveLength(3);
      expect(result.cascade.effectiveThreshold).toBe(1);
      expect(result.cascade.axiomCountByThreshold[3]).toBe(0);
      expect(result.cascade.axiomCountByThreshold[2]).toBe(1);
      expect(result.cascade.axiomCountByThreshold[1]).toBe(3);
    });

    it('returns empty result for empty input (no artificial axioms)', async () => {
      const llm = createMockLLM();
      const principles: Principle[] = [];

      const { compressPrinciplesWithCascade } = await import(
        '../../src/lib/compressor.js'
      );
      const result = await compressPrinciplesWithCascade(llm, principles);

      expect(result.axioms).toHaveLength(0);
      expect(result.cascade.effectiveThreshold).toBe(1);
      expect(result.cascade.axiomCountByThreshold[1]).toBe(0);
    });

    it('assigns tier based on actual N-count, not cascade level', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Core principle', 7), // core tier (N>=5)
        createTestPrinciple('p2', 'Domain principle', 1), // emerging tier (N<3)
        createTestPrinciple('p3', 'Emerging principle', 1), // emerging tier (N<3)
      ];

      const { compressPrinciplesWithCascade } = await import(
        '../../src/lib/compressor.js'
      );
      const result = await compressPrinciplesWithCascade(llm, principles);

      // Cascade falls to N>=1, but tier reflects actual N-count
      expect(result.cascade.effectiveThreshold).toBe(1);

      const corePrinciple = result.axioms.find((a) => a.text === 'Core principle');
      const emergingPrinciple = result.axioms.find(
        (a) => a.text === 'Domain principle'
      );

      expect(corePrinciple?.tier).toBe('core'); // N=7 >= 5
      expect(emergingPrinciple?.tier).toBe('emerging'); // N=1 < 3
    });

    it('includes metrics from underlying compression', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Be honest always', 5),
        createTestPrinciple('p2', 'Stay truthful', 4),
        createTestPrinciple('p3', 'Communicate clearly', 3),
      ];

      const { compressPrinciplesWithCascade } = await import(
        '../../src/lib/compressor.js'
      );
      const result = await compressPrinciplesWithCascade(llm, principles);

      expect(result.metrics.principlesProcessed).toBe(3);
      expect(result.metrics.axiomsCreated).toBe(3);
      expect(result.metrics.compressionRatio).toBeGreaterThan(0);
    });

    it('returns unconverged principles based on effective threshold', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Principle A', 3),
        createTestPrinciple('p2', 'Principle B', 3),
        createTestPrinciple('p3', 'Principle C', 3),
        createTestPrinciple('p4', 'Principle D', 2),
      ];

      const { compressPrinciplesWithCascade } = await import(
        '../../src/lib/compressor.js'
      );
      const result = await compressPrinciplesWithCascade(llm, principles);

      // Uses threshold 3, so p4 (N=2) is unconverged
      expect(result.unconverged).toHaveLength(1);
      expect(result.unconverged[0]?.id).toBe('p4');
    });

    it('includes guardrails in result', async () => {
      const llm = createMockLLM();
      const principles = [
        createTestPrinciple('p1', 'Principle A', 3),
        createTestPrinciple('p2', 'Principle B', 3),
        createTestPrinciple('p3', 'Principle C', 3),
      ];

      const { compressPrinciplesWithCascade } = await import(
        '../../src/lib/compressor.js'
      );
      const result = await compressPrinciplesWithCascade(llm, principles);

      expect(result.guardrails).toBeDefined();
      expect(typeof result.guardrails.expansionWarning).toBe('boolean');
      expect(typeof result.guardrails.cognitiveLoadWarning).toBe('boolean');
      expect(typeof result.guardrails.fallbackWarning).toBe('boolean');
      expect(Array.isArray(result.guardrails.messages)).toBe(true);
    });
  });

  describe('checkGuardrails', () => {
    it('warns when axioms exceed signal count (expansion)', () => {
      const result = checkGuardrails(10, 5, 3);

      expect(result.expansionWarning).toBe(true);
      expect(result.messages.some((m) => m.includes('Expansion instead of compression'))).toBe(true);
    });

    it('no expansion warning when axioms <= signals', () => {
      const result = checkGuardrails(5, 10, 3);

      expect(result.expansionWarning).toBe(false);
    });

    it('warns when axioms exceed cognitive load limit (signals * 0.5)', () => {
      const result = checkGuardrails(10, 10, 3);
      // limit = min(10 * 0.5, 30) = 5, so 10 > 5 triggers warning

      expect(result.cognitiveLoadWarning).toBe(true);
      expect(result.messages.some((m) => m.includes('Exceeds cognitive load'))).toBe(true);
    });

    it('warns when axioms exceed cognitive load cap (30)', () => {
      const result = checkGuardrails(35, 100, 3);
      // limit = min(100 * 0.5, 30) = 30, so 35 > 30 triggers warning

      expect(result.cognitiveLoadWarning).toBe(true);
      expect(result.messages.some((m) => m.includes('30'))).toBe(true);
    });

    it('no cognitive load warning when axioms within limit', () => {
      const result = checkGuardrails(5, 20, 3);
      // limit = min(20 * 0.5, 30) = 10, so 5 <= 10 no warning

      expect(result.cognitiveLoadWarning).toBe(false);
    });

    it('warns when effective threshold falls to 1 (fallback)', () => {
      const result = checkGuardrails(3, 10, 1);

      expect(result.fallbackWarning).toBe(true);
      expect(result.messages.some((m) => m.includes('Fell back to minimum threshold'))).toBe(true);
    });

    it('no fallback warning when threshold is 2 or 3', () => {
      const result2 = checkGuardrails(3, 10, 2);
      const result3 = checkGuardrails(3, 10, 3);

      expect(result2.fallbackWarning).toBe(false);
      expect(result3.fallbackWarning).toBe(false);
    });

    it('can trigger multiple warnings simultaneously', () => {
      // axioms=15, signals=10, threshold=1
      // expansion: 15 > 10 = true
      // cognitive: 15 > min(10*0.5, 30) = 15 > 5 = true
      // fallback: threshold=1 = true
      const result = checkGuardrails(15, 10, 1);

      expect(result.expansionWarning).toBe(true);
      expect(result.cognitiveLoadWarning).toBe(true);
      expect(result.fallbackWarning).toBe(true);
      expect(result.messages).toHaveLength(3);
    });

    it('returns empty messages when no warnings', () => {
      const result = checkGuardrails(3, 20, 3);
      // 3 axioms, 20 signals, threshold 3
      // expansion: 3 <= 20 = false
      // cognitive: 3 <= min(10, 30) = 3 <= 10 = false
      // fallback: threshold=3 != 1 = false

      expect(result.expansionWarning).toBe(false);
      expect(result.cognitiveLoadWarning).toBe(false);
      expect(result.fallbackWarning).toBe(false);
      expect(result.messages).toHaveLength(0);
    });
  });

  describe('canPromote (anti-echo-chamber)', () => {
    // Helper to create principle with provenance and stance
    function createPrincipleWithSignals(
      nCount: number,
      signals: Array<{ provenance?: 'self' | 'curated' | 'external'; stance?: 'assert' | 'question' | 'deny' }>
    ): Principle {
      return {
        id: 'test',
        text: 'Test principle',
        dimension: 'values' as const,
        n_count: nCount,
        strength: 1.0,
        derived_from: {
          signals: signals.map((s, i) => ({
            id: `sig_${i}`,
            similarity: 0.9,
            source: {
              type: 'memory' as const,
              file: 'test.md',
              context: 'test',
              extractedAt: new Date(),
            },
            provenance: s.provenance,
            stance: s.stance,
          })),
          merged_at: new Date().toISOString(),
        },
        history: [],
      };
    }

    it('blocks self-only evidence as echo chamber (N=5)', () => {
      // Acceptance Criteria: Self-only evidence (N=5) → NOT promotable
      // Note: Self-only is caught by diversity check (diversity=1 < min=2)
      // The anti-echo-chamber rule is the conceptual reason, but diversity rule catches it first
      const principle = createPrincipleWithSignals(5, [
        { provenance: 'self', stance: 'assert' },
        { provenance: 'self', stance: 'assert' },
        { provenance: 'self', stance: 'assert' },
        { provenance: 'self', stance: 'assert' },
        { provenance: 'self', stance: 'assert' },
      ]);

      const result = canPromote(principle);

      expect(result.promotable).toBe(false);
      expect(result.diversity).toBe(1);
      expect(result.blocker).toContain('provenance diversity');
    });

    it('blocks self + curated without questioning as echo chamber', () => {
      // Acceptance Criteria: Self + Curated (N=5, 2 types) → NOT promotable
      const principle = createPrincipleWithSignals(5, [
        { provenance: 'self', stance: 'assert' },
        { provenance: 'self', stance: 'assert' },
        { provenance: 'curated', stance: 'assert' },
        { provenance: 'curated', stance: 'assert' },
        { provenance: 'curated', stance: 'assert' },
      ]);

      const result = canPromote(principle);

      expect(result.promotable).toBe(false);
      expect(result.blocker).toContain('Anti-echo-chamber');
    });

    it('allows self + external evidence', () => {
      // Acceptance Criteria: Self + External (N=3, 2 types) → promotable
      const principle = createPrincipleWithSignals(3, [
        { provenance: 'self', stance: 'assert' },
        { provenance: 'self', stance: 'assert' },
        { provenance: 'external', stance: 'assert' },
      ]);

      const result = canPromote(principle);

      expect(result.promotable).toBe(true);
      expect(result.blocker).toBeUndefined();
    });

    it('allows self + curated with questioning stance', () => {
      // Acceptance Criteria: Self + Curated with Questioning (N=3, 2 types) → promotable
      const principle = createPrincipleWithSignals(3, [
        { provenance: 'self', stance: 'assert' },
        { provenance: 'curated', stance: 'question' },
        { provenance: 'curated', stance: 'assert' },
      ]);

      const result = canPromote(principle);

      expect(result.promotable).toBe(true);
    });

    it('allows denying stance as internal challenge', () => {
      const principle = createPrincipleWithSignals(3, [
        { provenance: 'self', stance: 'assert' },
        { provenance: 'curated', stance: 'deny' },
        { provenance: 'curated', stance: 'assert' },
      ]);

      const result = canPromote(principle);

      expect(result.promotable).toBe(true);
    });

    it('blocks insufficient principle count', () => {
      const principle = createPrincipleWithSignals(2, [
        { provenance: 'external', stance: 'assert' },
        { provenance: 'self', stance: 'assert' },
      ]);

      const result = canPromote(principle);

      expect(result.promotable).toBe(false);
      expect(result.blocker).toContain('Insufficient evidence');
    });

    it('blocks insufficient provenance diversity', () => {
      const principle = createPrincipleWithSignals(3, [
        { provenance: 'external', stance: 'assert' },
        { provenance: 'external', stance: 'assert' },
        { provenance: 'external', stance: 'assert' },
      ]);

      const result = canPromote(principle, {
        minPrincipleCount: 3,
        minProvenanceDiversity: 2,
        requireExternalOrQuestioning: true,
      });

      expect(result.promotable).toBe(false);
      expect(result.blocker).toContain('provenance diversity');
    });

    it('explains why not promotable in blocker', () => {
      // Acceptance Criteria: promotionBlocker explains why not promotable
      const principle = createPrincipleWithSignals(1, [
        { provenance: 'self', stance: 'assert' },
      ]);

      const result = canPromote(principle);

      expect(result.promotable).toBe(false);
      expect(result.blocker).toBeDefined();
      expect(typeof result.blocker).toBe('string');
    });
  });

  describe('getProvenanceDiversity', () => {
    it('counts distinct provenance types', () => {
      const principle: Principle = {
        id: 'test',
        text: 'Test',
        dimension: 'values',
        n_count: 3,
        strength: 1.0,
        derived_from: {
          signals: [
            { id: 's1', similarity: 0.9, source: {} as any, provenance: 'self' },
            { id: 's2', similarity: 0.9, source: {} as any, provenance: 'curated' },
            { id: 's3', similarity: 0.9, source: {} as any, provenance: 'external' },
          ],
          merged_at: new Date().toISOString(),
        },
        history: [],
      };

      const diversity = getProvenanceDiversity(principle);

      expect(diversity).toBe(3);
    });

    it('returns 0 for no provenance', () => {
      const principle: Principle = {
        id: 'test',
        text: 'Test',
        dimension: 'values',
        n_count: 3,
        strength: 1.0,
        derived_from: {
          signals: [
            { id: 's1', similarity: 0.9, source: {} as any },
            { id: 's2', similarity: 0.9, source: {} as any },
          ],
          merged_at: new Date().toISOString(),
        },
        history: [],
      };

      const diversity = getProvenanceDiversity(principle);

      expect(diversity).toBe(0);
    });
  });
});
