# LLM-Based Similarity Plan Review - Gemini

**Date**: 2026-02-12
**Reviewer**: gemini-25pro-validator
**Files Reviewed**:
- `docs/plans/2026-02-12-llm-based-similarity.md` (primary)
- `src/lib/embeddings.ts` (context)
- `src/lib/matcher.ts` (context)
- `src/lib/principle-store.ts` (context)
- `src/lib/llm-providers/ollama-provider.ts` (context)
- `src/types/principle.ts` (context)

## Summary

The plan is well-structured and technically sound. The core insight - using the already-trusted LLM instead of adding a new dependency - is valid. However, there are two critical gaps in scope (ollama-provider.ts dependency, centroid replacement logic) and important risks around prompt engineering reliability that need to be addressed before implementation.

## Findings

### Critical

1. **[plan:lines 205-224] Incomplete Logic Replacement for `updateCentroid()`**

   The plan specifies updating `principle-store.ts` to use LLM similarity but does not address how the concept of "centroid" (weighted average of embeddings) will be replaced. The current implementation uses vector math to merge similar signals into a principle representation:

   ```
   principle-store.ts:130-141 - updateCentroid() computes weighted average
   ```

   **Issue**: The plan mentions updating `mergeSimilarPrinciples()` but does not define what "merging" means in a text-only, no-embedding world. Options include:
   - Keep the first/oldest principle text
   - Use LLM to synthesize a merged text
   - Keep the highest-strength principle text

   Without this definition, Stage 4 is incomplete.

2. **[plan:not addressed] Unaddressed Dependency in `ollama-provider.ts`**

   The context file correctly identifies that `ollama-provider.ts` lines 30-31 import `embed` and `cosineSimilarity`, and lines 268-314 use them for semantic category fallback. The plan stages do not include updating this file.

   **Impact**: Deleting `embeddings.ts` in Stage 5 will cause a build failure because `ollama-provider.ts` will have dangling imports.

   **Required**: Add Stage 4.5 or expand Stage 4 to address:
   - Remove embedding fallback from `OllamaLLMProvider.classify()`
   - Update to use LLM-based category matching (or remove fallback entirely)
   - Delete the `categoryEmbeddingCache` (line 96)

### Important

1. **[plan:lines 130-135] Underestimated Prompt Engineering Risk**

   The plan proposes "structured output for parsing" from LLM prompts but does not address:
   - LLM output inconsistency (may not always return expected format)
   - Retry logic for malformed responses
   - Fallback behavior when LLM fails to provide confidence scores

   **Recommendation**: Add explicit handling in Stage 1 acceptance criteria:
   - [ ] Robust parsing with fallback for unexpected formats
   - [ ] Retry mechanism (1-2 attempts) for parsing failures
   - [ ] Default confidence value when extraction fails

2. **[plan:lines 230-247] Insufficient Testing Plan**

   Stage 5 mentions deleting `embeddings.test.ts` but the plan lacks explicit requirements for:
   - New unit tests for `llm-similarity.ts`
   - Updated tests for `matcher.ts` with mock LLM
   - Updated tests for `principle-store.ts`
   - Integration tests verifying end-to-end similarity matching

   **Recommendation**: Add to Stage 1 and Stage 2 acceptance criteria:
   - [ ] Mock LLM provider for deterministic testing
   - [ ] Test coverage for edge cases (empty candidates, all low confidence)

### Minor

1. **[plan:lines 167-169] Ambiguous Threshold Mapping**

   The plan states threshold changes from 0.85 cosine to "confidence >= medium (0.7)" but the interface returns a numeric confidence. The mapping logic should be explicit:
   - `high` -> 0.9, `medium` -> 0.7, `low` -> 0.5
   - What if LLM returns a probability like "0.82"?
   - What if LLM returns prose like "fairly confident"?

   **Recommendation**: Document exact parsing rules in Stage 1.

2. **[plan:lines 256-275] SKILL.md Trade-off Transparency**

   The plan correctly identifies SKILL.md needs updates but should explicitly note that documentation should mention:
   - Potential increased latency (LLM calls vs local inference)
   - Token cost implications (though minimal per the analysis)
   - Non-deterministic behavior possibility

   User transparency about trade-offs maintains trust.

3. **[plan:lines 100-108] Trade-offs Table - Cost Assumption**

   The table states embeddings have "None (local)" cost while LLM-based has "LLM tokens" cost. This is accurate but incomplete - embeddings have compute cost (CPU/memory for local inference). The framing makes LLM seem strictly worse on cost when actually:
   - Embedding: ~1-2s latency, CPU cycles, no external cost
   - LLM: depends on provider (free tier, Claude Code, API)

   Minor refinement for accuracy.

## Alternative Framing Questions

The plan solves the stated problem (ClawHub security scan) effectively. However:

1. **Assumption**: "Scanner will rate pure LLM skills as Benign" - Is this verified? Has another skill achieved Benign using this approach? The plan assumes but does not confirm.

2. **Assumption**: "LLM semantic understanding may actually be BETTER" - This is plausible but unverified. Consider adding a validation stage comparing quality metrics between embedding and LLM approaches before fully committing.

3. **Unquestioned**: The plan accepts non-determinism as "acceptable for deduplication." This is reasonable but worth noting: if two runs produce different principle structures, debugging becomes harder. Consider if any reproducibility guarantees are needed.

## Recommendations

1. **Before Implementation**: Verify with ClawHub that removing @xenova/transformers would actually result in "Benign" rating (could test with a stub skill).

2. **Expand Stage 4**: Explicitly include `ollama-provider.ts` in the files to update.

3. **Add Stage 4.5**: Define centroid replacement strategy for principle merging.

4. **Strengthen Stage 1**: Add acceptance criteria for prompt robustness and mock testing.

## Raw Output

<details>
<summary>Full CLI output</summary>

This is an excellent and comprehensive implementation plan. The strategy to replace the third-party embedding package with the agent's existing LLM is a sound architectural decision that directly addresses the core security concerns raised by the ClawHub scanner. The plan is well-structured, detailed, and demonstrates a clear understanding of the problem space.

My review focuses on identifying potential gaps and unaddressed risks to further strengthen the plan.

### Overall Assessment

The plan is of high quality and is technically feasible. It successfully charts a path to resolving the security vulnerabilities. However, there are a few critical and important considerations that need to be addressed before implementation.

---

### Findings

Here is a breakdown of my findings, categorized by severity:

#### critical
1.  **Incomplete Logic Replacement for `principle-store.ts`**: The plan context correctly identifies that `updateCentroid()` in `principle-store.ts` performs vector mathematics on embeddings to merge similar principles. However, the plan does not specify how this crucial concept of "averaging" or "merging" principles will be achieved using only text and an LLM. Simply removing the embedding-based calculations without defining a replacement strategy will break the `mergeSimilarPrinciples()` workflow, which is a core part of the system's logic.
2.  **Unaddressed Dependency in `ollama-provider.ts`**: The "CURRENT CODE FOR CONTEXT" section astutely points out that `ollama-provider.ts` uses the old `embed()` and `cosineSimilarity()` functions for a fallback mechanism. The plan's stages fail to include the necessary refactoring of this file. This oversight would lead to a build failure when `embeddings.ts` is deleted in Stage 5, as `ollama-provider.ts` would be left with dangling references to removed code.

#### important
1.  **Underestimated Prompt Engineering Risk**: The success of the entire refactor hinges on the reliability of the LLM prompt in `llm-similarity.ts`. The plan acknowledges the need for a prompt but understates the risk of relying on it for structured output. LLM responses can be inconsistent, and without robust parsing, error handling, and potential retry logic for malformed outputs, the similarity feature could become a frequent point of failure. This should be explicitly listed as a key project risk.
2.  **Insufficient Testing Plan**: The plan mentions deleting `embeddings.test.ts` and running `npm test`. It should also explicitly require the creation of new unit tests for the `llm-similarity.ts` module and updates to the tests for `matcher.ts`, `principle-store.ts`, and other affected components. A strategy for mocking the `LLMProvider` is essential to test the new logic in isolation without making actual LLM calls, ensuring tests are fast and deterministic.

#### minor
1.  **Ambiguous Threshold Logic**: The plan proposes removing the `similarity_threshold` field from `principle.ts` but adds an optional `threshold` parameter to the new `findBestMatch` function. It should be more explicit about how the LLM's `confidence` score (e.g., high/medium/low) will be mapped and evaluated against this numeric threshold to ensure consistent behavior.
2.  **Incomplete User Documentation (`SKILL.md`)**: In Stage 6, when updating the "How This Works" section, the documentation should also transparently mention the trade-offs outlined in the plan, specifically the potential for increased latency and LLM token costs. This manages user expectations about the performance characteristics of the new version.

</details>
