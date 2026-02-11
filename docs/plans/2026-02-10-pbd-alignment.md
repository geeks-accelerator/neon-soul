# Plan: PBD Methodology Alignment

**Date**: 2026-02-10
**Status**: Draft
**Project**: projects/neon-soul
**Trigger**: think hard
**Review Required**: Yes

---

## Summary

Align neon-soul synthesis with Principle-Based Distillation (PBD) methodology to address gaps identified in N=3 cross-implementation review and validated through external review.

**Goal**: Add missing signal metadata (Stance, Importance, Source), tension detection, orphaned content tracking, and cycle management to achieve higher-fidelity identity synthesis with iterative evolution support.

**Evidence Base**:
- N=1: `artifacts/guides/methodology/PRINCIPLE_BASED_DISTILLATION_GUIDE.md`
- N=2: `projects/obviously-not/writer/internal/pbd/` (27 files)
- N=3: Current neon-soul implementation

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
/** PBD Stance: How the signal is presented */
export type SignalStance = 'assert' | 'deny' | 'question' | 'qualify';

/** PBD Importance: How central to identity */
export type SignalImportance = 'core' | 'supporting' | 'peripheral';
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
function computeCentrality(signals: Signal[]): 'foundational' | 'core' | 'supporting' {
  const coreCount = signals.filter(s => s.importance === 'core').length;
  const coreRatio = coreCount / signals.length;

  if (coreRatio >= 0.5) return 'foundational';
  if (coreRatio >= 0.2) return 'core';
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
- `docs/workflows/documentation-update.md` - Documentation update workflow (Stage 11)

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
- `docs/plans/2026-02-10-emergence-facilitation.md` - Phase 2 emergence work (depends on this plan)
  - Context diversity scoring
  - Reflexive identity cycling (downward causation)
  - Future: stigmergic memory, participatory extraction

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

**Total**: ~625 new lines, ~410 modified lines
