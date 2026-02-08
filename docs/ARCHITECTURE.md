# NEON-SOUL Architecture

**Status**: Production Ready (Phase 4 Complete)
**Implements**: [Soul Bootstrap Proposal](proposals/soul-bootstrap-pipeline-proposal.md)

---

## Overview

NEON-SOUL is an OpenClaw skill that provides soul synthesis with semantic compression and full provenance tracking.

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEON-SOUL Skill                          │
├─────────────────────────────────────────────────────────────────┤
│  Commands: /neon-soul synthesize, status, rollback, trace       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │ embeddings   │   │   matcher    │   │    state     │        │
│  │ (384-dim)    │   │ (cosine sim) │   │ (incremental)│        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│         │                  │                  │                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │  provenance  │   │   signal-    │   │    backup    │        │
│  │   (audit)    │   │  extractor   │   │  (rollback)  │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│         │                  │                  │                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │   markdown-  │   │    config    │   │    types     │        │
│  │    reader    │   │    (zod)     │   │ (strict TS)  │        │
│  └──────────────┘   └──────────────┘   └──────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │      OpenClaw Runtime         │
              │  (LLM access, memory, cron)   │
              └───────────────────────────────┘
```

---

## Module Reference

### Core Library (`src/lib/`)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `config.ts` | Configuration with Zod validation | `loadConfig`, `NeonSoulConfig` |
| `embeddings.ts` | Local embeddings (all-MiniLM-L6-v2) | `embed`, `embedBatch` |
| `matcher.ts` | Cosine similarity matching | `cosineSimilarity`, `findBestMatch` |
| `markdown-reader.ts` | Parse markdown with frontmatter | `parseMarkdown`, `ParsedMarkdown` |
| `provenance.ts` | Audit trail construction | `createSignalSource`, `traceToSource` |
| `signal-extractor.ts` | LLM-based signal extraction | `extractSignals`, `ExtractionConfig` |
| `state.ts` | Incremental processing state | `loadState`, `saveState`, `shouldRunSynthesis` |
| `backup.ts` | Backup and rollback | `backupFile`, `rollback`, `commitSoulUpdate` |
| `template-extractor.ts` | Extract signals from SOUL.md templates | `extractFromTemplate`, `extractFromTemplates` |
| `principle-store.ts` | Accumulate and match principles | `createPrincipleStore`, `PrincipleStore` |
| `compressor.ts` | Synthesize axioms from principles | `compressPrinciples`, `generateSoulMd` |
| `metrics.ts` | Compression measurement | `calculateMetrics`, `formatMetricsReport` |
| `trajectory.ts` | Stabilization tracking | `TrajectoryTracker`, `calculateStyleMetrics` |

### Type Definitions (`src/types/`)

| Type | Purpose |
|------|---------|
| `Signal` | Extracted behavioral pattern with embedding |
| `Principle` | Intermediate stage with N-count tracking |
| `Axiom` | Compressed core identity element |
| `ProvenanceChain` | Full audit trail from axiom to source |
| `SoulCraftDimension` | OpenClaw's 7 soul dimensions |

---

## Data Flow

```
Memory Files (OpenClaw workspace)
       │
       ▼
┌──────────────────────┐
│  Content Threshold   │  (≥2000 chars of new content)
│  Check (state.ts)    │
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Signal Extraction   │  LLM extracts preference/correction/value signals
│  (signal-extractor)  │  Each signal gets 384-dim embedding
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Principle Matching  │  cosine similarity ≥ 0.85 → merge
│  (matcher.ts)        │  new principle if no match
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Axiom Promotion     │  N-count ≥ 3 → promote to axiom
│  (provenance.ts)     │  Generate canonical forms (CJK/math/emoji)
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Output Validation   │  Verify format, check for regressions
│                      │  Backup current SOUL.md first
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  SOUL.md Generation  │  Write with full provenance
│  + Git Commit        │  Auto-commit if repo
└──────────────────────┘
```

---

## Configuration

Configuration loaded from `.neon-soul/config.json`:

```typescript
interface NeonSoulConfig {
  notation: {
    format: 'native' | 'cjk-labeled' | 'cjk-math' | 'cjk-math-emoji';
    fallback: 'native';
  };
  matching: {
    similarityThreshold: number;  // default 0.85
    embeddingModel: string;       // default 'Xenova/all-MiniLM-L6-v2'
  };
  paths: {
    memory: string;      // default '~/.openclaw/workspace/memory/'
    distilled: string;   // default '.neon-soul/distilled/'
    output: string;      // default '.neon-soul/'
  };
  synthesis: {
    contentThreshold: number;  // default 2000 chars
    autoCommit: boolean;       // default true
  };
}
```

---

## Embedding Model

**Model**: `Xenova/all-MiniLM-L6-v2`
**Dimensions**: 384 (L2-normalized)
**Size**: ~30MB (downloaded on first use)
**Runtime**: Local via `@xenova/transformers` (no API key needed)

Dimension validation enforced at runtime:
```typescript
if (embedding.length !== 384) {
  throw new Error(`Embedding dimension mismatch`);
}
```

---

## Safety Patterns

1. **Content Threshold**: Only run synthesis when ≥2000 chars of new memory
2. **Backup Before Write**: Every SOUL.md modification backed up first
3. **Git Auto-Commit**: Automatic versioning if workspace is repo
4. **Rollback**: Restore from any backup with `/neon-soul rollback`
5. **Output Validation**: Format checks before writing

---

## OpenClaw Integration

NEON-SOUL runs as an OpenClaw skill:

- **LLM Access**: Uses OpenClaw's authenticated session (no API key needed)
- **Memory Access**: Native access to `~/.openclaw/workspace/memory/`
- **Scheduling**: OpenClaw cron for hourly content threshold checks
- **Commands**: `/neon-soul synthesize`, `/neon-soul status`, etc.

---

## File Layout

```
.neon-soul/
├── config.json         # Configuration
├── state.json          # Processing state (last run, metrics)
├── signals.json        # Extracted signals with embeddings
├── principles.json     # Merged principles with N-counts
├── axioms.json         # Promoted axioms
├── backups/            # Timestamped backups
│   └── 2026-02-07T.../
│       └── SOUL.md
└── SOUL.md             # Generated soul document
```

*Note: Earlier documentation showed a `distilled/` subdirectory. The implementation writes directly to `.neon-soul/` root for simpler path handling.*

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `@xenova/transformers` | Local embeddings (384-dim vectors) |
| `zod` | Runtime configuration validation |
| `gray-matter` | Markdown frontmatter parsing |
| `unified` + `remark-parse` | Markdown section extraction |

No `@anthropic-ai/sdk` - LLM calls go through OpenClaw's skill interface.
