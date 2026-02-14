# Code Review Issue: Interview CLI Integration Plan

**Created**: 2026-02-09
**Updated**: 2026-02-09
**Status**: ✅ Resolved
**Priority**: Medium
**Source**: Code review synthesis (N=2 external)
**Reviews**:
- `docs/reviews/2026-02-09-interview-cli-plan-codex.md`
- `docs/reviews/2026-02-09-interview-cli-plan-gemini.md`
**Context**: `output/context/2026-02-09-interview-cli-plan-context.md`
**Plan**: `projects/live-neon/neon-soul/docs/plans/2026-02-09-interview-cli-integration.md`

---

## Summary

External code review (Codex + Gemini) of the Interview CLI Integration + Landing Page Demo plan. Both reviewers found the plan addresses real UX problems but has critical architectural gaps that would cause the core flow to fail.

**Codex**: 2 critical, 4 important, 1 minor
**Gemini**: 2 critical, 4 important, 4 minor

---

## N=2 Verified (Both Reviewers Flagged)

### 1. Threshold Gating Blocks Post-Interview Synthesis

**Codex**: Pipeline skips when content delta < 2000 chars
**Gemini**: Cold start vs no-LLM conflation - both cause skip

**Verification**: `src/lib/pipeline.ts:73` confirms `contentThreshold: 2000` and line 382 checks delta. If interview responses total <2000 chars delta, synthesis still skips.

**Impact**: Core user flow broken - users complete interview, synthesis still skips.

**Resolution**:
- [ ] After writing interview memory file, call `synthesize` with `--force` flag explicitly
- [ ] OR modify threshold check to recognize "fresh interview" state (e.g., bypass threshold on first run)
- [ ] OR ensure interview generates enough content (14 questions * 150 chars avg = 2100 chars minimum)

**Location**: `src/lib/pipeline.ts:356-384`, Plan Stage 3

---

### 2. LLM/Embedding Dependencies During Interview

**Codex**: Embedding model cold-start latency (10-30s model download)
**Gemini**: LLM required during interview defeats cold-start purpose

**Verification**: `src/lib/interview.ts:251` calls `embed()` during `extractSignals()`. However, embeddings use local Xenova model (`src/lib/embeddings.ts:9`), not Ollama. The interview CAN collect responses without any external dependency - extraction happens afterward.

**Clarification**:
- Question asking: No LLM needed
- Signal extraction: Local embeddings (Xenova) - downloads ~90MB on first run
- Full synthesis: LLM (Ollama) required for semantic classification

**Resolution**:
- [ ] Add progress indicator during embedding model initialization
- [ ] Consider pre-warming embeddings during interview (lazy load before extraction)
- [ ] Document dependency matrix clearly in plan

**Location**: `src/lib/embeddings.ts:17-49`, `src/lib/interview.ts:251`

---

### 3. Architectural Duplication Risk

**Codex**: (Implicit) Separate CLI and synthesize integration
**Gemini**: Stage 1 (standalone CLI) and Stage 3 (synthesize integration) duplicate logic

**Verification**: Plan creates two entry points with similar readline, progress, session handling needs.

**Resolution**:
- [ ] Build single `InterviewService` module
- [ ] Stage 1: Thin CLI wrapper around InterviewService
- [ ] Stage 3: Synthesize calls InterviewService when content below threshold

**Location**: Plan Stages 1, 3

---

### 4. Interview Storage Format Mismatch

**Codex**: `source-collector.ts` expects JSON in `workspace/interviews/`
**Gemini**: (Implicit via recording format concerns)

**Verification**:
- `src/lib/interview.ts:264` sets `source.type: 'interview'`
- `src/lib/interview.ts:392` filters by `s.source.type === 'interview'`
- Plan writes markdown to `memory/onboarding/` which would be treated as memory, not interview
- Grep for `workspace/interviews` found **no matches** - this path doesn't exist

**Analysis**: Interview signals set `source.type: 'interview'`, but if stored as markdown in `memory/`, the source-collector will read them as memory files with `source.type: 'memory'`. Coverage tracking will be incorrect.

**Resolution** (choose one):
- [ ] **Option A**: Write interview JSON to `.neon-soul/interviews/` (new path) and update source-collector
- [ ] **Option B**: Write to `memory/onboarding/` as markdown, accept that `analyzeCoverage()` won't distinguish interview vs memory signals
- [ ] **Option C**: Embed interview metadata in markdown frontmatter, update source-collector to detect it

**Location**: Plan Stage 2, `src/lib/interview.ts:389-401`

---

## Critical (N=1 - Verified)

### 5. Interactive Prompts Incompatible with Skill Path

**Source**: Codex only
**Verification**: `src/commands/synthesize.ts:211` - `run()` function is non-interactive entry point for OpenClaw skills. Adding readline prompts would hang automated callers.

**Resolution**:
- [ ] `main()` handles CLI-only interactive flow (prompts OK)
- [ ] `run()` remains pure/non-interactive for skill usage (no prompts)
- [ ] Add `interactiveMode` flag to separate paths

**Location**: `src/commands/synthesize.ts:167-200` (main), `src/commands/synthesize.ts:211-268` (run)

---

### 6. Stage 4 Ambiguity

**Source**: Gemini only
**Verification**: Stage 4 says "enhance existing" but `src/lib/interview.ts:165-196` already has complete `persistSession()` and `loadSessionFromDisk()` methods.

**Analysis**: Persistence is already implemented. What's actually needed?
- Resume detection? (Check for existing session file)
- Session expiry/cleanup?
- Version compatibility on question bank changes?

**Resolution**:
- [ ] Either delete Stage 4 (persistence already exists)
- [ ] OR redefine Stage 4 with specific gaps: "Add session resumption detection, expiry after 7 days, version checking"

**Location**: Plan Stage 4, `src/lib/interview.ts:165-196`

---

## Important (N=1 - Verified)

### 7. Coverage-Based Question Selection Has No Cold-Start Path

**Source**: Codex only
**Verification**: `src/lib/interview.ts:44` requires coverage input. `analyzeCoverage()` at line 375 expects prior signals. Cold-start has no signals to analyze.

**Resolution**:
- [ ] When no prior signals exist, use "all-dimensions" mode (skip coverage filtering)
- [ ] Or run lightweight scan of memory files to estimate sparse dimensions without full signal extraction

**Location**: `src/lib/interview.ts:44-49`, `src/lib/interview.ts:375-403`

---

### 8. High-Friction UX Assumption

**Source**: Gemini only
**Verification**: Plan proposes 7-14 questions before users see any value. Question bank has 14 required questions (verified: `grep "required: true"` = 14 matches).

**Alternative Approaches** (from review):
1. **Quick-start interview**: 3-5 essential questions for viable first synthesis, full interview as optional deep-dive
2. **Memory seeding from URL/file**: `--seed-from-url https://blog.example.com/about`
3. **Sample persona demo**: Ship pre-populated memory, users see output immediately

**Resolution**:
- [ ] Consider A/B testing quick-start (3-5 questions) vs full interview
- [ ] OR mark only 7 questions as required (1 per dimension) instead of 14

**Location**: Plan premise, `src/lib/question-bank.ts`

---

### 9. Tight Coupling in Recording Format

**Source**: Gemini only
**Verification**: Plan Stage 6 embeds full pipeline structure in recording JSON. Any refactoring breaks landing page.

**Resolution**:
- [ ] Version the recording format (`"version": "1.0"`)
- [ ] Use event stream pattern (`question_asked`, `answer_provided`, `signal_extracted`)
- [ ] Decouple demo from implementation details

**Location**: Plan Stage 6 (lines 291-329)

---

### 10. PII/Consent for Demo Recording

**Source**: Codex only
**Verification**: Plan doesn't address consent or sanitization for recorded interview content.

**Resolution**:
- [ ] Add consent prompt before recording (`--record` flag should warn)
- [ ] Add PII sanitization pass before export
- [ ] Document that demo uses reviewed/approved recordings only

**Location**: Plan Stage 6

---

## Minor

### 11. Session Persistence Lacks Versioning

**Source**: Codex only

**Resolution**:
- [ ] Add version field to session JSON
- [ ] Implement session expiry (e.g., 7 days)
- [ ] Handle question bank version mismatch gracefully

**Location**: `src/lib/interview.ts:165`

---

### 12. Question Count Mismatch

**Source**: Gemini only
**Verification**: Stage 1 proposes `--questions` flag with default 7, but 14 questions are marked required.

**Resolution**:
- [ ] Clarify: is 7 the minimum viable or the default recommendation?
- [ ] If 7 is default, ensure one question per dimension for coverage

**Location**: Plan Stage 1

---

### 13. Landing Page Demo Over-Scoped

**Source**: Gemini only

**Recommendation**: Stage 7 (three-column animated demo with typewriter, floating bubbles, clustering) is significant scope. Consider:
- [ ] Start with static transcript, add animation later
- [ ] OR split Stage 7 into separate plan

**Location**: Plan Stage 7

---

### 14. Missing Error Handling Specification

**Source**: Gemini only

**Resolution**:
- [ ] Specify Ctrl+C behavior (graceful save, option to resume)
- [ ] Specify disk write failure handling
- [ ] Specify network timeout handling for embedding model download

**Location**: Plan (all stages)

---

## Alternative Approaches to Consider

Both reviewers questioned whether interview is the right solution:

| Approach | Friction | Implementation Effort |
|----------|----------|----------------------|
| Full interview (current plan) | High (7-14 questions) | Medium |
| Quick-start interview (3-5 questions) | Medium | Low (subset of current) |
| Memory seeding from URL | Low | Medium (new feature) |
| Sample persona demo | Zero | Low (ship sample files) |
| Standalone interview + `--force` | Medium | Low (simpler architecture) |

**Recommendation**: Consider quick-start interview (3-5 questions) as MVP, full interview as optional deep-dive.

---

## Resolution Checklist

### Critical (Block Implementation)
- [x] Threshold gating: Add `--force` after interview (Stage 3)
- [x] CLI/Skill separation: Eliminated via chat-first approach
- [x] Clarify Stage 4: Replaced with OpenClaw session context

### Important (Fix in Plan Update)
- [x] Create shared InterviewService: Eliminated via single chat path
- [x] Define storage format: Markdown to `memory/onboarding/` (Stage 2)
- [x] Add cold-start path for coverage analysis: 7 questions, 1 per dimension (Stage 4)
- [x] Consider UX friction: Reduced to 7 questions
- [x] Version recording format, add PII handling (Stage 6)

### Minor (Address During Implementation)
- [x] Session versioning and expiry: Using OpenClaw session context
- [x] Question count clarity: 7 for quick-start (Stage 4)
- [x] Error handling specification (Stage 3)
- [x] Consider splitting Stage 7: Added complexity note

---

## Cross-References

- **Plan**: `docs/plans/2026-02-09-interview-cli-integration.md`
- **Codex Review**: `docs/reviews/2026-02-09-interview-cli-plan-codex.md`
- **Gemini Review**: `docs/reviews/2026-02-09-interview-cli-plan-gemini.md`
- **Context**: `output/context/2026-02-09-interview-cli-plan-context.md`
- **Related Files**:
  - `src/types/interview.ts` - Interview types (complete)
  - `src/lib/interview.ts` - Interview flow (complete, persistence exists)
  - `src/lib/question-bank.ts` - 28 questions, 14 required
  - `src/commands/synthesize.ts` - Needs CLI/skill separation
  - `src/lib/pipeline.ts` - Threshold logic at line 356-384
  - `src/lib/embeddings.ts` - Local Xenova model, 90MB download

---

---

## Plan Update (2026-02-09)

Plan was updated to **chat-first approach** based on user insight: NEON-SOUL runs as an OpenClaw skill via chat (Telegram, Discord, etc.), so the interview should happen naturally in chat, not via CLI readline prompts.

### Issues Resolved by Chat-First Approach

| Issue | Original | Resolution |
|-------|----------|------------|
| Critical #5 | Interactive prompts break skill path | **Eliminated** - only chat path exists |
| Critical #6 | Stage 4 ambiguity (persistence exists) | **Replaced** - use OpenClaw session context |
| Important #3 | Architectural duplication | **Eliminated** - single code path |
| Important #8 | High-friction UX (14 questions) | **Reduced** - 7 questions (1 per dimension) |
| Minor #12 | Question count mismatch | **Clarified** - 7 for quick-start |

### All Issues Resolved

| Issue | Resolution |
|-------|------------|
| Critical #1 | ✅ Threshold gating: `--force` after interview (Stage 3) |
| Critical #2 | ✅ Embedding cold-start: progress indicator + error handling (Stage 3) |
| Important #4 | ✅ Storage format: markdown to `memory/onboarding/` (Stage 2) |
| Important #9 | ✅ Recording format: versioned JSON (Stage 6) |
| Important #10 | ✅ PII handling: curated demo data (Stage 6) |
| Minor | ✅ Error handling specification (Stage 3) |
| Minor | ✅ Stage 7 complexity note added |

### What Changed

| Original Plan | Updated Plan |
|---------------|--------------|
| Stage 1: Standalone CLI command | Removed - not needed |
| Stage 3: CLI readline prompts | Chat messages via skill |
| Stage 4: Disk session persistence | OpenClaw session context |
| 7 stages total | 8 stages (added state machine) |

**Updated plan**: `docs/plans/2026-02-09-interview-cli-integration.md`

---

*Issue created 2026-02-09 from N=2 code review synthesis*
*Issue updated 2026-02-09 - plan revised to chat-first approach*
*Issue resolved 2026-02-09 - all items addressed in updated plan*
