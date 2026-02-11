# Issue: Missing Signal Generalization Step (PBD Drift)

**Created**: 2026-02-09
**Status**: Resolved
**Priority**: High
**Type**: Architecture Gap

**Resolution**: Signal generalization implemented in `src/lib/signal-generalizer.ts` and integrated into `src/lib/reflection-loop.ts` (Phase 1). Compression improved from 1:1 to 15:1.

---

## Summary

The synthesis pipeline is missing the **principle synthesis** and **normalization** steps from the PBD methodology. Raw signals are being embedded and matched directly without LLM-based generalization, causing poor clustering and near 1:1 signal-to-axiom ratios.

---

## Problem

**Current behavior**:
```
Signal: "Prioritize honesty over comfort"
       ↓ (embed directly)
Principle.text = "Prioritize honesty over comfort"
       ↓ (try to match)
Similarity to other signals: 0.17 - 0.63 (all below 0.85 threshold)
       ↓
Creates new principle (N=1)
```

**Result**: 50 signals → 49 principles → 49 axioms (no compression)

**Expected behavior** (per PBD guides):
```
Signal: "Prioritize honesty over comfort"
       ↓ (LLM generalization)
Principle.text = "Values directness and truth over social comfort"
       ↓ (embed generalized form)
Similarity to "Clear, direct feedback over hints" → 0.85+ (match!)
       ↓
Reinforces existing principle (N=2, N=3...)
       ↓
Better clustering → meaningful axioms
```

---

## Evidence

### Diagnostic Output (2026-02-09)

```
[matching] NO_MATCH: similarity=0.315 "Clear, direct feedback over hints..."
[matching] NO_MATCH: similarity=0.515 "Honest answers, even when uncomfortable..."
[matching] NO_MATCH: similarity=0.253 "Prioritize honesty over comfort..."
```

These three signals are semantically related (all about honest communication) but have low similarity because they use different surface language.

### Code Location

`src/lib/principle-store.ts:200`:
```typescript
const principle: Principle = {
  text: signal.text,  // ← Direct copy, no generalization
  ...
}
```

---

## PBD Guide References

### Single-Source PBD (Step 4: Principle Synthesis)

From `docs/guides/single-source-pbd-guide.md:83-98`:

> For each UNIVERSAL or MAJORITY pattern, synthesize a clear principle statement:
> - Preserve original language where possible
> - **Make implicit relationships explicit**
> - Include confidence assessment
> - **Keep principles actionable**

### Multi-Source PBD (Step 2: Principle Normalization)

From `docs/guides/multi-source-pbd-guide.md:44-59`:

> Standardize principle statements across sources:
>
> **Before**:
> - Source A: "Never lie to the user"
> - Source B: "Always be truthful in responses"
> - Source C: "Honesty is paramount in all interactions"
>
> **After**:
> - Normalized: "Maintain truthfulness in all communications"

---

## Root Cause

The implementation drifted from the PBD methodology:

| PBD Guide | Implementation | Gap |
|-----------|----------------|-----|
| Extract signals (specific) | ✅ Implemented | - |
| **Synthesize principles (generalized)** | ❌ Skipped | **Missing LLM step** |
| **Normalize principles** | ❌ Skipped | **Missing LLM step** |
| Embed and match | ✅ Implemented | - |
| Compress to axioms | ✅ Implemented | - |

---

## Proposed Solution

Add an LLM-based generalization step between signal extraction and principle creation:

```
Signal (specific) → LLM Generalization → Principle (abstract) → Embed → Match
```

The LLM should transform:
- "Prioritize honesty over comfort" → "Values truthfulness over social comfort"
- "Clear, direct feedback over hints" → "Prefers explicit communication"
- "Honest answers, even when uncomfortable" → "Prioritizes honesty despite discomfort"

These generalized forms will have higher semantic similarity and cluster properly.

---

## Acceptance Criteria

- [x] Signals are generalized via LLM before becoming principles
- [x] Generalized principles cluster with similarity > 0.75 (adjusted threshold)
- [x] Compression ratio improves from ~1:1 to at least 3:1 (achieved 15:1)
- [x] N-counts reach 2+ for related signals
- [x] Cascade can select N>=2 or N>=3 thresholds (not always N>=1)

---

## Related

**Plan**: [`docs/plans/2026-02-09-signal-generalization.md`](../plans/2026-02-09-signal-generalization.md)

**PBD Guides**:
- [`docs/guides/single-source-pbd-guide.md`](../guides/single-source-pbd-guide.md) - Step 4: Principle Synthesis
- [`docs/guides/multi-source-pbd-guide.md`](../guides/multi-source-pbd-guide.md) - Step 2: Principle Normalization

**Code**:
- `src/lib/principle-store.ts:200` - Where generalization should occur
- `src/lib/semantic-classifier.ts` - Existing LLM classification (pattern to follow)

---

*Issue filed 2026-02-09 from synthesis debugging session*
