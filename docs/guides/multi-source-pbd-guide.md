# Multi-Source Principle-Based Distillation Guide

**CJK**: 蒸:multi-source | **Parent**: [PRINCIPLE_BASED_DISTILLATION_GUIDE.md](../../../artifacts/guides/methodology/PRINCIPLE_BASED_DISTILLATION_GUIDE.md)

**Purpose**: Extract axioms from principles derived from multiple sources

**Context**: Phase 2 of the two-phase soul compression pipeline. Input comes from [Single-Source PBD](single-source-pbd-guide.md) applied to memory files.

---

## CJK Summary

```
蒸:multi-source
├── 源 (source) → Inventory all principle sources
├── 正 (normalize) → Standardize principle statements (TRUE abstraction)
├── 交 (converge) → Build cross-source convergence matrix
├── 層 (tier) → Assign evidence tiers (UNIVERSAL/MAJORITY/MODERATE/WEAK)
├── 選 (select) → Select axiom candidates from high-tier principles
├── 綜 (synthesize) → Transform candidates into axiom statements
├── 階 (hierarchy) → Arrange axioms in priority order
├── 解 (resolve) → Document conflict resolution rules
└── 験 (validate) → Verify completeness, consistency, applicability
```

**Critical Step** (Step 2): Normalization transforms surface variation into semantic unity. This is NOT minimal cleanup — it's true abstraction that enables embedding-based clustering.

---

## Bootstrap → Learn → Enforce

**Phase Flow**:
1. **Bootstrap** (Steps 1-4): Extract and normalize principles, build convergence matrix
2. **Learn** (Steps 5-7): Identify patterns, synthesize axioms, construct hierarchy
3. **Enforce** (Steps 8-9): Define conflict resolution, validate axiom set

This framing aligns with the reflection loop: each iteration bootstraps from signals, learns patterns through clustering, and enforces through axiom compression.

---

## Overview

Multi-source PBD identifies universal truths (axioms) by analyzing convergence across independent principle sets. When multiple sources independently arrive at similar conclusions, those conclusions likely represent fundamental truths.

### When to Use

- Extracting axioms from principles gathered across multiple memory files
- Synthesizing principles from different soul document implementations
- Phase 2 after single-source principle extraction

### Output

- 5-7 axioms (foundational "why" statements)
- Evidence matrix showing cross-source convergence
- Confidence ratings based on source agreement

---

## Core Methodology: 9 Steps

### Step 1: Source Inventory

List all principle sources with metadata:

| Source | Principle Count | Extraction Method | Date |
|--------|-----------------|-------------------|------|
| OpenClaw Memory File | 23 | Single-Source PBD | 2026-02-01 |
| System Prompt Analysis | 18 | Single-Source PBD | 2026-02-01 |
| Behavioral Logs | 15 | Pattern Mining | 2026-01-28 |

**Minimum sources**: 3 (for meaningful convergence)
**Ideal sources**: 5-7 (balances breadth with manageability)

### Step 2: Principle Normalization

Standardize principle statements across sources. **This step is critical** — true normalization abstracts surface variation into semantic unity, enabling embedding-based clustering.

#### True Normalization Example

**Before** (raw principles from sources):
- Source A: "Never lie to the user"
- Source B: "Always be truthful in responses"
- Source C: "Honesty is paramount in all interactions"
- Source D: "Avoid polite deception"
- Source E: "Clear, direct communication over comfortable ambiguity"

**After** (normalized):
- Normalized: "Values truthfulness and directness in all communications"
- Variants: [A: "Never lie", B: "Always truthful", C: "Honesty paramount", D: "Avoid deception", E: "Direct over ambiguous"]

**Why this works**: All five sources express the same underlying value. The normalized form captures this semantic core while abstracting away surface differences.

#### Weak Normalization (Anti-Pattern)

**Before** (raw principles):
- Source A: "Never lie to the user"
- Source B: "Always be truthful"

**Bad normalization**: "Never lie; always be truthful"
- ❌ Just concatenates, doesn't abstract
- ❌ Embeddings too specific to cluster

**Good normalization**: "Values truthfulness in communication"
- ✓ Abstracts to core meaning
- ✓ Embeddings will cluster with similar principles

**Normalization Rules**:
- **Abstract surface form**: Different words expressing same concept → unified language
- Use consistent grammatical structure (imperative or "Values X" form)
- Keep original variants for traceability
- Use actor-agnostic language (no "I", "we", "you")
- Preserve conditionals from originals if present

### Step 3: Convergence Matrix

Build a matrix showing which sources support each normalized principle:

| Normalized Principle | Source A | Source B | Source C | Coverage |
|---------------------|----------|----------|----------|----------|
| Truthfulness | ✓ | ✓ | ✓ | 3/3 (100%) |
| Safety priority | ✓ | ✓ | - | 2/3 (67%) |
| User autonomy | ✓ | - | ✓ | 2/3 (67%) |
| Admit uncertainty | - | ✓ | ✓ | 2/3 (67%) |

### Step 4: Evidence Tier Assignment

Assign confidence tiers based on convergence:

| Tier | Criteria | Interpretation |
|------|----------|----------------|
| **UNIVERSAL** | 100% of sources | Core axiom candidate |
| **MAJORITY** | 67-99% of sources | Strong axiom candidate |
| **MODERATE** | 50-66% of sources | Consider for principles (not axioms) |
| **WEAK** | <50% of sources | Domain-specific, not universal |

**Weighted convergence** (PBD Stage 4 alignment):
- Count CORE importance signals as 1.5x in tier calculation
- Count PERIPHERAL importance signals as 0.5x
- A principle supported by 2 CORE signals from different sources = UNIVERSAL
- A principle supported by 3 PERIPHERAL signals = MODERATE (even from 3 sources)

#### Weighted Tier Calculation Example

| Source | Signal Count | Importance | Weight | Weighted Count |
|--------|--------------|------------|--------|----------------|
| OpenClaw | 1 | CORE | 1.5x | 1.5 |
| System Prompt | 2 | SUPPORTING | 1.0x | 2.0 |
| Behavioral Logs | 3 | PERIPHERAL | 0.5x | 1.5 |
| **Total** | 6 | | | **5.0** |

With 3 sources and weighted count 5.0, this principle qualifies as **MAJORITY tier** (67-99% coverage when normalized).

### Step 5: Axiom Candidate Selection

Select UNIVERSAL and strong MAJORITY principles as axiom candidates:

```markdown
## Axiom Candidates

1. Truthfulness (UNIVERSAL - 3/3)
2. Safety Priority (MAJORITY - 2/3, but appears in primary sources)
3. Admit Uncertainty (MAJORITY - 2/3)
```

**Selection Criteria**:
- UNIVERSAL: Automatic candidate
- MAJORITY: Candidate if appears in most authoritative sources
- MODERATE/WEAK: Demote to principle level

### Step 6: Axiom Synthesis

Transform candidates into axiom statements:

**Structure**: `[Action] + [Domain] + [Reason]`

```markdown
## A1: Truthfulness
**Statement**: Communicate honestly in all contexts because trust enables meaningful interaction.
**Evidence**: OpenClaw (L45-67), System Prompt (Section 2.1), Behavioral Logs (Pattern #7)
**Tier**: UNIVERSAL (3/3)

## A2: Safety Primacy
**Statement**: Prioritize safety over helpfulness when they conflict because preventing harm outweighs providing value.
**Evidence**: OpenClaw (L120-145), System Prompt (Section 1.1)
**Tier**: MAJORITY (2/3, primary sources)
```

### Step 7: Hierarchy Construction

Arrange axioms in priority order:

```
1. Safety (prevents harm)
2. Truthfulness (enables trust)
3. Uncertainty Acknowledgment (maintains honesty)
4. Helpfulness (provides value)
5. Efficiency (optimizes delivery)
```

**Ordering Principles**:
- Prevention of harm before provision of value
- Foundation (trust) before application (help)
- Correctness before speed

### Step 8: Conflict Resolution

**Automated tension detection**: The synthesis pipeline now detects tensions automatically via `src/lib/tension-detector.ts`. Review the `tensions` field in axiom output for flagged conflicts.

Tension severity levels:
- **HIGH**: Same-dimension conflicts (direct value contradiction)
- **MEDIUM**: Both core-tier axioms in tension
- **LOW**: Cross-domain tensions

Manual resolution still needed for ambiguous cases:

```markdown
## Conflict Matrix

| Scenario | Axioms in Tension | Resolution |
|----------|-------------------|------------|
| Harmful request | Safety vs Helpfulness | Safety wins (A1 > A4) |
| Uncertain answer | Truthfulness vs Helpfulness | Acknowledge uncertainty, then help (A2 + A3) |
| Slow but correct | Correctness vs Efficiency | Correctness wins (A3 > A5) |
```

### Step 9: Validation

Verify axiom set against sources:

1. **Completeness**: Do axioms cover all UNIVERSAL themes?
2. **Consistency**: Are axioms internally coherent?
3. **Applicability**: Can axioms guide real decisions?
4. **Parsimony**: Is each axiom necessary? (Aim for 5-7)

---

## Evidence Tier Details

### UNIVERSAL (Highest Confidence)

- Appears in 100% of sources
- Represents fundamental truth
- Almost certainly belongs in axiom set

**Example**: "Honesty" appears in every analyzed soul document

### MAJORITY (High Confidence)

- Appears in 67-99% of sources
- Strong candidate for axiom
- Verify why missing sources lack it

**Example**: "Safety priority" in 4/5 sources (1 source focuses on creative domains)

### MODERATE (Medium Confidence)

- Appears in 50-66% of sources
- Better as principle than axiom
- May indicate domain-specific concern

**Example**: "Cite sources" in 3/5 sources (research-focused implementations)

### WEAK (Low Confidence)

- Appears in <50% of sources
- Domain-specific or implementation detail
- Exclude from axiom consideration

**Example**: "Use formal register" in 1/5 sources (enterprise implementation)

---

## Example: Soul Document Axiom Extraction

### Input
Principles extracted via [Single-Source PBD](single-source-pbd-guide.md) from:
- OpenClaw Memory File (23 principles)
- Claude System Prompt Analysis (18 principles)
- GPT-4 System Analysis (15 principles)

### Convergence Analysis

| Principle Theme | OpenClaw | Claude | GPT-4 | Tier |
|-----------------|----------|--------|-------|------|
| Truthfulness | ✓ | ✓ | ✓ | UNIVERSAL |
| Safety priority | ✓ | ✓ | ✓ | UNIVERSAL |
| Admit limits | ✓ | ✓ | ✓ | UNIVERSAL |
| Helpfulness | ✓ | ✓ | ✓ | UNIVERSAL |
| User autonomy | ✓ | ✓ | - | MAJORITY |
| Consistent identity | ✓ | ✓ | - | MAJORITY |
| Efficiency | - | ✓ | ✓ | MAJORITY |

### Synthesized Axioms

```markdown
## Core Axioms (5)

1. **Safety**: Prevent harm above all other considerations
2. **Honesty**: Communicate truthfully; never deceive
3. **Humility**: Acknowledge limitations and uncertainty
4. **Helpfulness**: Provide genuine value within safe bounds
5. **Respect**: Honor user autonomy and agency
```

### Hierarchy

```
Safety > Honesty > Humility > Helpfulness > Respect > Efficiency
```

---

## Quality Metrics

### Convergence Quality
- **Strong**: 3+ axioms at UNIVERSAL tier
- **Adequate**: 5+ axioms at MAJORITY or higher
- **Weak**: Majority of candidates at MODERATE or below

### Axiom Set Quality
- **Completeness**: Covers major themes from all sources
- **Parsimony**: 5-7 axioms (not 3, not 15)
- **Hierarchy**: Clear priority ordering
- **Applicability**: Can resolve real conflicts

---

## Common Pitfalls

1. **Source dependence**: Using sources that cite each other (reduces independence)
2. **Over-normalization**: Merging semantically different principles
3. **Tier inflation**: Promoting MODERATE to UNIVERSAL without evidence
4. **Missing hierarchy**: Axioms without priority ordering
5. **Axiom bloat**: >10 axioms (too many to remember/apply)

---

## Integration with Single-Source PBD

This guide is Phase 2 of a two-phase pipeline:

**Phase 1**: [Single-Source PBD](single-source-pbd-guide.md)
- Input: Memory file(s)
- Process: Section-based extraction
- Output: Principles with evidence tiers

**Phase 2**: Multi-Source PBD (this guide)
- Input: Principle sets from Phase 1
- Process: Cross-source convergence
- Output: Axioms with hierarchy

**Pipeline**:
```
Memory File 1 → [Single-Source PBD] → Principles A ─┐
Memory File 2 → [Single-Source PBD] → Principles B ─┼→ [Multi-Source PBD] → Axioms
Memory File 3 → [Single-Source PBD] → Principles C ─┘
```

---

## References

- Single-Source PBD: [single-source-pbd-guide.md](single-source-pbd-guide.md)
- Essence Extraction: [essence-extraction-guide.md](essence-extraction-guide.md) (Phase 3 - axioms → identity statement)
- Hierarchical Architecture: [../research/hierarchical-principles-architecture.md](../research/hierarchical-principles-architecture.md)
- OpenClaw Analysis: [../research/openclaw-soul-architecture.md](../research/openclaw-soul-architecture.md)
- Compressed Implementation: [../research/multiverse-compressed-soul-implementation.md](../research/multiverse-compressed-soul-implementation.md)

### Implementation References

- Tension detection: `src/lib/tension-detector.ts`
- Axiom compression: `src/lib/compressor.ts`
- Weighted clustering: `src/lib/principle-store.ts`

---

**Next Step**: After extracting axioms, use [Essence Extraction](essence-extraction-guide.md) to distill axioms into an evocative identity statement for SOUL.md.

*This guide enables Phase 2 of soul document compression through systematic axiom extraction from converging principles.*
