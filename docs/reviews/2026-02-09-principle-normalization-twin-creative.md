---
created: 2026-02-09
type: review
reviewer: twin-creative
status: complete
plan: docs/plans/patent-skills/2026-02-09-principle-normalization-update.md
---

# Creative/Organizational Review: Principle Normalization Plan

**Verified files**:
- docs/plans/patent-skills/2026-02-09-principle-normalization-update.md (441 lines, MD5: 53f0652a)
- docs/issues/patent-skills/2026-02-09-principle-normalization-plan-findings.md (282 lines)
- projects/live-neon/neon-soul/docs/plans/2026-02-09-signal-generalization.md (704 lines) [learning source]
- projects/obviously-not/patent-skills/pbe-extractor/SKILL.md (229 lines)
- projects/obviously-not/patent-skills/principle-comparator/SKILL.md (242 lines)

**Status**: Approved with suggestions

---

## Strengths

### 1. Clear Problem-Solution Framing
The problem statement (lines 15-23) concisely explains why normalization matters with a concrete example. The "Prioritize honesty over comfort" vs "Always tell the truth" example immediately communicates the issue to any reader.

### 2. Cross-Project Knowledge Transfer
The plan explicitly references neon-soul learnings (lines 433-437), demonstrating the Golden Master pattern of validated knowledge propagating to new contexts. This is the system working as designed.

### 3. Voice Preservation Strategy
The "Cross-Cutting Concerns" section (lines 324-334) addresses the tension between normalization for matching and preserving authentic user voice. This shows awareness that the skills serve *people* with *identities*, not just data structures.

### 4. Error Handling with Human-in-the-Loop
The MEANING_DRIFT mechanism (lines 380-390) creates an escape hatch for cases where normalization might distort meaning. Outputting to `requires_review.md` keeps humans informed rather than silently proceeding with potentially incorrect normalizations.

### 5. Consistent Methodology Across Skills
All 4 skills get the same normalization rules, creating a unified experience. Users learning one skill can apply that knowledge to others.

---

## Issues Found

### Critical (Must Fix)

None. The plan addresses the Important findings from the code review (verb set consistency, magnitude preservation, etc.), leaving only implementation work.

---

### Important (Should Fix)

#### 1. Template Compliance: Missing `code_examples: forbidden` Frontmatter
**File**: `docs/plans/patent-skills/2026-02-09-principle-normalization-update.md`
**Lines**: 1-9

**Problem**: The plan contains extensive code blocks (JSON schemas, markdown examples, prompt templates) but lacks the `code_examples: forbidden` frontmatter that should trigger review flagging. Per `docs/templates/implementation-plan-template.md` lines 6-11, plans with code should either:
1. Have `code_examples: forbidden` and NO code (preferred)
2. Be flagged for code removal during review

**Current frontmatter**:
```yaml
---
created: 2026-02-09
updated: 2026-02-09
type: implementation-plan
status: Ready (Important findings addressed)
trigger: think hard
code_review: 2026-02-09
issue: docs/issues/patent-skills/2026-02-09-principle-normalization-plan-findings.md
---
```

**Missing**: `code_examples: forbidden`, `review_principles`

**Assessment**: The code blocks in this plan serve a different purpose than implementation code. They are:
- JSON schemas showing structure (lines 127-139, 231-256, 296-314)
- Markdown examples showing before/after (lines 107-123, 165-175, etc.)
- Prompt template showing conceptual structure (lines 356-369)

This is **documentation code** (showing what the output looks like), not **implementation code** (showing how to build it). The distinction matters because:
- Implementation code in plans leads to N=14 anti-pattern (premature hardcoding)
- Documentation/schema code in plans helps implementers understand the target format

**Suggestion**: Either:
- A) Add frontmatter and remove the JSON/markdown blocks, replacing with prose descriptions
- B) Add a note to the template distinguishing "schema examples" from "implementation code"
- C) Accept that this plan intentionally includes schemas and document that exception

I recommend **Option C** with a brief note in the Related section explaining the choice.

---

#### 2. UX Clarity: "Normalization" May Confuse Users
**File**: `docs/plans/patent-skills/2026-02-09-principle-normalization-update.md`
**Section**: Throughout

**Problem**: The term "normalization" is technical jargon from database/math contexts. Users of these skills (who may not be engineers) might find "normalized_form" confusing in the output.

**Current usage**:
- "normalized_form" field in JSON (line 130, 233, 303)
- "Normalize All Principles" section heading (line 199)
- "normalization_status" field (line 134, 142, 263)

**User perspective**: When I see "normalized_form: Values truthfulness over comfort" next to my original "I always tell the truth, even when uncomfortable", I might think:
- Is my original form "abnormal"?
- What does "normalizing" mean here?
- Why is the skill changing my words?

**Suggestion**: Consider user-facing alternatives:
- "abstract_form" or "generalized_form" (what it actually is)
- "matching_form" (explains its purpose)
- "canonical_form" (traditional term, but still technical)

Or add a brief explanation in the output:
```json
{
  "statement": "I always tell the truth...",
  "matching_form": "Values truthfulness over comfort",
  "matching_form_note": "Simplified form used to find similar principles across sources"
}
```

This is not blocking but worth considering before the field names are locked into the schema.

---

#### 3. Workflow Gap: No Guidance on When NOT to Normalize
**File**: `docs/plans/patent-skills/2026-02-09-principle-normalization-update.md`
**Section**: Stage 1 (Normalization Methodology)

**Problem**: The plan assumes all principles should be normalized. But some principles might be:
- **Inherently specific**: "Never ship on Fridays" is context-specific and should stay specific
- **Conditional**: "When in Alaska, wear layers" has a geographic condition
- **Numerical**: "Keep files under 200 lines" has a specific threshold

The plan partially addresses conditionals (Rule 4, line 75-78) and numerical values (Finding #2 in issues file), but there's no explicit guidance on when normalization should be SKIPPED.

**Suggestion**: Add a "When NOT to Normalize" subsection:
```markdown
### When NOT to Normalize

Some principles should remain specific:
- **Context-bound**: Principles tied to a specific domain, time, or location
- **Numerical thresholds**: Specific numbers that are integral to the principle
- **Process-specific**: Step-by-step procedures that lose meaning when abstracted

For these, set `normalization_status: "skipped"` and use original text for matching.
```

---

#### 4. Cross-Reference Discrepancy: Plan Path vs Actual Skill Location
**File**: `docs/plans/patent-skills/2026-02-09-principle-normalization-update.md`
**Lines**: 96, 154, 188, 269

**Problem**: The plan references skill files as:
- `pbe-extractor/SKILL.md`
- `essence-distiller/SKILL.md`
- `principle-comparator/SKILL.md`
- `principle-synthesizer/SKILL.md`

But actual locations are:
- `projects/obviously-not/patent-skills/pbe-extractor/SKILL.md`
- `projects/obviously-not/patent-skills/essence-distiller/SKILL.md`
- `projects/obviously-not/patent-skills/principle-comparator/SKILL.md`
- `projects/obviously-not/patent-skills/principle-synthesizer/SKILL.md`

**Impact**: Implementers navigating from the plan to the files will need to search for the full paths. This is a discoverability friction.

**Suggestion**: Use full relative paths from the plan's location:
```markdown
**File**: `../../../projects/obviously-not/patent-skills/pbe-extractor/SKILL.md`
```

Or add a "File Locations" section at the top:
```markdown
## File Locations

All skill files are in `projects/obviously-not/patent-skills/`:
- `pbe-extractor/SKILL.md`
- `essence-distiller/SKILL.md`
- `principle-comparator/SKILL.md`
- `principle-synthesizer/SKILL.md`
```

---

### Minor (Nice to Have)

#### 5. Voice Mismatch: essence-distiller Uses "I" But Normalization Removes "I"
**File**: `docs/plans/patent-skills/2026-02-09-principle-normalization-update.md`
**Lines**: 165-175 (Stage 3: Update essence-distiller)

**Observation**: essence-distiller has a conversational tone with "I" voice ("Why I Normalize", "When I find a principle..."). But the normalization rules explicitly remove pronouns including "I".

**Tension**: The skill's persona says "I" while teaching users to remove "I" from their principles. This might feel inconsistent.

**Current**: "Why I Normalize" section uses "I find", "I keep both", etc.
**Normalized output**: "Values truthfulness in communication" (no "I")

**Suggestion**: Either:
- Acknowledge the irony briefly ("I use 'I' because I'm talking to you, but your principles become universal statements")
- Or phrase the skill's voice differently ("This skill normalizes...")

This is minor because the skill's conversational voice and the principle's abstracted form serve different purposes.

---

#### 6. Missing Example: What Does "normalization_status: drift" Look Like?
**File**: `docs/plans/patent-skills/2026-02-09-principle-normalization-update.md`
**Lines**: 380-390

**Problem**: The MEANING_DRIFT mechanism is defined but no concrete example shows what triggers it.

**Current**: "Normalized meaning differs significantly" (abstract)

**Helpful addition**:
```markdown
**Example of MEANING_DRIFT**:
Original: "I believe in giving people second chances after they apologize"
Normalized: "Values forgiveness"

Drift reason: Original implies a condition (apology required), normalized form is unconditional.
```

This helps implementers understand what to look for when building the drift detection.

---

#### 7. Line Count: Plan is 441 Lines (Above 300-Line Recommendation)
**File**: `docs/plans/patent-skills/2026-02-09-principle-normalization-update.md`

**Observation**: The plan exceeds the recommended 200-300 lines for feature plans. At 441 lines, it's nearing the 500-line threshold that would suggest splitting.

**Assessment**: The length is justified because:
- 4 skills to update (each needs its own stage)
- Cross-cutting concerns section is essential
- Verification examples add value
- Error handling is detailed (good)

**Suggestion**: No action needed now, but if future revisions add more content, consider splitting into a hub plan with per-skill sub-plans.

---

#### 8. Naming Pattern: "normalization_status" vs "status" Consistency
**File**: `docs/plans/patent-skills/2026-02-09-principle-normalization-update.md`
**Lines**: 134, 142

**Observation**: The plan uses `normalization_status` as the field name, but other parts of the schema use shorter names:
- `confidence` (not `confidence_status`)
- `n_count` (not `n_count_value`)

**Consideration**: `norm_status` would be more concise while still clear. But this is minor and consistency across all PBD skills matters more than brevity.

---

## Alternative Framing: Are We Solving the Right Problem?

### Question 1: Is LLM-Based Normalization the Right Approach?

**Assumption examined**: "LLM judgment is sufficient for semantic alignment."

**Alternative**: Embedding-based similarity (as neon-soul uses) might be more consistent than LLM normalization. The plan explicitly rules this out (line 32: "LLM-based normalization, no embeddings - generic OpenClaw compatibility").

**Assessment**: The reasoning is sound. These skills must work with generic LLM providers (OpenClaw compatibility), not just infrastructure that supports embeddings. The LLM approach, despite non-determinism risks (mitigated by caching per Finding #5), is the right trade-off for portability.

### Question 2: Why Normalize at All? Why Not Just Improve Semantic Alignment?

**Assumption examined**: "Normalization is necessary for accurate matching."

**Alternative**: The principle-comparator could use better prompting to recognize that "I tell the truth" and "Honesty matters most" are equivalent without normalizing either.

**Assessment**: This alternative shifts complexity from extraction to comparison. The plan's approach (normalize once at extraction, compare normalized forms) is more efficient than N^2 semantic alignment at comparison time. The trade-off makes sense.

### Question 3: Does Voice Preservation Actually Work?

**Assumption examined**: "Keeping original + normalized preserves authentic voice."

**Concern**: If the Golden Master shows "Values truthfulness over comfort" as the canonical statement, users might feel their original phrasing is "second class." The provenance exists but isn't necessarily prominent.

**Suggestion already in plan**: Stage 5 of neon-soul addresses this with display options (lines 524-529 of signal-generalization.md). The patent-skills plan could reference this pattern more explicitly.

---

## Token Budget Check

**CLAUDE.md**: N/A (not modified by this plan)

**Plan file length**: 441 lines
- Slightly above 300-line target for feature plans
- Justified by scope (4 skills, cross-cutting concerns)
- No immediate action needed

**CJK notation**: Not applicable to patent-skills (external project)

---

## Organization Check

**Directory placement**: Correct
- `docs/plans/patent-skills/` is the right location for plans about patent-skills

**Naming**: Correct
- `2026-02-09-principle-normalization-update.md` follows `YYYY-MM-DD-{topic}.md` pattern
- Under 60 characters

**Cross-references**: Mostly complete
- Issue file linked: Yes
- Code reviews linked: Yes
- Learning source (neon-soul) linked: Yes
- Skill file paths: Need full paths (see Finding #4)

**CJK notation**: Not applicable (patent-skills project)

---

## Summary

This is a well-structured plan that applies validated learnings from neon-soul to the patent-skills. The code review findings have been addressed, and the cross-cutting concerns (voice preservation, caching, error handling) show thoughtful design.

**Key suggestions**:
1. Clarify template compliance stance on schema examples vs implementation code
2. Consider user-facing terminology for "normalization"
3. Add guidance on when NOT to normalize
4. Use full file paths for discoverability

**Approve with suggestions** - Implementation can proceed; suggestions are improvements, not blockers.

---

## Next Steps

1. **Human decision**: Schema examples in plans - document exception or remove?
2. **During implementation**: Consider "matching_form" vs "normalized_form" naming
3. **Add to Stage 1**: "When NOT to Normalize" subsection
4. **Optional**: Add concrete MEANING_DRIFT example

---

*Review completed 2026-02-09 by twin-creative (審創)*
