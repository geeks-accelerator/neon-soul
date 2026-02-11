# Issue: Fragile Category Extraction in Ollama Provider

**Created**: 2026-02-10
**Updated**: 2026-02-10
**Status**: Resolved
**Priority**: Medium
**Type**: Architecture Improvement
**Related**: `docs/plans/2026-02-10-synthesis-bug-fixes.md` (Stage 2)

---

## Resolution

**Fixed via**: Approach 3 (Semantic Similarity) - embedding-based category matching

**Implementation**: Two-stage extraction in `ollama-provider.ts`:
1. **Fast matching** (`extractCategoryFast`): Exact and substring matching (synchronous)
2. **Semantic fallback** (`extractCategorySemantic`): Embedding-based similarity when fast matching fails

**Key changes**:
- Removed Porter stemmer dependency
- Added category embedding cache for efficiency
- Uses existing `embed()` and `cosineSimilarity()` functions
- Minimum similarity threshold of 0.3 filters noise
- Actual similarity score becomes confidence value

**Verification**: "continuity" now correctly maps to "continuity-growth" via semantic similarity

**Tests**: 248 pass, including new semantic similarity tests in `tests/unit/ollama-provider.test.ts`

---

## Summary

The `extractCategory()` function in `ollama-provider.ts` uses keyword/stemmer matching to parse LLM responses into categories. This approach is fundamentally brittle and context-unaware. An LLM-based classification would handle ambiguous responses naturally.

**Observed Failure**: LLM returned "continuity" but keyword matching couldn't map it to "continuity-growth" dimension, despite the stemmer logic being technically correct in isolation.

---

## Problem

### Current Approach (Keyword/Stemmer Matching)

In `src/lib/llm-providers/ollama-provider.ts:169-223`, the `extractCategory()` function uses a cascade of string matching techniques:

1. Exact match
2. Substring match
3. Stemmed match (Porter stemmer)
4. Fuzzy match (all category words present)

### Why It's Brittle

1. **No Context Understanding**: String matching cannot understand that "continuity" semantically refers to "continuity-growth"
2. **Sensitive to LLM Output Variations**: Extra words, punctuation, or phrasing breaks matching
3. **Maintenance Burden**: Each new edge case requires new matching logic
4. **False Negatives**: Valid classifications rejected due to parsing failures

### Evidence

From synthesis output:
```
[neon-soul:warn] Could not extract category from response, returning null {"response":"continuity"}
```

The LLM understood the dimension was continuity-related, but the keyword matcher couldn't map "continuity" to "continuity-growth".

---

## Recommended Fix

### Option A: LLM-Based Classification (Recommended)

Have the LLM classify directly using structured output or a follow-up classification prompt.

**Approach 1**: Constrained output
- Use system prompt to force LLM to respond with exact category name
- Example: "Respond with ONLY one of these exact strings: identity-core, continuity-growth, ..."

**Approach 2**: Two-step classification
- Step 1: Free-form LLM response about the category
- Step 2: LLM classifies its own response into the correct category

**Approach 3**: Semantic similarity
- Embed the LLM response
- Compare against embeddings of category names
- Select highest similarity match

### Option B: Improved Keyword Matching (Not Recommended)

Continue adding edge cases to `extractCategory()`. This is a losing battle against LLM output variability.

---

## Existing Pattern: semantic-classifier.ts

The `semantic-classifier.ts` module already uses LLM for classification:

```
src/lib/semantic-classifier.ts
- classifyDimension() - Uses LLM to classify into 7 SoulCraft dimensions
- classifySignalType() - Uses LLM to classify signal types
```

This pattern should be applied consistently to the Ollama provider.

---

## Impact

**Current**: Minor - synthesis completes successfully due to Stage 3 null handling. One dimension classification was missed.

**Risk**: As synthesis scales, more classifications will fail, reducing dimension coverage and axiom quality.

---

## Acceptance Criteria

- [x] `extractCategory()` replaced with LLM-based classification or semantic similarity
- [x] "continuity" correctly maps to "continuity-growth"
- [x] No keyword/stemmer matching for category extraction
- [x] All existing tests pass
- [x] New tests for ambiguous category responses

---

## Related Files

- `src/lib/llm-providers/ollama-provider.ts:169-223` - Current implementation
- `src/lib/semantic-classifier.ts` - LLM-based classification pattern
- `docs/plans/2026-02-10-synthesis-bug-fixes.md` - Stage 2 added stemmer (now obsolete)

---

## Notes

The stemmer was added in Stage 2 of synthesis-bug-fixes as a quick fix. This issue documents the need for a proper LLM-based solution. The stemmer can remain as a fallback but should not be the primary classification mechanism.
