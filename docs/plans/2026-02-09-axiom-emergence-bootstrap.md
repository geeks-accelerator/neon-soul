---
created: 2026-02-09
updated: 2026-02-09
type: implementation-plan
status: In Progress
language: typescript
code_examples: forbidden
review_principles: |
  1. No Code: Do NOT add code examples. Plans describe WHAT/WHY, not HOW.
  2. No Hardcoding: Do NOT add values that depend on implementation.
  3. Suggest Intent: File paths, interfaces, acceptance criteria instead.
  4. Flag, Don't Fix: If plan has code, flag for removal.
trigger: think hard
---

# Plan: Fix Axiom Emergence via Cascading Thresholds

## Revision History

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-09 | Initial draft | Workaround approach (N=1 in bootstrap) |
| 2026-02-09 | Revision 2 | Fix root cause (N-count carryover) |
| 2026-02-09 | Revision 3 | Cascading thresholds, remove all modes |
| 2026-02-09 | **Revision 4** | Address twin review findings |

**Key Insight**: The system should be autonomous. Instead of manual mode switching (bootstrap/learn/enforce), use cascading thresholds that adapt to data quality automatically.

---

## Problem Statement

Synthesis is producing **47 signals → 46 principles → 0 axioms**.

**Root Cause**: The reflective loop recreates `PrincipleStore` each iteration, resetting N-counts. Principles never accumulate enough evidence (N>=3) to become axioms.

---

## Solution: Cascading Thresholds + N-Count Carryover

### Core Principle

> "Thresholds emerge, they aren't declared." — Greenfield Guide

Instead of hardcoded thresholds or manual modes, the system adapts:

```
Try N>=3 → got >= 3 axioms? → done (high confidence)
     ↓ no (< 3 axioms)
Try N>=2 → got >= 3 axioms? → done (medium confidence)
     ↓ no (< 3 axioms)
Try N>=1 → use whatever we got (low confidence)
     ↓
Tier assignment based on ACTUAL N-count (not cascade level):
  N>=5 → Core | N>=3 → Domain | N<3 → Emerging
```

**Important**: Cascade level determines which axioms are *included*. Tier label reflects *actual evidence strength*. An axiom with N=1 is always "Emerging" regardless of which cascade level produced it.

### What This Eliminates

| Removed | Why |
|---------|-----|
| GreenfieldMode type | No modes needed - system adapts |
| Bootstrap/Learn/Enforce | Autonomous behavior replaces manual switching |
| Arbitrary 200 limit | Cascade IS the safeguard |
| User configuration | System just works |

### What We Keep

| Kept | Why |
|------|-----|
| N-count carryover | Enables evidence accumulation |
| Tier labels (Core/Domain/Emerging) | Reflects actual evidence strength |
| Research-backed limits | Compression check, cognitive load caps |

### Tier Assignment

Tiers reflect actual N-count, regardless of which cascade level produced them:

| Tier | N-count | Meaning |
|------|---------|---------|
| Core | N>=5 | Highest evidence, most reliable |
| Domain | N>=3 | Solid evidence |
| Emerging | N<3 | Still learning, use with caution |

If cascade falls to N>=1, axioms get "Emerging" tier - honest labeling.

---

## Stages

### Stage 1: Fix N-Count Carryover

**File(s)**: `src/lib/reflection-loop.ts`

**Purpose**: Preserve N-counts across iterations (prerequisite for cascading to work)

**Current behavior** (lines 156-165):
- Iteration 2+: Creates NEW store, loses all N-counts

**New behavior**:
- Keep same PrincipleStore across iterations
- N-counts accumulate as signals re-match principles
- Similarity threshold still tightens each iteration

**Design Decision**: Add `setThreshold(threshold: number)` method to PrincipleStore interface.

This is simpler than passing threshold to each `addSignal()` call because:
- Less parameter threading through the codebase
- Store owns its matching behavior
- Clearer interface contract

**Threshold Tightening Behavior**: When threshold tightens (+0.02 per iteration), later iterations may not match existing principles (stricter requirement). This is **acceptable** - it means only strongly-matching signals reinforce existing principles, while borderline matches create new principles. The N-count on well-established principles will still accumulate.

**Acceptance Criteria**:
- [ ] `setThreshold()` method added to PrincipleStore interface
- [ ] PrincipleStore persists across iterations
- [ ] N-counts accumulate (same principle matched = N increments)
- [ ] CR-2 note updated to document new design

**Commit**: `fix(neon-soul): preserve N-counts across reflective loop iterations`

---

### Stage 2: Implement Cascading Threshold

**File(s)**: `src/lib/compressor.ts`

**Purpose**: Auto-adapt threshold based on axiom yield

**Logic**:
1. Try `nThreshold = 3` → count axioms
2. If axioms < 3, try `nThreshold = 2` → count axioms
3. If axioms < 3, try `nThreshold = 1` → use result
4. Log which threshold was used

**Minimum viable output**: 3 axioms as target (not hard requirement).

**Research basis** (per [`docs/research/optimal-axiom-count.md`](../research/optimal-axiom-count.md)):
- Miller's Law: 3-4 chunks in working memory
- Jim Collins: 3-6 core values
- Core tier target: 3-7 axioms

**Edge case - empty/sparse input**: If input produces 0 axioms even at N>=1, return empty result. This is correct behavior - the cascade target (3) is a goal, not a guarantee. Empty input = empty output.

**Metrics to track**:
- `effectiveThreshold`: Which N-threshold produced the result
- `axiomCountByThreshold`: How many axioms at each level (for observability)

**Acceptance Criteria**:
- [ ] Cascade logic implemented (3 → 2 → 1)
- [ ] Minimum 3 axioms triggers cascade
- [ ] Effective threshold logged
- [ ] Tier assignment based on actual N-count (not threshold used)

**Commit**: `feat(neon-soul): implement cascading N-count threshold`

---

### Stage 3: Remove GreenfieldMode

**File(s)**: `src/lib/pipeline.ts`, `src/index.ts`

**Purpose**: Simplify - no modes needed with autonomous cascade

**Changes**:
- Remove `GreenfieldMode` type entirely
- Remove `mode` from `PipelineOptions`
- Update `validateSoulOutput()` to always warn, never fail (for now)
- Remove mode-related logging

**Future consideration**: Add `--strict` flag for CI if needed (separate concern)

**Acceptance Criteria**:
- [ ] No GreenfieldMode type in codebase
- [ ] No mode parameter in pipeline
- [ ] Validation logs warnings, doesn't fail
- [ ] TypeScript compiles

**Commit**: `refactor(neon-soul): remove GreenfieldMode (replaced by cascading threshold)`

---

### Stage 4: Add Research-Backed Guardrails

**File(s)**: `src/lib/compressor.ts`, `src/lib/pipeline.ts`

**Purpose**: Warn on anomalies (but don't block)

**Guardrails** (warnings only):
- `axioms > signals` → "Expansion instead of compression"
- `axioms > min(signals * 0.5, 30)` → "Exceeds cognitive load research limits"
- `effectiveThreshold === 1` → "Fell back to minimum threshold"

**Behavior**: Log warnings, continue synthesis. System adapts, user is informed.

**Acceptance Criteria**:
- [ ] Compression check warns if axioms > signals
- [ ] Cognitive load check warns if axioms > limit
- [ ] Fallback threshold logged as warning
- [ ] No hard failures (system adapts)

**Commit**: `feat(neon-soul): add research-backed guardrail warnings`

---

### Stage 5: Validate and Document

**Purpose**: Confirm fix works, update docs

**Verification**:
```bash
$ npx tsx src/commands/synthesize.ts --dry-run --verbose

# Expected:
# [info] Effective N-threshold: 3 (no cascade needed)
# Signals: 47, Principles: ~25, Axioms: 8
# OR
# [info] Effective N-threshold: 2 (cascaded from 3)
# Signals: 47, Principles: ~30, Axioms: 5
```

**Documentation updates**:
- `docs/guides/greenfield-guide.md`: Remove mode references, document cascade
- `docs/ARCHITECTURE.md`: Update pipeline docs, remove GreenfieldMode
- `docs/issues/*.md`: Mark resolved

**User-facing communication**:
- Update CLI help text to remove mode flags (if any exist)
- Add tier label explanation: "Core (N>=5), Domain (N>=3), Emerging (N<3)"
- Add cascade feedback message when fallback occurs: "Note: Using N>=X threshold (sparse evidence)"

**Validation**:
- Verify convergence behavior with preserved store (should stabilize faster)
- Confirm tier distribution in output matches N-count reality

**Acceptance Criteria**:
- [ ] Synthesis produces axioms
- [ ] Cascade works when needed
- [ ] No mode references in docs
- [ ] CLI help text updated (if applicable)
- [ ] Tier labels explained in user-facing docs
- [ ] Convergence behavior validated
- [ ] Issues marked resolved

**Commit**: `docs(neon-soul): document cascading threshold behavior`

---

## Success Criteria

1. Synthesis produces axioms autonomously (no user configuration)
2. Cascade adapts to data quality (sparse input → lower threshold)
3. Tier labels honestly reflect evidence strength
4. No GreenfieldMode complexity
5. Research-backed guardrails warn on anomalies

---

## Verification

```bash
# After implementation:
$ npx tsx src/commands/synthesize.ts --dry-run --verbose

# Expected output shows:
# 1. Which threshold was effective
# 2. Axioms produced
# 3. Tier distribution (Core/Domain/Emerging)
# 4. Any guardrail warnings
```

---

## Why This Is Better

| Aspect | Before (Modes) | After (Cascade) |
|--------|----------------|-----------------|
| User action | Choose mode manually | None - autonomous |
| Threshold | Hardcoded or configured | Emerges from data |
| Sparse input | Fails or needs mode change | Adapts automatically |
| Complexity | 3 modes, transitions | Single adaptive algorithm |
| Greenfield alignment | Partial | Full ("thresholds emerge") |

---

## Related

**Research**:
- [`docs/research/optimal-axiom-count.md`](../research/optimal-axiom-count.md) - Tier caps, cognitive limits

**Code Review**:
- [`docs/issues/code-review-2026-02-09-axiom-emergence-bootstrap.md`](../issues/code-review-2026-02-09-axiom-emergence-bootstrap.md)

**Twin Review**:
- [`docs/issues/twin-review-2026-02-09-axiom-emergence-bootstrap.md`](../issues/twin-review-2026-02-09-axiom-emergence-bootstrap.md)

**Implementation Files**:
- `src/lib/reflection-loop.ts` - N-count carryover
- `src/lib/compressor.ts` - Cascading threshold
- `src/lib/pipeline.ts` - Remove modes

---

*Plan revised 2026-02-09 - cascading thresholds replace manual modes*
