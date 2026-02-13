---
created: 2026-02-12
updated: 2026-02-12
type: implementation-plan
status: Complete (v0.2.0 implemented)
language: typescript
code_examples: forbidden
review_principles: |
  1. No Code: Do NOT add code examples. Plans describe WHAT/WHY, not HOW.
  2. No Hardcoding: Do NOT add values that depend on implementation.
  3. Suggest Intent: File paths, interfaces, acceptance criteria instead.
  4. Flag, Don't Fix: If plan has code, flag for removal.
trigger: think hard
---

## Quick Reference

**Core Problem**: ClawHub security scanner flags NEON-SOUL as "Suspicious" because it requires `@xenova/transformers` (third-party npm package) for embedding inference. Scanner wants checksums, pinned versions, and sandbox instructions.

**Solution**: Simplify similarity matching to use your agent's existing LLM. This eliminates the need for a third-party embedding package, meaning NEON-SOUL now requires zero additional dependencies beyond your agent itself. The LLM you already trust handles semantic comparison directly.

**Key Files**: `src/lib/matcher.ts` (rewrite), `src/lib/embeddings.ts` (remove), `src/types/principle.ts` (simplify), `src/lib/principle-store.ts` (centroid logic), `src/lib/trajectory.ts` (cross-run stability), `src/lib/llm-providers/ollama-provider.ts` (semantic fallback), `package.json` (remove dependency)

**Depends On**: None (standalone refactor)

**Blocks**: `2026-02-10-skillmd-llm-wording-false-positive.md` Phase 5 (makes it unnecessary)

---

# Plan: LLM-Based Semantic Similarity

## Problem

The ClawHub security scanner consistently flags NEON-SOUL as "Suspicious (medium confidence)" due to:

1. **Third-party npm package**: `@xenova/transformers` can execute arbitrary code
2. **Model download without checksums**: 23MB downloaded from Hugging Face at runtime
3. **No enforced integrity verification**: Scanner wants SHA256 hashes, not manual verification

The scanner explicitly states the path to "Benign":
> "If you want more confidence, provide the exact commands the agent will run and hashes for the model/artifacts"

**Alternative path**: Eliminate the dependency entirely.

---

## Insight

The agent running NEON-SOUL is already an LLM. The user already trusts this LLM to:
- Read their memory files
- Analyze their personal data
- Generate identity documents

Adding a second inference engine (@xenova/transformers) creates:
- Additional attack surface
- Checksum/integrity requirements
- Version pinning complexity
- Scanner concerns

**Key realization**: LLM-based semantic comparison uses the ALREADY TRUSTED model. No new trust decisions required.

---

## Current Architecture

```
Signal → embed() → 384-dim vector
                        ↓
Principle → embedding field → cosine similarity → match score
```

**Files**:
- `src/lib/embeddings.ts` - @xenova/transformers wrapper (119 lines)
- `src/lib/matcher.ts` - cosine similarity (64 lines)
- `src/types/principle.ts` - has `embedding: number[]` field

**Dependencies**:
- `@xenova/transformers: ^2.17.0` in package.json

---

## Target Architecture

```
Signal text → LLM prompt → semantic comparison → match decision
                              ↓
Principle text → LLM asks: "Are these semantically equivalent?"
```

**Key changes**:
- Remove `@xenova/transformers` dependency entirely
- Replace vector math with LLM prompts
- Remove `embedding` field from Principle type
- Update SKILL.md to remove embedding model requirements

---

## Trade-offs

| Aspect | Embeddings | LLM-Based |
|--------|------------|-----------|
| **Precision** | High (mathematical) | Good (semantic) |
| **Consistency** | Deterministic | May vary slightly |
| **Speed** | Fast (local inference) | Depends on LLM |
| **Cost** | CPU/memory (local) | LLM tokens (provider-dependent) |
| **Dependencies** | npm package | None (uses agent's LLM) |
| **Security scan** | "Suspicious" | Should be "Benign" |
| **Checksums needed** | Yes | No |
| **Offline operation** | Works offline | Requires LLM connection |

**Acceptable because**:
- Similarity matching is for deduplication, not exact science
- 0.85 threshold already accepts approximate matches
- LLM semantic understanding may actually be BETTER for natural language
- User already trusts the LLM (that's the whole point of the skill)

---

## User Impact

**What you'll notice:**
- First synthesis may take slightly longer (LLM calls vs local inference)
- Principle matching may vary slightly between runs (like asking the same question twice)
- Requires active LLM connection (offline synthesis not supported)

**What you won't notice:**
- Your data handling is unchanged (still local, still private)
- Output quality should be equivalent or better
- Provenance tracking and audit chain are unchanged
- Your existing SOUL.md and state files continue to work

**Why we made this change:**
- Eliminates third-party npm package dependency
- Uses your already-trusted LLM instead of adding a second inference engine
- Addresses security scanner concerns about untrusted code
- Simplifies the skill's architecture (no model downloads, no checksums)

**A note on consistency:**
Your soul reflects patterns in your memory, not exact calculations. Like human memory itself, the synthesis process involves interpretation. Running synthesis twice may produce slightly different results - but the core truths will remain stable if your memory is consistent.

---

## Stages

### Stage 1: Create LLM Similarity Module

**Why**: Replace vector-based matching with LLM-based semantic comparison.

**File**: `src/lib/llm-similarity.ts` (new)

**Interface**:
- `isSemanticallyEquivalent(textA: string, textB: string, llm: LLMProvider): Promise<{ equivalent: boolean; confidence: number }>`
- `findBestSemanticMatch(text: string, candidates: string[], llm: LLMProvider): Promise<{ match: string | null; index: number; confidence: number }>`

**LLM prompt design** (intent only):
- Ask LLM to compare two statements for semantic equivalence
- Request confidence score (high/medium/low maps to 0.9/0.7/0.5)
- Structured output for parsing
- Temperature=0 (or provider equivalent) for reproducibility

**Prompt safety requirements**:
- Quote/escape untrusted input text to prevent prompt injection
- Validate structured output against expected schema (enum values, numeric ranges)
- Handle LLM refusals gracefully (treat "I cannot compare" as low confidence)
- Sanitize any user-provided principle/signal text before inclusion

**Reliability requirements**:
- Configurable timeout for similarity calls (default: provider timeout)
- Retry with exponential backoff (max 3 attempts) on transient failures
- Clear error propagation on permanent failures (not silent)
- Cache comparison results for identical text pairs (optional optimization)

**Batch optimization**:
- For multiple candidates, batch into single prompt
- "Which of these statements (if any) is semantically equivalent to X?"
- Reduces LLM calls from O(n) to O(1)
- Handle malformed batch responses by falling back to iterative comparison
- Batch validation: verify response array length matches candidate count
- Maximum batch size: 20 candidates (avoid token limits); split larger batches

**Acceptance Criteria**:
- [ ] LLM similarity module created
- [ ] Single comparison function with input escaping
- [ ] Batch comparison function with fallback
- [ ] Confidence score extraction with validation
- [ ] Timeout and retry logic implemented
- [ ] Unit tests with mock LLM provider (deterministic)
- [ ] Edge case tests: empty candidates, all low confidence, parse failures

---

### Stage 2: Update Matcher to Use LLM

**Why**: Replace cosine similarity with LLM calls.

**File**: `src/lib/matcher.ts` (rewrite)

**Changes**:
- Remove `cosineSimilarity()` function
- Update `findBestMatch()` to use `findBestSemanticMatch()`
- Add `llm: LLMProvider` parameter
- Make function async (LLM calls are async)

**Signature change**:
- Before: `findBestMatch(embedding: number[], principles: Principle[], threshold: number)`
- After: `findBestMatch(text: string, principles: Principle[], llm: LLMProvider, threshold?: number)`

**Threshold mapping** (explicit rules):
- Current threshold: 0.85 (cosine similarity)
- LLM returns: `high` → 0.9, `medium` → 0.7, `low` → 0.5, numeric → use directly
- Default match threshold: 0.7 (equivalent to "medium" confidence)
- If LLM returns prose (e.g., "fairly confident") → treat as `medium` (0.7)
- If LLM returns unparseable → treat as `low` (0.5) with warning log

**Quality calibration**:
- Before merging Stage 2, create golden dataset (~20 signal/principle pairs with expected results)
- Golden dataset location: `test/fixtures/golden-similarity-dataset.json`
- Format: `[{ signalText: string, principleText: string, expectedMatch: boolean }]`
- Run both systems (embedding + LLM) on golden dataset
- Acceptance: LLM matches >= 90% of embedding accuracy on golden dataset
- Document any behavior differences for user communication
- CI runs golden dataset tests on each similarity module change

**Acceptance Criteria**:
- [ ] Matcher uses LLM similarity
- [ ] Async signature
- [ ] Explicit threshold mapping implemented
- [ ] Golden dataset created and tested
- [ ] Tests updated with mock LLM

---

### Stage 3: Update Principle Type

**Why**: Remove embedding field (no longer needed).

**File**: `src/types/principle.ts`

**Changes**:
- Remove `embedding: number[]` field
- Remove `similarity_threshold` field (threshold now in matcher)
- Add optional `text_hash?: string` for quick dedup (SHA256 of normalized text)

**Migration**:
- Existing principles in state files will have `embedding` field
- Type allows optional for backward compat during transition
- Pipeline ignores old embedding, computes similarity fresh

**Acceptance Criteria**:
- [ ] Embedding field removed from type
- [ ] Text hash field added (optional)
- [ ] Backward compatible with existing state files

---

### Stage 4: Update Pipeline Stages

**Why**: Pipeline stages that use embeddings need to use LLM similarity instead.

**Files affected**:
- `src/lib/pipeline.ts` - orchestration
- `src/lib/principle-store.ts` - principle management, centroid logic
- `src/lib/trajectory.ts` - cross-run analysis (used by evolution.ts, NOT synthesis)
- `src/lib/llm-providers/ollama-provider.ts` - semantic category fallback

**Note**: `reflection-loop.ts` is single-pass architecture (no iteration loop). It does NOT need trajectory/convergence updates - the synthesis runs once per invocation.

**Changes**:
- Remove embed() calls
- Thread LLM provider through stages that need similarity
- Update function signatures to accept LLM provider

**Key functions to update**:
- `matchSignalToPrinciple()` → use LLM similarity
- `mergeSimilarPrinciples()` → use LLM similarity

**Centroid replacement strategy**:

The `updateCentroid()` function (principle-store.ts:130-141) computes weighted average of embeddings. Without embeddings, we need a text-based approach:

Option chosen: **Keep highest-strength principle text**
- When merging similar principles, keep the text from the principle with highest `strength`
- Rationale: Higher strength = more signal confirmations = more representative
- Fallback: If equal strength, keep older principle (first observed)
- This is simpler than LLM synthesis and avoids additional LLM calls

Implementation:
- Remove `updateCentroid()` function entirely (principle-store.ts:130-141)
- Remove calls to `updateCentroid()` at lines 260-264 (addSignal reinforcement)
- Remove calls to `updateCentroid()` at lines 458-462 (addGeneralizedSignal reinforcement)
- Update `mergeSimilarPrinciples()` to select best text by strength
- Remove `embedding` field updates from principle creation
- Signal reinforcement path: still increments n_count and adds to provenance, just doesn't update centroid

**Trajectory tracking (cross-run analysis)**:

The `trajectory.ts` is used by `evolution.ts` for **cross-run** analysis (comparing today's synthesis to previous runs), NOT within-run convergence. The current synthesis is single-pass with no iteration loop.

Option chosen: **Text hash stability**
- Track principle text hashes across synthesis runs
- Stability metric: percentage of principles unchanged since last run
- This replaces centroidDrift for cross-run analysis
- Used for `/neon-soul status` to show soul stability over time

**ollama-provider.ts semantic fallback**:

Lines 268-314 use `extractCategorySemantic()` with embeddings for category classification fallback.

Option chosen: **Remove semantic fallback**
- The primary classification uses direct LLM response matching
- Semantic fallback only triggers on category parse failures
- Simplest approach: Remove fallback, let classification fail clearly
- Alternative (if needed): Use LLM similarity to match category names

Implementation:
- Remove `import { embed }` and `import { cosineSimilarity }`
- Remove `categoryEmbeddingCache` (line 96)
- Remove `extractCategorySemantic()` method
- Update `extractCategory()` to return null on parse failure (no fallback)

**Acceptance Criteria**:
- [ ] Pipeline stages use LLM similarity
- [ ] LLM provider threaded correctly
- [ ] No embed() calls remain in pipeline
- [ ] Centroid logic replaced with text selection (highest strength)
- [ ] updateCentroid() call sites removed (lines 260-264, 458-462)
- [ ] Trajectory tracking uses text hash stability (cross-run)
- [ ] ollama-provider.ts semantic fallback removed
- [ ] Integration tests pass

---

### Stage 5: Remove @xenova/transformers

**Why**: Eliminate the dependency that causes security scan concerns.

**Files**:
- `package.json` - remove dependency, bump version to 0.2.0
- `src/lib/embeddings.ts` - delete file
- `src/lib/embeddings.test.ts` - delete test file (if exists)
- `src/skill-entry.ts` - bump version to 0.2.0

**Version coordination** (all must match):
- `package.json` → `"version": "0.2.0"`
- `skill/SKILL.md` → `version: 0.2.0` (updated in Stage 6)
- `src/skill-entry.ts` → `version: '0.2.0'`
- `CHANGELOG.md` → Add 0.2.0 entry with breaking changes (if file exists)

**Verification**:
- `npm ls @xenova/transformers` returns nothing
- Build succeeds without the package

**Acceptance Criteria**:
- [ ] Dependency removed from package.json
- [ ] embeddings.ts deleted
- [ ] package.json version bumped to 0.2.0
- [ ] skill-entry.ts version bumped to 0.2.0
- [ ] Build succeeds
- [ ] All tests pass

---

### Stage 6: Update SKILL.md

**Why**: Remove embedding model requirements, update security documentation.

**File**: `skill/SKILL.md`

**Sections to update**:

1. **Requirements section**: Remove embedding model requirement entirely
2. **Model Source & Integrity section**: Delete (no longer applicable)
3. **Local vs External section**: Simplify (no model download)
4. **How This Works section**: Update to reflect LLM-based matching
5. **Troubleshooting section**: Remove embedding-related troubleshooting

**New positioning**:
- "Pure instruction skill with no additional dependencies"
- "Uses your agent's existing LLM for semantic analysis"
- "No third-party packages, no model downloads"

**Trade-off transparency** (user communication):
Document in SKILL.md that v0.2.0 changes the similarity approach. Use warm, reassuring tone appropriate for an identity tool:

> **What changed in v0.2.0**: We removed the embedding model dependency, which means principle matching now uses your agent's LLM directly. This is the same model you already trust with your memory files.
>
> **What this means for you**:
> - Synthesis may take a bit longer (seconds, not minutes)
> - Results may vary slightly between runs (like asking the same question twice - similar but not identical)
> - You'll need an active connection to your agent (can't run offline)
>
> **Why we made this choice**: The previous approach required third-party code that security scanners flagged. Your soul is too important for compromises.

**Migration guidance** (add to top of SKILL.md after frontmatter):

> ## Upgrading to 0.2.0
>
> If you used NEON-SOUL before version 0.2.0:
> - Your existing `.neon-soul/state.json` will work (embedding fields are ignored)
> - First synthesis will recalculate all similarity matches
> - Your SOUL.md and provenance chain are unchanged
>
> Nothing to do - just run `/neon-soul synthesize` as usual.

**Principle merging documentation** (add to "How This Works"):

> When similar principles are detected, the one with the most signal confirmations (highest strength) is kept. Equal-strength principles prefer the older observation.

**Error message UX** (for LLM unavailability):
Error messages should match NEON-SOUL's voice - actionable, reassuring, recoverable:
- "Soul synthesis paused: Your agent's LLM is temporarily unavailable. Try again in a moment."
- NOT: "Error: LLM request failed after 3 retries. Network timeout."

**Acceptance Criteria**:
- [ ] Embedding requirements removed
- [ ] Model integrity section removed
- [ ] Documentation reflects LLM-based approach
- [ ] Trade-offs documented with warm, user-centric tone
- [ ] Migration guidance added for v0.2.0 upgraders
- [ ] Principle merging behavior documented
- [ ] Remove `embeddings` tag from SKILL.md frontmatter
- [ ] No references to @xenova/transformers
- [ ] Version bumped to 0.2.0 (breaking change)

---

### Stage 7: Publish and Verify

**Why**: Confirm security scan improves to "Benign".

**Steps**:
1. Build and test: `npm run clean && npm run build && npm test`
2. Verify no embedding references (specific patterns):
   - `grep -r "@xenova/transformers" src/` → should return nothing
   - `grep -r "from '../embeddings" src/` → should return nothing
   - `grep "xenova" package.json` → should return nothing
3. Publish to ClawHub: `clawhub publish skill/`
4. Check security scan at https://clawhub.ai/leegitw/neon-soul

**Expected scan result**:
- Install Mechanism: ✓ Pass (no npm packages with runtime code)
- Instruction Scope: ✓ Pass (no third-party library concerns)
- Overall: "Benign" rating

**Acceptance Criteria**:
- [ ] v0.2.0 published to ClawHub
- [ ] Security scan shows "Benign"
- [ ] No "Suspicious" flags
- [ ] npm package also updated (optional)

---

### Stage 8: Update Project Documentation

**Why**: Ensure all project documentation reflects the architectural change from embedding-based to LLM-based similarity.

**Workflow Reference**: Follow `docs/workflows/documentation-update.md` for systematic updates.

**Files to update**:

1. **docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md**
   - Mark as resolved (Phase 5 checksum approach no longer needed)
   - Add resolution note referencing this plan

2. **docs/workflows/skill-publish.md**
   - Update version history with v0.2.0 entry
   - Note breaking change (LLM connection required)

3. **README.md** (if architecture description exists)
   - Remove embedding model references
   - Update technology/architecture section

4. **CLAUDE.md** (if embedding references exist)
   - Remove any embedding-related context
   - Update skill description

5. **docs/ARCHITECTURE.md** (if exists)
   - Update data flow diagram (LLM similarity instead of embeddings)
   - Remove @xenova/transformers from dependencies

6. **docs/plans/README.md** (plan registry)
   - Mark this plan as complete
   - Update any cross-references

**Verification** (from documentation-update.md):
```bash
# No stale embedding references in docs
grep -r "@xenova/transformers" docs/ README.md CLAUDE.md
grep -r "embedding" docs/ARCHITECTURE.md  # Should be minimal/historical only

# Version consistency
grep -E "version|0\.2\.0" package.json skill/SKILL.md
```

**Acceptance Criteria**:
- [ ] Issue file marked resolved with commit reference
- [ ] skill-publish.md version history updated
- [ ] No stale embedding references in user-facing docs
- [ ] Plan registry updated
- [ ] Documentation verification commands pass

---

## Risk Mitigation

### Risk 1: LLM Similarity Less Precise

**Concern**: Cosine similarity is mathematically precise; LLM comparison may vary.

**Mitigation**:
- Current threshold (0.85) already accepts approximate matches
- LLM semantic understanding may actually be MORE appropriate for natural language
- Can tune confidence threshold based on testing
- Add logging to track match quality during initial rollout

### Risk 2: Increased LLM Token Usage

**Concern**: Each similarity check now uses LLM tokens.

**Mitigation**:
- Batch comparisons (compare signal against all principles in one call)
- Cache comparison results where appropriate
- Most users have unlimited LLM access via Claude Code/OpenClaw
- Token cost is minimal compared to prose expansion (already uses LLM)

### Risk 3: Slower Processing

**Concern**: LLM calls slower than local embedding inference.

**Mitigation**:
- Batch operations reduce call count
- Most time is already spent on LLM prose expansion
- User perception: synthesis takes ~same time overall
- Can add progress indicators if needed

### Risk 4: Backward Compatibility

**Concern**: Existing state files have embedding fields.

**Mitigation**:
- Make embedding field optional in type
- Pipeline ignores old embedding data
- First synthesis after upgrade recalculates all similarity
- State migration not strictly needed (graceful degradation)

### Risk 5: LLM Unavailability

**Concern**: Network issues, rate limits, or LLM provider downtime would block similarity matching entirely (unlike local embeddings which work offline).

**Mitigation**:
- Retry with exponential backoff (Stage 1 reliability requirements)
- Clear error messages when LLM unavailable (not silent failure)
- User expectation: skill requires active LLM connection (documented in SKILL.md)
- Accepted trade-off: offline operation was never a primary use case for this skill

**Not mitigated**: There is no fallback to a secondary similarity method. If LLM is unavailable, similarity matching fails with clear error. This is the intended behavior (fail loud, not fail silent).

---

## Verification

**Build verification**:
```bash
npm run clean && npm run build
npm test
grep -r "xenova" src/  # Should return nothing
npm ls @xenova/transformers  # Should show empty
```

**Quality calibration** (before Stage 2 merge):
1. Create golden dataset: ~20 signal/principle pairs with expected match results
2. Run embedding-based similarity on golden dataset, record results
3. Run LLM-based similarity on golden dataset, record results
4. Compare: LLM must match >= 90% of embedding decisions
5. Document any divergent cases for review

**Functional verification**:
1. Run synthesis with mock LLM
2. Verify signals match to principles correctly
3. Verify cross-run stability tracking works (text hash metric)
4. Compare output quality to pre-change baseline

**Security verification**:
1. Publish to ClawHub
2. Wait for security scan
3. Verify "Benign" rating
4. Document scan results

---

## Estimated Scope

| Stage | New Code | Modified Code | Deleted Code |
|-------|----------|---------------|--------------|
| 1: LLM similarity module | ~150 lines | 0 | 0 |
| 2: Matcher update + golden dataset | ~30 lines | ~50 lines | ~30 lines |
| 3: Principle type | 0 | ~10 lines | ~5 lines |
| 4: Pipeline + ollama + trajectory | 0 | ~150 lines | ~100 lines |
| 5: Remove dependency | 0 | ~10 lines | ~120 lines |
| 6: SKILL.md update | 0 | ~120 lines | ~80 lines |
| 7: Publish | 0 | ~5 lines | 0 |
| 8: Documentation | 0 | ~50 lines | ~20 lines |
| **Total** | **~180 lines** | **~395 lines** | **~355 lines** |

**Net change**: -130 lines (code reduction)

Eight stages, one major version bump (0.2.0), removes a dependency.

**Scope increase from review**: +80 new lines, +75 modified lines, +50 deleted lines
- Stage 1: +50 lines (retry logic, input escaping, validation)
- Stage 2: +30 lines (golden dataset setup)
- Stage 4: +50 modified, +50 deleted (ollama-provider.ts, trajectory.ts)
- Stage 6: +20 lines (trade-off documentation)

---

## Why Version 0.2.0?

This is a **breaking change** for:
1. Internal API: `findBestMatch()` signature changes
2. Type change: `Principle.embedding` removed
3. Dependency change: `@xenova/transformers` removed

Users upgrading from 0.1.x should:
- Expect fresh similarity calculations on first synthesis
- Not rely on embedding field in state files
- Have LLM provider configured (required, not optional)

---

## Cross-References

**Replaces**:
- `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` Phase 5 (checksums no longer needed)

**Related**:
- `docs/plans/2026-02-08-ollama-llm-provider.md` - LLM provider implementation
- `docs/plans/2026-02-10-inhabitable-soul-output.md` - Prose expansion (also uses LLM)

**Reviews**:
- `docs/reviews/2026-02-12-llm-similarity-plan-codex.md` - Codex GPT-5.1 review (N=1)
- `docs/reviews/2026-02-12-llm-similarity-plan-gemini.md` - Gemini 2.5 Pro review (N=1)
- `docs/reviews/2026-02-12-llm-similarity-plan-twin-technical.md` - Twin Technical review
- `docs/reviews/2026-02-12-llm-similarity-plan-twin-creative.md` - Twin Creative review

**Workflows**:
- `docs/workflows/documentation-update.md` - Systematic documentation update process (referenced by Stage 8)

**Updates needed after implementation** (see Stage 8):
- `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` - Mark as resolved
- `docs/workflows/skill-publish.md` - Update version history
- `README.md` - Update architecture description
- `CLAUDE.md` - Remove embedding references

---

## Review Findings Addressed

### Code Review (Codex + Gemini) - 2026-02-12

**Critical (N=2)**:
- [x] C-1: `ollama-provider.ts` not addressed → Added to Stage 4 with explicit removal strategy
- [x] C-2: Centroid replacement logic undefined → Added to Stage 4 with "highest strength" strategy
- [x] C-3: Trajectory tracking replacement → Added to Stage 4 with "text stability" metric

**Important (N=2)**:
- [x] I-1: Prompt safety/input escaping → Added to Stage 1 requirements
- [x] I-2: Reliability (timeout/retry) → Added to Stage 1 requirements
- [x] I-3: Quality calibration missing → Added golden dataset to Stage 2 and Verification
- [x] I-4: Threshold mapping ambiguous → Added explicit mapping rules to Stage 2
- [x] I-5: Testing plan incomplete → Added test requirements to Stage 1 and Stage 2

**Minor (N=1 or N=2)**:
- [x] M-1: Offline operation trade-off → Added row to Trade-offs table
- [x] M-2: Version bump coordination → Made explicit in Stage 5
- [x] M-3: grep pattern too broad → Updated Stage 7 with specific patterns
- [x] M-4: SKILL.md trade-off transparency → Added to Stage 6
- [x] M-5: Cost assumption framing → Updated Trade-offs table (CPU/memory vs tokens)

**Risk additions**:
- [x] Risk 5: LLM Unavailability → Added with explicit "no fallback" acceptance

### Twin Review (Technical + Creative) - 2026-02-12

**Important (N=2 - both twins flagged scope issues)**:
- [x] TI-1: Trajectory scope mismatch → Clarified: trajectory.ts is for cross-run analysis (evolution.ts), NOT within-run convergence. reflection-loop.ts is single-pass.
- [x] TI-2: updateCentroid() cascading effects → Added specific call sites (lines 260-264, 458-462)
- [x] CI-1: User story absent → Added "User Impact" section after Trade-offs
- [x] CI-2: "Highest strength" may confuse users → Added documentation in Stage 6 SKILL.md updates
- [x] CI-3: "Text stability" metric opaque → Clarified as cross-run text hash stability with percentage metric

**Minor (N=1)**:
- [x] TM-2: CHANGELOG.md missing → Added to Stage 5 version coordination
- [x] TM-3: Batch edge cases → Added validation, max batch size (20) to Stage 1
- [x] TM-4: Golden dataset not version-controlled → Added location `test/fixtures/` to Stage 2
- [x] CM-1: Trade-off tone → Added warm, user-centric framing in Stage 6
- [x] CM-2: Migration guidance → Added "Upgrading to 0.2.0" section to Stage 6
- [x] CM-3: Error message UX → Added voice guidelines ("actionable, reassuring, recoverable") to Stage 6
- [x] CM-4: Remove "embeddings" tag → Added to Stage 6 acceptance criteria

**Review files**:
- `docs/reviews/2026-02-12-llm-similarity-plan-codex.md`
- `docs/reviews/2026-02-12-llm-similarity-plan-gemini.md`
- `docs/reviews/2026-02-12-llm-similarity-plan-twin-technical.md`
- `docs/reviews/2026-02-12-llm-similarity-plan-twin-creative.md`

---

## Approval

- [ ] Plan reviewed
- [x] Code review findings addressed (Codex + Gemini)
- [x] Twin review findings addressed (Technical + Creative)
- [ ] Trade-offs accepted (LLM vs embedding precision)
- [ ] Ready to implement
