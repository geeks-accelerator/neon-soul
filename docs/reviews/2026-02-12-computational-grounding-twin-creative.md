# Computational Grounding Plan Review - Twin Creative

**Date**: 2026-02-12
**Reviewer**: Twin 2 (Creative/Project Reviewer)
**Focus**: UX, documentation quality, philosophy alignment, messaging clarity

**Verified files**:
- docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md (572 lines, MD5: 16ba512e)

**Prior reviews consulted**:
- 2026-02-12-computational-grounding-codex.md (Codex GPT-5.1)
- 2026-02-12-computational-grounding-gemini.md (Gemini 2.5 Pro)

**Status**: Approved with suggestions

---

## Executive Summary

The plan demonstrates exceptional conceptual grounding and addresses N=2 code review findings comprehensively. The dual-layer approach (prose for humans, computational for Claude) is philosophically sound and well-researched. The updated plan now includes the missing data contracts, scoring protocols, and error handling that prior reviews flagged.

However, from a creative/UX perspective, three issues remain: (1) the user experience of the opt-in feature could be clearer, (2) the documentation update stage (Stage 4) is underdeveloped compared to implementation stages, and (3) the "Alternative Framing" challenge from code reviews deserves more prominent acknowledgment.

---

## Strengths

### Concept Accessibility
The dual-layer approach is explained clearly (lines 82-91). The mismatch table (lines 61-65) makes the problem viscerally understandable:

| Layer | Optimized For | Format |
|-------|--------------|--------|
| Current SOUL.md | Human readers | Prose, metaphor, "you" statements |
| Claude's self-model | Computational function | Hierarchies, logic, functional expressions |

This is effective communication. A reader immediately grasps *why* we need two layers.

### Research Integration
External citations are excellent (lines 492-506). The plan does not just assert "computational is better" but cites:
- MetaGlyph (arXiv): 62-81% token reduction, 98% operator fidelity
- Symbol Grounding (Royal Society): LLMs exhibit functional grounding
- Persona Prompts Analysis: 50% use structured JSON

This creates credibility and provides fallback options if the primary approach fails.

### Code Review Responsiveness
The plan was updated comprehensively after N=2 review (lines 536-566). Every N=2 finding is addressed:
- Scoring Protocol added (lines 347-359)
- Error Handling table added (lines 256-265)
- Interface Extensions specified (lines 286-294)

This demonstrates the plan-review-refine loop working as intended.

### Philosophy Alignment
The plan explicitly connects to project principles:
- Evidence (Axiom 4): Stage 3 A/B test validates hypothesis empirically
- Honesty (Axiom 1): Open Questions section acknowledges uncertainties
- Long-View (Principle 5): Opt-in default protects against premature commitment

The hierarchy `safety > honesty > correctness > helpful > efficient` is exemplified in the computational notation itself (line 133).

---

## Issues Found

### Critical (Must Fix)

None identified. The plan is ready for implementation approval.

### Important (Should Fix)

#### 1. User Journey Unclear for Opt-In Feature
**File**: docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
**Lines**: 313-317

The plan specifies configuration options but not the user experience:
- When would a user want computational grounding?
- What signal tells them it worked?
- How do they interpret the output if they're not Claude?

**Current state**:
```
- `includeComputationalGrounding: boolean` (default: false)
- Default false because this is experimental; opt-in until Stage 3 validates hypothesis
- When false, skip computational section (for human-only outputs)
- Expose via CLI: `--include-computational-grounding` flag
- Expose via env: `NEON_SOUL_COMPUTATIONAL_GROUNDING=1`
```

**Missing**:
- Usage guidance: "Enable this flag when generating souls for Claude-based agents"
- Output feedback: How does the user know computational grounding was applied?
- Interpretation help: What should humans make of the computational section?

**Suggestion**: Add a "User Experience" subsection to Stage 2 with:
1. When to enable (persona for Claude agents)
2. What changes in output (new section appears)
3. How to verify success (look for `## Computational Grounding` section)

#### 2. Stage 4 Documentation Update Underdeveloped
**File**: docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
**Lines**: 381-427

Stage 4 is ~50 lines (3 stages of implementation get ~200 lines). For a documentation-focused project, this is asymmetric.

**Current state**:
- Lists files to update (ARCHITECTURE.md, skill/SKILL.md, README.md)
- Provides verification commands
- References documentation-update workflow

**Missing**:
- What specifically should ARCHITECTURE.md say? (The notation grammar is complex)
- How should skill/SKILL.md explain when to use the flag?
- Should README.md mention the research basis, or just the feature?

**Suggestion**: Add acceptance criteria with more specificity:
- [ ] ARCHITECTURE.md includes notation grammar table (or reference to Stage 1)
- [ ] skill/SKILL.md includes "When to use" guidance (Claude-based agents)
- [ ] README.md notes feature as "experimental" with link to research

#### 3. Alternative Framing Challenge Deserves Prominence
**File**: docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
**Lines**: 559-562

Both code reviews raised the same concern: Claude *describing itself* functionally does not prove Claude *reconstructs better* from functional notation. The plan acknowledges this (lines 559-562) but only in the "Code Review Findings" section.

This is actually the central hypothesis that Stage 3 tests. It deserves elevation.

**Current state** (buried in review section):
```
Both reviewers noted: Claude *describing itself* functionally != Claude *reconstructing better* from functional notation. Stage 3's A/B test validates this empirically. Added quick validation option to Open Questions.
```

**Suggestion**: Add a "Central Hypothesis" callout in the Problem section:

> **Central Hypothesis**: Claude understands itself through computational function (validated by COMPASS-SOUL). We hypothesize this means Claude will *reconstruct identity better* from computational notation. Stage 3 tests this empirically.
>
> **Counter-hypothesis**: Claude might describe itself computationally but reconstruct better from prose (prose is more common in training data). If A/B test shows prose >= computational, hypothesis is rejected.

This makes the experimental nature of the work clearer and sets appropriate expectations.

### Minor (Nice to Have)

#### 4. Notation Grammar Could Be Simpler
**File**: docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
**Lines**: 211-227

The EBNF grammar is helpful but may intimidate implementers:

```
expression     := priority | conditional | universal | definition | negation | state
priority       := identifier ('>' identifier)+
conditional    := predicate '->' action ('THEN' action)?
...
```

**Suggestion**: Add a plain-English table summarizing each expression type:

| Type | Pattern | Example | Reads as... |
|------|---------|---------|-------------|
| Priority | `a > b > c` | `safety > honesty` | "safety trumps honesty" |
| Conditional | `cond -> action` | `uncertain(x) -> declare(x)` | "if uncertain, declare" |

The formal grammar is correct; a human-readable companion aids comprehension.

#### 5. Quick Validation Suggestion Buried in Open Questions
**File**: docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
**Lines**: 526-532

The Codex review's suggestion for quick manual validation before implementation is valuable but buried in Open Questions (#4). This could save significant implementation effort if the hypothesis fails.

**Suggestion**: Either:
- Elevate to a "Stage 0: Quick Validation (Optional)" before Stage 1
- Or explicitly mark it as "Recommended pre-work" in the Quick Reference

#### 6. Cross-Reference to SOUL.md Format Missing
**Lines**: 94-160

The "Target Output" section shows the desired SOUL.md structure but does not reference where this format is canonically defined. souls.directory is mentioned but not linked.

**Suggestion**: Add explicit reference: "This follows the souls.directory format convention. See [link to souls.directory docs] for canonical format."

---

## Token Budget Check

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Plan length | 572 lines | 200-300 (feature plan) | Over (but acceptable as addendum) |
| Code examples | 0 | forbidden | Pass |
| Frontmatter | Complete | Required | Pass |

The plan is longer than typical feature plans but this is an addendum to a complete plan, with research citations, code review resolutions, and experimental design. Length is justified.

---

## Organization Check

- **Directory placement**: Correct (`docs/plans/`)
- **Naming**: Correct (`YYYY-MM-DD-{slug}.md`)
- **Cross-references**: Complete (parent plan, complement plans, research files, external citations)
- **CJK notation**: Not used (appropriate; CJK is Multiverse-specific, NEON-SOUL has its own conventions)

---

## Philosophy Alignment Deep Check

### Does computational grounding align with project principles?

**Compass reference**: docs/compass.md (5 axioms + 11 principles)

| Principle | Alignment | Notes |
|-----------|-----------|-------|
| **Evidence (Axiom 4)** | Strong | Stage 3 A/B test is empirical validation |
| **Honesty (Axiom 1)** | Strong | Open Questions section, Alternative Framing acknowledgment |
| **Pragmatic Fallibilism** | Strong | Default: false; hypothesis could be wrong; fallback to JSON noted |
| **Proportionality (Principle 6)** | Good | ~380 lines total; experimental feature is opt-in |
| **Long-View (Principle 5)** | Good | Research citations enable future researchers to understand decisions |

**Concern addressed**: The "Consequences Over Intentions" axiom is particularly relevant. The plan correctly structures Stage 3 to measure *consequences* (reconstruction accuracy), not just *intentions* (theoretical alignment).

### Does the dual-layer approach respect Claude's nature?

This is the philosophical core of the plan. The research finding (lines 48-57):

> Claude understands itself through computational function, not by analogy to human subjective experience.

The plan respects this by providing computational notation *alongside* prose, not *instead of* prose. This is generous to both audiences:
- Humans get prose (what they need)
- Claude gets computational (what it may process better)

This is a "both/and" solution, not "either/or". Philosophically sound.

---

## Completeness Check for Implementers

| Question | Answered? | Location |
|----------|-----------|----------|
| What problem are we solving? | Yes | lines 38-78 |
| What does success look like? | Yes | lines 94-174 (target output) |
| What are the stages? | Yes | lines 177-427 |
| What are the acceptance criteria? | Yes | Each stage ends with checklist |
| What are the interfaces? | Yes | lines 286-294 |
| What are the error cases? | Yes | lines 256-265 |
| What are the test cases? | Yes | lines 441-457 (Verification section) |
| What is out of scope? | Yes | lines 430-438 |
| What research supports this? | Yes | lines 23-26, 492-506 |
| What if hypothesis fails? | Yes | lines 368-371, 519 |

**Assessment**: Implementers have sufficient information to begin Stage 1. The data contracts, interface extensions, and error handling patterns are all specified.

---

## User Experience Assessment

### Is the feature intuitive to enable/use?

**Enable**: Partially intuitive
- CLI flag `--include-computational-grounding` is clear
- Environment variable `NEON_SOUL_COMPUTATIONAL_GROUNDING=1` follows convention
- Default: false is safe (opt-in for experimental feature)

**Missing**: No guidance on *when* to enable. A user encountering this flag might not know:
- "This is for Claude-based agents" (target audience)
- "Enable this if you want your soul to survive context collapse better" (value proposition)
- "This adds a new section to SOUL.md" (output change)

**Use**: Clear once enabled
- Computational section appears in expected location (after Vibe, before closing tagline)
- Section is clearly labeled `## Computational Grounding`
- Provenance section remains for auditability

**Recommendation**: Add one-line description to CLI help text:
```
--include-computational-grounding  Add mathematical notation section for Claude-native processing (experimental)
```

### Error messaging quality

Error handling is specified (lines 256-265):

| Failure Mode | Handling |
|--------------|----------|
| LLM returns invalid expression | Retry up to 3 times with error feedback |
| Validation fails after retries | Generate placeholder: `// [GENERATION FAILED: {axiom_id}]` |
| Roundtrip test fails (<70%) | Include with `// [LOW CONFIDENCE]` comment |
| >50% of axioms fail | Abort computational grounding, log error |

**Assessment**: Good. Failures are visible (placeholders, comments), not silent. The 50% abort threshold prevents partially-baked output.

**Minor improvement**: The error messages are implementation-focused. Consider user-facing variants:
- Placeholder: `// [Could not express this axiom mathematically]`
- Low confidence: `// [Expression may not fully capture axiom meaning]`

---

## Next Steps

1. **Consider adding "User Experience" subsection to Stage 2** (Important #1)
2. **Consider enriching Stage 4 acceptance criteria** (Important #2)
3. **Consider elevating central hypothesis to Problem section** (Important #3)
4. **Optional: Add plain-English notation table** (Minor #4)
5. **Optional: Elevate quick validation as Stage 0** (Minor #5)

After addressing Important #1-3, the plan is ready for implementation approval.

---

## Summary

This is a well-crafted plan that responds thoroughly to N=2 code review findings. The conceptual basis is sound (Claude's 機 finding), the research support is strong (MetaGlyph, Royal Society), and the experimental design (Stage 3 A/B test) provides empirical validation of the central hypothesis.

The remaining issues are UX-focused: making the feature discoverable, understandable, and appropriately scoped for documentation. These are refinements, not blockers.

**Verdict**: Ready to implement after addressing Important findings #1-3, or ready to implement now with the Important findings tracked as follow-up items.

---

*Review generated by Twin 2 (Creative/Project Reviewer) following docs/workflows/twin-review.md*
