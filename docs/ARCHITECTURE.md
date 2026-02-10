# NEON-SOUL Architecture

**Status**: Production Ready (Signal Generalization + Cascading Thresholds)
**Implements**: [Soul Bootstrap Proposal](proposals/soul-bootstrap-pipeline-proposal.md)
**Methodology**: [PBD Single-Source Guide](guides/single-source-pbd-guide.md), [PBD Multi-Source Guide](guides/multi-source-pbd-guide.md)

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
| `signal-generalizer.ts` | LLM-based signal generalization | `generalizeSignal`, `generalizeSignals`, `PROMPT_VERSION` |
| `state.ts` | Incremental processing state | `loadState`, `saveState`, `shouldRunSynthesis` |
| `backup.ts` | Backup and rollback | `backupFile`, `rollback`, `commitSoulUpdate` |
| `template-extractor.ts` | Extract signals from SOUL.md templates | `extractFromTemplate`, `extractFromTemplates` |
| `principle-store.ts` | Accumulate and match principles | `createPrincipleStore`, `PrincipleStore`, `setThreshold` |
| `compressor.ts` | Synthesize axioms from principles | `compressPrinciples`, `compressPrinciplesWithCascade`, `generateSoulMd` |
| `metrics.ts` | Compression measurement | `calculateMetrics`, `formatMetricsReport` |
| `trajectory.ts` | Stabilization tracking | `TrajectoryTracker`, `calculateStyleMetrics` |

### Type Definitions (`src/types/`)

| Type | Purpose |
|------|---------|
| `Signal` | Extracted behavioral pattern with embedding |
| `GeneralizedSignal` | Abstract principle with provenance (model, prompt version) |
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
│  (signal-extractor)  │  Each signal gets initial embedding
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Signal Generalization │  LLM transforms specific signals to abstract principles
│  (signal-generalizer)  │  "Prioritize honesty" → "Values truthfulness over comfort"
│                        │  Generalized text gets 384-dim embedding for matching
└────────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Reflective Loop     │  Iterative synthesis (principle-store persists)
│  (reflection-loop)   │  N-counts accumulate - related signals cluster!
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Cascading Threshold │  Try N>=3 → N>=2 → N>=1 (adaptive)
│  (compressor.ts)     │  Tier labels reflect actual N-count
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Research Guardrails │  Warnings only (expansion, cognitive load, fallback)
│  (compressor.ts)     │  Does not block - system adapts
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  Output Validation   │  Verify format, persist synthesis data
│                      │  Backup current SOUL.md first
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  SOUL.md Generation  │  Write with full provenance
│  + Git Commit        │  Display original phrasings for authentic voice
└──────────────────────┘
```

### Cascading Threshold Logic

The axiom promotion stage uses cascading thresholds to adapt to data quality:

```
Try N>=3 (high confidence) --> got >= 3 axioms? --> done
     |
     v (< 3 axioms)
Try N>=2 (medium confidence) --> got >= 3 axioms? --> done
     |
     v (< 3 axioms)
Try N>=1 (low confidence) --> use whatever we got
```

**Tier assignment** is based on actual N-count, not cascade level:
- Core (N>=5): Highest evidence
- Domain (N>=3): Solid evidence
- Emerging (N<3): Still learning

This ensures honest labeling regardless of which cascade level produced the result.

---

## Signal Generalization

The generalization step transforms specific signals into abstract principles before embedding, enabling better semantic clustering.

### Why Generalization?

**Problem**: Without generalization, similar signals don't cluster:
- "Prioritize honesty over comfort" (embedding A)
- "Always tell the truth" (embedding B)
- Cosine similarity: ~0.25 → NO MATCH

**Solution**: Generalize to abstract forms:
- "Prioritize honesty over comfort" → "Values truthfulness over comfort"
- "Always tell the truth" → "Values truthfulness in communication"
- Cosine similarity: ~0.85 → MATCH! (N=2)

### Implementation

The `signal-generalizer.ts` module uses LLM to transform signals:

1. **Prompt constraints**: Actor-agnostic, imperative form, <150 chars
2. **Validation**: Rejects outputs with pronouns, policy invention, or excessive length
3. **Fallback**: On validation failure, uses original signal text
4. **Provenance**: Tracks model, prompt version, timestamp, fallback status

### Clustering Results

With generalization (threshold 0.45 for abstract embeddings):
- **Compression ratio**: 5:1 (vs 1:1 baseline)
- **N-count distribution**: [10, 3, 2] for 15 signals → 3 principles
- **Improvement**: 400% better clustering

---

## Voice Preservation Strategy

Generalization trades authentic voice for clustering efficiency. The solution: decouple representation (for clustering) from presentation (for UX).

### The Tension

User says: "Prioritize honesty over comfort" — that's *their* fingerprint.
Generalized: "Values truthfulness over social comfort" — *our* abstraction.

### Resolution

1. **Cluster on generalized embeddings** — Technical accuracy for matching
2. **Display original phrasings** — Authentic voice in SOUL.md
3. **Select most representative original** — Best exemplar as cluster label

### SOUL.md Display (Recommended)

Show original signal that best represents cluster, with N-count:

```markdown
## Core Axioms

### Honesty Framework
- **Prioritize honesty over comfort** (N=4)
  - Related: "tell truth", "avoid deception", "direct feedback"
```

### Actor-Agnostic vs Personal Display

- **Clustering form**: Actor-agnostic ("Values X") — for embedding similarity
- **Display form**: Re-personalize with "I" — for user's document

The generalized form is internal; the user sees their own words.

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
