# SKILL.md LLM Wording Issue Review - Codex

**Date**: 2026-02-10
**Reviewer**: Codex GPT-5.1 (gpt-5.1-codex-max)
**CJK**: 審碼 (codex-gpt51-examiner)
**Files Reviewed**:
- `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` (primary)
- `skill/SKILL.md` (line 30 - fix target)
- `skill/README.md` (line 32 - secondary check)
- `docs/workflows/skill-publish.md` (troubleshooting table)

---

## Summary

The issue is well-defined with clear root cause analysis. However, the proposed fix over-corrects by removing all LLM mentions rather than clarifying scope, which reduces transparency and may not fully address scanner heuristics. The acceptance criteria are incomplete regarding version synchronization and scan verification.

---

## Findings

### Important

1. **Proposed fix removes essential information** (issue:42-47, SKILL.md:30)

   The proposed wording "reads files, analyzes content, and writes output" drops the fact that the skill depends on the agent's LLM. This misrepresents actual behavior compared to the current text "read files, call LLMs, and write output".

   **Current**: The agent uses its built-in capabilities to read files, call LLMs, and write output

   **Issue proposes**: The skill reads files, analyzes content, and writes output

   **Better alternative**: The agent reads files, uses its configured model to analyze content, and writes output (no external API calls)

   This alternative:
   - Preserves transparency about model dependency
   - Explicitly denies external calls (addresses scanner concern directly)
   - Still removes the triggering "call LLMs" phrase

2. **Acceptance criteria incomplete for release** (issue:61-64, workflow:121-137)

   The criterion "Publish patch version (v0.1.3)" does not mention updating all three version sources documented in the release workflow:
   - `package.json`
   - `skill/SKILL.md` (frontmatter)
   - `src/skill-entry.ts`

   Previous deployment (v0.1.0 to v0.1.2) already experienced version sync issues. This acceptance criteria risks repeating that failure.

   **Recommendation**: Add explicit criterion:
   - [ ] Version updated in package.json, skill/SKILL.md, and src/skill-entry.ts

3. **Acceptance criteria lack transparency requirement** (issue:61-63)

   The criteria aim to remove all "LLM" wording but do not require clarifying that only the agent-provided model is used. This reduces transparency and may still trigger scans unless the scope ("agent's configured model; no arbitrary outbound calls") is stated explicitly.

   **Recommendation**: Change from "No mention of 'call LLMs'" to "Clarify agent's configured model is used, no external endpoints"

### Minor

4. **No scan verification step** (issue:59-65)

   No acceptance criterion to rerun or record the ClawHub scan result after the wording change. Without verification, the fix remains unvalidated.

   **Recommendation**: Add criterion:
   - [ ] ClawHub scan result verified post-publish (screenshot or log)

5. **README.md line 32 may also trigger scans** (README.md:32)

   The README contains: `> **Note**: The npm package requires an LLM provider context from OpenClaw.`

   If scanners key on "LLM provider" phrasing, this could cause continued flags. The issue plan notes "Check for similar wording" but the context file confirms README does not contain "call LLMs" - however this related phrase is not addressed.

   **Recommendation**: Consider rewording to "requires OpenClaw runtime context" or similar.

---

## Alternative Framing

**Are we solving the right problem?**

The issue frames this as a "false positive" to work around. An alternative framing: the scanner is correctly identifying that the skill documentation mentions LLM calls, which is a legitimate signal. The question is whether the skill should:

A) **Hide the implementation detail** (current proposal) - Risk: reduces transparency, users don't know the skill uses their model
B) **Clarify the implementation scope** (recommended) - Explicitly state "uses your agent's configured model" and "no external API calls"

Option B addresses the scanner's concern (external API risk) while maintaining user trust through transparency. This aligns with security best practices: declare capabilities honestly, bound them explicitly.

**The insight in the issue is correct**: agents use their model implicitly, NEON-SOUL just stated it explicitly. But the fix should not swing to the opposite extreme of hiding it entirely.

---

## Recommendations Summary

| Priority | Action |
|----------|--------|
| Important | Revise proposed wording to clarify scope rather than remove LLM mention entirely |
| Important | Add version sync to acceptance criteria (all 3 locations) |
| Important | Add transparency requirement to acceptance criteria |
| Minor | Add scan verification step to acceptance criteria |
| Minor | Review README.md line 32 for similar concerns |

---

## Raw Output

<details>
<summary>Full CLI output</summary>

```
**Findings**
- Important — Proposed wording change to "reads files, analyzes content, and writes output" (docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md:42-47) drops the fact that the skill depends on the agent's LLM. That misrepresents behavior versus the current SKILL text "read files, call LLMs, and write output" (skill/SKILL.md:30) and could hide the built-in model requirement. Rephrase to "uses your agent's configured model (no external LLM endpoints)" rather than removing LLM entirely.
- Important — Acceptance criteria aim to remove all "LLM" wording (docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md:61-63) but do not require clarifying that only the agent-provided model is used. This reduces transparency and may still trigger scans unless the scope ("agent's configured model; no arbitrary outbound calls") is stated explicitly.
- Important — The "Publish patch version (v0.1.3)" criterion (docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md:64) doesn't mention updating all version sources (`package.json`, `skill/SKILL.md`, `src/skill-entry.ts`) highlighted in the release workflow (docs/workflows/skill-publish.md:121-137), risking a mismatched release or failed publish.
- Minor — No acceptance step to rerun/record the ClawHub scan result after the wording change, and README still references needing an "LLM provider context" (skill/README.md:32); if scanners key on that phrasing, the issue plan doesn't cover verifying or adjusting it.

OpenAI Codex v0.63.0 (research preview)
model: gpt-5.1-codex-max
provider: openai
sandbox: read-only
tokens used: 71,081
```

</details>

---

## Cross-References

- Issue: `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md`
- Fix target: `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/skill/SKILL.md:30`
- Workflow: `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/docs/workflows/skill-publish.md`
- Context: `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/output/context/2026-02-10-skillmd-llm-wording-context.md`
