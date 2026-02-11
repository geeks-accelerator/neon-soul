# ClawHub Deployment Plan - Technical Review

**Date**: 2026-02-10
**Reviewer**: Twin 1 (Technical Infrastructure)
**Plan**: `docs/plans/2026-02-10-clawhub-deployment.md`
**Status**: Approved with suggestions

---

## Verified Files

| File | Lines | MD5 (8 char) | Status |
|------|-------|--------------|--------|
| docs/plans/2026-02-10-clawhub-deployment.md | 622 | (verified) | Primary |
| docs/reviews/2026-02-10-clawhub-deployment-codex.md | 106 | (verified) | Cross-ref |
| docs/reviews/2026-02-10-clawhub-deployment-gemini.md | 151 | (verified) | Cross-ref |
| docs/plans/2026-02-10-pbd-alignment.md | 1643 | (verified) | Cross-ref |
| docs/plans/2026-02-10-meta-axiom-synthesis.md | 391 | (verified) | Cross-ref |
| package.json | 63 | (verified) | Implementation |
| skill/SKILL.md | 268 | (verified) | Implementation |
| docker/Dockerfile.neon-soul | 46 | (verified) | Implementation |
| docker/docker-compose.yml | 111 | (verified) | Implementation |

---

## Executive Summary

The deployment plan is well-structured and shows thorough integration of code review findings. The OpenClaw-only v0.1.0 strategy is a sound architectural decision that reduces scope while maintaining clear upgrade paths. The plan demonstrates good engineering judgment in deferring Docker (Stage 5) and documenting multi-stage build fixes for future implementation.

**Recommendation**: Proceed with implementation. Minor suggestions below.

---

## Strengths

### 1. Comprehensive Code Review Integration

The plan shows mature process discipline. All 15 findings from Codex and Gemini reviews are cataloged (lines 597-614) with clear resolution status. This is exactly how review feedback should be handled.

Notable resolutions:
- **CR-C1/C2**: Docker fixes documented for when Stage 5 resumes
- **CR-I5**: Rollback strategy updated from "unpublish first" to "patch first"
- **CR-I6**: npm name verification promoted to CRITICAL Step 1

### 2. Clean Architecture Decision

The OpenClaw-only v0.1.0 strategy (lines 50-70) correctly scopes the release:

```
Option A: OpenClaw LLM Only (v0.1.0)
- LLM provided by OpenClaw context
- No external API keys needed
- Clear error: LLMRequiredError without context
```

This is better than shipping partial Ollama support. The plan explicitly documents the constraint (lines 136-138, 395-406) and future upgrade path (v0.2.0 Ollama, v0.3.0 API keys).

### 3. Stage Structure

Seven stages with clear dependencies, time estimates, and acceptance criteria. Good practices observed:

- Stage 1 front-loads risk (npm name availability check)
- Stage 5 deferred but fully documented (not abandoned)
- Stage 7 end-to-end verification closes the loop
- Total time estimate (2.5 hours) is realistic

### 4. Documentation-Update Workflow Integration

Stage 6 correctly references `docs/workflows/documentation-update.md` and follows the systematic update pattern. This maintains consistency with the broader multiverse methodology.

---

## Issues Found

### Important (Should Fix)

#### I1: Dockerfile Still Has Build Order Bug

**File**: `docker/Dockerfile.neon-soul:22-31`
**Lines**: The Dockerfile runs `npm ci --only=production` then `npm run build`

```dockerfile
RUN npm ci --only=production
...
RUN npm run build  # TypeScript is devDep - this fails!
```

**Problem**: TypeScript is a devDependency (package.json:48). Build will fail because `tsc` won't be installed.

**Status**: The plan documents this as CR-C2 (line 309-327) with multi-stage build solution. However, the actual fix is not yet applied to the Dockerfile.

**Recommendation**: Either:
1. Apply the multi-stage build fix now (before Stage 5), OR
2. Add explicit note that Dockerfile is known-broken until Stage 5

**Confidence**: HIGH - verified by reading both files.

#### I2: Rollback Plan Still Mentions Unpublish First

**File**: `docs/plans/2026-02-10-clawhub-deployment.md:485-500`

The plan shows:
```markdown
**Primary rollback** (preferred):
1. **npm**: Publish patch version (0.1.1) with fix or revert
...

**Emergency rollback** (security/legal issues only):
1. **npm**: `npm unpublish neon-soul@0.1.0`
```

This is correct structure. However, line 489 says "Prefer patch releases over unpublish" but the section header (line 485) says "Primary rollback" - this could be clearer that patch is the default, unpublish is emergency-only.

**Recommendation**: Minor wording clarification for operational clarity.

**Confidence**: MEDIUM - interpretive, but operational clarity matters.

#### I3: Missing Version in SKILL.md Frontmatter

**File**: `skill/SKILL.md`

The SKILL.md frontmatter (lines 1-14) lacks a `version:` field. Plan Stage 1 checklist (line 113) asks to verify version is present, but it currently is not.

**Current frontmatter**:
```yaml
name: NEON-SOUL
description: AI Identity Through Grounded Principles
homepage: https://liveneon.ai
user-invocable: true
emoji: [emoji]
tags:
  - soul-synthesis
  ...
```

**Recommendation**: Add `version: 0.1.0` to SKILL.md frontmatter before Stage 1 execution.

**Confidence**: HIGH - verified by reading SKILL.md.

### Minor (Nice to Have)

#### M1: Ollama Version in docker-compose.yml

**File**: `docker/docker-compose.yml:82`

```yaml
ollama:
  image: ollama/ollama:latest  # Should be pinned
```

**Status**: Plan documents this as CR-M1 (line 329). Not blocking since Stage 5 is deferred.

#### M2: Node 22 Adoption Limitation

**File**: `package.json:51-52`

```json
"engines": {
  "node": ">=22.0.0"
}
```

Node 22 became active LTS on 2025-10-28, so by 2026-02 this is reasonable. The plan correctly notes this in Risk Assessment (line 512). No action needed.

#### M3: Cross-Reference to Nonexistent Reviews Directory

**File**: Plan lines 592-594 reference:
```markdown
- `docs/reviews/2026-02-10-clawhub-deployment-codex.md`
- `docs/reviews/2026-02-10-clawhub-deployment-gemini.md`
```

These files exist in the project, verified by glob pattern match. Correct.

---

## Architecture Assessment

### OpenClaw-Only Strategy: Correct Choice

The decision to require OpenClaw LLM context aligns with:

1. **MVP Philosophy**: Ship a working product for one platform, expand later
2. **Dependency Reduction**: No API key management in v0.1.0
3. **Error Clarity**: `LLMRequiredError` is better than undefined behavior

The plan correctly positions npm as "for OpenClaw skill developers" (line 136-138), not standalone use.

### Stage Dependencies: Well-Structured

```
Stage 1 (checklist) -> Stage 2 (npm) -> Stage 3 (ClawHub token) -> Stage 4 (ClawHub)
                                                                         |
                                        Stage 5 (Docker - deferred) <----+
                                                                         |
Stage 6 (docs) <---------------------------------------------------------+
                                                                         |
Stage 7 (verification) <-------------------------------------------------+
```

This is a good structure. Stage 5 deferral doesn't block other stages.

### Docker Multi-Stage Build: Correct Solution

The documented fix (lines 310-327) is the right approach:

```dockerfile
# Stage 1: Build
FROM node:22-slim AS builder
RUN npm ci  # All deps including dev
RUN npm run build

# Stage 2: Production
FROM node:22-slim
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
```

This separates build-time needs (TypeScript) from runtime needs (production deps only).

---

## Cross-Reference Analysis

### PBD Alignment Plan (2026-02-10-pbd-alignment.md)

The deployment plan references PBD alignment (line 564) as related but not prerequisite. This is correct - deployment can proceed with current synthesis implementation.

However, note that PBD alignment adds provenance tracking and anti-echo-chamber features that would enhance SOUL.md quality. The deployment plan's "Operator Experience" documentation should eventually reference these.

### Meta-Axiom Synthesis Plan (2026-02-10-meta-axiom-synthesis.md)

Meta-axiom synthesis depends on PBD alignment. Deployment plan correctly identifies this as future enhancement (line 525: "Update issue if meta-axiom synthesis is included").

**Recommendation**: Post-deployment, update ClawHub skill page to mention roadmap items.

### Code Review Findings

Both Codex and Gemini reviews were comprehensive. The plan addresses:
- 2 Critical issues (Docker Node version, build order)
- 6 Important issues (bin field, CMD mismatch, LLM strategy, etc.)
- 5 Minor issues (Ollama pinning, username placeholder, etc.)

The consolidation table (lines 597-614) is excellent documentation.

---

## MCE Compliance Check

| Criterion | Status | Notes |
|-----------|--------|-------|
| Plan length | 622 lines | Exceeds 300-400 standard, justified by review integration |
| Single focus | Pass | Deployment only |
| Clear stages | Pass | 7 stages with time estimates |
| Acceptance criteria | Pass | Every stage has criteria |
| Cross-references | Pass | Links to related plans |

The plan length is justified by the Code Review Findings section (lines 589-614) which adds ~100 lines of essential traceability.

---

## Risk Assessment Completeness

The plan covers key risks (lines 505-515):

| Risk | Covered | Assessment |
|------|---------|------------|
| npm name collision | Yes | CRITICAL step 1 |
| ClawHub rejection | Yes | SKILL.md format review |
| LLM confusion | Yes | Documentation emphasis |
| Version conflicts | Yes | Semver noted |
| Security exposure | Yes | Secret review step |
| Node 22 adoption | Yes | Accepted limitation |
| Docker failures | Yes | Stage 5 deferred |

**Missing risk**: What if ClawHub API/CLI changes between plan and execution? Consider pinning ClawHub CLI version if available.

---

## Alternative Framing: Are We Solving the Right Problem?

The request asked to consider "what assumptions go unquestioned."

### Assumption 1: ClawHub is the Right Platform

The plan assumes ClawHub and agentskills.io exist and are stable. Given the 2026 date and explicit URLs, this appears grounded. However, the plan lacks a fallback if ClawHub has API changes or goes down.

**Mitigation already present**: The "Any LLM Agent (Copy/Paste)" method (line 403-406) works without ClawHub.

### Assumption 2: npm Package is Valuable

Given that the npm package requires OpenClaw context, is npm publication actually useful for v0.1.0?

**Analysis**: Yes. OpenClaw skill developers can import `neon-soul` as a dependency for integration. The skill-entry export (package.json lines 11-15) is correctly structured for this use case.

### Assumption 3: v0.1.0 Timing is Right

The plan doesn't justify why now. Given that:
- 57+ tests pass (line 36)
- Website deployed (line 37)
- OpenClaw integration complete (line 563)

The timing appears appropriate. The core product is ready; deployment is the natural next step.

---

## Recommendations Summary

### Required Before Stage 1

1. **Add version to SKILL.md frontmatter** - `version: 0.1.0`

### Recommended During Implementation

2. **Clarify rollback language** - Make "patch first" more prominent
3. **Consider Dockerfile pre-fix** - Apply multi-stage build now, not waiting for Stage 5

### Post-Deployment

4. **Update roadmap** - Add PBD and meta-axiom to public roadmap
5. **Pin ClawHub CLI version** - When documenting installation

---

## Approval

**Status**: Approved with suggestions

The plan is ready for implementation. The OpenClaw-only strategy is correct, code review integration is exemplary, and stage structure is sound. Minor documentation improvements noted above can be addressed during implementation.

---

*Review by Twin 1 (Technical Infrastructure), 2026-02-10*
