# Context: Implementation Review of Synthesis Bug Fixes, Essence Extraction, and Threshold Gap Fixes

**Generated**: 2026-02-10 16:45:00
**Scout**: haiku
**Mode**: flexible
**Topic**: Implementation review of synthesis-bug-fixes, essence-extraction, and threshold-gap fixes

## Plans and Issues

| Document | Status | Summary |
|----------|--------|---------|
| docs/plans/2026-02-10-synthesis-bug-fixes.md | Complete | Single-pass architecture, signal deduplication, semantic similarity matching |
| docs/plans/2026-02-10-essence-extraction.md | Complete | LLM-based essence extraction for SOUL.md opening statement |
| docs/issues/2026-02-10-generalized-signal-threshold-gap.md | Resolved | Changed default threshold from 0.85 to 0.75 for generalized signals |

## Files (12 relevant)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/reflection-loop.ts | ea945773601a3f36 | 185 | Single-pass synthesis architecture - generalize once, add once, compress once |
| src/lib/principle-store.ts | b24c7ccb72936a7e | 391 | Signal deduplication via processedSignalIds Set, centroid-based clustering |
| src/lib/llm-providers/ollama-provider.ts | be08ad3611093a88 | 340 | Two-stage category extraction: fast string matching + semantic embedding fallback |
| src/lib/essence-extractor.ts | d0f351284e60a0ad | 131 | LLM-based essence extraction with sanitization (quotes, markdown, trait lists) |
| src/lib/soul-generator.ts | 36c7b6ba073772b9 | 396 | SOUL.md generation with optional essence statement, dimension organization |
| src/lib/config.ts | 41932f8df49f7378 | 107 | Configuration schema with similarityThreshold default changed to 0.75 |
| src/lib/pipeline.ts | 7b793ae60b5a8c00 | 769 | Pipeline orchestrator passing LLM to soul generator for essence extraction |
| src/types/llm.ts | a100c20c1660c610 | 137 | Type contract: ClassificationResult.category now T | null, generate() required |
| tests/unit/ollama-provider.test.ts | 2f83ac5e97af15d4 | 226 | Unit tests for fast/semantic category extraction |
| tests/integration/essence.test.ts | 590b28cdfeabb453 | 180 | Integration tests for essence extraction and soul generation |
| tests/analysis/threshold-ablation.test.ts | a99d5c1171f1032a | 360 | Ablation study comparing raw vs generalized signals at different thresholds |
| tests/integration/synthesis.test.ts | d8f2178e9a0d85e7 | 330 | Integration tests validating single-pass, deduplication, null handling |

## Relationships

### Core Synthesis Flow
```
pipeline.ts
    ├── calls runReflectiveLoop() from reflection-loop.ts
    │       ├── calls generalizeSignalsWithCache() (signal-generalizer.ts)
    │       ├── calls createPrincipleStore() from principle-store.ts
    │       │       └── uses cosineSimilarity() from matcher.ts
    │       └── calls compressPrinciplesWithCascade() from compressor.ts
    ├── calls generateSoul() from soul-generator.ts
    │       └── calls extractEssence() from essence-extractor.ts
    └── requires LLMProvider (ollama-provider.ts or vcr-provider.ts)
```

### Key Dependencies
- **reflection-loop.ts** depends on: principle-store.ts, compressor.ts, signal-generalizer.ts
- **principle-store.ts** depends on: matcher.ts, semantic-classifier.ts
- **ollama-provider.ts** depends on: embeddings.ts, matcher.ts
- **soul-generator.ts** depends on: essence-extractor.ts, metrics.ts
- **pipeline.ts** depends on: reflection-loop.ts, soul-generator.ts, signal-extractor.ts

### Type Contract Impact
- **llm.ts** defines ClassificationResult<T>.category as `T | null`
- Callers affected: compressor.ts, vcr-provider.ts, signal-extractor.ts, semantic-classifier.ts (4 locations)
- All callers updated with null handling per Stage 3 of synthesis-bug-fixes plan

## Suggested Focus

- **Priority 1**: `reflection-loop.ts` (185 lines) - Core single-pass architecture change (Stage 1)
- **Priority 1**: `principle-store.ts` (391 lines) - Signal deduplication implementation (Stage 1b)
- **Priority 2**: `ollama-provider.ts` (340 lines) - Two-stage semantic matching (Stage 2)
- **Priority 2**: `essence-extractor.ts` (131 lines) - New essence extraction module
- **Priority 3**: `config.ts` (107 lines), `llm.ts` (137 lines) - Threshold and type contract changes

## Exploration Notes

### Synthesis Bug Fixes (Plan Status: Complete)

**Stage 1 - Single-Pass Architecture**: Implemented in reflection-loop.ts. Removed iteration loop, signals added once. Compression ratio improved from 1.11:1 to 12.3:1 per verification results.

**Stage 1b - Signal Deduplication**: Implemented in principle-store.ts via `processedSignalIds: Set<string>`. Duplicate signals are logged and skipped.

**Stage 2 - Semantic Similarity Matching**: Implemented in ollama-provider.ts. Replaced stemmer approach with two-stage extraction:
1. Fast matching (extractCategoryFast): Exact and substring matching
2. Semantic fallback (extractCategorySemantic): Embedding-based similarity with 0.3 minimum threshold

**Stage 3 - Null Category Handling**: Type contract updated in llm.ts. Category is now `T | null` with confidence 0 on parse failure. All 9 callers updated.

### Essence Extraction (Plan Status: Complete)

- New module `essence-extractor.ts` (131 lines) extracted from soul-generator.ts
- Uses LLM `generate()` method with evocative prompt
- Sanitization: strips quotes, normalizes whitespace, rejects markdown and trait lists
- Word count >= 25 generates warning but response is accepted
- Pipeline passes LLM to generateSoul() for essence extraction
- SOUL.md header changes to "Who You Are" when essence present

### Threshold Gap (Issue Status: Resolved)

- Default threshold changed from 0.85 to 0.75 in config.ts and reflection-loop.ts
- Threshold is now user-configurable via `.neon-soul/config.json`
- Ablation study test created at tests/analysis/threshold-ablation.test.ts
- Rationale: Generalized signals have similarity ~0.78-0.83, so 0.85 was too strict (only 1/48 signals matched)

### Verification Results

From synthesis-bug-fixes plan verification:
```
49 signals -> 44 principles -> 4 axioms (12.3:1 compression)
Effective N-threshold: 2 (cascaded from N>=3 -> N>=2)
Dimension coverage: 57% (4/7 dimensions)
Synthesis time: 11.9s
Generalization: 0% fallback rate
```

### Tests Summary

- **Unit tests**: 226 lines in ollama-provider.test.ts covering fast/semantic extraction
- **Integration tests**: 180 lines in essence.test.ts, 330 lines in synthesis.test.ts
- **Analysis tests**: 360 lines in threshold-ablation.test.ts with ablation study
- All 250+ tests pass per plan verification
