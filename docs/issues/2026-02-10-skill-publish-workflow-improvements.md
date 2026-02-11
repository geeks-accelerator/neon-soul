# Issue: Skill Publish Workflow Improvements

**Created**: 2026-02-10
**Status**: Resolved
**Priority**: Low
**Type**: Documentation Enhancement
**Blocking**: No (workflow is functional)

---

## Summary

Twin review (N=2) of `docs/workflows/skill-publish.md` identified 8 improvements for clarity, safety, and usability. The workflow is approved for use; these are enhancements for the next iteration.

---

## Findings

All findings verified N=2 (both Technical and Creative reviewers, or manually verified).

### Important (Should Fix)

| ID | Source | Issue | Lines | Verification |
|----|--------|-------|-------|--------------|
| I-1 | Technical | Missing `npm run clean` before build in Pre-Flight | 81-82 | N=2 (verified) |
| I-2 | Technical | Version bump should verify build succeeds before proceeding | 114-117 | N=2 (verified) |
| I-3 | Technical | No git commit guidance after version bump | 104-119 | N=2 (verified) |
| I-4 | Technical | Token in command could appear in terminal history | 150-151 | N=2 (verified) |
| C-1 | Creative | First-Time Setup (57 lines) blocks returning users | 13-70 | N=2 (verified) |
| C-2 | Creative | Version table uses line numbers that drift | 108-112 | N=2 (verified) |
| C-3 | Creative | Pre-Flight Checklist lacks pre-commit hook warning | 72-100 | N=2 (verified) |
| C-4 | Creative | Rollback section presents options with equal weight | 282-307 | N=2 (verified) |

### Minor (Nice to Have)

| ID | Source | Issue |
|----|--------|-------|
| M-1 | Technical | N=3 status based on single-day releases (narrow timespan) |
| M-2 | Technical | No CHANGELOG.md reference for release history |
| M-3 | Technical | Missing `npm pack && tar -tf` for package contents verification |
| M-4 | Creative | Security scan section could reference SKILL.md section locations |
| M-5 | Creative | Version history table missing links to triggering issues |
| M-6 | Creative | Missing CJK summary section for token-efficient loading |

---

## Recommended Fixes

### I-1: Add `npm run clean` before build

```bash
# 2. Build succeeds
npm run clean && npm run build
```

### I-2: Verify build after version bump

Add after version updates:

```bash
npm run build
# Verify build succeeded before continuing
ls dist/skill-entry.js  # Should exist
```

### I-3: Add git commit guidance

Add after version bump section:

    ### Commit Version Bump

    ```bash
    git add package.json skill/SKILL.md src/skill-entry.ts
    git commit -m "chore(neon-soul): bump version to X.Y.Z"
    ```

    > Commit before publishing so version bump is tracked even if publish fails.

### I-4: Protect token from history

```bash
# Ensure logged in (token may expire)
source skill/.env
clawhub whoami
# If "Unauthorized", re-login using the login command from First-Time Setup
```

Or use environment variable directly:

```bash
CLAWHUB_TOKEN=$(grep CLAWHUB_TOKEN skill/.env | cut -d= -f2) clawhub login --token "$CLAWHUB_TOKEN" --no-browser
```

### C-1: Add Quick Reference section

Add at top of file after frontmatter:

    ## Quick Reference (Returning Users)

    Already set up? Jump to:
    - [Pre-Flight Checklist](#pre-flight-checklist)
    - [Version Bump](#version-bump)
    - [Publish to npm](#publish-to-npm)
    - [Publish to ClawHub](#publish-to-clawhub)

    New to publishing? Start with [First-Time Setup](#first-time-setup-one-time).

### C-2: Use grep patterns instead of line numbers

| File | Search Pattern | Format |
|------|----------------|--------|
| `package.json` | `grep '"version"'` | `"version": "X.Y.Z",` |
| `skill/SKILL.md` | `grep 'version:'` | `version: X.Y.Z` |
| `src/skill-entry.ts` | `grep "version:"` | `version: 'X.Y.Z',` |

### C-3: Add pre-commit hook check

Add to Pre-Flight Checklist:

```bash
# 7. Pre-commit hooks won't block (if configured)
git status  # Ensure clean working directory
```

### C-4: Restructure Rollback with hierarchy

    ## Rollback

    ### Default: Patch Release (Always Prefer)

    The standard response to any issue is a patch release:

    ```bash
    # 1. Fix the issue
    # 2. Bump to X.Y.Z+1
    # 3. Publish patch
    ```

    This preserves downstream compatibility and follows semver.

    ### Emergency Only: Deprecate or Unpublish

    Reserve for critical security/legal issues:

    **Deprecate** (warns but doesn't break):
    ```bash
    npm deprecate neon-soul@X.Y.Z "Security issue - upgrade to X.Y.Z+1"
    ```

    **Unpublish** (breaks downstream, last resort):
    ```bash
    npm unpublish neon-soul@X.Y.Z  # Within 72 hours only
    # WARNING: Breaks anyone who installed this version
    ```

---

## Implementation Order

1. **C-1** (Quick Reference) - Highest UX impact
2. **C-4** (Rollback hierarchy) - Aligns with documented philosophy
3. **I-1, I-2** (Build safety) - Prevents failed publishes
4. **I-3** (Git commit) - Audit trail
5. **I-4** (Token safety) - Security hygiene
6. **C-2, C-3** (Polish) - Nice to have

---

## Alternative Framing (From Reviews)

### Technical Insight
> Three-version-sync is a design smell; recommend single-source (package.json) with build-time injection for v0.2.0

**Consideration**: Add TODO to explore reading version from package.json at build time to eliminate sync requirement.

### Creative Insight
> ClawHub staging path before npm publish could reduce npm version burn rate (v0.1.0-0.1.2 all on same day due to iteration)

**Consideration**: For v0.2.0+, consider a ClawHub-only "staging" release before npm publish to catch security scan issues without burning npm versions.

---

## Acceptance Criteria

- [x] Quick Reference section added at top
- [x] Rollback section restructured with patch-first hierarchy
- [x] `npm run clean` added to Pre-Flight
- [x] Build verification added after version bump
- [x] Git commit guidance added
- [x] Token safety improved
- [x] Search patterns replace line numbers
- [x] Pre-commit hook check added

---

## Cross-References

**Source Reviews**:
- `docs/reviews/2026-02-10-skill-publish-workflow-twin-technical.md`
- `docs/reviews/2026-02-10-skill-publish-workflow-twin-creative.md`

**Affected File**:
- `docs/workflows/skill-publish.md`

**Related**:
- `docs/plans/2026-02-10-clawhub-deployment.md` - Original deployment plan
- `docs/issues/2026-02-10-post-deployment-version-fixes.md` - Version sync lessons (resolved)

---

## Notes

The workflow is functional and approved for production use. These improvements enhance clarity and safety but are not blocking. Address during next publish cycle or when workflow is revisited.
