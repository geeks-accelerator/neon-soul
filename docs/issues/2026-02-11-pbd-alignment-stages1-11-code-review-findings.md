# PBD Alignment Stages 1-11 Code Review Findings

**Date**: 2026-02-11
**Status**: Resolved
**Priority**: High
**Plan**: [docs/plans/2026-02-10-pbd-alignment.md](../plans/2026-02-10-pbd-alignment.md)

---

## Summary

External code review (N=2: Codex + Gemini) of the PBD alignment implementation (Stages 1-11) identified 1 critical bug, 5 important issues, and 4 minor improvements. All N=1 items have been manually verified to establish N=2 consensus.

---

## Source Reviews

- [2026-02-11-pbd-alignment-stages1-11-codex.md](../reviews/2026-02-11-pbd-alignment-stages1-11-codex.md)
- [2026-02-11-pbd-alignment-stages1-11-gemini.md](../reviews/2026-02-11-pbd-alignment-stages1-11-gemini.md)
- Scout context: `output/context/2026-02-11-pbd-alignment-stages1-11-context.md`

---

## Findings

### Critical

#### C-1: BATCH_SIZE Environment Variable Has No Lower Bound

**File**: `src/lib/signal-extractor.ts:105`
**Consensus**: N=2 (Codex + Manual verification)

**Issue**: `BATCH_SIZE` from `NEON_SOUL_LLM_CONCURRENCY` env var has no lower bound validation. Values of 0, negative, or NaN cause infinite loops in the `for (i += BATCH_SIZE)` loops.

```typescript
// Current (line 105)
const BATCH_SIZE = parseInt(process.env['NEON_SOUL_LLM_CONCURRENCY'] ?? '10', 10);

// Problem: parseInt('') returns NaN, parseInt('0') returns 0, parseInt('-5') returns -5
// All cause infinite loops in batched processing at lines 168 and 189
```

**Fix**:
```typescript
const rawBatchSize = parseInt(process.env['NEON_SOUL_LLM_CONCURRENCY'] ?? '10', 10);
const BATCH_SIZE = Number.isNaN(rawBatchSize) || rawBatchSize < 1 ? 10 : rawBatchSize;
```

---

### Important

#### I-1: STANCE_CATEGORIES Omits 'tensioning'

**File**: `src/lib/semantic-classifier.ts:353`
**Consensus**: N=2 (Codex + Gemini)

**Issue**: `STANCE_CATEGORIES` array omits `'tensioning'` despite `SignalStance` type including it. The LLM can never classify a signal as 'tensioning' during extraction.

```typescript
// Current (line 353)
const STANCE_CATEGORIES = ['assert', 'deny', 'question', 'qualify'] as const;

// But SignalStance type includes: 'assert' | 'deny' | 'question' | 'qualify' | 'tensioning'
```

**Fix**: Either:
1. Add `'tensioning'` to `STANCE_CATEGORIES` and update prompt definitions
2. Document that 'tensioning' is derived post-hoc (during tension detection) rather than classified during extraction

---

#### I-2: Insufficient Prompt Injection Sanitization

**File**: `src/lib/semantic-classifier.ts:47-50`
**Consensus**: N=2 (Codex + Gemini)

**Issue**: `sanitizeForPrompt` only escapes `<` and `>` characters, which is insufficient for broader prompt injection attacks.

```typescript
// Current
export function sanitizeForPrompt(text: string): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

**Fix**: Strengthen with delimiter-based separation and instruction reinforcement:
```typescript
export function sanitizeForPrompt(text: string): string {
  // Escape angle brackets
  let sanitized = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Truncate to prevent context overflow attacks
  if (sanitized.length > 1000) {
    sanitized = sanitized.slice(0, 1000) + '...';
  }
  return sanitized;
}
```

Additionally, prompts should reinforce LLM constraints at the end (already done in most classifiers).

---

#### I-3: processedSignalIds Not Used in addSignal()

**File**: `src/lib/principle-store.ts:140, 153+`
**Consensus**: N=2 (Codex + Manual verification)

**Issue**: `processedSignalIds` Set is declared (line 140) but never checked in `addSignal()` method. Only `addGeneralizedSignal()` uses it. Duplicate signals can inflate n_count and centrality when using the non-generalized path.

```typescript
// Line 140: Set declared
const processedSignalIds = new Set<string>();

// addSignal() (lines 153-327) never checks processedSignalIds
// Only addGeneralizedSignal() uses it (lines 343, 396, 457, 512)
```

**Fix**: Add deduplication check to `addSignal()`:
```typescript
async function addSignal(signal: Signal, dimension?: SoulCraftDimension): Promise<AddSignalResult> {
  // Deduplicate: skip already-processed signals
  if (processedSignalIds.has(signal.id)) {
    logger.debug(`[addSignal] Skipping duplicate signal ${signal.id}`);
    return { action: 'skipped', principleId: '', similarity: 0, bestSimilarityToExisting: 0 };
  }

  // ... existing logic ...

  // Add to processed set after successful completion
  processedSignalIds.add(signal.id);
}
```

---

#### I-4: Tension Detection Threshold Drops Valid Short Responses

**File**: `src/lib/tension-detector.ts:79`
**Consensus**: N=2 (Codex + Manual verification)

**Issue**: `checkTensionPair` treats any LLM reply ≤10 characters as "no tension". Short but valid affirmative outputs like "conflict", "yes", or "tension" are dropped, causing false negatives.

```typescript
// Current logic
if (text === 'none' || text.length <= 10) {
  return null;
}
// "conflict" (8 chars), "yes" (3 chars), "tension" (7 chars) all dropped
```

**Fix**: Use semantic matching instead of character count:
```typescript
// Check if no tension detected
const noTensionIndicators = ['none', 'no tension', 'no conflict', 'compatible', 'aligned'];
if (noTensionIndicators.some(indicator => text.includes(indicator))) {
  return null;
}

// Very short responses that aren't explicit "no" should be treated as potential tensions
// Let the LLM's actual response be preserved if it contains tension-related content
```

---

#### I-5: attachTensionsToAxioms Clears Existing Tensions

**File**: `src/lib/tension-detector.ts:175-178`
**Consensus**: N=2 (Codex + Manual verification)

**Issue**: `attachTensionsToAxioms` unconditionally clears `axiom.tensions` for every axiom before attaching new tensions. If called on axioms that already have tensions populated, existing tensions are lost.

```typescript
// Line 176-178: Clears all existing tensions
for (const axiom of axioms) {
  axiom.tensions = [];  // Overwrites any existing tensions
}
```

**Fix**: Either merge tensions or document the clearing behavior:
```typescript
// Option A: Merge (preserve existing)
for (const axiom of axioms) {
  if (!axiom.tensions) {
    axiom.tensions = [];
  }
}

// Option B: Document clearing behavior in JSDoc
/**
 * Attach detected tensions to their respective axioms.
 * WARNING: Clears any existing tensions before attaching new ones.
 */
```

---

### Minor

#### M-1: Undocumented Magic Numbers for Weights and Thresholds

**File**: `src/lib/principle-store.ts:19-30`
**Consensus**: N=2 (Gemini + Manual verification)

**Issue**: Critical weight values (1.5/1.0/0.5) and thresholds (0.5/0.2) lack documented rationale.

**Fix**: Add code comments:
```typescript
/**
 * Importance weights for signal contribution to principle strength.
 * Values derived from PBD methodology:
 * - Core signals (fundamental beliefs) get 1.5x weight
 * - Supporting signals (evidence/examples) get 1.0x weight
 * - Peripheral signals (tangential mentions) get 0.5x weight
 */
const IMPORTANCE_WEIGHT: Record<SignalImportance, number> = { ... };
```

---

#### M-2: Default Fallback to 'assert' May Introduce Bias

**File**: `src/lib/semantic-classifier.ts:427`
**Consensus**: N=2 (Gemini + Manual verification)

**Issue**: When classification retries are exhausted, `classifyStance` defaults to `'assert'`, which could introduce systematic bias if errors occur frequently.

**Fix**: Consider a more neutral fallback or make failures explicit:
```typescript
// Option A: More neutral fallback
return 'qualify'; // Conditional stance, less assertive

// Option B: Return null and handle in calling code
return null; // Forces explicit handling
```

---

#### M-3: Test Assertions Verify Types But Not Semantics

**File**: `tests/integration/pbd-alignment.test.ts:23-53`
**Consensus**: N=2 (Gemini + Manual verification)

**Issue**: Tests verify that results are valid categories, not that classification is semantically correct.

```typescript
// Current: Always passes for any valid stance
expect(validStances).toContain(result);
```

**Fix**: Configure mock to return expected categories for specific inputs, or add integration tests with real LLM marked as slow/optional.

---

#### M-4: Silent Default for Empty Signals in Centrality Calculation

**File**: `src/lib/principle-store.ts:37-38`
**Consensus**: N=2 (Gemini + Manual verification)

**Issue**: Centrality defaults silently to `'supporting'` when `signals.length === 0`.

**Fix**: Add debug-level logging:
```typescript
function computeCentrality(signals: Array<{ importance?: SignalImportance }>): PrincipleCentrality {
  if (signals.length === 0) {
    logger.debug('[centrality] Empty signals array, defaulting to supporting');
    return 'supporting';
  }
  // ...
}
```

---

## Action Items

| ID | Priority | Issue | Status |
|----|----------|-------|--------|
| C-1 | **Critical** | BATCH_SIZE lower bound validation | ✅ resolved |
| I-1 | Important | Add 'tensioning' to STANCE_CATEGORIES | ✅ resolved |
| I-2 | Important | Strengthen prompt sanitization | ✅ resolved |
| I-3 | Important | Add dedup to addSignal() | ✅ resolved |
| I-4 | Important | Fix tension detection threshold | ✅ resolved |
| I-5 | Important | Document/fix tension clearing behavior | ✅ resolved |
| M-1 | Minor | Document weight/threshold rationale | ✅ resolved |
| M-2 | Minor | Consider neutral fallback for stance | ✅ resolved |
| M-3 | Minor | Improve test semantic coverage | ✅ resolved |
| M-4 | Minor | Add logging for empty signals | ✅ resolved |

---

## Cross-References

- **Plan**: [docs/plans/2026-02-10-pbd-alignment.md](../plans/2026-02-10-pbd-alignment.md)
- **Twin Review Findings**: [2026-02-11-pbd-alignment-stages1-11-twin-review-findings.md](2026-02-11-pbd-alignment-stages1-11-twin-review-findings.md) (open)
- **Prior Review** (plan stage): [docs/reviews/2026-02-10-pbd-alignment-codex.md](../reviews/2026-02-10-pbd-alignment-codex.md)
- **Architecture**: [docs/ARCHITECTURE.md](../ARCHITECTURE.md)
- **Synthesis Philosophy**: [docs/architecture/synthesis-philosophy.md](../architecture/synthesis-philosophy.md)

---

## Notes

All N=1 items from external reviewers were manually verified to establish N=2 consensus before inclusion in this issue. The verification confirmed all findings are valid.

The critical issue (C-1) should be fixed before any production use. Important issues (I-1 through I-5) affect data quality and should be addressed before continuing with Stages 12+.
