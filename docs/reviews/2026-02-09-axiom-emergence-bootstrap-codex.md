# Axiom Emergence Bootstrap Plan Review - Codex

**Date**: 2026-02-09
**Reviewer**: codex-gpt51-examiner
**Model**: gpt-5.1-codex-max
**Files Reviewed**:
- `docs/plans/2026-02-09-axiom-emergence-bootstrap.md` (primary)
- `src/lib/reflection-loop.ts`
- `src/lib/compressor.ts`
- `src/lib/pipeline.ts`
- `docs/guides/greenfield-guide.md`
- `docs/issues/greenfield-bootstrap-mode-enforcement.md`

## Summary

The plan correctly identifies the root cause (N-count resets from re-clustering prevent axiom promotion) but proposes a workaround (lower threshold to 1) rather than fixing the underlying evidence accumulation problem. While this aligns with greenfield methodology (measure everything in Bootstrap), it risks flooding output with unvetted axioms and masking architectural issues that should be addressed.

## Findings

### Critical

1. **Unconditional promotion creates noise flood** (`src/lib/compressor.ts:141-174`)

   Setting `axiomNThreshold = 1` in bootstrap promotes every single-signal principle to an axiom. This:
   - Floods output with unvetted/contradictory axioms
   - Spikes LLM calls (each axiom requires `generateNotatedForm()` call)
   - Treats "axiom" as lossless pass-through rather than evidence-backed synthesis

   **Alternative**: Keep a confidence gate (N-count carryover, similarity threshold, or cap on total axioms) instead of unconditional promotion.

### Important

2. **Root cause unaddressed - evidence loss on re-clustering** (`src/lib/reflection-loop.ts:156-169`)

   The plan lowers the threshold but doesn't fix the actual problem: each iteration rebuilds the PrincipleStore and discards prior N-counts.

   ```typescript
   // Line 160: Store recreation discards N-count history
   store = createPrincipleStore(llm, principleThreshold + i * 0.02);
   ```

   **Better approach**: Persist N-counts across iterations or merge old/new stores. This would preserve signal strength while keeping stricter clustering quality.

3. **Mode propagation introduces coupling** (`src/lib/pipeline.ts:475-503`)

   Adding `mode` parameter to `ReflectiveLoopConfig` and `compressPrinciples()` conflicts with current layering:
   - Pipeline already knows `options.mode`
   - `runReflectiveLoop` and `compressPrinciples` are currently mode-agnostic
   - Other callers of `runReflectiveLoop` (e.g., tests, future scripts) would need updates

   **Lighter touch**: Compute bootstrap threshold at pipeline boundary and pass `axiomNThreshold` explicitly:
   ```typescript
   // In reflectiveSynthesis():
   const axiomNThreshold = context.options.mode === 'bootstrap' ? 1 : 3;
   await runReflectiveLoop(llm, signals, { axiomNThreshold });
   ```

4. **Stage 4 underspecified** (plan lines 202-218)

   "Track N-count distribution for Learn phase" lacks concrete implementation:
   - `TrajectoryTracker` doesn't emit N-count histograms
   - `runReflectiveLoop` doesn't capture N-count per iteration
   - No logging path specified for distribution data
   - Without concrete metrics, Learn-phase readiness cannot be validated

### Minor

5. **Convergence detection affected by noisy axioms** (`src/lib/reflection-loop.ts:175-188`)

   Convergence is based on axiom-set embedding similarity:
   ```typescript
   const similarity = cosineSimilarity(previousAxiomEmbedding, axiomSetEmbedding);
   iterationConverged = similarity >= convergenceThreshold;
   ```

   If every principle becomes an axiom (N=1 threshold), noisy singletons may cause:
   - Oscillating embeddings between iterations
   - False convergence or extended timeouts

   **Mitigation**: Add sanity check (minimum axiom quality metric or stability window requirement) or document expected longer runtimes.

## Alternative Framing

### Are we solving the right problem?

The plan assumes the problem is "threshold too high for Bootstrap". But the deeper issue is:

**Re-clustering design is fundamentally incompatible with N-count accumulation.**

The CR-2 note at `reflection-loop.ts:102-114` explicitly states this is a design tradeoff:
> "This design choice trades N-count accumulation for cleaner final clustering"

Lowering the threshold to 1 effectively abandons N-count as a quality signal. If N-count doesn't matter in Bootstrap, why track it at all?

### Unquestioned assumptions

1. **"All principles should become axioms in Bootstrap"** - Is this true? Or should Bootstrap still filter obvious noise while measuring the N-count distribution?

2. **"47 signals -> 46 principles is correct"** - This near 1:1 ratio suggests clustering may be too loose. Should we investigate principle clustering before axiom threshold?

3. **"Re-clustering design is non-negotiable"** - The plan explicitly rejects Option A (accumulate N-counts) as "significant refactor". But is this tradeoff still valid given the axiom emergence failure?

### What the Learn phase needs to answer

If Bootstrap produces 46 axioms (all principles promoted), Learn phase must discover:
- Which axioms actually deserve to persist (quality ranking)
- Whether N-count carryover would produce better signal than N=1
- What the "natural" N-count distribution would be with accumulation

Current Stage 4 doesn't capture enough data to answer these questions.

## Open Questions

1. **Distribution verification**: Is the lack of axioms solely due to N-count resets, or is the clustering threshold too strict? A quick check of principle N-count distribution (even at N=1-2) would clarify.

2. **Learn phase filtering**: If bootstrap axioms are intentionally permissive, how will downstream Learn phase filter or re-rank them? Without this path, bootstrap noise may propagate.

3. **LLM cost projection**: With 46 principles all becoming axioms, each requiring `generateNotatedForm()`, what's the expected LLM call increase? Is this budgeted?

## Recommendations

1. **Quick win**: Verify principle N-count distribution before implementing. Add logging to capture what `n_count` values principles actually have at end of reflective loop.

2. **Consider alternative**: Instead of N=1 threshold, try N-count carryover (Option A) on a smaller scale. Measure if it produces better axiom emergence than unconditional promotion.

3. **Strengthen Stage 4**: Specify exactly what metrics will be logged, where they'll be stored, and how Learn phase will analyze them. Include histogram schema.

4. **Keep mode-agnostic layers**: Pass `axiomNThreshold` directly from pipeline rather than threading mode through multiple layers.

5. **Add convergence guard**: Document expected impact on convergence detection or add minimum iteration before allowing convergence claim.

## Plan Quality Assessment

| Aspect | Rating | Notes |
|--------|--------|-------|
| Problem identification | Good | Root cause correctly traced to N-count reset |
| Solution approach | Fair | Addresses symptom, not root cause |
| Greenfield alignment | Good | Follows "measure everything" philosophy |
| Implementation detail | Fair | Stages 1-3 clear, Stage 4 underspecified |
| Risk assessment | Poor | LLM cost, convergence impact not addressed |
| Alternative consideration | Fair | Options listed but dismissed quickly |

## Raw Output

<details>
<summary>Full Codex CLI output</summary>

```
OpenAI Codex v0.63.0 (research preview)
--------
workdir: /Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul
model: gpt-5.1-codex-max
provider: openai
approval: never
sandbox: read-only
reasoning effort: xhigh
reasoning summaries: auto
--------

**Findings**
- Critical – Dropping `axiomNThreshold` to 1 in bootstrap will promote every single-signal principle to an axiom, likely flooding output with unvetted/contradictory axioms and spiking LLM calls (`src/lib/compressor.ts:141-174`). This treats "axiom" as a lossless pass-through rather than evidence-backed synthesis; consider keeping a confidence gate (N-count carryover, similarity, or cap) instead of unconditional promotion.
- Important – The root cause (N-count reset on re-clustering) is still unaddressed: each iteration rebuilds the store and discards prior counts (`src/lib/reflection-loop.ts:156-169`). Lowering the threshold masks the loss of evidence rather than fixing it; persisting N-counts or merging old/new stores would preserve signal strength while keeping stricter clustering.
- Important – Mode propagation strategy conflicts with the current layering: `pipeline` already knows `options.mode` (`src/lib/pipeline.ts:475-503`), while `runReflectiveLoop`/`compressPrinciples` are mode-agnostic. Adding mode to deeper layers introduces coupling and new call-site breakage (e.g., other callers of `runReflectiveLoop`). A lighter touch is to compute the bootstrap threshold at the pipeline boundary and pass `axiomNThreshold` explicitly.
- Important – Stage 4 ("Track N-count distribution for Learn phase") is underspecified. Neither `TrajectoryTracker` nor `runReflectiveLoop` currently emit N-count histograms; without a concrete metric/logging path, you won't be able to confirm the fix or Learn-phase readiness.
- Minor – Convergence is based on axiom-set embedding similarity (`src/lib/reflection-loop.ts:175-188`). If every principle becomes an axiom, noisy singletons may cause oscillating embeddings and false convergence/timeout. The plan should include a sanity check (e.g., minimum axiom quality or stability window) or expect longer runtimes.

**Open questions**
- Are we sure the lack of axioms is solely due to N-count resets, or is the clustering threshold too strict for the 47→46 principles case? A quick check of principle N-count distribution would clarify whether carrying counts vs. lowering thresholds is the right lever.
- If bootstrap axioms are intentionally permissive, how will downstream Learn phase filter or re-rank them to avoid propagating bootstrap noise?
```

tokens used: 25,668

</details>

---

*Review generated 2026-02-09 by codex-gpt51-examiner (gpt-5.1-codex-max)*
