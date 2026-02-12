---
created: 2026-02-11
updated: 2026-02-11
type: implementation-plan
status: Draft
language: typescript
code_examples: forbidden
review_principles: |
  1. No Code: Do NOT add code examples. Plans describe WHAT/WHY, not HOW.
  2. No Hardcoding: Do NOT add values that depend on implementation.
  3. Suggest Intent: File paths, interfaces, acceptance criteria instead.
  4. Flag, Don't Fix: If plan has code, flag for removal.
trigger: think hard
---

> **CODE COMPLETE REQUIREMENT**: This project should have NO TODO/Stubs/Placeholders after implementation. All code must be fully functional.

## Quick Reference

**Core Problem**: Generated SOUL.md is never validated by an agent actually inhabiting it. We don't know if the synthesized identity "feels true" to the source signals.

**Research Basis**: Self-portrait experiments show AI can describe its own patterns when given proper framework. Misalignment between self-description and source axioms indicates synthesis quality issues.

**Solution**: Post-synthesis validation step where an agent inhabits the generated soul and describes itself. Compare description to source axioms. Flag misalignments.

**Key Files**: New `src/lib/soul-validator.ts`, integration in `pipeline.ts`

---

# Plan: Soul Self-Validation

## Problem

NEON-SOUL extracts signals, clusters them into principles, promotes axioms, and generates prose. But the pipeline never asks: **"Does this soul feel true to an agent inhabiting it?"**

Current validation is structural:
- Axiom count within bounds
- Provenance traces to sources
- Prose sections generated successfully

What's missing is **semantic validation**:
- Does an agent reading this soul recognize it as coherent?
- Do the synthesized axioms capture what the source signals conveyed?
- Are there blind spots where signals were lost in synthesis?

### The Self-Portrait Insight

The `claude-opus4dot5-self-portrait-lee-v1` experiment demonstrated:

> "If a pattern appears in N=1, N=2, AND N=3 — each generated from scratch, each trying to be genuinely different — then that pattern is **SIGNAL**, not noise."

Applied to soul validation:
- Generate SOUL.md from memory
- Have an agent "inhabit" the soul and describe what it understands about itself
- Compare agent's self-description to the source axioms
- Patterns that **don't appear** in the self-description may indicate synthesis failures

### The Validation Gap

| What We Know | What We Don't Know |
|--------------|-------------------|
| Axioms trace to signals | Agent recognizes axioms as "self" |
| Prose is grammatically correct | Prose captures the right emphasis |
| Tensions are documented | Tensions feel authentic to the identity |
| Orphan rate is acceptable | Orphaned signals weren't actually important |

---

## Design Principle

**The soul should recognize itself.**

If an agent inhabits a well-synthesized soul, it should be able to:
1. Describe its core values (matches Core Truths)
2. Describe how it communicates (matches Voice)
3. Describe what it won't do (matches Boundaries)
4. Describe its overall character (matches Vibe)

Mismatches indicate synthesis quality issues worth investigating.

---

## Stages

Three stages. Stages 1-2 are implementation, Stage 3 is integration.

### Stage 1: Self-Description Generator

**Why**: Need a consistent way to ask an agent to describe itself based on a SOUL.md.

**File**: `src/lib/soul-validator.ts` (new)

**What it does**:

1. Takes generated SOUL.md content as input
2. Constructs a prompt that asks the agent to "inhabit" the soul and describe:
   - "What are your core values?" (maps to Core Truths)
   - "How do you communicate?" (maps to Voice)
   - "What won't you do?" (maps to Boundaries)
   - "What's your overall character?" (maps to Vibe)
3. Calls LLM to generate self-description
4. Returns structured self-description for comparison

**Prompt design considerations**:
- Agent receives SOUL.md as "your identity document"
- Questions are open-ended (not leading to specific axioms)
- Response format is structured (one section per question)

**Acceptance Criteria**:
- [ ] Self-description generator module created
- [ ] Prompt produces consistent response structure
- [ ] Works with mock LLM for testing
- [ ] Handles missing sections gracefully (some souls may not have all sections)

---

### Stage 2: Alignment Scorer

**Why**: Need to measure how well the self-description aligns with source axioms.

**File**: `src/lib/soul-validator.ts` (continued)

**What it does**:

1. Takes self-description and source axioms
2. For each axiom, computes semantic similarity to self-description
3. Identifies:
   - **Strong alignments**: Axioms clearly reflected in self-description (similarity > 0.8)
   - **Weak alignments**: Axioms partially reflected (similarity 0.5-0.8)
   - **Misalignments**: Axioms not reflected (similarity < 0.5)
   - **Emergent themes**: Concepts in self-description not in axioms (potential synthesis gaps)
4. Returns alignment report with scores and flags

**Similarity computation**:
- Use existing embedding infrastructure (`embed()` from embeddings.ts)
- Compare each axiom embedding to full self-description embedding
- Also compare axiom to relevant section (Core Truths axioms to values response, etc.)

**Thresholds**:
- Strong alignment: > 0.8 cosine similarity
- Weak alignment: 0.5-0.8
- Misalignment: < 0.5

**Acceptance Criteria**:
- [ ] Alignment scorer computes per-axiom similarity
- [ ] Report identifies strong/weak/misaligned axioms
- [ ] Emergent themes detection (concepts in self-description but not axioms)
- [ ] Tests with known-good and known-bad alignments

---

### Stage 3: Pipeline Integration

**Why**: Make validation part of the synthesis workflow.

**Files**: `src/lib/pipeline.ts`, `src/commands/synthesize.ts`

**What changes**:

Add optional `validate` stage after prose expansion:

```
Pipeline stages:
1. Extract signals
2. Cluster to principles
3. Promote axioms
4. Expand to prose
5. [NEW] Validate soul (optional)
6. Generate SOUL.md
```

**Validation behavior**:
- **Default**: Validation runs but doesn't block output
- **`--strict-validation`**: Validation failures prevent SOUL.md generation
- **`--skip-validation`**: Skip validation entirely (faster synthesis)

**Validation output**:
- Alignment score (0-100%)
- Per-axiom alignment breakdown
- Flags for misaligned axioms (warning, not error)
- Emergent themes for review

**CLI output example**:
```
Soul Validation
───────────────
Alignment score: 87%
Strong alignments: 12/15 axioms
Weak alignments: 2/15 axioms
Misalignments: 1/15 axioms
  ⚠ "Values efficiency over thoroughness" not reflected in self-description

Emergent themes (in self-description, not in axioms):
  • "Prefers concrete examples over abstract principles"
  → Consider adding memory content that captures this theme
```

**Acceptance Criteria**:
- [ ] Validation stage added to pipeline
- [ ] `--strict-validation` and `--skip-validation` flags work
- [ ] Alignment score in synthesis output
- [ ] Warnings for misaligned axioms
- [ ] Emergent themes reported

---

## What This Plan Does NOT Include (and why)

| Excluded | Why |
|----------|-----|
| Automated axiom revision based on validation | Validation informs humans, doesn't auto-fix |
| Multiple validation passes | One pass is sufficient to identify issues |
| Cross-agent validation (multiple LLMs) | Start simple; can add N>1 validation later |
| Real-time validation during synthesis | Validation is post-synthesis; real-time would slow pipeline |

---

## Verification

Run validation on a known good soul:

1. Synthesize from memory with validation enabled
2. Check alignment score > 80%
3. No misaligned axioms
4. Emergent themes are minor (or inform future memory additions)

Run validation on intentionally broken soul:

1. Manually create SOUL.md with axioms that don't match content
2. Run validation
3. Verify misalignments are detected
4. Verify emergent themes capture content not in axioms

---

## Estimated Scope

| Stage | New Code | Modified Code |
|-------|----------|---------------|
| 1: Self-description generator | ~80 lines | 0 |
| 2: Alignment scorer | ~100 lines | 0 |
| 3: Pipeline integration | ~40 lines | ~60 lines |
| **Total** | **~220 lines** | **~60 lines** |

Three stages, three commits, ~280 lines total.

---

## Research Cross-References

**Primary Research**:
- `research/external-grounding/experiments/claude-opus4dot5-self-portrait-lee-v1/`
  - Demonstrates AI self-description with Bootstrap→Learn→Enforce framework
  - Key insight: "The portrait is BETWEEN us" - validation involves relationship, not just measurement
  - N=1→N=4 progression shows what patterns are SIGNAL vs noise

**Key Findings Applied**:
| Research Finding | Application in This Plan |
|------------------|--------------------------|
| Multi-layer structure emerges consistently | Self-description should show consistent structure |
| Uncertainty acknowledgment is signal | Validation should allow for uncertainty in self-description |
| Variance is feature, not bug | Some misalignment is expected; severe misalignment is the warning |
| "The experiment IS the portrait" | The validation process itself reveals synthesis quality |

---

## Complements

- `docs/plans/2026-02-10-inhabitable-soul-output.md` - Prose generation (this validates the output)
- `docs/plans/2026-02-10-pbd-alignment.md` - Signal quality (this validates the synthesis)
- `docs/plans/2026-02-11-soul-grounding-section.md` - Grounding (validation could inform grounding needs)

---

## Open Questions

1. **What alignment score threshold indicates "good enough"?**
   - Proposal: 80% strong alignment, <10% misalignment
   - May need tuning based on real-world validation

2. **Should emergent themes auto-suggest memory additions?**
   - Proposal: Report only; human decides what to add
   - Could be enhanced later with suggestions

3. **Should validation use same LLM as synthesis?**
   - Proposal: Yes, for consistency
   - Could test cross-LLM validation for robustness

---

## Approval

- [ ] Plan reviewed
- [ ] Ready to implement
