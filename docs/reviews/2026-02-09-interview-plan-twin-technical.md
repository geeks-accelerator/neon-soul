# Technical Review: Chat-Based Interview Onboarding Plan

**Date**: 2026-02-09
**Reviewer**: Twin 1 (Technical Infrastructure)
**Review Type**: Implementation plan review (post-external-review revision)

## Verified Files

- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/docs/plans/2026-02-09-interview-cli-integration.md` (569 lines, MD5: c3b12e5b)
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/types/interview.ts` (170 lines)
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/lib/interview.ts` (434 lines)
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/lib/question-bank.ts` (459 lines)
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/commands/synthesize.ts` (273 lines)
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/src/skill-entry.ts` (189 lines)

## Status: Approved with Suggestions

The chat-first pivot was the correct architectural decision. The plan successfully addresses the critical issues raised in the Codex/Gemini reviews. Remaining concerns are implementation details, not blockers.

---

## Strengths

1. **Chat-first architecture eliminates major complexity**: Removing standalone CLI and disk persistence simplifies the design significantly. Using OpenClaw session context is the right choice.

2. **Clear stage separation**: Stages 0-4 form a cohesive core feature; Stages 5-7 are documentation and demo (correctly noted as potentially Phase 2).

3. **Addresses prior review findings systematically**: The "All Issues Addressed" table (lines 559-569) demonstrates disciplined resolution.

4. **Explicit error handling specified**: Stage 3 (lines 265-269) covers abandonment, timeout, write failure, and embedding download failure.

5. **Frontmatter compliance**: Plan correctly uses `code_examples: forbidden` and `review_principles` (lines 7-12).

---

## Issues Found

### Critical (None)

The chat-first pivot resolved the prior critical issues. No new blockers identified.

### Important

#### 1. MCE Violation: interview.ts exceeds 200-line limit

- **File**: `src/lib/interview.ts`
- **Current**: 434 lines
- **Limit**: 200 lines (per 極:mce-quick-reference)
- **Impact**: This file will grow further when Stage 1 (interview-state.ts) and Stage 2 (interview-writer.ts) integration happens. Already 2x over limit.

**Recommendation**: Split before adding more:
- `interview-flow.ts` - InterviewFlow class (~200 lines)
- `interview-utils.ts` - analyzeCoverage, formatInterviewSummary (~100 lines)
- `interview-state.ts` - Session persistence methods (Stage 1 creates this anyway)

#### 2. MCE Violation: question-bank.ts exceeds 200-line limit

- **File**: `src/lib/question-bank.ts`
- **Current**: 459 lines
- **Limit**: 200 lines
- **Impact**: This is almost entirely static data (question definitions), not logic.

**Recommendation**: Extract question data to JSON or YAML file:
- `questions.json` or `question-bank.json` - Question definitions (data)
- `question-bank.ts` - QuestionBank builder and stats functions (<100 lines)

This also enables easier question editing without code changes.

#### 3. Stage dependency: Stage 4 depends on Stage 3, but listed after

- **Plan lines**: 286-310 (Stage 4), 230-283 (Stage 3)
- **Issue**: Stage 4 "Quick-Start Question Selection" is logically needed BY Stage 3 (skill integration selects 7 questions).
- **Impact**: Stage 3 cannot be implemented without the question selection algorithm from Stage 4.

**Recommendation**: Reorder stages:
- Stage 3 (current Stage 4): Question selection algorithm
- Stage 4 (current Stage 3): Skill integration (uses selection algorithm)

Or merge them into a single stage since they're tightly coupled.

#### 4. Missing: OpenClaw session context API not specified

- **Plan lines**: 164-165 describe using "session context that persists across messages"
- **Issue**: No reference to OpenClaw documentation or specific API. Is this `context.session`? `context.state`? A get/set pattern?
- **Impact**: Implementer must discover API; plan cannot be followed as-is.

**Recommendation**: Add to Stage 1 acceptance criteria:
- Document which OpenClaw session API to use
- Add link to OpenClaw session documentation
- Specify if there are size limits on session state

#### 5. LLM dependency during interview still unclear

- **Plan context**: External reviews flagged this (Gemini Critical #1)
- **Plan lines**: 258-263 mention embedding model cold-start but not whether LLM is needed DURING interview
- **Current code**: `interview.ts:125-136` shows `extractSignals()` calls `embed()` which requires model

**Question**: When exactly does signal extraction happen?
- If during interview: LLM required throughout (cold-start not fully solved)
- If after interview completes: LLM only needed at synthesis time (better)

**Recommendation**: Clarify in Stage 3:
- Interview collects responses only (no embedding during interview)
- Stage 2 writes raw responses to memory file
- Signal extraction happens at synthesis time (existing pipeline)

This removes LLM dependency from the interview flow itself.

### Minor

#### 6. Plan length exceeds recommended limit

- **Current**: 569 lines
- **Recommended**: 200-300 lines for feature plans (per 計:plan)
- **Reason**: Verbose output format examples, extensive issue resolution tables
- **Impact**: Higher cognitive load during implementation

**Recommendation**: Move "Code Review" section (lines 542-569) to a separate linked file. That's tracking/history, not plan content.

#### 7. Stage 7 acceptance criteria list "works on mobile" without breakpoint specification

- **Plan lines**: 494
- **Issue**: "Works on mobile (responsive layout)" is vague.
- **Impact**: No clear test criteria. What's "mobile"? 320px? 375px? 414px?

**Recommendation**: Specify:
- [ ] Renders correctly at 375px width (iPhone SE)
- [ ] Renders correctly at 768px width (tablet)
- [ ] Three-column becomes single-column below 640px

#### 8. Demo recording versioning not specified

- **Plan lines**: 389-390 mention `"version": "1.0"` in JSON
- **Issue**: No schema versioning strategy. What happens when format changes?
- **Impact**: Future pipeline changes could break demo playback

**Recommendation**: Add to Stage 6 acceptance criteria:
- [ ] Recording format version bumped on breaking changes
- [ ] Playback code handles version mismatch gracefully

---

## MCE Compliance Summary

| File | Current Lines | Limit | Status |
|------|--------------|-------|--------|
| interview.ts | 434 | 200 | Exceeds 2x - split needed |
| question-bank.ts | 459 | 200 | Exceeds 2x - extract data |
| synthesize.ts | 273 | 200 | Exceeds 1.4x - acceptable for now |
| types/interview.ts | 170 | (types) | Acceptable |
| skill-entry.ts | 189 | 200 | Compliant |

**Recommendation**: Address interview.ts and question-bank.ts MCE violations in Stage 0 (verify infrastructure) to establish clean baseline before adding more code.

---

## Testing Considerations

1. **Stage 1 (State Machine)**: Unit tests for state transitions, edge cases (resume partial, abandon, complete)

2. **Stage 2 (Memory Writer)**: Unit tests for markdown generation, frontmatter format, character counting

3. **Stage 3 (Skill Integration)**: Integration tests with mock session context, end-to-end flow tests

4. **Stage 4 (Question Selection)**: Unit tests for selection algorithm, coverage verification

Pattern: Follow TDD-Doc (検:cjk-summary) - tests serve as specification and documentation.

---

## Architecture Decision: Are We Solving the Right Problem?

The external reviews raised this question but the plan didn't address it directly.

**Alternative approaches mentioned**:
1. Memory seeding from URL/file
2. Quick-start (3-5 questions vs 7)
3. Sample persona demo

**My assessment**: The chat interview approach IS appropriate because:

1. **Context**: NEON-SOUL synthesizes identity from personal reflection. URL scraping would capture public persona, not authentic self.

2. **7 questions is reasonable**: One per dimension, ~2 minutes total. This is comparable to onboarding flows in similar tools.

3. **Demo serves discovery**: Landing page demo lets users see value BEFORE investing. Interview is for users who've already decided to try it.

4. **Technical simplicity**: Interview uses existing infrastructure (question bank, dimensions, memory format). URL seeding would require new parsers, content extraction, quality scoring.

**However**: The plan should acknowledge this as a design decision, not assume it's obvious. A brief "Why interview?" section (3-5 sentences) would strengthen the plan.

---

## Next Steps

1. **Address MCE violations** (Important #1, #2): Split interview.ts, extract question-bank data
2. **Clarify stage order** (Important #3): Reorder or merge Stage 3 and Stage 4
3. **Document OpenClaw session API** (Important #4): Add specific API references
4. **Clarify LLM timing** (Important #5): Specify that embedding happens at synthesis, not during interview
5. **Proceed with implementation**: Core design is sound

---

## Related Reviews

- [Codex Review](./2026-02-09-interview-cli-plan-codex.md): Original critical findings (resolved)
- [Gemini Review](./2026-02-09-interview-cli-plan-gemini.md): LLM dependency concerns (needs clarification)

---

**Review complete. Approved for implementation with above suggestions.**
