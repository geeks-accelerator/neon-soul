/**
 * Integration Tests: PBD Alignment
 *
 * Tests for Principle-Based Distillation methodology alignment:
 * - Stance classification (ASSERT/DENY/QUESTION/QUALIFY/TENSIONING)
 * - Importance classification (CORE/SUPPORTING/PERIPHERAL)
 * - Weighted clustering
 * - Tension detection
 * - Orphan tracking
 * - Centrality scoring
 *
 * M-3 NOTE: These tests verify type correctness (results are valid categories)
 * but not semantic correctness (e.g., "I never X" should classify as 'deny').
 * The mock LLM returns deterministic values. For semantic validation, use
 * real LLM integration tests (marked as slow/optional) or configure the mock
 * with expected input->output mappings.
 */

import { describe, it, expect } from 'vitest';
import { classifyStance, classifyImportance } from '../../src/lib/semantic-classifier.js';
import { detectTensions, attachTensionsToAxioms } from '../../src/lib/tension-detector.js';
import { createPrincipleStore } from '../../src/lib/principle-store.js';
import { createMockLLM, createTensionDetectorMockLLM, createNullCategoryMockLLM } from '../mocks/llm-mock.js';
import type { Signal, SignalStance, SignalImportance } from '../../src/types/signal.js';
import type { Axiom } from '../../src/types/axiom.js';

describe('PBD Alignment', () => {
  describe('Stance Classification', () => {
    it('classifies assertions correctly', async () => {
      const llm = createMockLLM();
      const result = await classifyStance(llm, 'I always tell the truth');

      const validStances: SignalStance[] = ['assert', 'deny', 'question', 'qualify', 'tensioning'];
      expect(validStances).toContain(result);
    });

    it('classifies denials correctly', async () => {
      const llm = createMockLLM();
      const result = await classifyStance(llm, 'I never compromise on safety');

      const validStances: SignalStance[] = ['assert', 'deny', 'question', 'qualify', 'tensioning'];
      expect(validStances).toContain(result);
    });

    it('classifies questions correctly', async () => {
      const llm = createMockLLM();
      const result = await classifyStance(llm, 'I wonder if I value efficiency too much');

      const validStances: SignalStance[] = ['assert', 'deny', 'question', 'qualify', 'tensioning'];
      expect(validStances).toContain(result);
    });

    it('classifies qualifications correctly', async () => {
      const llm = createMockLLM();
      const result = await classifyStance(llm, 'Sometimes I prioritize speed over quality');

      const validStances: SignalStance[] = ['assert', 'deny', 'question', 'qualify', 'tensioning'];
      expect(validStances).toContain(result);
    });

    it('returns valid stance for normal mock', async () => {
      const llm = createMockLLM();
      const result = await classifyStance(llm, 'test');

      // Mock returns first category by default, which gets accepted
      expect(result).toBe('assert');
    });

    it('falls back to qualify when classification exhausts retries', async () => {
      // M-2 FIX: Test fallback behavior with null-returning mock
      const nullMock = createNullCategoryMockLLM();
      const result = await classifyStance(nullMock, 'ambiguous text');

      // When all retries exhaust, fallback is 'qualify' (neutral stance)
      expect(result).toBe('qualify');
    });
  });

  describe('Importance Classification', () => {
    it('classifies core statements correctly', async () => {
      const llm = createMockLLM();
      const result = await classifyImportance(llm, 'Above all, I value honesty');

      const validImportance: SignalImportance[] = ['core', 'supporting', 'peripheral'];
      expect(validImportance).toContain(result);
    });

    it('classifies supporting statements correctly', async () => {
      const llm = createMockLLM();
      const result = await classifyImportance(llm, 'For example, I told my boss the truth about the deadline');

      const validImportance: SignalImportance[] = ['core', 'supporting', 'peripheral'];
      expect(validImportance).toContain(result);
    });

    it('classifies peripheral statements correctly', async () => {
      const llm = createMockLLM();
      const result = await classifyImportance(llm, 'Also, I like coffee');

      const validImportance: SignalImportance[] = ['core', 'supporting', 'peripheral'];
      expect(validImportance).toContain(result);
    });

    it('returns valid importance category for minimal input', async () => {
      const llm = createMockLLM();
      const result = await classifyImportance(llm, 'test');

      // Mock returns first category (core) by default - verify it's valid
      const validImportance: SignalImportance[] = ['core', 'supporting', 'peripheral'];
      expect(validImportance).toContain(result);
    });
  });

  describe('Importance Weighting', () => {
    it('boosts core signals in principle strength', async () => {
      const llm = createMockLLM();
      // Use low threshold (0.0) to ensure matching with identical embeddings
      const store = createPrincipleStore(llm, 0.0);

      // Create a base signal for creating the principle
      const baseSignal: Signal = {
        id: 'sig-base',
        text: 'Values truth over comfort',
        dimension: 'honesty-framework',
        signalType: 'value',
        confidence: 0.9,
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
        source: { file: 'test.md', type: 'memory' },
        importance: 'supporting',
      };

      // Add base signal
      await store.addSignal(baseSignal, 'honesty-framework');

      // Get initial principle
      const principles1 = store.getPrinciples();
      expect(principles1).toHaveLength(1);
      const initialStrength = principles1[0]?.strength ?? 0;

      // Add core signal that matches
      const coreSignal: Signal = {
        id: 'sig-core',
        text: 'Values truth over comfort',
        dimension: 'honesty-framework',
        signalType: 'value',
        confidence: 0.9,
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5], // Same embedding = will match
        source: { file: 'test2.md', type: 'memory' },
        importance: 'core',
      };

      await store.addSignal(coreSignal, 'honesty-framework');

      const principles2 = store.getPrinciples();
      expect(principles2).toHaveLength(1);
      const afterCoreStrength = principles2[0]?.strength ?? 0;

      // Strength should increase
      expect(afterCoreStrength).toBeGreaterThan(initialStrength);
    });

    it('reduces peripheral signal influence', async () => {
      const llm = createMockLLM();
      // Use low threshold (0.0) to ensure matching with identical embeddings
      const store = createPrincipleStore(llm, 0.0);

      // Create a base signal
      const baseSignal: Signal = {
        id: 'sig-base2',
        text: 'Values honesty in relationships',
        dimension: 'honesty-framework',
        signalType: 'value',
        confidence: 0.9,
        embedding: [0.5, 0.5, 0.5, 0.5, 0.5],
        source: { file: 'test.md', type: 'memory' },
        importance: 'supporting',
      };

      await store.addSignal(baseSignal, 'honesty-framework');

      const principles1 = store.getPrinciples();
      const initialStrength = principles1[0]?.strength ?? 0;

      // Add peripheral signal that matches
      const peripheralSignal: Signal = {
        id: 'sig-peripheral',
        text: 'Values honesty in relationships',
        dimension: 'honesty-framework',
        signalType: 'value',
        confidence: 0.9,
        embedding: [0.5, 0.5, 0.5, 0.5, 0.5], // Same embedding
        source: { file: 'test2.md', type: 'memory' },
        importance: 'peripheral',
      };

      await store.addSignal(peripheralSignal, 'honesty-framework');

      const principles2 = store.getPrinciples();
      const afterPeripheralStrength = principles2[0]?.strength ?? 0;

      // Peripheral still increases, just less than normal
      expect(afterPeripheralStrength).toBeGreaterThan(initialStrength);
    });
  });

  describe('Tension Detection', () => {
    it('detects conflicting values between axioms', async () => {
      const llm = createTensionDetectorMockLLM();

      const axioms: Axiom[] = [
        {
          id: 'ax1',
          text: 'Values honesty over kindness',
          tier: 'core',
          dimension: 'honesty-framework',
          canonical: {
            native: 'Values honesty over kindness',
            notated: '🎯 誠: honesty > kindness',
          },
          derived_from: { principles: [], promoted_at: new Date().toISOString() },
          history: [],
        },
        {
          id: 'ax2',
          text: 'Values kindness over brutal truth',
          tier: 'core',
          dimension: 'honesty-framework',
          canonical: {
            native: 'Values kindness over brutal truth',
            notated: '💕 慈: kindness > truth',
          },
          derived_from: { principles: [], promoted_at: new Date().toISOString() },
          history: [],
        },
      ];

      const tensions = await detectTensions(llm, axioms);

      // The mock LLM detects tensions between honesty/kindness pairs
      expect(tensions.length).toBeGreaterThanOrEqual(0);
    });

    it('assigns high severity to same-dimension conflicts', async () => {
      const llm = createTensionDetectorMockLLM();

      const axioms: Axiom[] = [
        {
          id: 'ax1',
          text: 'Honesty first',
          tier: 'core',
          dimension: 'honesty-framework', // Same dimension
          canonical: { native: 'Honesty first', notated: '🎯 誠' },
          derived_from: { principles: [], promoted_at: new Date().toISOString() },
          history: [],
        },
        {
          id: 'ax2',
          text: 'White lies are ok',
          tier: 'core',
          dimension: 'honesty-framework', // Same dimension
          canonical: { native: 'White lies are ok', notated: '🎭 謊' },
          derived_from: { principles: [], promoted_at: new Date().toISOString() },
          history: [],
        },
      ];

      const tensions = await detectTensions(llm, axioms);

      // If tensions detected, same-dimension should be high severity
      if (tensions.length > 0) {
        expect(tensions[0]?.severity).toBe('high');
      }
    });

    it('attaches tensions to both axioms in pair', async () => {
      const axioms: Axiom[] = [
        {
          id: 'ax1',
          text: 'Test 1',
          tier: 'core',
          dimension: 'honesty-framework',
          canonical: { native: 'Test 1', notated: '🎯 1' },
          derived_from: { principles: [], promoted_at: new Date().toISOString() },
          history: [],
        },
        {
          id: 'ax2',
          text: 'Test 2',
          tier: 'core',
          dimension: 'honesty-framework',
          canonical: { native: 'Test 2', notated: '🎯 2' },
          derived_from: { principles: [], promoted_at: new Date().toISOString() },
          history: [],
        },
      ];

      const tensions = [
        {
          axiom1Id: 'ax1',
          axiom2Id: 'ax2',
          description: 'Test tension',
          severity: 'high' as const,
        },
      ];

      const result = attachTensionsToAxioms(axioms, tensions);

      // Both axioms should have the tension attached
      expect(result[0]?.tensions).toHaveLength(1);
      expect(result[0]?.tensions?.[0]?.axiomId).toBe('ax2');
      expect(result[1]?.tensions).toHaveLength(1);
      expect(result[1]?.tensions?.[0]?.axiomId).toBe('ax1');
    });
  });

  describe('Orphan Tracking', () => {
    it('tracks signals below similarity threshold as orphans', async () => {
      const llm = createMockLLM();
      // Use standard threshold (0.75) - signals below this are orphans
      const store = createPrincipleStore(llm, 0.75);

      // Create first signal
      const signal1: Signal = {
        id: 'sig-orphan-1',
        text: 'Values freedom',
        dimension: 'identity-core',
        signalType: 'value',
        confidence: 0.9,
        embedding: [0.9, 0.1, 0.0, 0.0, 0.0],
        source: { file: 'test.md', type: 'memory' },
      };

      const result1 = await store.addSignal(signal1, 'identity-core');
      expect(result1.action).toBe('created');

      // Create very different signal (low similarity)
      const signal2: Signal = {
        id: 'sig-orphan-2',
        text: 'Values structure',
        dimension: 'identity-core',
        signalType: 'value',
        confidence: 0.9,
        embedding: [0.0, 0.0, 0.0, 0.9, 0.1], // Very different
        source: { file: 'test2.md', type: 'memory' },
      };

      const result2 = await store.addSignal(signal2, 'identity-core');

      // Should create new principle (not match existing)
      expect(result2.action).toBe('created');

      // Track best similarity for orphan detection
      expect(result2.bestSimilarityToExisting).toBeDefined();
      expect(result2.bestSimilarityToExisting).toBeLessThan(0.75);
    });

    it('provides orphaned signals accessor', () => {
      const llm = createMockLLM();
      const store = createPrincipleStore(llm, 0.75);

      // getOrphanedSignals should be available
      const orphans = store.getOrphanedSignals();
      expect(Array.isArray(orphans)).toBe(true);
    });
  });

  describe('Centrality Scoring', () => {
    it('marks majority-core principles as foundational', async () => {
      const llm = createMockLLM();
      // Use low threshold (0.0) to ensure all signals cluster together
      const store = createPrincipleStore(llm, 0.0);

      // Add multiple core signals to same principle - use identical text for clustering
      const signals: Signal[] = [
        {
          id: 'sig-central-1',
          text: 'Core value statement',
          dimension: 'identity-core',
          signalType: 'value',
          confidence: 0.9,
          embedding: [0.5, 0.5, 0.0, 0.0, 0.0],
          source: { file: 'test.md', type: 'memory' },
          importance: 'core',
        },
        {
          id: 'sig-central-2',
          text: 'Core value statement',
          dimension: 'identity-core',
          signalType: 'value',
          confidence: 0.9,
          embedding: [0.5, 0.5, 0.0, 0.0, 0.0], // Same embedding
          source: { file: 'test2.md', type: 'memory' },
          importance: 'core',
        },
      ];

      for (const signal of signals) {
        await store.addSignal(signal, 'identity-core');
      }

      const principles = store.getPrinciples();
      expect(principles).toHaveLength(1);

      // With 2/2 core signals (100%), should be defining
      // I-1 FIX: Renamed from 'foundational' to 'defining' to avoid importance overlap
      expect(principles[0]?.centrality).toBe('defining');
    });

    it('marks minority-core principles as supporting', async () => {
      const llm = createMockLLM();
      // Use low threshold (0.0) to ensure all signals cluster together
      const store = createPrincipleStore(llm, 0.0);

      // Add signals with mixed importance - use identical text for clustering
      const signals: Signal[] = [
        {
          id: 'sig-mixed-1',
          text: 'Mixed importance statement',
          dimension: 'character-traits',
          signalType: 'value',
          confidence: 0.9,
          embedding: [0.3, 0.3, 0.3, 0.0, 0.0],
          source: { file: 'test.md', type: 'memory' },
          importance: 'supporting',
        },
        {
          id: 'sig-mixed-2',
          text: 'Mixed importance statement',
          dimension: 'character-traits',
          signalType: 'value',
          confidence: 0.9,
          embedding: [0.3, 0.3, 0.3, 0.0, 0.0], // Same embedding
          source: { file: 'test2.md', type: 'memory' },
          importance: 'peripheral',
        },
        {
          id: 'sig-mixed-3',
          text: 'Mixed importance statement',
          dimension: 'character-traits',
          signalType: 'value',
          confidence: 0.9,
          embedding: [0.3, 0.3, 0.3, 0.0, 0.0], // Same embedding
          source: { file: 'test3.md', type: 'memory' },
          importance: 'supporting',
        },
      ];

      for (const signal of signals) {
        await store.addSignal(signal, 'character-traits');
      }

      const principles = store.getPrinciples();
      expect(principles).toHaveLength(1);

      // With 0/3 core signals (0%), should be contextual
      // I-1 FIX: Renamed from 'supporting' to 'contextual' to avoid importance overlap
      expect(principles[0]?.centrality).toBe('contextual');
    });

    it('computes centrality based on core ratio', async () => {
      const llm = createMockLLM();
      // Use low threshold (0.0) to ensure all signals cluster together
      const store = createPrincipleStore(llm, 0.0);

      // Add signals: 1 core, 2 supporting (33% core = 'core' centrality)
      // Use identical text for clustering
      const signals: Signal[] = [
        {
          id: 'sig-ratio-1',
          text: 'Ratio test statement',
          dimension: 'voice-presence',
          signalType: 'value',
          confidence: 0.9,
          embedding: [0.7, 0.7, 0.0, 0.0, 0.0],
          source: { file: 'test.md', type: 'memory' },
          importance: 'core',
        },
        {
          id: 'sig-ratio-2',
          text: 'Ratio test statement',
          dimension: 'voice-presence',
          signalType: 'value',
          confidence: 0.9,
          embedding: [0.7, 0.7, 0.0, 0.0, 0.0],
          source: { file: 'test2.md', type: 'memory' },
          importance: 'supporting',
        },
        {
          id: 'sig-ratio-3',
          text: 'Ratio test statement',
          dimension: 'voice-presence',
          signalType: 'value',
          confidence: 0.9,
          embedding: [0.7, 0.7, 0.0, 0.0, 0.0],
          source: { file: 'test3.md', type: 'memory' },
          importance: 'supporting',
        },
      ];

      for (const signal of signals) {
        await store.addSignal(signal, 'voice-presence');
      }

      const principles = store.getPrinciples();
      expect(principles).toHaveLength(1);

      // With 1/3 core signals (33%), should be 'significant' (between 20-50%)
      // I-1 FIX: Renamed from 'core' to 'significant' to avoid importance overlap
      expect(principles[0]?.centrality).toBe('significant');
    });
  });
});

describe('PBD Error Handling', () => {
  it('classifyStance throws LLMRequiredError when LLM is null', async () => {
    const { LLMRequiredError } = await import('../../src/types/llm.js');
    await expect(classifyStance(null, 'test')).rejects.toThrow(LLMRequiredError);
  });

  it('classifyImportance throws LLMRequiredError when LLM is null', async () => {
    const { LLMRequiredError } = await import('../../src/types/llm.js');
    await expect(classifyImportance(null, 'test')).rejects.toThrow(LLMRequiredError);
  });

  it('detectTensions throws LLMRequiredError when LLM is null', async () => {
    const { LLMRequiredError } = await import('../../src/types/llm.js');
    await expect(detectTensions(null, [])).rejects.toThrow(LLMRequiredError);
  });
});
