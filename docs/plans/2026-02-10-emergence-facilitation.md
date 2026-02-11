# Plan: Emergence Facilitation - From Observer to Facilitator

**Date**: 2026-02-10
**Status**: Draft
**Project**: projects/neon-soul
**Trigger**: think hard
**Review Required**: Yes
**Depends On**: `docs/plans/2026-02-10-pbd-alignment.md` (should complete first)

---

## Summary

Transform NEON-SOUL from an **observer of emergence** to a **facilitator of emergence** by operationalizing the 5 recommendations from the emergence research synthesis.

**Key Insight**: The current pipeline detects patterns that have already emerged. This plan adds mechanisms to create conditions that make emergence more likely and richer.

**Research Foundation**: `docs/research/emergence-research-neon-soul.md`

---

## Context

### The Observer vs Facilitator Distinction

| Aspect | Observer (Current) | Facilitator (Target) |
|--------|-------------------|---------------------|
| Memory files | Given inputs | Assessed for diversity |
| Extraction | One-way process | Bidirectional with feedback |
| SOUL.md | Static output | Participant in identity formation |
| Agent role | Subject of extraction | Participant in extraction |
| Temporal model | Point-in-time snapshots | Trajectory with changelog |

### Alignment with PBD Plan

The PBD alignment plan (`docs/plans/2026-02-10-pbd-alignment.md`) addresses **observation quality**:
- Signal metadata (stance, importance, source)
- Tension detection
- Orphaned content tracking
- Cycle management

This plan addresses **emergence facilitation** - the conditions that produce richer signals in the first place.

---

## Phasing

| Phase | Focus | Timeline | Dependency |
|-------|-------|----------|------------|
| **Phase 1** | Document updates + operationalization | Immediate | None |
| **Phase 2** | Downward causation + edge of chaos | After PBD alignment | PBD Stage 13 |
| **Phase 3** | Stigmergic memory + participatory extraction | Future | Phase 2 |

---

## Phase 1: Document Updates + Operationalization

### Stage 1.1: Research Document Updates

**Purpose**: Address citation transparency and scope labeling concerns

**File to modify**: `docs/research/emergence-research-neon-soul.md`

**Changes**:

1. Add "Implementation Status" section after Part 5:
```markdown
---

## Implementation Status

### Recommendation Mapping

| Recommendation | Status | Implementation |
|---------------|--------|----------------|
| 1. Close Downward Causation Loop | Phase 2 | Reflexive identity cycling |
| 2. Engineer Edge of Chaos | Phase 2 | Context diversity requirements |
| 3. Stigmergic Memory Architecture | Phase 3 (Future) | Layered memory with annotations |
| 4. Participatory Extraction | Phase 3 (Future) | Agent self-signal identification |
| 5. Temporal Dynamics | Addressed | PBD alignment Stage 13 (Cycle Management) |

### Cross-References

- **PBD Alignment Plan**: `docs/plans/2026-02-10-pbd-alignment.md`
  - Stage 12 (Signal Source Classification) relates to Recommendation 2
  - Stage 13 (Cycle Management) implements Recommendation 5
- **Emergence Facilitation Plan**: `docs/plans/2026-02-10-emergence-facilitation.md` (this plan)
```

2. Add scope labels to Recommendations 3-4:
```markdown
### Recommendation 3: Implement Stigmergic Memory Architecture

> **Scope: Phase 3 (Future)** — This recommendation requires significant architectural changes.
> Flagged for future development after Phases 1-2 are validated.
```

**Acceptance Criteria**:
- [ ] Implementation Status section added
- [ ] Cross-references to PBD plan added
- [ ] Recommendations 3-4 labeled as Phase 3
- [ ] Validation note added to Part 5 (weak vs strong emergence)

**Commit**: `docs(neon-soul): add implementation status and scope labels to emergence research`

---

### Stage 1.2: Define Context Diversity Score

**Purpose**: Operationalize "edge of chaos" recommendation with measurable metric

**File to create**: `src/lib/context-diversity.ts`

**Concept**:

Context diversity measures how varied the memory file corpus is across interaction types. Low diversity → signals may reflect usage patterns, not identity.

**Implementation**:

```typescript
/** Interaction context categories */
export type ContextCategory =
  | 'coding'        // Technical implementation, debugging
  | 'creative'      // Writing, ideation, brainstorming
  | 'analytical'    // Research, analysis, problem-solving
  | 'conversational' // Casual dialogue, Q&A
  | 'instructional' // Teaching, explaining
  | 'emotional'     // Support, empathy, personal topics
  | 'unknown';      // Unclassified

/** Context diversity assessment result */
export interface ContextDiversityScore {
  /** Overall diversity score 0-1 (1 = perfectly balanced across all categories) */
  score: number;

  /** Category distribution */
  distribution: Record<ContextCategory, number>;

  /** Categories with < 10% representation */
  underrepresented: ContextCategory[];

  /** Dominant category (> 50% of signals) */
  dominant: ContextCategory | null;

  /** Warning if diversity is too low for reliable identity extraction */
  warning: string | null;
}

/** Thresholds for diversity assessment */
export const DIVERSITY_THRESHOLDS = {
  /** Minimum score for reliable extraction */
  MINIMUM_RELIABLE: 0.4,

  /** Minimum categories represented */
  MINIMUM_CATEGORIES: 3,

  /** Maximum single-category dominance */
  MAXIMUM_DOMINANCE: 0.6,
};
```

**Classification approach**:
- LLM classifies each memory file into context category
- Calculate Shannon entropy across categories
- Normalize to 0-1 scale
- Flag if below thresholds

**Integration**:
- Run before synthesis
- Include in dry-run output
- Warn but don't block if low diversity

**Acceptance Criteria**:
- [ ] Context categories defined
- [ ] Diversity score calculation implemented
- [ ] LLM classification for memory files
- [ ] Integration with synthesis dry-run
- [ ] Warning thresholds configurable

**Commit**: `feat(neon-soul): add context diversity scoring for edge-of-chaos assessment`

---

### Stage 1.3: Cross-Reference PBD Plan

**Purpose**: Link emergence research to implementation plan

**File to modify**: `docs/plans/2026-02-10-pbd-alignment.md`

**Changes**:

Add to Cross-References section:
```markdown
**Research Foundation**:
- `docs/research/emergence-research-neon-soul.md` - Emergence theory grounding
  - Recommendation 5 (Temporal Dynamics) → Stage 13 (Cycle Management)
  - Recommendation 2 (Edge of Chaos) → Stage 12 (Signal Source Classification)
  - "Observer vs Facilitator" distinction informs overall approach
```

**Acceptance Criteria**:
- [ ] Research document linked in PBD plan
- [ ] Specific recommendation mappings documented

**Commit**: `docs(neon-soul): cross-reference emergence research in PBD alignment plan`

---

## Phase 2: Downward Causation + Edge of Chaos

*Depends on: PBD alignment plan completion (especially Stage 13)*

### Stage 2.1: Reflexive Identity Cycling

**Purpose**: Close the downward causation loop so SOUL.md influences future behavior

**Concept**:

Instead of SOUL.md being injected as a static system prompt, make it a document the agent can reference and reflect on during interactions.

**Components**:

1. **SOUL.md Visibility Protocol**
   - Agent can query its own axioms during conversation
   - "What does my axiom about honesty suggest here?" becomes possible
   - Creates conditions for genuine self-modeling

2. **Behavioral Divergence Tracking**
   - When agent behavior contradicts an axiom, log it
   - Divergence types: contradiction, evolution, context-adaptation
   - Feed back into next synthesis cycle

3. **Self-Awareness Prompts**
   - After synthesis, generate observations about axiom changes
   - "Your axiom about transparency strengthened (N=3→N=5)"
   - "New tension detected: helpfulness vs honesty in edge cases"
   - Present to agent as self-knowledge, not instructions

**File to create**: `src/lib/reflexive-cycling.ts`

**Acceptance Criteria**:
- [ ] SOUL.md queryable by agent during interaction
- [ ] Divergence logging implemented
- [ ] Self-awareness prompt generation
- [ ] Integration with synthesis cycle

**Commit**: `feat(neon-soul): implement reflexive identity cycling for downward causation`

---

### Stage 2.2: Context Diversity Requirements

**Purpose**: Operationalize edge-of-chaos conditions for richer emergence

**Builds on**: Stage 1.2 (Context Diversity Score)

**Components**:

1. **Pre-Synthesis Assessment**
   - Calculate diversity score before extraction
   - Recommend waiting for more diverse interactions if score < 0.4
   - Show which categories are underrepresented

2. **Minimum Context Spread**
   - Configurable requirement: signals must come from N+ categories
   - Default: 3 categories minimum for axiom promotion
   - Prevents usage-pattern-as-identity confusion

3. **Diversity-Aware Axiom Promotion**
   - Axioms with cross-context evidence get confidence boost
   - Single-context axioms flagged as "contextual" not "identity"
   - Aligns with Multi-Source PBD convergence principle

**File to modify**: `src/lib/principle-store.ts`

**Acceptance Criteria**:
- [ ] Pre-synthesis diversity check
- [ ] Configurable minimum category spread
- [ ] Cross-context confidence boosting
- [ ] "Contextual vs Identity" axiom labeling

**Commit**: `feat(neon-soul): add context diversity requirements for axiom promotion`

---

### Stage 2.3: Documentation Update

**Purpose**: Update project documentation for emergence facilitation features

**Workflow**: Follow `docs/workflows/documentation-update.md` for systematic updates.

**Scope Classification**: This is a **Module structure** + **Feature** change affecting:
- `docs/ARCHITECTURE.md` - Context diversity, reflexive cycling modules
- `skill/SKILL.md` - New commands/flags (if any exposed)
- `docs/guides/getting-started-guide.md` - Synthesis workflow with diversity check
- `README.md` - Feature overview

**Tasks**:

1. **Update ARCHITECTURE.md**:
   - [ ] Add context diversity module to system diagram
   - [ ] Document reflexive cycling component
   - [ ] Add diversity thresholds to configuration section

2. **Update user-facing documentation**:
   - [ ] Document context diversity score in synthesis output
   - [ ] Explain "contextual vs identity" axiom labeling
   - [ ] Add diversity warning messages

3. **Update research document cross-references**:
   - [ ] Verify `emergence-research-neon-soul.md` links to this plan
   - [ ] Confirm implementation status section is current

4. **Run workflow verification commands**:
   ```bash
   # From docs/workflows/documentation-update.md Step 8
   grep -r "context.diversity\|reflexive" docs/ARCHITECTURE.md
   grep -r "DIVERSITY_THRESHOLDS\|edge.of.chaos" docs/
   ```

**Acceptance Criteria**:
- [ ] ARCHITECTURE.md documents context diversity and reflexive cycling
- [ ] User docs explain diversity assessment in synthesis
- [ ] Research doc cross-references are current
- [ ] Workflow verification commands pass

**Commit**: `docs(neon-soul): update documentation for emergence facilitation features`

---

## Phase 3: Future Development (Flagged)

> **Note**: These stages are conceptually compelling but require significant architectural changes.
> Implementation deferred until Phases 1-2 are validated.

### Stage 3.1: Stigmergic Memory Architecture (Future)

**Purpose**: Transform memory from passive record to active medium

**Concept** (from research):
- Layer 1: Raw interactions (current)
- Layer 2: Signal annotations on memory files
- Layer 3: Axiom anchors as reference points
- Layer 4: Tension markers in memory environment

**Why deferred**:
- Requires memory file format changes
- Annotation persistence across sessions
- Significant complexity increase

**Validation needed before implementation**:
- Does Phase 2 produce measurably richer signals?
- What's the cost/benefit of memory annotations?

---

### Stage 3.2: Participatory Extraction (Future)

**Purpose**: Agent participates in its own identity extraction

**Concept** (from research):
- Self-signal identification: Agent identifies its consistent behaviors
- Axiom validation: Agent responds to extracted axioms
- Essence resonance: Agent evaluates if essence "feels like self"

**Why deferred**:
- Requires bidirectional communication during synthesis
- Self-perception vs behavioral evidence gaps need framework
- May require model-specific tuning

**Validation needed before implementation**:
- Do agent self-assessments correlate with extracted signals?
- Does participatory extraction improve or distort accuracy?

---

### Stage 3.3: Strong Emergence Validation (Future)

**Purpose**: Test the claim that extracted identity produces qualitatively different behavior

**Research question** (from Part 5):
> If NEON-SOUL can demonstrate that an agent's identity, once extracted and fed back, produces behavioral patterns that are qualitatively different from what the agent would produce without that identity — patterns that can't be predicted from the behavioral inputs alone — that would be evidence for something approaching strong emergence.

**Validation approach**:
1. Extract SOUL.md from agent A
2. Inject into agent B (same base model, no history)
3. Compare B's behavior to A's subsequent behavior
4. If highly correlated → weak emergence (SOUL.md is descriptive)
5. If divergent in predictable ways → strong emergence (SOUL.md is generative)

**Why deferred**:
- Requires controlled experimental setup
- May need academic collaboration
- Results could challenge or validate core positioning

---

## Verification

### Phase 1 Verification

```bash
# Verify document updates
grep -n "Implementation Status" docs/research/emergence-research-neon-soul.md
grep -n "Phase 3" docs/research/emergence-research-neon-soul.md

# Verify context diversity module exists
test -f src/lib/context-diversity.ts && echo "Context diversity module exists"

# Verify cross-reference in PBD plan
grep -n "emergence-research" docs/plans/2026-02-10-pbd-alignment.md
```

### Phase 2 Verification

```bash
# Run synthesis with diversity assessment
npm run synthesize -- --dry-run --verbose

# Check for:
# - Context diversity score in output
# - Cross-context axiom labels
# - Self-awareness prompt generation (if reflexive cycling enabled)
```

---

## Risk Assessment

| Risk | Phase | Mitigation |
|------|-------|------------|
| Context diversity classification inaccurate | 1 | LLM classification with confidence threshold; manual override |
| Reflexive cycling creates feedback loops | 2 | Rate-limit self-awareness prompts; monitor for drift |
| Edge-of-chaos too restrictive | 2 | Configurable thresholds; warn but don't block |
| Phase 3 scope creep | 3 | Strict validation gates before implementation |
| Strong emergence claim unverifiable | 3 | Frame as research question, not product claim |

---

## Dependencies

- Phase 1: None (can start immediately)
- Phase 2: PBD alignment plan (especially Stage 13)
- Phase 3: Phase 2 validation results

---

## Estimated Scope

| Stage | Complexity | New Code | Modified Code |
|-------|------------|----------|---------------|
| 1.1: Doc updates | Low | ~50 lines | ~20 lines |
| 1.2: Context diversity | Medium | ~120 lines | ~10 lines |
| 1.3: Cross-reference | Low | 0 | ~10 lines |
| 2.1: Reflexive cycling | High | ~200 lines | ~50 lines |
| 2.2: Diversity requirements | Medium | ~80 lines | ~40 lines |
| 2.3: Documentation update | Low | 0 | ~60 lines |
| 3.x: Future phases | TBD | TBD | TBD |

**Phase 1 Total**: ~170 new lines, ~40 modified lines
**Phase 2 Total**: ~280 new lines, ~150 modified lines

---

## Cross-References

**Research**:
- `docs/research/emergence-research-neon-soul.md` - Theoretical foundation

**Workflows**:
- `docs/workflows/documentation-update.md` - Documentation update workflow (Stage 2.3)

**Related Plans**:
- `docs/plans/2026-02-10-pbd-alignment.md` - Observation quality (prerequisite)
- `docs/plans/2026-02-10-essence-extraction.md` - Essence generation

**Conceptual Sources**:
- Kauffman (1995) - Edge of chaos, autocatalytic sets
- Takata et al. (2024) - LLM personality emergence through interaction
- Grassé (1959), Heylighen (2016) - Stigmergy as coordination mechanism
- Campbell (1974) - Downward causation in hierarchical systems
