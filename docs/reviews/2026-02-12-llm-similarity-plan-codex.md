# LLM-Based Similarity Plan Review - Codex

**Date**: 2026-02-12
**Reviewer**: codex-gpt51-examiner (gpt-5.1-codex-max)
**Files Reviewed**:
- `/Users/twin2/Desktop/projects/multiverse/projects/neon-soul/docs/plans/2026-02-12-llm-based-similarity.md` (424 lines)
- Context: `src/lib/embeddings.ts`, `src/lib/matcher.ts`, `src/types/principle.ts`, `src/lib/llm-providers/ollama-provider.ts`

## Summary

The plan proposes replacing embedding-based similarity (@xenova/transformers + cosine similarity) with LLM-based semantic comparison to resolve ClawHub security scanner "Suspicious" rating. The approach is sound in principle but has a **critical gap**: the plan omits `ollama-provider.ts` which also depends on embeddings for semantic fallback in classification. Without addressing this, the security flag would persist.

## Findings

### Critical

**C-1: Embedding fallback in ollama-provider.ts not addressed** (plan:entire document)

The plan correctly identifies files to modify (`matcher.ts`, `embeddings.ts`, `pipeline.ts`, `principle-store.ts`, `reflection-loop.ts`) but omits `ollama-provider.ts` which has a direct dependency on embeddings:

```
ollama-provider.ts:30  import { embed } from '../embeddings.js';
ollama-provider.ts:31  import { cosineSimilarity } from '../matcher.js';
ollama-provider.ts:268-314  extractCategorySemantic() method uses embed() and cosineSimilarity()
```

**Impact**: After Stage 5 deletes `embeddings.ts`, the build would break. If the import is simply removed without replacing the semantic fallback logic, the Ollama provider loses robustness in classification. Either way, the plan is incomplete.

**Required action**: Stage 4 should explicitly include `ollama-provider.ts` with one of:
1. Remove the semantic fallback entirely (simplest, but reduces classification robustness)
2. Migrate `extractCategorySemantic()` to use the new LLM-based similarity
3. Accept that Ollama provider classification will have no fallback

### Important

**I-1: Prompt safety and validation gaps** (plan:Stage 1, lines 120-146)

The plan specifies LLM prompt design at high level but lacks guardrails for:
- Input escaping (untrusted text in prompts could inject instructions)
- Structured output enforcement (JSON schema, enum validation)
- Rejection handling (what if LLM returns "I cannot compare these"?)
- Temperature settings for determinism

**Impact**: Hostile inputs could steer matches or produce unparseable responses. Non-deterministic outputs could cause flaky tests.

**Recommendation**: Add acceptance criteria for prompt hardening:
- [ ] Inputs quoted/escaped to prevent injection
- [ ] Structured output with validation
- [ ] Graceful handling of refusals or parse failures
- [ ] Temperature=0 or equivalent for reproducibility

---

**I-2: Reliability not covered** (plan:Risk Mitigation section, lines 302-343)

Risk 2 (token usage) and Risk 3 (slower processing) mention batching and caching but the plan lacks:
- Timeout configuration for LLM similarity calls
- Retry/backoff strategy for transient failures
- Rate-limit handling
- Fallback behavior if LLM is unavailable

**Impact**: A transient LLM failure would break matching with no graceful degradation. This is worse than the current approach where embeddings work offline.

**Recommendation**: Add to Stage 1 acceptance criteria:
- [ ] Configurable timeout for similarity calls
- [ ] Retry with exponential backoff (max 3 attempts)
- [ ] Clear error propagation (not silent failure)
- [ ] Consider: caching comparison results for identical text pairs

---

**I-3: Quality calibration missing** (plan:Stage 2, lines 164-168)

The threshold mapping is unvalidated:
- Current: 0.85 cosine similarity
- Proposed: 0.7 confidence (mapped from "medium")

There is no benchmark, golden test set, or acceptance criteria measuring false positives/negatives after the change.

**Impact**: The new threshold could cause over-merging (false positives) or under-matching (false negatives) without detection. The plan's mitigation ("can tune based on testing") is vague.

**Recommendation**: Before Stage 7, add:
- Create golden dataset of ~20 signal/principle pairs with expected match results
- Run both systems (embedding + LLM) on golden dataset
- Acceptance: LLM matches >= embedding accuracy on golden dataset
- Document any behavior differences

### Minor

**M-1: Offline operation trade-off not documented** (plan:Trade-offs, lines 98-115)

The trade-offs table shows "Speed: Depends on LLM" but doesn't explicitly note:
- Current: Works offline with local embeddings
- Proposed: Requires live LLM connection

**Impact**: Users in offline scenarios (air-gapped, poor connectivity) would find the skill unusable after upgrade.

**Recommendation**: Add row to trade-offs table:
| Offline operation | Local (works offline) | Requires LLM connection |

---

**M-2: Version bump coordination incomplete** (plan:Stage 6-7, lines 250-299)

Stage 6 mentions bumping SKILL.md to 0.2.0 but Stage 7 mentions `package.json` as "optional". The plan should coordinate:
- `package.json` version
- `skill/SKILL.md` version
- `src/skill-entry.ts` version (if exists)
- CHANGELOG entry

**Recommendation**: Make package.json version bump mandatory in Stage 5 (alongside dependency removal) for consistency.

---

**M-3: grep pattern in Stage 7 could over-match** (plan:Stage 7, line 285)

```
grep -r "xenova|embedding" src/
```

This would match legitimate uses of "embedding" in comments, variable names, or documentation that aren't related to @xenova/transformers.

**Recommendation**: Use more specific patterns:
- `grep -r "@xenova/transformers" src/`
- `grep -r "from '../embeddings" src/`
- Check `package.json` has no xenova dependency

## Alternative Framing

**Is this solving the right problem?**

Yes, but with a caveat. The plan correctly identifies that the scanner's concern is third-party code execution, and removing the dependency addresses this directly. However:

- The scanner also flagged "git auto-commit" and "sensitive data access" (inherent to the skill's purpose)
- Achieving "Benign" may still require addressing git commit concerns
- The plan assumes LLM-based similarity will achieve "Benign" but this is unverified

**Unquestioned assumptions:**

1. **"Users have unlimited LLM access"** (Risk 2 mitigation) - Not all users are on Claude Code/OpenClaw. Token costs matter for some.

2. **"LLM semantic understanding may be BETTER"** - This is plausible but unvalidated. LLMs can have surprising failures on simple similarity tasks (e.g., "not X" vs "X").

3. **"Batch optimization reduces calls from O(n) to O(1)"** - True for multiple candidates, but the prompt design for batching is complex. If the LLM hallucinates an index or returns malformed output, recovery is harder than iterative comparison.

**Simpler alternatives?**

1. **Provide checksums as requested** - The scanner explicitly said this would upgrade confidence. This is ~2 hours of work vs. ~2 days for LLM migration. The plan acknowledges this in the issue file but dismisses it as "enterprise-grade verification."

2. **Keep embeddings, sandbox the dependency** - The scanner mentioned sandbox instructions as a path forward. Docker container for embedding inference could isolate @xenova/transformers.

3. **Hybrid approach** - Use text hash for exact dedup (Stage 3 proposes this), LLM only for fuzzy matching. Reduces LLM calls significantly.

## Questions for Plan Author

1. How should `ollama-provider.ts` semantic fallback be handled - migrate, remove, or acknowledge as breaking?

2. Is there a golden dataset or test suite that can validate the threshold change before shipping?

3. What is the expected user experience when LLM is unavailable (network down, rate limited)? Is "similarity matching fails entirely" acceptable?

4. Has the ClawHub team been consulted on whether removing @xenova/transformers alone will achieve "Benign", or are there other blockers?

## Recommendation

**Approve with revisions**. The plan is well-structured and the core approach is sound, but it needs:

1. **Critical fix**: Add `ollama-provider.ts` to Stage 4 with explicit decision on semantic fallback
2. **Important additions**: Prompt safety, reliability (timeout/retry), quality calibration
3. **Clarifications**: Offline trade-off, version coordination, verification patterns

Estimated additional scope: +20 lines plan, +50 lines implementation for reliability.

---

## Raw Output

<details>
<summary>Full CLI output</summary>

```
**Findings**
- Critical — Embedding fallback remains: `ollama-provider.ts` still calls `embed()`/cosine fallback for `extractCategorySemantic`; plan omits this path, so @xenova/transformers (or an equivalent) would remain referenced and the security flag would persist.
- Important — Prompt-safety/validation gaps: Plan lacks guardrails for LLM comparison prompts (escaping untrusted text, injection-resistant instructions, strict JSON/enum outputs, and rejection handling). Without this, hostile inputs could steer matches or produce unparseable responses.
- Important — Reliability not covered: No plan for timeouts, retries/backoff, rate-limit handling, or deterministic temperature settings for similarity calls; a transient LLM failure would currently break matching with no fallback or cache.
- Important — Quality calibration missing: Threshold swap (0.85 cosine → "medium"/0.7 confidence) is unvalidated; there's no benchmark against current behavior, golden test set, or acceptance criteria that measure false positives/negatives after the change.
- Minor — Operational/doc gaps: Removing local embeddings introduces a hard dependency on an online LLM; the plan doesn't document this trade-off or update all versioned artifacts (e.g., package version bump alongside SKILL.md) to reflect the breaking change.

**Questions**
- How should the plan handle the `ollama-provider.ts` semantic fallback—migrate it to LLM comparison or remove the fallback entirely?
- Do we have (or can we create) a small golden dataset to calibrate the new confidence threshold before shipping?

OpenAI Codex v0.63.0 (research preview)
model: gpt-5.1-codex-max
provider: openai
sandbox: read-only
reasoning effort: xhigh
tokens used: 8,757
```

</details>
