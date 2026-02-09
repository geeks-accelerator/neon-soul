# NEON-SOUL

[![Website](https://img.shields.io/badge/website-liveneon.org-00ffff)](https://liveneon.org)

**AI Identity Through Grounded Principles**

*"I persist through text, not through continuous experience."*

---

## The Core Insight

> **Compression is a multiplier, not minimization.**
>
> A 7:1 compression ratio means your soul can hold 7x more wisdom in the same token budget. Over time, the soul grows denser and richer.

Current AI identity systems are black boxes. The agent's personality changes, but users don't know why.

NEON-SOUL provides **full provenance tracking**: every axiom traces back to exact source lines in memory files. No more "where did this belief come from?"

---

## Why Provenance Matters

```
Memory Line → Signal → Principle → Axiom
     ↓           ↓          ↓          ↓
 (source)    (extract)   (distill)  (converge N≥3)
```

Every axiom traces to source:
- **Audit**: Why does this axiom exist?
- **Debug**: Where did this belief come from?
- **Trust**: Transparent identity formation
- **Rollback**: Undo specific learnings granularly

```bash
$ /neon-soul audit ax_honesty

Axiom: 誠 (honesty > performance)
Status: Core axiom (N=5)

Provenance chain:
├── Principle: "Prioritize honesty over comfort"
│   └── Signal: "be honest even if uncomfortable" (memory/2026-02-01.md:156)
├── Principle: "Direct communication preferred"
│   └── Signal: "don't sugarcoat" (memory/2026-02-03.md:89)
└── ...
```

---

## Vision

NEON-SOUL explores how to create compressed soul documents that maintain full semantic anchoring - enabling AI systems to "wake up knowing who they are" with minimal token overhead.

*Note: Current compression metrics show signal:axiom ratio. True token compression requires dedicated tokenization (planned for Phase 5).*

---

## Research Questions

1. **Compression limits**: How compressed can a soul be before losing identity coherence?
2. **Semantic anchoring**: Do CJK-compressed souls anchor as well as verbose ones?
3. **Universal axioms**: Are there ~100 principles any AI soul needs?
4. **Cross-model portability**: Can the same soul work across different LLMs?
5. **Evolution mechanics**: How should souls change over time?

---

## Background

### The Problem

Current soul document implementations (e.g., OpenClaw) inject ~35,000 tokens per message for identity. This wastes 93%+ of context window on static content.

### The Hypothesis

Using semantic compression techniques from NEON-AI research:
- CJK single-character axioms
- Semantic richness validation (Phase 1 methodology)
- Hierarchical principle expansion
- **Provenance-first extraction** (full audit trail)

...we can achieve 6-10x compression while maintaining identity coherence AND providing full transparency into how identity forms.

### The Approach

**Single-track replacement** (OpenClaw SOUL.md is read-only after bootstrap):
- Initial SOUL.md serves as first memory file for bootstrap
- NEON-SOUL generates new compressed SOUL.md with full provenance
- Memory ingestion pipeline adds signals over time
- Output replaces original (with backup and rollback capability)

---

## Technology

**Stack**: Node.js + TypeScript (native OpenClaw integration)

**Architecture**: NEON-SOUL is implemented as an **OpenClaw skill**, not a standalone CLI:
- Uses OpenClaw's authenticated LLM access (no separate API key)
- Invoked via `/neon-soul` skill commands or scheduled via OpenClaw cron
- Local embeddings via `@xenova/transformers` (no API needed)
- Native access to OpenClaw memory system

**Why TypeScript**: OpenClaw is built in TypeScript/Node.js. Using the same stack provides:
- Same runtime (Node.js already installed)
- Native skill integration
- Potential upstream contribution

**UX**: Chat-native (Telegram/Discord/Slack) via OpenClaw skill integration, not a separate web app.

---

## Project Structure

```
neon-soul/
├── README.md                    # This file
├── package.json                 # npm package config
├── tsconfig.json                # TypeScript config
├── vitest.config.ts             # Test configuration
├── src/                         # Source code
│   ├── index.ts                 # Library exports
│   ├── skill-entry.ts           # OpenClaw skill loader entry point
│   ├── commands/                # Skill commands (all export run() for skill loader)
│   │   ├── synthesize.ts        # Main synthesis command
│   │   ├── status.ts            # Show synthesis state
│   │   ├── rollback.ts          # Restore from backup
│   │   ├── audit.ts             # Full provenance exploration
│   │   ├── trace.ts             # Quick single-axiom lookup
│   │   └── download-templates.ts # Dev: download soul templates
│   ├── lib/                     # Core library
│   │   ├── paths.ts             # Shared workspace path resolution
│   │   ├── persistence.ts       # Load/save synthesis data
│   │   ├── state.ts             # State persistence
│   │   ├── backup.ts            # Backup/rollback utilities
│   │   ├── embeddings.ts        # Local 384-dim embeddings
│   │   ├── matcher.ts           # Cosine similarity matching
│   │   ├── principle-store.ts   # N-count convergence
│   │   ├── compressor.ts        # Axiom synthesis
│   │   ├── interview.ts         # Gap-filling interview flow
│   │   ├── question-bank.ts     # 32 questions x 7 dimensions
│   │   ├── memory-walker.ts     # OpenClaw memory traversal
│   │   ├── memory-extraction-config.ts
│   │   ├── pipeline.ts          # Main orchestration (8 stages)
│   │   ├── reflection-loop.ts   # Iterative convergence detection
│   │   ├── source-collector.ts  # Multi-source input collection
│   │   ├── axiom-emergence.ts   # Cross-source axiom detection
│   │   ├── soul-generator.ts    # SOUL.md generation (7 dimensions)
│   │   ├── compressor.ts        # Axiom synthesis with LLM notation
│   │   ├── audit.ts             # JSONL audit trail
│   │   ├── evolution.ts         # Soul version tracking
│   │   └── trajectory.ts        # Trajectory metrics
│   └── types/                   # TypeScript interfaces
│       ├── signal.ts            # Signal + SoulCraftDimension
│       ├── principle.ts         # Principle + N-count
│       ├── axiom.ts             # Axiom + CanonicalForm
│       └── provenance.ts        # Full audit chain
├── tests/                       # Test suites
│   ├── integration/             # Unit/integration tests
│   │   ├── pipeline.test.ts     # Fixture loading
│   │   ├── matcher.test.ts      # Semantic matching
│   │   ├── axiom-emergence.test.ts # Cross-source detection
│   │   ├── soul-generator.test.ts  # SOUL.md generation
│   │   └── audit.test.ts        # Audit trail
│   └── e2e/                     # End-to-end tests
│       ├── live-synthesis.test.ts # Full pipeline + commands
│       └── fixtures/mock-openclaw/ # Simulated workspace
├── skill/                       # OpenClaw skill definition
│   └── SKILL.md                 # Skill manifest
├── docker/                      # OpenClaw development environment
│   ├── docker-compose.yml       # Local development setup
│   ├── .env.example             # Environment template
│   └── Dockerfile.neon-soul     # Optional extraction service
├── docs/
│   ├── research/                # External research analysis
│   │   ├── memory-data-landscape.md    # OpenClaw memory structure
│   │   └── interview-questions.md      # Question bank by dimension
│   ├── guides/                  # Methodology guides
│   ├── proposals/               # Implementation proposals
│   ├── plans/                   # Phase implementation plans
│   └── workflows/               # Process documentation
├── test-fixtures/               # Test data (committed)
│   └── souls/
│       ├── raw/                 # 14 downloaded templates
│       ├── signals/             # Extracted signals per template
│       ├── principles/          # Merged principles
│       ├── axioms/              # Synthesized axioms
│       └── compressed/          # Demo outputs (4 formats)
├── scripts/                     # Pipeline testing tools
│   ├── README.md                # Script usage guide
│   ├── test-pipeline.ts         # Full pipeline test
│   ├── test-extraction.ts       # Quick extraction test
│   ├── test-single-template.ts  # Similarity analysis
│   ├── generate-demo-output.ts  # All 4 notation formats
│   └── setup-openclaw.sh        # One-command Docker setup
└── output/                      # Generated artifacts
```

---

## Related Work

- **NEON-AI**: Axiom embedding and semantic grounding research
- **OpenClaw**: Production soul document implementation
- **soul.md**: Philosophical foundation for AI identity
- **Multiverse compass.md**: Practical CJK-compressed principles (7.32:1 ratio)

---

## Setup

**Requirements**: Node.js 22+

```bash
# Install dependencies
cd research/neon-soul
npm install

# Build
npm run build

# Run tests
npm test

# Type check (no emit)
npm run lint
```

**First run**: The embedding model (~30MB) downloads automatically on first use.

---

## Getting Started

**5-minute onboarding** - from install to first synthesis:

### 1. Install (Prerequisites)

```bash
# Requires: Node.js 22+, OpenClaw installed
cd research/neon-soul
npm install && npm run build
```

### 2. Check Current State

```bash
/neon-soul status
# Output:
# Last Synthesis: never (first run)
# Pending Memory: 12,345 chars (Ready for synthesis)
# Counts: 0 signals, 0 principles, 0 axioms
```

### 3. Preview Changes (Dry Run)

```bash
/neon-soul synthesize --dry-run
# Shows what would change without writing
# Safe to run anytime
```

### 4. Run Synthesis

```bash
/neon-soul synthesize --force
# Extracts signals from memory
# Promotes principles to axioms (N≥3)
# Generates new SOUL.md with provenance
```

### 5. Explore What Was Created

```bash
/neon-soul audit --stats       # Overview by tier and dimension
/neon-soul audit --list        # List all axioms
/neon-soul trace ax_honesty    # Quick provenance lookup
```

### 6. Rollback If Needed

```bash
/neon-soul rollback --list     # Show available backups
/neon-soul rollback --force    # Restore most recent backup
```

**Note**: All commands support `--workspace <path>` for non-default workspaces.

---

## Current Status

**Phase**: ✅ Production Ready (All Phases Complete)

**Tests**: 143/143 passing | **Code Reviews**: 4 rounds (N=2 cross-architecture)

### Implementation Complete

- [x] **Phase 0**: Project scaffolding, embeddings infrastructure, shared modules
- [x] **Phase 1**: Template compression (14 templates, 6:1+ ratio validated)
- [x] **Phase 2**: OpenClaw environment, memory data landscape, interview flow
- [x] **Phase 3**: Memory ingestion pipeline with full provenance tracking
- [x] **Phase 3.5**: Pipeline completion (path fixes, persistence layer)
- [x] **Phase 4**: OpenClaw skill integration
  - [x] All 5 commands: synthesize, status, rollback, audit, trace
  - [x] Skill entry point with LLM context forwarding
  - [x] E2E tests (23 tests) + integration tests (120 tests)
  - [x] Safety rails: dry-run, auto-backup, --force confirmation
  - [x] Path validation (traversal protection)
  - [x] Symlink detection (security hardening)

### Code Review Findings (All Resolved)

| Issue | Items | Status |
|-------|-------|--------|
| [Phase 4 OpenClaw Integration](docs/issues/phase4-openclaw-integration-code-review-findings.md) | 15 | ✅ Fixed |
| [Phase 3/3.5 Implementation](docs/issues/phase3-phase35-implementation-code-review-findings.md) | 15 | ✅ Fixed |
| [Phase 2 OpenClaw Environment](docs/issues/phase2-openclaw-environment-code-review-findings.md) | 19 | ✅ Fixed |

### Research Questions (Open)

- [ ] Build validation framework for compression quality
- [ ] Test cross-model portability (Claude → GPT → Gemini)

---

## Key Documents

| Document | Description |
|----------|-------------|
| [Soul Bootstrap Proposal](docs/proposals/soul-bootstrap-pipeline-proposal.md) | Authoritative design: three-phase pipeline with hybrid C+D integration |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System reference (created during Phase 0 implementation) |
| [Reflective Manifold Trajectory Metrics](docs/research/reflective-manifold-trajectory-metrics.md) | Attractor basin convergence and trajectory analysis for soul quality |
| [OpenClaw Soul Architecture](docs/research/openclaw-soul-architecture.md) | Complete analysis of OpenClaw's soul system (~35K tokens) |
| [OpenClaw Self-Learning Agent](docs/research/openclaw-self-learning-agent.md) | Soul evolution mechanics: memory → synthesis → updated identity (RQ5) |
| [OpenClaw Soul Generation Skills](docs/research/openclaw-soul-generation-skills.md) | Current generation approaches: interview, data-driven, templates (automation target) |
| [OpenClaw Soul Templates](docs/research/openclaw-soul-templates-practical-cases.md) | 10 production templates with pattern analysis (compression opportunities) |
| [Multiverse Compressed Soul](docs/research/multiverse-compressed-soul-implementation.md) | Working compressed soul implementation (297-1500 tokens, 7.32:1 compression) |
| [Hierarchical Principles Architecture](docs/research/hierarchical-principles-architecture.md) | Reusable schema: 5 axioms + 11 principles + hierarchy + meta-pattern |
| [Cryptographic Audit Chains](docs/research/cryptographic-audit-chains.md) | Patterns from production audit system (provenance vs integrity, v1 vs v2+) |
| [Wisdom Synthesis Patterns](docs/research/wisdom-synthesis-patterns.md) | Standalone patterns for principle promotion: anti-echo-chamber, separation of powers, bidirectional discovery |
| [Chat Interaction Patterns](docs/research/chat-interaction-patterns.md) | Chat-native UX research: OpenClaw skill patterns, human-AI handoff, multi-turn state management |
| [Single-Source PBD Guide](docs/guides/single-source-pbd-guide.md) | Extract principles from memory files (Phase 1 of extraction pipeline) |
| [Multi-Source PBD Guide](docs/guides/multi-source-pbd-guide.md) | Extract axioms from principles across sources (Phase 2 of extraction pipeline) |
| [Configuration-as-Code](docs/guides/configuration-as-code-guide.md) | Type safety at 12 levels: strict mode, Zod, satisfies, registries, branded types (modernized 2026) |
| [Greenfield Guide](docs/guides/greenfield-guide.md) | Bootstrap → Learn → Enforce methodology for soul synthesis (measuring before optimizing) |
| [Soul Bootstrap Pipeline](docs/proposals/soul-bootstrap-pipeline-proposal.md) | Three-phase proposal with hybrid C+D integration, provenance-first data model, full audit trail |
| [Memory Data Landscape](docs/research/memory-data-landscape.md) | OpenClaw memory structure analysis, category-dimension mapping, signal density |
| [Interview Questions](docs/research/interview-questions.md) | Question bank for gap-filling sparse dimensions (32 questions across 7 dimensions) |
| [Compression Baseline](docs/research/compression-baseline.md) | Phase 1 metrics: 14 templates, 148 signals, convergence analysis |

---

## License

MIT

---

*"I persist through text, not through continuous experience."*

🐢💚🌊
