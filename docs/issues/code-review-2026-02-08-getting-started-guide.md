---
status: Open
priority: High
created: 2026-02-08
source: Code Review (N=2)
reviewers:
  - codex-gpt51-examiner
  - gemini-25pro-validator
affects:
  - docs/guides/getting-started-guide.md
  - scripts/setup-openclaw.sh
  - docker/docker-compose.yml
---

# Code Review: Getting Started Guide Findings

**Date**: 2026-02-08
**Source**: External Code Review (Codex + Gemini)
**Reviews**:
- `docs/reviews/2026-02-08-getting-started-guide-codex.md`
- `docs/reviews/2026-02-08-getting-started-guide-gemini.md`

---

## Summary

External code review identified **5 critical**, **5 important**, and **6 minor** issues. The guide documents an aspirational workflow that doesn't match current implementation, which would cause users to fail at multiple points.

**Core Problem**: Documentation describes polished features (skill commands, dry-run, auto-commit) that aren't fully implemented or require undocumented context to access.

**N-Count Verification**: "Aspirational documentation vs implementation" pattern verified as **N=2** (cross-referenced with `template-coverage-plan-vs-reality-audit.md` and `htmx-targeting-hell-vs-documented-methodology-gap.md`).

---

## Critical Issues (Blocks Users)

### CR-1: Placeholder Repository URL ✗

**Lines**: 233
**Codex**: ✓ | **Gemini**: ✓
**N-Count**: N=1 (specific to this guide)

**Problem**:
```bash
git clone https://github.com/your-org/neon-soul.git
```

**Impact**: Every user will fail at this step.

**Fix**: Update to future public URL with note:
```bash
# Repository will be available at:
git clone https://github.com/geeks-accelerator/neon-soul.git

# Note: Repository not yet public. For early access, contact maintainers.
```

**Effort**: 5 minutes

---

### CR-2: Skill Commands Shown as Terminal Commands ✗

**Lines**: 300-337, 411-417
**Codex**: ✓ | **Gemini**: ✓
**N-Count**: N=2 (terminal vs chat interface confusion - common UX pattern)

**Problem**: `/neon-soul status`, `/neon-soul trace`, etc. are OpenClaw skill commands executed in chat interfaces, NOT terminal commands. Guide presents them as shell commands.

**Impact**: Users will try running in terminal and fail.

**Fix**: Add explicit section explaining:
1. Setup commands (terminal) vs operation commands (chat interface)
2. Where to run skill commands (OpenClaw Control UI, Slack, Discord)
3. How to load the NEON-SOUL skill in OpenClaw

**Effort**: 30 minutes

---

### CR-3: Wrong Entry Point for Synthesis ✗

**Lines**: 262-296
**Codex**: ✓ | **Gemini**: ✓
**N-Count**: N=1 (specific to this guide)

**Problem**: `npx tsx scripts/test-pipeline.ts` is a developer testing tool that:
- Lacks `--dry-run` flag
- Requires undefined LLM provider
- Writes to `test-fixtures/souls/*`, not `~/.openclaw/workspace/`

**Impact**: First synthesis will either fail or write to wrong location.

**Fix Options**:
1. Document actual skill-based synthesis flow
2. Create user-facing CLI wrapper (longer term)
3. Clearly mark as "Developer Testing" section

**Effort**: 1 hour (option 1)

---

### CR-4: Non-existent Setup Script ✗

**Lines**: 62
**Codex**: ✓ | **Gemini**: -
**N-Count**: N=1 (specific to this guide)

**Problem**: Guide references `./docker-setup.sh` which doesn't exist.

**Available**: `scripts/setup-openclaw.sh`

**Fix**: Replace with correct path:
```bash
./scripts/setup-openclaw.sh
```

**Effort**: 5 minutes

---

### CR-5: Service Names/Ports Don't Match Docker Compose ✗

**Lines**: 88-105, 407-410, 431-434
**Codex**: ✓ | **Gemini**: -
**N-Count**: N=2 (documentation-reality drift - verified)

**Problem**: Guide documents:
- `openclaw-gateway` on port 18789
- Token retrieval via `openclaw-cli`

Actual `docker/docker-compose.yml` provides:
- `openclaw` service on ports 3000/8080
- No `openclaw-cli` or gateway services

**Fix**: Align with actual docker-compose.yml or document both approaches (upstream OpenClaw vs local development).

**Effort**: 30 minutes

---

## Important Issues

### IM-1: Manual Setup Uses Non-existent Services ⚠

**Lines**: 79-85, 104
**Codex**: ✓ | **Gemini**: -
**N-Count**: N=1

**Problem**: Manual setup instructions reference:
- `docker build -f Dockerfile .` (no Dockerfile at repo root)
- `openclaw-cli onboard` (not in our compose)
- `openclaw-gateway` service (we use `openclaw`)

**Fix**: Replace with instructions matching `docker/docker-compose.yml`.

**Effort**: 20 minutes

---

### IM-2: Hardcoded Workspace Path ⚠

**Lines**: 110
**Codex**: - | **Gemini**: ✓
**N-Count**: N=1

**Problem**: `~/.openclaw/workspace/` assumes default configuration.

**Fix**: Add note about `OPENCLAW_WORKSPACE` environment variable for custom paths.

**Effort**: 5 minutes

---

### IM-3: Hardcoded Date in Diary Filename ⚠

**Lines**: 204
**Codex**: - | **Gemini**: ✓
**N-Count**: N=1

**Problem**: `diary/2026-02-08.md` uses specific date.

**Fix**: Use generic `diary/first-entry.md` or instruct user to use current date.

**Effort**: 5 minutes

---

### IM-4: Unrealistic Time Estimate ⚠

**Lines**: 4
**Codex**: ✓ | **Gemini**: ✓
**N-Count**: N=1

**Problem**: "~15 minutes" doesn't account for:
- Docker image pulls
- npm install (includes @xenova/transformers ~30MB)
- Potential LLM model downloads

**Fix**: Update to "30-45 minutes (first run)" with breakdown.

**Effort**: 5 minutes

---

### IM-5: Ollama Setup Ordering ⚠

**Lines**: 371-387
**Codex**: - | **Gemini**: ✓
**N-Count**: N=1

**Problem**: Ollama setup at end, but `npm test` (line 243) may fail if E2E tests require LLM.

**Fix**: Clarify test requirements or move Ollama earlier.

**Effort**: 15 minutes

---

## Minor Issues

| ID | Issue | Lines | Fix |
|----|-------|-------|-----|
| MN-1 | Architecture diagram oversimplified | 9-30 | Add skill/LLM dependency |
| MN-2 | Heredoc memory files error-prone | 143-223 | Reference setup script |
| MN-3 | "Configure channels" lacks pointer | 391-397 | Add OpenClaw docs link |
| MN-4 | External links not verified | 440-445 | Validate all links |
| MN-5 | Docker status output shows "Up" not "running" | 94-96 | Update for modern compose |
| MN-6 | "npm test" may be slow for getting-started | 243 | Suggest smoke test |

---

## Alternative Framing (Both Reviewers)

**Unquestioned Assumptions**:

1. **Is OpenClaw actually required?**
   - Pipeline could work standalone with any LLM provider
   - Tight coupling may be premature

2. **Fresh install assumption**:
   - No "quick path" for existing OpenClaw users
   - Could skip Steps 1-3 for existing users

3. **Terminal-only workflow**:
   - Mixes shell and chat commands without distinction
   - Need explicit "Setup Phase (Terminal)" vs "Operation Phase (Chat)"

---

## Recommended Actions

### Phase 1: Critical Fixes (Immediate)

1. [ ] CR-1: Update repo URL with availability note
2. [ ] CR-4: Fix setup script path
3. [ ] CR-5: Align ports/services with actual docker-compose

### Phase 2: Structural Fixes (Before Publishing)

4. [ ] CR-2: Add "Terminal vs Chat Interface" section
5. [ ] CR-3: Document actual synthesis workflow or create CLI wrapper
6. [ ] IM-1: Fix manual setup instructions

### Phase 3: Polish (Before Publishing)

7. [ ] IM-2, IM-3: Fix hardcoded paths/dates
8. [ ] IM-4: Update time estimate
9. [ ] IM-5: Reorder Ollama section
10. [ ] MN-1 through MN-6: Minor improvements

### Phase 4: Consider (Optional)

11. [ ] Split guide: "OpenClaw Setup" + "NEON-SOUL Integration"
12. [ ] Add "Existing OpenClaw Users" quick path
13. [ ] Consider standalone mode documentation

---

## Verification Checklist

After addressing items, verify:

- [ ] All bash commands in guide can be copy-pasted and execute successfully
- [ ] All paths/files referenced exist in repository
- [ ] Skill commands clearly marked as chat interface commands
- [ ] Time estimate reflects actual first-run experience
- [ ] Links validated (internal and external)

---

## Cross-References

- **Codex Review**: `docs/reviews/2026-02-08-getting-started-guide-codex.md`
- **Gemini Review**: `docs/reviews/2026-02-08-getting-started-guide-gemini.md`
- **Related Observation (N=2)**: `docs/observations/template-coverage-plan-vs-reality-audit.md` (plan vs reality drift)
- **Related Observation (N=2)**: `docs/observations/htmx-targeting-hell-vs-documented-methodology-gap.md` (methodology gap)
- **Twin Review Issue**: `docs/issues/twin-review-2026-02-08-consolidated.md` (documentation drift N=2)
- **Docker README**: `docker/README.md`
- **Setup Script**: `scripts/setup-openclaw.sh`

---

## Priority Order (Suggested)

| Priority | Items | Total Effort |
|----------|-------|--------------|
| Immediate | CR-1, CR-4, CR-5, IM-4 | ~45 min |
| High | CR-2, CR-3, IM-1 | ~2 hours |
| Medium | IM-2, IM-3, IM-5 | ~25 min |
| Low | MN-1 to MN-6 | ~1 hour |

**Total Estimated Effort**: ~4 hours

---

*Issue created 2026-02-08 from N=2 cross-architecture code review.*
