# PBD Alignment Stages 1-11 Twin Review Findings

**Date**: 2026-02-11
**Status**: Resolved
**Priority**: Medium
**Plan**: [docs/plans/2026-02-10-pbd-alignment.md](../plans/2026-02-10-pbd-alignment.md)

---

## Summary

Twin review (N=2: Technical + Creative) of the PBD alignment implementation (Stages 1-11) identified 0 critical issues, 3 important issues, and 6 minor improvements. Both twins approved the implementation with suggestions.

---

## Source Reviews

- [2026-02-11-pbd-alignment-stages1-11-twin-technical.md](../reviews/2026-02-11-pbd-alignment-stages1-11-twin-technical.md)
- [2026-02-11-pbd-alignment-stages1-11-twin-creative.md](../reviews/2026-02-11-pbd-alignment-stages1-11-twin-creative.md)

---

## Findings

### Important

#### I-1: Terminology Overlap - CORE/SUPPORTING in Both Taxonomies

**Source**: Creative (verified N=2)
**Files**: `src/types/signal.ts`, `src/types/principle.ts`, `docs/guides/*.md`

**Issue**: The term "CORE" appears in both Signal importance (`core`|`supporting`|`peripheral`) and Principle centrality (`foundational`|`core`|`supporting`). Similarly, "SUPPORTING" appears in both. This creates user confusion.

**Example**:
- Signal: "This is a CORE importance signal" (high weight)
- Principle: "This principle has CORE centrality" (middle tier, not top)

**Fix**: Rename centrality tiers to distinct vocabulary:
- `foundational` → `defining`
- `core` → `significant`
- `supporting` → `contextual`

**Files to update**:
- `src/types/principle.ts` - PrincipleCentrality type
- `src/lib/principle-store.ts` - computeCentrality function, thresholds
- `docs/ARCHITECTURE.md` - Centrality section
- `docs/architecture/synthesis-philosophy.md` - PBD Alignment section
- `docs/guides/essence-extraction-guide.md` - Centrality references

---

#### I-2: TENSIONING Stance Not Documented in Guides

**Source**: Creative (verified N=2)
**Files**: `docs/guides/single-source-pbd-guide.md`

**Issue**: The TENSIONING stance was added to `SignalStance` type and `STANCE_CATEGORIES` (I-1 fix from code review), but the extraction guides only document four stances: ASSERT, DENY, QUESTION, QUALIFY.

**Current** (single-source-pbd-guide.md lines 95-99):
```markdown
**Stance Categories**:
- **ASSERT**: Stated as true, definite ("I always...", "We must...")
- **DENY**: Stated as false, rejection ("I never...", "We don't...")
- **QUESTION**: Uncertain, exploratory ("I wonder if...", "Maybe...")
- **QUALIFY**: Conditional ("Sometimes...", "When X, I...")
```

**Fix**: Add TENSIONING to stance documentation:
```markdown
- **TENSIONING**: Value conflict, internal tension ("On one hand... but on the other...", "I want X but also Y", "Part of me... while another part...")
```

---

#### I-3: Weighted Convergence Needs Worked Example

**Source**: Creative (verified N=2)
**File**: `docs/guides/multi-source-pbd-guide.md`

**Issue**: The weighted convergence section (Step 4, lines 136-141) mentions importance weighting but lacks a concrete example showing the math.

**Current text mentions**:
- CORE signals get 1.5x weight
- PERIPHERAL signals get 0.5x weight

**Fix**: Add worked example table:
```markdown
### Weighted Tier Calculation Example

| Source | Signal Count | Importance | Weight | Weighted |
|--------|--------------|------------|--------|----------|
| A      | 1            | CORE       | 1.5x   | 1.5      |
| B      | 2            | SUPPORTING | 1.0x   | 2.0      |
| C      | 3            | PERIPHERAL | 0.5x   | 1.5      |
| **Total** |           |            |        | **5.0**  |

With 3 sources and weighted count 5.0, this principle qualifies as MAJORITY tier.
```

---

### Minor

#### M-1: Test Semantic Validation Gap

**Source**: Technical (verified N=2)
**File**: `tests/integration/pbd-alignment.test.ts`

**Issue**: Tests verify type correctness (result is valid stance/importance) but not semantic correctness (correct classification for input).

**Current**:
```typescript
expect(validStances).toContain(result); // Passes for ANY valid stance
```

**Suggestion**: Consider adding optional real-LLM tests or configurable mock with semantic rules. Document this limitation in test file header (already done via M-3 from code review).

---

#### M-2: Fallback Stance Change Not Explicitly Tested

**Source**: Technical (verified N=2)
**File**: `tests/integration/pbd-alignment.test.ts`

**Issue**: The M-2 fix changed default fallback from 'assert' to 'qualify', but no test explicitly verifies this fallback behavior. The existing test uses a mock that returns valid categories, so fallback path is never exercised.

**Suggestion**: Add test with mock configured to return null for all attempts:
```typescript
it('falls back to qualify when classification exhausts retries', async () => {
  const nullMock = createMockLLM({ alwaysReturnNull: true });
  const result = await classifyStance(nullMock, 'ambiguous text');
  expect(result).toBe('qualify');
});
```

---

#### M-3: Centrality Threshold Constants Not Exported

**Source**: Technical (verified N=2)
**File**: `src/lib/principle-store.ts`

**Issue**: `FOUNDATIONAL_THRESHOLD` (0.5) and `CORE_THRESHOLD` (0.2) are internal constants. Testing boundary behavior requires knowledge of these values.

**Suggestion**: Either:
1. Export constants for test validation, OR
2. Add comment explaining they are internal by design

---

#### M-4: Orphan Terminology Needs Gloss

**Source**: Creative (verified N=2)
**Files**: `docs/ARCHITECTURE.md`, `docs/architecture/synthesis-philosophy.md`

**Issue**: The term "orphan" is technical jargon. First use should include clarification.

**Fix**: Add parenthetical: "Orphaned signals (signals that did not cluster to any principle)"

---

#### M-5: Why Stance Matters - User Motivation

**Source**: Creative (verified N=2)
**File**: `docs/guides/single-source-pbd-guide.md`

**Issue**: The guide explains what stance is but not why users should care.

**Fix**: Add motivation sentence after stance categories:
```markdown
*Tagging stance ensures your tentative explorations don't get confused with your firm convictions during synthesis.*
```

---

#### M-6: Promote N-count vs Centrality Table

**Source**: Creative (verified N=2)
**File**: `docs/architecture/synthesis-philosophy.md` (lines 104-109)

**Issue**: The excellent table distinguishing N-count from centrality is buried in synthesis-philosophy.md. Users encounter centrality in essence-extraction but may not find this explanation.

**Suggestion**: Add the table to `docs/guides/essence-extraction-guide.md` in the centrality section, or link to it prominently.

---

## Action Items

| ID | Priority | Issue | Status |
|----|----------|-------|--------|
| I-1 | Important | Rename centrality tiers (FOUNDATIONAL→DEFINING, CORE→SIGNIFICANT, SUPPORTING→CONTEXTUAL) | ✅ resolved |
| I-2 | Important | Document TENSIONING stance in guides | ✅ resolved |
| I-3 | Important | Add weighted convergence worked example | ✅ resolved |
| M-1 | Minor | Document test semantic validation limitation | ✅ resolved (via code review M-3) |
| M-2 | Minor | Add fallback stance test | ✅ resolved |
| M-3 | Minor | Export or document centrality thresholds | ✅ resolved (documented as internal) |
| M-4 | Minor | Add orphan terminology gloss | ✅ resolved |
| M-5 | Minor | Add stance motivation sentence | ✅ resolved (with I-2) |
| M-6 | Minor | Promote N-count vs centrality table | ✅ resolved |

---

## Cross-References

- **Plan**: [docs/plans/2026-02-10-pbd-alignment.md](../plans/2026-02-10-pbd-alignment.md)
- **Code Review Findings**: [2026-02-11-pbd-alignment-stages1-11-code-review-findings.md](2026-02-11-pbd-alignment-stages1-11-code-review-findings.md) (resolved)
- **Technical Review**: [docs/reviews/2026-02-11-pbd-alignment-stages1-11-twin-technical.md](../reviews/2026-02-11-pbd-alignment-stages1-11-twin-technical.md)
- **Creative Review**: [docs/reviews/2026-02-11-pbd-alignment-stages1-11-twin-creative.md](../reviews/2026-02-11-pbd-alignment-stages1-11-twin-creative.md)
- **Architecture**: [docs/ARCHITECTURE.md](../ARCHITECTURE.md)
- **Synthesis Philosophy**: [docs/architecture/synthesis-philosophy.md](../architecture/synthesis-philosophy.md)

---

## Notes

All items verified to N=2 consensus. Both twins approved the implementation - these are refinements for user experience and documentation clarity, not blockers.

The most impactful fix is I-1 (terminology overlap) as it affects user comprehension across multiple docs. I-2 and I-3 are straightforward documentation additions.
