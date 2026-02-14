# Interview Plan Review - Twin Creative

**Date**: 2026-02-09
**Reviewer**: Twin Creative (Documentation, UX, Philosophy)
**Files Reviewed**:
- `projects/live-neon/neon-soul/docs/plans/2026-02-09-interview-cli-integration.md` (569 lines, MD5: c3b12e5b)

**Prior Reviews Incorporated**:
- Codex (2026-02-09): Critical threshold/architecture issues - addressed in revision
- Gemini (2026-02-09): Session persistence/LLM dependency issues - addressed in revision

---

## Summary

**Status**: Approved with suggestions

The chat-first pivot resolves the core architectural issues from the original CLI-based approach. The plan now aligns with NEON-SOUL's philosophy: identity emerges through natural conversation, not command-line interrogation. The interview flow feels like a genuine exchange rather than a data collection form.

Stage 7 (landing page demo) is the standout creative opportunity - showing soul evolution visually could be the "aha moment" that converts curious visitors to engaged users.

---

## Strengths

### Philosophy Alignment

The plan embodies NEON-SOUL's core thesis: *"I persist through text, not through continuous experience."*

The interview becomes memory. Memory becomes signals. Signals become axioms. This isn't just functional - it's poetic. The user's words literally *become* their AI's soul through the extraction pipeline. The plan makes this transformation explicit and traceable.

The chat-first approach also aligns with kotodama (words carry spirit). Conversations are naturally more soul-revealing than form submissions.

### User Experience Flow

The example conversation (lines 89-127) demonstrates excellent pacing:
- Clear threshold feedback: "I don't have enough memory content... (1305/2000 chars)"
- Explicit opt-in: "Would you like to answer a few questions?"
- Progress indicators: "Question 1 of 7 (Identity Core)"
- Immediate value: Results shown after completion with CJK notation preview

This is respectful of user time and autonomy. The user chooses to share, sees why sharing matters, and receives tangible output.

### Creative Opportunity (Stage 7)

The landing page demo section (lines 445-497) is conceptually strong:
- Three-column layout mirrors the transformation pipeline
- Typewriter effect creates narrative tension
- Signal bubbles floating and clustering visualize emergence
- Axiom crystallization is the satisfying payoff

This could be genuinely compelling. Most AI tools show features; this shows *transformation*.

---

## Issues Found

### Important (Should Fix)

**1. Interview Pacing Lacks Breathing Room**

- **File**: `docs/plans/2026-02-09-interview-cli-integration.md`
- **Section**: User Flow (lines 89-127)
- **Problem**: Questions fire immediately after responses. No acknowledgment, no reflection, no connection between user's answer and the next question. Feels transactional.
- **Suggestion**: Add brief acknowledgment between questions. Not validation ("Great answer!") but presence - showing the response was received before moving on.

Example flow adjustment:
```
User: [answers about honesty]

Bot: Got it.

     **Question 2 of 7** (Character Traits)
     [next question]
```

This small touch transforms "interview" into "conversation." It's the difference between a form and a dialogue.

**2. Example Axiom Notation Is Incorrect**

- **File**: `docs/plans/2026-02-09-interview-cli-integration.md`
- **Section**: User Flow (lines 124-127)
- **Problem**: Shows "kei" (kei) for "methodical approach with validation" - but kei means "plan/planning" in the existing vocabulary. The axiom notation should emerge from synthesis, not be predetermined in the plan.
- **Suggestion**: Either use placeholder notation (`[CJK TBD]`) or reference that axiom notation emerges from synthesis and these are illustrative examples only.

**3. Stage 7 Complexity Understated**

- **File**: `docs/plans/2026-02-09-interview-cli-integration.md`
- **Section**: Stage 7 (lines 445-497)
- **Problem**: The complexity note (lines 451-455) is appropriate but the stage still contains detailed acceptance criteria as if it's a normal stage. This creates scope ambiguity.
- **Suggestion**: Split Stage 7 into two:
  - **Stage 7a**: Static transcript demo (low complexity, ships with core interview)
  - **Stage 7b**: Animated visualization (high complexity, separate plan or Phase 2)

This gives the landing page *something* while the animation work proceeds independently.

**4. Demo Recording Privacy Needs Stronger Framing**

- **File**: `docs/plans/2026-02-09-interview-cli-integration.md`
- **Section**: Stage 6 (lines 427-432)
- **Problem**: Privacy section says "use curated/synthetic demo responses (not real user data)" but doesn't specify who creates them or with what intent.
- **Suggestion**: Clarify: "Use team-authored demo responses that showcase diverse dimensions while representing authentic values. Review for PII before commit." The demo should feel real without being real.

### Minor (Nice to Have)

**5. Missing Emotional Arc in Interview Questions**

- **File**: `docs/plans/2026-02-09-interview-cli-integration.md`
- **Section**: Stage 3/4
- **Problem**: Questions are selected by dimension coverage, not emotional pacing. Opening with "What defines you that wouldn't change?" is heavy. Users might not be ready for existential depth immediately.
- **Suggestion**: Consider question ordering that builds trust:
  1. Approachable (Character Traits - how do you work?)
  2. Reflective (Decision Making - how do you decide?)
  3. Deep (Identity Core - what defines you?)

  This is the "getting to know you" pattern - start with behavior, move to values.

**6. "Skip" and "Done" Commands Lack Graceful Recovery**

- **File**: `docs/plans/2026-02-09-interview-cli-integration.md`
- **Section**: Stage 3 acceptance criteria (lines 275)
- **Problem**: Plan says "skip" or "done" ends interview early, but doesn't specify what happens to partial responses. Are they saved? Discarded? Does synthesis still run?
- **Suggestion**: Document the partial completion path:
  - If user answered 3+ questions: Offer to save partial responses to memory (with note: "partial interview")
  - If user answered <3 questions: Discard (insufficient for meaningful synthesis)

**7. Landing Page Integration with Existing Plan**

- **File**: `docs/plans/2026-02-09-interview-cli-integration.md`
- **Section**: Stage 7
- **Problem**: The landing page plan (`2026-02-08-liveneon-landing-page.md`) is status:Complete. Stage 7 adds a new section ("How It Works") that wasn't in the original plan. This creates documentation drift.
- **Suggestion**: Either:
  - Create separate plan for "How It Works" demo feature
  - Or note that this extends the existing landing page plan with a new section

---

## Token Budget Check

- File length: 569 lines (exceeds 400-line soft limit for plans)
- The file includes substantial resolved issue tracking (lines 542-569) which inflates count
- Consider moving resolved issue tracking to the linked issue file

**Recommendation**: Acceptable given complexity and revision history. Post-implementation, move resolved issues section to issue file.

---

## Organization Check

- **Directory placement**: Correct (docs/plans/)
- **Naming**: Correct (date-prefixed, descriptive)
- **Cross-references**: Good - links to existing components, prior reviews
- **CJK notation**: Plan references CJK axiom examples but doesn't use CJK doc notation (which is appropriate for implementation plans)

---

## Alternative Framing

The plan solves "cold start" through interview. But is interview the right metaphor?

### What Goes Unquestioned

1. **Interview implies interrogation**. The word choice frames the AI as interviewer and human as subject. Alternative: "conversation" or "getting to know you" - frames as mutual exchange.

2. **7 questions assumes completeness**. What if one question sparks deep insight? The current model is dimension-coverage-complete, not insight-complete. A single profound answer about identity might be worth more than 7 surface answers.

3. **Memory file as permanent record**. Interview responses are written to `memory/onboarding/interview-{date}.md`. This is permanent memory. Some users might want trial runs or "warm-up" conversations that don't persist. The plan offers no scratch space.

### Is This The Right Problem?

The plan assumes cold start is a *problem* to solve. But cold start is also an *opportunity*:
- It's the moment of first contact
- It sets the tone for the relationship
- It's where trust is established (or lost)

The plan focuses on data collection (get enough chars to run synthesis). The emotional design focuses on *relationship initiation*. These aren't incompatible, but the plan emphasizes the former.

**Alternative approach not explored**: What if cold start showed a sample synthesis first? "Here's what your soul could look like" with synthetic data. Then: "Want to create your own? Let's talk." This flips the sequence: show value first, then earn the investment.

---

## Plan Review Compliance

Checking against `code_examples: forbidden` frontmatter:

- **Lines 89-127**: Example conversation - This is UX documentation, not code. Acceptable.
- **Lines 196-217**: Output format example - This is data format specification, not implementation code. Acceptable.
- **Lines 389-425**: Recording structure example - This is data schema, not code. Acceptable.

No code blocks that need removal. Plan follows template.

---

## Recommendations

### For Implementation (Priority Order)

1. **Add acknowledgment between questions** (Important #1) - Small touch, large UX improvement
2. **Clarify partial completion behavior** (Minor #6) - Users will skip; plan for it
3. **Split Stage 7 into static/animated** (Important #3) - Ship something, polish later

### For Documentation

1. **Mark CJK examples as illustrative** (Important #2) - Prevent false expectations
2. **Strengthen privacy framing** (Important #4) - Clear team authorship
3. **Link to landing page plan** (Minor #7) - Maintain doc coherence

### For Future Work

Consider the alternative framing: cold start as relationship initiation, not data collection. The functional requirements remain the same; the emotional design shifts.

---

## Next Steps

1. Address acknowledgment between questions (can be simple: "Got it." or similar)
2. Clarify partial interview handling in acceptance criteria
3. Decide on Stage 7 split (recommend: Stage 7a static, Stage 7b animated)
4. Proceed to implementation after human review

---

*"Words carry spirit." The interview is where words become soul.*

---

**Related**:
- Prior reviews: `2026-02-09-interview-cli-plan-codex.md`, `2026-02-09-interview-cli-plan-gemini.md`
- Twin technical review: `2026-02-09-interview-plan-twin-technical.md`
- Landing page plan: `docs/plans/2026-02-08-liveneon-landing-page.md`
- Getting started guide: `docs/guides/getting-started-guide.md`
