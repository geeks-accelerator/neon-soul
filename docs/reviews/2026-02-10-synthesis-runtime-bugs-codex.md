# Synthesis Runtime Bugs Review - Codex

**Date**: 2026-02-10
**Reviewer**: 審碼 (codex-gpt51-examiner)
**Model**: gpt-5.1-codex-max
**Files Reviewed**:
- `src/lib/reflection-loop.ts` (324 lines)
- `src/lib/llm-providers/ollama-provider.ts` (285 lines)
- `src/lib/principle-store.ts` (379 lines)
- `src/lib/signal-generalizer.ts` (490 lines)

## Summary

The core diagnosis in the issue is correct: Bug 1 (self-matching) is the root cause of Bug 3 (poor compression). The reflection loop reprocesses the entire signals array every iteration against a persistent store, and since generalizations are cached with identical embeddings, each loop re-reinforces the same principles at similarity=1.0. This inflates N-counts instead of enabling cross-signal clustering.

Additionally, the "tightening threshold" design intent is unrealized - signals matched in the first pass are never reconsidered when thresholds increase in later iterations.

## Findings

### Critical

1. **reflection-loop.ts:149-173 - Self-matching root cause**

   The reflection loop reprocesses the entire `signals` array every iteration against a persistent store. With cached generalizations, the embeddings are identical, so each loop re-reinforces the same principles at similarity=1.0 and inflates `n_count`. This is the root cause of 44 axioms from 49 signals (Bug 1 leading to Bug 3).

   **Evidence**: Lines 163-173 show signals being re-added each iteration:
   ```typescript
   for (let i = 0; i < maxIterations; i++) {
     // ...
     const generalizedSignals = await generalizeSignalsWithCache(llm, signals, 'ollama');
     for (const generalizedSignal of generalizedSignals) {
       await store.addGeneralizedSignal(generalizedSignal, generalizedSignal.original.dimension);
     }
   }
   ```

2. **principle-store.ts:227-361 - No signal deduplication**

   The `addGeneralizedSignal` method never records which signal IDs have already been ingested. Duplicate inputs or repeat passes count as new evidence and keep boosting centroids/axiom promotion. Combined with the loop above, this guarantees runaway N-counts instead of compression.

   **Fix options**:
   - Track processed signal IDs in a Set and skip re-adds
   - Only add signals in iteration 1, let subsequent iterations only tighten thresholds
   - Clear store between iterations but lose N-count accumulation (not recommended)

### Important

3. **reflection-loop.ts:153-158 + principle-store.ts:83-90 - Threshold tightening not realized**

   The design comment claims "tightening threshold each iteration" enables refinement, but signals matched in the first pass are never reconsidered. `setThreshold()` only affects future adds. Once you stop double-counting, later stricter thresholds will not alter clusters unless you:
   - Rebuild/replay signals without incrementing counts, OR
   - Track per-signal membership and re-evaluate on threshold change

   **Current behavior**: Threshold increases from 0.85 to 0.87 to 0.89... but this has no effect since signals are already matched.

4. **ollama-provider.ts:164-193 - Morphological variant matching failure (Bug 2)**

   Category extraction only checks:
   - Exact match: `normalizedResponse === category.toLowerCase()`
   - Substring: `normalizedResponse.includes(category.toLowerCase())`
   - Word splits: `categoryWords.every((word) => normalizedResponse.includes(word))`

   Morphological variants like "believe" vs "belief" fail all three checks and fall through to fallback.

   **Fix options**:
   - Add stemming (e.g., porter-stemmer)
   - Add Levenshtein distance matching for close variants
   - Include morphological variants in category definitions
   - Use lemmatization before comparison

5. **ollama-provider.ts:232-243 - Deterministic fallback bias**

   Fallback always chooses `categories[0]` on parse or network errors with low confidence (0.3 or 0.1). This silently biases outputs toward the first category in the list.

   **Better approaches**:
   - Return null and let caller handle
   - Raise an error for caller to decide
   - Use embedding-based distance to pick closest category
   - Randomize fallback to avoid systematic bias

### Minor

6. **signal-generalizer.ts:396-399 - Cache key missing dimension context**

   The cache key is `${signalId}:${textHash}:${PROMPT_VERSION}` but omits dimension. If a signal's dimension changes across runs, cached generalizations/embeddings are reused incorrectly, potentially leading to mismatched clustering.

   **Impact**: Low in current usage since dimensions are typically stable, but could cause subtle bugs if signals are re-processed with different dimension assignments.

## Alternative Framing

The issue asks: "Is the approach itself wrong? What assumptions go unquestioned?"

**Questionable Assumptions**:

1. **Iterative refinement requires re-adding signals**: The current design assumes iteration means re-processing signals. But the stated goal (tighten thresholds for cleaner clustering) does not require re-adding - it requires re-evaluating existing cluster membership.

2. **N-count accumulation = quality**: The system conflates "seen multiple times" with "validated by multiple sources." If the same signal is counted 5 times across iterations, that is artificial inflation, not genuine validation.

3. **Threshold tightening improves clustering**: Without re-evaluation of existing memberships, threshold tightening only affects future adds. The current design effectively ignores threshold increases.

**Suggested Reframe**:

The reflection loop should:
1. Add signals ONCE in iteration 1
2. Subsequent iterations should re-evaluate cluster memberships against stricter thresholds
3. Signals that no longer meet the threshold should be split into new principles or reassigned
4. N-counts should reflect distinct source signals, not iteration counts

This would require a more sophisticated approach (e.g., iterative k-means style re-clustering) rather than simple accumulation.

## Root Cause Summary

```
Bug 1 (self-matching)
    |
    +-- reflection-loop.ts re-adds same signals each iteration
    |
    +-- principle-store.ts has no deduplication
    |
    +-- generalizeSignalsWithCache returns identical cached embeddings
    |
    +-- Signals match their own principles at similarity=1.000
    |
    +-- N-counts inflate (counted per-iteration, not per-signal)
    |
    +-- Threshold tightening has no effect (already matched)
    |
    v
Bug 3 (poor compression): 49 signals -> 87 principles -> 44 axioms

Bug 2 (LLM fallback) is SEPARATE from Bug 1/3:
    |
    +-- extractCategory fails morphological variants
    |
    +-- Fallback to first category with low confidence
    |
    v
Misclassification (affects dimension accuracy, not compression ratio)
```

## Recommendations (Priority Order)

1. **Fix Bug 1 first**: Track processed signal IDs in PrincipleStore or move signal addition outside the iteration loop
2. **Reconsider threshold tightening**: Either implement re-evaluation or remove the misleading design comments
3. **Fix Bug 2**: Add stemming or Levenshtein distance to extractCategory
4. **Fix fallback bias**: Return null or use distance-based category selection instead of deterministic first-category fallback

## Raw Output

<details>
<summary>Full CLI output</summary>

```
**Critical**
- src/lib/reflection-loop.ts:149-173 reprocesses the entire `signals` array every iteration against a persistent store; with cached generalizations the embeddings are identical, so each loop re-reinforces the same principles at similarity 1.0 and inflates `n_count` (root cause of the 44 axioms from 49 signals / Bug 1 -> Bug 3 self-matching).
- src/lib/principle-store.ts:227-359 never records which signal IDs have already been ingested, so duplicate inputs or repeat passes count as new evidence and keep boosting centroids/axiom promotion; combined with the loop above it guarantees runaway N-counts instead of compression.

**Important**
- src/lib/principle-store.ts:83-90 and src/lib/reflection-loop.ts:153-175: the "tightening threshold each iteration" claim isn't realized—signals matched in the first pass are never reconsidered; `setThreshold` only affects future adds. Once you stop double-counting, later stricter thresholds won't alter clusters unless you rebuild/replay signals without incrementing counts or track per-signal membership to re-evaluate.
- src/lib/llm-providers/ollama-provider.ts:164-193 category extraction only checks exact/substring/word splits; morphological variants like "believe" vs "belief" fail and fall through to fallback, causing misclassification (Bug 2).
- src/lib/llm-providers/ollama-provider.ts:232-257 fallback always chooses `categories[0]` on parse or network errors, silently biasing outputs toward the first class; returning null/raising or using a distance-based pick would avoid deterministic skew.

**Minor**
- src/lib/signal-generalizer.ts:396-469 cache key omits dimension/prompt context; if a signal's dimension changes across runs, cached generalizations/embeddings are reused incorrectly, leading to mismatched clustering.

tokens used: 147,879
```

</details>

---

*Review generated by 審碼 (codex-gpt51-examiner) using Codex CLI*
