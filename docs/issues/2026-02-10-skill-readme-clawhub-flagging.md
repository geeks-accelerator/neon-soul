# Issue: ClawHub Security Scan Findings

**Created**: 2026-02-10
**Updated**: 2026-02-11
**Status**: Resolved (v0.1.6 published)
**Priority**: Medium
**Type**: Security Scan Response

**Related**:
- `docs/workflows/skill-publish.md` - Consolidated installation/publishing docs
- `docs/workflows/documentation-update.md` - Updated to remove skill/README.md refs
- `skill/SKILL.md` - Skill manifest with frontmatter

---

## Summary

ClawHub security scan recovered from **"Suspicious (medium confidence)"** to **"Benign (medium confidence)"** after v0.1.6 fixes. All metadata mismatches resolved.

---

## Current Scan Results (v0.1.6) - BENIGN

| Check | Status | Notes |
|-------|--------|-------|
| Purpose & Capability | ✓ | Name/description aligns with instructions. Minor note: ~/.openclaw/workspace is broader than other paths but reasonable for workspace default. |
| Instruction Scope | ℹ | File reads/writes inline with purpose. Processes sensitive content (diary/preferences). No external network or model API calls. |
| Install Mechanism | ✓ | Instruction-only skill, no install spec, no code files. Minimizes installation risk. |
| Credentials | ℹ | No credentials requested. ~/.openclaw/workspace in configPaths can expose workspace artifacts - worth reviewing. |
| Persistence & Privilege | ✓ | User-invocable only, writes only to .neon-soul/ and SOUL.md, opt-in git commits. |

**Assessment**: "Benign (medium confidence)"

---

## Issues Fixed (v0.1.6)

### Issue 1: Registry Metadata Missing configPaths - RESOLVED

**Problem**: Registry metadata missing configPaths that SKILL.md listed.

**Fix**: configPaths now propagating correctly after v0.1.6 publish.

### Issue 2: Workspace Path Not in Registry - RESOLVED

**Problem**: SKILL.md referenced `~/.openclaw/workspace` but path not in configPaths.

**Fix**: Added `~/.openclaw/workspace` to configPaths array.

### Issue 3: Model Invocation Inconsistency - RESOLVED

**Problem**: `disable-model-invocation: true` but SKILL.md described embeddings/similarity.

**Fix**: Added "Model Invocation Clarification" section explaining:
- Embeddings use local inference (all-MiniLM-L6-v2), not LLM invocation
- Cosine similarity is mathematical, not a model call
- `disable-model-invocation: true` correctly means no LLM calls required

---

## ClawHub Scanner Recommendations (v0.1.6)

> Before installing or invoking:
> 1. Inspect the listed configPaths (memory/, .neon-soul/, SOUL.md, ~/.openclaw/workspace) to confirm you're comfortable with the skill accessing them.
> 2. Run `/neon-soul synthesize --dry-run` first and review the proposed output and any provenance traces.
> 3. Keep auto-commit disabled unless you trust git commits from this workspace.
> 4. Confirm your agent actually performs local embeddings (all-MiniLM-L6-v2) if you need deterministic local-only processing.
> 5. If you want extra caution, copy your memory files into a disposable workspace and run the skill there to review behavior before granting it access to your primary data.

---

## Action Items

| Priority | ID | Issue | Status |
|----------|-----|-------|--------|
| P1 | F-1 | Verify configPaths in published registry | ✅ resolved |
| P1 | F-2 | Resolve workspace path inconsistency | ✅ resolved |
| P1 | F-3 | Clarify model invocation vs embedding in SKILL.md | ✅ resolved |
| P2 | F-4 | Bump version after fixes | ✅ resolved (v0.1.6) |
| P2 | F-5 | Re-publish and verify scan passes | ✅ resolved (v0.1.6) |

### Fixes Applied (v0.1.6)

**F-2 Fix**: Added `~/.openclaw/workspace` to configPaths in frontmatter.

**F-3 Fix**: Added new "Model Invocation Clarification" section explaining:
- `disable-model-invocation: true` means no LLM calls required
- Embeddings use local inference (all-MiniLM-L6-v2), not LLM invocation
- Cosine similarity is mathematical, not a model call

**F-4 Fix**: Version bumped from 0.1.5 → 0.1.6.

**F-5 Fix**: Published v0.1.6 to ClawHub and npm on 2026-02-11.

---

## v0.1.6 Fixes (Current)

v0.1.6 addresses the scan regression with these changes:

```yaml
---
name: NEON-SOUL
version: 0.1.6
disableModelInvocation: true
disable-model-invocation: true  # kebab-case for registry
configPaths:
  - memory/
  - .neon-soul/
  - SOUL.md
  - ~/.openclaw/workspace  # F-2 FIX: Now listed
---
```

Plus new "Model Invocation Clarification" section explaining embeddings vs LLM calls (F-3 FIX).

---

## Previous Resolution (v0.1.5) - Regressed

v0.1.5 achieved "Benign (high confidence)" but regressed due to stricter scanner checks around workspace paths and model invocation documentation.

---

## Historical Findings (Resolved Previously)

### v0.1.4 Findings
| Issue | Fix |
|-------|-----|
| configPaths not declared | Added `configPaths` array |
| disableModelInvocation not in registry | Added kebab-case `disable-model-invocation: true` |

### v0.1.3 Findings
| Issue | Fix |
|-------|-----|
| skill/README.md flagged | Moved to docs/workflows/skill-publish.md, deleted file |

---

## Commits (Historical)

- `463998b` - fix(neon-soul): move skill/README.md content to workflow, delete file
- `12cd1d9` - chore(neon-soul): bump version to 0.1.4
- `f0158c8` - fix(neon-soul): add configPaths and fix disable-model-invocation (v0.1.5)

---

## Lessons Learned (Updated)

1. **Registry metadata may differ from SKILL.md frontmatter**: The scanner compares both. Ensure they match exactly.

2. **Document embedding vs LLM distinction**: "Model invocation" in ClawHub context means LLM calls. Embedding generation via local inference is not the same thing. This needs explicit documentation.

3. **List ALL accessed paths**: Include workspace paths, even if they're user-configurable defaults.

4. **Scanner rules evolve**: A passing scan can regress if scanner rules are updated. Monitor after each publish.

5. **Verify registry after publish**: Always check the published registry metadata matches SKILL.md frontmatter.

6. **Explicit clarification sections work**: Adding a dedicated "Model Invocation Clarification" section resolved the scanner's confusion about embeddings vs LLM calls. Proactive documentation beats reactive explanations.

---

## Related Issues

- `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` - Previous security scan response
