# Issue: skill/README.md Flagged by ClawHub Security Scan

**Created**: 2026-02-10
**Updated**: 2026-02-10
**Status**: Resolved
**Priority**: Medium
**Type**: Security Scan Response

**Related**:
- `docs/workflows/skill-publish.md` - Consolidated installation/publishing docs
- `docs/workflows/documentation-update.md` - Updated to remove skill/README.md refs

---

## Summary

ClawHub security scan flagged `skill/README.md` during publish. The file contained installation instructions and was being included in the skill package unnecessarily.

---

## Problem

When publishing NEON-SOUL to ClawHub, the security scanner flagged `skill/README.md` as potentially suspicious content. The file contained:

- Installation instructions for various agent platforms
- ClawHub publish steps
- Command quick reference
- Links to website, GitHub, npm, ClawHub

While the content was benign, its presence in the skill package was:
1. Unnecessary (SKILL.md is the only required file)
2. Triggering false positives in security scans
3. Duplicating content that belonged in workflow documentation

---

## Resolution

**Fix applied in v0.1.4**:

1. **Moved content** from `skill/README.md` to `docs/workflows/skill-publish.md`
   - Added "What Is This?" section
   - Added Commands table
   - Added Links section

2. **Updated references** in `docs/workflows/documentation-update.md`
   - Replaced all `skill/README.md` references with `docs/workflows/skill-publish.md`

3. **Deleted** `skill/README.md`

4. **Published** v0.1.4 to ClawHub without the flagged file

---

## Commits

- `463998b` - fix(neon-soul): move skill/README.md content to workflow, delete file
- `12cd1d9` - chore(neon-soul): bump version to 0.1.4

---

## Verification

```bash
# Verify file no longer exists
ls skill/
# Should show only: SKILL.md

# Verify ClawHub publish
clawhub inspect neon-soul
# Should show version 0.1.4
```

---

## Lessons Learned

1. **Minimal skill directory**: Only include `SKILL.md` and necessary config files (`.env.example`) in the skill directory. Documentation belongs in `docs/`.

2. **Security scan awareness**: ClawHub scans all files in the skill directory. Extraneous documentation files may trigger false positives.

3. **Consolidate docs**: Installation and publishing instructions belong in workflow documentation, not duplicated in multiple READMEs.

---

## Related Issues

- `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` - Previous security scan response
