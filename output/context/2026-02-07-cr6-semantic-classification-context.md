# Context: CR-6 Semantic Classification Refactor Implementation

**Generated**: 2026-02-07 (Scout exploration)
**Scout**: haiku
**Mode**: flexible
**Topic**: CR-6 Semantic Classification Refactor - replacing keyword matching with LLM-based semantic classification

## Files (15 relevant)

| File | MD5 | Lines | Summary |
|------|-----|-------|---------|
| docs/plans/2026-02-07-cr6-semantic-classification-refactor.md | 175a330c4249ab4fcf61fef6a5cff736 | 459 | Implementation plan with 11 stages for replacing keyword matching with LLM classification |
| src/types/llm.ts | 5bba069209a6fcdac86e5758b41c869c | 66 | LLM provider interface: ClassifyOptions, ClassificationResult, LLMRequiredError |
| src/lib/semantic-classifier.ts | 4e30ae7af56709f9b9d3a6c29b79217b | 275 | Central LLM classification module: classifyDimension, classifySignalType, classifySectionType, mapToCJKAnchor, mapToEmoji, classifyCategory |
| src/lib/semantic-vocabulary.ts | 40f7edd11af38d7210cd243d49d532d0 | 116 | Canonical vocabularies: SIGNAL_TYPES, SECTION_TYPES, MEMORY_CATEGORIES, CJK_ANCHORS, EMOJI_VOCABULARY |
| src/lib/principle-store.ts | 4860f5dd96d86a8bdc5164c3cf0d26d5 | 216 | Refactored: createPrincipleStore now requires LLMProvider, uses classifyDimension |
| src/lib/metrics.ts | 1a21fdbad57cae96ff7e21ba2405eeba | 162 | Refactored: calculateDimensionCoverage uses signal's dimension field, classifyDimension as fallback |
| src/lib/signal-extractor.ts | a5c41057d7027a38c8435a45842f44f6 | 236 | Refactored: extractSignalsFromContent uses LLM for signal detection and classification |
| src/lib/template-extractor.ts | 7e57460730c8bbf04729483826575088 | 282 | Refactored: extractFromTemplate requires LLMProvider, uses classifySectionType |
| src/lib/compressor.ts | 1b45ac810b12132147ca8253c2cd7816 | 228 | Refactored: compressPrinciples requires LLMProvider, uses mapToCJKAnchor and mapToEmoji |
| src/lib/memory-extraction-config.ts | b74117f9cd9e3d22fd5bb6b5da03ed63 | 406 | Refactored: extractSignalsFromMemory and extractFromSections use LLM classification |
| src/lib/pipeline.ts | d04646ac33246d877b1d03287cdef132 | 733 | Pipeline orchestrator: threads LLM through all stages, validates LLM at entry |
| src/lib/reflection-loop.ts | d0dccb618c4f00fd05f9d7752ae3ff5d | 294 | Reflective synthesis: runReflectiveLoop threads LLM to createPrincipleStore and compressPrinciples |
| src/commands/synthesize.ts | 13ba4515c0c66c1bcab8fc07599e1b75 | 224 | Command entry: validates LLM from skill context, passes to pipeline |
| src/skill-entry.ts | e6c8e71a2cc439d853f55d21170a9366 | 171 | Skill entry point: synthesize() validates LLMProvider, re-exports LLMRequiredError |
| tests/mocks/llm-mock.ts | 8a4664e34d76ad22c7b0700626ac32cd | 355 | Mock LLM for testing: createMockLLM, createSemanticEquivalenceMockLLM, createFailingMockLLM |

## Relationships

### Architecture Layers

```
Entry Points (skill-entry.ts, synthesize.ts)
    |
    v
Pipeline (pipeline.ts) -- validates LLM at entry
    |
    +-> Reflection Loop (reflection-loop.ts)
    |       |
    |       +-> Principle Store (principle-store.ts) -- LLM for dimension
    |       +-> Compressor (compressor.ts) -- LLM for CJK/emoji
    |
    +-> Signal Extraction
            |
            +-> signal-extractor.ts -- LLM for detection + type
            +-> template-extractor.ts -- LLM for section type
            +-> memory-extraction-config.ts -- LLM for sections
            +-> metrics.ts -- LLM fallback for legacy signals

Core Modules (no LLM threading needed):
    +-> semantic-classifier.ts -- all classification functions
    +-> semantic-vocabulary.ts -- canonical vocabularies
    +-> types/llm.ts -- interfaces and error types
```

### LLM Threading Pattern

All modules follow the same pattern:
1. Accept `LLMProvider` as first parameter or in options
2. Call `requireLLM()` or throw `LLMRequiredError` if null
3. Delegate to `semantic-classifier.ts` functions
4. No fallback to keyword matching (Option C design)

### Data Flow

```
Memory Files --> signal-extractor --> Signals (with dimension via LLM)
                     |
Templates --> template-extractor --> Signals (with section type via LLM)
                     |
                     v
              principle-store (LLM for dimension if not set)
                     |
                     v
              compressor (LLM for CJK/emoji mapping)
                     |
                     v
              SOUL.md with axioms
```

## Suggested Focus

- **Priority 1**: `src/lib/semantic-classifier.ts`, `src/types/llm.ts` - Core semantic classification infrastructure
- **Priority 2**: `src/lib/pipeline.ts`, `src/lib/reflection-loop.ts` - LLM threading through pipeline stages
- **Priority 3**: Refactored modules (principle-store, metrics, signal-extractor, template-extractor, compressor, memory-extraction-config) - Verify no remaining keyword matching

## Exploration Notes

1. **Plan Status**: The plan shows status as "Complete" indicating implementation is done

2. **Key Design Decisions**:
   - Option C fallback: Throw error if LLM not provided (no keyword fallback)
   - Track 1 (embeddings + cosine similarity in matcher.ts) untouched
   - Track 2 (LLM classification) is new infrastructure

3. **CRITICAL CONSTRAINT from proposal**: "NO regex, string contains, or keyword matching" for semantic classification

4. **Vocabulary centralization**: CJK_ANCHORS and EMOJI_VOCABULARY moved to semantic-vocabulary.ts, LLM selects from these canonical sets

5. **Async conversion**: Many functions converted to async due to LLM calls (e.g., addSignal, extractSignalsFromContent)

6. **Test infrastructure**: Mock LLM provider supports:
   - Deterministic responses for reproducible tests
   - Semantic equivalence testing ("be concise" and "prefer brevity" same dimension)
   - Call recording for test inspection
   - Configurable delay for async behavior testing

7. **Verification needed**: Stage 11 of plan requires searching for remaining `.includes()` calls in semantic classification paths
