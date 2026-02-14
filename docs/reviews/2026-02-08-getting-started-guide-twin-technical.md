# Getting Started Guide Review - Twin Technical

**Date**: 2026-02-08
**Reviewer**: twin-technical (Claude Opus 4.5)
**Focus**: Technical accuracy, architecture alignment, standards compliance, developer experience

---

## Verified Files

| File | Lines | MD5 (8 char) |
|------|-------|--------------|
| docs/guides/getting-started-guide.md | 465 | 4400faa6 |
| src/commands/synthesize.ts | 273 | 71cccabc |
| docker/docker-compose.yml | 110 | 6dacc3c1 |
| docker/docker-compose.ollama.yml | 45 | 99104c7e |
| scripts/setup-openclaw.sh | 273 | 9b84cf82 |

---

## Summary

**Status**: Approved with suggestions

The guide has been substantially improved since the N=2 code reviews. Critical issues identified by Gemini and Codex have been addressed:
- Repository URL updated to `live-neon/neon-soul` (line 235)
- Time estimate corrected to 30-45 minutes (line 4)
- Dual-path architecture (upstream vs dev stack) is now clearly explained
- CLI auto-detection implemented in synthesize.ts (lines 167-199)

Remaining issues are primarily documentation clarity and minor alignment concerns, not blocking technical problems.

---

## Issues Addressed Since N=2 Reviews

### Fixed

1. **Repository URL**: Updated from placeholder to `github.com/live-neon/neon-soul` (line 235)

2. **Time estimate**: Changed from ~15 minutes to 30-45 minutes with explanation (line 4)

3. **CLI LLM detection**: `synthesize.ts` now auto-detects Ollama (lines 167-199) rather than requiring skill context

4. **Skill vs CLI distinction**: Guide now clarifies terminal commands vs OpenClaw chat commands (lines 331-368, 427-431)

5. **Diary filename**: Changed from hardcoded date to `first-entry.md` (line 207)

---

## Issues Found

### Important (Should Fix)

#### I-1. Dockerfile references non-existent command
- **File**: docker/Dockerfile.neon-soul:42-45
- **Problem**: Health check references `dist/commands/extract-signals.js` which does not exist. Commands directory contains: `synthesize.ts`, `audit.ts`, `download-templates.ts`, `rollback.ts`, `status.ts`, `trace.ts`
- **Impact**: Container health check will fail if extraction profile is started
- **Suggestion**: Update to reference actual command, likely `dist/commands/synthesize.js`

#### I-2. Step ordering creates confusion
- **File**: docs/guides/getting-started-guide.md:76-84, 229-249
- **Problem**: Option B says "After cloning NEON-SOUL (Step 4), use our docker-compose" but Step 4 is NEON-SOUL installation which comes after Step 1 (OpenClaw installation). User following sequentially will be confused.
- **Impact**: Users may skip to Step 4 prematurely or not understand the dependency
- **Suggestion**: Reorder to: (1) Clone NEON-SOUL, (2) Run setup-openclaw.sh, (3) Create memory files, (4) Run synthesis. Or add explicit note: "If using Option B, skip to Step 4 first, then return here."

#### I-3. Step 4.5 anchor reference is broken
- **File**: docs/guides/getting-started-guide.md:288
- **Problem**: Links to `#optional-local-llm-with-ollama` but actual section is `Step 4.5: Start Ollama` (line 267). Anchor would be `#step-45-start-ollama`
- **Impact**: Users clicking the link see no navigation
- **Suggestion**: Update link to `#step-45-start-ollama` or add explicit anchor

#### I-4. Missing verification of OpenClaw container image
- **File**: docs/guides/getting-started-guide.md:88-100
- **Problem**: docker-compose.yml pins to `openclaw/openclaw:1.0.0` but this image may not exist on Docker Hub. No verification that the image is publicly available.
- **Impact**: `docker compose up` will fail if image doesn't exist
- **Confidence**: MEDIUM - cannot verify Docker Hub availability from this context
- **Suggestion**: Verify image exists on Docker Hub. If custom/mock image, document how to build or provide alternative.

### Minor (Nice to Have)

#### M-1. Architecture diagram omits Ollama
- **File**: docs/guides/getting-started-guide.md:19-30
- **Problem**: Diagram shows "Ollama (Docker)" but doesn't show it's optional for CLI vs required for chat interface
- **Suggestion**: Add annotation or note about when Ollama is required

#### M-2. setup-openclaw.sh next steps reference wrong script
- **File**: scripts/setup-openclaw.sh:272
- **Problem**: Final output says "Run: npx tsx scripts/test-pipeline.ts" but guide recommends `npx tsx src/commands/synthesize.ts --dry-run`
- **Impact**: Inconsistent messaging between script and guide
- **Suggestion**: Align both to use `synthesize.ts` command

#### M-3. Node 22+ requirement may exclude some users
- **File**: docs/guides/getting-started-guide.md:45
- **Problem**: Requires Node.js 22+ per package.json engines field, but many users have Node 20 LTS
- **Impact**: Setup failure with confusing engine compatibility error
- **Suggestion**: Add troubleshooting entry: "If you see engine compatibility errors, upgrade Node.js to 22+ (nvm install 22)"

#### M-4. Docker Compose output format outdated
- **File**: docs/guides/getting-started-guide.md:94-96
- **Problem**: Shows "Up (healthy)" but modern Docker Compose v2 shows "running" or "running (healthy)"
- **Impact**: Minor confusion for users comparing output
- **Suggestion**: Update expected output to match current Docker Compose v2 format

---

## Cross-Reference Verification

### synthesize.ts CLI Accuracy

| Guide Statement | Code Reality | Status |
|-----------------|--------------|--------|
| `--dry-run` flag | Supported (line 84-85) | Correct |
| `--force` flag | Supported (line 81-82) | Correct |
| `--verbose` flag | Supported (line 88-89) | Correct |
| Default memory path | `~/.openclaw/workspace/memory` | Correct |
| Default output path | `~/.openclaw/workspace/SOUL.md` | Correct |
| Ollama auto-detection | Yes, lines 175-181 | Correct |

### Docker Configuration Accuracy

| Guide Statement | docker-compose.yml | Status |
|-----------------|-------------------|--------|
| Web UI port 3000 | Line 37: "3000:3000" | Correct |
| API port 8080 | Line 38: "8080:8080" | Correct |
| Ollama port 11434 | docker-compose.ollama.yml:29 | Correct |
| Container name openclaw-dev | Line 34 | Correct |

### Workspace Structure

| Guide Structure | setup-openclaw.sh | Status |
|-----------------|-------------------|--------|
| memory/diary/ | Line 125 | Correct |
| memory/experiences/ | Line 126 | Correct |
| memory/goals/ | Line 127 | Correct |
| memory/knowledge/ | Line 128 | Correct |
| memory/relationships/ | Line 129 | Correct |
| memory/preferences/ | Line 130 | Correct |

---

## Alternative Framing Assessment

### Question: Is the dual-path approach (upstream vs dev stack) adding clarity or confusion?

**Assessment**: The dual-path approach is appropriate but could be clearer.

**Reasoning**:
1. **Upstream OpenClaw** (Option A): Complete chat integrations, production-like
2. **Dev Stack** (Option B): Minimal setup for NEON-SOUL development

The confusion arises because:
- Option B references Step 4 before Step 4 is reached
- Users don't know which path to choose without reading ahead

**Recommendation**: Add a decision tree at the start of Step 1:
```
Choose your path:
- Full OpenClaw features + chat integrations -> Option A
- Quick NEON-SOUL development setup -> Option B (recommended for this guide)
```

### Question: Are we solving the right problem?

**Assessment**: Partially. The guide solves "how to set up" but not "when to use which command."

The CLI (`synthesize.ts`) now works standalone with Ollama auto-detection. The skill commands (`/neon-soul status`) only work in OpenClaw chat. This distinction is mentioned but could be more prominent.

**Recommendation**: Add a "Command Reference" section early that explicitly states:
- Terminal commands (npx tsx...) - Use when developing/testing
- Chat commands (/neon-soul...) - Use when OpenClaw is your daily driver

---

## MCE Compliance

| Metric | Value | Limit | Status |
|--------|-------|-------|--------|
| Guide line count | 465 | 500 (docs) | Acceptable |
| synthesize.ts lines | 273 | 200 (code) | Over limit |
| setup-openclaw.sh lines | 273 | 200 (scripts) | Over limit |

**Note**: Code files exceed MCE 200-line limit. Not a documentation issue, but worth flagging for future refactoring.

---

## Confidence Levels

| Finding | Confidence | Reason |
|---------|------------|--------|
| Dockerfile extract-signals reference | HIGH | Direct file inspection confirms command doesn't exist |
| Step ordering confusion | HIGH | Sequential reading demonstrates issue |
| Anchor link broken | HIGH | Markdown anchor rules are deterministic |
| OpenClaw image availability | MEDIUM | Cannot verify Docker Hub from review context |
| Node 22 exclusion | MEDIUM | Based on ecosystem knowledge, not user data |

---

## Recommendations

### Immediate (before next version)

1. Fix Dockerfile health check reference (I-1)
2. Add note about Option B ordering or reorder steps (I-2)
3. Fix anchor link (I-3)

### Next Iteration

4. Verify OpenClaw Docker image availability (I-4)
5. Align setup-openclaw.sh output with guide commands (M-2)
6. Add Node.js upgrade troubleshooting entry (M-3)

### Consider

7. Add explicit decision tree for path selection
8. Refactor synthesize.ts to meet MCE limits (separate issue)

---

## Summary Table

| Category | Count |
|----------|-------|
| Critical | 0 |
| Important | 4 |
| Minor | 4 |
| Fixed since N=2 | 5 |

**Overall**: The guide is substantially improved and technically accurate for the happy path. The remaining issues are documentation clarity improvements, not blocking technical errors.

---

*Review completed 2026-02-08 by twin-technical (Claude Opus 4.5)*
