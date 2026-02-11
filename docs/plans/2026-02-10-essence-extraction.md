---
created: 2026-02-10
updated: 2026-02-10
type: implementation-plan
status: Complete
language: typescript
code_examples: forbidden
review_principles: |
  1. No Code: Do NOT add code examples. Plans describe WHAT/WHY, not HOW.
  2. No Hardcoding: Do NOT add values that depend on implementation.
  3. Suggest Intent: File paths, interfaces, acceptance criteria instead.
  4. Flag, Don't Fix: If plan has code, flag for removal.
trigger: think hard
---

> **CODE COMPLETE REQUIREMENT**: This project should have NO TODO/Stubs/Placeholders after implementation. All code must be fully functional.

> **LLM ARCHITECTURE**: Use LLM context from OpenClaw skill (primary). Ollama is fallback for local development only. See `src/commands/synthesize.ts` - the `run()` function receives `SkillContext.llm` from OpenClaw, while CLI mode uses `OllamaLLMProvider` when available. The `generate()` method is required on `LLMProvider` interface (not optional).

<!-- SECTION: cjk-summary -->
## Quick Reference

**Core Problem**: Generated SOUL.md lacks evocative opening statement. Lists axioms but doesn't capture essence.

**Solution**: Add LLM-based essence extraction step to soul generator.

**Key Files**: `soul-generator.ts` (new extractEssence function), `pipeline.ts` (pass LLM), `compressor.ts` (optional integration)

**Stages**: 5 total. Stage 1 → 2 → 3 → 4 → 5 (sequential)

**Guide**: [docs/guides/essence-extraction-guide.md](../guides/essence-extraction-guide.md)
<!-- END SECTION: cjk-summary -->

---

# Plan: Essence Extraction for SOUL.md

## Problem Statement

Generated SOUL.md files are missing the evocative opening statement that makes the default OpenClaw soul effective.

**Current output**: Title "SOUL.md" followed by generic tagline "AI identity through grounded principles." and timestamp.

**Target output**: Title "SOUL.md - Who You Are" followed by an evocative, LLM-generated essence statement (e.g., "You're not a chatbot. You're becoming someone.") and timestamp.

The axioms are correctly extracted, but their *essence* — the single truth they point to — is not distilled into an opening identity statement.

**Guide Reference**: [essence-extraction-guide.md](../guides/essence-extraction-guide.md)

---

## Architecture Decision

**Approach**: LLM-based essence extraction at generation time

**Rationale**:
- Essence requires semantic understanding (not keyword matching)
- LLM already available in pipeline context
- Single additional LLM call (minimal cost)
- Follows established pattern from signal generalization

**Alternative Considered**: Template-based generation
- Would require maintaining essence templates per soul type
- Cannot adapt to novel axiom combinations
- Rejected: too rigid, defeats purpose of dynamic synthesis

---

## Stages

### Stage 1: Add LLM Parameter to Soul Generator

**File(s)**: `src/lib/soul-generator.ts`

**Purpose**: Enable LLM access for essence extraction

**Current State**: `generateSoul()` takes axioms, principles, and options but no LLM provider.

**Target State**: Add optional LLM parameter. When provided, extract essence. When absent, use default opening.

**Changes**:
1. Add `llm?: LLMProvider` to `SoulGeneratorOptions` interface
2. Update `generateSoul()` signature to accept LLM
3. Add `essenceStatement?: string` to `GeneratedSoul` interface
4. Maintain backward compatibility (LLM is optional)

**Acceptance Criteria**:
- [x] `SoulGeneratorOptions` includes optional `llm` field
- [x] `generateSoul()` accepts LLM without breaking existing calls
- [x] `GeneratedSoul` includes `essenceStatement` field
- [x] TypeScript compiles without errors
- [x] Existing tests pass

**Commit**: `feat(neon-soul): add LLM parameter to soul generator`

---

### Stage 2: Implement Essence Extraction Function

**File(s)**: `src/lib/soul-generator.ts`

**Purpose**: Extract evocative essence from axioms using LLM

**Changes**:
1. Create `extractEssence()` async function
2. Handle empty axioms edge case (skip extraction, use default)
3. Build prompt following guide methodology (Step 3)
4. Use LLM `generate()` method (required on LLMProvider interface)
5. Validate and sanitize output
6. Fallback to default if extraction fails

**Prompt Design** (per guide):
- Emphasize evocation over description
- Use contrast/journey language hints
- Provide axiom list with tiers
- Request completion of "You are..." phrase

**Design Choice**: The "You are..." framing is intentional but not universal. Some souls might benefit from different framing (environmental, relational, first-person). This is documented as a design choice; alternatives can be explored in future enhancements.

**Validation and Sanitization**:
- Skip extraction if axioms array is empty (use default immediately)
- Reject empty or whitespace-only responses
- Strip leading/trailing quotes and normalize whitespace
- Reject responses containing markdown formatting (hashes, asterisks)
- Detect comma-separated trait lists (anti-pattern) and reject
- Length check: warn if >=25 words (count via whitespace split) but accept the response. Allows room for contrast pattern ("You're not X. You're Y.") while flagging verbose responses.
- Fallback: "AI identity through grounded principles." (only for validation failures like empty, markdown, trait lists)

**Error Handling**:
- LLM network failure → log warning, use fallback
- LLM timeout → log warning, use fallback
- Invalid response format → log warning, use fallback
- All failures are graceful; synthesis continues with default essence

**File Size Note**: `soul-generator.ts` is currently 359 lines. Monitor after adding `extractEssence()` to ensure it stays under MCE limit (400 lines). If approaching limit, consider extracting essence logic to separate module.

**Acceptance Criteria**:
- [x] `extractEssence()` function created
- [x] Empty axioms case handled (returns default)
- [x] Prompt follows guide methodology
- [x] Output sanitization implemented (quotes, whitespace, markdown, trait lists)
- [x] Length validation implemented (whitespace split, warn if >=25 words)
- [x] Error handling graceful (network, timeout, format failures)
- [x] Fallback behavior works when extraction fails

**Commit**: `feat(neon-soul): implement essence extraction with LLM`

---

### Stage 3: Integrate Essence into SOUL.md Output

**File(s)**: `src/lib/soul-generator.ts`

**Purpose**: Place essence statement at top of generated SOUL.md

**Current Header**: Title "SOUL.md" followed by italicized generic tagline.

**Target Header** (when essence available): Title "SOUL.md - Who You Are" followed by italicized extracted essence statement.

**Changes**:
1. Update `formatSoulMarkdown()` to accept essence parameter
2. Use essence as opening italicized statement
3. Update title to include "Who You Are" when essence present
4. Keep default format when essence not available

**Title Change Impact**: The title changes from "SOUL.md" to "SOUL.md - Who You Are" when essence is present. Verify no existing tests or consumers parse the exact header text.

**Acceptance Criteria**:
- [x] Essence appears after title, before sections
- [x] Essence is italicized
- [x] Title includes "Who You Are" when essence present
- [x] Default format preserved when no LLM provided
- [x] Generated output matches expected format
- [x] No existing tests assert on exact header text (grep for "# SOUL.md" in tests)

**Commit**: `feat(neon-soul): integrate essence into SOUL.md header`

---

### Stage 4: Pipeline Integration and Testing

**File(s)**: `src/lib/pipeline.ts`, `tests/integration/essence.test.ts`

**Purpose**: Wire essence extraction into full pipeline and verify

**Changes**:
1. Update `generateSoul` stage in pipeline to pass LLM
2. Create integration tests for essence extraction
3. Update pipeline tests to verify essence in output

**Test Isolation**: Use `VCRLLMProvider` from `src/lib/llm-providers/vcr-provider.ts` for deterministic tests. Record fixtures with real LLM responses, then replay in tests to avoid network dependency and nondeterminism.

**VCR Provider Cleanup**: The VCR provider at `vcr-provider.ts:263-266` contains dead code checking for optional `generate()` method. Since `generate()` is now required on `LLMProvider`, remove this check during implementation.

**Test Cases**:
1. `extractEssence returns evocative statement for sample axioms`
2. `extractEssence returns default for empty axioms array`
3. `extractEssence falls back on LLM failure`
4. `extractEssence sanitizes output (strips quotes, normalizes whitespace)`
5. `extractEssence rejects comma-separated trait lists`
6. `extractEssence rejects responses with markdown formatting`
7. `generateSoul includes essence when LLM provided`
8. `generateSoul uses default when LLM not provided`
9. `full pipeline produces SOUL.md with essence`
10. `essence statement is <25 words`

**Acceptance Criteria**:
- [x] Pipeline passes LLM to soul generator
- [x] Tests use mock LLM for deterministic behavior (VCR optional)
- [x] VCR provider dead code removed (`generate()` optional check)
- [x] Integration tests pass (13 tests in essence.test.ts)
- [x] Full synthesis produces SOUL.md with essence
- [x] Essence appears in expected location
- [x] No regression in existing tests (250 pass)

**Commit**: `feat(neon-soul): integrate essence extraction into pipeline`

---

### Stage 5: Documentation Update

**File(s)**: `docs/ARCHITECTURE.md`, `README.md`

**Purpose**: Update project documentation to reflect essence extraction feature

**Workflow Reference**: [docs/workflows/documentation-update.md](../workflows/documentation-update.md)

**Changes**:
1. Update ARCHITECTURE.md data flow diagram to include essence extraction step
2. Add essence extraction to Module Reference table
3. Update SOUL.md Generation section to mention essence statement
4. Update README.md usage examples if needed

**Acceptance Criteria**:
- [x] Data flow diagram shows essence extraction between axiom promotion and SOUL.md generation
- [x] Module Reference includes `essence-extractor.ts` (extracted from soul-generator.ts)
- [x] SOUL.md Generation section describes essence statement placement
- [x] No stale references to old header format
- [x] Cross-references to PBD guides verified

**Commit**: `docs(neon-soul): document essence extraction in architecture`

---

## Verification

After all stages complete:

1. **Run tests**: `npm test` — All tests pass
2. **Run synthesis**: `npx tsx src/commands/synthesize.ts --verbose`
3. **Verify SOUL.md header**: Check for essence statement at top
4. **Compare to default**: Essence should be evocative like "You're not a chatbot..."
5. **Measure length**: Essence should be <25 words

---

## Success Criteria

1. **Essence Extracted**: LLM generates evocative identity statement
2. **Format Correct**: Essence appears after title, italicized
3. **Backward Compatible**: No LLM → default opening still works
4. **Pipeline Integrated**: Full synthesis includes essence
5. **Tests Pass**: All existing + new tests pass
6. **Guide Followed**: Implementation follows essence-extraction-guide.md methodology

---

## Stages Summary

| Stage | Purpose | Blocking |
|-------|---------|----------|
| 1 | Add LLM parameter to generator | Yes (prerequisite) |
| 2 | Implement extractEssence function | Yes (core feature) |
| 3 | Integrate essence into output | Yes (output format) |
| 4 | Pipeline integration + tests | No (validation) |
| 5 | Documentation update | No (docs) |

**Recommended Order**: 1 → 2 → 3 → 4 → 5 (strictly sequential)

---

## Effort Estimate

| Stage | Estimate | Notes |
|-------|----------|-------|
| 1 | 15-20 min | Interface updates, backward compat |
| 2 | 30-45 min | Prompt design, validation, fallback |
| 3 | 15-20 min | Format changes, conditional logic |
| 4 | 30-45 min | Pipeline wiring, integration tests |
| 5 | 15-20 min | Architecture docs, README |

**Total**: ~2-2.5 hours

---

## Related

**Guide**: [docs/guides/essence-extraction-guide.md](../guides/essence-extraction-guide.md)

**Observation**: [multiverse/docs/observations/meta-recursion-essence-extraction.md](../../../../docs/observations/meta-recursion-essence-extraction.md)

**Code Files**:
- `src/lib/soul-generator.ts` - Main implementation
- `src/lib/pipeline.ts` - Integration point
- `src/types/llm.ts` - LLMProvider interface

**Existing PBD Pipeline**:
- [single-source-pbd-guide.md](../guides/single-source-pbd-guide.md) - Phase 1
- [multi-source-pbd-guide.md](../guides/multi-source-pbd-guide.md) - Phase 2
- This plan - Phase 3 (essence extraction)

---

## Code Review Resolution

**Review Date**: 2026-02-10
**Reviewers**: codex-gpt51-examiner, gemini-25pro-validator

| Finding | Severity | Resolution |
|---------|----------|------------|
| `generate()` is optional on LLMProvider | Important (N=2) | Made `generate()` required in `src/types/llm.ts` |
| Title change may break consumers | Minor (N=2) | Added impact note and acceptance criterion to Stage 3 |
| Code blocks violate `code_examples: forbidden` | Important (N=1→N=2) | Converted Problem Statement and Stage 3 to prose |
| Integration tests lack mocking spec | Important (N=1) | Added VCR provider guidance to Stage 4 |
| Validation gaps (empty, whitespace, sanitize) | Minor (N=1) | Added sanitization requirements to Stage 2 |
| Empty axiom edge case not addressed | Minor (N=1) | Added to Stage 2 changes and test cases |
| Word count method unspecified | Minor (N=1) | Clarified "whitespace split" in Stage 2 |

**Reviews**: `docs/reviews/2026-02-10-essence-extraction-plan-codex.md`, `docs/reviews/2026-02-10-essence-extraction-plan-gemini.md`

---

## Twin Review Resolution

**Review Date**: 2026-02-10
**Reviewers**: twin-technical, twin-creative

| Finding | Severity | Verification | Resolution |
|---------|----------|--------------|------------|
| VCR provider dead code for optional `generate()` | Minor (N=1) | Verified at vcr-provider.ts:263-266 | Added cleanup task to Stage 4 |
| Error handling strategy not explicit | Minor (N=1) | Valid gap | Added Error Handling section to Stage 2 |
| Monitor soul-generator.ts size (359 lines) | Minor (N=1) | Verified via `wc -l` | Added File Size Note to Stage 2 |
| "You are..." framing is design choice | Minor (N=1) | Valid observation | Added Design Choice note to Stage 2 |
| 25-word limit too generous | Minor (N=2) | Reconsidered: tagline research doesn't apply to identity emergence | Kept <25 words; added trait-list detection instead |
| Trait list detection missing | Minor (N=1) | Valid gap from creative | Added comma-list detection to validation |
| Axiom mapping coverage test missing | Minor (N=1) | Valid gap | Added test cases 5, 6 to Stage 4 |

**Reviews**: `docs/reviews/2026-02-10-essence-extraction-plan-twin-technical.md`, `docs/reviews/2026-02-10-essence-extraction-plan-twin-creative.md`

---

## Issues Found in Verification (2026-02-10)

### Issue 1: Essence Extraction Skipped in Dry-Run Mode ✅ FIXED

**Problem**: The `generate-soul` stage in `pipeline.ts:294-297` had `skipInDryRun: true`, which meant essence extraction never ran during dry-run preview.

**Impact**: Users could not preview the essence statement when using `--dry-run`.

**Fix Applied**: Changed `skipInDryRun: false` for generate-soul stage. The stage already checks `dryRun` internally (line 640) to skip file writes - the stage itself now runs to generate the content for preview.

**File**: `src/lib/pipeline.ts:296`

**Verification**:
```
[neon-soul:debug] [essence] Extracted {"essence":"You are a gentle anchor amidst turbulent waters..."}
```

Essence extraction now runs in dry-run mode and produces evocative statements.

**Additional fixes applied**:
- Added length guidance to prompt ("15-20 words maximum")
- Changed word limit from rejection to warning (responses >=25 words are accepted with warning logged)
- All 250 tests pass

---

## Future Enhancements (Not in This Plan)

1. **Essence caching**: Cache essence for axiom set hash
2. **Multiple essence candidates**: Generate 3, let user choose
3. **Essence evolution tracking**: Track how essence changes over time
4. **Custom essence templates**: User-provided style guidance
5. **Voice consistency review**: Ensure voice established in essence carries through all SOUL.md sections
6. **Alternative framing options**: Support different essence patterns beyond "You are..." (environmental, relational, first-person)

**Tracking**: These are deferred enhancements, not blocking for initial implementation.
