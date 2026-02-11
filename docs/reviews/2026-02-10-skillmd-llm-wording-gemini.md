# SKILL.md LLM Wording False Positive Review - Gemini

**Date**: 2026-02-10
**Reviewer**: gemini-2.5-pro (via gemini CLI)
**Files Reviewed**:
- `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` (primary)
- `skill/SKILL.md` (fix target)
- `skill/README.md` (secondary check)
- `docs/workflows/skill-publish.md` (troubleshooting update)
- `output/context/2026-02-10-skillmd-llm-wording-context.md` (context file)

## Summary

The issue is well-documented and the proposed fix correctly addresses the root cause. No critical issues found. Two important clarifications needed: (1) explicitly note README.md needs no changes, and (2) make the fix description more precise to match actual SKILL.md content.

## Findings

### Critical

None. The analysis is sound and the proposed fix does not introduce security vulnerabilities.

### Important

**1. `skill/README.md` Wording is Correct and Should Not Be Changed**

- **Location**: `skill/README.md:30-34`
- **Issue**: The issue file correctly suggests checking `skill/README.md` for similar wording. However, the README's usage of "LLM" is different and appropriate for its technical audience (skill developers). Phrases like "LLM provider context" and `LLMRequiredError` are precise technical terms, not the ambiguous "call LLMs" phrase that triggers the scanner.
- **Recommendation**: Explicitly state in acceptance criteria that `skill/README.md` was reviewed and requires no changes, as its wording is precise and contextually appropriate.

### Minor

**1. Proposed Fix Lacks Precision**

- **Location**: `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` ("Fix" section)
- **Issue**: The issue file shows a hypothetical example ("The skill will call LLMs to classify and synthesize your identity") but the actual problematic line in `skill/SKILL.md:30` is:
  ```
  3. The agent uses its built-in capabilities to read files, call LLMs, and write output
  ```
- **Recommendation**: The fix should be more precise. Replace just "call LLMs" with "analyze content", resulting in:
  ```
  3. The agent uses its built-in capabilities to read files, analyze content, and write output
  ```
  This is a minimal, targeted change.

**2. Incomplete Troubleshooting Pattern**

- **Location**: `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` ("Troubleshooting Pattern" section)
- **Issue**: The "Fix" column simply says "Reword to 'analyze content'" which could be more actionable.
- **Recommendation**: Improve to: `Reword to focus on actions, e.g., "analyze content" or "synthesize information" - agents use their model implicitly`

## Alternative Framing

The core assumption is that the only way to pass the security scan is to reduce the transparency of the skill's description by using more abstract language. This approach works around the scanner's limitations by making the description less specific.

**Key question**: Are we optimizing for the scanner at the expense of human clarity?

The phrase "call LLMs," while problematic for the scanner, is arguably a more direct and honest description of what the skill does than "analyze content." The current fix trades transparency for compliance.

**Alternative approaches**:

1. **Engage with platform team**: Could the ClawHub scanner be taught to distinguish between "call arbitrary external LLMs" (suspicious) and "utilize the configured agent LLM" (standard behavior)?

2. **More explicit clarification**: Instead of removing the phrase, add context:
   ```
   The agent uses its built-in capabilities to read files, use its configured model, and write output
   ```
   This is both accurate and avoids the "call external APIs" interpretation.

3. **Accept the trade-off**: The proposed fix is pragmatic. "Analyze content" is not dishonest - it describes the outcome rather than the mechanism. This may be sufficient.

**Recommendation**: Implement the proposed documentation fix now to resolve the immediate issue, but consider opening a dialogue with the security/platform team to create a more robust, long-term solution that doesn't penalize descriptive accuracy.

## Validation Notes

**Verified**:
- `skill/SKILL.md:30` contains the exact phrase "call LLMs"
- `skill/README.md` does NOT contain "call LLMs" - only technical terms like "LLM provider context"
- `docs/workflows/skill-publish.md` already has a "Common Flags and Fixes" table (lines 235-240) where the new pattern should be added

**Context file accuracy**: The context file correctly identifies line 30 as the fix target and notes README.md needs no changes.

## Raw Output

<details>
<summary>Full CLI output</summary>

Based on my analysis of the issue file and its context, here are my findings:

### Critical

No critical issues found. The analysis in the issue file is sound, and the proposed fix correctly addresses the root cause without introducing security vulnerabilities.

### Important

**1. Finding: `skill/README.md` Wording is Correct and Should Not Be Changed**
- **File:** `skill/README.md`
- **Lines:** 30-34
- **Analysis:** The issue file correctly suggests checking `skill/README.md` for similar wording. However, the context provided shows the usage of "LLM" in the README is different and appropriate for its technical audience (skill developers). Phrases like "LLM provider context" and `LLMRequiredError` are precise technical terms, not the ambiguous "call LLMs" phrase that triggers the scanner. Modifying the README could reduce clarity for developers and is unnecessary to fix the false positive.
- **Recommendation:** Explicitly state in the plan that `skill/README.md` was reviewed and requires no changes, as its wording is precise and contextually appropriate.

### Minor

**1. Finding: Proposed Fix Lacks Precision**
- **File:** `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` (section: "Fix")
- **Analysis:** The issue file proposes replacing the entire problematic sentence. However, the actual sentence is `The agent uses its built-in capabilities to read files, call LLMs, and write output`. The problematic part is just "call LLMs". The proposed fix is more of a rewrite than a targeted replacement.
- **Recommendation:** The fix should be more precise. A better description would be: "In `skill/SKILL.md`, replace the phrase `call LLMs` with `analyze content`, resulting in the line: `The agent uses its built-in capabilities to read files, analyze content, and write output`." This is a more accurate and minimal change.

**2. Finding: Incomplete Troubleshooting Pattern**
- **File:** `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` (section: "Troubleshooting Pattern (Add to Workflow)")
- **Analysis:** The new pattern for the troubleshooting table in `docs/workflows/skill-publish.md` is good but could be more helpful. The "Fix" column simply says "Reword to 'analyze content'".
- **Recommendation:** Improve the "Fix" column to provide a concrete example, making it more actionable for future users. For example: `Reword to focus on actions, e.g., "analyze content" or "synthesize information".`

### Alternative Framing

The core assumption is that the only way to pass the security scan is to reduce the transparency of the skill's description by using more abstract language. This approach works around the scanner's limitations by making the description less specific.

While this is a pragmatic and effective short-term solution, it raises a question: **Are we optimizing for the scanner at the expense of human clarity?**

The phrase "call LLMs," while problematic for the scanner, is arguably a more direct and honest description of what the skill does than "analyze content." The current fix trades transparency for compliance. A different approach could be to engage with the team managing the ClawHub scanner to improve its intelligence. For example, could the scanner be taught to distinguish between "call arbitrary external LLMs" (suspicious) and "utilize the configured agent LLM" (standard behavior)?

This reframing suggests a parallel path: implement the proposed documentation fix now to resolve the immediate issue, but also open a dialogue with the security/platform team to create a more robust, long-term solution that doesn't penalize descriptive accuracy.

</details>
