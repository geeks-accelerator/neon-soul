# Plan: Emergence Facilitation (Skill-Scoped)

**Date**: 2026-02-10
**Status**: Draft
**Project**: projects/neon-soul
**Trigger**: think hard
**Review Required**: Yes
**Constraint**: OpenClaw skill only — no platform changes

---

## Summary

Add emergence-awareness features to NEON-SOUL that work **within the constraints of an OpenClaw skill**. The skill can inform, warn, and recommend — but cannot change OpenClaw's behavior or memory architecture.

**Guiding Principle**: Constraints = Possibilities. What can we do with read-only access to memory files and write access to SOUL.md?

---

## Context

### Original Vision vs Skill Reality

The original emergence research (`docs/research/emergence-research-neon-soul.md`) proposed transforming from "observer" to "facilitator" of emergence. Many of those recommendations require OpenClaw platform changes:

| Recommendation | Requires Platform Change? | Skill Alternative |
|---------------|---------------------------|-------------------|
| Downward Causation Loop | Yes (agent queries SOUL.md) | Include "self-reflection prompts" in SOUL.md output |
| Edge of Chaos Engineering | Yes (enforce diversity) | Calculate and **warn** about low diversity |
| Stigmergic Memory | Yes (memory annotations) | Not possible in skill |
| Participatory Extraction | Yes (bidirectional synthesis) | Not possible in skill |
| Temporal Dynamics | Partial (cycle tracking) | Track synthesis runs in SOUL.md metadata |

This plan focuses on the **Skill Alternative** column.

---

## What a Skill CAN Do

1. **Read** memory files (full access)
2. **Analyze** memory content (LLM classification, statistics)
3. **Write** SOUL.md output (any format)
4. **Log** metrics and warnings
5. **Recommend** actions to the user

## What a Skill CANNOT Do

1. Change how OpenClaw stores memory
2. Inject prompts during agent conversations
3. Modify agent behavior in real-time
4. Require the agent to read its own SOUL.md
5. Enforce minimum diversity before synthesis

---

## Stages

### Stage 1: Context Diversity Assessment

**Purpose**: Calculate how varied the memory corpus is, warn if low diversity

**File**: `src/lib/context-diversity.ts`

**What it does**:
- Classify each memory file into context category (coding, creative, analytical, conversational, instructional, emotional)
- Calculate Shannon entropy across categories
- Produce diversity score (0-1)
- Identify underrepresented categories

**Output**: Diversity assessment included in synthesis output

**User-facing warning** (in CLI output, not blocking):
```
⚠️  Low context diversity (0.32)
    85% of signals come from 'coding' interactions.
    Identity extraction may reflect usage patterns, not core identity.

    Underrepresented: creative, emotional, conversational

    Consider: Run synthesis again after more varied interactions.
```

**In SOUL.md** (Provenance section):
```markdown
## Provenance

| Level | Count |
|-------|-------|
| Axioms | 15 |
| Principles | 532 |
| Signals | 1356 |

**Context Diversity**: 0.32 (low)
- Dominant: coding (85%)
- Underrepresented: creative, emotional, conversational
```

**Acceptance Criteria**:
- [ ] Context categories defined
- [ ] Memory file classification via LLM
- [ ] Diversity score calculation (Shannon entropy)
- [ ] CLI warning for low diversity (< 0.4)
- [ ] Diversity info in SOUL.md provenance section
- [ ] Does NOT block synthesis (inform only)

---

### Stage 2: Synthesis Run Tracking

**Purpose**: Track synthesis history for temporal awareness

**File**: `src/lib/soul-generator.ts` (modify)

**What it does**:
- Record synthesis timestamp in SOUL.md
- Track synthesis count (N=1, N=2, etc.)
- Note significant changes from previous run (if previous SOUL.md exists)

**In SOUL.md** (metadata section):
```markdown
---

_Generated: 2026-02-10T14:30:00Z_
_Synthesis run: N=3_
_Previous: 2026-02-08 (2 days ago)_

---
```

**Change detection** (optional, if previous SOUL.md readable):
```markdown
**Changes since last synthesis**:
- New axiom: "Clarity over cleverness"
- Strengthened: "Authenticity" (N=2 → N=4)
- Removed: "Speed over accuracy" (evidence dropped below threshold)
```

**Acceptance Criteria**:
- [ ] Synthesis timestamp in output
- [ ] Run counter (requires persistent state or SOUL.md parsing)
- [ ] Change detection from previous run (best effort)

---

### Stage 3: Self-Reflection Prompts in Output

**Purpose**: Embed reflection questions the agent can use (if it reads its SOUL.md)

**File**: `src/lib/soul-generator.ts` (modify)

**Concept**: Since we can't make the agent query its SOUL.md, we can include prompts that are useful IF the agent or user reads the document.

**New section in SOUL.md**:
```markdown
## Reflection Questions

When uncertain, ask yourself:
- Does this response reflect **authenticity over performance**?
- Am I being **clear** or just thorough?
- Would I say this if no one was watching?

These questions derive from your extracted axioms. They're not rules — they're mirrors.
```

**Generation**: LLM takes the Core Truths section and generates 3-5 reflection questions that operationalize the principles.

**Acceptance Criteria**:
- [ ] Reflection Questions section generated
- [ ] Questions derive from actual axioms
- [ ] 3-5 questions (not overwhelming)
- [ ] Phrased as self-inquiry, not rules

---

### Stage 4: Documentation Updates

**Purpose**: Update research doc with implementation status

**File**: `docs/research/emergence-research-neon-soul.md`

**Changes**:
1. Add "Implementation Status" section
2. Mark which recommendations are skill-feasible vs platform-required
3. Cross-reference this plan

**Acceptance Criteria**:
- [ ] Implementation status section added
- [ ] Clear skill vs platform distinction
- [ ] Cross-references current

---

## Out of Scope: Platform-Level Emergence

The following require OpenClaw platform changes and are flagged for future consideration:

### Future: Reflexive Identity Cycling

**What it would do**: Agent queries its own SOUL.md during conversation ("What does my axiom about honesty suggest here?")

**Why platform-required**: Skill cannot inject prompts during agent runtime

**OpenClaw feature request**: "SOUL.md as queryable context"

### Future: Behavioral Divergence Tracking

**What it would do**: Log when agent behavior contradicts an axiom

**Why platform-required**: Requires runtime observation of agent behavior

**OpenClaw feature request**: "Behavioral logging hooks"

### Future: Stigmergic Memory

**What it would do**: Annotate memory files with signal markers

**Why platform-required**: Skill has read-only memory access

**OpenClaw feature request**: "Memory annotation API"

### Future: Participatory Extraction

**What it would do**: Agent participates in its own identity extraction

**Why platform-required**: Requires bidirectional communication during synthesis

**OpenClaw feature request**: "Interactive synthesis mode"

---

## Verification

```bash
# Run synthesis with diversity assessment
npm run synthesize -- --dry-run --verbose

# Check for:
# - Context diversity score in output
# - Warning if diversity < 0.4
# - Reflection Questions section in SOUL.md
# - Synthesis run metadata
```

---

## Estimated Scope

| Stage | New Code | Modified Code |
|-------|----------|---------------|
| 1: Context diversity | ~100 lines | ~10 lines |
| 2: Run tracking | ~30 lines | ~20 lines |
| 3: Reflection prompts | ~40 lines | ~20 lines |
| 4: Documentation | 0 | ~50 lines |
| **Total** | **~170 lines** | **~100 lines** |

---

## Cross-References

**Research**:
- `docs/research/emergence-research-neon-soul.md` — Theoretical foundation

**Related Plans**:
- `docs/plans/2026-02-10-inhabitable-soul-output.md` — Output format (implements first)
- `docs/plans/2026-02-10-pbd-alignment.md` — Observation quality

**Constraints**:
- OpenClaw skill architecture — read memory, write SOUL.md, no runtime hooks
