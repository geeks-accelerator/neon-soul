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

ClawHub security scan regressed from **"Benign (high confidence)"** (v0.1.5) to **"Suspicious (medium confidence)"** (current). New scan identified metadata mismatches between registry and SKILL.md content.

---

## Current Scan Results (2026-02-11) - SUSPICIOUS

| Check | Status | Issue |
|-------|--------|-------|
| Purpose & Capability | ℹ | Metadata mismatch: registry has no configPaths but SKILL.md lists them |
| Instruction Scope | ! | Path inconsistency: SKILL.md references ~/.openclaw/workspace not in metadata |
| Install Mechanism | ✓ | Instruction-only skill, lowest install risk |
| Credentials | ✓ | No credentials requested |
| Persistence & Privilege | ℹ | Model invocation inconsistency: disable-model-invocation: true but SKILL.md describes embeddings/similarity |

**Assessment**: "Suspicious (medium confidence)"

---

## Issues to Fix

### Issue 1: Registry Metadata Missing configPaths

**Problem**: The security scanner reports "registry metadata provided at the top of the package lists no config paths while the SKILL.md itself enumerates configPaths (memory/, .neon-soul/, SOUL.md)".

**Root Cause**: The configPaths may not be propagating to the ClawHub registry correctly, or the registry format differs from SKILL.md frontmatter.

**Action**: Verify configPaths appear in published registry metadata. Check ClawHub registry format documentation.

### Issue 2: Workspace Path Not in Registry

**Problem**: SKILL.md references `~/.openclaw/workspace` in command options but this path is not listed in registry metadata.

**Action**: Either:
- A) Add `~/.openclaw/workspace` to configPaths
- B) Remove workspace path reference from SKILL.md if not needed
- C) Clarify in SKILL.md that workspace is user-configurable, not a default accessed path

### Issue 3: Model Invocation Inconsistency

**Problem**: Metadata sets `disable-model-invocation: true` but SKILL.md describes model-based operations (embeddings, cosine similarity, promotion rules).

**Explanation**: This is a **documentation clarity issue**, not a security issue:
- The skill uses **external embeddings** (all-MiniLM-L6-v2 via local inference or API)
- The skill does **NOT** invoke LLM models during synthesis
- `disable-model-invocation: true` correctly indicates the skill doesn't need LLM calls to function
- Embeddings and cosine similarity are mathematical operations, not model invocations

**Action**: Clarify in SKILL.md that:
1. `disable-model-invocation: true` means no LLM calls required
2. Embedding generation uses local inference (not LLM invocation)
3. Cosine similarity and promotion rules are mathematical operations

---

## ClawHub Scanner Recommendations

> What to consider before installing:
> 1. Inspect the 'memory/' files the skill would access and remove or move anything you don't want aggregated into a synthesized identity
> 2. Try the provided --dry-run mode to preview outputs before any writes
> 3. Confirm the workspace path the skill will use (SKILL.md references ~/.openclaw/workspace but the package metadata omitted configPaths)
> 4. Ask the publisher to explain the disable-model-invocation: true setting (SKILL.md describes embedding/similarity/model work that appears to require model invocation)
> 5. If you enable git auto-commit, keep it opt-in and review commits before pushing
> If any of these mismatches (metadata vs SKILL.md, model-invocation behavior) are unexplained, treat the package as untrusted and test it in an isolated directory or VM first.

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

---

## Related Issues

- `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` - Previous security scan response
