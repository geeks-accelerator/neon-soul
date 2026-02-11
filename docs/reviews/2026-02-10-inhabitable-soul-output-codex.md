# Inhabitable Soul Output Review - Codex

**Date**: 2026-02-10
**Reviewer**: codex-gpt51-examiner (GPT-5.1 Codex Max)
**Files Reviewed**:
- `src/lib/prose-expander.ts` (541 lines) - Core new module
- `src/lib/compressor.ts` (384 lines) - Modified with cognitive load cap
- `src/lib/pipeline.ts` (847 lines) - Modified with prose-expansion stage
- `src/lib/soul-generator.ts` (496 lines) - Modified for prose rendering

## Summary

The "Inhabitable Soul Output" implementation transforms axioms into prose sections following souls.directory conventions. The core architecture is sound: parallel LLM calls for independent sections, validation with retry, graceful fallback. However, two critical issues were identified: a path validation bypass and incorrect axiom pruning logic. Additionally, missing fallback handling in the boundaries section and inaccurate provenance metrics in prose mode need attention.

## Findings

### Critical

1. **Path Traversal Bypass** - `src/lib/pipeline.ts:324-332`

   The `validatePath` function uses `startsWith` to check if paths are within allowed roots. This allows paths like `/tmp2/...` or `${home}evil` to bypass the constraint because they match the prefix without respecting directory boundaries.

   ```typescript
   // Current vulnerable code:
   const isAllowed = allowedRoots.some(root => normalized.startsWith(root));
   ```

   **Risk**: Paths outside intended sandbox could be read or written.

   **Fix**: Use path segment checks (add trailing separator or use `path.relative` with `..` detection).

2. **Axiom Pruning Uses Wrong Metric** - `src/lib/compressor.ts:341-349`

   When pruning axioms to meet the cognitive load cap (25), the sort uses `derived_from.principles.length` as a proxy for N-count. However, `createAxiomProvenance()` always produces a single-principle array, making this metric always equal to 1. The pruning is effectively arbitrary.

   ```typescript
   // Current code - always equals 1:
   const aNCount = a.derived_from?.principles?.length ?? 1;
   ```

   **Risk**: Strongest axioms (highest N-count) may be dropped in favor of weaker ones.

   **Fix**: Store `n_count` on the Axiom type during synthesis and sort by that value.

### Important

3. **Boundaries Fallback Missing on LLM Error** - `src/lib/prose-expander.ts:347-349`

   When the LLM call fails in `generateBoundaries`, the catch block returns an empty string instead of the fallback inversion list used elsewhere. Other sections (Core Truths, Voice, Vibe) properly return `generateFallback(axioms)` on error.

   ```typescript
   } catch (error) {
     logger.warn('[prose-expander] Boundaries generation failed', { error });
     return { content: '', usedFallback: true };  // Should return fallback
   }
   ```

   **Impact**: Prose output may have an empty Boundaries section with no backup content.

   **Fix**: Return the simple inversion fallback used in the validation failure case.

4. **Provenance Axiom Count Inaccurate** - `src/lib/soul-generator.ts:395-408`

   The provenance table in prose mode calculates `axiomCount` as the number of distinct principle dimensions (max 7), not the actual axiom count. This under-reports the output and misleads audits.

   ```typescript
   // Current code - counts dimensions, not axioms:
   const axiomCount = new Set(principles.map(p => p.dimension)).size;
   ```

   **Impact**: Provenance table shows "~7" axioms when there may be 25.

   **Fix**: Pass actual axiom count into `formatProseSoulMarkdown()` or track in `ProseExpansion`.

### Minor

5. **Vibe Validation Comment/Code Mismatch** - `src/lib/prose-expander.ts:122-129`

   The comment states "Must be 2-4 sentences" but validation accepts 1-5 sentences. Single-sentence outputs will not trigger retries despite the stricter documented format.

   ```typescript
   /**
    * Validate Vibe section format.
    * Must be 2-4 sentences, prose.  // <-- Says 2-4
    */
   function validateVibe(content: string): boolean {
     const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
     return sentences.length >= 1 && sentences.length <= 5;  // <-- Accepts 1-5
   }
   ```

   **Impact**: Minor - outputs may be shorter than intended.

   **Fix**: Align comment with code, or tighten bounds if stricter format is required.

6. **Test Coverage Gap**

   No dedicated tests found for `prose-expander.ts`. The test suite covers compressor cascade and guardrails but not:
   - Prose section generation with mock LLM
   - Validation retry logic
   - Fallback generation paths
   - Parallel execution correctness

   **Impact**: Regressions in prose expansion may go undetected.

   **Recommendation**: Add unit tests with mock LLM covering all generation functions.

7. **Closing Tagline Not Tracked in Fallback Sections**

   `generateClosingTagline` can fall back to a default tagline, but this is not tracked in `fallbackSections`. The `ProseExpansion.usedFallback` flag does not capture this case.

   **Impact**: Minor - fallback reporting incomplete for closing tagline.

## Architecture Assessment

**Strengths**:
- Clean separation: prose-expander handles transformation, pipeline orchestrates, soul-generator renders
- Parallel execution of independent sections (Core Truths, Voice, Vibe)
- Validation with retry gives LLM a second chance before fallback
- Graceful degradation to notation format when prose expansion fails

**Potential Improvements**:
1. Consider passing axioms directly to `formatProseSoulMarkdown()` for accurate metrics
2. Store N-count on Axiom type to preserve evidence strength through pruning
3. Add structured logging for LLM call latencies to optimize parallelism

## Open Questions

1. Should prose mode surface accurate provenance counts using the actual axiom list rather than approximations?
2. Is the 25-axiom cognitive load cap based on research or estimation? (Plan references research but value differs from plan's stated 30)
3. Should validation bounds be configurable per-section to allow tuning?

## Raw Output

<details>
<summary>Full CLI output</summary>

```
**Findings**
- Critical - `src/lib/pipeline.ts:324-332`: `validatePath` checks `startsWith` against allowed roots, so paths like `/tmp2/...` or `${home}evil` bypass the root constraint and allow reads/writes outside the intended sandbox. Use path segment checks (e.g., add trailing sep + `path.relative` or `isWithinPath`) to avoid traversal/prefix bypass.
- Critical - `src/lib/compressor.ts:341-349`: Cognitive-load pruning sorts by `derived_from.principles.length`, which is always 1 for synthesized axioms, so pruning when >25 axioms is effectively arbitrary and can drop the highest N-count/tier axioms. Sort by real evidence (e.g., preserved `n_count`) before applying the cap.
- Important - `src/lib/prose-expander.ts:347-349`: On LLM errors, Boundaries returns an empty string instead of the simple inversion fallback used elsewhere, leaving the prose output with no boundaries and no backup content. Return the fallback list to preserve a section when generation fails.
- Important - `src/lib/soul-generator.ts:395-408`: The provenance table in prose mode reports `axiomCount` as the number of distinct principle dimensions (max 7), not the actual axiom count, so it under-reports output size and misleads audits. Pass real axioms/counts into the prose formatter or compute from `proseExpansion` input.
- Minor - `src/lib/prose-expander.ts:122-129`: Comment says Vibe must be 2-4 sentences, but validation accepts 1-5, so single-sentence outputs won't trigger retries; tighten the bounds if the stricter format is required.

**Open Questions**
- Should prose mode surface accurate provenance counts (axioms/principles/signals) using the actual axiom list rather than approximations?

Model: gpt-5.1-codex-max
Provider: openai
Sandbox: read-only
Tokens used: 155,253
```

</details>
