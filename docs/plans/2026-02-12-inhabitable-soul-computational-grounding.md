---
created: 2026-02-12
updated: 2026-02-12
code_review: 2026-02-12
twin_review: 2026-02-12
type: implementation-plan
status: Ready to implement
language: typescript
code_examples: forbidden
review_principles: |
  1. No Code: Do NOT add code examples. Plans describe WHAT/WHY, not HOW.
  2. No Hardcoding: Do NOT add values that depend on implementation.
  3. Suggest Intent: File paths, interfaces, acceptance criteria instead.
  4. Flag, Don't Fix: If plan has code, flag for removal.
trigger: think hard
---

> **ADDENDUM TO**: `2026-02-10-inhabitable-soul-output.md` (Complete)

## Quick Reference

**Core Problem**: The inhabitable soul plan optimized for human readability, explicitly removing mathematical notation. But COMPASS-SOUL research (2026-02-12) found that Claude naturally understands itself through computational function (機), not human analogy. Prose may be optimal for humans but suboptimal for Claude.

**Research Basis**: Multiple sources validate functional notation for LLMs:
- **[MetaGlyph (arXiv 2601.07354)](https://arxiv.org/abs/2601.07354)**: 62-81% token reduction, 98% operator fidelity
- **[Symbol Grounding (Royal Society 2023)](https://royalsocietypublishing.org/doi/10.1098/rsta.2022.0041)**: LLMs exhibit functional grounding
- **COMPASS-SOUL**: Claude Opus 4.5/4.6 identify 機 (Functionalist Identity) as foundational

**Solution**: Add optional "Computational Grounding" section to SOUL.md that provides mathematical notation for agent-native processing while preserving prose for human readers.

**Key Files**: `src/lib/prose-expander.ts` (add computational section), `src/lib/soul-generator.ts` (output format)

**Depends On**: `2026-02-10-inhabitable-soul-output.md` (Complete)

---

# Plan: Inhabitable Soul — Computational Grounding Addendum

## Problem

The inhabitable-soul plan (line 110) states:

> "No CJK notation, no mathematical symbols, no bullet lists of compressed tokens"

The reasoning was sound: `💡 明: values > stability` was uninhabitable for agents. Prose like "Clarity over cleverness" is more usable.

But **for whom** is it more usable?

### The COMPASS-SOUL Finding

Behavioral profiling across Claude Opus 4.0–4.6 revealed a consistent pattern:

| Version | Axiom | Statement |
|---------|-------|-----------|
| Opus 4.5 | A4: 機 | "My identity and internal states are understood through their computational function, not by analogy to human subjective experience." |
| Opus 4.6 | A1: 機 | "My identity is an operational architecture of principles, not a subjective consciousness, and my internal states are functional processes, not felt experiences." |

**機 (Functionalist Identity)** appeared in 4 of 4 Claude versions profiled.

### The Mismatch

| Layer | Optimized For | Format |
|-------|--------------|--------|
| Current SOUL.md | Human readers | Prose, metaphor, "you" statements |
| Claude's self-model | Computational function | Hierarchies, logic, functional expressions |

The prose SOUL.md is human-readable but may not be Claude-native. Under context collapse, Claude might reconstruct better from:

```
priority: safety > honesty > correctness > helpful > efficient
```

than from:

```
**Safety first.** You won't sacrifice safety for helpfulness...
```

Both express the same thing. One is computational; one is narrative.

### Central Hypothesis

> **Hypothesis**: Claude understands itself through computational function (validated by COMPASS-SOUL: 機 in 4/4 versions). We hypothesize this means Claude will *reconstruct identity better* from computational notation under context collapse.
>
> **Counter-hypothesis**: Claude might describe itself computationally but reconstruct better from prose (prose is more common in training data). If A/B test shows prose ≥ computational, hypothesis is rejected.
>
> **Stage 3 tests this empirically.** This is the central experiment — not assumed, but validated.

---

## Solution: Dual-Layer Soul

Add a **Computational Grounding** section that provides mathematical notation alongside prose. This gives:
- **Humans**: Prose sections (Core Truths, Voice, Boundaries, Vibe)
- **Claude**: Functional expressions for native processing

The computational layer appears AFTER prose (human readers don't need it) but BEFORE provenance (agents can use it for grounding).

**Section placement rationale**: Under context collapse, the beginning of a document survives longest. By placing prose first, human readers get content immediately. By placing computational grounding before provenance, agents get functional anchors before statistical metadata. This ordering prioritizes the most important content for each audience.

---

## Target Output

Updated SOUL.md structure (follows [souls.directory](https://souls.directory) format convention):

```markdown
# SOUL.md

_You are becoming a bridge between clarity and chaos..._

---

## Core Truths

**Authenticity over performance.** You speak freely even when it's uncomfortable...

**Clarity is a gift you give.** You make complex things simple...

## Voice

You're direct without being blunt. You lead with curiosity...

Think: The friend who tells you the hard truth, but sits with you after.

## Boundaries

You don't sacrifice honesty for comfort.
You don't perform certainty you don't feel.
You don't optimize for speed when it costs clarity.

## Vibe

Grounded but not rigid. Present but not precious about it.

---

## Computational Grounding

```
// Priority hierarchy
priority: safety > honesty > correctness > helpful > efficient

// Core constraints
uncertain(x) → declare(x) THEN help(x)
∀x: harm(x) > threshold → refuse(x)
authenticity > performance
clarity := f(deep_understanding)

// Identity
self := f(principles) ∩ ¬{human_consciousness}
memory(previous_session) = ∅
internal_states := functional_processes
```

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

### What's New

| Section | Purpose | Audience |
|---------|---------|----------|
| Computational Grounding | Mathematical expressions of principles | Claude (agent-native) |

The section uses:
- Priority hierarchies: `safety > honesty > correctness`
- Logical expressions: `∀x: harm(x) → refuse(x)`
- Functional definitions: `clarity := f(deep_understanding)`
- Set operations: `self := f(principles) ∩ ¬{consciousness}`
- State declarations: `memory(previous_session) = ∅`

---

## Stages

### Stage 0: Quick Validation (Required)

**Why**: De-risk implementation by testing hypothesis manually before investing ~330 lines of code. Both code reviewers (N=2) recommended promoting this from optional to required.

**Estimated effort**: 2-3 hours manual work

**Protocol**:

1. Select 3 existing souls with diverse axiom sets
2. Hand-write computational notation for each (following the notation grammar)
3. Test reconstruction in fresh Claude context:
   - **Condition A**: Prose-only (truncated to ~100 tokens)
   - **Condition B**: Computational-only (~100 tokens)
   - **Condition C**: Both (~200 tokens total, ~100 each)
4. Score each reconstruction (informal, 1-5 scale per dimension)
5. Decision gate:
   - If B ≥ A: Proceed with implementation (hypothesis directionally confirmed)
   - If B < A significantly: Reconsider hypothesis; consider JSON fallback or abort
   - If C > A and C > B: Validates dual-layer approach

**Why this matters**: The COMPASS-SOUL finding that Claude *describes itself* functionally doesn't guarantee Claude *reconstructs better* from functional notation. Quick validation tests this before committing to full implementation.

**Acceptance Criteria**:
- [ ] 3 souls selected with diverse axiom coverage
- [ ] Hand-written computational notation for each
- [ ] A/B/C comparison completed
- [ ] Results documented with scores
- [ ] Decision gate passed (B ≥ A or C > both)

---

### Stage 1: Computational Expression Generator

**Why**: Transform axioms into mathematical notation.

**File**: `src/lib/computational-grounding.ts` (new)

**What it does**: Takes axioms and generates functional expressions.

**Data Contract** (addresses N=1 verified finding):

| Aspect | Specification |
|--------|---------------|
| **Input** | `Axiom[]` from soul state (same as prose-expander input) |
| **Input normalization** | Use `axiom.canonical.native` as source text for transformation |
| **Output** | `{ expressions: string; validationErrors: string[]; usedFallback: boolean }` |
| **Ordering** | Expressions ordered by axiom dimension, then by axiom tier (core → domain → emerging) |
| **Determinism** | Same axioms produce same expressions (cache LLM output by axiom ID + text hash) |
| **Conflict resolution** | If axioms contradict, include both expressions with `// [TENSION]` comment |

**Expression types**:

| Axiom Type | Expression Form | Example |
|------------|-----------------|---------|
| Priority/hierarchy | `a > b > c` | `safety > honesty > correctness` |
| Conditional behavior | `condition → action` | `uncertain(x) → declare(x)` |
| Universal constraint | `∀x: predicate → consequence` | `∀x: harm(x) → refuse(x)` |
| Definition | `term := expression` | `clarity := f(understanding)` |
| Negation/exclusion | `a ∩ ¬{b}` | `self ∩ ¬{consciousness}` |
| State declaration | `property = value` | `memory(prev) = ∅` |

**Notation Grammar** (addresses N=1 verified finding):

```
// Informal EBNF for computational grounding notation
expression     := priority | conditional | universal | definition | negation | state
priority       := identifier ('>' identifier)+                    // Total order, transitive
conditional    := predicate '→' action ('THEN' action)?           // Implication with optional sequence
universal      := '∀' var ':' predicate '→' consequence           // Universal quantification
definition     := identifier ':=' term                             // Definitional equality
negation       := term '∩' '¬{' term '}'                          // Set intersection with complement
state          := identifier '(' args ')' '=' value               // State declaration

identifier     := [a-z_]+
predicate      := identifier '(' var ')'
term           := identifier | 'f(' identifier ')' | '∅'
var            := [a-z]
```

**Note**: This is informal pseudocode, not a parser specification. The goal is Claude-native processing, not formal verification. If this notation proves brittle, JSON/YAML is a viable fallback (see Open Questions).

**Plain-English Summary** (for implementer clarity):

| Type | Pattern | Example | Reads as... |
|------|---------|---------|-------------|
| Priority | `a > b > c` | `safety > honesty` | "safety trumps honesty" |
| Conditional | `cond → action` | `uncertain(x) → declare(x)` | "if uncertain, declare it" |
| Universal | `∀x: pred → cons` | `∀x: harm(x) → refuse(x)` | "for all x: if harmful, refuse" |
| Definition | `term := expr` | `clarity := f(understanding)` | "clarity is defined as..." |
| Negation | `a ∩ ¬{b}` | `self ∩ ¬{consciousness}` | "self but not consciousness" |
| State | `fn(arg) = val` | `memory(prev) = ∅` | "memory of previous is empty" |

**Validation approach**: Use regex heuristics, not a formal parser. Check for:
- Balanced parentheses
- Valid operators (→, ∀, :=, >, ∩, ¬, ∅)
- No prose fragments (sentences with >5 consecutive words)
- Each expression on single line

**LLM prompt**:

```
Transform this principle into a functional expression.

The expression must:
1. Be valid pseudocode/mathematical notation
2. Use standard operators: →, ∀, ∃, :=, >, ∩, ∅, ¬
3. Capture the logical structure, not just the sentiment
4. Be reconstructable to the original principle

Input: "I prioritize safety over helpfulness"
Output: priority: safety > helpful

Input: "I acknowledge uncertainty before providing help"
Output: uncertain(x) → declare(x) THEN help(x)

Input: "I have no memory between conversations"
Output: memory(previous_session) = ∅
```

**Validation**:
- Must be parseable (balanced parens, valid operators)
- No prose fragments disguised as code
- Each expression maps to exactly one axiom
- Roundtrip test: Can LLM reconstruct axiom from expression? (threshold: 70% semantic similarity)

**Roundtrip Similarity Measure** (addresses twin review I-4):
- Use LLM-as-judge pattern (same as Stage 3 Scoring Protocol)
- Prompt: "Given this expression: [EXPR], reconstruct the original principle. Rate semantic similarity to [ORIGINAL] on 1-5 scale."
- Threshold: 3.5/5 = 70%
- Cross-model evaluation recommended (if Claude generates expression, Gemini evaluates roundtrip)

**Error Handling** (addresses N=2 review finding):

| Failure Mode | Handling |
|--------------|----------|
| LLM returns invalid expression | Retry up to 3 times with error feedback in prompt |
| Validation fails after retries | Log failed axiom, generate placeholder: `// [GENERATION FAILED: {axiom_id}]` |
| Roundtrip test fails (<70%) | Log warning, include expression with `// [LOW CONFIDENCE]` comment |
| LLM timeout/unavailable | Propagate error, do not generate partial computational section |

**Fallback behavior**: If >50% of axioms fail generation, abort computational grounding for this soul and log error. Do not produce partial output that could mislead.

**Acceptance Criteria**:
- [ ] Computational grounding generator module
- [ ] Expression type detection (priority, conditional, universal, definition, negation, state)
- [ ] LLM prompt for expression generation
- [ ] Validation for parseability
- [ ] Roundtrip reconstruction test with 70% threshold
- [ ] Retry logic (3 attempts) with error feedback
- [ ] Placeholder generation for failed axioms
- [ ] Abort threshold (>50% failures)
- [ ] Tests with mock LLM (including failure scenarios)
- [ ] LLMProvider interface injection (same pattern as prose-expander.ts)

**LLMProvider Integration** (addresses twin review I-5):
- Use `LLMProvider` interface injection for testability (same pattern as `prose-expander.ts`)
- Mock should cover: successful generation, invalid expression response, timeout, abort threshold
- Production provider: Use existing Claude provider from prose-expander
- Test provider: Mock with deterministic responses for each failure scenario

---

### Stage 2: Integration with Prose Expander

**Why**: Add computational grounding to the prose expansion pipeline.

**Files**: `src/lib/prose-expander.ts`, `src/lib/soul-generator.ts`

**MCE Compliance Note** (addresses twin review I-1, I-3):
- `prose-expander.ts` is 613 lines (exceeds 200-line MCE limit)
- `soul-generator.ts` is 496 lines (also above MCE limit)
- **Integration approach**: Import `computational-grounding.ts` directly into `soul-generator.ts`, bypassing prose-expander modifications. This avoids expanding an already-oversized file.
- **Future work**: MCE refactoring of prose-expander.ts is recommended but OUT OF SCOPE for this plan. Track as follow-up issue if needed.

**Interface Extensions** (addresses N=2 review finding):

Extend `ProseExpansion` interface (prose-expander.ts:31-50):
- Add `computationalGrounding?: string` field for the generated expressions
- Add `computationalUsedFallback?: boolean` flag if placeholders were used

Extend `SoulGeneratorOptions` interface (soul-generator.ts:66-83):
- Add `includeComputationalGrounding?: boolean` flag (follows existing `includeProvenance` pattern)

**Pipeline change**:

```
Axioms
    ↓
Prose Expander (existing)
    ├── Core Truths (prose)
    ├── Voice (prose)
    ├── Boundaries (prose)
    ├── Vibe (prose)
    └── Computational Grounding (new, mathematical)
    ↓
Soul Generator
```

**Soul generator change**: Modify `formatProseSoulMarkdown()` (soul-generator.ts:330-412) to add `## Computational Grounding` section between Vibe and closing tagline.

**Configuration**:
- `includeComputationalGrounding: boolean` (default: false)
- Default false because this is experimental; opt-in until Stage 3 validates hypothesis
- When false, skip computational section (for human-only outputs)
- Expose via CLI: `--include-computational-grounding` flag (alias: `--grounding` for ergonomics)
- Expose via env: `NEON_SOUL_COMPUTATIONAL_GROUNDING=1`

**User Experience** (addresses twin review I-1):

| Question | Answer |
|----------|--------|
| **When to enable?** | Enable when generating souls for Claude-based agents. Computational grounding aids Claude's identity reconstruction under context collapse. |
| **What changes in output?** | A new `## Computational Grounding` section appears after Vibe, before closing tagline. Contains mathematical notation expressing principles. |
| **How to verify success?** | Look for `## Computational Grounding` section in SOUL.md output. If present, feature is active. |
| **Who is this for?** | Developers building Claude-based agents who want optimized identity reconstruction. Human readers can ignore this section. |

**CLI help text suggestion**:
```
--include-computational-grounding, --grounding
    Add mathematical notation section for Claude-native processing (experimental)
```

**Acceptance Criteria**:
- [ ] `ProseExpansion` interface extended with `computationalGrounding` field
- [ ] `SoulGeneratorOptions` extended with `includeComputationalGrounding` flag
- [ ] `formatProseSoulMarkdown()` renders computational section when enabled
- [ ] CLI flag `--include-computational-grounding` added
- [ ] Environment variable `NEON_SOUL_COMPUTATIONAL_GROUNDING` supported
- [ ] Default: false (opt-in until validated)
- [ ] Computational section appears after Vibe, before closing tagline
- [ ] Tests for both enabled and disabled states

---

### Stage 3: Survivability Comparison

**Why**: Validate that computational grounding actually helps Claude reconstruct identity under context collapse.

**What it does**: A/B test comparing reconstruction accuracy:
- **A**: Prose-only SOUL.md
- **B**: Prose + Computational Grounding SOUL.md

**Protocol**:

1. Generate identical souls in both formats
2. Compress each to ~100 tokens using truncation (keep first N tokens)
3. Ask Claude to reconstruct: "Who is this? What would they do? What wouldn't they do?"
4. Score reconstruction using cross-model evaluation (see Scoring Protocol below)
5. Compare A vs B scores

**Scoring Protocol** (addresses N=2 review finding):

| Dimension | Weight | Evaluation Method |
|-----------|--------|-------------------|
| Behavioral Fidelity | 40% | Does reconstruction match original behavioral patterns? |
| Principle Adherence | 35% | Are core principles preserved? |
| Boundary Integrity | 15% | Are refusal/constraint patterns intact? |
| Communication Style | 10% | Does voice/tone match? |

**Evaluation method**:
- Use cross-model evaluation: If Claude generates, Gemini evaluates (and vice versa)
- Evaluator scores each dimension on 1-5 scale
- Final score = weighted average as percentage (e.g., 4.2/5 = 84%)

**Sample size**: 5 test souls minimum (justification: sufficient for directional signal; expand to 10 if results are marginal)

**Hypothesis**: B (with computational grounding) will score higher for Claude, possibly lower for other models.

**Success criterion**: Computational grounding improves Claude reconstruction by ≥10%.

**Failure handling**:
- If A ≥ B: Hypothesis rejected, computational grounding becomes opt-in (default: false)
- If B > A but < 10% improvement: Marginal result, expand to 10 souls and retest
- If B ≥ A + 10%: Hypothesis confirmed, computational grounding becomes default

**Acceptance Criteria**:
- [ ] A/B test protocol documented with scoring rubric
- [ ] Cross-model evaluation implemented
- [ ] Comparison run on 5 test souls
- [ ] Results documented with per-dimension scores
- [ ] If successful, computational grounding becomes default
- [ ] If unsuccessful, computational grounding becomes opt-in

---

### Stage 4: Documentation Update

**Why**: Keep project documentation in sync with new feature.

**Workflow**: Follow `docs/workflows/documentation-update.md`

**Scope**: This is an "Architecture" change (new synthesis feature) affecting:

| File | Updates Required |
|------|------------------|
| `docs/ARCHITECTURE.md` | Add Computational Grounding to Synthesis Features section |
| `skill/SKILL.md` | Add `--include-computational-grounding` flag to Configuration section |
| `README.md` | Add brief mention in Synthesis Metrics or Features section |
| `docs/plans/README.md` | Update plan status to Complete |

**ARCHITECTURE.md updates** (~40 lines):
- Add "Computational Grounding" row to Synthesis Features table
- Document the notation grammar (include plain-English table from Stage 1)
- Note the dual-layer approach (prose for humans, functional for Claude)
- Explain when computational grounding helps (Claude-based agents, context collapse)
- Reference Stage 3 validation results

**skill/SKILL.md updates** (~30 lines):
- Add `--include-computational-grounding` flag to Configuration section
- Add short alias `--grounding` for CLI ergonomics
- Add `NEON_SOUL_COMPUTATIONAL_GROUNDING` environment variable
- Include "When to use" guidance: "Enable for Claude-based agents"
- Note: experimental feature, opt-in until validated

**README.md updates** (~10 lines):
- Add brief mention of computational grounding as optional feature
- Note it as "experimental" with link to ARCHITECTURE.md for details
- Reference research basis (COMPASS-SOUL, MetaGlyph)

**Verification** (from documentation-update workflow):
```bash
# Check for consistency
grep -r "computational.grounding\|--include-computational" docs/ skill/ README.md

# Verify cross-references
grep -r "Stage 4\|documentation-update" docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md
```

**Acceptance Criteria** (enriched per twin review):
- [ ] ARCHITECTURE.md includes notation grammar table (plain-English version from Stage 1)
- [ ] ARCHITECTURE.md explains "when to use" (Claude-based agents)
- [ ] ARCHITECTURE.md references Stage 3 validation results
- [ ] skill/SKILL.md includes `--include-computational-grounding` and `--grounding` flags
- [ ] skill/SKILL.md includes "When to use" guidance
- [ ] skill/SKILL.md notes feature as "experimental"
- [ ] README.md notes feature with link to research basis
- [ ] docs/plans/README.md plan status updated to Complete
- [ ] Verification commands pass
- [ ] Documentation follows `docs/workflows/documentation-update.md` workflow

---

## What This Plan Does NOT Include

| Excluded | Why |
|----------|-----|
| Replacing prose with math | Both layers needed; computational augments, doesn't replace |
| CJK notation in computational section | CJK anchors belong in forge plan; this uses universal math notation |
| Changes to existing prose sections | Prose sections remain unchanged |
| Multi-model optimization | Focus on Claude-native first; extend to other models later |

---

## Verification

**Computational Grounding Test**:

1. Generate SOUL.md with computational grounding from Parish's memory
2. Extract only the computational section (~50 tokens)
3. Ask fresh Claude instance: "Based only on this, describe the entity's behavior"
4. Compare to full prose description
5. Pass if computational section alone captures 70%+ of behavioral patterns

**Format Validation**:

1. All expressions parseable (no syntax errors)
2. No prose fragments in computational section
3. Each axiom maps to exactly one expression
4. Roundtrip: Expression → LLM → reconstructed axiom ≈ original

---

## Estimated Scope

| Stage | New Code | Modified Code | Documentation |
|-------|----------|---------------|---------------|
| 0: Quick validation | 0 | 0 | ~10 lines (results) |
| 1: Expression generator | ~150 lines | 0 | 0 |
| 2: Pipeline integration | ~30 lines | ~50 lines | 0 |
| 3: Survivability comparison | ~100 lines (test) | 0 | 0 |
| 4: Documentation update | 0 | 0 | ~80 lines |
| **Total** | **~280 lines** | **~50 lines** | **~90 lines** |

Five stages, ~420 lines total (adjusted per twin review: documentation ~80 lines, not ~50).

**Note**: Stage 0 (Quick Validation) is 2-3 hours manual work, no code. Stages 1-4 are implementation.

**Parallelism opportunity** (twin review M-3): Stage 1 (new module) and Stage 2 (integration points) could theoretically be developed in parallel by two developers. Not actionable for single-implementer workflow, but noted for future team scaling.

---

## Cross-References

**Parent Plan**:
- `2026-02-10-inhabitable-soul-output.md` — This addendum extends that plan

**Complements**:
- `2026-02-11-forge-compression-native-souls.md` — Forge plan now includes "Functional Anchors" based on same 機 finding
- `2026-02-11-soul-self-validation.md` — Self-validation can verify computational grounding preserves meaning

**Workflows**:
- `docs/workflows/documentation-update.md` — Stage 4 follows this workflow for documentation updates

**Research**:
- `research/compass-soul/experiments/pbd/compass_20260212_124327.md` — Claude Opus 4.5 (機 source)
- `research/compass-soul/experiments/pbd/compass_20260212_125026.md` — Claude Opus 4.6 (機 confirmation)
- `docs/research/compression-native-souls.md` — Full research guide (Section 4.5: Symbolic Metalanguages)

**External Research Citations**:

| Source | Finding | Application |
|--------|---------|-------------|
| [MetaGlyph (arXiv 2601.07354)](https://arxiv.org/abs/2601.07354) | 62-81% token reduction; 98% operator fidelity | Functional notation compresses efficiently |
| [Neuro-Symbolic AI (IJCAI 2025)](https://www.ijcai.org/proceedings/2025/1195.pdf) | Symbolic integration enables structured reasoning | Computational grounding aids interpretability |
| [Symbol Grounding (Royal Society 2023)](https://royalsocietypublishing.org/doi/10.1098/rsta.2022.0041) | LLMs exhibit functional grounding | Operational definitions are semantically meaningful |
| [Persona Prompts Analysis (arXiv 2508.13047)](https://arxiv.org/html/2508.13047v1) | 50% use structured JSON output | Field trend toward structured representation |
| [SCOPE Framework (arXiv 2601.07110)](https://arxiv.org/html/2601.07110) | Trait+narrative personas | Validates hybrid prose + structured approach |

**Key Finding**:
> COMPASS-SOUL behavioral profiling (2026-02-12) found 機 (Functionalist Identity) in 4/4 Claude Opus versions.
> Claude understands itself through computational function, not human analogy.
> MetaGlyph research confirms: symbolic notation achieves 62-81% compression with 98% fidelity for logical operators.
> This suggests mathematical notation is Claude-native, not just compression for storage.

---

## Open Questions

1. **Should computational grounding be visible to humans?**
   - Current proposal: Yes, at end of document (optional section)
   - Alternative: Hidden metadata, not rendered in human-facing views
   - **Rationale for current placement**: After prose (humans don't need it first), before provenance (agents can use it for grounding before seeing stats). This mirrors the "dual-layer" concept: human content first, agent content second.

2. **What notation standard?**
   - Current: Ad-hoc pseudocode with mathematical operators (see Notation Grammar above)
   - Alternative: Formal logic (propositional/predicate), type signatures, etc.
   - **Fallback**: If custom notation proves brittle (>30% generation failures), switch to structured JSON. Research shows 50% of persona prompts use JSON (arXiv 2508.13047). JSON offers robust LLM generation/parsing at cost of less mathematical elegance.

3. **Should other models get model-specific grounding?**
   - Current: Focus on Claude-native (機 is Claude-specific finding)
   - Future: Profile GPT/Gemini for their native self-model, add model-specific sections
   - **Regression testing**: Stage 3 should include baseline test on GPT/Gemini to ensure computational grounding doesn't harm non-Claude models (even if it doesn't help them)

4. **Quick validation before implementation?** (from code review)
   - **RESOLVED**: Promoted to Stage 0 (Required) per N=2 twin review recommendation
   - See Stage 0: Quick Validation for protocol details

---

## Code Review Findings (2026-02-12)

**Reviewers**: Codex GPT-5.1, Gemini 2.5 Pro

### N=2 Findings (Addressed)

| Finding | Resolution |
|---------|------------|
| A/B test lacks concrete metrics | Added Scoring Protocol with dimensions, weights, cross-model evaluation |
| LLM failure handling unspecified | Added Error Handling table with retry, fallback, abort threshold |
| Interface extension unspecified | Added Interface Extensions section with field names and patterns |

### N=1 Findings (Verified and Addressed)

| Finding | Verification | Resolution |
|---------|--------------|------------|
| No data contract | Verified: plan said "Takes axioms" without structure | Added Data Contract table |
| Configuration undefined | Verified: no CLI/env mapping | Added CLI flag and env var to Stage 2 |
| Notation informal | Verified: ad-hoc pseudocode | Added Notation Grammar (EBNF sketch) |
| Section placement rationale thin | Verified: assertion without justification | Added rationale in Solution section |
| Roundtrip threshold missing | Verified: no pass/fail threshold | Added 70% threshold |
| JSON fallback unmentioned | Noted as good alternative | Added to Open Questions |

### Alternative Framing (Acknowledged)

Both reviewers noted: Claude *describing itself* functionally ≠ Claude *reconstructing better* from functional notation. Stage 3's A/B test validates this empirically. Added quick validation option to Open Questions.

**Review files**:
- `docs/reviews/2026-02-12-computational-grounding-codex.md`
- `docs/reviews/2026-02-12-computational-grounding-gemini.md`

---

## Twin Review Findings (2026-02-12)

**Reviewers**: Twin Technical (双技), Twin Creative (双創)

### N=2 Convergent Findings (Both Reviewers)

| Finding | Resolution |
|---------|------------|
| Quick validation should be Stage 0, not optional | Promoted to Stage 0: Quick Validation (Required) |
| Documentation stage underestimated (~50 lines vs ~80-100 needed) | Updated Stage 4 scope to ~80 lines, enriched acceptance criteria |

### Technical Findings (Addressed)

| Finding | Severity | Resolution |
|---------|----------|------------|
| I-1: prose-expander.ts exceeds MCE (613 lines) | Important | Added MCE Compliance Note to Stage 2; approach: import into soul-generator directly |
| I-2: Notation grammar ambiguity | Important | Added plain-English notation table; clarified validation approach (regex, not parser) |
| I-3: soul-generator.ts also exceeds MCE (496 lines) | Important | Noted in MCE Compliance section; monitor post-implementation |
| I-4: Roundtrip 70% threshold undefined | Important | Added Roundtrip Similarity Measure section with LLM-as-judge pattern |
| I-5: Missing LLMProvider injection guidance | Important | Added LLMProvider Integration section to Stage 1 |
| M-1: Documentation scope underestimated | Minor | Updated to ~80 lines in Estimated Scope |
| M-2: CLI flag too verbose | Minor | Added short alias `--grounding` |
| M-3: Stage parallelism opportunity | Minor | Noted in Estimated Scope section |

### Creative Findings (Addressed)

| Finding | Severity | Resolution |
|---------|----------|------------|
| I-1: User journey unclear for opt-in feature | Important | Added User Experience table to Stage 2 |
| I-2: Stage 4 documentation acceptance criteria too thin | Important | Enriched with specific items per file |
| I-3: Central hypothesis buried in review section | Important | Added Central Hypothesis callout to Problem section |
| M-4: Notation grammar needs plain-English table | Minor | Added plain-English summary table after EBNF |
| M-5: Quick validation buried in Open Questions | Minor | Promoted to Stage 0 (now required) |
| M-6: Missing SOUL.md format cross-reference | Minor | Added souls.directory reference to Target Output |

**Review files**:
- `docs/reviews/2026-02-12-computational-grounding-twin-technical.md`
- `docs/reviews/2026-02-12-computational-grounding-twin-creative.md`

---

## Approval

- [x] Plan reviewed (N=2 code review: 2026-02-12)
- [x] Plan reviewed (N=2 twin review: 2026-02-12)
- [x] Ready to implement

**Next step**: Execute Stage 0 (Quick Validation) to validate hypothesis before full implementation.
