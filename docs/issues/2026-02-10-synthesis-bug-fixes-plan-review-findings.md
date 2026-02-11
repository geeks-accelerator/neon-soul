# Issue: Synthesis Bug Fixes Plan - Code Review Findings

**Created**: 2026-02-10
**Updated**: 2026-02-10
**Status**: Resolved
**Priority**: High
**Type**: Plan Review Findings
**Review**: N=2 (Codex + Gemini) - 2026-02-10
**Resolution**: All findings addressed in plan update

---

## Summary

Code review of `docs/plans/2026-02-10-synthesis-bug-fixes.md` identified one critical issue (type safety), two important architectural concerns, and several minor clarifications needed before implementation.

**Plan Reference**: [`docs/plans/2026-02-10-synthesis-bug-fixes.md`](../plans/2026-02-10-synthesis-bug-fixes.md)

**Root Issue Reference**: [`docs/issues/2026-02-10-synthesis-runtime-bugs.md`](./2026-02-10-synthesis-runtime-bugs.md)

---

## Critical Findings

### CR-1: Stage 3 Type Safety Violation [N=2]

**Severity**: Critical

**Files**:
- `src/types/llm.ts:23-30` - `ClassificationResult<T>` definition
- `src/lib/llm-providers/ollama-provider.ts:214-243` - `classify()` method
- 9 call sites that consume `classify()` results

**Problem**: Stage 3 proposes returning `null` on fallback, but `ClassificationResult<T>` defines `category: T` as non-nullable. All callers dereference without null guards.

**Verified**: `src/types/llm.ts:23-30` shows:
```typescript
export interface ClassificationResult<T extends string> {
  category: T;  // Non-nullable
  confidence: number;
  reasoning?: string;
}
```

**Callers that need updating**:
| File | Line | Usage |
|------|------|-------|
| `compressor.ts` | 100 | Notation classification |
| `vcr-provider.ts` | 219, 239 | VCR recording/playback |
| `signal-extractor.ts` | 139 | Signal detection |
| `semantic-classifier.ts` | 80 | Dimension classification |
| `semantic-classifier.ts` | 123 | Signal type classification |
| `semantic-classifier.ts` | 167 | Section type classification |
| `semantic-classifier.ts` | 207 | Category classification |

**Impact**: Without type/contract update, this change will fail type-checking or throw at runtime.

**Recommendation**: Update plan Stage 3 to include:
1. Update `ClassificationResult<T>` to `ClassificationResult<T | null>` or add `category?: T`
2. List all 9 callers explicitly
3. Add acceptance criteria for each caller handling null

---

## Important Findings

### IM-1: Stage 1 May Render Loop Meaningless [N=2]

**Severity**: Important

**File**: `src/lib/reflection-loop.ts:149-224`

**Problem**: Moving signal ingestion outside the loop removes the primary mutation inside `runReflectiveLoop`. After the fix:
- Signals are ingested once before the loop
- `store.setThreshold()` only affects future adds (which won't happen)
- Principles become static after iteration 1
- Convergence will trivially trigger on iteration 2 (same axioms = similarity 1.0)

**Verified**: Lines 153-158 show threshold tightening:
```
// Each iteration tightens the threshold by 0.02
const iterationThreshold = principleThreshold + i * 0.02;
store.setThreshold(iterationThreshold);
```
But `setThreshold()` only affects `addGeneralizedSignal()` calls, which won't occur after iteration 1.

**Impact**: The iterative design and trajectory metrics become meaningless. Loop exists but does nothing useful.

**Recommendation**: Plan should explicitly address one of:

**Option A: Single-Pass Architecture** (simplify)
- Remove the loop entirely
- Generalize → Ingest → Compress in one pass
- Remove trajectory tracking (no iterations to track)

**Option B: Re-Scoring Architecture** (preserve iteration value)
- Keep the loop but change what happens each iteration
- Iteration 1: Add all signals to principles (threshold 0.85)
- Iteration N: Re-evaluate each signal's principle membership against tighter threshold
- Signals that no longer meet threshold split into new principles
- Requires tracking signal-to-principle assignments

The plan currently assumes Option A behavior but doesn't explicitly acknowledge the loop becomes vestigial.

---

### IM-2: Missing Signal Deduplication in PrincipleStore [N=2]

**Severity**: Important

**File**: `src/lib/principle-store.ts:227-310`

**Problem**: `addGeneralizedSignal()` increments `n_count` on every add with no deduplication check. Even after moving ingestion outside the loop, if input contains duplicate signals or future runs reuse signal IDs, N-counts can be inflated.

**Verified**: Lines 227-310 show no signal ID tracking - method finds best match and reinforces without checking if signal was already processed.

**Impact**: Self-matching bug may resurface with duplicate input or across synthesis runs.

**Recommendation**: Add signal ID tracking:
1. Add `processedSignalIds: Set<string>` to PrincipleStore
2. Check signal ID before processing in `addGeneralizedSignal()`
3. Skip or warn if signal already processed

---

### IM-3: Stage 3 Description Misaligned with Code Structure [N=2]

**Severity**: Important

**File**: `src/lib/llm-providers/ollama-provider.ts:214-243`

**Problem**: Plan states "Update `classify()` method to handle `null` from `extractCategory()`". But the fallback logic is self-contained within `classify()`'s own flow:

```
const category = this.extractCategory(response, categories);
if (category) {
  return { category, confidence: 0.85, reasoning: response };
}
// Fallback here - not a separate consumption of null
return { category: categories[0] as T, confidence: 0.3, ... };
```

**Impact**: Implementer may misunderstand where the fix should be applied.

**Recommendation**: Rephrase Stage 3 to focus on modifying the fallback behavior directly within `classify()` when `extractCategory()` returns null, rather than implying a change to how null is consumed.

---

## Minor Findings

### MN-1: Stemmer May Over-Match Hyphenated Categories [N=2]

**Severity**: Minor

**Files**:
- `src/lib/llm-providers/ollama-provider.ts:164-193`
- `src/types/dimensions.ts:6-15`

**Problem**: Adding a Porter stemmer may over-match hyphenated multi-word categories. SOULCRAFT_DIMENSIONS are all hyphenated:
- `identity-core`
- `character-traits`
- `voice-presence`
- `honesty-framework`
- `boundaries-ethics`
- `relationship-dynamics`
- `continuity-growth`

**Verified**: `src/types/dimensions.ts:6-15` confirms all dimensions are hyphenated.

**Impact**: Stemmer might incorrectly match "identity" to "identity-core" or cause other false positives.

**Recommendation**: Consider:
1. Normalize hyphens before stemming (split into words, stem each, rejoin)
2. Or tighten the LLM prompt to output exact category names
3. Add specific tests for hyphenated categories

---

### MN-2: Breaking API Change Not Documented [N=2]

**Severity**: Minor

**File**: `src/index.ts:21`

**Problem**: Removing `extractSignals` export is a breaking API change. Plan doesn't confirm no external consumers exist.

**Verified**: `extractSignals` is currently exported from public API.

**Recommendation**: Either:
1. Confirm no external consumers and document as breaking change
2. Deprecate first with JSDoc `@deprecated` warning
3. Keep export but mark internal with underscore prefix

---

### MN-3: Stage 5 Integration Tests Underspecified [N=2]

**Severity**: Minor

**File**: `docs/plans/2026-02-10-synthesis-bug-fixes.md` (Stage 5)

**Problem**: Test coverage not explicitly specified. Missing tests for key behaviors.

**Recommendation**: Add explicit test cases:
1. **One-and-done ingestion**: Verify signals added exactly once, N-counts don't inflate
2. **Duplicate signal handling**: Verify same signal ID isn't counted twice
3. **Category extraction variants**: Verify morphological matching works
4. **Fallback behavior**: Verify null category returned on parse failure
5. **Compression ratio**: Verify 3:1 or better achieved

---

### MN-4: Missing Explicit Dependency Installation [N=2]

**Severity**: Minor

**File**: `package.json`

**Problem**: Stage 2 mentions `porter-stemmer` but omits explicit install step.

**Recommendation**: Add to Stage 2 acceptance criteria:
```
- [ ] Run `npm install porter-stemmer`
- [ ] Verify package added to package.json dependencies
```

---

### MN-5: Stage 2 Lacks Unit Test Step [N=2]

**Severity**: Minor

**File**: `src/lib/llm-providers/ollama-provider.ts`

**Problem**: Introduction of stemmer algorithm is perfect candidate for unit testing, but Stage 2 only has integration tests in Stage 5.

**Recommendation**: Add to Stage 2:
- [ ] Unit tests for `extractCategory()` with morphological variants
- [ ] Unit tests for stemmer edge cases (hyphenated categories, short words)

---

## Acceptance Criteria for Plan Update

### Critical (must fix before implementation)
- [x] CR-1: Update `ClassificationResult<T>` type to allow null category ✓ Stage 3
- [x] CR-1: List all 9 `classify()` callers in Stage 3 ✓ Stage 3 table
- [x] CR-1: Add acceptance criteria for each caller's null handling ✓ Stage 3

### Important (should fix before implementation)
- [x] IM-1: Explicitly choose Single-Pass or Re-Scoring architecture ✓ Architecture Decision section
- [x] IM-1: Update plan to reflect chosen architecture ✓ Stage 1 updated
- [x] IM-2: Add signal deduplication to Stage 1 or as new Stage 1b ✓ Stage 1b added
- [x] IM-3: Rephrase Stage 3 to match actual code structure ✓ Stage 3 rewritten

### Minor (can fix during implementation)
- [x] MN-1: Add hyphenated category handling to Stage 2 ✓ Stage 2
- [x] MN-2: Document API breaking change in Stage 4 ✓ Stage 4
- [x] MN-3: Specify explicit test cases in Stage 5 ✓ Stage 5 (8 test cases)
- [x] MN-4: Add npm install step to Stage 2 ✓ Stage 2
- [x] MN-5: Add unit test step to Stage 2 ✓ Stage 2

---

## Related

**Plan Under Review**:
- [`docs/plans/2026-02-10-synthesis-bug-fixes.md`](../plans/2026-02-10-synthesis-bug-fixes.md)

**Root Issue**:
- [`docs/issues/2026-02-10-synthesis-runtime-bugs.md`](./2026-02-10-synthesis-runtime-bugs.md)

**Code Reviews**:
- [`docs/reviews/2026-02-10-synthesis-bug-fixes-plan-codex.md`](../reviews/2026-02-10-synthesis-bug-fixes-plan-codex.md)
- [`docs/reviews/2026-02-10-synthesis-bug-fixes-plan-gemini.md`](../reviews/2026-02-10-synthesis-bug-fixes-plan-gemini.md)

**Code Files Referenced**:
- `src/types/llm.ts:23-30` - ClassificationResult type
- `src/lib/llm-providers/ollama-provider.ts:214-243` - classify() method
- `src/lib/reflection-loop.ts:149-224` - Loop structure
- `src/lib/principle-store.ts:227-310` - addGeneralizedSignal()
- `src/types/dimensions.ts:6-15` - SOULCRAFT_DIMENSIONS
- `src/index.ts:21` - extractSignals export

---

*Issue filed 2026-02-10 from N=2 code review of synthesis bug fixes plan*
