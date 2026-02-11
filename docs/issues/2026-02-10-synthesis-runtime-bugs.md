# Issue: Synthesis Runtime Bugs (Self-Matching, LLM Fallback, Poor Compression)

**Created**: 2026-02-10
**Updated**: 2026-02-10
**Status**: Open
**Priority**: Critical
**Type**: Runtime Bug
**Review**: N=2 (Codex + Gemini) - 2026-02-10

---

## Summary

Three related bugs discovered during live synthesis testing cause the reflection loop to produce near 1:1 signal-to-axiom ratios instead of meaningful compression. The root cause is signals being re-added each iteration, causing self-matching.

**Code Review Consensus (N=2)**: Both Codex and Gemini confirm the diagnosis. Bug 1 is the root cause; Option C (move signal ingestion outside loop) is the recommended fix.

---

## Bug 1: Reflection Loop Self-Matching [Critical, N=2]

### Problem

In `src/lib/reflection-loop.ts:163-173`, the same signals array is re-added to the PrincipleStore in every iteration:

```
Iteration 1: Add 49 signals → Creates 49 new principles
Iteration 2: Add same 49 signals → Each matches its own principle from iteration 1
Iteration 3: Add same 49 signals → Same self-matching continues
```

### Evidence

From synthesis output:

```
[matching] MATCHED: principle_id=principle-5, similarity=1.000 to "Prioritize honesty over comfort"
[matching] MATCHED: principle_id=principle-23, similarity=1.000 to "Clear, direct feedback over hints"
[matching] MATCHED: principle_id=principle-41, similarity=1.000 to "Values authenticity over performance"
```

Every signal has similarity=1.000 because it's matching **itself** from the previous iteration.

### Code Location

`src/lib/reflection-loop.ts:163-173`:
```typescript
for (let i = 0; i < maxIterations; i++) {
  const generalizedSignals = await generalizeSignalsWithCache(llm, signals, 'ollama');
  for (const generalizedSignal of generalizedSignals) {
    await store.addGeneralizedSignal(generalizedSignal, generalizedSignal.original.dimension);
  }
  // signals is the same array every iteration - BUG
}
```

### Contributing Factor: No Signal Deduplication [N=2]

`src/lib/principle-store.ts:227-283` never tracks which signal IDs have been processed. The `addGeneralizedSignal` method finds the best match and either creates or reinforces - no deduplication check. Combined with the loop above, this guarantees runaway N-counts.

**Verified**: Lines 227-283 show no signal ID tracking.

### Contributing Factor: Threshold Tightening Unrealized [N=2]

`src/lib/principle-store.ts:83-90` shows `setThreshold()` only updates `similarityThreshold` for **future** signal matching. Signals matched in iteration 1 are never reconsidered when thresholds increase in later iterations.

**Current behavior**: Threshold increases from 0.85 → 0.87 → 0.89... but has no effect since signals are already matched.

**Verified**: Lines 83-89 show threshold only affects future adds.

### Suggested Fix

**Recommended: Option C** (consensus from N=2 review)

Move signal ingestion outside the iteration loop:

```
Phase 1: Generalize signals ONCE (before loop)
Phase 2: Add to PrincipleStore ONCE (before loop)
Phase 3: Iterate for refinement (threshold adjustment, compression, convergence detection)
```

This preserves N-count accumulation while avoiding repeated signal addition. Signals are ingested once; subsequent iterations only refine thresholds and recompute axioms.

**Alternative Options** (not recommended):
- Option A: Clear store between iterations (loses N-count accumulation)
- Option B: Track signal IDs already processed (adds complexity)

---

## Bug 2: LLM Classification Fallback [Important, N=2]

### Problem

The Ollama provider's `extractCategory` method fails to match morphological variants (e.g., "believe" vs "belief"), triggering fallback to the first category with low confidence.

### Evidence

From synthesis output:

```
[neon-soul:warn] Could not extract category from response, using fallback {"response":"believe","fallback":"value"}
```

The LLM responded "believe" but the expected categories included "belief" (noun form). The `extractCategory` method:
- Tries exact match: "believe" ≠ "belief" ❌
- Tries substring: "believe".includes("belief") = false ❌
- Tries fuzzy: "belief" words = ["belief"], "believe".includes("belief") = false ❌

### Code Location

`src/lib/llm-providers/ollama-provider.ts:164-193`:
```typescript
private extractCategory<T extends string>(
  response: string,
  categories: readonly T[]
): T | null {
  const normalizedResponse = response.toLowerCase().trim();

  // Exact match - fails for "believe" vs "belief"
  for (const category of categories) {
    if (normalizedResponse === category.toLowerCase()) {
      return category;
    }
  }
  // ... other matching attempts also fail
}
```

### Contributing Factor: Deterministic Fallback Bias [N=2]

`src/lib/llm-providers/ollama-provider.ts:232-258` shows fallback always chooses `categories[0]` with low confidence (0.3 for parse failure, 0.1 for errors). This creates systematic bias toward the first category in the list.

**Verified**: Lines 239-243 and 254-258 both use `categories[0]`.

### Suggested Fix

**Recommended: Option A** (consensus from N=2 review)

Use a stemmer library (e.g., `porter-stemmer`) to normalize both response and categories:

```
npm install porter-stemmer
```

Stem both the LLM response and category names before comparison. "believe" and "belief" both stem to "believ", enabling match.

**Alternative Options**:
- Option B: Levenshtein distance (may produce false positives for short words)
- Option C: Include morphological variants in prompt (manual maintenance required)

**Fallback Bias Fix**: Consider returning `null` and letting caller handle, or use embedding-based distance to pick closest category instead of deterministic first-category fallback.

---

## Bug 3: Poor Compression Ratio [Symptom, N=2]

### Problem

Synthesis produces 44 axioms from 49 signals (1.11:1 ratio) instead of the expected 5-15 axioms (3:1 to 10:1 compression).

### Evidence

From synthesis output:

```
✓ 49 signals extracted
✓ 87 principles identified
✓ 44 axioms emerged
```

This is a **symptom** of Bug 1 (self-matching). Because signals match themselves with similarity=1.000, the N-count threshold never increases meaningfully, and almost every signal becomes its own axiom.

### Root Cause Chain

```
Bug 1 (self-matching)
    │
    ├── reflection-loop.ts re-adds same signals each iteration
    │
    ├── principle-store.ts has no deduplication
    │
    ├── generalizeSignalsWithCache returns identical cached embeddings
    │
    ├── Signals match their own principles at similarity=1.000
    │
    ├── N-counts inflate (counted per-iteration, not per-signal)
    │
    ├── Threshold tightening has no effect (already matched)
    │
    v
Bug 3 (poor compression): 49 signals -> 87 principles -> 44 axioms
```

### Expected Outcome After Fix

**Per N=2 review**: Compression ratio should improve from 1.11:1 to approximately **3:1 or better** (5-15 axioms from 49 signals).

---

## Additional Findings from Code Review

### Important: O(N*M) Brute-Force Search [N=2]

**File**: `src/lib/principle-store.ts:277-283`

The `addGeneralizedSignal` function iterates through every existing principle to find the highest cosine similarity. This is O(N*M) for adding N signals to M principles.

**Verified**: Lines 277-283 show linear scan through all principles.

**Impact**: Acceptable for current scale (~50-100 signals), but will become a bottleneck at scale (1000+ principles).

**Recommendation**: For future scalability, consider approximate nearest neighbor (ANN) search (e.g., `hnswlib-node`, `faiss-node`). **Not blocking** for current bug fix.

### Minor: Hardcoded Model Name [N=2]

**File**: `src/lib/reflection-loop.ts:164`

The call to `generalizeSignalsWithCache` uses hardcoded model name `'ollama'`:
```typescript
const generalizedSignals = await generalizeSignalsWithCache(llm, signals, 'ollama');
```

**Verified**: Line 164 shows hardcoded string.

**Recommendation**: Promote `model` to `ReflectiveLoopConfig` with default value. Minor improvement for testability.

### Minor: Cache Key Missing Dimension Context [N=2]

**File**: `src/lib/signal-generalizer.ts:396-399`

Cache key is `${signalId}:${textHash}:${PROMPT_VERSION}` but omits dimension. If a signal's dimension changes across runs, cached generalizations are reused incorrectly.

**Verified**: Lines 396-399 show cache key without dimension.

**Impact**: Low in current usage (dimensions typically stable), but could cause subtle bugs if signals are re-processed with different dimension assignments.

### Minor: Dead Code with Stub [N=1]

**File**: `src/lib/signal-extractor.ts:42-91`

The old `extractSignals()` function contains a stub (`callLLMForSignals` returns `[]`). This function is exported in `index.ts:21` but never imported anywhere. The real implementation is `extractSignalsFromContent()` which works correctly.

**Evidence**: Grep for imports shows no usage of `extractSignals` from signal-extractor.

**Action**: Remove dead code (lines 42-91) and the export from `index.ts:21`.

**Related TODOs** (comment-only, not blockers):
| File | Line | Comment | Status |
|------|------|---------|--------|
| `signal-extractor.ts` | 88 | `// TODO: Integrate with OpenClaw skill LLM interface` | Dead code (remove with #1) |
| `ollama-provider.ts` | 224 | `// Future: Implement actual confidence scoring` | Enhancement, not blocker |
| `synthesize.ts` | 165-190 | `// Future: ANTHROPIC_API_KEY, OPENAI_API_KEY` | Enhancement, Ollama works |
| `pipeline.ts` | 710 | `// placeholder - needs actual token counting` | Minor, ratio calc works |

---

## Acceptance Criteria

### Bug 1 (Critical)
- [ ] Signals are only added to PrincipleStore once per synthesis run
- [ ] Signal ingestion moved outside iteration loop (Option C)
- [ ] Self-matching (similarity=1.000) only occurs for duplicate content, not re-added signals
- [ ] N-counts reflect distinct source signals, not iteration counts

### Bug 2 (Important)
- [ ] LLM classification handles morphological variants (believe/belief, value/values)
- [ ] Stemmer library integrated (porter-stemmer)
- [ ] Fallback bias addressed (return null or use distance-based selection)

### Bug 3 (Symptom - auto-resolves with Bug 1 fix)
- [ ] Compression ratio improves from 1.11:1 to at least 3:1
- [ ] N-counts reach 2+ for semantically related signals

### Additional (Deferred)
- [ ] ANN search for scalability (future - not blocking)
- [ ] Model name configurable (minor)
- [ ] Cache key includes dimension (minor)

### Cleanup
- [ ] Remove dead `extractSignals()` function from `signal-extractor.ts:42-91`
- [ ] Remove export from `index.ts:21`

---

## Priority Order

1. **Bug 1** (Critical) - Root cause, blocks clustering
2. **Bug 2** (Important) - Separate issue, affects classification accuracy
3. **Bug 3** (Symptom) - Will resolve when Bug 1 is fixed
4. **Additional findings** (Deferred) - Not blocking current fix

---

## Alternative Framing (from Code Review)

**Codex raised a deeper design concern**:

The current approach conflates "re-adding signals across iterations" with "iterative refinement." True iterative refinement would require:
- Add signals ONCE in iteration 1
- Subsequent iterations re-evaluate cluster memberships against stricter thresholds
- Signals that no longer meet threshold should split into new principles
- N-counts should reflect distinct source signals, not iteration counts

**Gemini confirmed**: The architecture is sound - the flaw was in implementation (re-ingestion), not design. The iterative threshold tightening design is correct once signals are only ingested once.

---

## Related

**Code Reviews**:
- [`docs/reviews/2026-02-10-synthesis-runtime-bugs-codex.md`](../reviews/2026-02-10-synthesis-runtime-bugs-codex.md)
- [`docs/reviews/2026-02-10-synthesis-runtime-bugs-gemini.md`](../reviews/2026-02-10-synthesis-runtime-bugs-gemini.md)

**Previous Issue**: [`docs/issues/missing-signal-generalization-step.md`](./missing-signal-generalization-step.md) - Addressed by signal generalization, but self-matching bug persists

**Code Files**:
- `src/lib/reflection-loop.ts:163-173` - Self-matching bug location
- `src/lib/llm-providers/ollama-provider.ts:164-193` - Category extraction logic
- `src/lib/llm-providers/ollama-provider.ts:232-258` - Fallback bias location
- `src/lib/principle-store.ts:227-283` - No deduplication
- `src/lib/principle-store.ts:83-90` - Threshold tightening (future only)
- `src/lib/signal-generalizer.ts:396-399` - Cache key missing dimension
- `src/lib/signal-extractor.ts:42-91` - Dead code to remove
- `src/index.ts:21` - Dead export to remove

**Plans**:
- `docs/plans/2026-02-09-signal-generalization.md` - Generalization was implemented but bug persists
- [`docs/plans/2026-02-10-synthesis-bug-fixes.md`](../plans/2026-02-10-synthesis-bug-fixes.md) - Fix plan for these bugs

**Plan Review**:
- [`docs/issues/2026-02-10-synthesis-bug-fixes-plan-review-findings.md`](./2026-02-10-synthesis-bug-fixes-plan-review-findings.md) - N=2 code review findings on fix plan

---

*Issue filed 2026-02-10 from live synthesis debugging session*
*Updated 2026-02-10 with N=2 code review findings (Codex + Gemini)*
