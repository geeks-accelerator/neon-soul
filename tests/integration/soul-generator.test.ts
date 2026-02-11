/**
 * Integration Tests: Soul Generator
 *
 * Tests for SOUL.md generation with all notation formats.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { generateSoul, formatAxiom } from '../../src/lib/soul-generator.js';
import type { Axiom } from '../../src/types/axiom.js';
import type { Principle } from '../../src/types/principle.js';

const FIXTURES_PATH = resolve(process.cwd(), 'test-fixtures');

describe('Soul Generator', () => {
  let axioms: Axiom[];
  let principles: Principle[];
  let hasData = false;

  beforeAll(async () => {
    const axiomsPath = resolve(FIXTURES_PATH, 'souls/axioms/all-axioms.json');
    const principlesPath = resolve(FIXTURES_PATH, 'souls/principles/all-principles.json');

    if (existsSync(axiomsPath)) {
      axioms = JSON.parse(await readFile(axiomsPath, 'utf-8'));
      hasData = axioms.length > 0;
    } else {
      axioms = [];
    }

    if (existsSync(principlesPath)) {
      principles = JSON.parse(await readFile(principlesPath, 'utf-8'));
    } else {
      principles = [];
    }
  });

  describe('generateSoul', () => {
    it('generates soul with all 7 dimensions', async () => {
      const soul = await generateSoul(axioms, principles);
      expect(soul.byDimension.size).toBe(7);
    });

    it('calculates coverage correctly', async () => {
      const soul = await generateSoul(axioms, principles);
      expect(soul.coverage).toBeGreaterThanOrEqual(0);
      expect(soul.coverage).toBeLessThanOrEqual(1);
    });

    it('includes provenance section by default', async () => {
      const soul = await generateSoul(axioms, principles);
      expect(soul.content).toContain('## Provenance');
    });

    it('includes metrics section by default', async () => {
      const soul = await generateSoul(axioms, principles);
      expect(soul.content).toContain('## Metrics');
    });

    it('generates with custom title', async () => {
      const soul = await generateSoul(axioms, principles, { title: 'Custom Soul' });
      expect(soul.content).toContain('# Custom Soul');
    });

    it('handles empty axioms gracefully', async () => {
      const soul = await generateSoul([], []);
      expect(soul.coverage).toBe(0);
      expect(soul.content).toContain('No axioms emerged');
    });
  });

  describe('formatAxiom', () => {
    const testAxiom: Axiom = {
      id: 'ax_test',
      text: 'Be thorough but not pedantic',
      tier: 'core',
      dimension: 'honesty-framework',
      derived_from: {
        principles: [],
        promoted_at: new Date().toISOString(),
      },
      canonical: {
        native: 'Be thorough but not pedantic',
        notated: '🔍 徹: ¬(pedantic)',
      },
    };

    it('formats in native style', () => {
      const formatted = formatAxiom(testAxiom, 'native');
      expect(formatted).toBe('- Be thorough but not pedantic');
    });

    it('formats in notated style', () => {
      const formatted = formatAxiom(testAxiom, 'notated');
      expect(formatted).toBe('- 🔍 徹: ¬(pedantic)');
    });

    it('falls back to plain text without canonical', () => {
      const simpleAxiom: Axiom = {
        id: 'ax_simple',
        text: 'Simple axiom',
        tier: 'emerging',
        dimension: 'identity-core',
        derived_from: {
          principles: [],
          promoted_at: new Date().toISOString(),
        },
      };
      const formatted = formatAxiom(simpleAxiom, 'notated');
      expect(formatted).toBe('- Simple axiom');
    });
  });
});

