# Context: SKILL.md LLM wording false positive issue

**Generated**: 2026-02-10 14:32:00
**Scout**: haiku
**Mode**: flexible
**Topic**: SKILL.md "call LLMs" wording triggers ClawHub security scan false positive

## Files (5 relevant)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md | a1fb42ea92a2b03e | 92 | Issue documenting the false positive and proposed fix |
| skill/SKILL.md | ea17bbaa4b823f56 | 303 | Main skill manifest containing the problematic "call LLMs" phrase at line 30 |
| skill/README.md | 1892ee6969cbaa1d | 86 | Skill README; may need checking for similar wording |
| docs/plans/2026-02-10-clawhub-deployment.md | b119718e25bf1199 | 788 | Original deployment plan; documents ClawHub security scan response |
| docs/research/openclaw-self-learning-agent.md | e207202652599114 | 278 | Related research; contains "Calls LLM" phrase at line 46 (not user-facing) |

## Historical Notes (from Historian)

No historical recall performed (automation recall not available in this context).

## Relationships

```
Issue File (problem definition)
    |
    v
SKILL.md (primary fix target, line 30)
    |
    +---> skill/README.md (secondary check)
    |
    +---> deployment plan (context: security scan response)
    |
    +---> self-learning-agent.md (similar wording, research-only)
```

**Key relationship**: The issue file defines the fix. SKILL.md line 30 is the exact location requiring change.

## Suggested Focus

- **Priority 1**: `skill/SKILL.md` - Contains the problematic phrase "call LLMs" at line 30. This is the primary fix target.
- **Priority 2**: `skill/README.md` - Should be checked for similar wording per issue acceptance criteria.
- **Priority 3**: `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` - Defines the fix and acceptance criteria.

## Exploration Notes

### The Problem

Line 30 of SKILL.md currently reads:
```markdown
3. The agent uses its built-in capabilities to read files, call LLMs, and write output
```

ClawHub's security scanner interprets "call LLMs" as "makes undeclared outbound API calls to arbitrary LLM endpoints" when the actual meaning is "uses the agent's own configured model."

### The Fix

Replace with:
```markdown
3. The agent reads files, analyzes content, and writes output
```

This describes the same behavior without triggering the scanner.

### Additional Notes

1. The deployment plan (lines 751-764) documents the v0.1.1 security scan response, showing this is a known issue.
2. `skill/README.md` does not contain "call LLMs" - no changes needed there.
3. `docs/research/openclaw-self-learning-agent.md` contains "Calls LLM" at line 46, but this is research documentation, not user-facing SKILL.md content.
4. Issue mentions adding a troubleshooting pattern to `docs/workflows/skill-publish.md`, but this file does not exist yet.

### Acceptance Criteria (from issue)

- [ ] No mention of "call LLMs" or "LLM calls" in SKILL.md
- [ ] Replaced with "read files, analyze content, write output" or similar
- [ ] Security scan troubleshooting updated with this pattern
- [ ] Publish patch version (v0.1.3)
