# Issue: ClawHub Security Scan Findings

**Created**: 2026-02-10
**Updated**: 2026-02-10
**Status**: Resolved
**Priority**: Medium
**Type**: Security Scan Response

**Related**:
- `docs/workflows/skill-publish.md` - Consolidated installation/publishing docs
- `docs/workflows/documentation-update.md` - Updated to remove skill/README.md refs
- `skill/SKILL.md` - Skill manifest with frontmatter

---

## Summary

ClawHub security scan flagged issues across v0.1.3 and v0.1.4. Fixed in v0.1.5 which now shows **"Benign (high confidence)"**.

---

## v0.1.5 Security Scan Results (PASSED)

| Check | Status | Notes |
|-------|--------|-------|
| Purpose & Capability | ✓ | File reads/writes align with described purpose |
| Instruction Scope | ℹ | Appropriate for stated goal, accesses local memory |
| Install Mechanism | ✓ | Instruction-only, lowest-risk install model |
| Credentials | ✓ | No credentials requested, configPaths match instructions |
| Persistence & Privilege | ✓ | User-invocable only, disable-model-invocation enforced |

**Assessment**: "This instruction-only skill appears coherent and low-risk"

---

## Fix Applied (v0.1.5)

```yaml
---
name: NEON-SOUL
version: 0.1.5
# ...
disableModelInvocation: true
disable-model-invocation: true  # kebab-case for registry
configPaths:
  - memory/
  - .neon-soul/
  - SOUL.md
# ...
---
```

**Key changes:**
1. Added `disable-model-invocation: true` (kebab-case for registry compatibility)
2. Added `configPaths` array declaring all accessed directories/files
3. Kept `disableModelInvocation: true` for backward compatibility

---

## Previous Findings (Resolved)

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

## Commits

- `463998b` - fix(neon-soul): move skill/README.md content to workflow, delete file
- `12cd1d9` - chore(neon-soul): bump version to 0.1.4
- `f0158c8` - fix(neon-soul): add configPaths and fix disable-model-invocation (v0.1.5)

---

## ClawHub Recommendations (from v0.1.5 scan)

> Before installing, confirm which local folder(s) the agent will treat as memory (memory/, ~/.openclaw/workspace, etc.) and remove or redact any files you don't want aggregated into a synthesized identity (private passwords, third-party credentials, legal/medical records). Also verify your agent implementation actually enforces disable-model-invocation and that you run synthesize commands intentionally (use --dry-run first).

---

## Lessons Learned

1. **Declare configPaths**: Always list directories/files the skill accesses in frontmatter. This resolved the "Instruction Scope" concern.

2. **Use kebab-case for registry flags**: ClawHub registry expects `disable-model-invocation` (kebab-case), not `disableModelInvocation` (camelCase). Include both for compatibility.

3. **Minimal skill directory**: Only include `SKILL.md` in skill directory. Move documentation to `docs/workflows/`.

4. **Verify after publish**: Always check the ClawHub registry page to confirm frontmatter was parsed correctly.

5. **Iterate quickly**: v0.1.3 → v0.1.4 → v0.1.5 in same day. Fast iteration with focused fixes resolved all security concerns.

---

## Related Issues

- `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` - Previous security scan response
