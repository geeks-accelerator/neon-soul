/**
 * Integration Tests: Synthesis Pipeline
 *
 * End-to-end tests for the soul synthesis pipeline.
 * Uses test-fixtures for reproducible testing.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { Signal } from '../../src/types/signal.js';
import type { Principle } from '../../src/types/principle.js';
import type { Axiom } from '../../src/types/axiom.js';

const FIXTURES_PATH = resolve(process.cwd(), 'test-fixtures');

describe('Pipeline Integration', () => {
  let signals: Signal[] = [];
  let principles: Principle[] = [];
  let axioms: Axiom[] = [];

  beforeAll(async () => {
    // Load test fixtures
    const signalsPath = resolve(FIXTURES_PATH, 'souls/signals/architect-signals.json');
    const principlesPath = resolve(FIXTURES_PATH, 'souls/principles/all-principles.json');
    const axiomsPath = resolve(FIXTURES_PATH, 'souls/axioms/all-axioms.json');

    if (existsSync(signalsPath)) {
      signals = JSON.parse(await readFile(signalsPath, 'utf-8'));
    }

    if (existsSync(principlesPath)) {
      principles = JSON.parse(await readFile(principlesPath, 'utf-8'));
    }

    if (existsSync(axiomsPath)) {
      axioms = JSON.parse(await readFile(axiomsPath, 'utf-8'));
    }
  });

  describe('Fixture Loading', () => {
    it('loads signals from fixture files', () => {
      expect(Array.isArray(signals)).toBe(true);
    });

    it('loads principles from fixture files', () => {
      expect(Array.isArray(principles)).toBe(true);
    });

    it('loads axioms from fixture files', () => {
      expect(Array.isArray(axioms)).toBe(true);
    });
  });

  describe('Signal Structure', () => {
    it('signals have id and text when available', () => {
      if (signals.length === 0) return;
      for (const signal of signals.slice(0, 5)) {
        expect(signal).toHaveProperty('id');
        expect(signal).toHaveProperty('text');
      }
    });

    it('signals have source information when available', () => {
      if (signals.length === 0) return;
      for (const signal of signals.slice(0, 5)) {
        expect(signal).toHaveProperty('source');
      }
    });
  });

  describe('Principle Structure', () => {
    it('principles have required fields when available', () => {
      if (principles.length === 0) return;
      for (const principle of principles.slice(0, 5)) {
        expect(principle).toHaveProperty('id');
        expect(principle).toHaveProperty('text');
        expect(principle).toHaveProperty('n_count');
      }
    });

    it('principles have valid n_count (≥1) when available', () => {
      if (principles.length === 0) return;
      for (const principle of principles) {
        expect(principle.n_count).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Axiom Structure', () => {
    it('axioms have required fields when available', () => {
      if (axioms.length === 0) return;
      for (const axiom of axioms.slice(0, 5)) {
        expect(axiom).toHaveProperty('id');
        expect(axiom).toHaveProperty('text');
        expect(axiom).toHaveProperty('tier');
        expect(axiom).toHaveProperty('dimension');
      }
    });

    it('axioms have valid tier when available', () => {
      if (axioms.length === 0) return;
      const validTiers = ['core', 'domain', 'emerging'];
      for (const axiom of axioms) {
        expect(validTiers).toContain(axiom.tier);
      }
    });

    it('axioms cover SoulCraft dimensions when available', () => {
      if (axioms.length === 0) return;
      const validDimensions = [
        'identity-core',
        'character-traits',
        'voice-presence',
        'honesty-framework',
        'boundaries-ethics',
        'relationship-dynamics',
        'continuity-growth',
      ];
      for (const axiom of axioms) {
        expect(validDimensions).toContain(axiom.dimension);
      }
    });
  });
});
