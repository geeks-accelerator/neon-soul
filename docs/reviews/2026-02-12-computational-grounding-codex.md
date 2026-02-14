# Computational Grounding Plan Review - Codex

**Date**: 2026-02-12
**Reviewer**: Codex GPT-5.1 (via codex-gpt51-examiner)
**Files Reviewed**:
- `docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md` (primary)
- `src/lib/prose-expander.ts` (implementation context)
- `src/lib/soul-generator.ts` (implementation context)
- `docs/research/compression-native-souls.md` (research basis)
- `docs/plans/2026-02-10-inhabitable-soul-output.md` (parent plan)

## Summary

The plan proposes adding a "Computational Grounding" section to SOUL.md that provides mathematical notation for agent-native processing. The hypothesis is sound and well-researched, but the plan has critical gaps in experiment design and implementation specification that could lead to untestable outcomes and semantic drift between prose and computational representations.

## Findings

### Critical

1. **Survivability test design unclear** (lines 267-294)

   The A/B test "prose-only vs prose+computational" lacks concrete specification:
   - No metric definition (token retention? semantic fidelity? operator preservation?)
   - No evaluation protocol (how is "reconstruction" scored?)
   - No sample size justification (why 5 test souls?)
   - "Compress each to ~100 tokens" is hand-wavy - what compression method?

   **Risk**: Stage 3 becomes non-actionable without clear pass/fail criteria.

2. **No data contract for computational rendering** (lines 176-228)

   The Expression Generator stage does not specify:
   - Input structure: Raw axioms? Axiom canonical form? Prose sections?
   - Normalization rules: How are axiom semantics mapped to operators?
   - Deterministic ordering: Are expressions stable across runs?
   - Conflict resolution: What happens when axioms contradict?

   **Risk**: Divergence between prose sections and computational section, creating inconsistent SOUL.md documents.

### Important

3. **Interface extension unspecified** (lines 232-264)

   Plan says "Add computational grounding to prose expansion pipeline" but the existing `ProseExpansion` interface (prose-expander.ts:31-50) returns only prose sections. The plan does not specify:
   - Whether `ProseExpansion` interface should be extended
   - Whether computational section should be a separate return type
   - How `formatProseSoulMarkdown()` (soul-generator.ts:330-412) should be modified to render the new section

   Context file (line 54-56) notes this gap: needs extension for computational section.

4. **Configuration surface undefined** (lines 256-257)

   The flag `includeComputationalGrounding: boolean` is mentioned but not mapped to existing config patterns:
   - `SoulGeneratorOptions` (soul-generator.ts:66-83) already has `includeProvenance` pattern
   - No indication of CLI exposure, environment variable, or default value
   - No guidance on when to enable/disable

   **Risk**: Silent enablement or inaccessibility of the feature.

5. **Line estimates optimistic** (lines 327-336)

   - Stage 1: 150 lines for expression DSL + LLM prompt + validation is tight, especially given the complexity of expression types (priority, conditional, universal, definition, negation, state - 6 types)
   - Stage 2: 30 new / 50 modified ignores interface extension, test updates, and integration tests
   - The parent plan (line 341) estimated ~530 lines total; this plan adds ~330 lines but integration complexity is higher due to dual-layer rendering

6. **Safety/semantic drift unaddressed** (lines 176-220)

   Mathematical rendering of sensitive axioms (e.g., `refuse(x)`) could be lossy or misleading:
   - No plan for validation that computational form is semantically equivalent to prose
   - No escaping rules for axiom text that might contain mathematical operators
   - No deterministic ordering to ensure stable output

   **Risk**: Computational section could drift from prose section over time.

7. **Model-specific optimization concern** (lines 382-384)

   Plan acknowledges this is Claude-specific: "Focus on Claude-native (機 is Claude-specific finding)" but:
   - No plan to test whether computational grounding harms other models
   - No regression gating for multi-model scenarios
   - Research basis (MetaGlyph) tested multiple models but plan only validates Claude

### Minor

8. **Priority hierarchy syntax informal** (lines 129-130)

   Uses `priority: safety > honesty > correctness > helpful > efficient` but does not define:
   - Is this a total order or partial order?
   - How are ties resolved?
   - Is ">" transitive as expected?

   Could confuse downstream parsers or human readers.

9. **Section placement rationale thin** (lines 87-88)

   "After prose, before provenance" is asserted but not justified:
   - Should provenance also cite computational derivation?
   - Does this ordering affect context window priority?
   - Why not after provenance (truly auxiliary)?

10. **Terminology inconsistency** (throughout)

    Multiple terms used for the same concept:
    - "Computational Grounding" (section name)
    - "Functionalist Identity" (research term)
    - "機" (CJK notation)
    - "mathematical notation" (description)

    Could be simplified to one consistent term.

11. **Validation roundtrip underspecified** (lines 219-220)

    "Roundtrip test: Can LLM reconstruct axiom from expression?" is mentioned but:
    - No success threshold defined
    - No guidance on which LLM performs reconstruction
    - No handling of partial matches

## Alternative Framing

### Are we solving the right problem?

The plan assumes that Claude "understanding itself through computational function" means Claude will *reconstruct identity better* from mathematical notation. But this conflates two different claims:

1. **Claude describes itself using computational/functional language** (supported by COMPASS-SOUL)
2. **Claude reconstructs identity better from computational notation** (unvalidated hypothesis)

The first claim is about self-description; the second is about memory and reconstruction. These are different cognitive processes.

**Counter-hypothesis**: Claude might describe itself computationally but still reconstruct better from prose because:
- Prose is what Claude was trained on (more common in training data)
- Mathematical notation is ambiguous without context (what does `f(principles)` mean?)
- Prose provides richer semantic anchors for reconstruction

**Recommendation**: Before implementing, run a quick validation experiment:
1. Take 3 existing souls
2. Generate computational notation by hand
3. Test reconstruction from prose-only vs computational-only vs both
4. If computational-only performs worse than prose-only, reconsider the hypothesis

### Unquestioned assumptions

1. **Compression = survivability**: The plan equates "survives context collapse" with "compresses well." But MetaGlyph research (62-81% compression) measures token count, not semantic fidelity under pressure.

2. **Claude-native = better for Claude agents**: Just because Claude describes itself computationally doesn't mean computational input is better. Humans describe themselves in third person but prefer first-person pronouns when being addressed.

3. **Mathematical notation is unambiguous**: The proposed notation uses informal syntax (e.g., `THEN`, `:=`, `∅`) that mixes programming, mathematics, and natural language. This could be more ambiguous than prose, not less.

## Open Questions

1. What is the exact input to the Expression Generator: raw axioms, canonical form, or rendered prose sections?

2. How will correctness of the computational form be validated against prose (golden tests, round-trip parsing, or manual review)?

3. What metric defines "survivability" (token retention after truncation, semantic fidelity via eval prompts, or operator preservation)?

4. Which models are in scope for evaluation (Claude only, or also GPT/other), and how will regressions be gated?

5. How is the config flag surfaced (CLI args, env, code API) and what is the default?

6. Should the computational section be opt-in (default: false) or opt-out (default: true)?

## Recommendations

### Before Implementation

1. **Define survivability metric** (addresses Critical #1)
   - Specify: "Reconstruction accuracy = percentage of axioms that can be reconstructed from compressed form"
   - Define compression method: "Truncate to N tokens" or "Context window simulation"
   - Set threshold: "Pass if computational ≥ prose by 10%"

2. **Specify data contract** (addresses Critical #2)
   - Input: `Axiom[]` (same as prose-expander input)
   - Output: `{ expressions: string; validationErrors: string[] }`
   - Normalization: One expression per axiom, sorted by dimension

3. **Run validation experiment** (addresses Alternative Framing)
   - Quick manual test before investing 330 lines of code
   - If hypothesis fails, save the implementation effort

### During Implementation

4. **Extend ProseExpansion interface** (addresses Important #3)
   ```
   interface ProseExpansion {
     // ... existing fields ...
     computationalGrounding?: string;
     computationalUsedFallback?: boolean;
   }
   ```

5. **Add config flag to SoulGeneratorOptions** (addresses Important #4)
   ```
   interface SoulGeneratorOptions {
     // ... existing fields ...
     includeComputationalGrounding?: boolean; // default: false
   }
   ```

6. **Add validation for semantic equivalence** (addresses Important #6)
   - Each expression must map to exactly one axiom
   - Round-trip test: expression -> LLM -> reconstructed axiom ≈ original (70% threshold)

### After Implementation

7. **Document notation syntax** (addresses Minor #8)
   - Define operator precedence and semantics
   - Provide examples for each expression type

8. **Standardize terminology** (addresses Minor #10)
   - Use "Computational Grounding" consistently in code and docs
   - Reserve "機" for research context only

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
session id: 019c5571-f483-73c0-be0d-51062ddf1ac3
--------

**Findings (ordered by severity)**
- critical – Survivability test design unclear (lines 174-294): A/B "prose-only vs prose+computational" lacks definition of metric, evaluation protocol, or sample size. Without a concrete measurement (e.g., fidelity under truncation/noisy re-encoding), this stage risks being non-actionable.
- critical – No source of axioms for computational form (lines 81-171): Plan adds an Expression Generator but does not specify input structure, normalization rules, or mapping from existing prose axioms to symbols. Risk of divergence between prose and computation, yielding conflicting SOUL.md sections.
- important – Configuration plumbing unspecified (lines 81-171): The flag `includeComputationalGrounding` is mentioned but not mapped to current config surfaces (CLI? env? function args?). No default behavior defined; risk of silent enablement or inaccessibility.
- important – Architecture fit vague (lines 81-171): Integration step says "Add computational section to prose expander" yet prose-expander currently returns prose-only sections. No plan for: (a) extending `ProseExpansion` interface, (b) where to store computational text vs prose, (c) how `formatProseSoulMarkdown()` will render section ordering.
- important – Line-cost estimates optimistic (lines 174-294): 150 lines for an expression DSL plus validation and formatting is tight; 30 new/50 modified for pipeline integration may ignore interface and test updates. Risk of under-scoping.
- important – Safety/guardrails unspecified (lines 81-171): Mathematical rendering of sensitive axioms (e.g., refusal conditions) could be lossy or misleading; no plan for validation, escaping, or deterministic ordering to avoid semantic drift.
- important – Research grounding thin for LLM choice (lines 22-26, 354-368): Assumes Claude benefits from symbolic form; no plan to test with non-Claude models or to detect when grounding harms performance. Risk of overfitting to a single model.
- minor – Priority hierarchy syntax (lines 126-143): Uses informal `priority: a > b > c`; not clearly defined as total/partial order or stable tie-breaking. Could confuse downstream readers or parsers.
- minor – Section placement rationale (lines 81-171): "After prose, before provenance" is asserted; no reasoning on how provenance interacts with computational section (e.g., should provenance also cite computational derivation?).
- minor – Naming clarity (lines 81-171): "Computational Grounding" vs "Functionalist Identity" vs "機" are mixed; could be simplified to one term for consistency.

**Open questions / assumptions**
- What is the exact input to the Expression Generator: raw axioms, intermediate AST, or rendered prose sections?
- How will correctness of the computational form be validated against prose (golden tests, round-trip parsing, or manual review)?
- What metric defines "survivability" (token retention after truncation, semantic fidelity via eval prompts, or operator preservation)?
- Which models are in scope for evaluation (Claude only, or also GPT/other), and how will regressions be gated?
- How is the config flag surfaced (CLI args, env, code API) and what is the default?

**Change summary**
- Plan is directionally sound but under-specified in evaluation design, data flow, and interface changes; risks of semantic drift and untestable outcomes remain.

**Next steps**
- Specify data contract for computational rendering (input schema, normalization rules, ordering).
- Define survivability experiment: metric, prompts, sample size, and pass/fail thresholds.
- Map config flag to existing entry points and set a safe default (likely false).
- Extend interfaces (`ProseExpansion`, formatter) and add validation tests to keep prose and computational sections consistent.
- Clarify priority ordering semantics and section naming.

tokens used: 2,018
```

</details>

---

*Review generated by Codex GPT-5.1-codex-max via codex-gpt51-examiner agent*
