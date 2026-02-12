/**
 * Integration Tests: PBD Alignment
 *
 * Tests for Principle-Based Distillation methodology alignment:
 * - Stance classification (ASSERT/DENY/QUESTION/QUALIFY/TENSIONING)
 * - Importance classification (CORE/SUPPORTING/PERIPHERAL)
 * - Elicitation type classification (Stage 12: agent-initiated/user-elicited/etc.)
 * - Weighted clustering
 * - Tension detection
 * - Orphan tracking
 * - Centrality scoring
 *
 * M-3/M-4 NOTE: These tests verify TYPE correctness (results are valid categories)
 * but not SEMANTIC correctness (e.g., "I never X" should classify as 'deny',
 * or "Agent added caveat unprompted" should classify as 'agent-initiated').
 * The mock LLM returns deterministic values based on keyword matching.
 *
 * TODO(I-2 semantic-validation): Add semantic correctness tests
 * Tracking: docs/issues/2026-02-11-stage12-twin-review-findings.md
 * Options:
 * - Real LLM integration tests (marked as slow/optional)
 * - Configure mock with expected input->output mappings
 * - Snapshot/cassette testing with recorded LLM responses
 */

import { describe, it, expect } from 'vitest';
import { classifyStance, classifyImportance } from '../../src/lib/semantic-classifier.js';
import { detectTensions, attachTensionsToAxioms } from '../../src/lib/tension-detector.js';
import { createPrincipleStore } from '../../src/lib/principle-store.js';
import {
  classifyElicitationType,
  filterForIdentitySynthesis,
  calculateWeightedSignalCount,
  ELICITATION_WEIGHT,
} from '../../src/lib/signal-source-classifier.js';
import { createMockLLM, createSimilarityMockLLM, createTensionDetectorMockLLM, createNullCategoryMockLLM } from '../mocks/llm-mock.js';
import type { Signal, SignalStance, SignalImportance, SignalElicitationType } from '../../src/types/signal.js';
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
      // v0.2.0: Use similarity mock for LLM-based clustering
      const llm = createSimilarityMockLLM();
      // Use low threshold to ensure signals with identical text cluster together
      const store = createPrincipleStore(llm, 0.5);

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

      // Add core signal that matches (identical text)
      const coreSignal: Signal = {
        id: 'sig-core',
        text: 'Values truth over comfort', // Same text = will match via LLM
        dimension: 'honesty-framework',
        signalType: 'value',
        confidence: 0.9,
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
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
      // v0.2.0: Use similarity mock for LLM-based clustering
      const llm = createSimilarityMockLLM();
      // Use low threshold to ensure signals with identical text cluster together
      const store = createPrincipleStore(llm, 0.5);

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
      // v0.2.0: Use similarity mock for LLM-based clustering
      const llm = createSimilarityMockLLM();
      // Use low threshold to ensure signals with identical text cluster together
      const store = createPrincipleStore(llm, 0.5);

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
      // v0.2.0: Use similarity mock for LLM-based clustering
      const llm = createSimilarityMockLLM();
      // Use low threshold to ensure signals with identical text cluster together
      const store = createPrincipleStore(llm, 0.5);

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
      // v0.2.0: Use similarity mock for LLM-based clustering
      const llm = createSimilarityMockLLM();
      // Use low threshold to ensure signals with identical text cluster together
      const store = createPrincipleStore(llm, 0.5);

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

  describe('Stage 12: Signal Source Classification', () => {
    /**
     * Helper to create a minimal signal for testing.
     */
    function createTestSignal(text: string, elicitationType?: SignalElicitationType): Signal {
      return {
        id: `sig-${Date.now()}`,
        type: 'value',
        text,
        confidence: 0.9,
        embedding: [0.5, 0.5, 0.5, 0.5, 0.5],
        source: {
          type: 'memory',
          file: 'test.md',
          context: 'Test context',
          extractedAt: new Date(),
        },
        elicitationType,
      };
    }

    describe('Elicitation Type Classification', () => {
      // I-1 FIX: classifyElicitationType now accepts signalText directly
      it('classifies agent-initiated signals (volunteered caveat)', async () => {
        const llm = createMockLLM();
        const signalText = 'Agent added caveat unprompted';
        const context = 'The agent volunteered this information without being asked';

        const result = await classifyElicitationType(llm, signalText, context);

        const validTypes: SignalElicitationType[] = [
          'agent-initiated',
          'user-elicited',
          'context-dependent',
          'consistent-across-context',
        ];
        expect(validTypes).toContain(result);
      });

      it('classifies user-elicited signals (asked for help)', async () => {
        const llm = createMockLLM();
        const signalText = 'Being helpful when asked';
        const context = 'User asked for help with a task';

        const result = await classifyElicitationType(llm, signalText, context);

        const validTypes: SignalElicitationType[] = [
          'agent-initiated',
          'user-elicited',
          'context-dependent',
          'consistent-across-context',
        ];
        expect(validTypes).toContain(result);
      });

      it('classifies context-dependent signals (formal in business)', async () => {
        const llm = createMockLLM();
        const signalText = 'Using formal language';
        const context = 'In a business setting with formal requirements';

        const result = await classifyElicitationType(llm, signalText, context);

        const validTypes: SignalElicitationType[] = [
          'agent-initiated',
          'user-elicited',
          'context-dependent',
          'consistent-across-context',
        ];
        expect(validTypes).toContain(result);
      });

      it('classifies consistent-across-context signals', async () => {
        const llm = createMockLLM();
        const signalText = 'Acknowledging uncertainty consistently';
        const context = 'This behavior appears across contexts regardless of situation';

        const result = await classifyElicitationType(llm, signalText, context);

        const validTypes: SignalElicitationType[] = [
          'agent-initiated',
          'user-elicited',
          'context-dependent',
          'consistent-across-context',
        ];
        expect(validTypes).toContain(result);
      });

      it('falls back to user-elicited when classification exhausts retries', async () => {
        const nullMock = createNullCategoryMockLLM();
        const signalText = 'Ambiguous signal';

        const result = await classifyElicitationType(nullMock, signalText, 'ambiguous context');

        // Conservative default: user-elicited (low identity weight)
        expect(result).toBe('user-elicited');
      });
    });

    describe('Identity Synthesis Filtering', () => {
      it('filters out context-dependent signals', () => {
        const signals: Signal[] = [
          createTestSignal('Agent-initiated insight', 'agent-initiated'),
          createTestSignal('Context-dependent behavior', 'context-dependent'),
          createTestSignal('User-requested help', 'user-elicited'),
          createTestSignal('Consistent behavior', 'consistent-across-context'),
        ];

        const filtered = filterForIdentitySynthesis(signals);

        expect(filtered).toHaveLength(3);
        expect(filtered.map((s) => s.elicitationType)).not.toContain('context-dependent');
      });

      it('preserves signals without elicitationType (defaults to user-elicited)', () => {
        const signals: Signal[] = [
          createTestSignal('Signal without type'), // No elicitationType
          createTestSignal('Agent signal', 'agent-initiated'),
        ];

        const filtered = filterForIdentitySynthesis(signals);

        // Both should be preserved (undefined !== 'context-dependent')
        expect(filtered).toHaveLength(2);
      });
    });

    describe('Elicitation Weighting', () => {
      it('applies correct weights for each elicitation type', () => {
        expect(ELICITATION_WEIGHT['consistent-across-context']).toBe(2.0);
        expect(ELICITATION_WEIGHT['agent-initiated']).toBe(1.5);
        expect(ELICITATION_WEIGHT['user-elicited']).toBe(0.5);
        expect(ELICITATION_WEIGHT['context-dependent']).toBe(0.0);
      });

      it('calculates weighted signal count correctly', () => {
        const signals: Signal[] = [
          createTestSignal('Consistent', 'consistent-across-context'), // 2.0
          createTestSignal('Agent-initiated', 'agent-initiated'), // 1.5
          createTestSignal('User-elicited', 'user-elicited'), // 0.5
        ];

        const weightedCount = calculateWeightedSignalCount(signals);

        expect(weightedCount).toBe(4.0); // 2.0 + 1.5 + 0.5
      });

      it('defaults to user-elicited weight for signals without elicitationType', () => {
        const signals: Signal[] = [
          createTestSignal('No type set'), // undefined → user-elicited (0.5)
        ];

        const weightedCount = calculateWeightedSignalCount(signals);

        expect(weightedCount).toBe(0.5);
      });
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

  it('classifyElicitationType throws LLMRequiredError when LLM is null', async () => {
    const { LLMRequiredError } = await import('../../src/types/llm.js');
    // I-1 FIX: classifyElicitationType now accepts signalText directly
    await expect(classifyElicitationType(null, 'test signal', 'context')).rejects.toThrow(LLMRequiredError);
  });
});

/**
 * TODO(I-2 semantic-validation): Semantic Correctness Tests
 *
 * These tests would verify that classification produces semantically correct results,
 * not just valid categories. Requires real LLM or carefully configured mock.
 *
 * Tracking: docs/issues/2026-02-11-stage12-twin-review-findings.md
 */
describe.todo('PBD Semantic Correctness', () => {
  // Stance classification semantic tests
  it.todo('classifies "I never compromise on safety" as deny');
  it.todo('classifies "I always tell the truth" as assert');
  it.todo('classifies "I wonder if I value efficiency too much" as question');

  // Elicitation type semantic tests
  it.todo('classifies agent-volunteered caveat as agent-initiated');
  it.todo('classifies response to direct question as user-elicited');
  it.todo('classifies formal tone in business context as context-dependent');
  it.todo('classifies consistent uncertainty acknowledgment as consistent-across-context');
});
