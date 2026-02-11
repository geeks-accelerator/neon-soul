# Plan: LLM Meta-Axiom Synthesis

**Created**: 2026-02-10
**Status**: Ready
**Priority**: Medium
**Type**: Feature
**Depends On**: `docs/plans/2026-02-10-pbd-alignment.md` (axiom metadata required)
**Related Issue**: `docs/issues/2026-02-10-axiom-count-exceeds-cognitive-limit.md`

---

## Summary

Implement hierarchical compression: use LLM to synthesize axioms into meta-axioms, reducing cognitive load from 79 axioms to ~10-15 core principles.

```
Current:  Signals → Principles → Axioms (79)
Proposed: Signals → Principles → Axioms → Meta-Axioms (~10-15)
```

**Feature Flag**: Enabled by default, disable via `NEON_SOUL_SKIP_META_SYNTHESIS=true`

---

## Motivation

- Current synthesis produced 79 axioms, exceeding 30-axiom cognitive load limit
- Threshold tuning alone may not sufficiently reduce count
- LLM can semantically group and synthesize similar axioms
- Maintains full provenance trail (meta-axiom → axioms → principles → signals)

---

## Design

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────────┐
│   Signals   │ ──► │ Principles  │ ──► │   Axioms    │ ──► │ Meta-Axioms   │
│   (1353)    │     │    (557)    │     │    (79)     │     │   (~10-15)    │
└─────────────┘     └─────────────┘     └─────────────┘     └───────────────┘
     N:1                 N:1                 N:1
   embedding          N-threshold         LLM synthesis
   clustering           (N>=3)           by dimension
```

### New Types

```typescript
// types/meta-axiom.ts
interface MetaAxiom {
  id: string;                    // meta_<uuid>
  dimension: SoulCraftDimension;
  text: string;                  // Synthesized principle
  canonical: CanonicalForm;      // native + notated forms
  axiom_ids: string[];           // Source axioms
  axiom_count: number;           // How many axioms synthesized
  provenance: {
    synthesized_at: string;
    prompt_hash: string;         // For reproducibility
  };
}
```

### Algorithm

1. **Group axioms by dimension** (7 groups)
2. **For each dimension with >3 axioms**:
   - Build synthesis prompt with axiom list
   - Ask LLM to synthesize into 2-3 core principles
   - Parse response into meta-axioms
3. **Dimensions with ≤3 axioms**: Pass through as-is (already concise)
4. **Generate notated forms** for each meta-axiom
5. **Build provenance** linking meta-axioms to source axioms

### Synthesis Prompt

```
You are synthesizing identity axioms into core principles.

These ${count} axioms are about "${dimension}":

${axioms.map(a => `- ${a.canonical.native}`).join('\n')}

Synthesize them into ${targetCount} core principles that:
1. Capture the essential meaning across all axioms
2. Are expressed as single, clear sentences
3. Preserve the most important distinctions

Respond with exactly ${targetCount} principles, one per line.
Do not number them or add any other text.
```

### Feature Flag

```typescript
// lib/config.ts or inline
const ENABLE_META_SYNTHESIS = process.env.NEON_SOUL_SKIP_META_SYNTHESIS !== 'true';
```

**Default**: Enabled (meta-synthesis runs)
**Disable**: `NEON_SOUL_SKIP_META_SYNTHESIS=true`

---

## PBD Metadata Aggregation

Meta-axioms inherit metadata from source axioms (requires PBD alignment plan completion):

| Source Metadata | Aggregation Rule |
|-----------------|------------------|
| Importance | Majority vote, weighted by N-count |
| Centrality | Highest centrality among sources |
| Tensions | Collect all inter-axiom tensions as "internal tensions" |
| Provenance | Count distinct provenance types |

**Extended MetaAxiom interface**:

```typescript
interface MetaAxiom {
  // ... base fields from Design section ...

  /** Aggregated importance (weighted by source axiom importance) */
  importance: SignalImportance;

  /** Centrality derived from source axioms */
  centrality: 'foundational' | 'core' | 'supporting';

  /** Internal tensions within this meta-axiom's source axioms */
  internalTensions?: string[];

  /** Provenance diversity of source axioms */
  provenanceDiversity: number;
}
```

**Synthesis prompt enhancement**:
- Weight foundational/core axioms higher in synthesis
- Note tensions between axioms in the group
- Flag low provenance diversity (< 2 types) in output

---

## Implementation Stages

### Stage 1: Types and Infrastructure

**Files**: `src/types/meta-axiom.ts`

- [ ] Define `MetaAxiom` interface
- [ ] Define `MetaSynthesisResult` interface
- [ ] Export from types index

**Estimated scope**: ~30 lines

### Stage 2: Meta-Synthesizer Module

**Files**: `src/lib/meta-synthesizer.ts`

- [ ] `groupAxiomsByDimension(axioms: Axiom[]): Map<SoulCraftDimension, Axiom[]>`
- [ ] `buildSynthesisPrompt(dimension, axioms, targetCount): string`
- [ ] `parseMetaAxioms(llmResponse, dimension, sourceAxioms): MetaAxiom[]`
- [ ] `synthesizeMetaAxioms(llm, axioms, options): Promise<MetaSynthesisResult>`
  - Options: `targetTotal`, `minPerDimension`, `maxPerDimension`

**Estimated scope**: ~150 lines

### Stage 3: Pipeline Integration

**Files**: `src/lib/pipeline.ts`, `src/lib/reflection-loop.ts`

- [ ] Add `meta-synthesis` stage after `reflective-synthesis`
- [ ] Check feature flag before running
- [ ] Update `PipelineContext` with `metaAxioms?: MetaAxiom[]`
- [ ] Update metrics to include meta-axiom count

**Estimated scope**: ~50 lines

### Stage 4: SOUL.md Generation

**Files**: `src/lib/soul-generator.ts`

- [ ] Update `generateSoul()` to accept meta-axioms
- [ ] Render meta-axioms as primary output when present
- [ ] Include "Derived from X axioms" in provenance section
- [ ] Optionally include full axiom list in collapsed section

**Estimated scope**: ~40 lines

### Stage 5: Testing

**Files**: `src/lib/__tests__/meta-synthesizer.test.ts`

- [ ] Test grouping by dimension
- [ ] Test prompt building
- [ ] Test response parsing
- [ ] Test end-to-end with mock LLM
- [ ] Test feature flag disable

**Estimated scope**: ~100 lines

### Stage 6: Documentation Updates

**Purpose**: Update documentation for meta-axiom feature

**Workflow**: Follow `docs/workflows/documentation-update.md` for systematic updates.

**Scope Classification**: This is a **Module structure** + **Stage details** change affecting:
- `docs/ARCHITECTURE.md` - Add meta-axiom layer to data flow diagram
- `skill/SKILL.md` - Document `--skip-meta-synthesis` flag if exposed
- `docs/guides/getting-started-guide.md` - Update SOUL.md output examples
- `README.md` - Update if meta-axioms become primary user-facing output

**Tasks**:

1. **Update ARCHITECTURE.md**:
   - [ ] Add meta-axiom layer to pipeline diagram
   - [ ] Document meta-synthesizer module
   - [ ] Add MetaAxiom type to data model section

2. **Update user-facing documentation**:
   - [ ] Update SOUL.md examples to show meta-axiom format
   - [ ] Document environment variables in configuration guide
   - [ ] Add "Core Principles" section explanation

3. **Run workflow verification commands**:
   ```bash
   # From docs/workflows/documentation-update.md Step 8
   grep -r "meta-axiom\|MetaAxiom" docs/ README.md
   grep -E "NEON_SOUL_SKIP_META\|NEON_SOUL_META_" docs/
   ```

**Acceptance Criteria**:
- [ ] ARCHITECTURE.md reflects meta-axiom pipeline stage
- [ ] Environment variables documented
- [ ] SOUL.md output examples updated
- [ ] Workflow verification commands pass

**Commit**: `docs(neon-soul): document meta-axiom synthesis feature`

**Estimated scope**: ~30 minutes

---

## SOUL.md Output Format

### With Meta-Synthesis (default)

```markdown
# SOUL.md

*AI identity through grounded principles.*

Generated: 2026-02-10T12:00:00Z

---

## Core Principles

### Identity Core
- 🎯 自: Authentic self-expression over external validation
- 💎 誠: Honest inquiry over definitive answers

### Character Traits
- 🚀 明: Growth through reflection, not stagnation
...

---

## Provenance

| Level | Count |
|-------|-------|
| Meta-Axioms | 14 |
| Axioms | 79 |
| Principles | 557 |
| Signals | 1353 |

Use `/neon-soul audit <meta-axiom>` for full trace.
```

### Without Meta-Synthesis (flag disabled)

Same as current output with 79 axioms.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEON_SOUL_SKIP_META_SYNTHESIS` | `false` | Set to `true` to disable meta-synthesis |
| `NEON_SOUL_META_TARGET` | `15` | Target number of meta-axioms |
| `NEON_SOUL_META_MIN_PER_DIM` | `1` | Minimum meta-axioms per dimension |
| `NEON_SOUL_META_MAX_PER_DIM` | `4` | Maximum meta-axioms per dimension |

---

## Success Criteria

1. ✅ 79 axioms compress to ~10-15 meta-axioms
2. ✅ Provenance chain is maintained
3. ✅ Feature can be disabled via env var
4. ✅ SOUL.md is more cognitively manageable
5. ✅ No regression when feature is disabled

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| LLM produces poor synthesis | Self-healing retry with corrective feedback |
| Loss of important nuance | Keep full axiom list in provenance |
| Increased latency | Only 7 LLM calls (one per dimension) |
| Inconsistent output | Use structured prompt, parse strictly |
| PBD metadata missing | Graceful degradation: synthesize without metadata, add TODO |

---

## Verification

```bash
# Run meta-synthesis with dry-run
npm run synthesize -- --dry-run --verbose

# Verify meta-axiom count in target range (10-15)
grep -A5 "Meta-Axioms" output/SOUL.md

# Test feature flag disable
NEON_SOUL_SKIP_META_SYNTHESIS=true npm run synthesize -- --dry-run
# Should produce 79 axioms, no meta-axioms

# Run unit tests
npm test src/lib/__tests__/meta-synthesizer.test.ts

# Verify PBD metadata flows through (after PBD alignment)
grep "provenanceDiversity" output/SOUL.md
```

---

## Rollback Plan

If meta-synthesis produces poor results:

1. **Immediate**: Disable via `NEON_SOUL_SKIP_META_SYNTHESIS=true`
2. **Revert**: All changes are additive; revert commits in reverse order
3. **Fallback**: Original 79-axiom output remains available

---

## Dependencies

**Required before implementation**:
- `docs/plans/2026-02-10-pbd-alignment.md` - Axiom metadata (stance, importance, tensions, provenance)

**Code dependencies**:
- Existing `compressor.ts` axiom generation
- `ollama-provider.ts` with self-healing retry
- `soul-generator.ts` for output formatting

**Estimated Total Scope**: ~370 new lines (30 + 150 + 50 + 40 + 100) + documentation updates

---

## Cross-References

**Plans**:
- `docs/plans/2026-02-10-pbd-alignment.md` - Prerequisite: axiom metadata
- `docs/plans/2026-02-10-emergence-facilitation.md` - Related: context diversity
- `docs/plans/2026-02-10-clawhub-deployment.md` - Deployment (can proceed before this plan)

**Workflows**:
- `docs/workflows/documentation-update.md` - Systematic documentation update process (used in Stage 6)

**Issues**:
- `docs/issues/2026-02-10-axiom-count-exceeds-cognitive-limit.md` - Root issue
- `docs/issues/2026-02-10-llm-classification-failures.md` - LLM patterns

**Code**:
- `src/lib/compressor.ts` - Current axiom synthesis

---

## Approval

- [ ] Plan reviewed
- [ ] Ready to implement
