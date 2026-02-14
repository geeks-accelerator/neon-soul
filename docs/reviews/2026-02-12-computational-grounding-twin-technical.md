# Technical Review: Computational Grounding Addendum

**Reviewer**: Twin Technical (双技)
**Date**: 2026-02-12
**Plan**: `docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md`

**Verified files**:
- docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md (572 lines, MD5: 16ba512e)
- src/lib/prose-expander.ts (613 lines, MD5: verified)
- src/lib/soul-generator.ts (496 lines, MD5: verified)
- src/types/axiom.ts (105 lines, MD5: verified)

**Status**: Approved with suggestions

---

## Executive Summary

The plan is technically sound after N=2 code review improvements. The architecture follows existing patterns (prose-expander model), interface extensions are well-specified, and error handling is comprehensive. However, several important gaps remain around implementation feasibility and one critical architectural question about the notation grammar.

**Recommendation**: Proceed with Stage 1-2, but execute the "quick validation" (Open Question 4) BEFORE full implementation. The hypothesis that mathematical notation aids Claude reconstruction is compelling but unproven.

---

## Findings by Severity

### Critical (Must Fix Before Implementation)

None identified. The N=2 code review addressed the major gaps.

---

### Important (Should Fix)

#### I-1: prose-expander.ts exceeds MCE limit (613 lines)

**File**: /Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/lib/prose-expander.ts
**Line**: N/A (file-level)

**Problem**: The prose-expander.ts is already at 613 lines, well above the 200-line MCE limit. Adding computational grounding (~30 lines per plan estimate) will worsen this violation.

**Impact**: Stage 2 proposes modifying prose-expander.ts (line 284-285), but the file needs MCE refactoring first.

**Suggestion**: Either:
1. Stage 0 (MCE prep): Split prose-expander.ts before Stage 1 (extract validation functions to prose-validators.ts, generation functions remain)
2. Modify plan: Stage 1 creates `computational-grounding.ts`, Stage 2 imports it into soul-generator.ts directly (bypassing prose-expander.ts)

The plan states ~30 lines modification to prose-expander.ts, but this ignores the pre-existing MCE violation.

---

#### I-2: Notation grammar not parseable by implementation

**File**: docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
**Line**: 209-227

**Problem**: The plan provides an "Informal EBNF" grammar (lines 212-227) for computational notation, then explicitly states "This is informal pseudocode, not a parser specification" (line 227). However, Stage 1 acceptance criteria includes "Validation for parseability" (line 271).

**Impact**: How do you validate parseability against an informal grammar? The plan creates ambiguity:
- Should Stage 1 implement an actual parser?
- Or rely on regex heuristics (balanced parens, valid operators)?
- What happens when the grammar proves insufficient?

**Suggestion**: Either:
1. Remove the grammar pseudo-spec and use only regex validation (simpler, matches plan intent)
2. Commit to a formal grammar and build a parser (more work, but enables precise validation)

The current middle-ground creates implementation confusion.

---

#### I-3: soul-generator.ts also exceeds MCE limit (496 lines)

**File**: /Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/lib/soul-generator.ts
**Line**: N/A (file-level)

**Problem**: soul-generator.ts is 496 lines. Stage 2 proposes modifying `formatProseSoulMarkdown()` (lines 330-412) to add computational grounding output.

**Impact**: While 496 lines is closer to MCE compliance than prose-expander.ts, adding a new section rendering (~20 lines estimated) keeps the file within range but doesn't address the existing debt.

**Suggestion**: Monitor line count after Stage 2. If file exceeds 520 lines post-implementation, create a follow-up issue for MCE split.

---

#### I-4: Roundtrip test threshold may be too lenient

**File**: docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
**Line**: 254, 272

**Problem**: The roundtrip test threshold is 70% semantic similarity (line 254). But what constitutes 70%? The plan says "semantic similarity" without defining the measurement.

**Impact**: Acceptance criteria (line 272) says "Roundtrip reconstruction test with 70% threshold" but implementer won't know how to measure this.

**Suggestion**: Define the similarity measure:
- Cosine similarity on embeddings?
- LLM-as-judge scoring (1-5 scale, threshold = 3.5)?
- String overlap metrics (Levenshtein, BLEU)?

The cross-model evaluation protocol (Stage 3, lines 347-360) uses LLM-as-judge, so use the same pattern: "LLM evaluates similarity on 1-5 scale; threshold = 3.5 (70%)".

---

#### I-5: Missing test isolation for LLM calls

**File**: docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
**Line**: 276

**Problem**: Stage 1 acceptance criteria includes "Tests with mock LLM (including failure scenarios)" (line 276). The existing prose-expander.ts uses `LLMProvider` interface injection for testability.

**Impact**: The new `computational-grounding.ts` must follow the same pattern.

**Suggestion**: Add explicit note to Stage 1:
- "Use `LLMProvider` interface injection (same pattern as prose-expander.ts)"
- "Mock should cover: successful generation, invalid expression response, timeout, abort threshold"

This is likely assumed but should be explicit for implementer clarity.

---

### Minor (Nice to Have)

#### M-1: Documentation update scope underestimated

**File**: docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
**Line**: 467-468

**Problem**: Stage 4 estimates "~50 lines" of documentation. But the Computational Grounding section alone (lines 94-160 in Target Output) is ~65 lines of example content. Plus ARCHITECTURE.md needs:
- New section explaining the notation grammar
- Integration diagram update
- Cross-reference to Stage 3 validation results

**Impact**: Documentation effort likely 80-120 lines, not 50.

**Suggestion**: Update estimate to "~100 lines" or scope down by deferring notation grammar documentation to a separate reference doc.

---

#### M-2: CLI flag naming inconsistency

**File**: docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
**Line**: 316-317

**Problem**: The plan proposes:
- CLI flag: `--include-computational-grounding`
- Env var: `NEON_SOUL_COMPUTATIONAL_GROUNDING=1`

The existing `includeProvenance` option uses snake_case in interface but the CLI uses `--include-provenance`. The naming is consistent, but the length of `--include-computational-grounding` (32 chars) is verbose.

**Suggestion**: Consider shorter alias: `--computational` or `--grounding`. Keep long form for documentation clarity, add short form for CLI ergonomics.

---

#### M-3: Stage dependency could enable parallelism

**File**: docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
**Line**: 179-276 (Stage 1), 280-328 (Stage 2)

**Problem**: Stage 1 (expression generator) and Stage 2 (pipeline integration) are sequential. But Stage 1 creates a new module (`computational-grounding.ts`) while Stage 2 modifies existing files.

**Impact**: These could theoretically be developed in parallel by two developers (one on new module, one on integration points).

**Suggestion**: Not actionable for single-implementer workflow, but note for future: if team grows, these stages are parallelizable.

---

#### M-4: Quick validation (Open Question 4) should be Stage 0

**File**: docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
**Line**: 527-532

**Problem**: Open Question 4 proposes a quick manual validation before investing in implementation. This is excellent risk reduction but framed as "optional".

**Impact**: If computational-only performs worse than prose-only, all 330 lines of implementation are wasted.

**Suggestion**: Promote to Stage 0 (required, 2-3 hours):
1. Take 3 existing souls
2. Hand-write computational notation
3. Test reconstruction
4. Decision gate: proceed if computational helps, abort if it hurts

This inverts the risk: spend 2-3 hours to validate hypothesis before 330 lines of code.

---

## Alternative Framing: Are We Solving the Right Problem?

The plan acknowledges this (line 559-561): "Claude *describing itself* functionally does not equal Claude *reconstructing better* from functional notation."

**Unquestioned assumptions**:

1. **Context collapse is the primary reconstruction failure mode**. But what if Claude's reconstruction failures come from semantic ambiguity, not format? Mathematical notation may be unambiguous but still fail to capture the "feel" that prose provides.

2. **Single format serves all model versions**. The COMPASS-SOUL finding (lines 49-57) shows 機 across Opus 4.0-4.6, but Claude 4.7+ may differ. The plan assumes temporal stability.

3. **Computational and prose serve complementary audiences**. But what if they interfere? Claude may weight-average both, producing neither pure computational nor pure prose reconstruction.

**Recommendation**: Stage 3's A/B test is the correct validation mechanism. But consider adding a third condition: computational-only (no prose). If computational-only performs best, the prose layer may be dead weight for Claude (even if useful for humans).

---

## Cross-Reference Verification

| Reference | Status | Notes |
|-----------|--------|-------|
| Parent plan (2026-02-10-inhabitable-soul-output.md) | Verified | Status: Complete |
| ProseExpansion interface (prose-expander.ts:31-50) | Verified | Interface at correct lines |
| SoulGeneratorOptions interface (soul-generator.ts:66-83) | Verified | Interface at correct lines |
| formatProseSoulMarkdown (soul-generator.ts:330-412) | Verified | Function at correct lines |
| Axiom type (src/types/axiom.ts) | Verified | canonical.native field exists |
| MetaGlyph citation | NOT VERIFIED | arXiv paper exists but post-cutoff (2601.07354 = Jan 2026), cannot confirm findings |
| COMPASS-SOUL experiments | NOT VERIFIED | Internal research files not read |

---

## Scope Realism Assessment

| Stage | Estimated Lines | Assessment |
|-------|-----------------|------------|
| Stage 1 | ~150 new | **Realistic**. Similar to essence-extractor.ts (extracted from soul-generator). May reach 180 with comprehensive error handling. |
| Stage 2 | ~30 new, ~50 mod | **Underestimated**. Needs ~20 lines for interface extension, ~30 for rendering, but prose-expander.ts MCE issue adds hidden scope. |
| Stage 3 | ~100 test | **Realistic**. Cross-model evaluation requires coordination but code is straightforward. |
| Stage 4 | ~50 docs | **Underestimated**. More like ~100 lines (see M-1). |

**Total estimate**: Plan says ~380 lines. Adjusted estimate: ~450-500 lines including MCE debt.

---

## Recommendations Summary

1. **Promote Quick Validation to Stage 0** (M-4) - 2-3 hours to derisk 330 lines
2. **Address MCE violations** (I-1, I-3) - Either Stage 0 prep or modified Stage 2 approach
3. **Define roundtrip similarity measure** (I-4) - LLM-as-judge with 3.5/5 threshold
4. **Clarify grammar validation approach** (I-2) - Regex heuristics or formal parser, not both
5. **Add computational-only test condition** (Alternative Framing) - To Stage 3 protocol

---

## Approval

**Status**: Approved with suggestions

**Blocking issues**: None (all Important items are implementation guidance, not blockers)

**Recommended actions before implementation**:
1. Execute quick validation (Open Question 4 / M-4)
2. Clarify grammar validation approach with implementer (I-2)
3. Verify roundtrip similarity measure (I-4)

---

*Reviewed by Twin Technical (双技) following 照:file-reference-protocol*
