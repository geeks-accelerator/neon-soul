# Issue: ClawHub Security Scan Findings

**Created**: 2026-02-10
**Updated**: 2026-02-10
**Status**: Open
**Priority**: Medium
**Type**: Security Scan Response

**Related**:
- `docs/workflows/skill-publish.md` - Consolidated installation/publishing docs
- `docs/workflows/documentation-update.md` - Updated to remove skill/README.md refs
- `skill/SKILL.md` - Skill manifest with frontmatter

---

## Summary

ClawHub security scan flagged multiple issues across v0.1.3 and v0.1.4. The v0.1.4 scan (after removing `skill/README.md`) still shows "Suspicious (medium confidence)" due to registry/manifest inconsistencies.

---

## v0.1.4 Security Scan Findings

### Passed

| Check | Status | Notes |
|-------|--------|-------|
| Purpose & Capability | ✓ | Name/description align with actions |
| Install Mechanism | ✓ | Instruction-only, no code files |
| Credentials | ✓ | No credentials requested |

### Flagged

#### 1. Instruction Scope (Warning)

**Problem**: File/directory accesses not listed in registry's required config paths.

The skill reads/writes:
- `memory/` directory
- `SOUL.md`
- `.neon-soul/` state directory

But the registry shows "no config paths required".

**Fix**: Add `configPaths` to SKILL.md frontmatter to declare accessed paths.

#### 2. Persistence & Privilege (Warning)

**Problem**: Inconsistency between registry flags and SKILL.md frontmatter.

- **SKILL.md** declares: `disableModelInvocation: true`
- **Registry** shows: `disable-model-invocation` is NOT set

This suggests either:
- Field name mismatch (camelCase vs kebab-case)
- Registry not parsing frontmatter correctly
- Caching issue from previous publish

**Risk**: If model invocation is enabled, agent could autonomously run the skill and access local files.

**Fix**:
1. Verify correct field name for ClawHub (check docs or contact support)
2. Try both formats: `disableModelInvocation` and `disable-model-invocation`
3. Re-publish and verify registry reflects the setting

---

## v0.1.3 Finding (Resolved)

### skill/README.md Flagged

**Problem**: ClawHub flagged `skill/README.md` as suspicious content.

**Resolution (v0.1.4)**:
1. Moved content to `docs/workflows/skill-publish.md`
2. Updated `docs/workflows/documentation-update.md` references
3. Deleted `skill/README.md`
4. Published v0.1.4

---

## Action Items

| Priority | Item | Status |
|----------|------|--------|
| P1 | Add `configPaths` to SKILL.md frontmatter | 🔴 open |
| P1 | Fix `disableModelInvocation` registry mismatch | 🔴 open |
| P2 | Re-publish v0.1.5 with fixes | 🔴 open |
| P2 | Verify security scan passes | 🔴 open |

---

## Proposed SKILL.md Frontmatter Fix

```yaml
---
name: NEON-SOUL
version: 0.1.5
description: AI Identity Through Grounded Principles - synthesize your soul from memory with semantic compression.
homepage: https://liveneon.ai
user-invocable: true
disableModelInvocation: true
disable-model-invocation: true  # Try both formats
emoji: 🔮
configPaths:
  - memory/
  - .neon-soul/
  - SOUL.md
tags:
  - soul-synthesis
  - identity
  - embeddings
  - semantic-compression
  - provenance
  - openclaw
---
```

---

## Commits

- `463998b` - fix(neon-soul): move skill/README.md content to workflow, delete file
- `12cd1d9` - chore(neon-soul): bump version to 0.1.4

---

## ClawHub Recommendations

From the security scan:

> Before installing or enabling, you should:
> 1. Confirm which metadata is authoritative — the registry flags or the SKILL.md
> 2. Inspect what 'memory/' and '.neon-soul/' contain on your system
> 3. Use the safe entrypoint first: `/neon-soul synthesize --dry-run`
> 4. Keep auto-commit/git integration off unless confirmed
> 5. Ask skill author to resolve manifest inconsistency and list config paths

---

## Lessons Learned

1. **Declare config paths**: Always list directories/files the skill accesses in frontmatter.

2. **Field name format**: ClawHub may expect kebab-case (`disable-model-invocation`) not camelCase (`disableModelInvocation`). Test both.

3. **Verify after publish**: Always check the ClawHub registry page to confirm frontmatter was parsed correctly.

4. **Minimal skill directory**: Only include `SKILL.md` in skill directory.

---

## Related Issues

- `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` - Previous security scan response
