# Synthesis Bug Fixes Plan Review - Codex

**Date**: 2026-02-10
**Reviewer**: 審碼 (codex-gpt51-examiner)
**Model**: gpt-5.1-codex-max
**Files Reviewed**:
- `docs/plans/2026-02-10-synthesis-bug-fixes.md`
- `docs/issues/2026-02-10-synthesis-runtime-bugs.md`
- `src/lib/reflection-loop.ts`
- `src/lib/llm-providers/ollama-provider.ts`
- `src/lib/signal-extractor.ts`
- `src/index.ts`

## Summary

The plan correctly identifies the root cause (signals re-added each iteration causing self-matching) and proposes a reasonable fix (move ingestion outside loop). However, the review identified a critical type safety issue with Stage 3, important architectural concerns about the iterative loop design becoming meaningless after the fix, and missing deduplication guards in the principle store.

---

## Findings

### Critical

1. **Stage 3 Type Safety Violation**
   - **Files**: `src/types/llm.ts:23-60`, `src/lib/semantic-classifier.ts:56-86`, `src/lib/principle-store.ts:91-130`
   - **Issue**: Stage 3 proposes returning `null` on fallback, but `ClassificationResult` is defined as always returning a category. Callers dereference it without null guards.
   - **Impact**: Without a type/contract update and caller handling, this change will either fail type-checking or throw at runtime.
   - **Recommendation**: Either update `ClassificationResult<T>` to `ClassificationResult<T | null>` and update all callers, or use a different fallback strategy (e.g., throw an exception, return a specific "unknown" category).

---

### Important

2. **Stage 1 Renders Iterative Loop Meaningless**
   - **File**: `src/lib/reflection-loop.ts:153-173`
   - **Issue**: Moving generalization/ingestion outside the loop removes the only mutation inside `runReflectiveLoop`. The per-iteration threshold tightening at lines 153-158 stops affecting anything since the store is static after iteration 1.
   - **Impact**: After iteration 1, the store is static and convergence will trivially trigger on iteration 2, leaving the iterative design and trajectory metrics largely meaningless.
   - **Recommendation**: Plan needs either:
     - A single-pass refactor (remove loop entirely)
     - A strategy to re-score/re-cluster under tighter thresholds without duplicating signals (e.g., re-evaluate cluster memberships on threshold change)

3. **Missing Signal Deduplication in PrincipleStore**
   - **File**: `src/lib/principle-store.ts:223-310`
   - **Issue**: `addGeneralizedSignal` increments `n_count` on every add with no deduplication check. Self-matching is also driven by the store not tracking seen signal IDs.
   - **Impact**: If the input already contains duplicates or future runs reuse signal IDs, the N-threshold can still be inflated even after moving ingestion out of the loop.
   - **Recommendation**: Add signal ID tracking to prevent the same signal from being counted multiple times. Consider a `Set<string>` of processed signal IDs.

---

### Minor

4. **Stage 2 Stemmer May Over-Match Hyphenated Categories**
   - **Files**: `src/lib/semantic-classifier.ts:64-72`, `src/lib/llm-providers/ollama-provider.ts:164-193`
   - **Issue**: Adding a Porter stemmer to `extractCategory` may over-match hyphenated, multi-word categories (e.g., `SOULCRAFT_DIMENSIONS` like "identity-core") and bypass the existing word-split check.
   - **Recommendation**: Consider normalizing hyphens/spaces or tightening the prompt ("Respond with EXACTLY one of these values") to reduce false positives with less risk than aggressive stemming.

5. **Stage 4 Dead Code Removal is Breaking API Change**
   - **File**: `src/index.ts:21-25`
   - **Issue**: Removing `extractSignals` is a breaking API change since it's currently exported from the public API. The plan should confirm no external consumers exist.
   - **Recommendation**: Either:
     - Confirm no external consumers and document this as a breaking change
     - Deprecate first with a warning, then remove in a later version
     - Mark as `@deprecated` with JSDoc

6. **Stage 5 Integration Tests Underspecified**
   - **File**: `docs/plans/2026-02-10-synthesis-bug-fixes.md` (Stage 5 section)
   - **Issue**: Test coverage is not explicitly specified. Missing tests for key behaviors.
   - **Recommendation**: Add explicit tests for:
     - (a) One-and-done ingestion preventing `n_count` inflation (`src/lib/reflection-loop.ts:149-215`)
     - (b) Duplicate-signal handling in the store (`src/lib/principle-store.ts:223-310`)
     - (c) Category extraction fallbacks/variants (`src/lib/llm-providers/ollama-provider.ts:214-258`)

---

## Alternative Framing

**Deeper Architectural Question**: Is the iterative loop design fundamentally sound?

The current design assumes:
1. Signals are re-ingested each iteration with tighter thresholds
2. Threshold tightening causes signals to split into new principles
3. This iterative refinement leads to better clustering

However, the proposed fix (Option C) breaks assumption #1. After the fix:
- Signals are ingested once before the loop
- The loop only recalculates axioms from a static principle set
- Threshold tightening affects nothing since no new signals are added

**Two Possible Paths**:

1. **Single-Pass Architecture** (simplify): If signals are only ingested once, the loop is unnecessary. Remove it and make synthesis a single pass: generalize -> ingest -> compress.

2. **Re-Scoring Architecture** (preserve iteration value): Keep the loop but change what happens each iteration. Instead of re-ingesting, re-evaluate cluster memberships:
   - Iteration 1: Add all signals to principles (threshold 0.85)
   - Iteration 2: Re-check each signal against tighter threshold (0.87). Signals that no longer match their principle split off.
   - This requires tracking signal-to-principle assignments and reconsidering them.

The plan should explicitly address which path is intended.

---

## Unquestioned Assumptions

1. **N-count semantics**: The plan assumes N-counts should represent distinct source signals. But what does "distinct" mean? Same text? Same signal ID? Same embedding?

2. **Convergence detection**: After the fix, axiom embeddings will be identical across iterations (static principles). Convergence will always trigger on iteration 2. Is this the intended behavior?

3. **Compression ratio target**: The plan targets 3:1 to 10:1 compression. But what if signals are genuinely distinct? Is 1:1 compression ever valid?

---

## Recommendations

1. **Address Critical first**: Fix the Stage 3 type safety issue before implementation.

2. **Clarify loop purpose**: Decide whether to simplify to single-pass or implement re-scoring.

3. **Add deduplication**: Track processed signal IDs in PrincipleStore.

4. **Consider prompt-first fix for Stage 2**: Before adding a stemmer, try tightening the LLM prompt to output exact category names.

5. **Specify test coverage**: Add explicit test cases for each fix in Stage 5.

---

## Raw Output

<details>
<summary>Full CLI output</summary>

```
OpenAI Codex v0.63.0 (research preview)
--------
workdir: /Users/twin2/Desktop/projects/multiverse/projects/neon-soul
model: gpt-5.1-codex-max
provider: openai
approval: never
sandbox: read-only
reasoning effort: xhigh
reasoning summaries: auto
--------

**Findings**
- Critical – Stage 3 proposes returning `null` on fallback, but `ClassificationResult` is defined
  as always returning a category (`src/types/llm.ts:23-60`) and callers dereference it without
  guards (`src/lib/semantic-classifier.ts:56-86`, `src/lib/principle-store.ts:91-130`). Without
  a type/contract update and caller handling, this change will either fail type-checking or
  throw at runtime.

- Important – Moving generalization/ingestion outside the loop removes the only mutation inside
  `runReflectiveLoop`, so the per-iteration threshold tightening at `src/lib/reflection-loop.ts:153-173`
  stops affecting anything. After iteration 1 the store is static and convergence will trivially
  trigger on iteration 2, leaving the iterative design and trajectory metrics largely meaningless.
  Plan needs either a single-pass refactor or a strategy to re-score/re-ingest under tighter
  thresholds without duplicating signals.

- Important – Self-matching is also driven by the store not tracking seen signal IDs;
  `addGeneralizedSignal` increments `n_count` on every add with no dedup check
  (`src/lib/principle-store.ts:223-310`). If the input already contains duplicates or future
  runs reuse signal IDs, the N-threshold can still be inflated even after moving ingestion
  out of the loop.

- Minor – Adding a Porter stemmer to `extractCategory` may over-match hyphenated, multi-word
  categories (e.g., `SOULCRAFT_DIMENSIONS` in `src/lib/semantic-classifier.ts:64-72`) and bypass
  the existing word-split check (`src/lib/llm-providers/ollama-provider.ts:164-193`). Normalizing
  hyphens/spaces or tightening the prompt may reduce false positives with less risk than
  aggressive stemming.

- Minor – Removing `extractSignals` as dead code is a breaking API change unless you confirm
  no external consumers; it's currently exported from `src/index.ts:21-25`. The plan should
  call out the API impact or deprecate first.

- Minor – Stage 5 doesn't spell out coverage. You'll want explicit tests for: (a) one-and-done
  ingestion preventing `n_count` inflation (`src/lib/reflection-loop.ts:149-215`), (b) duplicate-signal
  handling in the store (`src/lib/principle-store.ts:223-310`), and (c) category extraction
  fallbacks/variants (`src/lib/llm-providers/ollama-provider.ts:214-258`).

tokens used: 235,103
```

</details>

---

*Review completed 2026-02-10 by 審碼 (codex-gpt51-examiner)*
