# Synthesis Runtime Bugs Review - Gemini

**Date**: 2026-02-10
**Reviewer**: gemini-2.5-pro (via Gemini CLI)
**Files Reviewed**:
- `projects/neon-soul/docs/issues/2026-02-10-synthesis-runtime-bugs.md`
- `projects/neon-soul/src/lib/reflection-loop.ts`
- `projects/neon-soul/src/lib/llm-providers/ollama-provider.ts`
- `projects/neon-soul/src/lib/principle-store.ts`
- `projects/neon-soul/src/lib/signal-generalizer.ts`

## Summary

The issue diagnosis is correct. Bug 1 (self-matching) is the root cause of Bug 3 (poor compression). The reflection loop incorrectly re-ingests the same signals every iteration, causing each signal to match its own principle (similarity=1.000) rather than clustering with related signals. Bug 2 (morphological matching) is a separate, correctly identified issue in the LLM category extraction logic.

## Findings

### Critical

**Finding 1: Reflection Loop Ingests Same Signals Repeatedly (Root Cause Confirmed)**

- **File**: `src/lib/reflection-loop.ts`, lines 163-173
- **Description**: The root cause for poor compression (Bug 1 and Bug 3) is correctly identified. The main `for` loop calls `store.addGeneralizedSignal` on the same set of `generalizedSignals` in every iteration. Because `generalizeSignalsWithCache` returns the same cached results, each signal is re-processed.

  In `principle-store.ts`, a signal will find the principle it created in the previous iteration with a perfect similarity score of `1.0`, causing it to "reinforce" itself instead of clustering with other, conceptually similar signals. This effectively prevents the intended compression.

- **Recommendation**: **Option C is correct**: Restructure the function to ingest signals only once, outside the iterative loop. The loop's responsibility should be the *refinement* of principles and axioms (via threshold tightening), not repeated ingestion.

  **Suggested Refactor Structure:**
  ```
  Phase 1: Generalize signals ONCE (before loop)
  Phase 2: Add to PrincipleStore ONCE (before loop)
  Phase 3: Iterate for refinement (threshold adjustment, compression, convergence detection)
  ```

  This preserves N-count accumulation (not Option A) while avoiding repeated signal addition (fixes Option B's complexity). Signals are ingested once; subsequent iterations only refine thresholds and recompute axioms.

### Important

**Finding 2: Morphological Weakness in LLM Category Extraction**

- **File**: `src/lib/llm-providers/ollama-provider.ts`, lines 164-193
- **Description**: The analysis of Bug 2 is correct. The `extractCategory` method's reliance on exact and substring matching makes it brittle. It cannot handle morphological variations like "believe" vs. "belief", leading to incorrect fallbacks with confidence=0.30.

- **Recommendation**: **Option A (stemmer library)** is the most robust solution. A stemmer reduces words to their root form, allowing reliable matching of morphological variants.

  Alternative: **Option C (prompt variants)** is simpler but requires manual maintenance of variant lists. Suitable as a quick fix if stemmer integration is deferred.

  Levenshtein distance (Option B) may produce false positives for unrelated short words. Stemming is more semantically accurate.

**Finding 3: Inefficient Brute-Force Search in Principle Store**

- **File**: `src/lib/principle-store.ts`, lines 273-283
- **Description**: The `addGeneralizedSignal` function iterates through every existing principle to find the one with the highest cosine similarity. This is O(N*M) for adding N signals to M principles.

  While acceptable for current scale (~50-100 signals), this will become a performance bottleneck at scale (1000+ principles).

- **Recommendation**: For future scalability, consider approximate nearest neighbor (ANN) search (e.g., `hnswlib-node`, `faiss-node`). This is **not blocking** for the current bug fix but flagged for architecture consideration.

### Minor

**Finding 4: Hardcoded Model Name in Reflective Loop**

- **File**: `src/lib/reflection-loop.ts`, line 164
- **Description**: The call to `generalizeSignalsWithCache` uses a hardcoded model name `'ollama'`. This reduces flexibility for testing with different models.

- **Recommendation**: Promote `model` to `ReflectiveLoopConfig` with a default value. Minor improvement for testability.

**Finding 5: Synthetic Confidence Scores**

- **File**: `src/lib/llm-providers/ollama-provider.ts`, lines 219-224
- **Description**: Confidence scores (0.85, 0.30, 0.10) are documented as synthetic indicators, not derived from actual LLM response patterns. This is correctly documented but worth noting.

- **Recommendation**: No immediate action. The documentation is honest about the limitation. Future enhancement could derive actual confidence from token probabilities if the LLM provider supports it.

## Alternative Framing Assessment

**Is the overall approach correct?**

Yes, with the Bug 1 fix. The iterative refinement approach (threshold tightening per iteration) is sound for progressive clustering. The flaw was in the implementation (re-ingestion), not the architecture.

**Unquestioned assumptions reviewed:**

1. **Cache is correct**: Yes, the cache behavior in `signal-generalizer.ts` is correct. Returning identical generalizations for the same signals is expected. The bug is in how the loop uses those cached results.

2. **Threshold tightening works**: Yes, but only if signals are not re-added. With the fix, later iterations will use stricter thresholds, and only strong matches will reinforce existing principles.

3. **Centroid update is correct**: Yes, the running average centroid update in `principle-store.ts:49-59` is mathematically correct and normalizes after update.

4. **N-count accumulation intent**: The design intent (N-counts accumulate across iterations) was correct but defeated by self-matching. With the fix, N-counts will reflect actual cross-signal clustering.

## Fix Priority

1. **Bug 1** (Critical): Move signal ingestion outside the loop. Expected outcome: signals create principles in single pass, then iterations refine compression. Compression ratio should improve from 1.11:1 to ~3:1 or better.

2. **Bug 2** (Important): Add stemming to `extractCategory`. Can be addressed independently. Improves classification accuracy for edge cases.

3. **Finding 3** (Deferred): ANN search optimization. Not needed for current scale but worth tracking for future.

## Raw Output

<details>
<summary>Full CLI output</summary>

```
Of course. Here is the code review based on the provided information.

### Code Review Findings

This review confirms the core issues outlined in the summary and provides specific recommendations for remediation. The findings are categorized by severity.

---

### **Critical**

#### **Finding 1: Reflection Loop Ingests Same Signals Repeatedly, Preventing Compression**

*   **Severity**: `Critical`
*   **File**: `src/lib/reflection-loop.ts`, lines 90-92
*   **Description**:
    The root cause for the poor compression ratio (Bug 1 and Bug 3) is correctly identified. The main `for` loop calls `store.addGeneralizedSignal` on the same set of `generalizedSignals` in every iteration. Because `generalizeSignalsWithCache` returns the same cached results, each signal is re-processed.

    In `principle-store.ts`, a signal will find the principle it created in the previous iteration with a perfect similarity score of `1.0`, causing it to "reinforce" itself instead of clustering with other, conceptually similar signals. This effectively prevents the intended compression.

*   **Recommendation**:
    The best fix is **Option C**: restructure the function to ingest signals only once, outside the iterative loop. The loop's responsibility should be the *refinement* of principles and axioms, not repeated ingestion.

    **Example Refactor:**

    ```typescript
    // in src/lib/reflection-loop.ts

    export async function runReflectiveLoop(
      // ...
    ): Promise<ReflectiveLoopResult> {
      // ... (config and setup) ...
      const store = createPrincipleStore(llm, principleThreshold);

      // --- START REFACTOR ---

      // Phase 1: Ingest signals ONCE at the beginning
      const generalizationStart = Date.now();
      const generalizedSignals = await generalizeSignalsWithCache(llm, signals, 'ollama');
      const generalizationMs = Date.now() - generalizationStart;
      logger.debug(`[reflection-loop] Generalized ${signals.length} signals in ${generalizationMs}ms`);

      for (const generalizedSignal of generalizedSignals) {
        await store.addGeneralizedSignal(generalizedSignal, generalizedSignal.original.dimension);
      }

      // Phase 2: Iteratively refine principles and axioms
      for (let i = 0; i < maxIterations; i++) {
        const iterationStart = Date.now();
        const iterationNum = i + 1;

        // The core refinement logic (e.g., threshold adjustment, re-compression) remains here.
        const iterationThreshold = principleThreshold + i * 0.02;
        store.setThreshold(iterationThreshold);

        const principles = store.getPrinciples();
        const compression = await compressPrinciples(llm, principles, axiomNThreshold);
        const axioms = compression.axioms;

        // ... (convergence detection, trajectory tracking, etc.) ...
      }
      // --- END REFACTOR ---

      // ... (return final result) ...
    }
    ```

---

### **Important**

#### **Finding 2: Morphological Weakness in LLM Category Extraction**

*   **Severity**: `Important`
*   **File**: `src/lib/llm-providers/ollama-provider.ts`, lines 172-191
*   **Description**:
    The analysis of Bug 2 is correct. The `extractCategory` method's reliance on exact and substring matching makes it brittle. It cannot handle morphological variations like "believe" vs. "belief", leading to incorrect fallbacks.

*   **Recommendation**:
    The most robust and standard solution is **Option A**: integrate a stemmer library. A stemmer reduces words to their root form, allowing for reliable matching of morphological variants.

    **Example using `porter-stemmer`:**
    1.  Add the library: `npm install porter-stemmer`
    2.  Update the extraction logic:

    ```typescript
    // in src/lib/llm-providers/ollama-provider.ts
    import { stemmer } from 'porter-stemmer';

    // ...

    private extractCategory<T extends string>(
      response: string,
      categories: readonly T[]
    ): T | null {
      const normalizedResponse = response.toLowerCase().trim();
      const stemmedResponse = stemmer(normalizedResponse.split(' ')[0]); // Stem the first word for better accuracy

      for (const category of categories) {
        const stemmedCategory = stemmer(category.toLowerCase().replace('-', ' '));
        if (normalizedResponse.includes(category.toLowerCase())) {
          return category;
        }
        // Add a check for stemmed versions
        if (stemmedResponse === stemmer(category.toLowerCase())) {
            return category;
        }
      }

      // ... (existing fuzzy match can remain as a final fallback) ...

      return null;
    }
    ```
    *Note: The stemming logic may need refinement (e.g., stemming the most likely candidate word from the response rather than just the first), but this illustrates the core concept.*

#### **Finding 3: Inefficient Brute-Force Search in Principle Store**

*   **Severity**: `Important`
*   **File**: `src/lib/principle-store.ts`, lines 276-282
*   **Description**:
    The `addGeneralizedSignal` function iterates through every existing principle to find the one with the highest cosine similarity. This is a linear, brute-force search. While acceptable for a small number of principles, this approach will become a significant performance bottleneck as the system scales, with a time complexity of O(N*M) for adding N signals to a store with M principles.

*   **Recommendation**:
    For scalability, replace the linear scan with an approximate nearest neighbor (ANN) search algorithm. Libraries like `hnswlib-node` or `faiss-node` can create a vector index of the principle embeddings, allowing for much faster queries (typically logarithmic time). This is a forward-looking improvement that addresses the unquestioned assumption that a linear scan is sufficient.

---

### **Minor**

#### **Finding 4: Hardcoded Model Name in Reflective Loop**

*   **Severity**: `Minor`
*   **File**: `src/lib/reflection-loop.ts`, line 86 (in original code)
*   **Description**:
    The call to `generalizeSignalsWithCache` uses a hardcoded model name, `'ollama'`. This reduces the flexibility of the function and makes it harder to test with different models.

*   **Recommendation**:
    Promote the `model` parameter to be part of the `ReflectiveLoopConfig` object, allowing it to be passed in dynamically.

    ```typescript
    // in src/lib/reflection-loop.ts
    export interface ReflectiveLoopConfig {
      // ...
      modelName: string; // Add model name to config
    }

    export const DEFAULT_REFLECTIVE_CONFIG: ReflectiveLoopConfig = {
      // ...
      modelName: 'ollama', // Set a default
    };

    // ... later in runReflectiveLoop ...
    const generalizedSignals = await generalizeSignalsWithCache(llm, signals, mergedConfig.modelName);
    ```
```

</details>

---

*Review generated by Gemini 2.5 Pro via gemini CLI*
