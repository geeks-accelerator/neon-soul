# Issue: Axiom Count Exceeds Cognitive Load Limit

**Created**: 2026-02-10
**Status**: Plan Ready
**Priority**: Medium
**Type**: Investigation / Tuning
**Related**: `src/lib/principle-store.ts`, `src/lib/guardrails.ts`

---

## Summary

Synthesis produced 79 axioms, exceeding the 30-axiom cognitive load guardrail based on Miller's Law research.

```
[neon-soul:warn] [guardrail] Exceeds cognitive load research limits: 79 axioms > 30 limit
```

This is **NOT related to timeout issues** - it's a clustering/threshold concern.

---

## Pipeline Results

```
1353 signals → 557 principles → 79 axioms
Compression ratio: 17.13:1
Effective N-threshold: 3
```

- 557 principles formed from 1353 signals
- 79 principles had N >= 3 (promoted to axioms)
- 478 principles had N < 3 (not promoted)

---

## Root Cause Analysis

### How Clustering Works

1. **Signals** are extracted from memory content
2. **Signals are embedded** using nomic-embed-text
3. **Similar signals cluster** into principles (cosine similarity >= threshold)
4. **N-count tracks** how many signals reinforced each principle
5. **Principles with N >= 3** become axioms

### Current Settings

| Setting | Value | Location |
|---------|-------|----------|
| Similarity threshold | 0.75 | `principle-store.ts:79` |
| N-threshold (axiom promotion) | 3 | `compressor.ts:272` |
| Cognitive limit guardrail | 30 | `guardrails.ts` |

### Why 79 Axioms?

Two possible causes:

1. **Threshold too low (0.75)** - Signals that are semantically similar (0.70-0.74) create separate principles instead of clustering
2. **Genuinely diverse content** - Memory files contain many distinct values/beliefs

---

## Evidence from Logs

Looking at clustering decisions:

```
[matching] MATCH: similarity=0.942 threshold=0.75 generalized="Values long-term continuity..."
[matching] NO_MATCH: similarity=0.742 threshold=0.75 generalized="Values harmony over individual..."
[matching] NO_MATCH: similarity=0.732 threshold=0.75 generalized="Values presence over delay..."
[matching] NO_MATCH: similarity=0.747 threshold=0.75 generalized="Values stability over radical..."
```

Several near-misses at 0.70-0.74 range - signals that *almost* clustered but didn't.

---

## Investigation Steps

### 1. Quantify Near-Misses

```bash
grep "NO_MATCH" /tmp/neon-soul-outputv1.txt | wc -l
grep "NO_MATCH.*similarity=0\.7[0-4]" /tmp/neon-soul-outputv1.txt | wc -l
```

How many signals were in the 0.70-0.74 "near miss" range?

### 2. Test Higher Threshold

Temporarily test with 0.80 threshold to see impact:
- Would it reduce axiom count significantly?
- Would it lose important distinctions?

### 3. Analyze Axiom Content

Review the 79 axioms - are they genuinely distinct, or are there semantic duplicates that should have clustered?

### 4. Evaluate Guardrail Appropriateness

Is 30 the right limit for this use case? The research basis:
- Miller's Law: 7 ± 2 chunks in working memory
- Jim Collins: 3-4 core values for organizations
- But SOUL.md is a reference document, not working memory

---

## Options

### Option A: Increase Similarity Threshold

Change threshold from 0.75 to 0.80:

```typescript
// principle-store.ts
export function createPrincipleStore(
  llm: LLMProvider,
  initialThreshold: number = 0.80  // Was 0.75
): PrincipleStore {
```

**Pros**: Tighter clustering, fewer axioms
**Cons**: May lose meaningful distinctions

### Option B: Add Environment Variable

```typescript
const SIMILARITY_THRESHOLD = parseFloat(
  process.env.NEON_SOUL_SIMILARITY_THRESHOLD ?? '0.75'
);
```

**Pros**: Tuneable without code changes
**Cons**: Adds complexity

### Option C: Hierarchical Axioms

Instead of flat list, group axioms by dimension:
- 7 dimensions × ~4 axioms each = 28 axioms per dimension
- More cognitively manageable

### Option D: Adjust Guardrail

If 79 axioms is acceptable for this use case, adjust the warning threshold.

### Option E: LLM Meta-Synthesis (Hierarchical Compression)

Add another compression layer: use LLM to synthesize axioms into meta-axioms.

```
Current:  Signals → Principles → Axioms
Proposed: Signals → Principles → Axioms → Meta-Axioms
                                   79   →    ~10-15
```

**How it would work:**

1. Group axioms by dimension (7 groups)
2. For each dimension, ask LLM to synthesize similar axioms:
   ```
   "These 12 axioms are all about 'continuity-growth'.
   Synthesize them into 2-3 core principles that capture the essence."
   ```
3. Result: 7 dimensions × 2-3 meta-axioms = ~15-20 total

**Pros:**
- Leverages LLM's semantic understanding
- Produces human-readable, coherent output
- Maintains provenance (meta-axiom → axioms → principles → signals)

**Cons:**
- Additional LLM calls (cost/latency)
- Risk of losing nuance in compression
- Need to tune the synthesis prompt

**Implementation sketch:**

```typescript
async function synthesizeMetaAxioms(
  llm: LLMProvider,
  axioms: Axiom[],
  targetCount: number = 15
): Promise<MetaAxiom[]> {
  // Group by dimension
  const byDimension = groupBy(axioms, a => a.dimension);

  const metaAxioms: MetaAxiom[] = [];
  for (const [dimension, dimAxioms] of Object.entries(byDimension)) {
    // Target ~2-3 per dimension
    const targetPerDim = Math.ceil(targetCount / 7);

    const prompt = `These ${dimAxioms.length} axioms are about "${dimension}":

${dimAxioms.map(a => `- ${a.canonical.native}`).join('\n')}

Synthesize them into ${targetPerDim} core principles that capture the essence.
Each principle should be a single sentence.`;

    const result = await llm.generate(prompt);
    // Parse and create meta-axioms with provenance...
  }
  return metaAxioms;
}
```

---

## Recommendation

**Short-term:** Start with **Option B** (env var) to enable experimentation:

```bash
NEON_SOUL_SIMILARITY_THRESHOLD=0.80 npx tsx src/commands/synthesize.ts --force
```

**Long-term:** Consider **Option E** (LLM meta-synthesis) if:
- Threshold tuning doesn't reduce axioms enough
- You want cognitively manageable output (~10-15 core principles)
- Provenance trail is important (meta-axiom traces back to source signals)

Option E is the most powerful but requires more implementation work.

---

## Related Files

- `src/lib/principle-store.ts` - Clustering logic, similarity threshold
- `src/lib/guardrails.ts` - Cognitive load limits
- `src/lib/compressor.ts` - N-threshold for axiom promotion
- `docs/issues/2026-02-10-generalized-signal-threshold-gap.md` - Related threshold discussion

---

---

## Implementation Plan

**Option E selected for implementation** → See `docs/plans/2026-02-10-meta-axiom-synthesis.md`

- Feature flag: Enabled by default
- Disable via: `NEON_SOUL_SKIP_META_SYNTHESIS=true`

---

## Related Issues

- `2026-02-10-llm-classification-failures.md` - Timeout issues (separate, now fixed)
