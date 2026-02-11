# Synthesis Philosophy

**Created**: 2026-02-10
**Purpose**: Document design choices and limitations of the soul synthesis pipeline.

---

## What This Pipeline Does

The neon-soul synthesis pipeline extracts **value signals** from memories and compresses them into **axioms**. It is a value extraction system, not an identity modeling system.

| Stage | Input | Output | Purpose |
|-------|-------|--------|---------|
| Extraction | Memories | Signals | Find value-laden statements |
| Generalization | Signals | Principles | Abstract for clustering |
| Clustering | Principles | Merged principles | Group similar values |
| Compression | Principles | Axioms | Extract high-confidence values |
| Essence | Axioms | Statement | Evoke identity feeling |

---

## Technical Choices (Not Philosophical Claims)

### 1. "Values X over Y" Generalization Pattern

**What it is**: Signals are generalized to a consistent format like "Values authenticity over conformity."

**Why we do this**: The pattern creates consistent structure for semantic clustering. Embeddings of "Values X over Y" statements cluster more reliably than diverse surface forms.

**What it is NOT**: A claim about how identity works. Real identity is not a preference matrix. The pattern is an engineering choice that enables clustering, not a philosophical statement about values as binary comparisons.

**Alternative framings for future consideration**:
- Relational: "Seeks X through Y"
- Aspirational: "Becoming X"
- Prohibitive: "Rejects X"

---

### 2. Cosine Similarity Threshold (0.75)

**What it is**: Two principles are considered "the same" if their embedding similarity >= 0.75.

**Why we chose 0.75**: Empirical observation showed generalized signals cluster with similarity 0.78-0.83. The 0.85 default was too strict (only 1/48 matched); 0.75 captures the observed clustering.

**What it is NOT**: A claim about when values are philosophically equivalent. "Values authenticity over obligations" and "Values authenticity over external validation" may merge at 0.75, but they express different relationships.

**Trade-off**: Higher threshold = more distinctions preserved, less compression. Lower threshold = more merging, potential loss of nuance.

---

### 3. Dimension Coverage as Descriptive Metric

**What it is**: The pipeline reports how many of the 7 SoulCraft dimensions have axioms.

**What it means**: This describes the **shape** of the expressed identity, not its completeness. A soul that expresses 3/7 dimensions is not "43% complete" - it may authentically not engage certain domains.

**No warning for partial coverage**: We removed the "low coverage" warning because partial coverage is valid. Only zero coverage (0/7) indicates synthesis failure.

---

### 4. Compression Ratio as Efficiency Metric

**What it is**: Signals ÷ Axioms (e.g., 47 signals → 4 axioms = 11.8:1)

**What it means**: This measures clustering efficiency - how many signals clustered into each axiom. It does NOT measure identity coherence or quality.

**Healthy range**: 3:1 to 30:1. Below 3:1 suggests clustering failure. Above 30:1 suggests over-generalization.

---

### 5. Essence Extraction Attempts Evocation

**What it is**: An LLM prompt asks for an evocative statement that captures what the axioms EVOKE, not summarizes them.

**What it produces**: A poetic statement meant to resonate emotionally. The prompt uses "You are becoming..." framing to emphasize movement over static traits.

**Limitation**: Despite prompt design, outputs may still be "poetic trait lists" rather than genuine evocation. The distinction is semantic and hard to validate programmatically.

**Decision on validation**: We removed fragile trait-list detection (comma counting) and rely on prompt engineering. If trait lists become recurring (N≥3 in production), we will add semantic similarity detection.

---

## PBD Alignment (2026-02-10)

This pipeline now aligns with Principle-Based Distillation methodology:

### Signal Metadata

- **Stance**: ASSERT/DENY/QUESTION/QUALIFY - how signal is presented
- **Importance**: CORE/SUPPORTING/PERIPHERAL - centrality to identity

### Synthesis Features

- **Weighted clustering**: Core signals boost principle strength 1.5x, peripheral signals reduce it to 0.5x
- **Tension detection**: Conflicting axioms flagged with severity (high/medium/low)
- **Orphan tracking**: Unclustered signals reported for audit; high orphan rate (>20%) triggers warning
- **Centrality metric**: Principles scored by contributing signal importance, not just N-count

### Relationship to N-count

N-count measures **repetition** (how often a value appears).
Centrality measures **importance** (derived from signal importance).

| Scenario | N-count | Centrality | Interpretation |
|----------|---------|------------|----------------|
| Rare but core | Low (2) | FOUNDATIONAL | Critical value rarely expressed |
| Frequent but peripheral | High (8) | SUPPORTING | Common mention, not central |
| Frequent and core | High (6) | FOUNDATIONAL | Well-evidenced core value |

A FOUNDATIONAL principle may have low N-count (rare but core).
A SUPPORTING principle may have high N-count (frequent but peripheral).

---

## What This Pipeline Does NOT Do

1. **Model causation**: We don't capture WHY someone values something, only THAT they value it.

2. **Preserve context**: Generalization removes specifics. "I always tell the truth to my partner" becomes "Values honesty in close relationships."

3. **Track temporal evolution**: We don't model how values change over time.

4. **Model identity wholeness**: We capture values, not the irreducible whole they point to.

---

## Honest Limitations

The pipeline produces a **description of values**, not an **explanation of person**.

A person is not "authenticity > obligations + transparency > silence + ..." - they are an irreducible whole that these preferences point toward. The synthesis captures the pointing, not the whole.

This is acceptable for the current use case (AI identity grounding), but users should understand what they're getting.

---

## Future Directions

If we wanted to move further toward identity modeling:

1. **Causal modeling**: Ask WHY in signal extraction
2. **Temporal tracking**: Track how values evolve across sessions (see cycle management in later PBD stages)
3. **Story synthesis**: Generate narrative, not just axioms

Note: Conflict detection is now implemented via tension detection (see PBD Alignment section).

---

## Cross-References

- `src/lib/signal-generalizer.ts` - Generalization implementation
- `src/lib/essence-extractor.ts` - Essence extraction
- `src/lib/principle-store.ts` - Clustering logic with importance weighting
- `src/lib/semantic-classifier.ts` - Stance and importance classification
- `src/lib/tension-detector.ts` - Tension detection between axioms
- `docs/plans/2026-02-10-pbd-alignment.md` - PBD alignment plan
- `docs/issues/2026-02-10-synthesis-twin-review-findings.md` - Original review findings
