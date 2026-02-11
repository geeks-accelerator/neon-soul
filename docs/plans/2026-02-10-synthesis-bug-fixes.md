---
created: 2026-02-10
updated: 2026-02-10
type: implementation-plan
status: Complete
language: typescript
code_examples: forbidden
review_principles: |
  1. No Code: Do NOT add code examples. Plans describe WHAT/WHY, not HOW.
  2. No Hardcoding: Do NOT add values that depend on implementation.
  3. Suggest Intent: File paths, interfaces, acceptance criteria instead.
  4. Flag, Don't Fix: If plan has code, flag for removal.
trigger: think hard
addresses: docs/issues/2026-02-10-synthesis-runtime-bugs.md
---

> **CODE COMPLETE REQUIREMENT**: This project should have NO TODO/Stubs/Placeholders after implementation. All code must be fully functional - no deferred implementations, no stub returns, no placeholder comments. If a feature isn't ready, don't add it.

<!-- SECTION: cjk-summary -->
## Quick Reference

**Core Problem**: Self-matching (signals re-added each iteration) causes 1:1 ratio instead of 3:1+ compression.

**Solution**: Single-pass architecture - generalize once, add once, compress once.

**Key Files**: `reflection-loop.ts` (loop removal), `principle-store.ts` (deduplication), `ollama-provider.ts` (stemmer + fallback), `llm.ts` (type contract).

**Stages**: 6 total. Critical path: 1 → 1b → 3 → 5. Independent: 2, 4.

**Execution Order**: Stage 1 → 1b → 3 → 5 → 2, 4
<!-- END SECTION: cjk-summary -->

---

# Plan: Synthesis Bug Fixes (Self-Matching, LLM Fallback, Dead Code)

## Problem Statement

Three related bugs cause the reflection loop to produce near 1:1 signal-to-axiom ratios (49 signals → 44 axioms) instead of expected 3:1 to 10:1 compression. Root cause: signals re-added each iteration causing self-matching with similarity=1.000.

**Issue Reference**: [`docs/issues/2026-02-10-synthesis-runtime-bugs.md`](../issues/2026-02-10-synthesis-runtime-bugs.md)

**Code Review**: N=2 (Codex + Gemini) confirmed diagnosis and recommended fixes.

**Plan Review Findings**: [`docs/issues/2026-02-10-synthesis-bug-fixes-plan-review-findings.md`](../issues/2026-02-10-synthesis-bug-fixes-plan-review-findings.md) - All findings (CR-1, IM-1-3, MN-1-5) addressed in this plan update.

**Twin Review Findings**: [`docs/issues/2026-02-10-synthesis-bug-fixes-plan-twin-review-findings.md`](../issues/2026-02-10-synthesis-bug-fixes-plan-twin-review-findings.md) - All findings (C-1, I-1-3, M-1-5) addressed in this plan update.

---

## Architecture Decision: Single-Pass (IM-1)

**Decision**: Single-Pass Architecture (Option A from code review)

**Rationale**: Moving signal ingestion outside the loop removes the primary mutation inside `runReflectiveLoop`. The per-iteration threshold tightening only affects future `addGeneralizedSignal()` calls, which won't occur after iteration 1. Rather than add complexity for re-scoring, we simplify to single-pass.

**Implications**:
- Remove the iteration loop entirely
- Generalize → Ingest → Compress in one pass
- Remove trajectory tracking (no iterations to track)
- Convergence detection becomes unnecessary (single pass)

**Alternative Not Taken**: Re-Scoring Architecture would keep the loop but re-evaluate cluster memberships each iteration. This adds complexity and requires tracking signal-to-principle assignments. Deferred to future enhancement if compression results are insufficient.

---

## Bugs to Fix

| Bug | Severity | Root Cause | Fix |
|-----|----------|------------|-----|
| Bug 1: Self-Matching | Critical | Signals re-added each iteration | Single-pass architecture |
| Bug 1b: No Deduplication | Important | No signal ID tracking | Add processedSignalIds Set |
| Bug 2: LLM Fallback | Important | No morphological matching | Add stemmer library |
| Bug 2b: Fallback Bias | Important | Deterministic `categories[0]` | Return null, let caller handle |
| Bug 2c: Type Contract | Critical | ClassificationResult<T> non-nullable | Update type to T | null |
| Cleanup: Dead Code | Minor | Unused `extractSignals()` | Remove function and export (breaking change) |

---

## Stages

### Stage 1: Single-Pass Architecture (Bug 1 + IM-1) [Critical]

**File(s)**: `src/lib/reflection-loop.ts`

**Purpose**: Replace iterative loop with single-pass synthesis to eliminate self-matching

**Current Structure** (broken):
The loop in `reflection-loop.ts:163-180` iterates `maxIterations` times, re-adding the same signals array on every iteration. Each signal matches itself from the previous iteration with similarity=1.000, causing N-count inflation and preventing meaningful clustering.

**Target Structure** (single-pass):
Remove the iteration loop entirely. Execute generalize → add to PrincipleStore → compress as a single sequential pass. No iteration, no convergence detection, no trajectory tracking.

**Changes**:
1. Remove the iteration loop entirely
2. Generalize signals once
3. Add signals to PrincipleStore once
4. Compress to axioms once
5. Remove trajectory tracking (no iterations)
6. Remove convergence detection (single pass)
7. Update logging to reflect single-pass structure

**Why Single-Pass** (per IM-1 finding):
- Moving ingestion outside loop makes the loop meaningless
- Threshold tightening only affects future adds (none after ingestion)
- Convergence would trivially trigger on iteration 2 (same axioms)
- Simpler architecture with same outcome

**Acceptance Criteria**:
- [ ] Signals added to PrincipleStore exactly once per synthesis run
- [ ] No similarity=1.000 matches (except genuine duplicates)
- [ ] N-counts reach 2+ for semantically related signals
- [ ] Compression ratio improves from 1.11:1 to at least 3:1
- [ ] All existing tests pass
- [ ] Loop and trajectory tracking removed cleanly

**Commit**: `fix(neon-soul): replace iterative loop with single-pass synthesis`

---

### Stage 1b: Signal Deduplication (Bug 1b + IM-2) [Important]

**File(s)**: `src/lib/principle-store.ts`

**Purpose**: Prevent same signal from being counted multiple times

**Problem**: `addGeneralizedSignal()` increments `n_count` on every add with no deduplication check. If input contains duplicates or future runs reuse signal IDs, N-counts can be inflated.

**Changes**:
1. Add `processedSignalIds: Set<string>` to PrincipleStore class
2. In `addGeneralizedSignal()`, check if signal ID already processed
3. If already processed: log warning and skip
4. If new: add to Set, then process normally
5. Optionally expose `resetProcessedSignals()` for testing

**Acceptance Criteria**:
- [ ] `processedSignalIds` Set added to PrincipleStore
- [ ] Duplicate signal IDs are detected and skipped
- [ ] Warning logged when duplicate detected
- [ ] N-counts reflect distinct signals only
- [ ] Unit tests verify deduplication

**Commit**: `fix(neon-soul): add signal deduplication to PrincipleStore`

---

### Stage 2: Semantic Similarity Matching (Bug 2 + MN-1) [Low] ✅ COMPLETE

> **Resolution**: Replaced stemmer with embedding-based semantic similarity. See `docs/issues/2026-02-10-fragile-category-extraction.md` for the issue and resolution.

**File(s)**: `src/lib/llm-providers/ollama-provider.ts`, `package.json`, `tests/unit/ollama-provider.test.ts`

**Purpose**: Enable morphological variant matching in category extraction

**Dependency Installation** (MN-4):
```bash
npm install porter-stemmer
```

**Changes**:
1. Import stemmer function from `porter-stemmer`
2. Modify `extractCategory()` method to add stemmed matching:
   - After exact match attempt fails
   - After substring match attempt fails
   - Before fuzzy word-split matching
3. Stem both the LLM response and each category name before comparison
4. If stemmed versions match, return the original category

**Hyphenated Category Handling** (MN-1):
SOULCRAFT_DIMENSIONS are hyphenated (`identity-core`, `honesty-framework`, etc.).
Before stemming, normalize hyphenated categories:
1. Split category on hyphens: `"identity-core"` → `["identity", "core"]`
2. Stem each word: `["ident", "core"]`
3. Compare stemmed response against stemmed words
4. Match if any stemmed word matches

**Stemmer Behavior**:
| Input | Stemmed |
|-------|---------|
| believe | believ |
| belief | believ |
| believing | believ |
| values | valu |
| value | valu |
| valuing | valu |
| identity | ident |
| identity-core | ident, core |

**Why Stemming Over Alternatives**:
- Levenshtein distance: May produce false positives for short words
- Prompt variants: Requires manual maintenance of word lists
- Stemming: Linguistically accurate, zero maintenance

**Unit Tests** (MN-5):
Create or update `tests/unit/ollama-provider.test.ts`:
1. `extractCategory returns exact match`
2. `extractCategory returns substring match`
3. `extractCategory returns stemmed match for believe/belief`
4. `extractCategory returns stemmed match for values/value`
5. `extractCategory handles hyphenated categories`
6. `extractCategory returns null when no match`

**Acceptance Criteria**:
- [ ] `npm install porter-stemmer` executed
- [ ] `porter-stemmer` added to package.json dependencies
- [ ] `extractCategory()` handles morphological variants
- [ ] "believe" matches "belief" category
- [ ] "values" matches "value" category
- [ ] Hyphenated categories handled correctly (MN-1)
- [ ] Existing exact/substring matching still works
- [ ] Unit tests added for all matching scenarios (MN-5)
- [ ] All unit tests pass

**Commit**: `fix(neon-soul): add stemmer for morphological category matching`

---

### Stage 3: Fix Fallback Bias + Type Safety (Bug 2b, Bug 2c + CR-1, IM-3) [Critical]

**File(s)**:
- `src/types/llm.ts` - Type definition update
- `src/lib/llm-providers/ollama-provider.ts` - Fallback behavior fix
- 9 caller files (listed below)

**Purpose**: Eliminate deterministic bias toward first category and update type contract

**Current Behavior** (IM-3 - matches actual code structure):
In `ollama-provider.ts:214-243`, the `classify()` method calls `extractCategory()` and checks for a truthy result. If `extractCategory()` returns a category, it returns with confidence 0.85. If null, it falls back to `categories[0]` with confidence 0.3. This deterministic fallback creates systematic bias toward the first category in the list. The fallback logic is self-contained within `classify()`, not a separate consumption of null from `extractCategory()`.

**Target Behavior**:
- When `extractCategory()` returns `null`, `classify()` returns `{ category: null, confidence: 0, reasoning: 'Could not parse' }`
- No fallback to `categories[0]`
- Callers must handle null category

**Type Contract Update** (CR-1):

Update `src/types/llm.ts:23-30`: Change the `category` field from `T` (non-nullable) to `T | null` (nullable when parse fails). The `confidence` and `reasoning` fields remain unchanged.

**Callers Requiring Update** (CR-1 - all 9 call sites):
| File | Line | Usage | Null Handling Strategy |
|------|------|-------|------------------------|
| `compressor.ts` | 100 | Notation classification | Skip notation if null |
| `vcr-provider.ts` | 219 | VCR recording | Log warning, use 'unknown' |
| `vcr-provider.ts` | 239 | VCR playback | Log warning, use 'unknown' |
| `signal-extractor.ts` | 139 | Signal detection | Skip signal if null |
| `semantic-classifier.ts` | 80 | Dimension classification | Throw error (dimension required) |
| `semantic-classifier.ts` | 123 | Signal type classification | Default to 'general' |
| `semantic-classifier.ts` | 167 | Section type classification | Default to 'general' |
| `semantic-classifier.ts` | 207 | Category classification | Default to 'general' |

**Changes**:
1. Update `ClassificationResult<T>` type to `category: T | null`
2. In `classify()` method, when `extractCategory()` returns null:
   - Log warning with original response
   - Return `{ category: null, confidence: 0, reasoning: 'Could not parse category from response' }`
3. Update each of the 9 callers with appropriate null handling (see table above)

**Alternative Considered**: Embedding-based distance selection
- More complex, requires embedding the response
- Deferred to future enhancement

**Acceptance Criteria**:
- [ ] `ClassificationResult<T>` updated to allow null category (CR-1)
- [ ] `classify()` returns null category with confidence 0 on parse failure (IM-3)
- [ ] All 9 callers updated with null handling (CR-1)
- [ ] `compressor.ts:100` handles null
- [ ] `vcr-provider.ts:219` handles null
- [ ] `vcr-provider.ts:239` handles null
- [ ] `signal-extractor.ts:139` handles null
- [ ] `semantic-classifier.ts:80` handles null
- [ ] `semantic-classifier.ts:123` handles null
- [ ] `semantic-classifier.ts:167` handles null
- [ ] `semantic-classifier.ts:207` handles null
- [ ] Warning logged with original response for debugging
- [ ] No systematic bias toward any category
- [ ] TypeScript compiles without errors
- [ ] All existing tests pass

**Commit**: `fix(neon-soul): remove deterministic fallback bias and update type contract`

---

### Stage 4: Remove Dead Code (Cleanup + MN-2) [Low]

**File(s)**: `src/lib/signal-extractor.ts`, `src/index.ts`

**Purpose**: Remove unused `extractSignals()` function and related code

**⚠️ Breaking API Change** (MN-2):
Removing `extractSignals` from public exports (`src/index.ts:21`) is a breaking change.

**Verification of No External Consumers**:
- This is an internal project, not a published npm package
- Grep confirms no imports of `extractSignals` from external paths
- Only internal files import from signal-extractor
- Only `extractSignalsFromContent` and `extractSignalsFromMemoryFiles` are used

**Mitigation**: Document in commit message and changelog that `extractSignals` was removed. Any consumers should migrate to `extractSignalsFromContent()`.

**What to Remove**:
1. `src/lib/signal-extractor.ts:42-91` - The `extractSignals()` function
2. `src/lib/signal-extractor.ts:85-91` - The `callLLMForSignals()` stub
3. `src/lib/signal-extractor.ts:31-36` - The `ExtractedSignal` interface (only used by dead code)
4. `src/index.ts:21` - The `extractSignals` export

**What to Keep**:
- `ExtractionConfig` interface (line 18-21) - Used by other modules
- `extractSignalsFromContent()` - The real implementation
- `extractSignalsFromMemoryFiles()` - Batch extraction

**Verification**:
- Grep confirms no imports of `extractSignals` from signal-extractor
- Only `extractSignalsFromContent` and `extractSignalsFromMemoryFiles` are used

**Acceptance Criteria**:
- [ ] `extractSignals()` function removed
- [ ] `callLLMForSignals()` stub removed
- [ ] `ExtractedSignal` interface removed
- [ ] Export removed from `index.ts`
- [ ] Build succeeds
- [ ] All tests pass
- [ ] Breaking change documented in commit message (MN-2)

**Commit**: `chore(neon-soul)!: remove dead extractSignals function

BREAKING CHANGE: extractSignals() removed from public API.
Use extractSignalsFromContent() instead.`

---

### Stage 5: Integration Testing (MN-3) [Medium]

**File(s)**: `tests/integration/synthesis.test.ts` (create in existing `tests/integration/` directory)

**Purpose**: Verify all fixes work together in end-to-end synthesis

**Explicit Test Cases** (MN-3):

1. **One-and-Done Ingestion** (validates Stage 1)
   - Create PrincipleStore, add 10 signals
   - Verify each signal added exactly once
   - Verify N-counts don't inflate beyond actual signal count
   - File: `src/lib/reflection-loop.ts:149-215`

2. **Duplicate Signal Handling** (validates Stage 1b)
   - Add same signal ID twice to PrincipleStore
   - Verify warning logged
   - Verify N-count is 1, not 2
   - File: `src/lib/principle-store.ts:223-310`

3. **Self-Matching Eliminated** (validates Stage 1)
   - Run synthesis with known distinct signals
   - Verify no similarity=1.000 matches (except genuine duplicates)
   - Verify N-counts represent distinct signals

4. **Compression Ratio Improved** (validates Bug 3 resolution)
   - Run synthesis with ~50 signals
   - Verify axiom count is 5-15 (not 40-50)
   - Verify compression ratio is at least 3:1

5. **Morphological Matching Works** (validates Stage 2)
   - Mock LLM to return "believe" for a classification
   - Verify it matches "belief" category
   - Verify confidence is appropriate (not fallback 0.3)
   - File: `src/lib/llm-providers/ollama-provider.ts:164-193`

6. **Hyphenated Category Matching** (validates Stage 2 + MN-1)
   - Mock LLM to return "identity" for classification
   - Verify it matches "identity-core" category
   - File: `src/lib/llm-providers/ollama-provider.ts:164-193`

7. **Fallback Returns Null** (validates Stage 3)
   - Mock LLM to return unparseable response
   - Verify null category returned
   - Verify confidence is 0
   - File: `src/lib/llm-providers/ollama-provider.ts:214-258`

8. **Callers Handle Null Category** (validates Stage 3 + CR-1)
   - For each of 9 callers, test with null category input
   - Verify appropriate fallback behavior per caller
   - No crashes, no exceptions

**Acceptance Criteria**:
- [ ] Test: One-and-done ingestion passes
- [ ] Test: Duplicate signal handling passes
- [ ] Test: Self-matching eliminated passes
- [ ] Test: Compression ratio improved passes
- [ ] Test: Morphological matching passes
- [ ] Test: Hyphenated category matching passes
- [ ] Test: Fallback returns null passes
- [ ] Test: All 9 callers handle null category passes
- [ ] Compression ratio documented in test output
- [ ] No regressions in existing functionality

**Commit**: `test(neon-soul): add integration tests for synthesis bug fixes`

---

## Verification

After all stages complete:

1. **Run unit tests**: `npm test` — All tests pass
2. **Run synthesis**: `npx tsx src/commands/synthesize.ts --verbose`
3. **Verify compression ratio**: ~50 signals should produce 5-15 axioms (3:1 to 10:1 ratio)
4. **Check for self-matching**: No `similarity=1.000` entries in logs (except genuine duplicates)
5. **Check for fallback bias**: No "fallback to categories[0]" messages in logs

---

## Success Criteria

1. **Bug 1 Fixed**: Single-pass architecture, signals added once, no self-matching
2. **Bug 1b Fixed**: Signal deduplication prevents N-count inflation
3. **Bug 2 Fixed**: Morphological variants match correctly (including hyphenated categories)
4. **Bug 2b Fixed**: No deterministic fallback bias, returns null on parse failure
5. **Bug 2c Fixed**: Type contract updated, all 9 callers handle null category
6. **Bug 3 Resolved**: Compression ratio improves to 3:1 or better (symptom of Bug 1)
7. **Cleanup Done**: Dead code removed, breaking change documented, build clean
8. **Tests Complete**: All 8 explicit test cases pass
9. **Philosophy Preserved**: Synthesis produces meaningful value compression (3:1 to 10:1), not signal enumeration (1:1). The system extracts and clusters core values, not just lists inputs.

---

## Stages Summary

| Stage | Purpose | Complexity | Blocking | Findings Addressed |
|-------|---------|------------|----------|-------------------|
| 1 | Single-pass architecture | Medium | Yes (root cause) | IM-1 |
| 1b | Signal deduplication | Low | No | IM-2 |
| 2 | Add stemmer | Low | No | MN-1, MN-4, MN-5 |
| 3 | Fix fallback + type safety | Medium | Yes (type contract) | CR-1, IM-3 |
| 4 | Remove dead code | Low | No | MN-2 |
| 5 | Integration tests | Medium | No | MN-3 |

**Recommended Order**: Stage 1 → Stage 1b → Stage 3 → Stage 5 → Stages 2, 4

**Rationale**:
- Stage 1 is root cause fix (self-matching)
- Stage 1b completes deduplication safety
- Stage 3 is blocking (type contract change affects all callers)
- Stage 5 validates core fixes before adding stemmer/cleanup
- Stages 2, 4 are independent improvements

---

## Deferred Items (Not in This Plan)

Per issue, these are explicitly deferred:
- ANN search for scalability (future - not blocking)
- Model name configurable in `ReflectiveLoopConfig` (minor)
- Cache key includes dimension in `signal-generalizer.ts` (minor)

**Tracking**: These items should be captured in a future issue or backlog if needed. They are not blocking for current synthesis functionality.

---

## Effort Estimate

| Stage | Estimate | Notes |
|-------|----------|-------|
| 1 | 30-45 min | Single-pass architecture, loop removal |
| 1b | 15-20 min | Signal deduplication (defensive code) |
| 2 | 20-30 min | Stemmer integration + unit tests |
| 3 | 45-60 min | Type safety + 9 caller updates |
| 4 | 10-15 min | Dead code removal |
| 5 | 30-45 min | Integration tests (8 test cases) |

**Total**: ~2.5-4 hours active work

**Note**: Estimates assume familiarity with codebase. First-time implementation may take longer.

---

## Related

**Issue**: [`docs/issues/2026-02-10-synthesis-runtime-bugs.md`](../issues/2026-02-10-synthesis-runtime-bugs.md)

**Code Reviews** (N=2):
- [`docs/reviews/2026-02-10-synthesis-runtime-bugs-codex.md`](../reviews/2026-02-10-synthesis-runtime-bugs-codex.md)
- [`docs/reviews/2026-02-10-synthesis-runtime-bugs-gemini.md`](../reviews/2026-02-10-synthesis-runtime-bugs-gemini.md)

**Twin Reviews**:
- [`docs/reviews/2026-02-10-synthesis-bug-fixes-plan-twin-technical.md`](../reviews/2026-02-10-synthesis-bug-fixes-plan-twin-technical.md)
- [`docs/reviews/2026-02-10-synthesis-bug-fixes-plan-twin-creative.md`](../reviews/2026-02-10-synthesis-bug-fixes-plan-twin-creative.md)

**Previous Work**:
- [`docs/plans/2026-02-09-signal-generalization.md`](./2026-02-09-signal-generalization.md) - Generalization implemented, but self-matching persisted
- [`docs/issues/missing-signal-generalization-step.md`](../issues/missing-signal-generalization-step.md) - Original issue that led to generalization

**Code Files**:
- `src/lib/reflection-loop.ts` - Stage 1 changes (single-pass architecture)
- `src/lib/principle-store.ts` - Stage 1b changes (signal deduplication)
- `src/lib/llm-providers/ollama-provider.ts` - Stages 2, 3 changes (stemmer, fallback)
- `src/types/llm.ts` - Stage 3 changes (type contract update)
- `src/lib/compressor.ts` - Stage 3 caller update
- `src/lib/vcr-provider.ts` - Stage 3 caller update
- `src/lib/signal-extractor.ts` - Stages 3, 4 (caller update + cleanup)
- `src/lib/semantic-classifier.ts` - Stage 3 caller update (4 call sites)
- `src/index.ts` - Stage 4 cleanup
- `tests/unit/ollama-provider.test.ts` - Stage 2 unit tests
- `tests/integration/synthesis.test.ts` - Stage 5 integration tests

---

## Verification Results (2026-02-10)

### Synthesis Run Output

```
npx tsx src/commands/synthesize.ts --dry-run --verbose

✅ 49 signals → 44 principles → 4 axioms (12.3:1 compression)
✅ Effective N-threshold: 2 (cascaded from N>=3 → N>=2)
✅ Dimension coverage: 57% (4/7 dimensions)
✅ Synthesis time: 11.9s
✅ Generalization: 0% fallback rate
```

### Stages Verified

| Stage | Status | Evidence |
|-------|--------|----------|
| 1: Single-Pass | ✅ Verified | No similarity=1.000 self-matches, 12.3:1 compression |
| 1b: Deduplication | ✅ Verified | "Added 49 signals (0 duplicates skipped)" |
| 2: Semantic Match | ✅ Complete | Replaced stemmer with embedding-based similarity |
| 3: Null Fallback | ✅ Verified | "returning null" warning present, callers handled |
| 4: Dead Code | ⏳ Pending | Not verified in this run |
| 5: Integration Tests | ⏳ Pending | Not verified in this run |

### Resolved Issue: "continuity" → "continuity-growth" Matching ✅

**Original Problem** (now fixed):
```
[neon-soul:warn] Could not extract category from response, returning null {"response":"continuity"}
```

**Root Cause**: The `extractCategory` function used keyword/stemmer matching which was fundamentally fragile and context-unaware.

**Fix Applied**: Replaced stemmer with two-stage extraction in `ollama-provider.ts`:
1. **Fast matching** (`extractCategoryFast`): Exact and substring matching (synchronous)
2. **Semantic fallback** (`extractCategorySemantic`): Embedding-based similarity when fast matching fails

**Verification**: "continuity" now correctly maps to "continuity-growth" via semantic similarity (embedding cosine similarity > 0.3).

**Issue Resolved**: `docs/issues/2026-02-10-fragile-category-extraction.md` - Status: Resolved

### Compression Improvement

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Signals | 49 | 49 | - |
| Axioms | 44 | 4 | -91% |
| Ratio | 1.11:1 | 12.3:1 | +1008% |

**Success**: Compression ratio improved from 1.11:1 to 12.3:1 (target was 3:1 minimum).
