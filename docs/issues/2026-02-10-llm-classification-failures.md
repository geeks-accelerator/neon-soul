# Issue: LLM Classification Failures, Parallelism, and Axiom Count

**Created**: 2026-02-10
**Updated**: 2026-02-10
**Status**: Resolved
**Priority**: High
**Type**: Bug Fix + Performance + Architecture
**Related**: `src/lib/semantic-classifier.ts`, `src/lib/llm-providers/ollama-provider.ts`, `src/lib/signal-extractor.ts`

---

## Summary

Three related issues discovered during synthesis testing - **ALL RESOLVED**:

1. **Hardcoded timeout** (30s) too aggressive for cold model starts ✅ FIXED
2. **LLM echoing input content** instead of classifying ✅ FIXED (self-healing retry)
3. **Unbounded parallelism** causing 269 timeouts ✅ FIXED
4. **79 axioms exceeds 30 limit** - Moved to separate issue (not related to LLM failures)
   → See `2026-02-10-axiom-count-exceeds-cognitive-limit.md`

---

## Problem 1: Hardcoded Timeout ✅ FIXED

### Symptom

```
[neon-soul:error] Ollama request timed out after 30000ms
```

### Root Cause

`ollama-provider.ts` had hardcoded 30-second timeout, too short for cold starts.

### Fix Applied

Added environment variable support and increased default to 120s:
```typescript
timeout: parseInt(process.env.OLLAMA_TIMEOUT ?? '120000', 10),
```

Environment variables now supported:
- `OLLAMA_BASE_URL` - API endpoint
- `OLLAMA_MODEL` - Model to use
- `OLLAMA_TIMEOUT` - Timeout in ms (default: 120s)

---

## Problem 2: LLM Echoing Input Content ✅ FIXED

### Symptom

```
[neon-soul:warn] Could not extract category from response {"response":"m/ponderings"}
```

### Root Cause

LLM returned input content (`m/ponderings`) instead of valid category. Single-attempt classification with no recovery.

### Fix Applied: Self-Healing Retry Loop

1. **Stronger prompt** - Lists valid options plainly, explicit format constraint
2. **Corrective feedback** - Tells LLM what it did wrong on retry
3. **Retry limit** - 2 retries before fallback to default

```typescript
const MAX_CLASSIFICATION_RETRIES = 2;

for (let attempt = 0; attempt <= MAX_CLASSIFICATION_RETRIES; attempt++) {
  const prompt = buildDimensionPrompt(sanitizedText, previousResponse);
  const result = await llm.classify(prompt, { categories: SOULCRAFT_DIMENSIONS });

  if (result.category !== null) return result.category;
  previousResponse = result.reasoning?.slice(0, 50);
}
return 'identity-core'; // Fallback after retries exhausted
```

---

## Problem 3: Unbounded Parallelism ✅ FIXED

### Symptom

```
269 errors: [neon-soul:error] OllamaLLMProvider classify error
            {"error":"Ollama request timed out after 120000ms"...}
```

Despite 120s timeout, 269 requests still timed out.

### Root Cause

In `signal-extractor.ts`, Phase 4 has **unbounded parallelism**:

```typescript
// Phase 4: Classify and embed confirmed signals in parallel
const signals: Signal[] = await Promise.all(
  confirmedSignals.map(async ({ candidate }) => {
    // NESTED Promise.all - 3 concurrent requests PER signal
    const [dimension, signalType, embedding] = await Promise.all([
      semanticClassifyDimension(llm, candidate.text),  // LLM call
      semanticClassifySignalType(llm, candidate.text), // LLM call
      embed(candidate.text),                            // Embedding call
    ]);
```

**Impact**: If 500 signals confirmed, this fires 500 × 3 = 1500 concurrent requests.
Ollama (especially on slower hardware) cannot handle this load → requests queue up → timeouts.

### Analysis

- Phase 2 (detection) uses `BATCH_SIZE = 10` ✓
- Phase 4 (classification) has NO batching ✗

### Fix Required

Add batching to Phase 4:

```typescript
// Phase 4: Classify and embed confirmed signals in BATCHES
const signals: Signal[] = [];
for (let i = 0; i < confirmedSignals.length; i += BATCH_SIZE) {
  const batch = confirmedSignals.slice(i, i + BATCH_SIZE);
  const batchResults = await Promise.all(
    batch.map(async ({ candidate, detection }) => {
      const [dimension, signalType, embedding] = await Promise.all([
        semanticClassifyDimension(llm, candidate.text),
        semanticClassifySignalType(llm, candidate.text),
        embed(candidate.text),
      ]);
      // ... rest of signal construction
    })
  );
  signals.push(...batchResults);
}
```

This limits concurrent LLM calls to `BATCH_SIZE × 3 = 30` at a time.

### Alternative: Environment Variable for Concurrency

```typescript
const LLM_CONCURRENCY = parseInt(process.env.NEON_SOUL_LLM_CONCURRENCY ?? '10', 10);
```

---

## Problem 4: 79 Axioms > 30 Limit ⚠️ INVESTIGATE SEPARATELY

### Symptom

```
[neon-soul:warn] [guardrail] Exceeds cognitive load research limits: 79 axioms > 30 limit
```

### Analysis

This is **NOT related to timeouts**. The axiom count is determined by:

1. **Similarity threshold** (0.75) - How aggressively signals cluster into principles
2. **N-threshold** (3) - Minimum reinforcements for axiom promotion

Pipeline results: `1353 signals → 557 principles → 79 axioms`

- 79 principles had N>=3 (3+ similar signals reinforcing them)
- The 30 limit is a cognitive load guardrail (Miller's Law), not a hard constraint

### Why Timeouts Don't Affect Axiom Count

- When classification times out, signal uses default dimension
- Signal still gets embedded and added to principle store
- Clustering is based on **embedding similarity**, not dimension
- So timeouts affect classification **accuracy**, not axiom **count**

### Potential Causes of High Axiom Count

1. **Threshold too low** - 0.75 may not be aggressive enough for this content
2. **Content diversity** - Memory files may genuinely contain many distinct values
3. **Guardrail too strict** - 30 may be too conservative for this use case

### Investigation Steps

1. Check clustering logs for near-misses (similarity 0.70-0.74)
2. Consider increasing threshold to 0.80 for tighter clustering
3. Evaluate if 79 axioms is actually problematic for the use case

---

## Files Changed

- `src/lib/llm-providers/ollama-provider.ts` - Added env var support, increased timeout ✅
- `src/lib/semantic-classifier.ts` - Added self-healing retry loop to all classifiers ✅
  - `classifyDimension()` - retry with corrective feedback
  - `classifySignalType()` - retry with corrective feedback
  - `classifyCategory()` - retry with corrective feedback
- `src/lib/signal-extractor.ts` - Added batching to Phase 4, `NEON_SOUL_LLM_CONCURRENCY` env var ✅

---

## Testing

Run synthesis with verbose output:
```bash
npx tsx src/commands/synthesize.ts --force --dry-run --verbose 2>&1 | tee /tmp/synthesis-log.txt
```

Check error/warning counts:
```bash
grep -c '\[neon-soul:error\]' /tmp/synthesis-log.txt
grep -c '\[neon-soul:warn\]' /tmp/synthesis-log.txt
```

With faster model:
```bash
OLLAMA_MODEL=llama3.2:3b npx tsx src/commands/synthesize.ts --force --dry-run --verbose
```

---

## Lessons Learned

1. **Don't hardcode timeouts** - Use env vars with sensible defaults
2. **LLMs need feedback loops** - Single-attempt classification is fragile
3. **Bound parallelism** - Unbounded Promise.all can overwhelm local LLMs
4. **Separate concerns** - Timeout issues vs clustering issues have different root causes
5. **Guardrails are warnings** - Research-backed limits for observability, not blocking

---

## Next Steps

- [x] Fix Phase 4 batching in `signal-extractor.ts` ✅
- [x] Apply self-healing retry to `classifySignalType()`, `classifyCategory()` ✅
- [x] Add `NEON_SOUL_LLM_CONCURRENCY` env var for tunability ✅
- [ ] Document recommended Ollama model settings for different hardware (optional)

**Moved to separate issue:**
- Investigate similarity threshold → See `2026-02-10-axiom-count-exceeds-cognitive-limit.md`

---

## Related Issues

- `2026-02-10-axiom-count-exceeds-cognitive-limit.md` - Axiom count investigation (separate issue)
- `2026-02-10-generalized-signal-threshold-gap.md` - Similarity threshold discussion
