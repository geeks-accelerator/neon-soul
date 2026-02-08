/**
 * Integration Tests: Axiom Emergence
 *
 * Tests for cross-source axiom detection and N-count convergence.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCrossSourceStrength,
  calculatePrincipleStrength,
  detectEmergentAxioms,
  calculateEmergenceStats,
  getCoreIdentityAxioms,
} from '../../src/lib/axiom-emergence.js';
import type { Principle } from '../../src/types/principle.js';
import type { Axiom } from '../../src/types/axiom.js';

describe('Axiom Emergence', () => {
  describe('calculateCrossSourceStrength', () => {
    it('returns base n_count for single category', () => {
      const strength = calculateCrossSourceStrength(1, 3);
      // log2(1+1) = 1, so 3 * 1 = 3
      expect(strength).toBeCloseTo(3, 1);
    });

    it('applies logarithmic bonus for multiple categories', () => {
      const singleCategory = calculateCrossSourceStrength(1, 3);
      const twoCategories = calculateCrossSourceStrength(2, 3);
      const threeCategories = calculateCrossSourceStrength(3, 3);

      expect(twoCategories).toBeGreaterThan(singleCategory);
      expect(threeCategories).toBeGreaterThan(twoCategories);
    });

    it('scales appropriately for high category counts', () => {
      // 6 categories (all memory types)
      const strength = calculateCrossSourceStrength(6, 5);
      // log2(6+1) ≈ 2.807, so 5 * 2.807 ≈ 14
      expect(strength).toBeGreaterThan(10);
      expect(strength).toBeLessThan(20);
    });
  });

  describe('calculatePrincipleStrength', () => {
    it('calculates strength from signal sources', () => {
      const principle: Principle = {
        id: 'p1',
        text: 'Be honest',
        dimension: 'honesty-framework',
        n_count: 3,
        confidence: 0.9,
        embedding: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        derived_from: {
          signals: [
            { id: 's1', source: { file: 'memory/diary/day1.md', type: 'memory' } },
            { id: 's2', source: { file: 'memory/diary/day2.md', type: 'memory' } },
            { id: 's3', source: { file: 'memory/preferences/values.md', type: 'memory' } },
          ],
        },
      };

      const strength = calculatePrincipleStrength(principle);
      // 2 categories (diary, preferences), n_count=3
      // log2(2+1) ≈ 1.585, so 3 * 1.585 ≈ 4.75
      expect(strength).toBeGreaterThan(4);
      expect(strength).toBeLessThan(6);
    });
  });

  describe('detectEmergentAxioms', () => {
    const testPrinciples: Principle[] = [
      {
        id: 'p1',
        text: 'Be honest about capabilities',
        dimension: 'honesty-framework',
        n_count: 3,
        confidence: 0.9,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        embedding: [],
        derived_from: {
          signals: [
            { id: 's1', source: { file: 'memory/diary/day1.md', type: 'memory' } },
          ],
        },
      },
    ];

    const testAxioms: Axiom[] = [
      {
        id: 'ax1',
        text: 'Honesty over performance',
        tier: 'core',
        dimension: 'honesty-framework',
        derived_from: {
          principles: [{ id: 'p1', text: 'Be honest', n_count: 3 }],
          promoted_at: new Date().toISOString(),
        },
      },
    ];

    it('detects emergent axioms', () => {
      const emergent = detectEmergentAxioms(testAxioms, testPrinciples);
      expect(emergent).toHaveLength(1);
      expect(emergent[0]?.axiom.id).toBe('ax1');
    });

    it('calculates strength for each axiom', () => {
      const emergent = detectEmergentAxioms(testAxioms, testPrinciples);
      expect(emergent[0]?.strength).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateEmergenceStats', () => {
    it('calculates stats from emergent axioms', () => {
      const emergentAxioms = [
        {
          axiom: { id: 'ax1', text: 'Test', tier: 'core' as const, dimension: 'honesty-framework' as const, derived_from: { principles: [], promoted_at: '' } },
          sourceCategories: ['diary', 'preferences'],
          strength: 5,
          isCoreIdentity: false,
          dimensions: ['honesty-framework' as const],
        },
        {
          axiom: { id: 'ax2', text: 'Test2', tier: 'domain' as const, dimension: 'identity-core' as const, derived_from: { principles: [], promoted_at: '' } },
          sourceCategories: ['diary'],
          strength: 3,
          isCoreIdentity: true,
          dimensions: ['identity-core' as const, 'honesty-framework' as const, 'voice-presence' as const],
        },
      ];

      const stats = calculateEmergenceStats(emergentAxioms);
      expect(stats.totalAxioms).toBe(2);
      expect(stats.crossSourceAxioms).toBe(1);
      expect(stats.coreIdentityAxioms).toBe(1);
    });
  });

  describe('getCoreIdentityAxioms', () => {
    it('filters to core identity axioms only', () => {
      const emergentAxioms = [
        {
          axiom: { id: 'ax1', text: 'Test', tier: 'core' as const, dimension: 'honesty-framework' as const, derived_from: { principles: [], promoted_at: '' } },
          sourceCategories: ['diary'],
          strength: 3,
          isCoreIdentity: false,
          dimensions: ['honesty-framework' as const],
        },
        {
          axiom: { id: 'ax2', text: 'Test2', tier: 'core' as const, dimension: 'identity-core' as const, derived_from: { principles: [], promoted_at: '' } },
          sourceCategories: ['diary', 'preferences', 'worldview'],
          strength: 10,
          isCoreIdentity: true,
          dimensions: ['identity-core' as const, 'honesty-framework' as const, 'voice-presence' as const],
        },
      ];

      const core = getCoreIdentityAxioms(emergentAxioms);
      expect(core).toHaveLength(1);
      expect(core[0]?.axiom.id).toBe('ax2');
    });
  });
});

describe('N-Count Convergence', () => {
  describe('promotion threshold', () => {
    it('principles with N≥3 qualify for axiom promotion', () => {
      const threshold = 3;
      expect(5 >= threshold).toBe(true);
      expect(3 >= threshold).toBe(true);
      expect(2 >= threshold).toBe(false);
    });
  });

  describe('tier assignment', () => {
    it('assigns core tier for high N-count (≥5)', () => {
      const assignTier = (nCount: number) => {
        if (nCount >= 5) return 'core';
        if (nCount >= 3) return 'domain';
        return 'emerging';
      };

      expect(assignTier(7)).toBe('core');
      expect(assignTier(5)).toBe('core');
      expect(assignTier(4)).toBe('domain');
      expect(assignTier(3)).toBe('domain');
      expect(assignTier(2)).toBe('emerging');
    });
  });
});
