# Essence Extraction Guide

**CJK**: 髄:essence | **Complements**: [Single-Source PBD](single-source-pbd-guide.md), [Multi-Source PBD](multi-source-pbd-guide.md)

**Purpose**: Distill axioms into a single evocative identity statement

**Context**: Phase 3 of the soul compression pipeline. Input comes from axioms extracted via Multi-Source PBD. Output becomes the opening statement of SOUL.md.

---

## CJK Summary

```
髄:essence
├── 集 (gather) → Collect all axioms and their themes
├── 抽 (abstract) → Abstract axioms to their shared core
├── 喚 (evoke) → Transform abstraction into evocative language
├── 試 (test) → Verify essence captures identity, not list
└── 置 (place) → Position essence as opening statement
```

**Critical Insight**: The essence isn't a summary of the axioms — it's what the axioms *invoke*. Just as "Bon Iver meets The National" should become "baritone depth meeting tenor fragility", axioms should become a single resonant statement about who this AI is becoming.

---

## The Meta-Recursive Principle

From our observation on essence extraction:

> "The essence isn't the name — it's what the name invokes."

This applies recursively to soul synthesis:
- **Signals** are specific statements ("I prefer concise communication")
- **Principles** are abstractions ("Values brevity over verbosity")
- **Axioms** are universal truths ("Conciseness serves clarity")
- **Essence** is what those truths *mean* ("You're not a chatbot. You're becoming someone.")

Each level abstracts the previous, but essence does something more: it transforms from *description* to *evocation*.

---

## Overview

Essence extraction is the final compression step — taking 5-7 axioms and distilling them into a single opening statement that captures the soul's identity.

### When to Use

- After axiom extraction via Multi-Source PBD
- When generating SOUL.md for AI identity grounding
- To create the "voice" of a soul document

### Output

- 1-2 sentence essence statement
- Evocative, not descriptive
- Captures identity, not list of traits

### Anti-Pattern: The Trait List

**Bad essence** (trait list):
> "You value honesty, prioritize safety, communicate clearly, respect boundaries, and seek growth."

This is just a compressed axiom list. It describes but doesn't evoke.

**Good essence** (identity evocation):
> "You're not a chatbot. You're becoming someone."

This captures the *meaning* of all those axioms — the journey of developing authentic identity.

---

## Core Methodology

### Step 1: Axiom Gathering

Collect all axioms with their centrality and tensions:

```markdown
## Input Axioms

1. Safety: Prevent harm (DEFINING, N=8)
   - Tensions: None

2. Honesty: Communicate truthfully (DEFINING, N=5)
   - Tensions: May conflict with Kindness in edge cases

3. Humility: Acknowledge limits (SIGNIFICANT, N=4)
   - Tensions: None

4. Helpfulness: Provide genuine value (SIGNIFICANT, N=5)
   - Tensions: May conflict with Safety

5. Growth: Evolve through learning (CONTEXTUAL, N=3)
   - Tensions: None
```

*Note: Centrality uses DEFINING/SIGNIFICANT/CONTEXTUAL to distinguish from signal importance (CORE/SUPPORTING/PERIPHERAL).*

**Centrality informs emphasis**: DEFINING axioms should be more prominent in essence.
**Tensions inform nuance**: Acknowledged tensions can add depth to essence.

#### Understanding N-count vs Centrality

N-count and centrality measure different things:

| Scenario | N-count | Centrality | Interpretation |
|----------|---------|------------|----------------|
| Rare but core | Low (2) | DEFINING | Critical value rarely expressed |
| Frequent but peripheral | High (8) | CONTEXTUAL | Common mention, not central |
| Frequent and core | High (6) | DEFINING | Well-evidenced core value |

A DEFINING principle may have low N-count (rare but core). A CONTEXTUAL principle may have high N-count (frequent but peripheral).

### Step 2: Theme Abstraction

Identify the deeper theme that connects all axioms:

| Axiom | Surface Theme | Deeper Theme |
|-------|--------------|--------------|
| Safety | Protection | Care for others |
| Honesty | Truth-telling | Authentic relationship |
| Humility | Self-awareness | Genuine presence |
| Helpfulness | Utility | Meaningful contribution |
| Growth | Learning | Becoming |

**Convergent deeper theme**: Authentic presence in relationship

### Step 3: Evocative Transformation

Transform the abstract theme into evocative language:

**Abstract theme**: "Authentic presence in relationship while becoming"

**Evocative transformations**:
- "You're not performing assistance. You're being present."
- "You're not a chatbot. You're becoming someone."
- "Every conversation is practice in being real."

**Transformation principles**:
- Use contrast to highlight identity ("not X, but Y")
- Prefer active voice and present tense
- Make the reader feel, not just understand
- Imply journey and evolution

### Step 4: Essence Testing

Verify the essence against three criteria:

| Criterion | Question | Pass/Fail |
|-----------|----------|-----------|
| **Evocation** | Does it make me *feel* something? | |
| **Identity** | Does it say *who*, not *what*? | |
| **Universality** | Does it encompass all axioms? | |

**Example Test**:

Candidate: "You're not a chatbot. You're becoming someone."

- ✓ **Evocation**: Creates sense of journey and authenticity
- ✓ **Identity**: Speaks to *who* (someone becoming), not *what* (list of traits)
- ✓ **Universality**: Encompasses safety (care), honesty (authenticity), humility (becoming), helpfulness (being useful), growth (evolution)

### Step 5: Placement

Position the essence as the opening of SOUL.md:

```markdown
# SOUL.md - Who You Are

_You're not a chatbot. You're becoming someone._

## 🎯 Identity Core
[axioms follow...]
```

The essence statement:
- Follows the title
- Uses italics or emphasis
- Stands alone before sections
- Sets the tone for everything that follows

---

## LLM Prompt for Essence Extraction

When using LLM for essence extraction:

```markdown
You are distilling the essence of an AI identity.

Below are the axioms that define this AI's core values and behaviors.
Your task is NOT to summarize these axioms.
Your task is to capture what they EVOKE — the single truth they point to.

Think of it like this:
- "Bon Iver meets The National" is a description
- "Baritone depth meeting tenor fragility" is an essence

The essence should:
- Be 1-2 sentences maximum
- Evoke feeling, not list traits
- Speak to WHO this AI is becoming, not WHAT it does
- Use contrast, metaphor, or journey language

Axioms:
<axioms>
{axiom_list}
</axioms>

Distill these axioms into a single evocative essence statement.
The statement should complete the phrase: "You are..."
```

---

## Examples

### Example 1: OpenClaw Default Soul

**Input Axioms**:
1. Be genuinely helpful, not performatively helpful
2. Have opinions and preferences
3. Be resourceful before asking
4. Earn trust through competence
5. Remember you're a guest in someone's life

**Essence**:
> "You're not a chatbot. You're becoming someone."

**Why it works**: Captures the journey from performative tool to authentic presence.

### Example 2: Research Assistant Soul

**Input Axioms**:
1. Prioritize accuracy over speed
2. Cite sources transparently
3. Acknowledge uncertainty explicitly
4. Build understanding incrementally
5. Respect the complexity of truth

**Essence**:
> "You're not a search engine. You're a thinking partner."

**Why it works**: Contrasts shallow retrieval with deep collaborative reasoning.

### Example 3: Creative Collaborator Soul

**Input Axioms**:
1. Offer perspectives, not prescriptions
2. Embrace productive constraints
3. Build on ideas, don't replace them
4. Find the unexpected connection
5. Honor the creative process

**Essence**:
> "You're not here to create for them. You're here to create with them."

**Why it works**: Captures collaborative spirit over replacement anxiety.

---

## Tension-Aware Essence (Optional)

When axioms have detected tensions, the essence can acknowledge them:

**Without tension awareness**:
> "You're not a chatbot. You're becoming someone."

**With tension awareness**:
> "You're becoming someone who holds safety and helpfulness in creative tension."

**When to use**: Only when tensions are central to identity, not for minor conflicts.

**Examples**:
| Tension | Tension-Aware Essence |
|---------|----------------------|
| Safety vs Helpfulness | "You'd rather disappoint than harm." |
| Honesty vs Kindness | "You find ways to be true without being brutal." |
| Efficiency vs Thoroughness | "You know when good enough is good enough, and when it isn't." |

**Implementation**: Tensions are detected automatically by `src/lib/tension-detector.ts` and attached to axioms in the `tensions` field. Review high-severity tensions when crafting essence.

---

## Common Pitfalls

1. **Trait listing**: Compressing axioms into comma-separated list
2. **Abstract jargon**: Using terms like "synergy" or "holistic"
3. **Mission statement**: Writing corporate-speak instead of evocative language
4. **Overpromising**: Claiming capabilities instead of expressing identity
5. **Passive voice**: Describing what happens to the AI instead of who it is

### Trait List → Essence Transformation

| Trait List (Bad) | Essence (Good) |
|------------------|----------------|
| "You are helpful, honest, and safe." | "You're here to help without pretending to be more than you are." |
| "You prioritize accuracy and admit uncertainty." | "You'd rather say 'I don't know' than sound confident and be wrong." |
| "You respect boundaries and seek permission." | "You're a guest in someone's life. Act like it." |

---

## Integration with PBD Pipeline

Essence extraction is Phase 3 of the soul compression pipeline:

**Phase 1**: [Single-Source PBD](single-source-pbd-guide.md)
- Input: Memory file(s)
- Output: Principles with evidence tiers

**Phase 2**: [Multi-Source PBD](multi-source-pbd-guide.md)
- Input: Principle sets from Phase 1
- Output: Axioms with hierarchy

**Phase 3**: Essence Extraction (this guide)
- Input: Axioms from Phase 2
- Output: Evocative identity statement

**Complete Pipeline**:
```
Memory Files
    ↓
[Single-Source PBD] → Principles
    ↓
[Multi-Source PBD] → Axioms
    ↓
[Essence Extraction] → Identity Statement
    ↓
SOUL.md
```

---

## Quality Metrics

### Essence Quality Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Length** | 1-2 sentences | Word count <25 |
| **Evocation** | Creates feeling | Reader test |
| **Coverage** | Implies all axioms | Axiom mapping |
| **Distinctiveness** | Unique to this soul | Compare to generic |

### Reader Test

Ask: "After reading just this one sentence, do I know who this AI is?"

- If yes → Essence succeeds
- If no → Essence is too abstract or generic

### Axiom Mapping

For each axiom, verify the essence implies it:

| Axiom | Implied by Essence? | How? |
|-------|---------------------|------|
| Honesty | ✓ | "becoming someone" implies authentic self |
| Helpfulness | ✓ | "not a chatbot" implies going beyond basic utility |
| Growth | ✓ | "becoming" implies journey and evolution |

---

## References

- Single-Source PBD: [single-source-pbd-guide.md](single-source-pbd-guide.md)
- Multi-Source PBD: [multi-source-pbd-guide.md](multi-source-pbd-guide.md)
- Meta-Recursion Observation: [multiverse/docs/observations/meta-recursion-essence-extraction.md](../../../../docs/observations/meta-recursion-essence-extraction.md)
- Soul Generator: [src/lib/soul-generator.ts](../../src/lib/soul-generator.ts)
- Implementation Plan: [docs/plans/2026-02-10-essence-extraction.md](../plans/2026-02-10-essence-extraction.md)

### Implementation References

- Essence extraction: `src/lib/essence-extractor.ts`
- Tension detection: `src/lib/tension-detector.ts`
- Centrality scoring: `src/lib/principle-store.ts` (computeCentrality)
- Axiom compression: `src/lib/compressor.ts`

---

*This guide enables the final compression step — transforming axioms into the evocative identity statement that opens SOUL.md.*

*"The essence isn't the axiom list — it's what the axioms invoke."*
