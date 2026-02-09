---
status: Resolved
priority: Medium
created: 2026-02-08
resolved: 2026-02-08
source: Twin Review (N=2)
reviewers:
  - twin-technical
  - twin-creative
affects:
  - docs/guides/getting-started-guide.md
  - docker/Dockerfile.neon-soul
  - scripts/setup-openclaw.sh
---

# Twin Review: Getting Started Guide Findings

**Date**: 2026-02-08
**Source**: Internal Twin Review (Technical + Creative)
**Reviews**:
- `docs/reviews/2026-02-08-getting-started-guide-twin-technical.md`
- `docs/reviews/2026-02-08-getting-started-guide-twin-creative.md`

---

## Summary

Twin review identified **0 critical**, **6 important**, and **7 minor** issues. The guide is functional and substantially improved since the N=2 code review, but has UX clarity issues and one infrastructure bug.

**Status**: Approved with suggestions - guide works for happy path but has navigation and onboarding gaps.

---

## N-Count Verification

### N=3 Verified (Cross-Architecture + Twin)

| Issue | Sources | Confidence |
|-------|---------|------------|
| Architecture diagram incomplete | Codex, Gemini, Twin Technical | HIGH |

### N=2 Verified (Both Twins)

| Issue | Sources | Confidence |
|-------|---------|------------|
| Broken anchor link | Twin Technical (I-3), Twin Creative (I-5) | HIGH |
| Step ordering confusion | Twin Technical (I-2), Twin Creative (I-4) | HIGH |

### N=1 Items (Verified for Elevation)

| Issue | Source | Elevation Check | Result |
|-------|--------|-----------------|--------|
| Value proposition buried | Creative | No prior mentions | N=1 (valid UX issue) |
| Soul terminology undefined | Creative | No prior mentions | N=1 (valid UX issue) |
| Memory examples prescriptive | Creative | Related to MN-2 (heredocs) | N=1.5 (related pattern) |
| Dockerfile extract-signals.js | Technical | No prior mentions | N=1 (infrastructure bug) |
| OpenClaw image unverified | Technical | No prior mentions | N=1 (needs verification) |
| setup-openclaw.sh wrong command | Technical | No prior mentions | N=1 (consistency issue) |
| Node 22+ troubleshooting | Technical | No prior mentions | N=1 (DX improvement) |

---

## Important Issues

### TR-1: Broken Anchor Link (N=2) ✗

**Lines**: 288-289
**Technical**: I-3 | **Creative**: I-5

**Problem**: Step 5 references `#optional-local-llm-with-ollama` but this section doesn't exist. Actual section is Step 4.5.

**Impact**: Users clicking the link see no navigation.

**Fix**:
```markdown
# Before
(see [Optional: Local LLM with Ollama](#optional-local-llm-with-ollama))

# After
(see [Step 4.5: Start Ollama](#step-45-start-ollama-required-for-cli))
```

**Effort**: 5 minutes

---

### TR-2: Step Ordering Confusion (N=2) ⚠

**Lines**: 76-84, 267-283
**Technical**: I-2 | **Creative**: I-4

**Problem**:
- Option B says "After cloning NEON-SOUL (Step 4)" but Step 4 comes later
- Step 4.5 numbering suggests afterthought, unclear which path needs it

**Impact**: Users following sequentially will be confused about dependencies.

**Fix**: Add decision gate at start of Step 1:
```markdown
## Choose Your Path

| Path | When to Use | Steps |
|------|-------------|-------|
| Option A (Upstream) | Full OpenClaw with chat integrations | 1A → 2 → 3 → 4 → 5 → 6 |
| Option B (Dev Stack) | Quick NEON-SOUL development | 4 → 1B → 2 → 3 → 4.5 → 5 → 6 |
```

**Effort**: 20 minutes

---

### TR-3: Value Proposition Buried (N=1) ⚠

**Lines**: 1-17
**Creative**: I-1

**Problem**: Guide jumps to "what you'll do" without explaining "why you'd want to." Stated audience is "Developers new to OpenClaw or NEON-SOUL" but assumes they know the value.

**Fix**: Add after Overview:
```markdown
## Why NEON-SOUL?

Most AI assistants are black boxes - their personality changes, but you never know why.
NEON-SOUL provides **provenance tracking**: every belief your AI develops traces back to
specific lines in your memory files. When your AI says "I prefer direct communication,"
you can ask "where did that come from?" and get a real answer.
```

**Effort**: 10 minutes

---

### TR-4: Soul Terminology Undefined (N=1) ⚠

**Lines**: 3, 16, 17, 121, 313-328
**Creative**: I-2

**Problem**: "Soul" appears repeatedly but is never defined. Developers may find it unclear.

**Fix**: Add to "Why NEON-SOUL?" section:
```markdown
**What is a "soul"?** In OpenClaw, `SOUL.md` is the identity document that tells your AI
who it is. NEON-SOUL generates this file by extracting signals from your memory files -
turning scattered preferences and reflections into coherent axioms your AI can use.
```

**Effort**: 5 minutes

---

### TR-5: Dockerfile Health Check Bug (N=1) ✗

**File**: docker/Dockerfile.neon-soul:42-45
**Technical**: I-1

**Problem**: Health check references `dist/commands/extract-signals.js` which does not exist. Available commands: `synthesize.ts`, `audit.ts`, `download-templates.ts`, `rollback.ts`, `status.ts`, `trace.ts`.

**Impact**: Container health check will fail if extraction profile is started.

**Fix**: Update health check to reference `dist/commands/synthesize.js`

**Effort**: 5 minutes

---

### TR-6: Memory Examples Feel Prescriptive (N=1.5) ⚠

**Lines**: 149-225
**Creative**: I-3 | **Related**: Code Review MN-2 (heredocs)

**Problem**: Example files contain specific values ("prioritize honesty over comfort"). New users may wonder if they need to share these values.

**Fix**: Add note before examples:
```markdown
> The examples below illustrate the format. Your memory files should reflect
> *your* actual preferences and values - there's no "correct" content.
```

**Effort**: 5 minutes

---

## Minor Issues

| ID | Issue | Source | Lines | Fix |
|----|-------|--------|-------|-----|
| MN-1 | Architecture diagram omits Ollama requirement details | Technical | 19-30 | Add annotation when Ollama required |
| MN-2 | setup-openclaw.sh shows wrong next-steps command | Technical | script:272 | Align to `synthesize.ts` |
| MN-3 | Node 22+ requirement needs troubleshooting | Technical | 45 | Add upgrade note |
| MN-4 | OpenClaw image `1.0.0` unverified on Docker Hub | Technical | 88-100 | Verify or document build |
| MN-5 | Time estimate could break down components | Creative | 4 | Add Docker/npm/LLM times |
| MN-6 | Resources section mixes internal/external | Creative | 454-462 | Group by type |
| MN-7 | Diary entry date comment inconsistent | Creative | 206-207 | Remove date comment |

---

## Recommended Actions

### Phase 1: Critical Fixes ✅

1. [x] TR-1: Fix broken anchor link
2. [x] TR-5: Fix Dockerfile health check reference

### Phase 2: UX Improvements ✅

3. [x] TR-2: Add decision gate / path clarity
4. [x] TR-3: Add "Why NEON-SOUL?" section
5. [x] TR-4: Define soul terminology
6. [x] TR-6: Add note about example values

### Phase 3: Polish ✅

7. [x] MN-1: Add Ollama requirement annotation
8. [x] MN-2: Fix setup-openclaw.sh next-steps command
9. [x] MN-3: Add Node.js upgrade troubleshooting
10. [x] MN-4: Add image troubleshooting entry
11. [x] MN-5: Break down time estimates
12. [x] MN-6: Group resources by internal/external
13. [x] MN-7: Fix diary entry comment

---

## Verification Checklist

After addressing items, verify:

- [x] Broken anchor link fixed and navigates correctly
- [x] Dockerfile health check passes
- [x] New user understands value proposition within first 30 seconds
- [x] Path selection is clear before Step 1

---

## Cross-References

- **Technical Review**: `docs/reviews/2026-02-08-getting-started-guide-twin-technical.md`
- **Creative Review**: `docs/reviews/2026-02-08-getting-started-guide-twin-creative.md`
- **Prior Code Review Issue**: `docs/issues/code-review-2026-02-08-getting-started-guide.md` (resolved)
- **Codex Review**: `docs/reviews/2026-02-08-getting-started-guide-codex.md`
- **Gemini Review**: `docs/reviews/2026-02-08-getting-started-guide-gemini.md`

---

## Priority Order

| Priority | Items | Total Effort |
|----------|-------|--------------|
| Phase 1 | TR-1, TR-5 | ~10 min |
| Phase 2 | TR-2, TR-3, TR-4, TR-6 | ~40 min |
| Phase 3 | MN-1 through MN-7 | ~30 min |

**Total Estimated Effort**: ~1.5 hours

---

*Issue created 2026-02-08 from N=2 twin review.*
*Resolved 2026-02-08: All phases complete.*

---

## Resolution Summary

**All items addressed**:

| Phase | Items | Status |
|-------|-------|--------|
| Phase 1 | TR-1 (anchor link), TR-5 (Dockerfile) | ✅ Complete |
| Phase 2 | TR-2, TR-3, TR-4, TR-6 (UX improvements) | ✅ Complete |
| Phase 3 | MN-1 through MN-7 (polish) | ✅ Complete |

**Key Changes**:
1. Fixed broken anchor link to Ollama section
2. Fixed Dockerfile health check to use `synthesize.js`
3. Added "Why NEON-SOUL?" section with soul terminology
4. Added "Choose Your Path" decision gate
5. Added note about example values being format illustrations
6. Updated setup-openclaw.sh with correct next-steps
7. Various polish items (time breakdown, resources grouping, troubleshooting)
