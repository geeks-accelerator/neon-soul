# Issue: Generalized Signal Threshold Not Applied in Production

**Created**: 2026-02-10
**Updated**: 2026-02-10
**Status**: Open
**Priority**: High
**Type**: Implementation Gap
**Related**: `docs/plans/2026-02-09-signal-generalization.md`, `docs/issues/2026-02-09-signal-generalization-impl-findings.md`

---

## Summary

The recommended 0.45 similarity threshold for generalized signals was documented and used in tests but never applied to production code. Production still uses 0.85, causing 1:1 compression (no clustering) instead of the expected 5:1.

**Observed**: 48 signals → 47 principles → 47 axioms (1.02:1 compression)
**Expected**: 48 signals → ~10 principles → ~10 axioms (5:1 compression)

---

## Evidence

### Production Code Uses 0.85

```
src/lib/reflection-loop.ts:43
  principleThreshold: 0.85,

src/lib/config.ts:27
  similarityThreshold: z.number().min(0).max(1).default(0.85),
```

### Tests Use 0.45 (Works Correctly)

```
tests/e2e/generalization-vcr.test.ts:200-201
  // Threshold 0.45 based on observed within-cluster similarities (0.36-0.58)
  const store = createPrincipleStore(llm, 0.45);
```

### Documentation Says 0.45

```
docs/ARCHITECTURE.md:193
  With generalization (threshold 0.45 for abstract embeddings):
  - Compression ratio: 5:1 (vs 1:1 baseline)
```

### Synthesis Output Shows Near-Misses

From the latest synthesis run, many semantically related signals fall between 0.78-0.83:

| Signal | Similarity | Status |
|--------|------------|--------|
| "Values authenticity over obligations" | 0.825 | NO_MATCH |
| "Values transparency over silence" | 0.812 | NO_MATCH |
| "Values authenticity over external validation" | 0.806 | NO_MATCH |
| "Values authenticity over artificiality" | 0.802 | NO_MATCH |
| "Values authenticity over image" | 0.868 | MATCH |

Only 1 out of 48 signals matched at 0.85 threshold.

---

## Root Cause Analysis

The signal-generalization implementation was marked complete with:
- [x] Threshold recommendation documented (0.45 for generalized embeddings)

But the actual production default was never updated. The tests passed because they explicitly pass 0.45, masking the fact that the default wasn't changed.

---

## Prior Art: Code Review Findings

This gap was flagged during code review (N=2):

**Finding #12: Threshold Tuning Is Heuristic**
> Tests use 0.45 threshold for generalized vs 0.85 for baseline. No ablation study, ROC curve, or documented empirical process.

**Finding #13: Generalization Benefit Not Isolated**
> "Compression vs baseline" test changes two variables (generalization AND threshold). Cannot attribute improvement to either alone.

Both findings were marked for future work but not addressed.

---

## Recommended Fix

### Option A: Apply 0.45 Threshold (Quick Fix)

Update the default in `reflection-loop.ts`:

```typescript
export const DEFAULT_REFLECTIVE_CONFIG: ReflectiveLoopConfig = {
  axiomNThreshold: 3,
  principleThreshold: 0.45,  // Changed from 0.85
};
```

**Pros**: Simple, matches tested behavior
**Cons**: No empirical validation for this specific dataset

### Option B: Configurable Threshold (Better)

1. Add `generalizedSignalThreshold` to config schema (separate from raw signal threshold)
2. Default to 0.45 for generalized signals
3. Allow user override via `.neon-soul/config.json`

### Option C: Ablation Study First (Most Rigorous)

Run ablation study as recommended by reviewers:
1. Raw signals at 0.85 threshold (baseline)
2. Raw signals at 0.45 threshold
3. Generalized signals at 0.85 threshold (current production)
4. Generalized signals at 0.45 threshold (tested behavior)

Then select threshold based on empirical results.

---

## Acceptance Criteria

- [ ] Production uses appropriate threshold for generalized signals
- [ ] Compression ratio improves from 1:1 to at least 3:1
- [ ] Threshold choice is documented with rationale
- [ ] Tests continue to pass
- [ ] No false positives (unrelated signals incorrectly clustered)

---

## Related Files

- `src/lib/reflection-loop.ts:43` - Production default (0.85)
- `src/lib/config.ts:27` - Schema default (0.85)
- `tests/e2e/generalization-vcr.test.ts:201` - Test uses 0.45
- `docs/ARCHITECTURE.md:193` - Documents 0.45 recommendation
- `docs/issues/2026-02-09-signal-generalization-impl-findings.md` - Original code review findings

---

## Notes

The 0.85 threshold was appropriate for **raw signals** (specific phrases like "I always tell the truth"). For **generalized signals** (abstract forms like "Values truthfulness over convenience"), a lower threshold is needed because:

1. Generalized forms use standardized patterns ("Values X over Y")
2. Semantic similarity is measured on abstract concepts, not surface text
3. Within-cluster similarities for generalized signals range 0.36-0.58 (per test comments)

The threshold should reflect this difference in embedding space characteristics.
