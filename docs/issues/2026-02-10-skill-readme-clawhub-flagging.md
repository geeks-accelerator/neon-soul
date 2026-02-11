# Issue: ClawHub Security Scan Findings

**Created**: 2026-02-10
**Updated**: 2026-02-11
**Status**: Open (registry metadata not propagating)
**Priority**: Medium
**Type**: Security Scan Response

**Related**:
- `docs/workflows/skill-publish.md` - Consolidated installation/publishing docs
- `docs/workflows/documentation-update.md` - Updated to remove skill/README.md refs
- `skill/SKILL.md` - Skill manifest with frontmatter

---

## Summary

ClawHub security scan regressed back to **"Suspicious (medium confidence)"** despite v0.1.6 fixes. **Root cause**: Registry metadata shows "Required config paths: none" even though SKILL.md frontmatter explicitly declares `configPaths`. This is a **ClawHub registry propagation issue**, not a SKILL.md issue.

**VirusTotal**: Benign ✓
**OpenClaw**: Suspicious (medium confidence) - due to metadata mismatch

---

## Current Scan Results (2026-02-11 AM) - SUSPICIOUS

| Check | Status | Issue |
|-------|--------|-------|
| Purpose & Capability | ! | Registry says "Required config paths: none" but SKILL.md lists configPaths - mismatch |
| Instruction Scope | ! | File-access scope broader than registry metadata suggests (registry missing configPaths) |
| Install Mechanism | ✓ | Instruction-only skill, no code files, low installation risk |
| Credentials | ℹ | No credentials requested. Discrepancy between registry and SKILL.md configPaths |
| Persistence & Privilege | ✓ | User-invocable, writes to .neon-soul/ and SOUL.md, opt-in git commits |

**Assessment**: "Suspicious (medium confidence)"

**Root Cause**: ClawHub registry is not reading `configPaths` from SKILL.md frontmatter. The SKILL.md correctly declares:
```yaml
configPaths:
  - memory/
  - .neon-soul/
  - SOUL.md
  - ~/.openclaw/workspace
```
But the registry shows "Required config paths: none".

---

## Current Issues

### Issue 1: Registry Not Reading configPaths from Frontmatter - OPEN

**Problem**: ClawHub registry shows "Required config paths: none" even though SKILL.md frontmatter declares:
```yaml
configPaths:
  - memory/
  - .neon-soul/
  - SOUL.md
  - ~/.openclaw/workspace
```

**Research Findings (2026-02-11)**:

1. **`configPaths` is NOT part of the Agent Skills spec**: The [agentskills.io specification](https://agentskills.io/specification) only defines: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`. There is no `configPaths` field.

2. **OpenClaw metadata format**: [OpenClaw docs](https://docs.openclaw.ai/tools/skills) show metadata as nested JSON under `metadata.openclaw` with fields like `requires.env`, `requires.bins`, `primaryEnv`. No `configPaths` equivalent.

3. **Security gap confirmed**: [Snyk's threat model analysis](https://snyk.io/articles/skill-md-shell-access/) notes "No standardized fields for documenting file access paths" - this is a known ecosystem gap.

4. **Scanner inconsistency**: The ClawHub scanner expects `configPaths` info (it flags when missing from registry), but there's no official spec for how to declare it. The scanner may be reading from markdown body, not frontmatter.

**Root Cause**: `configPaths` is a non-standard field. ClawHub scanner looks for file access declarations but the registry doesn't know how to extract them from our frontmatter format.

**Solution Found (v0.1.7)**:

The correct format uses nested metadata structure:
```yaml
metadata:
  openclaw:
    config:
      stateDirs:          # Directories the skill accesses
        - memory/
        - .neon-soul/
        - ~/.openclaw/workspace
    requires:
      config:             # Config paths the skill reads
        - memory/
        - .neon-soul/
        - SOUL.md
        - ~/.openclaw/workspace
```

Sources:
- [ClawHub skill-format.md](https://github.com/openclaw/clawhub/blob/main/docs/skill-format.md)
- [ClawHub README](https://github.com/openclaw/clawhub) - shows `stateDirs` example
- [OpenClaw docs](https://docs.openclaw.ai/tools/skills) - shows `requires` structure

### Issue 2: Workspace Path in configPaths - RESOLVED (in SKILL.md)

**Problem**: SKILL.md referenced `~/.openclaw/workspace` but path not in configPaths.

**Fix**: Added `~/.openclaw/workspace` to configPaths array. ✓

### Issue 3: Model Invocation Clarification - RESOLVED (in SKILL.md)

**Problem**: `disable-model-invocation: true` but SKILL.md described embeddings/similarity.

**Fix**: Added "Model Invocation Clarification" section. ✓

---

## ClawHub Scanner Recommendations (2026-02-11)

> What to consider before installing:
> 1. **Reconcile metadata**: Registry says no config paths, but SKILL.md lists memory/, .neon-soul/, SOUL.md, and ~/.openclaw/workspace. Ask the publisher why the registry metadata omits these paths.
> 2. **Inspect contents**: Back up and inspect memory/, SOUL.md, and ~/.openclaw/workspace. Remove secrets or sensitive data before running.
> 3. **Use dry-run first**: Run `/neon-soul synthesize --dry-run` to see what would change; use `--diff` to review proposed edits.
> 4. **Confirm model claims**: SKILL.md states it "does not invoke models" and embeddings are local (all-MiniLM-L6-v2). Ensure your agent supports local embeddings.
> 5. **Check backups & rollback**: The skill creates .neon-soul/backups/; verify backups exist and understand rollback.
> 6. **Low-risk option**: Use `--workspace` to point to a safe/isolated directory until you verify behavior.

---

## Action Items

| Priority | ID | Issue | Status |
|----------|-----|-------|--------|
| P0 | F-6 | Investigate why configPaths not propagating to registry | 🔴 open |
| P0 | F-7 | Check ClawHub docs for correct metadata field format | 🔴 open |
| P1 | F-1 | Verify configPaths in published registry | ❌ NOT propagating |
| P1 | F-2 | Resolve workspace path inconsistency | ✅ resolved (in SKILL.md) |
| P1 | F-3 | Clarify model invocation vs embedding in SKILL.md | ✅ resolved |
| P2 | F-4 | Bump version after fixes | ✅ resolved (v0.1.6) |
| P2 | F-5 | Re-publish and verify scan passes | ❌ scan still suspicious |

### New Action Items

**F-6**: ✅ Research completed - found correct format is `metadata.openclaw.config.stateDirs`

**F-7**: ✅ Implemented in v0.1.7 - using nested metadata structure:
- `metadata.openclaw.config.stateDirs` for directories
- `metadata.openclaw.requires.config` for config paths

**F-8**: 🔴 Publish v0.1.7 and verify scan passes

### Previous Fixes Applied (v0.1.6)

**F-2 Fix**: Added `~/.openclaw/workspace` to configPaths in frontmatter. ✓

**F-3 Fix**: Added "Model Invocation Clarification" section. ✓

**F-4 Fix**: Version bumped 0.1.5 → 0.1.6. ✓

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

7. **Frontmatter ≠ Registry metadata**: Just because configPaths is in SKILL.md frontmatter doesn't mean ClawHub registry will show it. The `clawhub publish` command may not extract all frontmatter fields, or may expect different field names. Need to verify registry format requirements.

8. **Scan results can be inconsistent**: The same version (v0.1.6) showed "Benign" immediately after publish, then "Suspicious" the next morning. Scanner may re-run with different rules or caching effects.

---

## Related Issues

- `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` - Previous security scan response
