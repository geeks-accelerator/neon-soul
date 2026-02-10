---
created: 2026-02-09
updated: 2026-02-09
type: implementation-plan
status: Complete (All stages implemented)
language: typescript
code_examples: forbidden
review_principles: |
  1. No Code: Do NOT add code examples. Plans describe WHAT/WHY, not HOW.
  2. No Hardcoding: Do NOT add values that depend on implementation.
  3. Suggest Intent: File paths, interfaces, acceptance criteria instead.
  4. Flag, Don't Fix: If plan has code, flag for removal.
trigger: think hard
---

# Plan: Add Signal Generalization Step (PBD Alignment)

## Problem Statement

The synthesis pipeline produces near 1:1 signal-to-axiom ratios (50→49→49) because semantically related signals don't cluster. Root cause: missing **principle synthesis** step from PBD methodology.

**Current flow** (broken):
```
Signal (specific) → Embed → Match → Principle (specific) → Axiom
                           ↑
            "Prioritize honesty over comfort"
                           ↓
            similarity = 0.25 to similar signals (NO_MATCH)
```

**Expected flow** (per PBD guides):
```
Signal (specific) → LLM Generalize → Principle (abstract) → Embed → Match → Axiom
                           ↑
            "Prioritize honesty over comfort"
                           ↓
            "Values truthfulness over social comfort"
                           ↓
            similarity = 0.87 to similar signals (MATCH!)
```

---

## Solution: LLM-Based Signal Generalization

Add a generalization step that transforms specific signals into abstract principles before embedding and matching.

### Key Insight

From `docs/guides/single-source-pbd-guide.md`:
> "Make implicit relationships explicit... Keep principles actionable"

From `docs/guides/multi-source-pbd-guide.md`:
> Before: "Never lie", "Always truthful", "Honesty paramount"
> After: "Maintain truthfulness in all communications"

### What Changes

| Step | Before | After |
|------|--------|-------|
| Signal extraction | ✅ No change | ✅ No change |
| **Generalization** | ❌ Missing | ✅ Add LLM step |
| Embedding | On signal.text | On generalized principle text |
| Matching | Low similarity | Higher similarity |
| N-counts | All N=1 | N=2, N=3+ |
| Cascade | Falls to N>=1 | Uses N>=2 or N>=3 |

---

## Stages

### Stage 1: Create Generalization Module

**File(s)**: `src/lib/signal-generalizer.ts`, `src/types/signal.ts`, `src/prompts/generalize-signal.md`

**Purpose**: LLM-based transformation of specific signals to abstract principles

**Type Definition Location** (addresses twin review #5):
Define `GeneralizedSignal` type in `src/types/signal.ts` alongside the existing `Signal` type for type cohesion. Keep the types file under 100 lines total.

**Prompt Template Location** (addresses twin review #1):
Create `src/prompts/generalize-signal.md` as the canonical versioned prompt template. Use semantic versioning (v1.0.0) with a `PROMPT_VERSION` constant in signal-generalizer.ts. Increment version when prompt structure changes.

**Interface**:

The `generalizeSignal` function takes an LLM provider and a Signal, returning a GeneralizedSignal. The GeneralizedSignal type contains:
- `original`: The original Signal (for provenance)
- `generalizedText`: The abstract principle statement
- `embedding`: Embedding vector of the generalized text
- `model`: LLM model used for generalization
- `promptVersion`: Version identifier for the prompt template
- `timestamp`: When generalization occurred
- `confidence`: Optional confidence score (0-1)
- `usedFallback`: Boolean indicating if fallback to original was used

**LLM Prompt Design**:
- Input: Signal text, dimension (optional)
- Output: Generalized principle (1 sentence, abstract, actionable)
- Constraints (see Prompt Constraints section below)

**Fallback Mechanism** (addresses N=2 finding):
- If LLM returns empty, nonsensical, or fails validation → use original `signal.text`
- Set `usedFallback: true` in result
- Log warning with signal ID and failure reason
- Track fallback rate as metric

**Validation Checks**:
- Non-empty output
- Length cap: output must be < 150 characters
- No policy invention: output should not introduce concepts absent from original
- Imperative or "Values X" form

**Batch Support**:
- `generalizeSignals(llm, signals[])` returns array of GeneralizedSignal
- Use `classifyBatch` pattern from semantic-classifier.ts
- Handle partial failures: successful signals proceed, failed use fallback

**Unit Tests**:
- Determinism check with fixed seed
- Format validation tests (length, non-empty, no policy invention)
- Fallback behavior on LLM failure
- Integration test with mock LLM

**Acceptance Criteria**:
- [ ] `generalizeSignal()` returns abstract principle text
- [ ] Generalized text is shorter and more abstract than original
- [ ] Provenance includes model, promptVersion, timestamp
- [ ] Fallback to original on validation failure
- [ ] Batch version handles partial failures gracefully
- [ ] Unit tests cover determinism, format, fallback

**Commit**: `feat(neon-soul): add signal generalization module`

---

### Stage 2: Integrate Into Principle Store

**File(s)**: `src/lib/principle-store.ts`, `src/lib/reflection-loop.ts`

**Purpose**: Use generalized text for principle creation and matching

**Current behavior** (principle-store.ts:200):
The `principle.text` property is currently assigned directly from `signal.text`. The `principle.embedding` property is assigned from `signal.embedding`.

**New behavior**:
The `principle.text` property will be assigned from `generalizedSignal.generalizedText`. The `principle.embedding` property will be assigned from `generalizedSignal.embedding`. A new `provenance` object will store complete audit trail.

**Integration Points**:
1. `addSignal()` accepts `GeneralizedSignal` instead of raw `Signal`
2. OR: Add optional `generalizedText` parameter to `addSignal()`
3. Reflection loop calls `generalizeSignals()` before feeding to store

**Enhanced Provenance** (addresses code review finding #5):

Each principle stores a provenance object containing:
- `original_text`: Original signal text (what user wrote)
- `generalized_text`: Abstract principle text (what was used for matching)
- `model`: LLM model used for generalization
- `prompt_version`: Version of prompt template used
- `timestamp`: When generalization occurred
- `confidence`: Optional confidence score
- `used_fallback`: Whether fallback to original was triggered

**Acceptance Criteria**:
- [ ] Principles store generalized text
- [ ] Embeddings are of generalized text
- [ ] Provenance includes model, prompt_version, timestamp
- [ ] Matching uses generalized embeddings
- [ ] Fallback cases clearly marked in provenance

**Commit**: `refactor(neon-soul): integrate generalization into principle store`

---

### Stage 3: Update Reflection Loop

**File(s)**: `src/lib/reflection-loop.ts`

**Purpose**: Call generalization before principle store operations

**New Flow**:
1. Extract signals from memory
2. Generalize signals (NEW - LLM call)
3. Feed generalized signals to principle store
4. Match/cluster based on generalized embeddings
5. Compress to axioms

**Integration Sequence** (addresses twin review #6):

Use **batch-first approach** (Option A), not sequential per-signal generalization:

1. Extract all signals for iteration
2. Call `generalizeSignals(llm, signals)` once for entire batch
3. Iterate over generalized results: `for (const g of generalized) { await store.addSignal(g, g.original.dimension) }`

This aligns with batching policy and minimizes LLM calls. The current reflection-loop.ts for-loop (lines 160-163) must be refactored to batch-first.

**Batching Policy** (addresses code review finding #6):

- **Batch size limit**: Maximum 50 signals OR 4000 tokens per batch
- **Retry semantics**: Exponential backoff on failure (1s, 2s, 4s, max 3 retries)
- **Partial failure handling**: If N signals fail within batch, use original text for those N signals (fallback), continue with successful generalizations
- **Fail-closed path**: If entire batch fails after retries, use original signal text for all and log warning

**Optimization**:
- Batch generalization (1 LLM call per iteration, not per signal)
- Cache generalized forms if signals repeat across iterations
- Track batch success rate for monitoring

**Cache Invalidation Strategy** (addresses twin review #8):
- Cache key: `signal.id + promptVersion` (composite key)
- Invalidate entire cache when prompt version changes
- Cache is in-memory per synthesis run (no persistence needed)
- If signal.id repeats with same promptVersion, return cached result

**Metrics**:
- Track generalization time
- Track fallback rate (signals using original text)
- Track batch success/failure rate
- Track cache hit rate

**Debug Logging** (addresses twin review #9):
- Log first 3 generalizations per batch (always visible at debug level)
- Log random 5% of remainder (prevents log spam on large batches)
- Format: `[generalize] original="${signal.text.slice(0,50)}..." → generalized="${result.slice(0,50)}..."`

**Acceptance Criteria**:
- [ ] Generalization happens before store.addSignal()
- [ ] Batch processing respects size limits
- [ ] Retry with exponential backoff on failure
- [ ] Partial failures use fallback, don't halt pipeline
- [ ] Debug logs show generalization examples
- [ ] Metrics track fallback and success rates

**Commit**: `feat(neon-soul): add generalization step to reflection loop`

---

### Stage 4: VCR Fixture Recording & Clustering Verification

**Purpose**: Implement VCR pattern for deterministic LLM testing and verify clustering improvement

**Why VCR is Required**:
- Real LLM tests timeout (~8 min for full synthesis with many signals)
- Mock LLM uses keyword matching, not semantic understanding
- VCR enables: record real Ollama responses once → replay instantly forever
- CI tests become fast AND semantically accurate

See `docs/observations/http-vcr-pattern-for-api-testing.md` (RORRD pattern, N=6+)

---

#### Stage 4a: VCR Infrastructure

**File(s)**: `src/lib/llm-providers/vcr-provider.ts`, `tests/fixtures/vcr/`

**Purpose**: Create VCR wrapper for LLM providers

**VCR Provider Design**:

The VCRLLMProvider wraps any LLMProvider and intercepts calls:
- `classify()` → check fixture, if miss → call real provider → save fixture
- `generate()` → check fixture, if miss → call real provider → save fixture

**Fixture Key Strategy**:
- Key: `hash(method + prompt + categories + PROMPT_VERSION)`
- Format: JSON with metadata and response
- Location: `tests/fixtures/vcr/{scenario}/{key}.json`

**Modes**:
- `replay` (default): Load from fixture, error if missing
- `record`: Call real provider, save to fixture
- `passthrough`: Call real provider, don't save

**Interface**:

VCRLLMProvider wraps an underlying LLMProvider and provides:
- Constructor: `new VCRLLMProvider(realProvider, fixtureDir, mode)`
- Same `classify()` and `generate()` methods as LLMProvider
- `getFixtureStats()`: Returns hit/miss counts for debugging

**Acceptance Criteria**:
- [x] VCRLLMProvider implements LLMProvider interface
- [x] Fixtures stored as JSON with metadata
- [x] `VCR_MODE` environment variable controls behavior
- [x] Fixture key includes PROMPT_VERSION for cache invalidation
- [x] Stats tracking for fixture hits/misses (71 hits, 0 misses in test run)

**Commit**: `feat(neon-soul): add VCR LLM provider for deterministic testing`

---

#### Stage 4b: Record Golden Set Fixtures

**File(s)**: `tests/fixtures/vcr/golden-set/`, `scripts/record-vcr-fixtures.ts`

**Purpose**: Record real Ollama responses for golden set signals

**Golden Set Definition** (10-15 signals across dimensions):

Create curated signals that test:
1. Semantic similarity (should cluster): "be honest" ↔ "tell truth" ↔ "no deception"
2. Different dimensions: honesty vs boundaries vs identity
3. Edge cases: conditional statements, negations

**Recording Script**:

Create `scripts/record-vcr-fixtures.ts`:
1. Load golden set signals from `tests/fixtures/golden-set-signals.json`
2. Create OllamaLLMProvider (real LLM)
3. Wrap with VCRLLMProvider in record mode
4. Call `generalizeSignals()` for all signals
5. Fixtures saved to `tests/fixtures/vcr/golden-set/`

**Recording Workflow**:
```bash
# Ensure Ollama running
ollama list | grep llama3

# Record fixtures (one-time, ~30s for 15 signals)
npm run vcr:record

# Verify fixtures created
ls tests/fixtures/vcr/golden-set/
```

**Fixture Structure**:
```
tests/fixtures/vcr/
├── golden-set/
│   ├── generalize-honesty-001.json
│   ├── generalize-boundary-002.json
│   ├── generalize-identity-003.json
│   └── ...
├── classification/
│   ├── dimension-honesty.json
│   └── ...
└── README.md
```

**Acceptance Criteria**:
- [x] Golden set signals defined (15 signals across 6 clusters)
- [x] Recording script works with real Ollama (3.9s for 15 signals)
- [x] Fixtures committed to git (15 JSON files)
- [x] README documents re-recording workflow

**Commit**: `test(neon-soul): record VCR fixtures for golden set`

---

#### Stage 4c: Update Tests to Use VCR Replay

**File(s)**: `tests/e2e/generalization-vcr.test.ts`

**Purpose**: Tests use VCR replay for fast, deterministic execution

**Test Structure**:

New test file that:
1. Creates VCRLLMProvider in replay mode (default)
2. Runs generalization on golden set signals
3. Verifies generalizations match expected patterns
4. Measures clustering improvement

**Test Cases**:

1. `generalizes honesty signals to abstract principles`
   - Input: "I always tell the truth"
   - Expected: Generalized form starts with "Values" or similar
   - Fixture: Replays real Ollama response

2. `semantically similar signals produce similar generalizations`
   - Input: ["be honest", "tell truth", "no deception"]
   - Expected: Generalized forms have high cosine similarity (>0.8)

3. `clustering improvement with generalization`
   - Run principle store with golden set
   - Measure: compression ratio, N-counts, cascade threshold
   - Assert: ratio > 2:1, avg N-count > 1.5

**VCR Mode in Tests**:
```typescript
const vcrMode = process.env.VCR_MODE ?? 'replay';
const realLLM = new OllamaLLMProvider({ model: 'llama3' });
const llm = new VCRLLMProvider(realLLM, 'tests/fixtures/vcr/golden-set', vcrMode);
```

**Acceptance Criteria**:
- [x] Tests pass in replay mode (no Ollama needed)
- [x] Tests run in 187ms for 9 tests (vs 8+ min with real LLM)
- [x] Clustering metrics captured and asserted (5:1 compression, 400% improvement)
- [x] CI uses replay mode by default

**Commit**: `test(neon-soul): add VCR-based generalization tests`

---

#### Stage 4d: Analyze Clustering Improvement

**Purpose**: Document quantitative improvement from generalization

**Metrics to Capture**:

1. **Compression Ratio**: signals / axioms
   - Target: >= 3:1 (vs current ~1:1)

2. **N-Count Distribution**:
   - Before: All N=1
   - After: Mix of N=1, N=2, N=3+

3. **Cascade Threshold**:
   - Before: Falls to N>=1
   - After: Uses N>=2 or N>=3

4. **Similarity Distribution**:
   - Before: 0.20-0.40 range
   - After: 0.70-0.90 range

**Analysis Script**:

Create `scripts/analyze-clustering.ts`:
1. Run synthesis on golden set (with VCR replay)
2. Capture all metrics
3. Output comparison table

**Expected Output**:
```
Clustering Analysis (Golden Set: 15 signals)
============================================
Metric                 | Before | After  | Change
-----------------------|--------|--------|--------
Compression Ratio      | 1.07   | 3.75   | +250%
Avg N-Count            | 1.0    | 2.5    | +150%
Cascade Threshold      | 1      | 3      | ✓
Avg Similarity (match) | 0.32   | 0.84   | +163%
```

**Threshold Tuning**:
- If clustering still sparse post-generalization, lower threshold from 0.85 to 0.80
- Document recommended threshold for generalized embeddings

**Acceptance Criteria**:
- [x] Metrics captured before/after generalization
- [x] Compression ratio improves significantly (5:1, exceeds 3:1 target)
- [x] N-counts reach 2+ for common themes (distribution: [10, 3, 2])
- [x] Analysis documented in test output (console logs with metrics)
- [x] Threshold recommendation documented (0.45 for generalized embeddings)

**Commit**: `docs(neon-soul): document clustering improvement analysis`

---

#### Stage 4e: Update VCR Observation

**File(s)**: `docs/observations/http-vcr-pattern-for-api-testing.md`

**Purpose**: Document neon-soul VCR implementation as validated N-count instance

**Updates Required**:

1. **Update frontmatter**:
   - Change status from "N=6+" to reflect validated implementation
   - Add neon-soul files to `related_implementations`

2. **Update Part 13** (already drafted):
   - Change implementation status from 🔄 pending to ✅ complete
   - Add actual fixture paths and counts
   - Document recording workflow with real commands
   - Add lessons learned from implementation

3. **Add quantitative data**:
   - Fixture count and sizes
   - Recording time vs replay time
   - Cache hit rates from tests

**Observation Update Template**:

```markdown
### Implementation Status (Updated YYYY-MM-DD)

- ✅ VCRLLMProvider wrapper implemented
- ✅ Golden set fixtures recorded (N signals, X KB total)
- ✅ Tests pass in replay mode (<5s vs 8+ min)
- ✅ CI configured for replay-only mode

**Quantitative Results**:
- Recording time: ~30s for 15 signals
- Replay time: <100ms for 15 signals
- Fixture size: ~X KB total
- Cache invalidation: Tested on PROMPT_VERSION bump
```

**Acceptance Criteria**:
- [x] Observation frontmatter updated with implementation files
- [x] Part 13 status changed to complete
- [x] Quantitative data from actual implementation added
- [x] Lessons learned documented (threshold tuning for generalized embeddings)

**Commit**: `docs: update VCR observation with neon-soul implementation results`

---

### Stage 5: Documentation & Voice Preservation

**File(s)**: `docs/ARCHITECTURE.md`, `docs/guides/greenfield-guide.md`

**Purpose**: Document the generalization step and voice preservation strategy

**Updates**:
- ARCHITECTURE.md: Update pipeline diagram to show generalization step
- greenfield-guide.md: Reference PBD alignment
- Add inline comments in new module

**Voice Preservation Strategy** (addresses twin review #2):

Generalization trades authentic voice for clustering efficiency. The user says "Prioritize honesty over comfort" — that's *their* fingerprint. Transforming to "Values truthfulness over social comfort" improves matching but moves from *their words* to *our abstraction*.

**Solution**: Decouple representation (for clustering) from presentation (for UX):

1. **Cluster on generalized embeddings** - Technical accuracy
2. **Display original phrasings** - Authentic voice
3. **Select most representative original signal** as cluster label

**SOUL.md Display Options**:
- Option A (recommended): Show original signal that best represents cluster, with N-count
  - "Prioritize honesty over comfort" (N=4, related: "tell truth", "avoid deception", "direct feedback")
- Option B: Show generalized form with original citations
  - "Values truthfulness over social comfort" (from: "honesty over comfort", "tell truth"...)
- Option C: Hybrid - generalized heading with original as first citation

**Actor-Agnostic Display Tension** (addresses twin review #11):

The prompt uses actor-agnostic language ("Values X" not "I value X") for embedding similarity. But SOUL.md is the user's document — they should see themselves in it.

**Resolution**:
- Clustering form: actor-agnostic (for embedding)
- Display form: re-personalize with "I" statements when rendering SOUL.md
- Implementation: SOUL.md template prepends "I" to axiom statements, or uses user's original phrasing (which may include "I")

**Acceptance Criteria**:
- [x] Pipeline diagram shows generalization step
- [x] PBD guides referenced in architecture docs
- [x] New module has clear doc comments
- [x] Voice preservation strategy documented
- [x] SOUL.md display mode decision documented

**Commit**: `docs(neon-soul): document signal generalization step`

---

## Generalization Prompt Design

**Input Example**:
Signal text: "Prioritize honesty over comfort"
Dimension: honesty-framework

**Prompt Constraints** (addresses code review findings #4 and #7):

The prompt template must enforce:
1. **Length cap**: Output must be < 150 characters
2. **Imperative form**: Use "Values X", "Prioritizes Y", or similar structure
3. **No policy invention**: Output must not introduce concepts absent from original signal
4. **Actor-agnostic language**: No "I", "we", "you" - abstract the actor
5. **Preserve conditionals**: If original has "when X, then Y", preserve the condition
6. **Single sentence**: Exactly one sentence output

**"No Policy Invention" Examples** (addresses twin review #4):

Original signal: "Prioritize honesty over comfort"

| Generalization | Verdict | Reason |
|----------------|---------|--------|
| "Values truthfulness over social comfort" | ✅ OK | Synonym expansion (honesty → truthfulness) |
| "Values honesty and directness" | ⚠️ Flag | Related concept addition (directness not in original) |
| "Values transparent organizational communication" | ❌ Reject | Domain injection (organizational not in original) |
| "Always tells the truth in business contexts" | ❌ Reject | Domain narrowing + policy invention |

**Validation rule**: If generalized form contains nouns/adjectives not synonymous with original terms, flag for review or trigger fallback.

**Prompt Template** (conceptual structure):

The prompt instructs the LLM to transform a specific statement into an abstract principle. Key instructions:
- Capture the core value or preference
- Be general enough to match similar statements
- Be actionable (can guide behavior)
- Stay under 150 characters
- Use imperative form (e.g., "Values X over Y")
- Do not add policies or concepts not present in original
- Do not use pronouns (I, we, you)
- If original has conditions, preserve them

Input provided: signal text and dimension context.
Output: Only the generalized principle, nothing else.

**Expected Output Example**:
"Values truthfulness and directness over social comfort"

**Validation**: If output fails constraints (too long, pronouns, policy invention), trigger fallback to original signal text.

---

## Risk Mitigation

### Risk: LLM fails or returns invalid output (N=2 finding)

**Mitigation**:
- **Fallback mechanism**: If generalization fails validation, use original signal.text
- **Validation checks**: Non-empty, < 150 chars, no policy invention, proper form
- **Provenance tracking**: Mark `used_fallback: true` when fallback triggered
- **Monitoring**: Track fallback rate as metric; investigate if > 10%

### Risk: LLM adds latency

**Mitigation**:
- Batch generalization (1 call per iteration, max 50 signals)
- Cache generalized forms if signals repeat
- Use fast model (Ollama llama3 is local)
- Exponential backoff on failure (don't hang pipeline)

### Risk: LLM generalizes incorrectly

**Mitigation**:
- Keep original signal in provenance for audit
- Log sample generalizations at debug level
- Validation step checks format constraints
- Fallback to original if validation fails

### Risk: Over-generalization loses meaning

**Mitigation**:
- Prompt constraints enforce actionability and actor-agnostic language
- Length cap (< 150 chars) prevents excessive abstraction
- Dimension context helps preserve domain specificity
- "No policy invention" constraint prevents adding new concepts
- Human review of generated SOUL.md as final check

---

## Success Criteria

**Cluster-Level Metrics**:
1. Semantically related signals cluster (similarity > threshold, adjusted post-analysis)
2. Compression ratio improves from ~1:1 to at least 3:1
3. N-counts reach 2+ for common themes
4. Cascade can use N>=2 or N>=3 thresholds

**Downstream Value Metrics**:
5. Principle quality passes manual rubric review (sample of 10)
6. Duplication reduced without losing coverage of themes
7. SOUL.md remains readable and actionable

**User Experience Metrics** (addresses twin review #3):
8. User recognizes their values in generated SOUL.md (qualitative review)
9. Axioms feel personal, not templated or generic
10. Original phrasings visible somewhere (in axiom text or expandable provenance)
11. Axioms are actionable by the user, not abstract platitudes

**Operational Metrics**:
12. Original signals preserved in provenance with full metadata
13. Fallback rate < 10% (most generalizations succeed)
14. Pipeline latency increase < 2x (generalization adds acceptable overhead)

**VCR Testing Metrics** (Stage 4):
15. VCR fixtures recorded for golden set (10-15 signals)
16. Tests run in <5s with VCR replay (vs 8+ min with real LLM)
17. CI uses replay mode by default (no Ollama dependency)
18. Fixtures re-recorded when PROMPT_VERSION changes

---

## Related

**Issue**: [`docs/issues/missing-signal-generalization-step.md`](../issues/missing-signal-generalization-step.md)

**Code Review**: [`docs/issues/code-review-2026-02-09-signal-generalization.md`](../issues/code-review-2026-02-09-signal-generalization.md) (resolved)

**Twin Review**: [`docs/issues/twin-review-2026-02-09-signal-generalization.md`](../issues/twin-review-2026-02-09-signal-generalization.md)

**VCR/RORRD Pattern**: [`docs/observations/http-vcr-pattern-for-api-testing.md`](../../../../docs/observations/http-vcr-pattern-for-api-testing.md) - Part 13 documents neon-soul LLM VCR implementation

**PBD Guides**:
- [`docs/guides/single-source-pbd-guide.md`](../guides/single-source-pbd-guide.md) - Step 4: Principle Synthesis
- [`docs/guides/multi-source-pbd-guide.md`](../guides/multi-source-pbd-guide.md) - Step 2: Principle Normalization

**Code**:
- `src/lib/principle-store.ts` - Integration point
- `src/lib/reflection-loop.ts` - Call site
- `src/lib/semantic-classifier.ts` - Pattern for LLM classification
- `src/lib/signal-generalizer.ts` - Generalization module (Stage 1)
- `src/lib/llm-providers/ollama-provider.ts` - Real LLM provider
- `tests/mocks/llm-mock.ts` - Mock LLM for unit tests

**Reviews & Issues**:
- [`docs/reviews/2026-02-09-signal-generalization-impl-codex.md`](../reviews/2026-02-09-signal-generalization-impl-codex.md) - Codex review (N=2)
- [`docs/reviews/2026-02-09-signal-generalization-impl-gemini.md`](../reviews/2026-02-09-signal-generalization-impl-gemini.md) - Gemini review (N=2)
- [`docs/issues/2026-02-09-signal-generalization-impl-findings.md`](../issues/2026-02-09-signal-generalization-impl-findings.md) - Implementation findings (14 issues, resolved)
- [`docs/reviews/2026-02-09-signal-generalization-impl-twin-technical.md`](../reviews/2026-02-09-signal-generalization-impl-twin-technical.md) - Technical twin review
- [`docs/reviews/2026-02-09-signal-generalization-impl-twin-creative.md`](../reviews/2026-02-09-signal-generalization-impl-twin-creative.md) - Creative twin review
- [`docs/issues/2026-02-09-signal-generalization-twin-review-findings.md`](../issues/2026-02-09-signal-generalization-twin-review-findings.md) - Twin review findings (7 issues)

---

*Plan drafted 2026-02-09 - Aligns implementation with PBD methodology*
