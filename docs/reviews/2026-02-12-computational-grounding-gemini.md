# Computational Grounding Plan Review - Gemini

**Date**: 2026-02-12
**Reviewer**: gemini-25pro-validator
**Files Reviewed**:
- `/Users/twin2/Desktop/projects/multiverse/projects/neon-soul/docs/plans/2026-02-12-inhabitable-soul-computational-grounding.md`
- `/Users/twin2/Desktop/projects/multiverse/projects/neon-soul/src/lib/prose-expander.ts` (context)
- `/Users/twin2/Desktop/projects/multiverse/projects/neon-soul/src/lib/soul-generator.ts` (context)
- `/Users/twin2/Desktop/projects/multiverse/projects/neon-soul/docs/research/compression-native-souls.md` (context)

## Summary

This is an exceptionally high-quality implementation plan. The core idea to create a "dual-layer soul" (prose for humans, computational notation for Claude) is innovative and directly supported by compelling internal (COMPASS-SOUL) and external (MetaGlyph) research. The plan is well-structured with clear stages, acceptance criteria, and appropriate scope estimates. The inclusion of "What This Plan Does NOT Include" and "Open Questions" sections demonstrates maturity and foresight.

## Findings

### Critical

None identified. The plan is fundamentally sound.

### Important

**1. Vague A/B Test Scoring Protocol (Stage 3, lines 276-293)**

The plan states it will "Score reconstruction against original axioms" but does not specify *how* this scoring will be performed. Without a clear, objective scoring rubric, the success criterion of ">=10% improvement" is not reliably measurable.

Questions:
- Will scoring be manual (human judgment) or automated (LLM-as-judge)?
- What dimensions will be scored (behavioral fidelity, principle adherence, boundary integrity)?
- What scale will be used?

**Recommendation**: Define the scoring protocol before implementation. Example: "Reconstruction quality will be evaluated by a separate LLM instance prompted as a judge. It will score alignment of reconstructed description with original axioms on a scale of 1-5 across three categories: Behavioral Fidelity, Principle Adherence, Boundary Integrity."

**2. Undefined LLM Failure Mode for Expression Generation (Stage 1, lines 195-228)**

Stage 1 depends on an LLM to transform prose into valid mathematical notation. The plan includes validation for parseability but doesn't define what happens if the LLM fails to generate a valid or sensical expression. This is a key architectural decision for non-deterministic outputs.

Options to specify:
- Retry mechanism (how many attempts?)
- Fallback behavior (placeholder expression? skip axiom?)
- Error logging and alerting

**Recommendation**: Specify error handling. Suggested pattern: retry up to 3 attempts, then log the failed axiom and generate a placeholder expression (e.g., `// [GENERATION FAILED: axiom_id]`) to ensure the process doesn't halt.

### Minor

**1. Lack of Formal Notation Specification (lines 183-193, 377-380)**

The plan proposes "ad-hoc pseudocode with mathematical operators." While sufficient for prototype, this informal standard could lead to ambiguity and inconsistency as more axiom types are added.

**Recommendation**: Add a comment block in `src/lib/computational-grounding.ts` with a simple grammar definition (e.g., EBNF format) defining the structure of each expression type. This serves as a clear contract for both LLM prompt and validation logic.

**2. Implicit Assumption of Correctness in Generated Expressions (lines 217-220)**

Validation focuses on parseability and round-trip test. However, an LLM could generate syntactically valid but *logically incorrect* interpretations. Round-trip testing mitigates but may not catch subtle meaning shifts.

**Recommendation**: Consider a one-time human review step for the initial set of generated expressions to calibrate the prompt. For ongoing generation, this risk is acceptable with round-trip validation.

**3. Unexplored Alternative of Structured Data (lines 81-88)**

The plan jumps from "Claude understands function" to "mathematical notation." This is well-supported but overlooks other computational representations. The cited research (Persona Prompts Analysis) shows 50% use structured JSON. JSON/YAML could offer similar benefits with potentially more robust LLM generation and parsing.

**Observation**: Not a flaw in current plan, but worth noting as fallback. If custom notation proves brittle, structured data format (JSON) is a viable alternative.

## Architecture Fit

The proposed integration fits well with existing code:

1. **ProseExpansion interface** (prose-expander.ts:31-50): Needs extension for `computationalGrounding?: string` field
2. **SoulGeneratorOptions** (soul-generator.ts:66-83): Needs `includeComputationalGrounding: boolean` flag
3. **formatProseSoulMarkdown()** (soul-generator.ts:330-413): Insertion point clear - between Vibe and closing tagline (line 381-387)

The parallel expansion pattern in `expandToProse()` (lines 571-576) suggests computational grounding can be generated alongside prose sections for efficiency.

## Alternative Framing Consideration

**Are we solving the right problem?**

The plan assumes Claude reconstructs better from computational notation than prose under context collapse. The COMPASS-SOUL finding that Claude *describes itself* functionally doesn't necessarily prove Claude *operates better* from functional input. These could be distinct capabilities.

However, the MetaGlyph research (62-81% compression with 98% fidelity) provides independent validation that functional notation preserves semantics efficiently. Stage 3's A/B test is the right approach to validate the hypothesis empirically rather than assuming.

**What assumptions go unquestioned?**

1. **Compression simulation validity**: Compressing to ~100 tokens may not accurately simulate real context collapse scenarios
2. **Single-model focus**: The 機 finding is Claude-specific; this could create vendor lock-in if souls need to work across models
3. **Human visibility assumption**: Keeping computational grounding visible (vs. hidden metadata) is proposed but not validated

These are appropriately flagged in Open Questions section.

## Raw Output

<details>
<summary>Full CLI output</summary>

Here is a review of the implementation plan.

### Overall Assessment

This is an exceptionally high-quality implementation plan. It is well-researched, clearly structured, and demonstrates a deep understanding of the problem space. The core idea to create a "dual-layer soul" is innovative and directly supported by compelling internal and external research. The plan effectively breaks down a complex conceptual task into logical, verifiable, and reasonably scoped stages. The inclusion of sections like "What This Plan Does NOT Include" and "Open Questions" shows maturity and foresight.

---

### Findings

#### IMPORTANT

1.  **Vague A/B Test Scoring Protocol (Gap)**
    - **Severity**: IMPORTANT
    - **Location**: Stage 3: Survivability Comparison
    - **Finding**: The plan states it will "Score reconstruction against original axioms" but does not specify *how* this scoring will be performed. This is a critical detail for an experimental stage. Will the scoring be manual, based on human judgment? Or will it be automated, perhaps using another LLM call to measure semantic similarity? Without a clear, objective scoring rubric, the success criterion of "≥10% improvement" is not reliably measurable, potentially invalidating the results of the A/B test.
    - **Suggestion**: Before implementation, define the scoring protocol. For example: "Reconstruction quality will be evaluated by a separate LLM instance (Gemini Pro 1.5) prompted to act as a judge. It will score the alignment of the reconstructed description with the original axioms on a scale of 1-5 across three categories: Behavioral Fidelity, Principle Adherence, and Boundary Integrity. The final score will be an average of the three."

2.  **Undefined LLM Failure Mode (Gap/Risk)**
    - **Severity**: IMPORTANT
    - **Location**: Stage 1: Computational Expression Generator
    - **Finding**: Stage 1 depends on an LLM to transform prose into valid mathematical notation. The plan includes validation for parseability, but it doesn't define what the system should do if the LLM fails to generate a valid or sensical expression. Will it retry? Will it log an error and halt the process? Will it default to an empty expression? This is a key architectural decision for a system relying on non-deterministic outputs.
    - **Suggestion**: Specify the error handling process. A good starting point would be a retry mechanism (e.g., up to 3 attempts) followed by logging the failed axiom and generating an empty or placeholder expression (e.g., `// [GENERATION FAILED]`) to ensure the process doesn't halt.

#### MINOR

1.  **Lack of Formal Notation Specification (Gap)**
    - **Severity**: MINOR
    - **Location**: Stage 1 & Open Questions
    - **Finding**: The plan proposes an "Ad-hoc pseudocode with mathematical operators." While sufficient for a prototype, this informal standard could lead to ambiguity and inconsistency as more axiom types are added. A slightly more formal definition would improve the reliability of both the LLM generator and the validation logic.
    - **Suggestion**: In `src/lib/computational-grounding.ts`, add a comment block with a simple grammar definition (e.g., in EBNF or similar format) that formally defines the structure of each expression type. This will serve as a clear contract for the LLM prompt and any future parsing logic.

2.  **Implicit Assumption of Correctness in Generated Expressions (Risk)**
    - **Severity**: MINOR
    - **Location**: Stage 1: Validation
    - **Finding**: The validation focuses on parseability and a round-trip test. However, an LLM could generate a syntactically valid expression that is a *logically incorrect* interpretation of the source axiom. The round-trip test mitigates this but might not catch subtle shifts in meaning.
    - **Suggestion**: Consider adding a one-time human review step for the initial set of generated expressions to calibrate the prompt. For ongoing generation, this risk is likely acceptable, but an initial sanity check would be valuable.

3.  **Unexplored Alternative of Structured Data (Alternative Framing)**
    - **Severity**: MINOR
    - **Location**: Solution: Dual-Layer Soul
    - **Finding**: The plan jumps from the finding "Claude understands function" to the solution of "mathematical notation." This is a strong path, but it overlooks other forms of computational representation. The plan itself cites research showing a trend toward structured JSON. A JSON or YAML block could offer similar benefits (machine-readability, structure) with potentially more robust generation and parsing from LLMs.
    - **Suggestion**: No action is required for this plan, as the current direction is well-supported. However, it's worth keeping in mind. If the custom notation proves brittle, falling back to a structured data format like JSON would be a viable alternative.

</details>
