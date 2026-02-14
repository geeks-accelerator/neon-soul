# PBD Alignment Plan Review - Codex

**Date**: 2026-02-10
**Reviewer**: codex-gpt51-examiner (gpt-5.1-codex-max)
**Files Reviewed**:
- `docs/plans/2026-02-10-pbd-alignment.md`
- `src/types/signal.ts`
- `src/types/axiom.ts`
- `src/types/principle.ts`
- `src/types/provenance.ts`
- `src/lib/semantic-classifier.ts`
- `src/lib/signal-extractor.ts`
- `src/lib/principle-store.ts`
- `src/lib/compressor.ts`
- `src/lib/reflection-loop.ts`

## Summary

The PBD alignment plan proposes 17 stages to align neon-soul with Principle-Based Distillation methodology. The external Codex review identified **3 critical**, **5 important**, and **1 minor** issues primarily related to type conflicts, missing data persistence, and security concerns.

## Findings

### Critical

1. **`src/types/signal.ts:32-58` + `docs/plans/2026-02-10-pbd-alignment.md:786-833,1296-1316`: SignalSourceType name collision**

   The plan reuses `SignalSourceType` for a different concept. Current code defines it as `'memory' | 'interview' | 'template'` with `source` being a structured object (`SignalSource`). Stage 12/16 proposes `'agent-initiated' | 'user-elicited' | 'context-dependent' | 'consistent-across-context'` and indexes `SOURCE_WEIGHT[signal.source]`.

   **Impact**: TypeScript error or `SOURCE_WEIGHT['[object Object]'] = undefined` yielding NaN in weight computation.

   **Fix**: Keep existing `source` object for file provenance. Add a new field (e.g., `elicitationMode` or `signalOrigin`) for agent/user classification. Update `computeSignalWeight()` to reference the new field.

2. **`docs/plans/2026-02-10-pbd-alignment.md:1154-1199` + `src/types/principle.ts:8-18`: canPromote() accesses non-existent properties**

   The `canPromote()` function iterates `principles.flatMap(p => p.signals)` checking `s.provenance` and `s.stance`. However, `Principle` interface only exposes `derived_from.signals` with shape `{id, similarity, source, original_text}` - no `signals` property at top level, and `stance`/`provenance` are not persisted.

   **Impact**: Won't compile, or will always see empty metadata causing all axioms to fail promotion.

   **Fix**: Either pass `Signal[]` directly to `canPromote()`, or extend `PrincipleProvenance.signals` to persist `stance?` and `provenance?` fields, then access via `p.derived_from.signals`.

3. **`docs/plans/2026-02-10-pbd-alignment.md:1296-1316` + `src/types/signal.ts:49-58`: Signal interface missing required fields**

   Stage 16 weighting assumes `Signal.importance`, `Signal.provenance`, and a string `signal.source`, but current `Signal` interface lacks `importance` and `provenance` fields, and `source` is an object.

   **Impact**: Property access errors at compile time, NaN values at runtime.

   **Fix**: Add optional fields to `Signal` interface in Stage 1: `stance?: SignalStance`, `importance?: SignalImportance`, `provenance?: ArtifactProvenance`, `elicitationMode?: SignalElicitationMode`. Then use explicit field access with defaults.

### Important

4. **`docs/plans/2026-02-10-pbd-alignment.md:168-192,226-248`: Missing sanitization in new classifiers**

   Proposed `classifyStance()` and `classifyImportance()` functions interpolate raw user text directly into prompts without sanitization. Existing classifiers in `src/lib/semantic-classifier.ts:29-119` wrap content in XML delimiters and sanitize with `sanitizeForPrompt()`.

   **Impact**: Prompt injection vulnerability and inconsistent error handling (no `requireLLM` check).

   **Fix**: Reuse `sanitizeForPrompt()` pattern and self-healing retry loop from existing classifiers. Add `requireLLM(llm, 'classifyStance')` at function start.

5. **`docs/plans/2026-02-10-pbd-alignment.md:311-360`: Unbounded O(n^2) tension detection**

   `detectTensions()` issues an unbounded `generate` call for every axiom pair with no concurrency cap or content sanitization.

   **Impact**: LLM quota exhaustion with moderate axiom sets (25 axioms = 300 pairs), potential prompt injection from axiom text.

   **Fix**: Cap pair count (e.g., top-N by strength first), add concurrency limits using existing `BATCH_SIZE` pattern from `signal-extractor.ts`, switch to `classify()` with sanitized inputs.

6. **`docs/plans/2026-02-10-pbd-alignment.md:364-371`: Tension severity/description dropped**

   The plan defines `ValueTension` with `description` and `severity` fields, but Axiom extension only stores `tensions?: string[]` (IDs only).

   **Impact**: Cannot report why tensions exist or their severity in SOUL.md output.

   **Fix**: Store structured tension objects on axioms: `tensions?: Array<{axiomId: string; description: string; severity: 'high' | 'medium' | 'low'}>`, or store separately with full `ValueTension[]` and render in synthesis output.

7. **`docs/plans/2026-02-10-pbd-alignment.md:970-1005` + `src/types/provenance.ts:1-22`: File overwrite conflict**

   Stage 14 says "Files to create: `src/types/provenance.ts`" with `ArtifactProvenance` type, but this file already exists with `ProvenanceChain` type that is imported elsewhere.

   **Impact**: Overwriting breaks existing provenance chain functionality.

   **Fix**: Extend existing file by adding `ArtifactProvenance` type to it. Define explicit `Artifact` interface (currently undefined in plan's `classifyProvenance` signature). Adjust imports in existing consumers.

8. **`docs/plans/2026-02-10-pbd-alignment.md:846-954` + `src/lib/reflection-loop.ts:1-118`: Cycle management lacks persistence story**

   `decideCycleMode()` assumes a persisted `Soul` type with cached embeddings and a `detectContradictions()` helper. Current pipeline is stateless single-pass - no prior soul loading, no embedding storage.

   **Impact**: Cannot implement incremental synthesis or contradiction detection without persistence layer.

   **Fix**: Define `Soul` interface with `{axioms: Axiom[], principles: Principle[], embeddings: number[][]}`. Specify storage location (`.soul-state.json` mentioned but not defined). Add `loadSoul()` and `saveSoul()` functions. Outline embedding comparison strategy.

### Minor

9. **`docs/plans/2026-02-10-pbd-alignment.md:394-422` + `src/lib/principle-store.ts:118-210`: Orphan tracking underspecified**

   Plan says track signals with `bestSimilarity < threshold` as orphaned, but `PrincipleStore` discards similarity scores after matching - only stores per-principle, not per-signal.

   **Impact**: Cannot compute orphan rate accurately post-hoc.

   **Fix**: Persist `bestSimilarity` score per signal in `addGeneralizedSignal()` return value. Or mark principles with `n_count === 1` after full ingest as potential orphan sources and expose their signal IDs via `getOrphanedSignals()`.

## Architectural Observations

### Approach Validation

The overall PBD alignment approach is sound - adding signal metadata for stance, importance, and provenance addresses real gaps in identity synthesis fidelity. The anti-echo-chamber rule is well-motivated and the external/questioning requirement is appropriately strict.

However, the plan shows classic "plan code" anti-patterns:
- Code examples don't match actual type signatures
- New types conflict with existing types
- Dependencies between stages not fully traced through type system

### Recommendations

1. **Before implementation**: Resolve all Critical findings (1-3) by updating Signal and Principle types first
2. **Stage ordering**: Complete Stage 1 type extensions before Stages 2-3 classifiers
3. **Testing**: Add type-level tests to catch interface mismatches early
4. **Security**: Apply consistent sanitization pattern across all new LLM calls

## Raw Output

<details>
<summary>Full CLI output</summary>

```
OpenAI Codex v0.63.0 (research preview)
--------
workdir: /Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul
model: gpt-5.1-codex-max
provider: openai
approval: never
sandbox: read-only
reasoning effort: xhigh
reasoning summaries: auto
--------

**Findings**
- [critical] `src/types/signal.ts:32-58` already defines `SignalSourceType` as `'memory' | 'interview' | 'template'` and `source` is a structured object. Stage 12/16 in `docs/plans/2026-02-10-pbd-alignment.md:786-833`/`1296-1316` reuses the same name for `'agent-initiated' | 'user-elicited' | ...` and indexes `SOURCE_WEIGHT[signal.source]`. That would either fail TypeScript or yield `SOURCE_WEIGHT['[object Object]'] = undefined -> NaN`. Fix: keep the existing `source` object for file provenance, add a new field (e.g., `elicitationSource` or `sourceClass`) for the agent/user classification, and compute weights from that; update principle provenance to carry it.

- [critical] Stage 15 `canPromote` (docs lines 1154-1199) iterates `principles.flatMap(p => p.signals)` and checks `s.provenance`/`s.stance`, but `Principle` only exposes `derived_from.signals` with `{id, similarity, source, original_text}` (`src/types/principle.ts:8-18`) and currently drops stance/provenance. As written it won't compile or will always see empty metadata. Fix: either pass `Signal[]` directly or extend `PrincipleProvenance.signals` to persist stance/provenance and change code to `p.derived_from.signals`.

- [critical] Stage 16 weighting (docs lines 1296-1316) assumes `Signal.importance`, `Signal.provenance`, and a string `signal.source`, but current `Signal` lacks those fields (`src/types/signal.ts:49-58`) and `source` is an object. Implementing verbatim gives property-access errors or NaNs. Fix: add the new fields to `Signal`, store them in principle provenance, and dereference `sourceClass` (or `source.type` if mapped) explicitly with safe defaults.

- [important] New stance/importance classifiers (docs lines 168-192, 226-248) interpolate raw user text and skip `requireLLM`/sanitization. Existing classifiers wrap content in XML and sanitize (`src/lib/semantic-classifier.ts:29-119`). Copying the planned code would reintroduce prompt-injection and inconsistent error handling. Fix: reuse `sanitizeForPrompt`/retry pattern and call `requireLLM` in the new classifiers.

- [important] Planned `detectTensions` (docs lines 311-360) issues an unbounded `generate` call for every axiom pair (O(n^2)) with no concurrency cap or content sanitization. A moderate axiom set will exhaust LLM quotas or stall the run, and the raw text invites prompt injection. Fix: cap pair count (e.g., top-N by strength), add concurrency limits/caching, and switch to a constrained classify prompt with sanitized inputs.

- [important] Tension data is dropped: the plan's `ValueTension` carries description/severity, but the Axiom extension is only `tensions?: string[]` (`docs/plans/2026-02-10-pbd-alignment.md:364-371`), so severity/reason can't be reported. Fix: store structured tension objects (ids + description + severity) on axioms or alongside them and render those in outputs.

- [important] Stage 14 plans to "create" `src/types/provenance.ts` with `ArtifactProvenance` (docs lines 970-1005), but that file already exists and is imported elsewhere (`src/types/provenance.ts:1-22`). Overwriting it will break the provenance chain types, and `classifyProvenance` references an undefined `Artifact` shape. Fix: extend the existing file instead of replacing it, define an explicit artifact/memory type (including optional metadata), and adjust imports accordingly.

- [important] Cycle management design (docs lines 846-954) assumes a persisted `Soul` with embeddings and a `detectContradictions` helper, but the current pipeline is stateless single-pass (`src/lib/reflection-loop.ts:20-118`) and doesn't load prior axioms/principles. Without a storage/IO plan and cached embeddings, `decideCycleMode` can't be evaluated. Fix: specify where prior souls are read/written, define `Soul` shape, and outline how to compare new principles to cached embeddings efficiently.

- [minor] Orphan-tracking plan (docs lines 394-422) lacks an implementable rule; `PrincipleStore` discards similarity scores once matched (`src/lib/principle-store.ts:118-210`), so there's no way to compute orphan rate post hoc. Fix: persist best similarity per signal, or mark principles left at `n_count === 1` after full ingest and expose those signal IDs via `getOrphanedSignals`.

tokens used: 214,910
```

</details>
