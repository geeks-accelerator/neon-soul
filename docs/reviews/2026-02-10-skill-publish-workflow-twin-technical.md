# Technical Review: Skill Publishing Workflow

**Reviewer**: Twin 1 (Technical Infrastructure)
**Date**: 2026-02-10
**Status**: Approved with suggestions

---

## Verified Files

| File | Lines | MD5 (first 8) |
|------|-------|---------------|
| `docs/plans/2026-02-10-clawhub-deployment.md` | 783 | 6330d0a2 |
| `docs/workflows/skill-publish.md` | 335 | f2ffd8d5 |

**Cross-references verified**:
- `package.json` - exists (0.1.2)
- `skill/SKILL.md` - exists (0.1.2)
- `src/skill-entry.ts` - exists (0.1.2)
- `.npmignore` - exists, matches workflow documentation
- `docs/issues/2026-02-10-post-deployment-version-fixes.md` - exists
- `docs/workflows/documentation-update.md` - exists

---

## Summary

The skill-publish workflow is well-structured and captures hard-won deployment lessons from the v0.1.0 -> v0.1.2 progression. Technical accuracy is high, cross-references are valid, and the troubleshooting section covers observed issues. A few gaps remain around edge cases and automation opportunities.

---

## Strengths

1. **"Lessons learned" pattern** - Each section includes explicit callouts of deployment failures (v0.1.0 "Suspicious", version mismatch, `.env` leak). This is excellent knowledge capture.

2. **Three-location version sync** - Lines 106-119 explicitly document the version synchronization requirement with table format. This directly addresses the N=3 deployment issue.

3. **Defense in depth for secrets** - Lines 48-69 document both `.npmignore` AND `package.json` files array. The "lesson learned" note on line 69 explains why both are needed.

4. **Dry-run verification** - Line 93-95 includes the critical `npm publish --dry-run` check for `.env` exposure BEFORE actual publish.

5. **Security scan response process** - Lines 189-221 provide actionable patterns for ClawHub flags, directly from v0.1.0 -> v0.1.1 experience.

6. **Publish order rationale** - Lines 272-279 recommend ClawHub-first with clear reasoning (security scan before npm's 72-hour permanence).

---

## Issues Found

### Important (Should Fix)

#### I-1: Missing pre-build clean step

**File**: `docs/workflows/skill-publish.md`
**Lines**: 81-82
**Problem**: The pre-flight checklist runs `npm run build` but does not run `npm run clean` first. Stale artifacts in `dist/` could cause publish of outdated code.

**Evidence**: The deployment plan (line 119) does include `npm run clean && npm run build`.

**Suggestion**: Update line 81-82 to:
```bash
# 2. Build succeeds
npm run clean && npm run build
```

#### I-2: Version bump rebuild order unclear

**File**: `docs/workflows/skill-publish.md`
**Lines**: 114-117
**Problem**: The "Version Bump" section says to update versions in 3 files, then rebuild. However, if build fails, the user has already modified 3 files. Should verify build BEFORE updating versions.

**Suggestion**: Add note or reorder to: (1) check current build works, (2) update versions, (3) rebuild, (4) verify.

#### I-3: Missing git commit guidance

**File**: `docs/workflows/skill-publish.md`
**Lines**: 104-119
**Problem**: Version bump section does not mention committing changes. Users could publish from uncommitted state, causing git/npm drift.

**Suggestion**: Add step after rebuild:
```bash
git add package.json skill/SKILL.md src/skill-entry.ts
git commit -m "chore: bump version to X.Y.Z"
```

#### I-4: ClawHub login retry could leak token

**File**: `docs/workflows/skill-publish.md`
**Lines**: 150-151
**Problem**: The fallback command shows `$CLAWHUB_TOKEN` in the comment, but if run in a shared terminal or logged, the actual token value could be exposed.

**Suggestion**: Change comment to avoid confusion:
```bash
# If "Unauthorized", re-run login (requires token from skill/.env):
clawhub login --token "$CLAWHUB_TOKEN" --no-browser
```

Or use the interactive flow that prompts for token.

### Minor (Nice to Have)

#### M-1: Workflow status N=3 accuracy

**File**: `docs/workflows/skill-publish.md`
**Line**: 9
**Problem**: Status says "Pilot (N=3: v0.1.0, v0.1.1, v0.1.2)" but these were all same-day releases. N=3 instances is accurate, but timespan is narrow for "pilot" graduation.

**Suggestion**: Keep status as Pilot until next release cycle (v0.2.0) confirms workflow stability across different contexts (feature release vs bugfix).

#### M-2: skill/README.md version in example

**File**: `docs/workflows/skill-publish.md`
**Line**: 240
**Problem**: Troubleshooting mentions "skill/README.md stale" as an issue, but the actual `skill/README.md` line 77 shows `--version 0.1.2` which is current.

**Status**: This is currently correct. Add to checklist: verify skill/README.md version matches before publish.

#### M-3: No CHANGELOG.md reference

**File**: `docs/workflows/skill-publish.md`
**Problem**: The workflow mentions `--changelog` parameter but doesn't reference a CHANGELOG.md file for tracking history.

**Suggestion**: Either:
- Add CHANGELOG.md to project and update workflow to include entry
- Or add note that changelog is tracked via git commits + ClawHub changelog field

#### M-4: Automation token security

**File**: `docs/workflows/skill-publish.md`
**Lines**: 130-131
**Problem**: Mentions automation tokens bypass 2FA but doesn't note security implications (tokens should have minimal scope, be rotated, stored in CI secrets).

**Suggestion**: Add brief note: "Automation tokens should be: (1) scoped to package, (2) stored in CI/CD secrets, (3) rotated periodically."

---

## Architecture Assessment

### Publish Order Decision

**Current**: Workflow recommends ClawHub first, npm second (lines 272-279).

**Rationale check**:
- ClawHub security scan can fail -> patch needed -> caught before npm
- npm versions are permanent after 72 hours
- Users who depend on npm get stable (post-scan) version

**Assessment**: This ordering is correct. The 72-hour npm permanence is the key constraint. ClawHub-first acts as a staging environment.

**Alternative considered**: npm-first for "npm is primary channel". The workflow documents this but correctly recommends against it as default.

### Version Sync Architecture

**Current**: Three files must stay synchronized (package.json, SKILL.md, skill-entry.ts).

**Assessment**: This is a design smell but acceptable for v0.1.x. Three sources of truth creates sync bugs (evidenced by v0.1.0 -> v0.1.2).

**Future consideration**: For v0.2.0+, consider:
- Single source: Read version from package.json at build time
- Build step: Inject version into generated files
- Validation: Pre-commit hook checks version consistency

This would reduce the "Version Bump" section from 3 manual edits to 1.

---

## Missing Edge Cases

1. **Network failure mid-publish**: What if npm succeeds but ClawHub fails? Rollback npm? Retry ClawHub? Currently undocumented.

2. **Partial package contents**: npm publish could include unexpected files if `.npmignore` is deleted or modified. Add `npm pack && tar -tf neon-soul-X.Y.Z.tgz` verification step.

3. **ClawHub rate limiting**: No mention of rate limits or retry backoff.

4. **npm package size check**: Line 239 mentions ">1MB warning" but no explicit size check in pre-flight.

---

## Cross-Reference Integrity

| Reference | Status |
|-----------|--------|
| `docs/plans/2026-02-10-clawhub-deployment.md` | Valid |
| `package.json` | Valid, version matches |
| `skill/SKILL.md` | Valid, version matches |
| `skill/README.md` | Valid |
| `.npmignore` | Valid, content matches docs |
| `src/skill-entry.ts` | Valid, version matches |
| `docs/issues/2026-02-10-post-deployment-version-fixes.md` | Valid |
| npm URL | Verified (external) |
| ClawHub URL | Verified (external) |

All cross-references validated.

---

## Alternative Framing Check

**Are we solving the right problem?**

The workflow solves "how to publish reliably" which emerged from v0.1.0-v0.1.2 deployment issues. This is the right problem for N=3 maturity.

**What assumptions go unquestioned?**

1. **Manual publish is acceptable**: Currently assumes human runs commands. For higher velocity, consider CI/CD automation (GitHub Actions on tag push).

2. **ClawHub is essential distribution**: If ClawHub adoption is low, maintaining dual-publish adds overhead. Track which channel users actually use.

3. **npm package serves a purpose**: The npm package requires OpenClaw context. If no OpenClaw developers use it, consider deprecating npm and focusing on ClawHub + git clone methods.

**Recommendation**: Track usage metrics for each channel. If npm downloads remain near-zero after 90 days, consider simplifying to ClawHub-only publish.

---

## Compliance Check

| Category | Status | Notes |
|----------|--------|-------|
| MCE file size | Pass | 335 lines, well under 200-line code limit (docs exempt) |
| Cross-references | Pass | All 10 references verified |
| Security patterns | Pass | Secret exclusion documented |
| Error handling | Partial | See edge cases section |
| Testability | Pass | Dry-run and verification steps included |

---

## Recommendations

### For v0.1.x (Now)

1. **Fix I-1**: Add `npm run clean` before build
2. **Fix I-3**: Add git commit step after version bump
3. **Consider M-3**: Add CHANGELOG.md for release history

### For v0.2.0 (Future)

1. **Single version source**: Build-time injection from package.json
2. **CI/CD automation**: GitHub Action for tag-triggered publish
3. **Usage tracking**: Add telemetry to measure channel adoption

---

## Conclusion

The skill-publish workflow is technically sound and demonstrates good knowledge capture from deployment iterations. The troubleshooting section is comprehensive. Key improvements needed: add clean step before build, add git commit guidance, and consider single-version-source for future.

**Verdict**: Approved for production use with minor fixes.

---

## Cross-References

**Related files**:
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/docs/plans/2026-02-10-clawhub-deployment.md`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/docs/workflows/skill-publish.md`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/skill/README.md`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/.npmignore`

**Reviewer**: Twin 1 (Technical Infrastructure)
**Model**: Claude Opus 4.5

---

## Issue Created

Findings from this review have been consolidated into:
`docs/issues/2026-02-10-skill-publish-workflow-improvements.md`
