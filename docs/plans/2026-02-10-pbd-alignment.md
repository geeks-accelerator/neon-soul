# Plan: PBD Methodology Alignment

**Date**: 2026-02-10
**Status**: Reviewed
**Project**: projects/neon-soul
**Trigger**: think hard
**Review Required**: Yes

---

## Summary

Align neon-soul synthesis with Principle-Based Distillation (PBD) methodology to address gaps identified in N=3 cross-implementation review and validated through external review.

**Goal**: Add missing signal metadata (Stance, Importance, Provenance), tension detection, orphaned content tracking, cycle management, and anti-echo-chamber protection to achieve higher-fidelity identity synthesis with iterative evolution support.

**Stages**: 17 total (13 original + 3 cross-project alignment + 1 final documentation)
- Stages 1-13: Original PBD alignment features
- Stage 14: SSEM-style provenance tracking (from essence-router)
- Stage 15: Anti-echo-chamber rule (from essence-router)
- Stage 16: Integration of provenance into synthesis pipeline
- Stage 17: Final documentation update (covers all stages)

**LLM-Dependent Stages** (2, 3, 5, 12, 14): Line estimates exclude prompt engineering iteration, error handling for malformed responses, and diverse input testing. Expect 50-100% additional effort for these stages.

**Plan Length Note**: This plan exceeds the standard 300-400 line limit due to cross-project coordination complexity. It documents alignment with both PBD methodology and essence-router implementation patterns, requiring explicit code examples for TypeScript equivalents of Go patterns. Consider this a migration-level plan with N=4 evidence base justifying the detail level.

**Evidence Base**:
- N=1: `artifacts/guides/methodology/PRINCIPLE_BASED_DISTILLATION_GUIDE.md`
- N=2: `projects/obviously-not/writer/internal/pbd/` (27 files)
- N=3: Current neon-soul implementation
- N=4: `projects/essence-router/` - Go implementation with SSEM model

**Shared Vocabulary**: `multiverse/artifacts/guides/methodology/PBD_VOCABULARY.md`

---

## Context

### Current State

neon-soul implements ~60% of PBD concepts:
- Signal extraction (atomic statements)
- Generalization ("Values X over Y" pattern)
- Embedding-based clustering (cosine 0.75 threshold)
- N-count for axiom promotion
- Provenance tracking

### Gaps Identified

| Gap | PBD Concept | Impact |
|-----|-------------|--------|
| Missing Stance | ASSERT/DENY/QUESTION/QUALIFY | Uncertain signals weighted equally |
| Missing Importance | CORE/SUPPORTING/PERIPHERAL | Peripheral mentions can dominate |
| No tension detection | AcknowledgedTensions | Conflicting values merge silently |
| No orphaned tracking | OrphanedContent | Can't audit synthesis completeness |
| N-count ≠ Centrality | FOUNDATIONAL/CORE/SUPPORTING | Frequency conflated with importance |
| No signal source classification | Agent-initiated vs user-elicited | "False soul" - identity reflects usage patterns not agent |
| No cycle management | Incremental vs full re-synthesis | Pipeline is one-shot but product promises evolution |

### Source References

These gaps were validated through cross-implementation review:

**N=2 Implementation Already Has Solutions**:
- `projects/obviously-not/writer/internal/pbd/types.go:154-155`:
  ```go
  AcknowledgedTensions []string `json:"acknowledged_tensions,omitempty"`
  OrphanedContent      []string `json:"orphaned_content,omitempty"`
  ```

**Parent Guide Explicitly Documents Missing Features**:
- `artifacts/guides/methodology/PRINCIPLE_BASED_DISTILLATION_SINGLE_SOURCE_GUIDE.md`:
  - Step 5: "Identify Tensions... N=3 tracks these as `AcknowledgedTensions []string`"
  - Step 7: "Track orphaned content — passages not captured by any principle"
  - Part III: Taxonomy adaptation framework ("the most important insight from N=3 evidence")

**External Review Validation**:
- Twin review (2026-02-10) identified tension detection and orphaned tracking as critical gaps
- Research review validated "false soul" problem: signals may reflect prompting patterns not agent identity
- Both reviews independently identified missing iteration/cycle management

---

## Stages

### Stage 1: Signal Metadata Types

**Purpose**: Extend Signal type with PBD-aligned metadata

**Files to modify**:
- `src/types/signal.ts`

**Changes**:

Add new types:
```typescript
/**
 * PBD Stance: How the signal is presented
 * Canonical names from: multiverse/artifacts/guides/methodology/PBD_VOCABULARY.md
 *
 * Maps to F-Count: F=1 (assert/AFFIRMING) / F=1.25 (qualify/QUALIFYING) /
 *                  F=1.5 (tensioning/TENSIONING) / F=2 (question/QUESTIONING, deny/DENYING)
 */
export type SignalStance = 'assert' | 'deny' | 'question' | 'qualify' | 'tensioning';

/** PBD Importance: How central to identity */
export type SignalImportance = 'core' | 'supporting' | 'peripheral';

/**
 * Map canonical PBD vocabulary to SignalStance.
 * Used for interop with systems using canonical names (e.g., essence-router).
 * See: multiverse/artifacts/guides/methodology/PBD_VOCABULARY.md
 */
export function mapCanonicalStance(canonical: string): SignalStance {
  switch (canonical.toUpperCase()) {
    case 'AFFIRMING':
    case 'ASSERT':
      return 'assert';
    case 'QUALIFYING':
    case 'QUALIFY':
      return 'qualify';
    case 'TENSIONING':
      return 'tensioning';
    case 'QUESTIONING':
    case 'QUESTION':
      return 'question';
    case 'DENYING':
    case 'DENY':
      return 'deny';
    default:
      return 'assert';
  }
}
```

Extend Signal interface:
```typescript
export interface Signal {
  // ... existing fields ...

  /** PBD stance: how the signal is presented (default: assert) */
  stance?: SignalStance;

  /** PBD importance: how central to identity (default: supporting) */
  importance?: SignalImportance;
}
```

**Acceptance Criteria**:
- [ ] Types compile without errors
- [ ] Existing tests pass (new fields are optional)

**Commit**: `feat(neon-soul): add PBD stance and importance types to Signal`

---

### Stage 2: Stance Classification

**Purpose**: LLM-based stance detection during signal extraction

**Files to modify**:
- `src/lib/semantic-classifier.ts` - Add classifyStance function
- `src/lib/signal-extractor.ts` - Integrate stance classification

**Implementation**:

Add to semantic-classifier.ts:
```typescript
export async function classifyStance(
  llm: LLMProvider,
  text: string
): Promise<SignalStance> {
  const prompt = `Classify this statement's stance:

ASSERT: Stated as true, definite ("I always...")
DENY: Stated as false, rejection ("I never...", "I don't...")
QUESTION: Uncertain, exploratory ("I wonder if...", "Maybe...")
QUALIFY: Conditional ("Sometimes...", "When X, I...")

Statement: "${text}"

Respond with only: assert, deny, question, or qualify`;

  const result = await llm.classify(prompt, {
    categories: ['assert', 'deny', 'question', 'qualify'] as const,
    context: 'PBD stance classification',
  });

  return (result.category ?? 'assert') as SignalStance;
}
```

Integrate in signal-extractor.ts extractSignalsFromContent():
```typescript
// Phase 4: Classify and embed confirmed signals in parallel
const [dimension, signalType, stance, embedding] = await Promise.all([
  semanticClassifyDimension(llm, candidate.text),
  semanticClassifySignalType(llm, candidate.text),
  semanticClassifyStance(llm, candidate.text),  // NEW
  embed(candidate.text),
]);
```

**Acceptance Criteria**:
- [ ] "I always tell the truth" → stance: assert
- [ ] "I don't believe in absolute honesty" → stance: deny
- [ ] "I wonder if I value efficiency too much" → stance: question
- [ ] "Sometimes I prioritize speed over quality" → stance: qualify
- [ ] Tests for each stance category

**Commit**: `feat(neon-soul): add PBD stance classification to signal extraction`

---

### Stage 3: Importance Classification

**Purpose**: LLM-based importance detection during signal extraction

**Files to modify**:
- `src/lib/semantic-classifier.ts` - Add classifyImportance function
- `src/lib/signal-extractor.ts` - Integrate importance classification

**Implementation**:

Add to semantic-classifier.ts:
```typescript
export async function classifyImportance(
  llm: LLMProvider,
  text: string
): Promise<SignalImportance> {
  const prompt = `Classify this statement's importance to identity:

CORE: Fundamental value, shapes everything ("My core belief...", "Above all...")
SUPPORTING: Evidence or example of values ("For instance...", "Like when...")
PERIPHERAL: Context or tangential mention ("Also...", "By the way...")

Statement: "${text}"

Respond with only: core, supporting, or peripheral`;

  const result = await llm.classify(prompt, {
    categories: ['core', 'supporting', 'peripheral'] as const,
    context: 'PBD importance classification',
  });

  return (result.category ?? 'supporting') as SignalImportance;
}
```

**Acceptance Criteria**:
- [ ] "Above all, I value honesty" → importance: core
- [ ] "For example, I told my boss the truth about the deadline" → importance: supporting
- [ ] "Also, I like coffee" → importance: peripheral
- [ ] Tests for each importance level

**Commit**: `feat(neon-soul): add PBD importance classification to signal extraction`

---

### Stage 4: Weighted Clustering

**Purpose**: Use importance in principle matching weight

**Files to modify**:
- `src/lib/principle-store.ts`

**Changes**:

Update addGeneralizedSignal to weight by importance:
```typescript
// Weight factors by importance
const IMPORTANCE_WEIGHT: Record<SignalImportance, number> = {
  core: 1.5,        // Boost core signals
  supporting: 1.0,  // Normal weight
  peripheral: 0.5,  // Reduce peripheral influence
};

// In reinforcement logic:
const importanceWeight = IMPORTANCE_WEIGHT[signal.importance ?? 'supporting'];
bestPrinciple.strength = Math.min(
  1.0,
  bestPrinciple.strength + signal.confidence * 0.1 * importanceWeight
);
```

**Acceptance Criteria**:
- [ ] Core signals contribute 1.5x to principle strength
- [ ] Peripheral signals contribute 0.5x
- [ ] Tests verify weighting affects final strength

**Commit**: `feat(neon-soul): weight principle clustering by signal importance`

---

### Stage 5: Tension Detection

**Purpose**: Detect and track conflicting axioms

**Files to create**:
- `src/lib/tension-detector.ts`

**Files to modify**:
- `src/types/axiom.ts` - Add tensions field
- `src/lib/compressor.ts` - Integrate tension detection

**Implementation**:

tension-detector.ts:
```typescript
export interface ValueTension {
  axiom1Id: string;
  axiom2Id: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export async function detectTensions(
  llm: LLMProvider,
  axioms: Axiom[]
): Promise<ValueTension[]> {
  const tensions: ValueTension[] = [];

  // Compare each pair of axioms
  for (let i = 0; i < axioms.length; i++) {
    for (let j = i + 1; j < axioms.length; j++) {
      const axiom1 = axioms[i]!;
      const axiom2 = axioms[j]!;

      const prompt = `Do these two values conflict or create tension?

Value 1: "${axiom1.text}"
Value 2: "${axiom2.text}"

If they conflict, describe the tension briefly.
If they don't conflict, respond with "none".`;

      const result = await llm.generate(prompt);
      const text = result.text.trim().toLowerCase();

      if (text !== 'none' && text.length > 10) {
        tensions.push({
          axiom1Id: axiom1.id,
          axiom2Id: axiom2.id,
          description: result.text.trim(),
          severity: determineSeverity(axiom1, axiom2),
        });
      }
    }
  }

  return tensions;
}

function determineSeverity(a1: Axiom, a2: Axiom): 'high' | 'medium' | 'low' {
  // Same dimension = high (direct conflict)
  if (a1.dimension === a2.dimension) return 'high';
  // Both core tier = medium
  if (a1.tier === 'core' && a2.tier === 'core') return 'medium';
  return 'low';
}
```

Add to Axiom type:
```typescript
export interface Axiom {
  // ... existing fields ...

  /** Detected tensions with other axioms */
  tensions?: string[];  // axiom IDs this conflicts with
}
```

**Acceptance Criteria**:
- [ ] "Values honesty over kindness" + "Values kindness over brutal truth" → tension detected
- [ ] "Values efficiency" + "Values quality" → no tension (complementary)
- [ ] Tensions recorded in axiom.tensions array
- [ ] Severity based on dimension and tier

**Commit**: `feat(neon-soul): add tension detection for conflicting axioms`

---

### Stage 6: Orphaned Content Tracking

**Purpose**: Track signals that didn't cluster to any principle

**Files to modify**:
- `src/lib/principle-store.ts` - Track unclustered signals
- `src/lib/reflection-loop.ts` - Report orphaned signals

**Implementation**:

Add to PrincipleStore interface:
```typescript
export interface PrincipleStore {
  // ... existing methods ...

  /** Get signals that didn't match any principle (below threshold) */
  getOrphanedSignals(): Signal[];
}
```

Track in addGeneralizedSignal:
```typescript
// If similarity below threshold and new principle created,
// check if this is a "weak" standalone (N=1 after synthesis)
// These are potential orphans if they never get reinforced
```

Report in synthesis output:
```typescript
export interface SynthesisResult {
  // ... existing fields ...

  /** Signals that didn't cluster to any principle */
  orphanedSignals: Signal[];

  /** Orphan rate: orphaned / total */
  orphanRate: number;
}
```

**Acceptance Criteria**:
- [ ] Signals with bestSimilarity < threshold tracked as orphaned
- [ ] Orphan rate reported in synthesis metrics
- [ ] Orphan rate > 20% triggers warning

> **Threshold Rationale**: 20% orphan rate derived from grounded theory practice
> where ~15-20% uncoded content is acceptable for theoretical saturation.
> Higher rates suggest signal extraction may be missing important patterns.
> See: Corbin & Strauss (2008), Basics of Qualitative Research.

**Commit**: `feat(neon-soul): track orphaned signals in synthesis`

---

### Stage 7: Centrality Metric

**Purpose**: Add principle-level centrality beyond N-count

**Files to modify**:
- `src/types/principle.ts`
- `src/lib/principle-store.ts`

**Implementation**:

Add to Principle type:
```typescript
export interface Principle {
  // ... existing fields ...

  /** PBD centrality (derived from importance of contributing signals) */
  centrality: 'foundational' | 'core' | 'supporting';

  /** Estimated coverage: what % of total signals this represents */
  coveragePct: number;
}
```

Compute centrality based on signal importance:
```typescript
// Thresholds are tunable - validate with real data before adjusting
// These are reasonable first-pass values from PBD_VOCABULARY.md
const FOUNDATIONAL_THRESHOLD = 0.5; // 50% core signals
const CORE_THRESHOLD = 0.2;         // 20% core signals

function computeCentrality(signals: Signal[]): 'foundational' | 'core' | 'supporting' {
  const coreCount = signals.filter(s => s.importance === 'core').length;
  const coreRatio = coreCount / signals.length;

  if (coreRatio >= FOUNDATIONAL_THRESHOLD) return 'foundational';
  if (coreRatio >= CORE_THRESHOLD) return 'core';
  return 'supporting';
}
```

**Acceptance Criteria**:
- [ ] Principle with 50%+ core signals → centrality: foundational
- [ ] Principle with 20-50% core signals → centrality: core
- [ ] coveragePct computed as principle.n_count / total_signals

**Commit**: `feat(neon-soul): add PBD centrality metric to principles`

---

### Stage 8: Documentation Update

**Purpose**: Update synthesis-philosophy.md with PBD alignment

**Files to modify**:
- `docs/architecture/synthesis-philosophy.md`

**Content to add**:

```markdown
## PBD Alignment (2026-02-10)

This pipeline now aligns with Principle-Based Distillation methodology:

### Signal Metadata
- **Stance**: ASSERT/DENY/QUESTION/QUALIFY - how signal is presented
- **Importance**: CORE/SUPPORTING/PERIPHERAL - centrality to identity

### Synthesis Features
- **Weighted clustering**: Core signals boost principle strength 1.5x
- **Tension detection**: Conflicting axioms flagged with severity
- **Orphan tracking**: Unclustered signals reported for audit
- **Centrality metric**: Principles scored by contributing signal importance

### Relationship to N-count
N-count measures repetition (how often a value appears).
Centrality measures importance (derived from signal importance).

A FOUNDATIONAL principle may have low N-count (rare but core).
A SUPPORTING principle may have high N-count (frequent but peripheral).
```

**Acceptance Criteria**:
- [ ] Documentation explains PBD alignment
- [ ] Relationship between N-count and centrality clarified

**Commit**: `docs(neon-soul): document PBD alignment in synthesis-philosophy`

---

### Stage 9: Integration Tests

**Purpose**: Verify PBD alignment end-to-end

**Files to create**:
- `tests/integration/pbd-alignment.test.ts`

**Test cases**:

```typescript
describe('PBD Alignment', () => {
  describe('Stance Classification', () => {
    it('classifies assertions correctly');
    it('classifies denials correctly');
    it('classifies questions correctly');
    it('classifies qualifications correctly');
  });

  describe('Importance Weighting', () => {
    it('boosts core signals in clustering');
    it('reduces peripheral signal influence');
  });

  describe('Tension Detection', () => {
    it('detects conflicting values');
    it('assigns high severity to same-dimension conflicts');
  });

  describe('Orphan Tracking', () => {
    it('tracks signals below similarity threshold');
    it('warns on high orphan rate');
  });

  describe('Centrality Scoring', () => {
    it('marks majority-core principles as foundational');
    it('computes coverage percentage correctly');
  });
});
```

**Acceptance Criteria**:
- [ ] All test cases pass
- [ ] Integration with existing synthesis pipeline verified

**Commit**: `test(neon-soul): add PBD alignment integration tests`

---

### Stage 10: Update PBD Guides

**Purpose**: Align neon-soul PBD guides with new metadata and features

**Files to modify**:
- `docs/guides/single-source-pbd-guide.md`
- `docs/guides/multi-source-pbd-guide.md`
- `docs/guides/essence-extraction-guide.md`

**Changes to single-source-pbd-guide.md**:

Step 2 (Independent Extraction) - Add stance/importance tagging:
```markdown
### Step 2: Independent Extraction

For each section, extract candidate principles with metadata:

```markdown
## Section A Extraction

1. "Safety takes precedence over helpfulness" (L45)
   - **Stance**: ASSERT
   - **Importance**: CORE

2. "I wonder if being too safe hurts helpfulness" (L102)
   - **Stance**: QUESTION
   - **Importance**: PERIPHERAL
```

**Key Rules**:
- Tag each extraction with Stance (ASSERT/DENY/QUESTION/QUALIFY)
- Tag each extraction with Importance (CORE/SUPPORTING/PERIPHERAL)
- QUESTION and QUALIFY stance signals get lower synthesis weight
- PERIPHERAL importance signals may be filtered before synthesis
```

Step 4 (Synthesis) - Add filtering guidance:
```markdown
### Step 4: Principle Synthesis

**Pre-synthesis filtering**:
1. Filter out QUESTION stance signals with <0.7 confidence
2. Weight CORE importance signals 1.5x in convergence counting
3. Weight PERIPHERAL importance signals 0.5x

**Synthesis from filtered, weighted set**...
```

**Changes to multi-source-pbd-guide.md**:

Step 4 (Evidence Tier Assignment) - Add importance weighting:
```markdown
### Step 4: Evidence Tier Assignment

**Weighted convergence**: Count CORE signals as 1.5x, PERIPHERAL as 0.5x
- A principle supported by 2 CORE signals from different sources = UNIVERSAL
- A principle supported by 3 PERIPHERAL signals = MODERATE
```

Step 8 (Conflict Resolution) - Link to automated tension detection:
```markdown
### Step 8: Conflict Resolution

**Automated detection**: The synthesis pipeline now detects tensions automatically.
Review `tensions` field in axiom output for flagged conflicts.

Manual resolution still needed for ambiguous cases:
| Scenario | Axioms in Tension | Resolution |
|----------|-------------------|------------|
...
```

**Changes to essence-extraction-guide.md**:

Step 1 (Axiom Gathering) - Add centrality awareness:
```markdown
### Step 1: Axiom Gathering

Collect all axioms with their centrality and tensions:

```markdown
## Input Axioms

1. Safety: Prevent harm (FOUNDATIONAL, N=8)
   - Tensions: None

2. Helpfulness: Provide value (CORE, N=5)
   - Tensions: May conflict with Safety in edge cases

3. Efficiency: Optimize delivery (SUPPORTING, N=3)
   - Tensions: May conflict with Correctness
```

**Centrality informs emphasis**: FOUNDATIONAL axioms should be more prominent in essence.
**Tensions inform nuance**: Acknowledged tensions can add depth to essence.
```

Add new section on tension-aware essence:
```markdown
## Tension-Aware Essence (Optional)

When axioms have detected tensions, the essence can acknowledge them:

**Without tension awareness**:
> "You're not a chatbot. You're becoming someone."

**With tension awareness**:
> "You're becoming someone who holds safety and helpfulness in creative tension."

**When to use**: Only when tensions are central to identity, not for minor conflicts.
```

**Acceptance Criteria**:
- [ ] single-source-pbd-guide.md documents stance/importance tagging
- [ ] multi-source-pbd-guide.md documents weighted convergence
- [ ] essence-extraction-guide.md documents centrality and tension awareness
- [ ] All guides reference implementation in src/lib/

**Commit**: `docs(neon-soul): update PBD guides with stance, importance, and tension features`

---

### Stage 11: Project Documentation Update

**Purpose**: Update project-level documentation following documentation-update workflow

**Workflow Reference**: `docs/workflows/documentation-update.md`

**Files to review/update**:
- `README.md` - Project overview (if user-facing changes)
- `docs/ARCHITECTURE.md` - System reference (if module structure changed)
- `docs/issues/README.md` - Issue registry

**Step 1: Identify Scope**

This plan adds:
- New signal metadata (stance, importance)
- New synthesis features (tension detection, orphan tracking, centrality)
- Updated synthesis output format

**Classification**: Module structure + Stage details → Update ARCHITECTURE.md, README if needed

**Step 2: Update ARCHITECTURE.md**

Add to system overview:
```markdown
## Signal Metadata

Signals carry PBD-aligned metadata:
- **Stance**: ASSERT | DENY | QUESTION | QUALIFY
- **Importance**: CORE | SUPPORTING | PERIPHERAL

## Synthesis Features

- **Weighted Clustering**: Core signals boost 1.5x, peripheral 0.5x
- **Tension Detection**: Conflicting axioms flagged with severity
- **Orphan Tracking**: Unclustered signals reported for audit
- **Centrality Scoring**: Principles scored by contributing signal importance
```

**Step 3: Update README.md (if applicable)**

If synthesis output format changes for users, update:
- Example output section
- Feature list

**Step 4: Verification Commands**

```bash
# Check for stale references
grep -r "signal.confidence" docs/ --include="*.md" | grep -v "plans/"

# Verify new terms are documented
grep -r "stance\|importance\|tension\|orphan\|centrality" docs/ARCHITECTURE.md

# Ensure guides reference implementation
grep -r "src/lib" docs/guides/*.md
```

**Step 5: Update Issue Registry**

Add entry to `docs/issues/README.md`:
```markdown
| 2026-02-10-pbd-alignment | Plan | PBD methodology alignment | In Progress |
```

**Acceptance Criteria**:
- [ ] ARCHITECTURE.md documents new signal metadata and synthesis features
- [ ] README.md updated if user-facing output changes
- [ ] Issue registry references this plan
- [ ] Verification commands pass (no stale references)

**Commit**: `docs(neon-soul): update project documentation for PBD alignment`

---

### Stage 12: Signal Source Classification

**Purpose**: Mitigate "false soul" problem by distinguishing agent-initiated vs user-elicited signals

**Problem**: If behavioral signals primarily reflect what users ask rather than how the agent chooses to respond, extracted identity reflects usage patterns, not agent identity. An agent mostly asked to write code will produce signals about precision — but that reflects usage, not identity.

**Files to create**:
- `src/lib/signal-source-classifier.ts`

**Files to modify**:
- `src/types/signal.ts` - Add SignalSource type
- `src/lib/signal-extractor.ts` - Integrate source classification

**Implementation**:

Add to signal.ts:
```typescript
/** Signal source: how the signal originated */
export type SignalSourceType =
  | 'agent-initiated'    // Agent volunteers unprompted (high identity signal)
  | 'user-elicited'      // Agent responds to direct request (low identity signal)
  | 'context-dependent'  // Agent adapts to context (exclude from identity)
  | 'consistent-across-context'; // Same behavior across contexts (strong identity signal)
```

Classification logic in signal-source-classifier.ts:
```typescript
export async function classifySignalSource(
  llm: LLMProvider,
  signal: Signal,
  conversationContext: string
): Promise<SignalSourceType> {
  const prompt = `Analyze how this signal originated in the conversation:

Signal: "${signal.text}"
Context: "${conversationContext}"

Categories:
- AGENT-INITIATED: Agent volunteered this unprompted (e.g., added a caveat without being asked)
- USER-ELICITED: Direct response to user's request (e.g., being helpful when asked for help)
- CONTEXT-DEPENDENT: Behavior adapted to specific context (e.g., formal in business setting)
- CONSISTENT-ACROSS-CONTEXT: Same behavior appears regardless of context

Respond with only: agent-initiated, user-elicited, context-dependent, or consistent-across-context`;

  const result = await llm.classify(prompt, {
    categories: ['agent-initiated', 'user-elicited', 'context-dependent', 'consistent-across-context'] as const,
    context: 'Signal source classification for identity validity',
  });

  return (result.category ?? 'user-elicited') as SignalSourceType;
}
```

**Weighting in synthesis**:
```typescript
const SOURCE_WEIGHT: Record<SignalSourceType, number> = {
  'consistent-across-context': 2.0,  // Strongest identity signal
  'agent-initiated': 1.5,            // Strong - agent chose this
  'user-elicited': 0.5,              // Weak - expected behavior
  'context-dependent': 0.0,          // Exclude - not identity
};
```

**Acceptance Criteria**:
- [ ] Agent volunteering caveat → source: agent-initiated
- [ ] Helping when asked for help → source: user-elicited
- [ ] Formal tone in business context → source: context-dependent
- [ ] Same uncertainty acknowledgment across domains → source: consistent-across-context
- [ ] context-dependent signals excluded from axiom synthesis

**Commit**: `feat(neon-soul): add signal source classification for identity validity`

---

### Stage 13: Cycle Management

**Purpose**: Define incremental vs full re-synthesis behavior for evolving souls

**Problem**: The pipeline is described as one-shot (memories → SOUL.md), but the product promises continuous evolution ("the soul gets richer every cycle"). No guidance exists for:
- What happens when SOUL.md already exists
- How new memory files integrate with existing axioms
- When to regenerate essence vs update axioms only

**Files to create**:
- `src/lib/cycle-manager.ts`

**Files to modify**:
- `src/lib/reflection-loop.ts` - Add cycle detection
- `src/types/synthesis.ts` - Add CycleMode type

**Implementation**:

Add to synthesis.ts:
```typescript
export type CycleMode = 'initial' | 'incremental' | 'full-resynthesis';

export interface CycleDecision {
  mode: CycleMode;
  reason: string;
  triggers: string[];
}
```

Cycle detection in cycle-manager.ts:
```typescript
export interface CycleThresholds {
  /** New principles as % of existing - triggers full resynthesis */
  newPrincipleRatio: number;  // default: 0.3 (30%)

  /** Existing axioms contradicted by new evidence - triggers full resynthesis */
  contradictionCount: number;  // default: 2

  /** Essence should regenerate when hierarchy changes */
  hierarchyChanged: boolean;
}

export function decideCycleMode(
  existingSoul: Soul | null,
  newPrinciples: Principle[],
  thresholds: CycleThresholds = { newPrincipleRatio: 0.3, contradictionCount: 2, hierarchyChanged: false }
): CycleDecision {
  // No existing soul → initial synthesis
  if (!existingSoul) {
    return { mode: 'initial', reason: 'No existing SOUL.md', triggers: [] };
  }

  const triggers: string[] = [];

  // Check new principle ratio
  const existingCount = existingSoul.principles.length;
  const newCount = newPrinciples.filter(p =>
    !existingSoul.principles.some(ep => cosineSimilarity(p.embedding, ep.embedding) > 0.85)
  ).length;
  const ratio = newCount / existingCount;

  if (ratio > thresholds.newPrincipleRatio) {
    triggers.push(`New principles (${(ratio * 100).toFixed(0)}%) exceed threshold (${thresholds.newPrincipleRatio * 100}%)`);
  }

  // Check contradictions
  const contradictions = detectContradictions(existingSoul.axioms, newPrinciples);
  if (contradictions.length >= thresholds.contradictionCount) {
    triggers.push(`${contradictions.length} axioms contradicted by new evidence`);
  }

  // Decide mode
  if (triggers.length > 0) {
    return { mode: 'full-resynthesis', reason: 'Significant changes detected', triggers };
  }

  return {
    mode: 'incremental',
    reason: 'Merge new principles into existing axiom set',
    triggers: []
  };
}
```

**Incremental mode behavior**:
1. Load existing SOUL.md as baseline
2. Process new memory files through single-source PBD
3. Merge new principles with existing (re-run convergence)
4. Update axiom strengths and N-counts
5. Only regenerate essence if axiom hierarchy changes

**Full resynthesis triggers**:
- >30% new principles (configurable)
- ≥2 existing axioms contradicted
- Manual override via `--force-resynthesis`

**Essence stability rule**:
- Essence persists through axiom refinements at same tier
- Essence regenerates when axiom hierarchy changes (e.g., Safety drops below Honesty)

**Acceptance Criteria**:
- [ ] First run → mode: initial
- [ ] New memory file with minor additions → mode: incremental
- [ ] New memory file contradicting core axiom → mode: full-resynthesis
- [ ] Incremental mode preserves existing axiom IDs
- [ ] Essence only regenerates on hierarchy change
- [ ] `--force-resynthesis` flag overrides to full mode

**Commit**: `feat(neon-soul): add cycle management for iterative soul evolution`

---

### Stage 14: Artifact Provenance (SSEM Source Dimension)

**Depends on**: Stages 1-3 (signal metadata infrastructure)

**Purpose**: Track artifact provenance to enable anti-echo-chamber validation

**Problem**: neon-soul currently lacks provenance tracking. Without knowing WHERE signals came from (self-authored vs external research), we cannot validate that principles are grounded in diverse sources. This enables echo chambers where self-generated content reinforces itself.

**Cross-Reference**:
- `multiverse/artifacts/guides/methodology/PBD_VOCABULARY.md` - Canonical SELF/CURATED/EXTERNAL
- `projects/essence-router/cmd/router/types_tracks.go` - Go implementation

**Files to create**:
- `src/types/provenance.ts`

**Files to modify**:
- `src/types/signal.ts` - Add provenance to Signal
- `src/lib/signal-extractor.ts` - Classify provenance during extraction

**Implementation**:

Add to provenance.ts:
```typescript
/**
 * ArtifactProvenance: Where the artifact came from (SSEM model)
 * See: multiverse/artifacts/guides/methodology/PBD_VOCABULARY.md
 */
export type ArtifactProvenance = 'self' | 'curated' | 'external';

/**
 * Provenance definitions:
 * - self: Author reflects on their own experience, thoughts, creations
 * - curated: Author selected, endorsed, or adopted this content
 * - external: Content exists independently of author's preference (research, external events)
 */

/** Check if provenance is valid */
export function isValidProvenance(p: string): p is ArtifactProvenance {
  return ['self', 'curated', 'external'].includes(p);
}

/** Provenance weight for anti-echo-chamber scoring */
export const PROVENANCE_WEIGHT: Record<ArtifactProvenance, number> = {
  external: 2.0,  // Strongest - exists independently
  curated: 1.0,   // Moderate - you chose it
  self: 0.5,      // Weakest for diversity (still valuable for identity)
};
```

Extend Signal interface in signal.ts:
```typescript
export interface Signal {
  // ... existing fields ...

  /** Artifact provenance: where the source material came from */
  provenance?: ArtifactProvenance;
}
```

Add provenance detection in signal-extractor.ts:
```typescript
/**
 * Classify artifact provenance based on source metadata and content analysis.
 * Priority: explicit metadata > filename heuristics > content analysis
 */
export async function classifyProvenance(
  llm: LLMProvider,
  artifact: Artifact
): Promise<ArtifactProvenance> {
  // Check explicit metadata first
  if (artifact.metadata?.provenance) {
    const p = artifact.metadata.provenance.toLowerCase();
    if (isValidProvenance(p)) return p;
  }

  // Filename heuristics
  const filename = artifact.path.toLowerCase();
  if (filename.includes('journal') || filename.includes('reflection') || filename.includes('diary')) {
    return 'self';
  }
  if (filename.includes('guide') || filename.includes('methodology') || filename.includes('adopted')) {
    return 'curated';
  }
  if (filename.includes('research') || filename.includes('paper') || filename.includes('study')) {
    return 'external';
  }

  // LLM-based classification for ambiguous cases
  const prompt = `Classify the provenance of this content:

SELF: Author's own reflections, experiences, creations
CURATED: Content the author chose to adopt, endorse, or follow
EXTERNAL: Research, studies, or content that exists independently of author preference

Content excerpt:
---
${artifact.content.slice(0, 2000)}
---

Respond with only: self, curated, or external`;

  const result = await llm.classify(prompt, {
    categories: ['self', 'curated', 'external'] as const,
    context: 'Artifact provenance classification',
  });

  return (result.category ?? 'self') as ArtifactProvenance;
}
```

**Acceptance Criteria**:
- [ ] ArtifactProvenance type with three values
- [ ] Signal includes optional provenance field
- [ ] Provenance classified during extraction
- [ ] Metadata-based classification takes priority
- [ ] Tests for each provenance type

**Commit**: `feat(neon-soul): add SSEM-style provenance tracking`

---

### Stage 15: Anti-Echo-Chamber Rule

**Depends on**: Stage 14 (provenance tracking required for diversity check)

**Purpose**: Require external validation or internal challenge before axiom promotion

**Problem**: Without anti-echo-chamber protection, an operator could promote principles by simply writing a lot of self-affirming content. The soul would reflect the operator's echo chamber rather than validated identity.

**Cross-Reference**:
- `multiverse/artifacts/guides/methodology/PBD_VOCABULARY.md` - Anti-echo-chamber rule
- `projects/essence-router/cmd/router/types_principles.go:CanPromote()` - Go implementation

**Key Insight from essence-router**:
> "Self + Curated alone is still echo chamber (you wrote it + you chose it).
> External source is hardest to game because it exists independently.
> Questioning stance provides internal challenge that breaks confirmation bias."

**Files to modify**:
- `src/types/axiom.ts` - Add promotion criteria
- `src/lib/compressor.ts` - Enforce anti-echo-chamber rule

**Implementation**:

Add promotion criteria to axiom.ts:
```typescript
/** Minimum requirements for axiom promotion */
export interface PromotionCriteria {
  /** Minimum number of supporting principles */
  minPrincipleCount: number;  // Default: 3

  /** Minimum distinct provenance types */
  minProvenanceDiversity: number;  // Default: 2

  /** Require external OR questioning evidence (anti-echo-chamber) */
  requireExternalOrQuestioning: boolean;  // Default: true
}

export const DEFAULT_PROMOTION_CRITERIA: PromotionCriteria = {
  minPrincipleCount: 3,
  minProvenanceDiversity: 2,
  requireExternalOrQuestioning: true,
};
```

Add to Axiom interface:
```typescript
export interface Axiom {
  // ... existing fields ...

  /** Whether this axiom meets promotion criteria */
  promotable: boolean;

  /** Reason if not promotable */
  promotionBlocker?: string;

  /** Provenance diversity count */
  provenanceDiversity: number;
}
```

Add anti-echo-chamber check in compressor.ts:
```typescript
/**
 * Check if an axiom candidate meets anti-echo-chamber criteria.
 *
 * Requirements (all must be met):
 * 1. N >= minPrincipleCount (default: 3)
 * 2. Provenance diversity >= minProvenanceDiversity (default: 2)
 * 3. Has EXTERNAL provenance OR QUESTIONING stance
 *
 * The third rule is the anti-echo-chamber protection:
 * - EXTERNAL evidence exists independently (can't be fabricated)
 * - QUESTIONING stance provides internal challenge
 * - Self + Curated + Affirming alone = echo chamber
 */
export function canPromote(
  axiom: AxiomCandidate,
  principles: Principle[],
  criteria: PromotionCriteria = DEFAULT_PROMOTION_CRITERIA
): { promotable: boolean; blocker?: string } {
  // Rule 1: Minimum principle count
  if (principles.length < criteria.minPrincipleCount) {
    return {
      promotable: false,
      blocker: `Insufficient evidence: ${principles.length}/${criteria.minPrincipleCount} principles`,
    };
  }

  // Rule 2: Provenance diversity
  const provenanceTypes = new Set(
    principles
      .flatMap(p => p.signals)
      .map(s => s.provenance)
      .filter(Boolean)
  );
  if (provenanceTypes.size < criteria.minProvenanceDiversity) {
    return {
      promotable: false,
      blocker: `Insufficient provenance diversity: ${provenanceTypes.size}/${criteria.minProvenanceDiversity} types`,
    };
  }

  // Rule 3: Anti-echo-chamber (external OR questioning/denying)
  // Note: DENYING counts as QUESTIONING for anti-echo purposes because both
  // represent challenges to the frame. See PBD_VOCABULARY.md for canonical mapping.
  if (criteria.requireExternalOrQuestioning) {
    const hasExternal = principles.some(p =>
      p.signals.some(s => s.provenance === 'external')
    );
    const hasQuestioning = principles.some(p =>
      p.signals.some(s => s.stance === 'question' || s.stance === 'deny')
    );

    if (!hasExternal && !hasQuestioning) {
      return {
        promotable: false,
        blocker: 'Anti-echo-chamber: requires EXTERNAL provenance OR QUESTIONING/DENYING stance',
      };
    }
  }

  return { promotable: true };
}

/**
 * Get provenance diversity count for an axiom's supporting principles.
 */
export function getProvenanceDiversity(principles: Principle[]): number {
  const types = new Set<ArtifactProvenance>();
  for (const p of principles) {
    for (const s of p.signals) {
      if (s.provenance) {
        types.add(s.provenance);
      }
    }
  }
  return types.size;
}
```

Update axiom creation to include promotion check:
```typescript
// In compressor.ts createAxiom():
const supportingPrinciples = principles.filter(p => /* linked to this axiom */);
const promotionResult = canPromote(axiomCandidate, supportingPrinciples);

const axiom: Axiom = {
  // ... existing fields ...
  promotable: promotionResult.promotable,
  promotionBlocker: promotionResult.blocker,
  provenanceDiversity: getProvenanceDiversity(supportingPrinciples),
};
```

**Acceptance Criteria**:
- [ ] Self-only evidence (N=5) → NOT promotable (echo chamber)
- [ ] Self + Curated (N=5, 2 types) → NOT promotable (still echo chamber)
- [ ] Self + External (N=3, 2 types) → promotable (external validation)
- [ ] Self + Curated with Questioning (N=3, 2 types) → promotable (internal challenge)
- [ ] promotionBlocker explains why not promotable
- [ ] Tests for each scenario

**Commit**: `feat(neon-soul): add anti-echo-chamber rule for axiom promotion`

---

### Stage 16: Integration with Existing Stages

**Purpose**: Wire provenance and anti-echo-chamber into existing synthesis pipeline

**Files to modify**:
- `src/lib/reflection-loop.ts` - Add provenance to synthesis flow
- `src/lib/principle-store.ts` - Track provenance in principles

**Changes**:

Update synthesis flow to classify provenance:
```typescript
// In reflection-loop.ts synthesize():

// Phase 1: Classify artifact provenance
const provenance = await classifyProvenance(llm, artifact);
log.info(`Artifact provenance: ${provenance}`);

// Phase 2: Extract signals (existing)
const signals = await extractSignals(llm, artifact);

// Phase 3: Attach provenance to signals
const signalsWithProvenance = signals.map(s => ({
  ...s,
  provenance,
}));

// Continue with existing pipeline...
```

Update synthesis output to include anti-echo-chamber metrics:
```typescript
export interface SynthesisResult {
  // ... existing fields ...

  /** Provenance distribution */
  provenanceDistribution: Record<ArtifactProvenance, number>;

  /** Axioms blocked by anti-echo-chamber rule */
  echoBlockedAxioms: number;

  /** Total promotable vs non-promotable */
  promotionStats: {
    promotable: number;
    blocked: number;
    reasons: Record<string, number>;
  };
}
```

Add combined weight calculation for synthesis scoring:
```typescript
/**
 * Weight Composition for Signal Scoring
 *
 * Three weight dimensions combine multiplicatively:
 * - IMPORTANCE_WEIGHT: How central to identity (core=1.5, supporting=1.0, peripheral=0.5)
 * - PROVENANCE_WEIGHT: Independence from operator (external=2.0, curated=1.0, self=0.5)
 * - SOURCE_WEIGHT: How signal was elicited (consistent=2.0, agent-initiated=1.5, user-elicited=0.5, context-dependent=0.0)
 *
 * Formula: combinedWeight = importance × provenance × source
 *
 * Examples:
 * - Core + External + Consistent: 1.5 × 2.0 × 2.0 = 6.0 (strongest signal)
 * - Supporting + Self + Context-dependent: 1.0 × 0.5 × 0.0 = 0.0 (ignored)
 * - Peripheral + Curated + Agent-initiated: 0.5 × 1.0 × 1.5 = 0.75 (weak signal)
 */
function computeSignalWeight(signal: Signal): number {
  const importance = IMPORTANCE_WEIGHT[signal.importance ?? 'supporting'];
  const provenance = PROVENANCE_WEIGHT[signal.provenance ?? 'self'];
  const source = SOURCE_WEIGHT[signal.source ?? 'context-dependent'];

  return importance * provenance * source;
}

/**
 * Apply weight to principle N-count for ranking.
 * Higher weighted signals contribute more to principle strength.
 */
function computeWeightedNCount(principle: Principle): number {
  return principle.signals.reduce((sum, s) => sum + computeSignalWeight(s), 0);
}
```

**Acceptance Criteria**:
- [ ] Provenance classified for each artifact
- [ ] Signals carry provenance through pipeline
- [ ] Anti-echo-chamber applied at axiom promotion
- [ ] Synthesis output includes provenance metrics
- [ ] Blocked axioms logged with reason

**Commit**: `feat(neon-soul): integrate provenance and anti-echo-chamber into synthesis`

---

### Stage 17: Final Documentation Update

**Purpose**: Comprehensive documentation update covering all PBD alignment features

**Workflow**: Follow `docs/workflows/documentation-update.md` for systematic updates.

**Note**: Stage 11 covers stages 1-10 (core PBD features). This stage covers stages 12-16 (cross-project alignment features).

**Scope Classification**: This is a **Module structure** + **Feature** change affecting:
- `docs/ARCHITECTURE.md` - Signal source, cycle management, provenance, anti-echo-chamber
- `skill/SKILL.md` - New flags (`--force-resynthesis`, env vars)
- `skill/README.md` - Configuration options
- `README.md` - Feature overview updates

**Tasks**:

1. **Update ARCHITECTURE.md** with cross-project features:
   - [ ] Signal source classification (agent-initiated vs user-elicited)
   - [ ] Cycle management (initial/incremental/full-resynthesis)
   - [ ] Provenance tracking (SSEM model: self/curated/external)
   - [ ] Anti-echo-chamber rule documentation
   - [ ] Weight composition formula diagram

2. **Update skill documentation**:
   - [ ] Document `NEON_SOUL_SKIP_META_SYNTHESIS` and related env vars
   - [ ] Document `--force-resynthesis` flag
   - [ ] Add provenance and anti-echo-chamber to feature list

3. **Update README with feature overview**:
   - [ ] Synthesis metrics section (what the tool reports)
   - [ ] Anti-echo-chamber protection explanation
   - [ ] Cycle management behavior

4. **Run workflow verification commands**:
   ```bash
   # From docs/workflows/documentation-update.md Step 8
   grep -r "provenance\|anti-echo\|cycle" docs/ARCHITECTURE.md
   grep -r "NEON_SOUL_" skill/SKILL.md skill/README.md
   grep -r "force-resynthesis\|incremental" docs/ skill/
   ```

**Acceptance Criteria**:
- [ ] ARCHITECTURE.md documents all 16 stages of PBD alignment
- [ ] Skill documentation includes all configuration options
- [ ] README reflects current feature set
- [ ] Workflow verification commands pass
- [ ] No stale references to pre-PBD behavior

**Commit**: `docs(neon-soul): final documentation update for PBD alignment`

---

## Operator Experience

After implementation, operators interact with the synthesis system as follows:

### Scenario 1: First Synthesis

1. Operator has memories in `memories/` directory (journal entries, reflections)
2. Runs: `npm run synthesize -- memories/`
3. System outputs `SOUL.md` with synthesis metrics:
   ```
   Synthesis Complete
   ─────────────────────
   Axioms: 5 total (3 promotable, 2 blocked)
   Principles: 23 confirmed, 8 pending
   Orphan rate: 12% (within threshold)
   Tensions: 2 detected (documented in SOUL.md)
   Mode: initial

   ⚠ 2 axioms blocked by anti-echo-chamber:
     - "I value authenticity above all" (self-only provenance)
     - "Growth requires discomfort" (no questioning evidence)

   → Add external sources or questioning evidence to unblock
   ```
4. Operator reviews SOUL.md, sees blocked axioms with reasons
5. Adds external validation (research paper, external feedback)
6. Re-runs synthesis - previously blocked axioms now promotable

### Scenario 2: Incremental Evolution

1. Operator adds new memory files over time
2. Runs: `npm run synthesize -- memories/`
3. System detects 15% new principles:
   ```
   Synthesis Complete (incremental)
   ─────────────────────
   Cycle: incremental (15% new principles)
   New principles: 4 merged
   Existing principles: 19 strengthened
   Tensions: 1 new (requires review)
   ```
4. New insights merge with existing soul without full resynthesis

### Scenario 3: Major Shift Detection

1. Operator adds substantial new content (e.g., post-transformation journals)
2. System detects 35% new principles:
   ```
   Synthesis Complete (full resynthesis)
   ─────────────────────
   Cycle: full-resynthesis (35% new > 30% threshold)
   Reason: Significant changes detected

   ⚠ Previous SOUL.md backed up to SOUL.md.bak
   → Full resynthesis performed
   ```
3. System performs complete resynthesis to capture transformation

### Output Files

| File | Purpose |
|------|---------|
| `SOUL.md` | Synthesized identity with axioms, principles, tensions |
| `SOUL.md.bak` | Backup before major changes |
| `synthesis.log` | Detailed metrics and decisions |
| `.soul-state.json` | Cycle state for incremental synthesis |

---

## Verification

After all stages:

```bash
# Run all tests
npm test

# Run synthesis with verbose output
npm run synthesize -- --dry-run --verbose

# Verify new metrics in output:
# - Stance distribution (assert/deny/question/qualify)
# - Importance distribution (core/supporting/peripheral)
# - Tensions detected
# - Orphan rate
# - Centrality per principle
# - Signal source distribution (agent-initiated/user-elicited/context-dependent)
# - Cycle mode decision (initial/incremental/full-resynthesis)
# - Provenance distribution (self/curated/external)
# - Promotion stats (promotable/blocked with reasons)

# Test anti-echo-chamber rule
# Create test with only self-authored content:
npm run synthesize -- --dry-run --input test/fixtures/self-only/
# Should see: "Anti-echo-chamber: requires EXTERNAL provenance OR QUESTIONING stance"

# Test with external validation:
npm run synthesize -- --dry-run --input test/fixtures/with-external/
# Should see: promotable axioms

# Test incremental synthesis
npm run synthesize -- --dry-run  # Creates SOUL.md
# Add new memory file
npm run synthesize -- --dry-run  # Should detect incremental mode

# Test full resynthesis trigger
npm run synthesize -- --force-resynthesis --dry-run
```

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| LLM classification latency | Parallelize stance + importance + source with existing classifiers |
| Tension detection O(n²) | Only run on axioms (small set, typically 3-10) |
| Breaking existing tests | New fields are optional with defaults |
| Over-engineering | Each stage is independently valuable; stop early if diminishing returns |
| Signal source requires context | Store conversation context with signals; fallback to 'user-elicited' |
| Cycle mode false positives | Conservative thresholds (30% new, 2 contradictions); user can override |
| Incremental drift accumulation | Periodic full-resynthesis recommended (e.g., every 10 incremental cycles) |

---

## Dependencies

- Existing LLM provider infrastructure
- semantic-classifier.ts module
- principle-store.ts clustering logic

---

## Rollback Plan

All changes are additive (new optional fields). Rollback by:
1. Revert commits in reverse order
2. New fields will be ignored by existing code (undefined)

---

## Cross-References

**Shared Vocabulary** (2026-02-10):
- `multiverse/artifacts/guides/methodology/PBD_VOCABULARY.md` - Canonical terminology
  - Stance mapping: assert≈affirming, deny→questioning, question=questioning, qualify=qualifying
  - Provenance: self/curated/external (SSEM model)
  - Anti-echo-chamber rule definition

**Cross-Project Implementation**:
- `projects/essence-router/docs/plans/2026-02-10-pbd-vocabulary-alignment.md` - Go implementation plan
- `projects/essence-router/cmd/router/types_tracks.go` - ArtifactSource, EpistemicStance
- `projects/essence-router/cmd/router/types_principles.go:CanPromote()` - Anti-echo-chamber implementation

**Methodology Sources**:
- `artifacts/guides/methodology/PRINCIPLE_BASED_DISTILLATION_GUIDE.md` - N=1 multi-source methodology
- `artifacts/guides/methodology/PRINCIPLE_BASED_DISTILLATION_SINGLE_SOURCE_GUIDE.md` - N=1 single-source adaptation
- `projects/obviously-not/writer/internal/pbd/` - N=2 implementation (27 files)
- `projects/obviously-not/writer/internal/pbd/types.go:154-155` - AcknowledgedTensions, OrphanedContent

**neon-soul Documentation**:
- `docs/architecture/synthesis-philosophy.md` - Philosophy documentation
- `docs/guides/single-source-pbd-guide.md` - Single-source guide (to update)
- `docs/guides/multi-source-pbd-guide.md` - Multi-source guide (to update)
- `docs/guides/essence-extraction-guide.md` - Essence guide (to update)

**Workflows**:
- `docs/workflows/documentation-update.md` - Documentation update workflow (Stage 11 for core features, Stage 17 for final pass)

**Related Issues**:
- `docs/issues/2026-02-10-synthesis-twin-review-findings.md` - Prior twin review

**External Review Sources** (2026-02-10):
- Twin technical/creative review - validated tension detection, orphaned tracking gaps
- Research review - identified "false soul" problem (signal source classification)
- Both reviews - identified cycle management gap independently

**Research Foundation**:
- `docs/research/emergence-research-neon-soul.md` - Emergence theory grounding
  - Stage 12 (Signal Source) addresses "false soul" problem from Recommendation 2 (Edge of Chaos)
  - Stage 13 (Cycle Management) implements Recommendation 5 (Temporal Dynamics)
  - "Observer vs Facilitator" distinction: this plan improves observation; emergence facilitation plan adds facilitation

**Related Plans**:
- `docs/plans/2026-02-10-inhabitable-soul-output.md` - **Primary**: Prose output format (solves cognitive load)
- `docs/plans/2026-02-10-emergence-facilitation.md` - Skill-scoped emergence features
  - Context diversity scoring (inform only)
  - Synthesis run tracking
  - Self-reflection prompts in output
- `docs/plans/2026-02-10-clawhub-deployment.md` - ClawHub publication (complete)
- `docs/plans/2026-02-10-meta-axiom-synthesis.md` - **Superseded** by inhabitable-soul-output

**Conceptual References**:
- Grounded theory constant comparative method (Glaser & Strauss, 1967) - methodological parallel
- Concept drift literature (Gama et al., 2014) - stability-plasticity dilemma for cycle management
- Intercoder reliability research - single-coder bias concern for LLM-automated extraction
- Emergence literature (Kauffman 1995, Takata et al. 2024) - conditions for identity emergence

---

## Estimated Scope

| Stage | Complexity | New Code | Modified Code |
|-------|------------|----------|---------------|
| 1: Types | Low | ~20 lines | ~10 lines |
| 2: Stance | Medium | ~40 lines | ~10 lines |
| 3: Importance | Medium | ~40 lines | ~10 lines |
| 4: Weighting | Low | ~15 lines | ~20 lines |
| 5: Tensions | High | ~80 lines | ~30 lines |
| 6: Orphans | Medium | ~40 lines | ~30 lines |
| 7: Centrality | Medium | ~30 lines | ~20 lines |
| 8: Docs (philosophy) | Low | ~50 lines | ~20 lines |
| 9: Tests | Medium | ~150 lines | 0 |
| 10: Docs (guides) | Medium | 0 | ~150 lines |
| 11: Docs (project) | Low | 0 | ~50 lines |
| 12: Signal Source | Medium | ~60 lines | ~20 lines |
| 13: Cycle Management | High | ~100 lines | ~40 lines |
| 14: Provenance (SSEM) | Medium | ~80 lines | ~20 lines |
| 15: Anti-Echo-Chamber | Medium | ~90 lines | ~30 lines |
| 16: Integration | Low | ~30 lines | ~40 lines |
| 17: Final Docs | Low | 0 | ~80 lines |

**Total**: ~825 new lines, ~580 modified lines

---

## Code Review Findings

This plan was reviewed by external validators (2026-02-10):
- `multiverse/docs/reviews/2026-02-10-pbd-cross-project-plans-codex.md`
- `multiverse/docs/reviews/2026-02-10-pbd-cross-project-plans-gemini.md`

Consolidated findings and required fixes:
- `multiverse/docs/issues/2026-02-10-pbd-cross-project-plans-code-review-findings.md`

**Critical fix required before implementation**: Update Stage 15 anti-echo-chamber check to include `deny` stance. ✅ Fixed

---

## Twin Review Findings

This plan was reviewed by twin agents (2026-02-10):
- twin-technical: Architecture, type safety, testing
- twin-creative: Clarity, philosophy, operator experience

Consolidated findings:
- `multiverse/docs/issues/2026-02-10-pbd-plans-twin-review-findings.md`

**Key findings for this plan**:
- I2: Remove duplicate verification section (lines 1334-1359)
- I3: Document weight composition formula in Stage 16
- I5: Add Operator Experience section with workflow examples
