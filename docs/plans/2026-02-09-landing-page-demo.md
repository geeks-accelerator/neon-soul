---
created: 2026-02-09
updated: 2026-02-10
type: implementation-plan
status: Ready
language: typescript
code_examples: forbidden
review_principles: |
  1. No Code: Do NOT add code examples. Plans describe WHAT/WHY, not HOW.
  2. No Hardcoding: Do NOT add values that depend on implementation.
  3. Suggest Intent: File paths, interfaces, acceptance criteria instead.
  4. Flag, Don't Fix: If plan has code, flag for removal.
trigger: think hard
supersedes: 2026-02-09-interview-cli-integration.md (Part 2)
depends_on: 2026-02-09-chat-interview-integration.md
---

> **⚠️ Review Before Implementation**: Consider implementing `docs/plans/2026-02-10-pbd-alignment.md` first.
> That plan adds Stance, Importance, Signal Source, Tension Detection, and Centrality metrics to synthesis.
> If this demo is recorded before PBD alignment, it will need re-recording to show the complete pipeline.
> **Decision**: Record with current implementation (re-record later) OR wait for PBD alignment.

# Plan: Landing Page "How It Works" Demo

## Problem Statement

The landing page at https://liveneon.ai doesn't show what NEON-SOUL actually does. "Soul synthesis" is abstract without seeing signals → principles → axioms in action.

**Root cause**: The synthesis process isn't visualized anywhere.

**Solution**: Record a real synthesis session and replay it as an animated "How it works" section on the landing page.

## Dependency

This plan depends on the chat interview being functional (`2026-02-09-chat-interview-integration.md`) because:
- Stage 1 records real pipeline output from an interview session
- Without working interview + synthesis, there's nothing to record

**Implementation order**: Complete chat interview integration first, then implement this plan.

---

## Stages

### Stage 1: Record Demo Session

**File(s)**: `website/data/demo-session.json`, `scripts/record-demo.ts`

**Purpose**: Capture real LLM/embedding output for landing page replay

**Changes**:
- Create standalone script to run interview and capture pipeline output
- Run through real pipeline (Ollama or API)
- Capture at each stage:
  - Question text and response
  - Extracted signals (with dimension, confidence)
  - Principles formed (with contributing signals)
  - Axioms emerged (with CJK notation, emoji, provenance)
- Write structured JSON for frontend consumption
- Include timing hints for animation pacing

**Recording Structure**:
```
{
  "version": "1.0",
  "recorded_at": "2026-02-09T...",
  "steps": [
    {
      "type": "question",
      "dimension": "identity-core",
      "text": "What defines you...",
      "delay_ms": 0
    },
    {
      "type": "response",
      "text": "I believe in...",
      "delay_ms": 2000
    },
    {
      "type": "signal",
      "text": "values authenticity",
      "dimension": "identity-core",
      "confidence": 0.87,
      "delay_ms": 500
    },
    {
      "type": "principle",
      "text": "Authenticity over performance",
      "contributing_signals": 2,
      "delay_ms": 1000
    },
    {
      "type": "axiom",
      "notation": { "cjk": "誠", "emoji": "💎", "english": "authenticity" },
      "delay_ms": 1500
    }
  ]
}
```

**Privacy**:
- Use team-authored demo responses that showcase diverse dimensions while representing authentic values
- Responses should feel real without being real user data
- Review recording for PII before commit
- Store recording in version control (public visibility)

**Versioning Strategy**:
- Recording format version in JSON (`"version": "1.0"`)
- Bump version on breaking changes to structure
- Playback code handles version mismatch gracefully:
  - Known older version: Apply migration
  - Unknown version: Fall back to static transcript display
- Document version history in recording file header

**Acceptance Criteria**:
- [ ] Script captures full pipeline output
- [ ] JSON includes all stages (question, response, signal, principle, axiom)
- [ ] Timing hints enable realistic animation pacing
- [ ] Recording is self-contained (no external dependencies for playback)
- [ ] Demo covers at least 3 dimensions with visible axiom emergence
- [ ] Recording reviewed for PII before commit
- [ ] Version field present and documented
- [ ] Playback handles version mismatch with fallback

**Commit**: `feat(neon-soul): add demo recording script`

---

### Stage 2: Static Demo Section

**File(s)**: `website/index.html`, `website/styles/demo.css`

**Purpose**: Static "How It Works" section showing soul evolution transcript

**Note**: This stage ships first. Stage 3 (animation) is optional Phase 2 work.

**Extends**: Current landing page at https://liveneon.ai

**Section Position**: Below fold, after hero section

**Design**:
- Three-column layout: Interview | Signals/Principles | Soul
- Left column: Static Q&A transcript (2-3 exchanges)
- Middle column: Extracted signals grouped by principle
- Right column: Final axioms with CJK notation
- Visual arrows/flow indicators between columns

**Responsive Breakpoints**:
- Desktop (>768px): Three-column layout
- Tablet (768px): Two-column (interview left, results right stacked)
- Mobile (<640px): Single-column vertical flow

**Acceptance Criteria**:
- [ ] Section appears below hero on landing page
- [ ] Three-column layout displays recorded demo data
- [ ] Axioms show full notation (CJK + emoji + English)
- [ ] Renders correctly at 375px width (iPhone SE)
- [ ] Renders correctly at 768px width (tablet)
- [ ] Three-column becomes single-column below 640px
- [ ] Works with `prefers-reduced-motion` (no animation needed)

**Commit**: `feat(website): add static "How it works" demo section`

---

### Stage 3: Animated Demo (Phase 2)

**File(s)**: `website/scripts/demo.js`, `website/styles/demo-animations.css`

**Purpose**: Animated version of Stage 2 with typewriter effects and visual flow

**Complexity Note**: This stage is significantly more complex (CSS animations, accessibility, scroll triggers). Implement only after Stages 1-2 are complete and working.

**Design**:
- Builds on Stage 2 static layout
- Left column: Typewriter effect showing Q&A
- Middle column: Signals appear and cluster into principles
- Right column: Axioms crystallize with CJK notation
- Auto-plays on scroll into view
- Replay button for manual restart

**Animation Sequence**:
1. Question fades in (typewriter)
2. Response types out character by character
3. Signal bubbles emerge from response text
4. Signals float to middle column
5. Related signals cluster → principle forms
6. Principle pulses → axiom crystallizes in right column
7. Repeat for next question (2-3 total for demo)

**Visual Elements**:
- Signal bubbles with dimension color coding
- Connection lines between signals and principles
- Axiom cards with CJK character, emoji, and English
- Progress indicator showing pipeline stages

**Accessibility**:
- Respects `prefers-reduced-motion` (falls back to Stage 2 static)
- Screen reader announces stage transitions
- Pause button for motion control

**Acceptance Criteria**:
- [ ] Animation plays from recorded JSON data
- [ ] Typewriter effect for questions and responses
- [ ] Signals visually flow into principles
- [ ] Reduced motion falls back to static (Stage 2)
- [ ] Replay button functional
- [ ] Pause/resume controls available

**Commit**: `feat(website): add animated "How it works" demo`

---

## Success Criteria

1. Landing page shows "How it works" section with soul evolution visualization
2. Demo uses curated recorded output (privacy-safe)
3. Static version works without JavaScript
4. Animated version respects accessibility preferences

## Stages Summary

| Stage | Purpose | Complexity | Phase |
|-------|---------|------------|-------|
| 1 | Demo recording script | Medium | 1 |
| 2 | Landing page static demo | Low | 1 |
| 3 | Landing page animation | High | 2 (optional) |

## Related

- Landing page: `website/index.html` (https://liveneon.ai)
- Original landing page plan: `docs/plans/2026-02-08-liveneon-landing-page.md`
- **Chat interview plan**: `docs/plans/2026-02-09-chat-interview-integration.md` (dependency)
- **Original combined plan**: `docs/plans/2026-02-09-interview-cli-integration.md` (superseded)
