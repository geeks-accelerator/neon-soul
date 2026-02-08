# Context: NEON-SOUL Soul Bootstrap Master Plan

**Generated**: 2026-02-07 (Scout exploration)
**Scout**: haiku
**Mode**: flexible
**Topic**: Soul Bootstrap Pipeline implementation planning and phase coordination

---

## Files (19 relevant)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| docs/plans/2026-02-07-soul-bootstrap-master.md | 5f177390dd42f906 | 199 | Master plan coordinating 4 phases; defines architecture, quality gates, dependencies |
| docs/plans/2026-02-07-phase0-project-setup.md | 60bd26d7af1102a6 | 359 | Phase 0: TypeScript scaffolding, embeddings infrastructure, shared modules |
| docs/plans/2026-02-07-phase1-template-compression.md | cd8af4cfa12cd682 | 280 | Phase 1: Download public SOUL.md templates, validate compression pipeline |
| docs/plans/2026-02-07-phase2-openclaw-environment.md | 7b52aa03e9774546 | 254 | Phase 2: OpenClaw Docker setup, memory data landscape, interview flow design |
| docs/plans/2026-02-07-phase3-memory-ingestion.md | 5c1ef7bcf8d8e377 | 368 | Phase 3: Core pipeline - dual-track synthesis, axiom emergence, SOUL.md generation |
| docs/proposals/soul-bootstrap-pipeline-proposal.md | fd93673467b0f97b | 1447 | Original proposal: 3-phase approach, hybrid C+D integration, provenance-first design |
| README.md | 97cf1727c9857278 | 178 | Project overview: vision, research questions, provenance importance, status |
| docs/research/openclaw-soul-architecture.md | 5f974756536834d7 | 581 | Complete analysis of OpenClaw's soul system (~35K tokens), SoulCraft 7 dimensions |
| docs/guides/single-source-pbd-guide.md | c7223df8fa634dad | 236 | Phase 1 methodology: Extract principles from single memory file |
| docs/guides/multi-source-pbd-guide.md | 703b189afffeeec9 | 292 | Phase 2 methodology: Extract axioms from converging principles |
| docs/research/hierarchical-principles-architecture.md | 877f936216a07749 | 751 | Reusable schema: 5 axioms + 11 principles + hierarchy pattern |
| docs/research/multiverse-compressed-soul-implementation.md | 26d53303ff5e8436 | 422 | Working compressed implementation (297-1500 tokens, 7.32:1 ratio) |
| docs/research/openclaw-self-learning-agent.md | 5cfe1c3397cddac2 | 264 | Soul evolution mechanics: memory -> synthesis -> updated identity |
| docs/research/openclaw-soul-generation-skills.md | 9beefe685c70200a | 408 | Current generation approaches: interview, data-driven, templates |
| docs/research/openclaw-soul-templates-practical-cases.md | dad29f977231b461 | 352 | 10 production templates with pattern analysis |
| docs/research/cryptographic-audit-chains.md | 815641bbf8601ae4 | 332 | Patterns for provenance vs integrity (v1 vs v2+) |
| docs/research/wisdom-synthesis-patterns.md | b0e5dcceb2245a11 | 292 | Anti-echo-chamber, separation of powers, bidirectional discovery |
| docs/research/chat-interaction-patterns.md | f0f8947e7129d6e0 | 640 | Chat-native UX: OpenClaw skill patterns, human-AI handoff |
| docs/guides/configuration-as-code-guide.md | e443a66013523662 | 847 | Type safety at 12 levels: strict mode, Zod, branded types |

---

## Relationships

### Plan Hierarchy
```
Master Plan (soul-bootstrap-master.md)
    |
    +-- Phase 0: Project Setup (foundation - blocks Phase 1, 2)
    |       |
    |       +-- Shared modules: embeddings.ts, matcher.ts, llm.ts, provenance.ts
    |
    +-- Phase 1: Template Compression (validates algorithm)
    |       |
    |       +-- Uses: Single-Source PBD Guide
    |       +-- Produces: Compression metrics baseline
    |
    +-- Phase 2: OpenClaw Environment (parallel with Phase 1)
    |       |
    |       +-- Uses: OpenClaw Soul Architecture research
    |       +-- Produces: Data landscape, interview flow
    |
    +-- Phase 3: Memory Ingestion (requires Phase 1 + 2)
            |
            +-- Uses: Multi-Source PBD Guide
            +-- Produces: Full synthesis pipeline
```

### Proposal -> Plans Flow
- **Proposal** defines the conceptual design (hybrid C+D integration, provenance-first)
- **Master Plan** coordinates execution with quality gates
- **Phase Plans** provide implementation details with acceptance criteria

### Research -> Implementation
- `openclaw-soul-architecture.md` -> SoulCraft 7 dimensions used in Phase 2, 3
- `hierarchical-principles-architecture.md` -> Data model for axioms/principles
- `multiverse-compressed-soul-implementation.md` -> Compression ratio targets (7.32:1)
- `cryptographic-audit-chains.md` -> v2+ integrity features (deferred)

### Methodology Guides
- `single-source-pbd-guide.md` -> Phase 1 template extraction
- `multi-source-pbd-guide.md` -> Phase 3 axiom synthesis
- `configuration-as-code-guide.md` -> Type-safe configuration system

---

## Suggested Focus

- **Priority 1**: `docs/plans/2026-02-07-soul-bootstrap-master.md` - Entry point, architecture overview
- **Priority 2**: `docs/proposals/soul-bootstrap-pipeline-proposal.md` - Full rationale and design decisions
- **Priority 3**: Phase plans (0, 1, 2, 3) - Implementation details for each stage
- **Priority 4**: Research docs - Background context for design decisions

---

## Exploration Notes

### Critical Architectural Decisions
1. **Semantic matching only** - No regex/keyword matching; embeddings + cosine similarity
2. **Embedding model**: @xenova/transformers (all-MiniLM-L6-v2, 384-dim)
3. **Notation formats**: 4 variants (native, cjk-labeled, cjk-math, cjk-math-emoji)
4. **Provenance-first**: Every axiom traces to source lines

### Key Metrics
- **Compression target**: >= 6:1 ratio
- **Similarity threshold**: 0.85 default (configurable)
- **Axiom promotion**: N >= 3 convergence required
- **Dimension coverage**: 7/7 SoulCraft dimensions

### Technology Stack
- Runtime: Node.js >= 22
- Language: TypeScript 5.x (strict mode)
- Embeddings: @xenova/transformers
- LLM: @anthropic-ai/sdk (Claude)
- Testing: Vitest

### Phase Dependencies
```
Phase 0 ----+----> Phase 1 ----+
            |                   |
            +----> Phase 2 ----+--> Phase 3 --> Production
```

Phase 1 and Phase 2 can run in parallel after Phase 0 completes.

---

*Context file generated for Soul Bootstrap Master Plan review.*
