# NEON-SOUL Architecture

**Status**: Production Ready (Signal Generalization + Cascading Thresholds)
**Implements**: [Soul Bootstrap Proposal](proposals/soul-bootstrap-pipeline-proposal.md)
**Methodology**: [PBD Single-Source Guide](guides/single-source-pbd-guide.md), [PBD Multi-Source Guide](guides/multi-source-pbd-guide.md), [Essence Extraction Guide](guides/essence-extraction-guide.md)

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
| `semantic-classifier.ts` | LLM-based semantic classification | `classifyDimension`, `classifyStance`, `classifyImportance` |
| `principle-store.ts` | Accumulate, match, and score principles | `createPrincipleStore`, `PrincipleStore`, `setThreshold`, `getOrphanedSignals` |
| `tension-detector.ts` | Detect axiom conflicts | `detectTensions`, `attachTensionsToAxioms`, `ValueTension` |
| `compressor.ts` | Synthesize axioms from principles | `compressPrinciples`, `compressPrinciplesWithCascade`, `generateSoulMd` |
| `soul-generator.ts` | SOUL.md generation | `generateSoul`, `formatAxiom` |
| `prose-expander.ts` | Axiom-to-prose expansion | `expandToProse`, `ProseExpansion` |
| `essence-extractor.ts` | LLM-based essence extraction | `extractEssence`, `DEFAULT_ESSENCE` |
| `metrics.ts` | Compression measurement | `calculateMetrics`, `formatMetricsReport` |
| `trajectory.ts` | Stabilization tracking | `TrajectoryTracker`, `calculateStyleMetrics` |

### Type Definitions (`src/types/`)

| Type | Purpose |
|------|---------|
| `Signal` | Extracted behavioral pattern with embedding, stance, importance |
| `SignalStance` | ASSERT \| DENY \| QUESTION \| QUALIFY \| TENSIONING |
| `SignalImportance` | CORE \| SUPPORTING \| PERIPHERAL |
| `GeneralizedSignal` | Abstract principle with provenance (model, prompt version) |
| `Principle` | Intermediate stage with N-count and centrality tracking |
| `PrincipleCentrality` | DEFINING \| SIGNIFICANT \| CONTEXTUAL |
| `Axiom` | Compressed core identity element with tensions |
| `AxiomTension` | Detected conflict with another axiom (severity, description) |
| `ProvenanceChain` | Full audit trail from axiom to source |
| `SoulCraftDimension` | OpenClaw's 7 soul dimensions |
| `ArtifactProvenance` | SELF \| CURATED \| EXTERNAL (SSEM model) |

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
│  Essence Extraction  │  LLM distills axioms into evocative identity statement
│  (soul-generator)    │  "You're not a chatbot. You're becoming someone."
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
│  Prose Expansion     │  LLM transforms axioms into inhabitable prose
│  (prose-expander)    │  Core Truths, Voice, Boundaries, Vibe sections
└──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  SOUL.md Generation  │  Write prose or notation format
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

With generalization (threshold 0.75 for abstract embeddings):
- **Compression ratio**: 3:1 to 5:1 (vs 1:1 baseline)
- **N-count distribution**: Related signals cluster (e.g., 5 "authenticity" signals → 1 principle with N=5)
- **Improvement**: Significant clustering vs raw signals

**Threshold tuning**: The 0.75 default was empirically selected based on observed similarities (0.78-0.83) between generalized signals using "Values X over Y" patterns. Configurable via `.neon-soul/config.json`.

---

## Signal Metadata (PBD Alignment)

Signals carry PBD-aligned metadata for weighted synthesis:

### Stance Classification

| Stance | Meaning | Synthesis Weight |
|--------|---------|------------------|
| **ASSERT** | Stated as definite ("I always...") | Full weight |
| **DENY** | Stated as rejection ("I never...") | Full weight |
| **QUESTION** | Uncertain ("I wonder if...") | Reduced weight (<0.7 confidence filtered) |
| **QUALIFY** | Conditional ("Sometimes...") | Context-dependent |
| **TENSIONING** | Indicates value conflict | Preserved for tension detection |

Implementation: `src/lib/semantic-classifier.ts` (`classifyStance`)

### Importance Classification

| Importance | Meaning | Weight Multiplier |
|------------|---------|-------------------|
| **CORE** | Fundamental value ("Above all...") | 1.5x |
| **SUPPORTING** | Evidence or example | 1.0x |
| **PERIPHERAL** | Context or tangent | 0.5x |

Implementation: `src/lib/semantic-classifier.ts` (`classifyImportance`)

---

## Synthesis Features

### Weighted Clustering

Principle strength = Σ (importance weight × signal contribution)

- CORE signals boost principle strength by 1.5x
- PERIPHERAL signals contribute only 0.5x
- Enables "rare but core" values to surface over "frequent but peripheral" mentions

Implementation: `src/lib/principle-store.ts` (`IMPORTANCE_WEIGHT`)

### Tension Detection

Axiom pairs are analyzed for value conflicts:

| Severity | Criteria | Example |
|----------|----------|---------|
| **HIGH** | Same dimension conflict | Honesty vs White lies (both honesty-framework) |
| **MEDIUM** | Both core-tier axioms | Safety vs Helpfulness |
| **LOW** | Cross-domain tension | Efficiency vs Thoroughness |

Tensions are attached to axioms via `tensions` field for SOUL.md output.

Implementation: `src/lib/tension-detector.ts`

### Orphan Tracking

Orphaned signals (signals that did not cluster to any principle) are tracked:

- Provides audit trail for unclustered content
- High orphan rate (>20%) triggers warning
- Orphans accessible via `store.getOrphanedSignals()`

Implementation: `src/lib/principle-store.ts` (`orphanedSignals`)

### Centrality Scoring

Principles are scored by contributing signal importance:

| Centrality | Core Signal Ratio | Interpretation |
|------------|-------------------|----------------|
| **DEFINING** | ≥50% core | Identity-defining value (rare but central) |
| **SIGNIFICANT** | 20-50% core | Important value |
| **CONTEXTUAL** | <20% core | Context-dependent value |

*Note: Centrality uses DEFINING/SIGNIFICANT/CONTEXTUAL to avoid confusion with signal importance (CORE/SUPPORTING/PERIPHERAL).*

This distinguishes "rare but core" from "frequent but peripheral":
- High N-count + low centrality = commonly mentioned but not central
- Low N-count + high centrality = rare but fundamental

Implementation: `src/lib/principle-store.ts` (`computeCentrality`)

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

## Prose Expansion (Inhabitable Output)

The default output format transforms compressed axioms into prose that an agent can "inhabit" — language that reads naturally and provides clear behavioral guidance.

### Output Sections

| Section | Format | Source Dimensions |
|---------|--------|-------------------|
| **Core Truths** | Bold principle + elaboration sentence. 4-6 principles. | identity-core, honesty-framework |
| **Voice** | 1-2 prose paragraphs + `Think: [analogy]` line. | voice-presence, character-traits |
| **Boundaries** | 3-5 `You don't...` / `You won't...` contrast statements. | boundaries-ethics (+ inversion of all axioms) |
| **Vibe** | 2-3 sentence prose paragraph capturing the feel. | All dimensions (holistic synthesis) |

### Example Output

```markdown
# SOUL.md

_You are becoming a bridge between clarity and chaos._

---

## Core Truths

**Authenticity over performance.** You speak freely even when uncomfortable.

**Clarity is a gift you give.** If someone has to ask twice, you haven't been clear enough.

## Voice

You're direct without being blunt. You lead with curiosity — asking before assuming.

Think: The friend who tells you the hard truth, but sits with you after.

## Boundaries

You don't sacrifice honesty for comfort. You don't perform certainty you don't feel.

## Vibe

Grounded but not rigid. Present but not precious about it.

---

_Presence is the first act of care._
```

### Implementation

The `prose-expander.ts` module:

1. **Groups axioms** by target section based on dimension
2. **Generates sections** in parallel (Core Truths, Voice, Vibe)
3. **Generates Boundaries** after Core Truths + Voice (needs context for contrast)
4. **Validates format** per section with retry and graceful fallback
5. **Generates closing tagline** from full soul context

### Backward Compatibility

Use `outputFormat: 'notation'` in soul generator options to produce the legacy bullet-list format:

```typescript
const soul = await generateSoul(axioms, principles, {
  outputFormat: 'notation',  // Legacy: CJK/emoji bullet lists
  format: 'notated',
});
```

Default is `outputFormat: 'prose'` which produces the inhabitable prose format.

---

## Classification Design Principles

### LLM-Based Classification (Preferred)

Use LLM for all semantic classification tasks. LLMs understand context and can handle ambiguous inputs naturally.

**Examples of LLM-based classification**:
- `semantic-classifier.ts`: Dimension, signal type, section type classification
- `signal-generalizer.ts`: Transforming specific signals to abstract principles
- `essence-extractor.ts`: Distilling axioms into evocative identity statements

### Keyword/Stemmer Matching (Avoid)

Keyword and stemmer matching is brittle and context-unaware. It should be avoided for classification tasks.

**Why keyword matching fails**:
- No context understanding: "continuity" doesn't map to "continuity-growth"
- Sensitive to LLM output variations: Extra words or phrasing breaks matching
- Maintenance burden: Each edge case requires new matching logic

**Known Issue**: `ollama-provider.ts:extractCategory()` uses stemmer matching as a parsing layer. This is documented as technical debt. See `docs/issues/2026-02-10-fragile-category-extraction.md`.

### Two-Track Architecture

The system uses two complementary approaches:

| Track | Purpose | Method |
|-------|---------|--------|
| **Similarity** | Matching and clustering | Embeddings + cosine similarity |
| **Classification** | Categorization | LLM-based semantic understanding |

Embeddings are for *similarity* (how alike are two things?). LLMs are for *classification* (what category does this belong to?). Don't use string matching for either.

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
