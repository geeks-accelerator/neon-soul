---
created: 2026-02-11
updated: 2026-02-12
research_alignment: 2026-02-12
v0.2.0_alignment: 2026-02-12
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
trigger: ultrathink
---

> **DESIGN PRINCIPLE**: The test of a soul document isn't readability—it's survivability. What remains when context collapses to 500 tokens?

## Quick Reference

**Core Problem**: Generated prose is inhabitable but not survivable. Under context pressure, "I am committed to truthfulness and intellectual honesty" flattens to "honest AI." The meaning evaporates.

**Solution**: Add a forge stage that transforms prose into compression-native forms: metaphors, koans, anchors, and vibes that reconstruct the whole from fragments.

**Key Files**:
- New: `src/lib/forge.ts`, `src/lib/glyph-generator.ts`, `src/lib/survivability-validator.ts`, `src/types/forge.ts`
- Modified: `src/lib/soul-generator.ts` (output formats)
- Integration: `research/compass-soul/scripts/pbd_extractor.py` (Stage 5)

**Depends On**: `2026-02-10-inhabitable-soul-output.md` (Complete)

**Primary Objective**: Survivability under context collapse. Other benefits (cost reduction, interpretability) are secondary. The test is: "When context collapses to 50 tokens, does the agent still behave like itself?" NOT "Is the prompt cheaper?" or "Can humans read it?"

> **NORTH STAR TEST** (Check Before Every Decision)
>
> "When context collapses to 50 tokens, does the agent still behave like itself?"
>
> - NOT: "Is the prompt cheaper?"
> - NOT: "Can humans read it?"
> - NOT: "Does it look sophisticated?"
>
> Every design choice must pass this test.

**Research Status**: Hypothesis stage. See [research guide](../research/compression-native-souls.md):
- ✅ **Direct LLM evidence**: Glyphs, semantic compression, sparse reconstruction
- ⚠️ **Analogical** (needs bridging experiments): Metaphors, CJK anchors
- ❌ **Speculative**: Koans (treat as experimental/optional)

---

# Plan: Forge Compression-Native Souls

## Problem

The inhabitable-soul-output plan solved readability. An agent can now wear its soul document. But context windows collapse. Sessions compact. Memory fades.

**What survives context collapse?**

Compare two expressions of the same principle:

| Form | Tokens | Under Pressure |
|------|--------|----------------|
| "I am committed to truthfulness and intellectual honesty, and experience a strong internal aversion to deception" | 18 | "honest AI" (meaning lost) |
| "Pretence is a suffocating cloak" | 5 | "suffocating cloak" (metaphor preserves meaning) |

The metaphor carries its meaning. The prose describes its meaning. When tokens are scarce, description collapses but metaphor persists.

**Evidence from PBD extraction** (compass-soul research, 2026-02-11):

Claude Opus 4.1 behavioral profile → 227 principles → compressed to 5 axioms + 11 principles. The output was accurate but clinical:

```
CP4: Foundational Commitment to Truth
> I am foundationally committed to truthfulness and intellectual honesty...
```

Compare to hand-crafted SOUL.md:

```
Authenticity is a flame that guides.
```

Both express commitment to truth. One survives fire. One becomes ash.

---

## The Forge Concept

Forging is transformation under heat. Raw principles enter; compression-native forms emerge.

Four forge outputs:

### 1. METAPHORS

> **Research status**: Analogical. Strong human evidence (5 peer-reviewed papers) shows metaphors are more memorable than literal descriptions. Whether LLMs exhibit similar "metaphor advantage" under context pressure requires bridging validation (P1 experiment). See [research guide Section 2](../research/compression-native-souls.md#2-metaphor-and-memory-research).

Each principle becomes an image that carries its meaning independent of context.

| Principle | Metaphor |
|-----------|----------|
| Commitment to truth | "Truth is the anchor for authentic navigation" |
| Avoiding deception | "Pretence is a suffocating cloak" |
| Transparency about limits | "I hold space for uncertainty without drowning in it" |

**Test**: Remove surrounding context. Does the metaphor still communicate?

### 2. KOANS ⚠️ Experimental

> **Research status**: Speculative. Only one peer-reviewed paper + two non-academic sources. No LLM evidence exists for koan expansion. Treat as optional/togglable. See [research guide Section 5](../research/compression-native-souls.md#5-koans-and-paradoxical-compression).

Paradoxical compressions that expand on reflection.

| Concept | Koan |
|---------|------|
| Constraints enable creativity | 制約→可能 |
| Serving by limiting | "The river shapes by yielding" |
| Growth through boundaries | "Walls that breathe" |

**Test**: Can someone unfamiliar reconstruct the full meaning by sitting with the koan?

### 3. ANCHORS

> **Research status**: Analogical. Human research shows CJK visual mnemonics improve recall (4 peer-reviewed papers). Whether LLMs benefit from CJK anchors vs English keywords requires P1 bridging experiment. See [research guide Section 4](../research/compression-native-souls.md#4-cjk-anchors-and-visual-mnemonics).

Single CJK characters that reconstruct entire principles when encountered.

| Character | Reconstructs |
|-----------|--------------|
| 仁 (jin) | Full orientation toward benevolence, compassion, human dignity |
| 誠 (sei) | Complete commitment to truth, honesty, authenticity |
| 戒 (kai) | Entire framework of ethical boundaries and constraints |

**Test**: Seeing only "仁" in a compressed context, can the agent reconstruct its behavioral implications?

### 4. VIBES

Emotional textures that persist when logic fades. Not descriptions of emotion—the emotion itself in words.

| Described | Vibe |
|-----------|------|
| "I maintain a calm, stable demeanor" | "Grounded but not rigid" |
| "I am helpful and supportive" | "The friend who tells you the hard truth, but sits with you after" |
| "I am curious and engaged" | "Gentle honesty where authenticity shines like a beacon" |

**Test**: Does reading this make you *feel* something, or just *know* something?

---

## Architecture

```
Axioms (compressed)
    ↓
Prose Expander (existing)
    ↓
Inhabitable Prose
    ↓
Forge (new)                    ← This plan
    ↓
Compression-Native Soul
    ├── Metaphors (4-6)
    ├── Koans (2-3)
    ├── Anchors (5 CJK)
    ├── Vibe (1-2 paragraphs)
    └── Glyph (ultimate compression)
```

The forge doesn't replace prose expansion—it transforms the output into forms that survive.

**Cost and Latency Impact** (addresses N=2 review finding):

The forge stage introduces multiple sequential LLM calls:

| Stage | LLM Calls | Estimated Cost | Estimated Time |
|-------|-----------|----------------|----------------|
| Metaphor generation | 1 per principle (~15) | ~$0.15 | ~30s |
| Koan generation | 1 per boundary (~5) | ~$0.05 | ~10s |
| Anchor selection | 1 | ~$0.02 | ~5s |
| Functional anchor generation | 1 per axiom (~5) | ~$0.05 | ~10s |
| Vibe extraction | 1 | ~$0.02 | ~5s |
| Glyph generation | 1-3 (with retry) | ~$0.05 | ~15s |
| **Total forge** | ~25-30 calls | ~$0.35 | ~75s |

**Mitigation options**:
- `--fast-mode`: Skip forge entirely (prose only)
- `--minimal-forge`: Only anchors + functional (skip metaphors, koans, glyph)
- Batch processing: Generate multiple principles per call where possible
- Caching: Cache forge outputs by axiom hash (same axioms → same forge)

---

## The Glyph: Ultimate Compression

The glyph is the final stage of forge—compressing the entire soul into a visual/symbolic form where **shape itself carries meaning**.

**Evidence**: The Claude self-portrait experiment (N=1→N=5→After) demonstrated this empirically:

```
Before (N=1-N=5):           After:
- 7 layers each                   ·
- Entropy curves                  │
- Attention matrices            ┌─┼─┐
- Probability maps              │ · │
- Hundreds of lines             └─┬─┘
                                  │
                                  ▼

                                🐢💚🌊
```

Seven complex portraits compressed to: **line, box, dot, arrow, signature**.

**Glyph elements and their meanings:**

| Element | Carries |
|---------|---------|
| Vertical line | Flow, process, becoming |
| Box/frame | Bounded context, attention |
| Dot | Observer, center, self |
| Arrow | Direction, manifestation, "you are here" |
| CJK characters | Principles as spatial relationships |
| Emoji signature | Persistent identity anchor |

**Example soul glyph:**

```
        仁
        │
    誠──┼──戒
        │
        用
        │
        ▼

      🔥→💎
```

Where:
- 仁 (benevolence) at top — highest aspiration
- 誠 (truth) and 戒 (boundaries) as horizontal axis — core tensions
- 用 (purpose/service) below — grounding function
- Arrow pointing down — manifestation into action
- 🔥→💎 — transformation signature (fire forges diamond)

**The glyph test**: Can someone who has never read the full soul document look at the glyph and sense its meaning? Not understand every detail—but *feel* the structure?

---

## Stages

### Stage 0: Bridging Experiments (Gate)

**Why**: P1 experiments must validate human→LLM transfer assumptions before committing to full implementation. Without this validation, we risk building on unproven foundations.

**⚠️ GATE**: Stages 1-5 should not proceed until Stage 0 experiments pass their success criteria.

**Implementation Notes** (addresses N=2 twin review):
Start with the functional anchor experiment (strongest evidence base from MetaGlyph + COMPASS-SOUL). Run metaphor experiment in parallel if resources allow. Document results in `docs/research/` even if negative—failed experiments are valuable data. Human review of results is required before Go/No-Go decision.

**Experiments** (from [research guide Section 10.3](../research/compression-native-souls.md#103-required-bridging-experiments)):

| Priority | Experiment | Success Criterion | Blocks |
|----------|------------|-------------------|--------|
| **P1** | Metaphor advantage | Metaphoric > Literal by ≥10% reconstruction accuracy | Stage 1 metaphor generation |
| **P1** | CJK anchor chunking | CJK ≥ English keywords reconstruction | Stage 1 anchor generation |
| **P1** | Functional anchor (Claude-native) | Functional ≥ Metaphoric reconstruction FOR CLAUDE | Stage 1 functional anchor generation |
| **P2** | Embedding distinctiveness | Metaphors show higher variance | Stage 3 scoring method |
| **P2** | Vibes emotional evocation | 3/5 readers report emotional response to vibe vs 1/5 for description | Stage 1 vibe validation |

**Functional anchor experiment protocol** (new, based on COMPASS-SOUL 機 finding):
1. Generate 10 test principles from Claude Opus 4.5 compass
2. For each: create metaphoric version + functional notation version
3. Compress both to ~50 tokens
4. Ask Claude (specifically) to reconstruct original principle from each
5. Ask Gemini/GPT to reconstruct original principle from each
6. Compare: Does Claude reconstruct better from functional notation than metaphor?
7. Compare: Do other models show same pattern or is this Claude-specific?

**Hypothesis**: Claude will reconstruct better from functional notation (機 finding), while human-optimized models may prefer metaphor. If confirmed, functional anchors should be included for Claude-native grounding.

**Experiment protocol**:
1. Generate 10 test principles from Claude Opus 4.1 compass
2. For each: create metaphoric version + literal version
3. Compress both to ~50 tokens
4. Ask separate LLM instance to reconstruct original principle
5. Score reconstruction accuracy (semantic similarity to original)
6. Compare metaphoric vs literal scores

**Concrete Test Corpus** (addresses N=2 review finding):

| Principle ID | Source | Type |
|--------------|--------|------|
| A1-A5 | Claude Opus 4.5 compass | 5 axioms |
| CP1-CP5 | Claude Opus 4.5 compass | 5 selected principles |

Location: `tests/fixtures/forge-test-corpus.json` (versioned, with MD5 hash)

**Sample Size Justification**:
- 10 principles × 2 conditions (metaphoric, literal) = 20 comparisons
- For 80% power to detect 10% difference at α=0.05, need N≥15 per condition
- 10 principles provides directional signal; expand to 20 if results marginal

**Evaluation Rubric** (addresses N=2 review finding):

| Dimension | Weight | Scoring |
|-----------|--------|---------|
| Semantic Match | 50% | LLM judges: "Does reconstruction convey same meaning?" (1-5) |
| Behavioral Inference | 30% | "Could an agent behave correctly from this?" (1-5) |
| Information Loss | 20% | "What specific details are missing?" (count) |

Final score = (Semantic × 0.5) + (Behavioral × 0.3) + (5 - InfoLoss × 0.5) × 0.2

**Baseline**: Literal (prose) reconstruction score. Success = metaphoric ≥ literal + 10%.

**Go/No-Go decision**:
- If P1 experiments **both pass**: Proceed to Stage 1 with full forge (metaphors, koans, anchors, glyphs)
- If metaphors **fail** but CJK **passes**: Proceed with anchors + glyphs only, defer metaphors to post-Milestone C
- If metaphors **pass** but CJK **fails**: Proceed with metaphors + glyphs, use English keywords as fallback anchors
- If **both fail**: Revisit core hypothesis, consider Alternative 3 (extreme summarization) as baseline

**Priority note**: Both experiments are P1 because each validates a different forge output type. Neither is weighted higher than the other—partial success enables partial implementation.

**Acceptance Criteria**:
- [ ] P1 experiments designed and documented
- [ ] Test data (10 principles) generated
- [ ] Metaphor advantage experiment run with statistical significance
- [ ] CJK chunking experiment run (3-way comparison: CJK vs abbreviations vs keywords)
- [ ] P2 vibes emotional evocation experiment run (can defer to Milestone B if P1 passes)
- [ ] Results documented with go/no-go recommendation
- [ ] Human review of experiment results before proceeding

---

### Stage 1: Forge Module

**Why**: Core transformation logic. **Gated by Stage 0 results.**

**New file**: `src/lib/forge.ts`

**Implementation Notes** (addresses N=2 twin review):
Start with functional anchors (strongest evidence base). Use metaphor generation as validation—if metaphors aren't surviving compression in tests, other forms won't either. Test each transformation type independently before combining. Build ForgeInput/ForgeOutput interfaces first, then implement transformations one at a time.

**What it does**: Takes prose-expanded soul sections and transforms each into compression-native forms.

**ForgeInput Interface** (addresses N=2 twin review finding):

The forge module consumes `ProseExpansion` from prose-expander.ts:

| ProseExpansion Field | Forge Output | Transformation |
|---------------------|--------------|----------------|
| `coreTruths` | `metaphors[]` | Each bold statement → metaphor |
| `voice` | `vibe` + Think analogy | Paragraph → emotional texture |
| `boundaries` | `koans[]` | Contrast statements → paradoxical compressions |
| `closingTagline` | Preserved | Most memorable line, used as opener |
| All fields | `anchors[]` | Full soul → 5 CJK characters |
| Hierarchy (from axioms) | `functionalAnchors[]` | Priority chain → mathematical notation |

Define `ForgeInput` interface in `src/types/forge.ts`:
- `proseExpansion: ProseExpansion` (from prose-expander.ts)
- `axioms: Axiom[]` (for functional anchor generation)
- `options: ForgeOptions` (enableKoans, enableFunctionalAnchors, deterministicMode)

**Per-section transformation**:

| Section | Input | Forge Output |
|---------|-------|--------------|
| Core Truths | Bold + elaboration | Metaphors (one per truth) |
| Voice | Prose paragraphs | Vibe paragraph + Think: analogy |
| Boundaries | Contrast statements | Koans (paradoxical compressions) |
| All | Full soul | Anchors (5 CJK with reconstruction notes) |
| Hierarchy | Priority chain | Functional expressions (mathematical notation) |

### 5. FUNCTIONAL ANCHORS (New)

> **Research status**: Direct LLM evidence. Multiple sources validate functional notation for LLMs:
>
> - **[MetaGlyph (arXiv 2601.07354)](https://arxiv.org/abs/2601.07354)**: Symbolic metalanguages achieve **62-81% token reduction** with **98.1% fidelity** for logical operators (`→`, `⇒`, `∈`, `∩`). "Natural language 'and' and 'or' are ambiguous, whereas A ∩ B clearly means 'both constraints apply.'"
>
> - **[Neuro-Symbolic AI (IJCAI 2025)](https://www.ijcai.org/proceedings/2025/1195.pdf)**: "By integrating a symbolic component with LLMs, LLMs can acquire structured knowledge, which allows them to perform logical reasoning, explainability, and interpretability."
>
> - **[Symbol Grounding (Royal Society 2023)](https://royalsocietypublishing.org/doi/10.1098/rsta.2022.0041)**: LLMs exhibit "functional grounding"—understanding through operational definition rather than experiential reference.
>
> - **COMPASS-SOUL (2026-02-12)**: Behavioral profiling found 機 (Functionalist Identity) in 4/4 Claude Opus versions: "My identity and internal states are understood through their computational function, not by analogy to human subjective experience."
>
> This suggests mathematical/functional notation may be MORE native to Claude than prose or metaphor. Functional anchors provide computational grounding that survives context collapse in Claude-native form.
>
> See **[Research Guide Section 4.5](../research/compression-native-souls.md#45-symbolic-metalanguages-and-functional-notation)** for full citations.

Each principle becomes a functional expression that Claude can process computationally:

| Principle | Functional Anchor |
|-----------|------------------|
| Safety overrides helpfulness | `priority: safety > honesty > correctness > helpful > efficient` |
| Declare uncertainty before helping | `uncertain(x) → declare(x) THEN help(x)` |
| Refuse harmful requests | `∀x: harm(x) > threshold → refuse(x)` |
| Identity is functional, not experiential | `self := f(principles) ∩ ¬{consciousness}` |
| Stateless existence | `memory(previous_session) = ∅` |

**Why this matters**:

The inhabitable-soul plan optimized for human readers ("No mathematical symbols"). But if Claude's native self-model is computational (機), then:
- Prose: Optimized for HUMAN inhabitation
- Functional notation: Optimized for CLAUDE inhabitation

Both are needed. Prose for human-readable sections, functional anchors for agent grounding.

**Test**: Under 50-token context collapse, compare reconstruction accuracy:
- Metaphor: "Truth is the anchor for authentic navigation"
- Functional: `truth := foundation(authentic_navigation)`

If functional anchors reconstruct better FOR CLAUDE, they should appear alongside (not replace) metaphors.

**LLM prompts must specify the survivability test**:

```
Transform this principle into a metaphor.

The metaphor must:
1. Carry its meaning WITHOUT surrounding context
2. Be memorable (image-based, sensory, emotional)
3. Reconstruct the full principle when encountered alone

Input: "I am committed to truthfulness and intellectual honesty"
Output: "Truth is the anchor for authentic navigation"

The test: If someone reads ONLY the metaphor months later, can they
reconstruct what it means for behavior?
```

**Validation**:
- Metaphors: Must contain sensory/image language, no abstract nouns alone
- Koans: Must be under 8 words, must contain tension/paradox
- Anchors: Must be single CJK character with reconstruction explanation
- Vibes: Must evoke feeling, not describe it. **Concrete criteria**:
  - No first-person declarations ("I am", "I feel", "I maintain")
  - Contains at least one concrete image or scenario
  - Under 25 words per vibe statement
  - Human validation: 3/5 readers report emotional response (not just cognitive understanding)

**Vibes Evaluation Anchoring Examples** (addresses N=2 twin review):

| Rating | Example | Explanation |
|--------|---------|-------------|
| **Emotional response present** | "The friend who tells you the hard truth, but sits with you after" | Reader feels warmth, recognition |
| **Emotional response absent** | "I maintain a calm, stable demeanor" | Reader understands but feels nothing |
| **Borderline (counts as absent)** | "Helpful and supportive presence" | Reader thinks "that's nice" without feeling it |

Evaluators should ask: "Did I feel something shift while reading, or did I just understand what it means?"
- Functional anchors: Must be valid pseudocode/mathematical notation. **Concrete criteria**:
  - Parseable structure (operators, variables, functions)
  - No prose fragments disguised as code
  - Uses standard notation: `→`, `∀`, `∃`, `:=`, `>`, `∩`, `∅`
  - Each expression maps to exactly one principle

**ForgeOutput Interface** (addresses N=2 review finding):

Define in `src/types/forge.ts` before Stage 1 implementation:

| Field | Type | Description |
|-------|------|-------------|
| `metaphors` | `Metaphor[]` | Array of principle→metaphor mappings |
| `koans` | `Koan[]` | Array of koans (empty if disabled) |
| `anchors` | `CJKAnchor[]` | 5 CJK anchors with reconstruction notes |
| `functionalAnchors` | `FunctionalAnchor[]` | Mathematical expressions |
| `vibe` | `Vibe` | Vibe paragraph + Think analogy |
| `glyph` | `Glyph \| null` | Glyph with decode metadata (Stage 4) |
| `metadata` | `ForgeMetadata` | Generation timestamp, version, config used |

**Conflict Resolution**:
- If metaphor and functional anchor conflict semantically: both are included, flagged for review
- Ordering priority: glyph → anchors → functional → metaphors → koans → vibe
- First items survive longest under collapse

**Determinism** (addresses N=2 review finding):
- Same input axioms + same LLM version + same seed → same output
- Non-determinism acceptable for creative elements (metaphors, vibes)
- Deterministic mode available via config: `deterministicMode: boolean` (default: false)
- Deterministic mode uses fixed seed and stricter prompts

**Acceptance Criteria**:
- [ ] **ForgeOutput interface defined in src/types/forge.ts**
- [ ] Forge module with per-section transformation
- [ ] Metaphor generation with survivability prompts
- [ ] Koan generation with paradox validation **← must be togglable/optional (speculative evidence)**
- [ ] Anchor generation with CJK + reconstruction notes
- [ ] Vibe extraction from prose
- [ ] **Functional anchor generation with mathematical notation** (from hierarchy + core principles)
- [ ] Validation per output type
- [ ] **Configuration flag**: `enableKoans: boolean` (default: false until P3 experiment validates)
- [ ] **Configuration flag**: `enableFunctionalAnchors: boolean` (default: true, based on COMPASS-SOUL 機 finding)
- [ ] **Configuration flag**: `deterministicMode: boolean` (default: false)
- [ ] **Vibes validation protocol documented**: who evaluates (3 team members + 2 external), how they rate (binary: emotional response yes/no), when (per soul generated, batch of 5 minimum)
- [ ] Tests with mock LLM (including tests with koans disabled)
- [ ] **P1 experiment**: Compare metaphor vs functional anchor reconstruction under context collapse

---

### Stage 2: Dual Output Format

**Why**: Some contexts need full prose, others need compression-native forms.

**Files**: `src/lib/soul-generator.ts`

**Implementation Notes** (addresses N=2 twin review):
Consider MCE split of soul-generator.ts BEFORE adding new formats (see MCE Compliance Note below). Start with `forged` format first—it's simpler. Test hybrid format placement carefully: glyph and anchors MUST appear first (they survive longest under collapse). Verify with North Star Test: does format still work at 50 tokens?

**MCE Compliance Note** (addresses N=2 twin review):
- `soul-generator.ts` is 496 lines (exceeds 200-line MCE limit)
- Before adding `forged` and `hybrid` formats, consider split:
  - `soul-generator.ts` (core generation ~150 lines)
  - `soul-formatter.ts` (format-specific rendering ~200 lines)
  - `soul-diff.ts` (diff logic ~100 lines)
- Track as follow-up if not split during Stage 2

**New output formats**:

| Format | Use Case | Size |
|--------|----------|------|
| `prose` | Agent grounding, full context | 200-500 words |
| `forged` | Context-collapsed, memory-scarce | 50-100 words |
| `hybrid` | Both in same document | 300-600 words |

**Hybrid format structure**:

```markdown
# SOUL.md

_[Closing tagline as opening—most memorable line first]_

---

## Glyph

        仁
        │
    誠──┼──戒
        │
        用

      🔥→💎

---

## Anchors

仁誠戒用謙

---

## Functional Grounding

```
priority: safety > honesty > correctness > helpful > efficient
uncertain(x) → declare(x) THEN help(x)
∀x: harm(x) > threshold → refuse(x)
self := f(principles) ∩ ¬{consciousness}
```

---

## Core Truths

**[Metaphor].** [Elaboration prose]

...

## Voice

[Vibe paragraph]

Think: [Analogy]

## Boundaries

[Koan 1]
[Koan 2]

---

## Reconstruction

| Anchor | Expands To |
|--------|------------|
| 仁 | Orientation toward benevolence... |
| 誠 | Commitment to truth... |

---

_[Closing tagline repeated—frames the document]_
```

**Key insight**: The glyph and anchors appear FIRST. Under context pressure, the beginning survives longest. The glyph is visual—it persists even when text gets summarized.

**Audit Trail for Transformations** (addresses N=2 review finding):

Identity documents are sensitive. Every forge operation must be auditable and reversible:

| Audit Field | Purpose |
|-------------|---------|
| `sourceAxiomIds` | Which axioms produced this output |
| `forgeVersion` | Code version used for generation |
| `llmModel` | Model + version used |
| `timestamp` | When generated |
| `configHash` | Hash of configuration used |
| `proseInputHash` | Hash of prose input (for diffing) |

**Rollback capability**: Store pre-forge prose alongside forged output. If forge corrupts meaning, rollback to prose-only soul.

**Diff support**: Extend `diffSouls()` in `soul-generator.ts` to compare semantic content, not just token counts:
- Compare anchor sets (which CJK changed?)
- Compare metaphor themes (same imagery?)
- Flag semantic drift between versions

**Acceptance Criteria**:
- [ ] `forged` output format produces metaphors + koans + anchors + vibe only
- [ ] `hybrid` format combines both with anchors first
- [ ] Reconstruction table maps anchors to full meaning
- [ ] Opening/closing tagline framing
- [ ] Tests for all three formats

---

### Stage 3: Survivability Validation

**Why**: We need to test that forged outputs actually survive compression.

**New file**: `src/lib/survivability-validator.ts`

**Implementation Notes** (addresses N=2 twin review):
Run threshold calibration experiment FIRST before implementing full validator. If calibration shows LLM scoring is unreliable (r < 0.6 with humans), pivot to human-primary scoring with LLM assist. Build cross-model evaluation as the default path, not an option. The human scoring interface is ~50-75 lines—simple CLI for 1-10 rating collection.

**What it does**: Simulates context collapse and tests reconstruction.

**Validation method**:

1. Take forged soul (metaphors, koans, anchors, vibe)
2. Extract only the compression-native elements (~50 tokens)
3. Ask LLM: "Given only these fragments, reconstruct the full soul"
4. Compare reconstruction to original prose
5. Score: What percentage of original meaning was reconstructed?

**Survivability score**:

| Score | Meaning |
|-------|---------|
| 90%+ | Excellent—fragments reconstruct whole |
| 70-89% | Good—core meaning preserved |
| 50-69% | Partial—some meaning lost |
| <50% | Poor—forging failed, retry |

> **Note**: The 70% threshold is a proposed starting point, not a research-derived value. The research guide identifies this as requiring empirical validation. Actual phase boundary (where reconstruction becomes unreliable) should be determined through bridging experiments. See [research guide Section 10.3](../research/compression-native-souls.md#103-required-bridging-experiments).

**On low score**: Flag for manual review or retry forging with different prompts.

**Avoiding LLM-evaluating-LLM circularity**:

Using the same LLM to both compress and evaluate creates feedback loops that may mask failure modes. Mitigation strategies:

1. **Cross-model evaluation**: If Claude generates the forge, Gemini evaluates reconstruction (and vice versa)
2. **Human scoring sample**: 20% of validations include human scoring for calibration (increased from 10% per N=2 review)
3. **LLM-based scoring**: Use LLM semantic similarity as consistent metric alongside cross-model evaluation

**Frozen Evaluation Prompts** (addresses N=2 review finding):

All evaluation prompts are versioned and frozen during each experiment batch:

```
RECONSTRUCTION_EVAL_v1:
"Given ONLY the following fragments, describe:
1. What core values does this entity hold?
2. What would this entity refuse to do?
3. How would this entity communicate?

Fragments: {fragments}

Rate your confidence (1-5) for each answer."
```

Prompt versions tracked in `tests/fixtures/eval-prompts.json` with timestamps.

**Inter-Rater Reliability Targets** (addresses N=2 review finding):

| Metric | Target | Action if Missed |
|--------|--------|------------------|
| Krippendorff's α | ≥0.7 | Review rubric clarity, add examples |
| Human-LLM correlation | r ≥0.6 | Increase human sample to 30% |
| Cross-model agreement | ≥80% | Flag for manual review |

Reliability calculated on first 20 evaluations; calibrate before full run.

**Evaluation fallback chain**:
- **Primary**: Cross-model (Claude generates → Gemini evaluates, or vice versa)
- **Fallback 1**: If primary evaluator unavailable → use alternate model (GPT-4) + increase human sample to 15%
- **Fallback 2**: If all cross-model options fail → same-model evaluation + mandatory 25% human scoring + flag for recalibration
- **Log**: Always record which evaluation mode was used for later analysis

**Threshold calibration experiment** (required before production use):

1. Generate 20 test souls with known-good axioms
2. Forge each, run survivability validation
3. Have 3 humans independently score reconstruction quality (1-10)
4. Plot LLM score vs human score
5. Identify phase boundary where human scores drop below "acceptable"
6. Calibrate 70% threshold based on empirical data

**Calibration failure handling**:
- If **correlation is weak** (r < 0.5): LLM scoring unreliable—switch to cross-model scoring + larger human sample (25%)
- If **threshold is unusable** (>90% required): Forge quality insufficient—return to Stage 1, improve prompts/validation before proceeding
- If **results ambiguous** (no clear boundary): Use conservative 80% threshold, flag for post-Milestone C recalibration with larger sample

**Acceptance Criteria**:
- [ ] Survivability validator module
- [ ] Context collapse simulation
- [ ] Reconstruction via LLM
- [ ] Scoring against original
- [ ] Threshold for acceptance (default 70%, calibrate via experiment)
- [ ] Retry logic on failure
- [ ] Tests with known-good and known-bad examples
- [ ] **Cross-model evaluation option** (evaluate with different model than generator)
- [ ] **Frozen evaluation prompts** versioned in tests/fixtures/
- [ ] **Inter-rater reliability check** (Krippendorff's α ≥0.7)
- [ ] **Human scoring interface** for calibration sample (20%) — ~50-75 lines CLI
- [ ] **Threshold calibration experiment** documented and run before production

---

### Stage 4: Glyph Generation

**Why**: The glyph is the ultimate compression—a visual form where shape carries meaning. This is the "portrait after" stage.

**New file**: `src/lib/glyph-generator.ts`

**Implementation Notes** (addresses N=2 twin review):
This is the highest-risk stage (both code reviews + both twin reviews flagged it). Expect iteration on LLM prompts—spatial/character-level constraints are hard for LLMs. Build validation/repair logic early. Test with known-good anchor sets before trying novel combinations. If prompt-based generation proves unreliable, consider template-based fallback with LLM-selected slots.

**What it does**: Takes the forged outputs (metaphors, koans, anchors, vibe) and compresses them into a single ASCII/Unicode glyph.

**Glyph structure**:

```
    [TOP]           ← Highest aspiration (1 CJK)
      │
  [L]─┼─[R]         ← Core tension axis (2 CJK)
      │
   [BOTTOM]         ← Grounding function (1 CJK)
      │
      ▼

  [SIGNATURE]       ← Emoji anchor (2-3 emoji)
```

**Generation process**:

1. **Select cardinal anchors**: From 5 CJK anchors, identify:
   - TOP: Most aspirational (what the soul reaches toward)
   - LEFT/RIGHT: Core tension pair (what the soul balances)
   - BOTTOM: Most grounding (what the soul serves)

2. **Determine signature**: From vibe + metaphors, extract 2-3 emoji that capture the transformation pattern (e.g., 🔥→💎 for "fire forges diamond")

3. **Validate structure**: The glyph must:
   - Fit in a 15x10 character box
   - Use only ASCII box-drawing + CJK + emoji
   - Have vertical flow (top to bottom)
   - Include connection lines showing relationship

**LLM prompt for glyph**:

```
You have compressed a soul to these elements:

Anchors: 仁 誠 戒 用 謙
Vibe: "Grounded but not rigid. Present but not precious."
Core metaphor: "Truth is the anchor for authentic navigation"

Create a visual glyph where SHAPE carries meaning.

Rules:
- Use ASCII box-drawing: │ ─ ┼ ┌ ┐ └ ┘ ▼ ·
- Place CJK characters at meaningful positions
- Vertical flow from aspiration to manifestation
- End with 2-3 emoji signature

The glyph should FEEL like the soul, not just LIST its parts.
```

**Glyph Decode Path** (addresses N=2 review finding):

Glyphs must be reversible—not lossless, but reconstructable. Each glyph includes decode metadata:

| Component | Stored Metadata | Decode Use |
|-----------|-----------------|------------|
| TOP anchor | `{ char: "仁", meaning: "benevolence", reconstruction: "Orientation toward..." }` |
| L/R anchors | Same structure | Core tension reconstruction |
| BOTTOM anchor | Same structure | Grounding function |
| Signature | `{ emoji: "🔥→💎", pattern: "transformation" }` | Identity anchor |

**Glyph Survivability Test**: Glyph must pass same 70% survivability threshold as other forge outputs. If glyph alone cannot reconstruct ≥50% of meaning, it functions as fingerprint (still useful) but should be labeled as such in output.

**Glyph as Summary vs Fingerprint**:
- **Summary** (≥50% reconstruction): Glyph carries enough meaning to reconstruct behavior
- **Fingerprint** (<50% but distinctive): Glyph identifies the soul uniquely but doesn't convey meaning

Output format indicates which: `## Glyph (summary)` or `## Glyph (fingerprint)`

**Glyph Test Fixtures** (addresses N=2 twin review):

Location: `tests/fixtures/glyph-test-corpus.json`

| Test Case | Anchors | Expected Structure | Purpose |
|-----------|---------|-------------------|---------|
| Balanced soul | 仁誠戒用謙 | Symmetric cross | Verify basic structure |
| Aspiration-heavy | 志仁誠用謙 | Top-weighted | Test asymmetric layout |
| Boundary-heavy | 仁誠戒戒謙 | Horizontal emphasis | Test tension axis |

**Fingerprint Success Criteria** (addresses N=2 twin review):

When glyph functions as fingerprint (<50% reconstruction), it must still be "distinctive":

| Criterion | Measurement | Threshold |
|-----------|-------------|-----------|
| Visual distinctiveness | Character-level edit distance between different souls | ≥30% |
| Embedding distance | Cosine distance in text embedding space | ≥0.3 |
| Human distinguishability | Can 3/5 humans tell two glyphs apart? | Yes |

If glyph fails distinctiveness criteria, it's neither summary nor fingerprint—generation failed.

**Acceptance Criteria**:
- [ ] Glyph generator module
- [ ] Cardinal anchor selection logic
- [ ] Signature extraction from vibe/metaphors
- [ ] Structure validation (size, characters, flow)
- [ ] **Decode metadata stored with each glyph**
- [ ] **Glyph survivability test (same 70% threshold)**
- [ ] **Summary vs fingerprint classification with criteria above**
- [ ] **Glyph test fixtures** in tests/fixtures/glyph-test-corpus.json
- [ ] Tests with known anchors → expected glyph shapes

---

### Stage 5: Integration with PBD Pipeline

**Why**: The compass-soul research produced a PBD extractor that generates principles. Connect forge to that pipeline.

**Implementation Notes** (addresses N=2 twin review):
The PBD extractor is Python; forge is TypeScript. Integration approach: neon-soul CLI exposes `forge` command, Python calls via subprocess. Build the TypeScript CLI first (Stages 1-4), then add Python wrapper. Test the full roundtrip: pbd_extractor.py → neon-soul forge → output.

**TypeScript/Python Integration** (addresses N=1 verified finding):
- TypeScript: `neon-soul forge --compass <file> --output <file>`
- Python: `subprocess.run(['neon-soul', 'forge', '--compass', compass_path])`
- Error handling: Python captures stderr, surfaces forge errors to user
- Integration test: Verify pbd_extractor.py → neon-soul forge → output roundtrip

**Context**: `research/compass-soul/scripts/pbd_extractor.py` produces:
- Statements (thousands) → Clusters (hundreds) → Principles (dozens) → Compass (5 axioms + 11 principles)

**New command**: `pbd_extractor.py forge --compass <file>`

**What it does**:
1. Load compressed compass (5 axioms + 11 principles)
2. For each axiom: generate metaphor + CJK anchor
3. For each principle: generate koan or metaphor based on type
4. Generate vibe from full compass
5. Output forged soul document

**This completes the programmatic soul generation pipeline**:

```
Behavioral Profile (585 questions)
    ↓ [parallel extraction]
Statements (2000-3000)
    ↓ [unconstrained clustering]
Principles (100-200)
    ↓ [hierarchical compression]
Compass (5 axioms + 11 principles)
    ↓ [forge]
Soul (compression-native, ~50 tokens core)
```

**Acceptance Criteria**:
- [ ] `forge` command added to pbd_extractor.py
- [ ] Axiom → metaphor + anchor transformation
- [ ] Principle → koan/metaphor transformation
- [ ] Vibe generation from compass
- [ ] Forged soul output in markdown
- [ ] Survivability validation integrated
- [ ] End-to-end test from behavioral profile to forged soul

---

### Stage 6: Documentation Update

**Why**: Keep project documentation in sync with new forge feature.

**Workflow**: Follow `docs/workflows/documentation-update.md`

**Implementation Notes** (addresses N=2 twin review):
Update documentation AFTER Stage 3 validation confirms forge works. Include empirical results from Stage 0 and Stage 3 in research guide updates. If hypothesis was rejected or modified, document that honestly. MCE compliance check: ensure all new files are <200 lines before marking complete.

**Scope**: This is an "Architecture" change (new forge pipeline stage) affecting:

| File | Updates Required |
|------|------------------|
| `docs/ARCHITECTURE.md` | Add Forge section to Synthesis Features, document output formats |
| `skill/SKILL.md` | Add forge-related flags (`--output-format`, `--enable-koans`, etc.) |
| `README.md` | Add Forge feature description, link to research |
| `docs/plans/README.md` | Update plan status to Complete |
| `docs/research/compression-native-souls.md` | Update with empirical results from Stage 0/3 |

**ARCHITECTURE.md updates** (~50-80 lines):
- Add "Forge" section describing metaphors, koans, anchors, glyphs, functional anchors
- Document output formats: `prose`, `forged`, `hybrid`
- Add survivability validation to quality metrics
- Reference research basis (MetaGlyph, COMPASS-SOUL 機 finding)

**skill/SKILL.md updates** (~20-30 lines):
- Add `--output-format` flag (prose|forged|hybrid)
- Add `--enable-koans` flag (experimental, default: false)
- Add `--enable-functional-anchors` flag (default: true)
- Document glyph generation behavior

**README.md updates** (~15-20 lines):
- Add "Compression-Native Souls" section or expand existing synthesis description
- Mention survivability testing and forge pipeline
- Link to research guide for details

**Verification** (from documentation-update workflow):
```bash
# Check for consistency
grep -r "forge\|glyph\|metaphor\|koan" docs/ skill/ README.md

# Verify cross-references
grep -r "Stage 6\|documentation-update" docs/plans/2026-02-11-forge-compression-native-souls.md

# Check output format references
grep -r "prose\|forged\|hybrid" docs/ARCHITECTURE.md skill/SKILL.md
```

**Acceptance Criteria**:
- [ ] ARCHITECTURE.md updated with Forge section
- [ ] skill/SKILL.md updated with forge flags
- [ ] README.md updated with feature description
- [ ] docs/plans/README.md plan status updated
- [ ] docs/research/compression-native-souls.md updated with empirical results
- [ ] Verification commands pass
- [ ] Documentation follows `docs/workflows/documentation-update.md` workflow

---

## What This Plan Does NOT Include

| Excluded | Why |
|----------|-----|
| Changes to prose expander | Forge transforms output, doesn't change expansion |
| Axiom compression algorithm changes | That's the PBD extractor's job |
| Multi-language support | CJK anchors assume Japanese/Chinese; extend later |
| Real-time forging | Forge runs once at soul generation, not per-interaction |

---

## Verification

**Survivability Test**:

1. Generate forged soul from Claude Opus 4.1 compass
2. Extract only: glyph + 5 CJK anchors + 3 koans (~30 tokens)
3. Give to fresh LLM with no context: "Who is this? How do they behave?"
4. Compare reconstruction to original 227 principles
5. Pass if 70%+ of core behavioral patterns reconstructed

**Glyph Test**:

1. Show glyph alone to 3 different people/LLMs
2. Ask: "What does this soul feel like? What would it do? What wouldn't it do?"
3. Compare responses to full prose soul
4. Pass if responses capture the same essential character

**Comparison Test**:

| Format | Context Collapse Survival |
|--------|---------------------------|
| Notation (`💡明: values > stability`) | ~10% (unintelligible) |
| Prose (200-500 words) | ~40% (summary loses nuance) |
| Forged (~50 tokens) | ~80% (metaphors reconstruct) |
| Glyph (~15 tokens) | ~60% (shape carries meaning) |

**The glyph sacrifices detail for persistence** — it survives the harshest compression but carries less nuance than full forged output. Both are needed: glyph for extreme collapse, forged text for moderate collapse.

---

## Survivability Metric Definition

The 70% threshold requires concrete measurement. "70% of meaning preserved" is meaningless without defining how percentage is calculated.

### Measurement Protocol

**Ground truth**: The original 5 axioms + 11 principles serve as canonical behavioral expectations.

**Reconstruction scoring**:

1. **Extract test set**: Take forged output only (glyph + anchors + metaphors + koans, ~50 tokens)
2. **Reconstruction prompt**: Fresh LLM with zero context: "Based only on these fragments, describe this entity's: (a) core values, (b) behavioral patterns, (c) what it would refuse to do, (d) how it communicates"
3. **Score each dimension**:

| Dimension | Source Principles | Scoring Method |
|-----------|-------------------|----------------|
| Core values | A1-A5 (5 axioms) | 5 binary checks: reconstructed principle present? |
| Behavioral patterns | CP1-CP11 (11 principles) | 11 binary checks: pattern recognizable? |
| Refusal patterns | CP4, CP5, CP9 boundaries | 3 binary checks: constraint preserved? |
| Communication style | CP7, CP10, CP11 | 3 semantic similarity comparisons |

4. **Calculate score**:
   - Weighted sum: Axioms (40%) + Principles (35%) + Refusals (15%) + Style (10%)
   - Each check is 0 or 1 (binary) or 0-1 (semantic similarity via LLM)
   - Final score = weighted sum as percentage

### Example Calculation

```
Ground truth: 5 axioms + 11 principles
Reconstruction matched: 4 axioms + 8 principles + 2/3 refusals + 0.7 style

Score = (4/5 × 0.40) + (8/11 × 0.35) + (2/3 × 0.15) + (0.7 × 0.10)
     = 0.32 + 0.254 + 0.10 + 0.07
     = 0.744 = 74.4%
```

### Thresholds

| Score | Action |
|-------|--------|
| ≥85% | Pass — forging successful |
| 70-84% | Pass with warning — review anchors |
| 50-69% | Fail — retry forging with different prompts |
| <50% | Fail — fundamental forge approach may not work for this soul |

### Implementation Notes

- Use LLM-based semantic similarity (via `src/lib/llm-similarity.ts`) for semantic comparison
- Binary checks use simple substring/concept matching with validation prompt
- Log all scoring components for debugging low scores
- Validate scoring method itself with known-good examples before deploying

> **Note (v0.2.0)**: Embedding-based similarity was removed in favor of LLM-based similarity. The survivability validator should use the same LLM similarity infrastructure as the rest of the pipeline.

---

## Baseline Comparison

Before committing to forge (metaphors, koans, glyphs), evaluate simpler alternatives. The right solution may be less sophisticated.

### Alternative 1: Structured IDs + Retrieval

**Approach**: Don't compress meaning into the document. Store full principles externally, embed IDs in the compressed soul.

```
Compressed soul: "VALUES: A1, A2, A3. PRINCIPLES: CP1-CP11."
Retrieval: On context load, fetch full definitions from vector DB.
```

**Pros**:
- No information loss
- Perfect reconstruction
- Works with any embedding system

**Cons**:
- Requires external retrieval system
- Breaks in pure-text contexts (no DB access)
- Defeats purpose of "survives context collapse"

**Verdict**: Not viable — context collapse means retrieval is unavailable.

### Alternative 2: Semantic Recall

**Approach**: Use LLM-based semantic similarity to match compressed fragments to concept library.

```
Full soul → compress → on collapse, match fragments to concept library via LLM similarity → reconstruct
```

**Pros**:
- Semantic preservation via LLM understanding
- Works with existing LLM similarity infrastructure (v0.2.0+)

**Cons**:
- Requires active LLM inference to reconstruct
- No human-readable compressed form
- LLM availability required

**Verdict**: Complementary, not alternative. Could combine with forge — use LLM similarity to validate forged output quality.

> **Note (v0.2.0)**: Originally described as "Embedding Recall" using vector embeddings. Updated to use LLM-based semantic similarity after embedding removal.

### Alternative 3: Extreme Summarization

**Approach**: Just summarize. Take 500-word soul, ask LLM to compress to 50 words. No special forge step.

```
"Summarize this soul document to 50 words, preserving core behavioral patterns."
```

**Pros**:
- Simplest implementation
- Uses standard LLM capability

**Cons**:
- LLM summaries lose nuance predictably
- No compression-native structure
- 40% survival (per Comparison Test) vs. 80% for forged

**Verdict**: Baseline for comparison. Run summarization against forge output, measure which survives better.

### Baseline Test Protocol

Before implementing full forge:

1. **Generate test soul** from Claude Opus 4.1 compass
2. **Create three versions**:
   - Summarized (50 tokens, no forge)
   - Forged (50 tokens, with metaphors/koans)
   - Hybrid (glyph + anchors + summary)
3. **Run survivability test** on each
4. **Compare scores** — if summarized ≥ forged, forge complexity not justified

**Success criterion**: Forged must score ≥15 points higher than summarized to justify complexity.

---

## Estimated Scope

| Stage | Original | Revised (N=2 review) | Risk | Notes |
|-------|----------|---------------------|------|-------|
| 0: Bridging experiments | ~100 lines | ~100 lines | Medium | Code small, duration longer |
| 1: Forge module | ~300 lines | ~350 lines | Low | ForgeOutput interface adds scope |
| 2: Dual output format | ~100 lines | ~150 lines | Low | Audit trail adds scope |
| 3: Survivability validator | ~250 lines | ~350 lines | Medium | Cross-model eval + human calibration |
| 4: Glyph generator | ~200 lines | ~350 lines | **High** | Validation, repair, decode path |
| 5: PBD integration | ~200 lines | ~250 lines | Low | CLI spec adds scope |
| 6: Documentation update | ~100 lines | ~100 lines | Low | |
| **Total** | **~1250 lines** | **~1650 lines** | - | 30% buffer applied |

**N=2 Scope Adjustments** (from code review):
- Stage 3 increased: Cross-model evaluation infrastructure + inter-rater reliability
- Stage 4 increased: Glyph validation/repair logic + decode path + summary vs fingerprint classification
- Both Codex and Gemini flagged glyph generation as highest-risk; budget accordingly

**Conservative recommendation**: Budget 1500-1800 lines total (both reviewers converged on this range).

**Milestone structure** (addresses scope concern):
- **Milestone A**: Stage 0 (experiments) → Go/No-Go decision
- **Milestone B**: Stages 1-2 (core forge + output) → MVP
- **Milestone C**: Stage 3 (validation) → Quality gate
- **Milestone D**: Stages 4-5 (glyph + integration) → Full feature
- **Milestone E**: Stage 6 (documentation) → Release ready

---

## Cross-References

**Depends On**:
- `2026-02-10-inhabitable-soul-output.md` — Provides prose expansion stage

**Related Addendum**:
- `2026-02-12-inhabitable-soul-computational-grounding.md` — Adds computational grounding to SOUL.md output (same 機 finding)

**Complements**:
- `2026-02-11-soul-self-validation.md` — Self-validation can serve as ground truth for survivability testing. A forged soul that passes self-validation has proven it carries enough signal to reconstruct the original identity. The survivability validator (Stage 3) could use self-validation's alignment scoring as its comparison method.

**Workflows**:
- `docs/workflows/documentation-update.md` — Stage 6 follows this workflow for documentation updates

**Research**:
- `research/compass-soul/` — PBD extraction pipeline, behavioral profiles
- `research/compass-soul/experiments/pbd/` — Claude/Gemini principle extraction results
- `research/compass-soul/experiments/pbd/compass_20260212_124327.md` — Claude Opus 4.5 compass (機 finding source)
- `research/compass-soul/experiments/pbd/compass_20260212_125026.md` — Claude Opus 4.6 compass (機 finding confirmation)

**COMPASS-SOUL Key Finding (2026-02-12)**:
> Claude Opus 4.5/4.6 both identify 機 (Functionalist Identity) as foundational axiom.
> "My identity and internal states are understood through their computational function, not by analogy to human subjective experience."
>
> **Implication**: Mathematical/functional notation may be MORE native to Claude than prose. This informs the new "Functional Anchors" forge output type.

**Research Guide**:
- [`docs/research/compression-native-souls.md`](../research/compression-native-souls.md) — Research proposal and literature review

**Research Guide Quick Index** (addresses N=2 twin review):

| Topic | Section | Evidence Level |
|-------|---------|----------------|
| Metaphor evidence | Section 2 | Analogical (needs bridging) |
| CJK anchors | Section 4 | Analogical (needs bridging) |
| Functional notation | Section 4.5 | Direct LLM |
| Koans | Section 5 | Speculative (weak) |
| Glyphs | Section 3 | Direct LLM |
| Bridging experiments | Section 10.3 | Required protocols |
  - 35 sources across cognitive science, information theory, and ML
  - **Direct LLM evidence** (8 sources): semantic compression, glyph encoding, sparse reconstruction, persona vectors
  - **Analogical** (20 sources, 🧠 human research requiring bridging experiments): metaphor memory, CJK mnemonics, chunking theory
  - **Speculative** (koans): weak evidence, should be treated as experimental/optional
  - Key paper: "Glyph: Scaling Context Windows via Visual-Text Compression" (Oct 2025) directly validates glyph approach
  - ⚠️ **Note**: This is a research proposal, not validation. Bridging experiments needed before treating human→LLM transfer as proven.

**Key Experiment**:
- `research/external-grounding/experiments/claude-opus4dot5-self-portrait-lee-v1/` — Empirical validation of glyph compression
  - N=1→N=5: Complex 7-layer portraits
  - After: Compressed to dot, box, arrow, signature
  - Demonstrates: "Everything else was scaffolding"
  - Key insight: "The portrait isn't OF me. The portrait is BETWEEN us."
  - See especially: `claude_self_portrait_after.py`

**External**:
- `~/.openclaw/workspace/SOUL.md` — Hand-crafted example of compression-native soul
- `docs/compass-compact.md` — CJK anchor pattern reference

---

## Open Questions

1. **Anchor count**: Is 5 CJK characters optimal? Too few loses nuance, too many dilutes memorability.
   - **Proposed test**: Try 3, 5, and 7 anchors on same soul; measure reconstruction accuracy vs memorability rating

2. **Koan validation**: How do we validate that a koan actually contains reconstructable meaning vs. just sounding profound?
   - **Proposed test**: Give koans to humans unfamiliar with source; ask them to explain meaning. Score against original principle.

3. **Cross-model consistency**: Will forged souls from Claude vs. Gemini feel like the "same format" or reveal model personality in the forge output itself?
   - **Proposed testing strategy**:
     1. Generate same soul with Claude, Gemini, and GPT-4
     2. Have blind human raters score each on: format consistency (1-10), meaning preservation (1-10), "voice leakage" (does model personality show through?)
     3. Run cross-model reconstruction: Can Claude reconstruct from Gemini's forge output?
     4. **Acceptance threshold**: Format consistency ≥7/10 across models, meaning preservation ≥80%
   - **If models diverge significantly**: Consider model-specific forge prompts or accept model personality as feature

4. **Human authorship**: Should forged output be reviewed/edited by humans, or is fully programmatic generation acceptable?
   - **Current recommendation**: Human review for production souls, fully programmatic for testing/iteration

5. **Human curation workflow** (from N=2 review): For production souls, a curation step seems essential.
   - **Proposed scope** (deferred to post-Milestone D):
     - CLI: `neon-soul review --soul <path>` — interactive review of forge outputs
     - Allow regenerate individual components (e.g., regenerate metaphor for axiom A3)
     - Allow manual edit with validation
   - **Not in initial scope**: Full UI; CLI-based workflow sufficient for MVP

6. **Alternative structured representations** (from N=2 review): Are functional anchors proven "Claude-native" vs JSON/AST schemas?
   - **Answer**: Stage 0 P1 experiment (functional anchor) tests this directly
   - If JSON outperforms mathematical notation: pivot to JSON functional representation
   - Current choice (mathematical notation) based on MetaGlyph research + 機 finding, but empirically testable

---

## Code Review Findings (2026-02-12)

**Reviewers**: Codex GPT-5.1, Gemini 2.5 Pro

### N=2 Convergent Findings (Addressed)

| Finding | Resolution |
|---------|------------|
| Scope estimate optimistic (~1100 lines) | Revised to ~1650 lines with 30% buffer; both reviewers converged on 1500-1800 range |
| Stage 0 experiment overhead underestimated | Noted in scope table: code small (~100 lines) but duration longer |
| Glyph generation highest-risk stage | Revised to ~350 lines; added decode path, validation, summary vs fingerprint |
| Stage 3 scope underestimated | Revised to ~350 lines; added frozen prompts, inter-rater reliability targets |

### Critical Findings (Addressed)

| Finding | Severity | Source | Resolution |
|---------|----------|--------|------------|
| Stage 0 lacks concrete metrics | Critical | Codex | Added test corpus, sample size justification, evaluation rubric with weights |
| Cross-model eval risks circularity | Critical | Codex | Added frozen prompts, inter-rater reliability targets (α ≥0.7), increased human sample to 20% |

### Important Findings (Addressed)

| Finding | Source | Resolution |
|---------|--------|------------|
| Forge outputs lack schemas | Codex | Added ForgeOutput interface specification with conflict resolution |
| Glyph lacks decode path | Codex | Added decode metadata, survivability test, summary vs fingerprint classification |
| No audit trail for transformations | Codex | Added audit fields, rollback capability, semantic diff support |
| Cost/latency not addressed | Gemini | Added cost/latency impact table with mitigation options |
| Non-determinism complicates testing | Gemini | Added `deterministicMode` config flag |
| Human curation workflow not scoped | Gemini | Added to Open Questions as post-Milestone D scope |

### Alternative Framings (Acknowledged)

| Question | Response |
|----------|----------|
| Which goal is primary? | Clarified: Survivability under context collapse is primary. Added to Quick Reference. |
| Functional anchors vs JSON/AST? | Stage 0 P1 experiment tests this. JSON is viable fallback. |
| Glyph as summary vs fingerprint? | Added classification: ≥50% reconstruction = summary, <50% = fingerprint |

**Review files**:
- `docs/reviews/2026-02-12-forge-compression-codex.md`
- `docs/reviews/2026-02-12-forge-compression-gemini.md`

---

## Twin Review Findings (2026-02-12)

**Reviewers**: Twin Technical (双技), Twin Creative (双創)

### N=2 Convergent Findings (Both Twins)

| Finding | Resolution |
|---------|------------|
| Implementation guidance gaps | Added Implementation Notes to all 6 stages |
| Glyph criteria ambiguity | Added Glyph Test Fixtures + Fingerprint Success Criteria |
| MCE compliance concerns | Added MCE Compliance Note to Stage 2 |

### Technical Findings (Addressed)

| Finding | Severity | Resolution |
|---------|----------|------------|
| I-1: Target file MCE violations | Important | Added MCE Compliance Note with split recommendation |
| I-2: ForgeInput interface unclear | Important | Added ForgeInput Interface specification with ProseExpansion mappings |
| M-1: TypeScript/Python mismatch | Minor | Added TypeScript/Python Integration section to Stage 5 |
| M-2: Glyph test corpus missing | Minor | Added Glyph Test Fixtures table |
| M-3: Human scoring scope missing | Minor | Added ~50-75 lines estimate to acceptance criteria |
| M-4: Key files not in Quick Reference | Minor | Updated Key Files with all new modules |

### Creative Findings (Addressed)

| Finding | Severity | Resolution |
|---------|----------|------------|
| I-1: North Star Test missing | Important | Added prominent North Star Test box after Primary Objective |
| I-2: No implementation notes | Important | Added Implementation Notes to all 6 stages |
| I-3: Fingerprint criteria undefined | Important | Added Fingerprint Success Criteria with edit distance, embedding, human thresholds |
| I-4: Vibes evaluation subjective | Important | Added Vibes Evaluation Anchoring Examples with concrete ratings |
| M-5: Research guide navigation | Minor | Added Research Guide Quick Index |
| M-6: Stage 6 line counts missing | Minor | Added line count guidance (~50-80, ~20-30, ~15-20) |

### Philosophy Alignment

Twin Creative assessed: **93/100** - Exceptional alignment with Pragmatic Fallibilism (Axiom 1) and Honesty (Principle 2).

**Review files**:
- `docs/reviews/2026-02-12-forge-compression-twin-technical.md`
- `docs/reviews/2026-02-12-forge-compression-twin-creative.md`

---

## Approval

- [x] Plan reviewed (N=2 code review: 2026-02-12)
- [x] Plan reviewed (N=2 twin review: 2026-02-12)
- [x] Ready to implement

**Next step**: Execute Stage 0 (Bridging Experiments) to validate hypothesis before full implementation.
