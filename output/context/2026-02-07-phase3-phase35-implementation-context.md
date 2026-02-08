# Context: Phase 3 Memory Ingestion and Phase 3.5 Pipeline Completion

**Generated**: 2026-02-07 22:45:00
**Scout**: haiku
**Mode**: flexible
**Topic**: Phase 3 Memory Ingestion and Phase 3.5 Pipeline Completion implementation

---

## Summary

Phase 3 implements the core memory ingestion pipeline for NEON-SOUL, a soul synthesis system that extracts identity signals from OpenClaw memory files, clusters them into principles, promotes high-N-count principles to axioms, and generates a compressed SOUL.md.

Phase 3.5 completes the pipeline infrastructure by resolving critical gaps:
- C-1: Fixed path convention mismatch (memoryPath vs workspacePath)
- C-2: Implemented pattern-based signal extraction fallback
- C-3: Wired backup stage to existing backup utilities
- I-1: Connected all 8 pipeline stages to real implementations
- I-2: Added persistence layer for synthesis data

---

## Files (38 relevant)

### Core Pipeline (Phase 3)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/pipeline.ts | d3c87a05190fff68 | 749 | Pipeline orchestrator with 8 stages, iterative synthesis, progress tracking |
| src/lib/reflection-loop.ts | d36a7f3b0ac4d285 | 310 | Iterative reflective synthesis with trajectory tracking and convergence detection |
| src/lib/source-collector.ts | dd7d2f7745ad77d6 | 357 | Collects memory files, SOUL.md, USER.md, interview responses from workspace |
| src/lib/soul-generator.ts | 1b24c0efbfb578b3 | 359 | Generates SOUL.md with 7 SoulCraft dimensions, notation formatting, metrics |
| src/lib/memory-walker.ts | b72bd9a0620eab04 | 335 | Traverses OpenClaw memory directory, change detection via content hashing |
| src/lib/memory-extraction-config.ts | 475861008de2fd9c | 422 | Memory-specific signal extraction configuration with LLM-based classification |
| src/lib/interview.ts | ef92588816e0be9f | 416 | Adaptive interview flow for sparse dimensions, signal extraction from responses |

### Phase 3.5 Additions

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/persistence.ts | df32eba67ccffb9d | 220 | NEW: Synthesis data persistence (signals.json, principles.json, axioms.json) |
| src/lib/backup.ts | 89f5ced5b0402d78 | 193 | Backup/rollback utilities with rotation (max 10 backups) |
| src/lib/state.ts | 89cac5bfe6e2a554 | 105 | Incremental processing state, content threshold check |

### Signal Extraction & Classification

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/signal-extractor.ts | a929e3ca445c7c1f | 277 | LLM-based signal extraction with batch processing, parallelized operations |
| src/lib/semantic-classifier.ts | 2c924ed03aa03bb1 | 213 | Central LLM classification (dimension, signalType, sectionType, category) |
| src/lib/semantic-vocabulary.ts | a99996f1129be265 | 65 | Vocabulary constants for signal types, section types, memory categories |

### Principle & Axiom Processing

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/compressor.ts | e1c2fb1359166fdb | 228 | Compresses principles to axioms (N>=3), generates canonical forms via LLM |
| src/lib/principle-store.ts | fa07e7ceab667a19 | 216 | Principle store with clustering, similarity matching, N-count tracking |
| src/lib/trajectory.ts | a183ec51218e16da | 223 | Trajectory tracking for synthesis stabilization, metrics calculation |

### Infrastructure & Utilities

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/embeddings.ts | 62b3560514052164 | 118 | 384-dim embeddings via transformers.js (all-MiniLM-L6-v2) |
| src/lib/matcher.ts | b2fc4fcecbef25ee | 64 | Cosine similarity calculation for embedding comparison |
| src/lib/provenance.ts | 31a06adfa6a15291 | 104 | Provenance chain creation for audit trail |
| src/lib/metrics.ts | d17a76f4c224a341 | 171 | Token counting, compression ratio calculation |
| src/lib/markdown-reader.ts | d1c1fbeb2fed8c85 | 76 | Markdown parsing with frontmatter and section extraction |
| src/lib/question-bank.ts | f02867cb34ef9215 | 459 | Interview question bank for 7 SoulCraft dimensions |

### Type Definitions

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/types/signal.ts | eef758175d1f21c0 | 58 | Signal types, SoulCraft dimensions, SignalSource interface |
| src/types/axiom.ts | 038abf99cf59371b | 49 | Axiom types, tiers (core/domain/emerging), CanonicalForm |
| src/types/principle.ts | 85dccff79ac0db46 | 33 | Principle types with provenance and history |
| src/types/interview.ts | d47c9035966c55d0 | 170 | Interview types (session, question, response, coverage) |
| src/types/llm.ts | bdb22fc1d6c3ab31 | 115 | LLM provider interface, classification result, error handling |
| src/types/dimensions.ts | 661d2d5610ae8c0b | 23 | SoulCraft dimension constants |

### Commands

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/commands/synthesize.ts | 69aab4c445f65e68 | 222 | Main synthesis command with CLI options |
| src/commands/audit.ts | b0a93d58c50ba2ba | 424 | Axiom audit trail command |
| src/commands/status.ts | b2b4669f16d42dae | 324 | Pipeline status command |
| src/commands/rollback.ts | 9f1a5842fa34feb9 | 300 | Backup rollback command |
| src/commands/trace.ts | 9e9a9f4788bdf072 | 290 | Signal trace command |

### Tests & Scripts

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| tests/integration/pipeline.test.ts | 0ca463c4847f2d4d | 126 | Pipeline integration tests using fixtures |
| scripts/test-pipeline.ts | c62eb5cd3c760a69 | 216 | Full pipeline test script |
| scripts/README.md | bf11499c0ee69de9 | 70 | Scripts documentation |

### Docker Configuration

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| docker/Dockerfile.neon-soul | 371d8438a815a96d | 45 | Docker image for signal extraction service |
| docker/docker-compose.yml | f0bb412524b5aa05 | 86 | Docker Compose configuration |

---

## Historical Notes (from Historian)

*No observations indexed for this topic yet. This is the initial implementation.*

---

## Relationships

### Data Flow
```
Memory Files (memory/*.md)
    |
    v
source-collector.ts --> MemoryFile[]
    |
    v
signal-extractor.ts --> Signal[] (with embeddings from embeddings.ts)
    |
    v
principle-store.ts --> Principle[] (clustering by similarity)
    |
    v
reflection-loop.ts --> Iterate until convergence
    |
    v
compressor.ts --> Axiom[] (N>=3 promoted, canonical forms via LLM)
    |
    v
soul-generator.ts --> SOUL.md (7 dimensions, formatted)
    |
    v
persistence.ts --> .neon-soul/{signals,principles,axioms}.json
```

### Key Dependencies
- **pipeline.ts** imports: source-collector, signal-extractor, reflection-loop, soul-generator, backup, state, persistence
- **reflection-loop.ts** imports: principle-store, compressor, trajectory, embeddings, matcher
- **signal-extractor.ts** imports: embeddings, provenance, semantic-classifier
- **compressor.ts** imports: provenance, llm types
- **All classification** routes through: semantic-classifier.ts (requires LLMProvider)

### LLM Requirement
- Option C design: LLM is **required** for all classification operations
- No fallback to keyword matching
- LLMRequiredError thrown if llm is null/undefined
- Pattern: `requireLLM(llm, 'functionName')` at function entry

---

## Suggested Focus

- **Priority 1**: `src/lib/pipeline.ts` (749 lines) - Core orchestration, most critical for understanding flow
- **Priority 2**: `src/lib/reflection-loop.ts`, `src/lib/persistence.ts` - Key Phase 3/3.5 implementations
- **Priority 3**: `src/lib/signal-extractor.ts`, `src/lib/semantic-classifier.ts` - LLM-based extraction

---

## Exploration Notes

### Architecture Patterns
1. **Single-track architecture**: OpenClaw never updates SOUL.md after bootstrap, so no merge needed. Output replaces original.
2. **Re-clustering with progressive thresholds**: Each iteration uses stricter similarity (principleThreshold + iteration * 0.02)
3. **Atomic file writes**: persistence.ts uses temp file + rename to prevent corruption
4. **Backup rotation**: Maximum 10 backups to prevent inode accumulation

### Security Measures
- Prompt injection prevention via XML delimiters in semantic-classifier.ts
- Command injection prevention via execFileSync with array arguments in backup.ts
- SHA-256 hashing for content integrity (not MD5)
- crypto.randomUUID() for collision-resistant IDs

### Quality Fixes Applied (from code review)
- CR-1: Fixed async extractFromFrontmatter
- CR-2: XML delimiters for prompt injection protection
- CR-3: Build errors fail container build (no silent failure)
- CR-6-1: Parallelized dimension + signalType + embedding classification
- IM-2: minConfidence filter and maxSignalsPerFile limit
- IM-4: Priority sorting corrected (higher = earlier)
- IM-5: Response confidence from quality indicators
- IM-6: Text truncation before embedding
- IM-7: Rollback error logging
- IM-11: Trajectory point sliding window (max 100)
- MN-2: crypto.randomUUID() instead of Math.random
- MN-3: SHA-256 instead of MD5, backup rotation
- MN-4: maxSignalsPerFile aligned with prompt (10)
- TR-2: Parallelized file-level extraction
- TR-4: Shared requireLLM from llm.ts
- TR-5: Language note for multilingual input

---

*Generated by Scout Agent for Phase 3/3.5 implementation review.*
