---
created: 2026-02-09
type: twin-review
reviewer: twin-technical
plan: docs/plans/patent-skills/2026-02-09-principle-normalization-update.md
status: complete
verdict: approved-with-suggestions
---

# Technical Review: Principle Normalization Update Plan

## Verification

**Verified files**:
- docs/plans/patent-skills/2026-02-09-principle-normalization-update.md (441 lines)
- docs/issues/patent-skills/2026-02-09-principle-normalization-plan-findings.md (281 lines)
- projects/obviously-not/patent-skills/pbe-extractor/SKILL.md (228 lines)
- projects/obviously-not/patent-skills/essence-distiller/SKILL.md (207 lines)
- projects/obviously-not/patent-skills/principle-comparator/SKILL.md (241 lines)
- projects/obviously-not/patent-skills/principle-synthesizer/SKILL.md (267 lines)
- projects/live-neon/neon-soul/docs/plans/2026-02-09-signal-generalization.md (704 lines)

**Status**: Approved with Suggestions

---

## Executive Summary

The plan addresses a real problem (semantic equivalence detection failure) with a sound approach (LLM-based normalization). The N=2 code review (Codex + Gemini) already caught 12 issues, 6 of which were marked addressed in the plan. The plan applies validated learnings from neon-soul's signal generalization work (5:1 compression demonstrated).

**Key strength**: The plan avoids embedding-based similarity, maintaining OpenClaw compatibility.

**Key concern**: The plan under-specifies operational aspects that will matter at runtime.

---

## Findings

### Critical (Must Address)

None identified. The N=2 code review addressed the most critical gaps.

---

### Important (Should Address)

#### 1. Hash Key Collision Risk in Normalization Cache

**Location**: Lines 344-350

**Problem**: Cache key is `hash(lowercase(trim(original_text)))`. This creates collision risk:
- "I value honesty" and "i value honesty" → same key (correct, intended)
- Two different 300-character principles that hash-collide → incorrect cache hit

**Risk**: Rare but silent corruption of N-counts.

**Suggestion**: Use full SHA-256 hash instead of truncated hash, or include text length in key:
```
Key: hash(lowercase(trim(original_text)) + ":" + text_length)
```

**Severity**: Important (low probability, high impact)

---

#### 2. Missing Normalization Version in Cache Key

**Location**: Lines 344-350

**Problem**: Cache key does not include prompt version or normalization rules version. If normalization rules change (e.g., adding a 5th verb), cached forms become stale.

**Comparison**: neon-soul's VCR pattern (line 266 of signal-generalization.md) includes `PROMPT_VERSION` in fixture keys for exactly this reason.

**Suggestion**: Add version to cache key:
```
Key: hash(lowercase(trim(original_text))) + ":" + NORMALIZATION_VERSION
```

Or invalidate entire cache on version bump (explicit migration step).

**Severity**: Important (silent drift over time)

---

#### 3. No Conflict Resolution for N=2 Alignment

**Location**: Lines 217-229

**Problem**: When Source A's "Values truthfulness over comfort" aligns with Source B's "Values honesty above all", the comparator outputs `normalized_form: "Values truthfulness in communication"`. But which normalized form wins? The plan doesn't specify:
- Use Source A's normalized form?
- Use Source B's normalized form?
- Create a new canonical form from both?

**Comparison**: neon-soul selects "most representative original signal" as cluster label (line 525). Similar strategy needed here.

**Suggestion**: Add explicit resolution rule:
```markdown
**Normalized Form Selection**:
When two principles align, use the normalized form that:
1. Is more abstract (broader applicability)
2. Has higher confidence
3. (Tie-breaker) Comes from Source A
```

**Severity**: Important (affects reproducibility)

---

#### 4. MEANING_DRIFT Lacks Quantitative Threshold

**Location**: Lines 376-389

**Problem**: "Normalized meaning differs significantly" is subjective. How does the LLM decide when drift occurs?

**Examples of ambiguity**:
- "Keep functions under 50 lines" -> "Values concise units (~50 lines)" = OK
- "Keep functions under 50 lines" -> "Values brevity" = Drift? Maybe?
- "Keep functions under 50 lines" -> "Values efficiency" = Drift? Definitely?

**Comparison**: The N=2 findings already addressed the over-generalization magnitude issue (Finding #2), but MEANING_DRIFT mechanism still lacks threshold.

**Suggestion**: Add heuristic criteria:
```markdown
**MEANING_DRIFT triggers when**:
- Normalized form omits explicit constraints (numbers, conditions)
- Core action verb changes meaning (e.g., "avoid" → "prefer")
- Domain narrowing or broadening occurs (e.g., "code" → "work")
```

**Severity**: Important (hard to test without threshold)

---

#### 5. Synthesizer N-Count Calculation Across Heterogeneous Inputs

**Location**: Lines 269-320 (Stage 5)

**Problem**: Principle-synthesizer can receive inputs from:
- pbe-extractor (already has normalized_form)
- essence-distiller (already has normalized_form)
- principle-comparator (already has shared_principles with normalized_form)
- Raw text (no normalized_form)

When combining pre-normalized inputs with raw text, what happens?
- Re-normalize everything (wastes tokens, may produce different forms)?
- Trust existing normalized forms (may have version drift)?

**Suggestion**: Add handling rules:
```markdown
**Input Normalization Policy**:
1. If input has `normalized_form` + matching `normalization_version`: Use as-is
2. If input has `normalized_form` + old version: Re-normalize (flag version drift)
3. If input lacks `normalized_form`: Normalize before comparison
```

**Severity**: Important (pipeline consistency)

---

### Minor (Nice to Have)

#### 6. Prompt Template Not Version-Tagged

**Location**: Lines 354-369

**Problem**: The prompt template is inline in the plan. When implemented, it should be versioned (as neon-soul does with `PROMPT_VERSION`).

**Suggestion**: Note that implementation should use versioned prompt file:
```markdown
**Implementation Note**: Store prompt in `prompts/normalize-principle.md` with semantic version header.
```

---

#### 7. Error Table Missing CACHE_MISS Error

**Location**: Lines 372-379

**Problem**: The error table has `NORMALIZATION_FAILED` and `MEANING_DRIFT`, but cache operations can also fail (e.g., corrupt cache file, I/O error).

**Suggestion**: Add:
```
| `CACHE_ERROR` | Cache read/write fails | Log warning, proceed without cache |
```

---

#### 8. Voice Preservation Display Modes Not Prioritized

**Location**: Lines 327-334

**Problem**: Three voice preservation options listed but no recommendation on which to implement first.

**Comparison**: neon-soul recommends Option A (lines 525-527).

**Suggestion**: Mark Option 1 as recommended:
```markdown
1. **Normalize for matching** - Use normalized form to detect semantic equivalence
2. **Display original** - Show user's actual words in output (RECOMMENDED for MVP)
3. **Track variants** - Keep all original phrasings that contributed to N-count
```

---

#### 9. Verification Scenarios Should Test MEANING_DRIFT Path

**Location**: Lines 401-418

**Problem**: Verification tests happy path only. No test for MEANING_DRIFT detection.

**Suggestion**: Add test case:
```markdown
**Test 3 (MEANING_DRIFT detection)**:
- Input: "Never use mutable global state in concurrent Go programs"
- Expected normalized: "Avoids shared mutable state in concurrent contexts (~Go)"
- If normalized drops "concurrent" or "Go" context → MEANING_DRIFT flagged
```

---

#### 10. Plan Line Count at 441 Lines

**Observation**: Plan is 441 lines, which is reasonable for a 5-stage update plan but near the upper bound of recommended plan size (计:cjk-summary suggests 200-300 for features, 300-400 for migrations).

**Mitigation**: The prior N=2 code review likely inflated the plan with addressed findings. This is acceptable post-review.

---

## Architecture Assessment

### Strengths

1. **LLM-only approach**: Avoids embedding infrastructure dependency, maintaining OpenClaw compatibility.

2. **Caching strategy**: Addresses LLM non-determinism (Finding #5 from N=2 review).

3. **Error status field**: `normalization_status: success|failed|drift` provides clear audit trail.

4. **Staged updates**: Each skill updated independently with clear acceptance criteria.

5. **neon-soul cross-pollination**: Applies validated patterns (5:1 compression demonstrated).

### Concerns

1. **No performance budget**: How long should normalization take? What's acceptable latency per principle?

2. **No fallback for LLM outage**: If LLM is unavailable, do we skip normalization entirely or error?

3. **Cache storage unspecified**: JSON files per source, but where? Git-committed or ephemeral?

---

## Testing Gap Analysis

### What's Covered

- Happy path normalization (before/after examples)
- Semantic alignment positive case
- Non-alignment case (speed != safety)

### What's Missing

1. **MEANING_DRIFT trigger cases** (when normalization loses meaning)
2. **Cache collision edge cases** (same hash, different text)
3. **Version migration** (old cache + new normalization rules)
4. **Cross-skill consistency** (same principle through pbe-extractor vs essence-distiller produces same normalized form)
5. **Concurrent normalization** (two processes normalizing same principle)

---

## Alternative Framing Check

**Are we solving the right problem?**

Yes. The plan correctly identifies that surface-level text variation (pronouns, phrasing) obscures semantic equivalence. Normalization is a standard NLP preprocessing step. The plan's insight that "raw principle text carries surface-level variation" matches the observed 1:1 signal-to-axiom ratio in neon-soul.

**What assumptions go unquestioned?**

1. **LLM normalization is deterministic enough**: Mitigated by caching, but untested at scale. What if cache grows to 10K+ entries?

2. **"Values X" format is universal**: Some principles may resist (e.g., "When X, do Y" conditionals). The plan acknowledges this (Rule 4 preserves conditionals) but examples are limited.

3. **100-character limit is appropriate**: Already flagged in N=2 review (Finding #8), softened to "ideally under 100 characters." Good.

4. **Four verbs suffice**: Values, Prioritizes, Avoids, Maintains. What about "Expects", "Ensures", "Rejects"? May need expansion.

**Is the approach fundamentally wrong?**

No. This is incremental improvement to existing skills, not a risky architectural change. The neon-soul validation (5:1 compression) provides evidence the approach works.

---

## Cross-Reference Validation

- [x] Plan references N=2 code review findings issue
- [x] Plan references Codex and Gemini reviews
- [x] Plan references neon-soul learning source
- [x] Skill files exist at specified locations
- [x] Output schemas include new fields

---

## Recommendations

### Before Implementation

1. **Add normalization version to cache key** (Finding #2)
2. **Specify N=2 alignment conflict resolution** (Finding #3)
3. **Add quantitative MEANING_DRIFT criteria** (Finding #4)

### During Implementation

4. **Add MEANING_DRIFT test case to verification** (Finding #9)
5. **Version-tag the prompt template** (Finding #6)
6. **Add CACHE_ERROR handling** (Finding #7)

### After Implementation

7. **Test cross-skill consistency** (same principle, different extraction path)
8. **Monitor cache growth** (set upper bound or LRU eviction)
9. **Collect fallback rate metrics** (target <10%)

---

## Verdict

**Approved with Suggestions**

The plan is technically sound and well-informed by prior reviews. The 6 "Important" findings from the N=2 code review were addressed. My additional findings are mostly operational edge cases that can be addressed during implementation.

The approach is correct: LLM-based normalization with caching is the right solution for semantic equivalence detection in a multi-skill pipeline. The neon-soul validation provides empirical confidence.

**Blocking items**: None.

**High-priority items**: Findings #2 (version in cache key) and #3 (conflict resolution) should be addressed before Stage 4 (synthesizer), as N-count accuracy depends on consistent normalization.

---

*Review completed 2026-02-09 by Twin Technical (claude-opus-4.5)*
