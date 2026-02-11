# Issue: Post-Deployment Version and Path Fixes

**Created**: 2026-02-10
**Status**: ✅ Resolved (v0.1.2)
**Priority**: Medium
**Type**: Bug Fix
**Blocking**: No (published packages work correctly)

---

## Summary

Post-deployment code review (N=2) identified version mismatches and stale paths that should be fixed in a v0.1.2 patch release.

---

## Findings

All findings verified N=2 (both Codex and Gemini reviewers confirmed, or manually verified).

### Important (Should Fix)

| ID | File | Line | Issue | Verification |
|----|------|------|-------|--------------|
| I-1 | `src/skill-entry.ts` | 49 | Hardcoded `version: '0.1.0'` (should be current version) | N=2 (both reviewers) |
| I-2 | `skill/README.md` | 77 | Publish example shows `--version 0.1.0` | N=2 (both reviewers) |

### Minor (Nice to Have)

| ID | File | Line | Issue | Verification |
|----|------|------|-------|--------------|
| M-1 | `README.md` | 266, 291 | Paths say `cd research/neon-soul` (monorepo artifact) | N=2 (verified) |
| M-2 | `package.json` | 47 | `@types/node: ^20.10.0` vs Node 22+ runtime requirement | N=2 (verified) |

---

## Root Cause

- **I-1, I-2**: Version bumps during deployment (0.1.0 → 0.1.1) didn't update all hardcoded version strings
- **M-1**: README copied from monorepo context where project lived at `research/neon-soul`
- **M-2**: Types package version not aligned with engines requirement (cosmetic, doesn't affect runtime)

---

## Recommended Fix

### 1. Update version in skill-entry.ts

```typescript
// src/skill-entry.ts:49
version: '0.1.2',  // Update to match package.json
```

**Alternative**: Read version from package.json at build time to avoid future drift.

### 2. Update skill/README.md publish example

```markdown
<!-- skill/README.md:77 -->
--version 0.1.2
```

**Alternative**: Remove version from example, let users specify their own.

### 3. Fix README.md paths

```markdown
<!-- README.md:266, 291 -->
cd neon-soul  # Not research/neon-soul
```

### 4. Update @types/node (optional)

```json
"@types/node": "^22.0.0"
```

---

## Implementation Steps

1. Apply fixes to all 4 files
2. Bump version to 0.1.2 in `package.json` and `skill/SKILL.md`
3. Rebuild: `npm run build`
4. Run tests: `npm test`
5. Publish to npm: `npm publish --access public`
6. Publish to ClawHub: `clawhub publish skill --slug neon-soul --name "NEON-SOUL" --version 0.1.2 --changelog "Fix version mismatches and README paths"`
7. Update deployment plan with 0.1.2 notes

---

## Acceptance Criteria

- [x] `src/skill-entry.ts:49` version matches `package.json`
- [x] `skill/README.md` publish example uses current version
- [x] `README.md` paths don't reference `research/` prefix
- [x] All tests pass (257 passed)
- [x] ClawHub v0.1.2 published
- [x] npm v0.1.2 published

## Resolution

**Fixed in v0.1.2** (2026-02-10):
- All version strings updated to 0.1.2
- README paths fixed (removed `research/` prefix)
- `@types/node` updated to ^22.0.0
- ClawHub published
- Workflow extracted: `docs/workflows/skill-publish.md`

---

## Cross-References

**Source Reviews**:
- `docs/reviews/2026-02-10-clawhub-deployment-impl-codex.md` - Codex findings
- `docs/reviews/2026-02-10-clawhub-deployment-impl-gemini.md` - Gemini findings

**Related Plan**:
- `docs/plans/2026-02-10-clawhub-deployment.md` - Original deployment plan (Complete)

**Workflow Created**:
- `docs/workflows/skill-publish.md` - Repeatable publish workflow (extracted from lessons learned)

**Affected Files**:
- `src/skill-entry.ts:49` - I-1
- `skill/README.md:77` - I-2
- `README.md:266,291` - M-1
- `package.json:47` - M-2

**Published Packages**:
- npm: https://www.npmjs.com/package/neon-soul
- ClawHub: https://clawhub.ai/leegitw/neon-soul

---

## Notes

These are cosmetic fixes - the published v0.1.1 packages work correctly. The version mismatch in `skill-entry.ts` only affects metadata reporting, not functionality.

Consider implementing version sync at build time to prevent future drift (e.g., read from package.json or use a build script to inject version).
