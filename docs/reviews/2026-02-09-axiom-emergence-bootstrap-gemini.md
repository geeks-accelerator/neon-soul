# Axiom Emergence Bootstrap Plan Review - Gemini

**Date**: 2026-02-09
**Reviewer**: gemini-2.5-pro (via Gemini CLI)
**Files Reviewed**:
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/docs/plans/2026-02-09-axiom-emergence-bootstrap.md`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/lib/reflection-loop.ts`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/lib/compressor.ts`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/lib/pipeline.ts`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/docs/guides/greenfield-guide.md`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/docs/issues/greenfield-bootstrap-mode-enforcement.md`

## Summary

The plan addresses a real bug (0 axioms generated) with a pragmatic workaround. However, two critical architectural questions emerge: (1) the fix only works for bootstrap mode, leaving learn/enforce modes broken, and (2) the plan works around the N-count reset problem rather than solving it, potentially invalidating the purpose of N-count thresholds entirely. The Learn phase is underspecified, lacking concrete mechanisms for threshold discovery.

## Findings

### Critical

**1. The Fix is Incomplete for Other Modes**
- **Reference**: Architectural Approach / Stage 2
- **Category**: Architecture / Logic
- **Issue**: The plan correctly identifies that re-clustering resets N-counts, preventing them from reaching the `N>=3` threshold. The proposed solution is to lower the threshold to `1` for **bootstrap mode only**. This does not solve the problem for `learn` or `enforce` modes. They will still use a higher threshold and, due to the re-clustering design, will likely continue to generate zero axioms.
- **Question**: How will axiom generation function in modes other than bootstrap? The plan should address this explicitly.

**2. Working Around the Root Cause**
- **Reference**: Root Cause Analysis (Plan lines 43-58) / `reflection-loop.ts:106-111`
- **Category**: Architecture
- **Issue**: The plan accepts that re-clustering prevents N-count accumulation and chooses to work around it by adjusting a threshold. This approach seems to invalidate the purpose of having an N-count threshold in the first place. If N-counts can never exceed 1-2 due to re-clustering, why have an N-threshold at all in the compressor?
- **Question**: Is this a deliberate long-term design or a temporary patch? The plan should clarify. A more robust solution might involve:
  - Persisting the `PrincipleStore` across iterations within a single run
  - Accumulating N-counts across iterations before final compression
  - Changing the compressor to use a different promotion criterion

### Important

**3. Underspecified Learn Phase**
- **Reference**: Plan "Learn Phase (Future Work)" section (lines 292-313)
- **Category**: Process / Documentation
- **Issue**: The plan states an objective to "Track N-count distribution for Learn phase" but does not specify:
  - How the histogram data will be stored persistently
  - What analysis will be performed on the data
  - How the threshold discovery formula will be validated
  - What tooling exists or needs to be created for Learn phase analysis
- **Suggested Fix**: Add a Learn Phase Tooling stage or defer with explicit ticket reference

**4. Arbitrary Abort Condition**
- **Reference**: Plan "Abort Conditions" (lines 69-71)
- **Category**: Logic
- **Issue**: The plan mentions an abort condition if more than 200 axioms are generated. This is a valuable safeguard when setting N-threshold to 1, but the number 200 seems arbitrary.
- **Question**: What is the rationale for 200? Should this be:
  - Proportional to input signal count (e.g., axioms > signals * 2)?
  - A configurable parameter?
  - Based on memory/performance constraints?

### Minor

**5. Expectation Setting for Bootstrap Output**
- **Reference**: Stage 2 / Acceptance Criteria
- **Category**: Documentation
- **Issue**: Promoting all principles in bootstrap mode (N=1) will create a large, unfiltered set of candidate axioms. The plan should explicitly state that this output is a "raw draft" expected to be refined heavily in Learn phase.
- **Suggested Fix**: Add note in Stage 2 or Success Criteria: "Bootstrap mode axioms are unfiltered candidates for learning, not production-ready output"

**6. Plan Structure Compliance**
- **Reference**: Frontmatter
- **Category**: Process
- **Positive**: The plan correctly adheres to `code_examples: forbidden` constraint. Structure (Problem, Root Cause, Solution, Stages) is clear and follows template.

## Alternative Framing

**Are we solving the right problem?**

The current approach treats the symptom (0 axioms) rather than the disease (N-counts never accumulate). Two alternative framings to consider:

1. **N-Count Accumulation Approach**: Instead of lowering threshold, modify the reflective loop to preserve N-counts across re-clustering iterations. This would make the N-threshold meaningful rather than a checkbox.

2. **Rethink the Compression Model**: If re-clustering is the correct design (cleaner clustering, as noted in CR-2), perhaps the compression model should use a different criterion than N-count for promotion:
   - Semantic coherence score
   - Cross-iteration stability (principles that re-emerge)
   - Dimension coverage requirements

The plan partially addresses this in "Alternative Approaches Considered" (Option A), but rejects accumulation as "significant refactor" without estimating the effort or comparing long-term maintenance costs.

## Implementation Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Learn mode still produces 0 axioms | High | Medium | Document as known limitation, plan follow-up |
| 46 axioms all low quality | Medium | High | Human review of first bootstrap outputs |
| N-count histogram never analyzed | Medium | Low | Create Learn phase analysis plan now |
| Abort condition too low/high | Low | Low | Make configurable |

## Recommendations

1. **Address the "Other Modes" Gap** (Critical): Add a section explaining what happens in learn/enforce modes, even if answer is "same as bootstrap for now, pending Learn phase analysis"

2. **Clarify Long-Term Architecture** (Critical): Is re-clustering + threshold=1 the intended design, or is this a stepping stone to N-count accumulation?

3. **Specify Learn Phase Mechanism** (Important): At minimum, document where histogram will be stored and what `scripts/analyze-*` will be created

4. **Add Rationale for 200 Limit** (Minor): Or make it a function of input size

---

## Raw Output

<details>
<summary>Full CLI output</summary>

Based on my review of the implementation plan, here are my findings.

### Plan Review Findings

#### 1. The Fix is Incomplete for Other Modes
- **Reference**: Architectural Approach
- **Category**: Architecture / Logic
- **Severity**: Critical
- **Finding**: The plan correctly identifies that re-clustering resets N-counts, preventing them from reaching the `N>=3` threshold. The proposed solution is to lower the threshold to `1` for **bootstrap mode only**. This doesn't solve the problem for `learn` or `enforce` modes. They will still use a higher threshold and, due to the re-clustering, will likely continue to generate zero axioms. The plan must address how axiom generation will function in modes other than bootstrap.

#### 2. Working Around the Root Cause
- **Reference**: Architectural Approach
- **Category**: Architecture
- **Severity**: Critical
- **Finding**: The plan accepts that re-clustering in the reflective loop prevents N-count accumulation and chooses to work around it by adjusting a threshold. Is this a deliberate long-term design? This approach seems to invalidate the purpose of having an N-count threshold in the first place. A more robust solution might involve persisting the `PrincipleStore` across iterations *within* a single run, allowing counts to accumulate naturally. The plan should clarify if this is a temporary patch or the intended final design.

#### 3. Underspecified "Learn" Phase
- **Reference**: Proposed Solution
- **Category**: Process
- **Severity**: Important
- **Finding**: The plan states an objective to "Track N-count distribution for Learn phase" but doesn't specify *how*. The mechanism for logging, storing, and analyzing this data to discover an appropriate threshold is missing. This ambiguity introduces risk and leaves a key part of the system's tuning capability undefined.

#### 4. Arbitrary Abort Condition
- **Reference**: Implementation Details (Implicit)
- **Category**: Logic
- **Severity**: Important
- **Finding**: The plan mentions an abort condition if more than 200 axioms are generated. This is a valuable safeguard, especially when setting the N-threshold to 1. However, the number 200 seems arbitrary. The plan should include a rationale for this specific limit and clarify whether it should be a configurable parameter.

#### 5. Consequence of Promoting All Principles
- **Reference**: Proposed Solution (Bootstrap Mode)
- **Category**: Logic / Documentation
- **Severity**: Minor
- **Finding**: Promoting all principles in bootstrap mode (`N=1`) is a valid strategy to unblock the system. However, the plan should explicitly state that this will create a large, unfiltered set of candidate axioms. Managing expectations is key; the output of this mode should be considered a "raw draft" that is expected to be refined heavily in the subsequent `learn` phase.

#### 6. Plan Structure and Rules
- **Reference**: Plan Frontmatter
- **Category**: Documentation / Process
- **Severity**: Positive
- **Finding**: The plan's structure (Problem, Root Cause, Solution) is clear and easy to follow. It also correctly adheres to the `code_examples: forbidden` constraint in its frontmatter.

</details>

---

*Review generated 2026-02-09 via gemini-2.5-pro CLI*
