# Context: NEON-SOUL Implementation

**Generated**: 2026-02-07 (Scout)
**Scout**: haiku
**Mode**: flexible
**Topic**: NEON-SOUL implementation (soul-bootstrap-master.md) - reviewing the TypeScript implementation of the soul synthesis pipeline

## Files (50 relevant)

### Core Pipeline (7 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/pipeline.ts | 02a0d9984329ae15 | 719 | Main pipeline orchestrator - 8 stages from check-threshold to commit-changes |
| src/lib/reflection-loop.ts | 15239842f5ec97ff | 287 | Iterative synthesis with convergence detection via centroid drift |
| src/lib/soul-generator.ts | 009d2ac970be975b | 364 | SOUL.md generation with 7 SoulCraft dimensions and notation formats |
| src/lib/signal-extractor.ts | 76bf8bf08043a6c3 | 284 | Pattern-based signal extraction with embedding-based dimension classification |
| src/lib/source-collector.ts | dd7d2f7745ad77d6 | 357 | Collects memory files, SOUL.md, USER.md, interview responses |
| src/lib/principle-store.ts | 8ee25a32966ec987 | 264 | Signal-to-principle matching with N-count tracking |
| src/lib/compressor.ts | 5472f1092b53db87 | 258 | Principle compression to axioms (N>=3 promotion) |

### Semantic Matching (3 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/embeddings.ts | f69811236b508fe5 | 109 | Xenova transformers (all-MiniLM-L6-v2) for 384-dim embeddings |
| src/lib/matcher.ts | b2fc4fcecbef25ee | 64 | Cosine similarity matching with configurable threshold (0.85 default) |
| src/lib/trajectory.ts | 02f34cede3aee9de | 207 | Trajectory tracking for convergence metrics and attractor strength |

### Persistence & State (4 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/state.ts | 89cac5bfe6e2a554 | 105 | State management for last run timestamp and threshold checks |
| src/lib/persistence.ts | 8547f82fbfb4d5e0 | 204 | JSON persistence for signals, principles, axioms in .neon-soul/ |
| src/lib/backup.ts | 71891387bdd82635 | 147 | Backup/rollback with timestamped copies and git commit integration |
| src/lib/provenance.ts | 31a06adfa6a15291 | 104 | Creates provenance chains from signal to principle to axiom |

### Configuration & Utilities (6 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/config.ts | 4e7303853ce4d6d5 | 95 | Configuration loading from .neon-soul/config.json |
| src/lib/paths.ts | e08960e5ee1c1e6e | 85 | Path utilities - default workspace, memory, output paths |
| src/lib/metrics.ts | a339e2b5b67c4092 | 165 | Token counting, compression ratio, semantic density metrics |
| src/lib/markdown-reader.ts | d1c1fbeb2fed8c85 | 76 | Markdown parsing with frontmatter extraction |
| src/lib/memory-walker.ts | c6a0b3d7bd39a4a6 | 310 | Recursive directory walker for memory files |
| src/lib/notation-formatter.ts | b0721a66a37b1d75 | 247 | Formats axioms in native/cjk-labeled/cjk-math/cjk-math-emoji |

### Interview & Evolution (5 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/interview.ts | 96ea6db7ce216aca | 285 | Interview flow for sparse dimension supplementation |
| src/lib/question-bank.ts | f02867cb34ef9215 | 459 | Question bank organized by SoulCraft dimensions |
| src/lib/axiom-emergence.ts | 81d3e270e8e83264 | 288 | Axiom emergence detection and tracking |
| src/lib/evolution.ts | 608901b8301c6ab0 | 409 | Soul evolution tracking over time |
| src/lib/memory-extraction-config.ts | 539335560b3b5874 | 452 | Memory extraction configuration and prompt templates |

### Template Handling (1 file)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/template-extractor.ts | 48e9ca7f8427048e | 231 | Extracts signals from OpenClaw templates |

### Entry Points (2 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/index.ts | 89a2b882e99c687c | 156 | Main module exports - all public API |
| src/skill-entry.ts | 96274f99719b3e8c | 146 | OpenClaw skill loader with command dispatch |

### Commands (6 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/commands/synthesize.ts | 157df2ec80459964 | 244 | Main synthesis command - runs pipeline with options |
| src/commands/status.ts | b2b4669f16d42dae | 324 | Shows current soul state, pending memory, dimension coverage |
| src/commands/audit.ts | 598d6362fa5a2951 | 426 | Full provenance exploration - list, stats, axiom trace |
| src/commands/trace.ts | 4c8f0b4c7b6e019e | 290 | Quick single-axiom provenance lookup |
| src/commands/rollback.ts | 9f1a5842fa34feb9 | 300 | Restore previous SOUL.md from backup |
| src/commands/download-templates.ts | a3a9ae80e781e9f9 | 165 | Download OpenClaw public templates |

### Types (6 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/types/signal.ts | eef758175d1f21c0 | 58 | Signal types - 10 signal types, 7 SoulCraft dimensions |
| src/types/principle.ts | 85dccff79ac0db46 | 33 | Principle with N-count, embedding, provenance |
| src/types/axiom.ts | 0aca481cf8fe3fa8 | 39 | Axiom with tier, dimension, canonical form |
| src/types/dimensions.ts | 661d2d5610ae8c0b | 23 | SoulCraft dimension constants |
| src/types/provenance.ts | b53c31684e6490bb | 22 | Provenance chain types |
| src/types/interview.ts | a3ca908cc85c9da0 | 172 | Interview question and response types |

### Configuration Files (2 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| package.json | 49b426d5852482e9 | 57 | Node.js package - Xenova transformers, zod, vitest |
| tsconfig.json | 3baed45dceb0f3dc | 39 | TypeScript strict mode with ES2022 target |

### Documentation (2 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| skill/SKILL.md | 0723a410117f0db0 | 226 | OpenClaw skill manifest with command documentation |
| docs/plans/2026-02-07-soul-bootstrap-master.md | 33b26a931c6e5b97 | 264 | Master plan coordinating 5 implementation phases |

### Tests (6 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| tests/integration/pipeline.test.ts | 0ca463c4847f2d4d | 126 | Pipeline integration tests with fixture loading |
| tests/integration/matcher.test.ts | d3fd737ad1ef436f | 147 | Semantic matcher tests |
| tests/integration/audit.test.ts | a17370bfc6dac8aa | 198 | Audit command tests |
| tests/integration/axiom-emergence.test.ts | 1e0f989fbc294532 | 193 | Axiom emergence detection tests |
| tests/integration/soul-generator.test.ts | 7d016cd96146d1f9 | 165 | SOUL.md generation tests |
| tests/e2e/live-synthesis.test.ts | 679c3e4392dcdb37 | 372 | End-to-end synthesis tests |

## Historical Notes (from Historian)

*No observations indexed for this topic - new implementation.*

## Relationships

### Data Flow

```
Memory Files (memory/*.md)
        |
        v
Source Collector --> collects SOUL.md, USER.md, interviews
        |
        v
Signal Extractor --> pattern-based extraction + embedding classification
        |
        v
Principle Store --> semantic matching (cosine >= 0.85) + N-count tracking
        |
        v
Compressor --> promotes principles with N >= 3 to axioms
        |
        v
Reflective Loop --> iterative synthesis until convergence
        |
        v
Soul Generator --> formats SOUL.md with 7 dimensions
        |
        v
Persistence --> saves to .neon-soul/ with provenance
```

### Key Dependencies

1. **pipeline.ts** orchestrates all stages, depends on:
   - source-collector.ts (stage: collect-sources)
   - signal-extractor.ts (stage: extract-signals)
   - reflection-loop.ts (stage: reflective-synthesis)
   - soul-generator.ts (stage: generate-soul)
   - backup.ts (stage: backup-current, commit-changes)
   - state.ts (threshold checking)
   - persistence.ts (data storage)

2. **reflection-loop.ts** depends on:
   - principle-store.ts (signal to principle matching)
   - compressor.ts (principle to axiom promotion)
   - trajectory.ts (convergence tracking)
   - embeddings.ts (set embedding calculation)

3. **signal-extractor.ts** depends on:
   - embeddings.ts (text to 384-dim vectors)
   - matcher.ts (dimension classification)
   - provenance.ts (source tracking)

4. **Commands** all use skill-entry.ts for dispatch and share:
   - paths.ts (workspace resolution)
   - persistence.ts (data loading)
   - state.ts (status information)

### Type Hierarchy

```
Signal (raw extraction)
   |
   v (semantic matching + N-count)
Principle (intermediate)
   |
   v (N >= 3 promotion)
Axiom (final identity)
```

## Suggested Focus

- **Priority 1**: `src/lib/pipeline.ts` (719 lines) - Main orchestration, all 8 stages wired, core logic
- **Priority 2**: `src/lib/reflection-loop.ts` (287 lines) - Convergence algorithm, trajectory tracking
- **Priority 3**: `src/lib/signal-extractor.ts` (284 lines) - Pattern extraction, dimension classification
- **Priority 4**: `src/commands/synthesize.ts` (244 lines) - User-facing command, option parsing
- **Priority 5**: `tests/e2e/live-synthesis.test.ts` (372 lines) - End-to-end validation

## Exploration Notes

### Architecture Highlights

1. **Semantic-First Matching**: All matching uses embeddings + cosine similarity (0.85 threshold). No regex or keyword matching per critical constraint in master plan.

2. **8-Stage Pipeline**:
   - check-threshold: Skip if not enough new memory
   - collect-sources: Gather memory files, SOUL.md, USER.md
   - extract-signals: Pattern-based extraction with embedding classification
   - reflective-synthesis: Iterative principle/axiom synthesis
   - validate-output: Reject empty/malformed output
   - backup-current: Safety backup before write
   - generate-soul: Generate new SOUL.md
   - commit-changes: Auto-commit if git repo

3. **Provenance Chain**: Every axiom traces back through principles to source signals with file:line references.

4. **Notation Formats**: Supports 4 output formats (native, cjk-labeled, cjk-math, cjk-math-emoji).

5. **7 SoulCraft Dimensions**: identity-core, character-traits, voice-presence, honesty-framework, boundaries-ethics, relationship-dynamics, continuity-growth.

### Implementation Observations

- **Pattern-based fallback**: LLM integration placeholder exists but pattern-based extraction is the deterministic fallback for tests/CI.
- **Trajectory convergence**: Uses centroid drift and attractor strength metrics from Reflective Manifold research.
- **Dry-run support**: Pipeline stages marked `skipInDryRun` are skipped in preview mode.
- **Git integration**: Auto-commit with rollback support via backup system.

### Test Coverage

- Integration tests verify fixture loading and structure validation
- E2E tests cover full synthesis flow
- Tests use test-fixtures directory for reproducibility
