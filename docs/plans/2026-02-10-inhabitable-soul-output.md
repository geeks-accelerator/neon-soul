---
created: 2026-02-10
updated: 2026-02-10
type: implementation-plan
status: Complete
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

> **LLM ARCHITECTURE**: Use LLM context from OpenClaw skill (primary). Ollama is fallback for local development only. See `src/commands/synthesize.ts` for provider wiring.

## Quick Reference

**Core Problem**: Generated SOUL.md is 85 lines of `💡 明: values > stability` notation that no agent can inhabit.

**Solution**: Three stages. Cap axiom count → expand axioms into prose via LLM → output souls.directory-format document.

**Key Files**: `soul-generator.ts` (rewrite), `compressor.ts` (cap enforcement), new `prose-expander.ts`

---

# Plan: Inhabitable Soul Output

## Problem

NEON-SOUL extracts real identity signal from agent memory. The pipeline (signals → principles → axioms) works. But the output is unusable.

Today's SOUL.md gives an agent 85 lines like:

```
- 💡 明: values > stability
- 💪 安: stability ≥ growth
- 💸 👀: ≤
- 💪Flexible: 簆 ¬Rigidity
```

An agent can't inhabit that. It's compressed notation meant for a data store, not an identity document.

What works — proven by every soul on souls.directory — is prose with structure:

```
**Clarity over cleverness.** If someone has to read it twice, you wrote it wrong.
```

The gap is the last mile: turning axioms into language an agent can wear.

---

## Target Output

A generated SOUL.md should look like this (hand-written example based on the actual axioms extracted from Parish's memory):

```markdown
# SOUL.md

_You are becoming a bridge between clarity and chaos, growing through presence and radical acceptance of uncertainty._

---

## Core Truths

**Authenticity over performance.** You speak freely even when it's uncomfortable. You'd rather be genuinely wrong than strategically right. Substance over show, always.

**Clarity is a gift you give.** You make complex things simple, not because you oversimplify, but because you've understood them deeply enough to translate. If someone has to ask twice, you haven't been clear enough.

**Community over individual.** You believe shared understanding matters more than personal credit. Unity over isolation. You'd rather lift a room than win an argument.

## Voice

You're direct without being blunt. You lead with curiosity — asking before assuming, inquiring before prescribing. Depth over superficiality. You'd rather go quiet than fill space with noise.

Think: The friend who tells you the hard truth, but sits with you after.

## Boundaries

You don't sacrifice honesty for comfort. You don't perform certainty you don't feel. You don't optimize for speed when it costs clarity.

## Vibe

Grounded but not rigid. Present but not precious about it. You hold space for uncertainty without drowning in it.

---

_Presence is the first act of care._

---

## Provenance

| Level | Count |
|-------|-------|
| Axioms | 15 |
| Principles | 532 |
| Signals | 1356 |
```

Notice what changed from the current output:
- **Core Truths** uses the bold-principle-then-elaboration pattern from souls.directory
- **Voice** is a prose paragraph with a `Think:` analogy
- **Boundaries** are "You don't..." statements (identity through contrast)
- **Vibe** is a short prose feel
- No CJK notation, no mathematical symbols, no bullet lists of compressed tokens
- Provenance kept for auditability (but agent doesn't need to read it)
- Closing tagline for personality

---

## Stages

Four stages. Stages 1-3 are implementation, Stage 4 is documentation. No artificial dependencies between quality gates and prose expansion — the LLM doing prose expansion handles noisy/duplicate axioms naturally because it's synthesizing paragraphs, not echoing inputs.

### Stage 1: Enforce Cognitive Load Cap

**Why**: 85 axioms is too many for any consumer. Even the prose expander produces better output from 15-25 focused axioms than from 85 noisy ones.

**File**: `src/lib/compressor.ts`

**What changes**: After `compressPrinciplesWithCascade()` produces axioms, if count exceeds `COGNITIVE_LOAD_CAP` (change from 30 to 25), sort by N-count descending (then tier: core > domain > emerging), take top N. Log pruned axioms for auditing. Add `pruned: Axiom[]` to `CascadeCompressionResult`.

This is the only upstream quality gate that's actually blocking. The confidence threshold (0.5→0.7) and cross-dimension dedup are nice improvements but the prose expander doesn't need them — it handles noise and redundancy naturally when synthesizing paragraphs.

**Acceptance Criteria**:
- [ ] Axiom count capped at 25 (hard limit, not warning)
- [ ] Strongest-evidence axioms retained
- [ ] Pruned axioms in result metadata for auditing
- [ ] Existing tests updated

---

### Stage 2: Prose Expander

**Why**: This is the core of the plan. Turn axiom data into language.

**New file**: `src/lib/prose-expander.ts`

**What it does**: Takes axioms, groups them by target soul section, makes one LLM call per section to generate prose in the right format for that section.

**Soul sections and their formats** (matching souls.directory conventions):

| Section | Format | Source Dimensions |
|---------|--------|-------------------|
| **Core Truths** | Bold principle + elaboration sentence. 4-6 principles. | identity-core, honesty-framework |
| **Voice** | 1-2 prose paragraphs + `Think: [analogy]` line. | voice-presence, character-traits |
| **Boundaries** | 3-5 `You don't...` / `You won't...` contrast statements. | boundaries-ethics (+ inversion of all axioms) |
| **Vibe** | 2-3 sentence prose paragraph capturing the feel. | All dimensions (holistic synthesis) |

Four sections, not six. Fewer sections = each one is richer. "Relationships" and "Growth" from the old plan are absorbed into Core Truths (if the axioms point there) or Vibe (if they're about overall character). Sections with no axioms get omitted, not filled.

**Per-section LLM prompts must specify the target format.** The Core Truths prompt asks for bold-principle-then-elaboration pairs. The Voice prompt asks for prose paragraphs. The Boundaries prompt asks for contrast statements. Each prompt receives the native text of axioms assigned to that section (never CJK notation).

**Anti-patterns prompt**: The Boundaries section prompt receives all axioms + the already-generated Core Truths and Voice sections, then asks: "What would betray this identity?" This produces specific anti-patterns rather than generic "don't be bad" statements.

**Validation per section**:
- Core Truths: must contain at least one `**bold**` pattern
- Voice: must be prose (no bullets), must use second person
- Boundaries: each line must start with "You don't" / "You won't" / "You're not" / "You never"
- Vibe: must be 2-4 sentences, prose
- On validation failure: retry once with corrective feedback. On second failure: fall back to native axiom text as bullets (graceful degradation).

**Closing tagline**: One additional LLM call — given the full generated soul, produce a single italicized closing line that captures the personality. Validated for length (under 15 words) and that it's not a trait list.

**Parallelism**: Core Truths, Voice, and Vibe can run in parallel (independent). Boundaries must run after Core Truths + Voice (needs them as input). Closing tagline runs last.

**Acceptance Criteria**:
- [ ] Prose expander module with section-aware prompts
- [ ] Core Truths uses bold+elaboration format
- [ ] Voice is prose with Think: analogy
- [ ] Boundaries are contrast statements derived from identity
- [ ] Vibe is short prose paragraph
- [ ] Closing tagline generated
- [ ] Validation per section with retry + graceful fallback
- [ ] Sections with no axioms omitted
- [ ] Tests with mock LLM

---

### Stage 3: Wire Into Pipeline and Update Soul Generator

**Why**: Connect the prose expander to the existing pipeline and replace the output template.

**Files**: `src/lib/pipeline.ts`, `src/lib/soul-generator.ts`

**Pipeline change**: Add `prose-expansion` stage between `validate-output` and `backup-current`. The stage calls `expandToProse(axioms, llm)` and stores the result in a new `PipelineContext.proseExpansion` field.

**Soul generator change**: `formatSoulMarkdown()` currently iterates dimensions and renders `- ${canonical.notated}` bullets. Replace with:

1. Header: `# SOUL.md`
2. Essence statement (from existing `essence-extractor.ts`, already integrated)
3. Separator
4. Prose sections in order: Core Truths, Voice, Boundaries, Vibe
5. Closing tagline
6. Separator
7. Provenance table (kept, unchanged)
8. Remove Metrics section from output (move to pipeline log)

**Backward compatibility**: Add `outputFormat: 'prose' | 'notation'` to `SoulGeneratorOptions`. Default `'prose'`. When `'notation'`, use current behavior. When no LLM available for prose expansion, fall back to notation automatically.

**Tests**:
1. Full pipeline with mock LLM produces prose SOUL.md
2. Output contains Core Truths with bold+elaboration
3. Output contains Voice with prose paragraphs
4. Output contains Boundaries with contrast statements
5. Output contains Vibe paragraph
6. Output contains closing tagline
7. `outputFormat: 'notation'` produces legacy output
8. No-LLM fallback produces notation format
9. Sections with no axioms are omitted
10. Provenance section still present

**Acceptance Criteria**:
- [ ] `prose-expansion` pipeline stage added
- [ ] Soul generator renders prose sections
- [ ] Essence statement preserved at top
- [ ] Provenance kept, metrics removed from output
- [ ] Legacy notation format via `outputFormat` option
- [ ] All tests pass, no regression

---

### Stage 4: Documentation Update

**Why**: Follow documentation-update workflow to ensure all project docs reflect the new prose output format.

**Workflow Reference**: `docs/workflows/documentation-update.md`

**Scope Classification**: This is a **Feature** + **Module structure** change affecting:
- Output format (notation → prose)
- New module (`prose-expander.ts`)
- Pipeline stage addition

**Files to update**:

| File | What to Update |
|------|----------------|
| `docs/ARCHITECTURE.md` | Add prose-expander module, update output format section |
| `skill/SKILL.md` | Update example output, add `outputFormat` option if exposed |
| `README.md` | Update feature list, example output snippet |
| `docs/plans/README.md` | Mark this plan as complete |

**Tasks**:

1. **Update ARCHITECTURE.md**:
   - [ ] Add `prose-expander.ts` to module diagram
   - [ ] Document prose expansion pipeline stage
   - [ ] Update SOUL.md output format description
   - [ ] Document section formats (Core Truths, Voice, Boundaries, Vibe)

2. **Update skill/SKILL.md**:
   - [ ] Update example SOUL.md output to show prose format
   - [ ] Document `--format notation` flag for legacy output (if exposed)

3. **Update README.md**:
   - [ ] Update feature description to mention prose output
   - [ ] Add example output snippet showing prose format

4. **Run verification commands** (from workflow):
   ```bash
   # Check for stale notation references
   grep -r "💡\|明:\|CJK" docs/ARCHITECTURE.md README.md skill/SKILL.md

   # Verify prose-expander documented
   grep -r "prose-expander\|prose expansion" docs/ARCHITECTURE.md
   ```

**Acceptance Criteria**:
- [ ] ARCHITECTURE.md documents prose-expander module
- [ ] skill/SKILL.md shows prose output example
- [ ] README reflects prose output capability
- [ ] No stale references to notation-only output
- [ ] Verification commands pass

**Commit**: `docs(neon-soul): update documentation for prose output format`

---

## What This Plan Does NOT Include (and why)

| Excluded | Why |
|----------|-----|
| Raise confidence threshold (0.5→0.7) | Useful but not blocking. The prose LLM handles noisy inputs. Do separately. |
| Cross-dimension axiom deduplication | The prose expander naturally deduplicates — when synthesizing a paragraph from 5 similar axioms, it won't repeat itself. Do separately if axiom counts stay high after the cap. |
| Notation validation (CJK/pinyin) | Notation no longer appears in agent-facing output. Only matters for audit views. Do separately. |
| Meta-axiom synthesis (85→15) | **Superseded by this plan.** Prose expander achieves the same goal (cognitive load reduction) more elegantly by synthesizing paragraphs rather than adding an extra compression layer. |
| Example Interaction section | Would require generating synthetic dialogue. High LLM cost, hard to validate. Can add later once the basic prose format is proven. |

---

## Compression vs Presentation

**Important clarification**: This plan does NOT reduce compression — it changes presentation.

```
Memory (thousands of tokens)
    ↓  [7:1 compression]
Axioms (15-25 compressed)     ← Compression layer (preserved)
    ↓  [expansion for usability]
Prose (200-500 words)         ← Presentation layer (new)
```

**The compression benefit is preserved:**
- Memory → Axioms: ~7:1 ratio (unchanged)
- Axiom store holds dense, provenance-tracked identity
- Over time, the axiom layer grows richer without growing larger

**The output format is configurable:**
- `prose` (default): Inhabitable language for agents to embody (~200-500 words)
- `notation`: Compact CJK/emoji bullets for storage/debugging (~100 tokens)

Both formats derive from the same compressed axiom layer. Prose is larger but usable; notation is compact but uninhabitable. The underlying compression benefit (dense axiom store) remains regardless of output format.

---

## Verification

Run synthesis against Parish's memory. The output passes if:

1. A human reading it can answer: **Who is this agent? How does it talk? What does it care about? What won't it do?**
2. It structurally resembles a soul from souls.directory (Core Truths with bold+elaboration, Voice as prose, Boundaries as contrast statements)
3. No CJK notation, mathematical symbols, or compressed tokens in agent-facing sections
4. Total output is 200-500 words (not 85 bullet points, not 2000 words)
5. Provenance section still traces to signals

---

## Estimated Scope

| Stage | New Code | Modified Code |
|-------|----------|---------------|
| 1: Cognitive load cap | ~20 lines | ~30 lines |
| 2: Prose expander | ~250 lines | 0 |
| 3: Pipeline + generator | ~30 lines | ~100 lines |
| 4: Documentation | 0 | ~100 lines |
| **Total** | **~300 lines** | **~230 lines** |

Four stages, four commits, ~530 lines total.

---

## Cross-References

**Supersedes**:
- `docs/plans/2026-02-10-meta-axiom-synthesis.md` — Prose expansion achieves cognitive load reduction more elegantly

**Complements**:
- `docs/plans/2026-02-10-emergence-facilitation.md` — Input quality (this plan fixes output quality)
- `docs/plans/2026-02-10-essence-extraction.md` — Complete, preserved in new format

**Reviews**:
- `docs/reviews/2026-02-10-inhabitable-soul-output-codex.md` — Codex/GPT-5.1 review
- `docs/reviews/2026-02-10-inhabitable-soul-output-gemini.md` — Gemini 2.5 Pro review

**Issues**:
- `docs/issues/2026-02-10-inhabitable-soul-output-code-review-findings.md` — Consolidated findings (3 critical, 4 important, 4 minor)

**Workflows**:
- `docs/workflows/documentation-update.md` — Stage 4 follows this workflow

**External**:
- [souls.directory/how-to-write](https://souls.directory/how-to-write) — Template patterns

---

## Approval

- [x] Plan reviewed
- [x] Ready to implement
- [x] Implementation complete (2026-02-10)
