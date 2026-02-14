# Signal Generalization Implementation Review - Codex

**Date**: 2026-02-09
**Reviewer**: 審碼 (codex-gpt51-examiner)
**Model**: gpt-5.1-codex-max
**Files Reviewed**:
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/lib/signal-generalizer.ts`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/lib/principle-store.ts`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/lib/reflection-loop.ts`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/types/signal.ts`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/lib/llm-providers/vcr-provider.ts`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/tests/e2e/generalization-vcr.test.ts`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/scripts/record-vcr-fixtures.ts`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/types/llm.ts`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/lib/llm-providers/ollama-provider.ts`

## Summary

The signal generalization implementation is architecturally sound and aligns with the PBD methodology. The VCR testing infrastructure is well-designed. However, there are several issues ranging from a critical cache key bug to security concerns and debugging gaps that should be addressed.

## Findings

### Critical

1. **Cache key ignores signal content** - `signal-generalizer.ts:332-398`

   The `generalizationCache` keys on `signal.id + promptVersion` only. If a signal's text or dimension changes but the ID remains the same (e.g., user edits a diary entry), the cache returns stale `generalizedText` and `embedding`, contaminating downstream clustering.

   ```typescript
   // Current: getCacheKey only uses signal.id
   function getCacheKey(signalId: string): string {
     return `${signalId}:${PROMPT_VERSION}`;
   }
   ```

   **Impact**: Stale generalizations persist across synthesis runs if signal content changes.

   **Recommendation**: Include content hash in cache key: `hash(signal.id + signal.text + signal.dimension + PROMPT_VERSION)`.

---

### Important

2. **Prompt sanitization is minimal** - `signal-generalizer.ts:37-68`

   The `sanitizeForPrompt()` function only escapes `<` and `>` to XML entities. The `dimensionContext` is not sanitized. User text can still inject instructions via other vectors (quotes, markdown, unicode).

   ```typescript
   function sanitizeForPrompt(text: string): string {
     return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
   }
   ```

   **Impact**: Prompt injection is partially mitigated but not fully addressed.

   **Recommendation**: Consider more comprehensive sanitization or use structured prompt formats that separate user content from instructions.

3. **Pronoun validation uses simple string matching** - `signal-generalizer.ts:30-93`

   Pronoun checks use `includes('I ')` style matching with trailing space. This misses cases like `I.`, `we,`, `you:`, `I'm`, or pronouns at end of string.

   ```typescript
   const FORBIDDEN_PRONOUNS = ['I ', 'i ', 'We ', 'we ', ...];
   // Misses: "Values honesty, I think." or "Prioritizes I."
   ```

   **Impact**: Some outputs with pronouns pass validation.

   **Recommendation**: Use word boundary regex: `/\b(I|we|you|my|our|your)\b/i`.

4. **Batch generalization swallows errors silently** - `signal-generalizer.ts:228-253`

   The catch block in `generalizeSignals()` is empty (`catch {}`), falling back without logging. Debugging degraded behavior requires guesswork.

   ```typescript
   } catch {
     generalizedText = signal.text;
     usedFallback = true;
   }
   ```

   **Impact**: No visibility into why fallbacks occur during batch processing.

   **Recommendation**: Log the error with signal ID at debug level.

5. **VCR fixtures hash omits model metadata** - `vcr-provider.ts:138-150`

   Fixture keys are generated from `prompt + promptVersion + categories` but not the model name or temperature. Switching models (e.g., llama3 to mistral) replays old fixtures incorrectly.

   ```typescript
   const data = JSON.stringify({
     type,
     prompt,
     categories: categories ?? [],
     promptVersion: PROMPT_VERSION,
     // Missing: model, temperature
   });
   ```

   **Impact**: Test fixtures become stale when switching LLM models.

   **Recommendation**: Include model in fixture key, or document that fixtures are model-specific.

6. **Cache is module-global and unbounded** - `signal-generalizer.ts:332-406`

   The `generalizationCache` is a module-level `Map` with no size limit. Multiple synthesis sessions in one process share entries, and memory grows without bound.

   ```typescript
   const generalizationCache = new Map<string, GeneralizedSignal>();
   ```

   **Impact**: Memory leak in long-running processes; cross-session pollution.

   **Recommendation**: Either (a) scope cache to synthesis session, (b) implement LRU eviction, or (c) document that `clearGeneralizationCache()` must be called between sessions.

---

### Minor

7. **No test for cache hit rate in reflection loop** - `reflection-loop.ts:146-173`

   The reflection loop calls `generalizeSignalsWithCache()` every iteration with the same signals. Cache hits should be 100% after iteration 1, but this is not tested.

   **Impact**: Cache regression would go unnoticed.

   **Recommendation**: Add test asserting VCR stats or cache metrics show expected hit rate.

8. **Threshold tuning is heuristic** - `reflection-loop.ts:50-56`, `generalization-vcr.test.ts:178-236`

   Tests use 0.45 threshold for generalized signals vs 0.85 baseline. The plan documents this, but there is no ablation study, ROC curve, or similarity distribution analysis to justify the value.

   **Impact**: Suboptimal clustering if threshold is poorly calibrated.

   **Recommendation**: Document the empirical process used to determine 0.45, or add a tuning script.

9. **Fallback embeds original text** - `signal-generalizer.ts:126-156`

   When validation fails, `generalizedText = signal.text` and the embedding is generated from this fallback. This is intentional (do no harm), but worth confirming downstream consumers handle mixed embedding sources.

   **Impact**: Consistency is maintained, but semantic alignment may degrade for fallback signals.

   **Recommendation**: Document in type definition that `embedding` may be from original text when `usedFallback: true`.

10. **Generalization benefit not isolated in tests** - `generalization-vcr.test.ts:205-236`

    The "compression vs baseline" test compares different thresholds (0.45 vs 0.85). Improvement might stem from the looser threshold rather than the generalized text.

    **Impact**: Cannot attribute improvement to generalization vs threshold change.

    **Recommendation**: Add test that holds threshold constant and varies only generalization.

---

## Alternative Framing: Are We Solving the Right Problem?

The Codex review raised a fundamental question worth surfacing:

**Assumption**: LLM generalization improves clustering because embedding models (all-MiniLM-L6-v2) produce dissimilar vectors for semantically similar but lexically different signals.

**Challenge**: Modern embedding models are trained specifically to capture semantic similarity. "Be honest" and "tell the truth" should already embed closely.

**Evidence from tests**: The test shows 0.35+ average similarity within honesty cluster for generalized signals. What was it before generalization?

**Open question**: Is the observed improvement (5:1 compression) due to:
- (a) Generalization transforming surface form variance into uniform abstract statements?
- (b) The lower threshold (0.45 vs 0.85) being more appropriate for the embedding model?
- (c) Both?

**Recommendation**: Add ablation study comparing:
1. Original signals at 0.45 threshold
2. Original signals at 0.85 threshold
3. Generalized signals at 0.45 threshold
4. Generalized signals at 0.85 threshold

This would isolate the contribution of generalization vs threshold tuning.

---

## Raw Output

<details>
<summary>Full CLI output</summary>

```
**Critical**
- Cache key ignores signal content. `generalizationCache` keys on `signal.id` + prompt version only, so rerunning with the same id but updated text/dimension returns a stale generalizedText/embedding and contaminates clustering (e.g., refreshed diary entries) (src/lib/signal-generalizer.ts:332-398).

**Important**
- Prompt sanitization is minimal: only `<`/`>` are escaped and `dimensionContext` is unsanitized, so user text can still inject new instructions or XML attributes into the prompt body (src/lib/signal-generalizer.ts:37-68).
- Pronoun validation relies on `includes('I ')` style checks, so outputs like `I.`/`we,`/`you:` slip through; regex word boundaries would be more reliable (src/lib/signal-generalizer.ts:30-93).
- Batch generalization swallows errors (`catch {}`), silently falling back without any telemetry when the LLM or embed call fails—debugging degraded behavior becomes guesswork (src/lib/signal-generalizer.ts:228-253).
- VCR fixtures hash only prompt + promptVersion (no model/provider/temperature), so switching to a different model replays old fixtures; identical prompts across different runs also collide (src/lib/llm-providers/vcr-provider.ts:82-117).
- Cache is module-global and unbounded; multiple synthesis sessions in one process share entries and memory grows without limit unless `clearGeneralizationCache` is called (src/lib/signal-generalizer.ts:332-406).

**Minor**
- Reflection loop re-calls `generalizeSignalsWithCache` every iteration but there's no test ensuring 100% cache hits after the first pass, so a cache regression would go unnoticed (src/lib/reflection-loop.ts:146-173; tests/e2e/generalization-vcr.test.ts lacks coverage).
- Thresholds (0.45 vs 0.85) are heuristic; no ROC/ablation or similarity distribution tuning is recorded to justify them (src/lib/reflection-loop.ts:50-56; tests/e2e/generalization-vcr.test.ts:178-236).
- Fallback path embeds the original text when validation fails; seems intentional for "do no harm," but worth confirming that downstream consumers expect raw-text embeddings in those cases (src/lib/signal-generalizer.ts:126-156).
- Benefit of LLM generalization over direct embeddings isn't isolated—tests compare different thresholds, so improvement might stem from the looser cutoff rather than the generalized text itself (tests/e2e/generalization-vcr.test.ts:205-236).

OpenAI Codex v0.63.0 (research preview)
--------
workdir: /Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul
model: gpt-5.1-codex-max
provider: openai
approval: never
sandbox: read-only
reasoning effort: xhigh
reasoning summaries: auto
session id: 019c45d8-f880-7832-9e88-2dcb81a9de70
--------
tokens used: 161,536
```

</details>

---

## Summary by Severity

| Severity | Count | Key Issues |
|----------|-------|------------|
| Critical | 1 | Cache key ignores signal content |
| Important | 5 | Prompt injection, pronoun validation, silent errors, VCR model, unbounded cache |
| Minor | 4 | No cache hit test, heuristic thresholds, fallback docs, ablation study |

## Recommended Priority

1. **Fix cache key** (Critical) - Include signal text hash
2. **Add error logging** (Important) - Catch block in batch processing
3. **Improve pronoun validation** (Important) - Use regex word boundaries
4. **Add ablation study** (Minor) - Isolate generalization benefit from threshold tuning

---

*Review completed 2026-02-09 by 審碼 (Codex GPT-5.1 Examiner)*
