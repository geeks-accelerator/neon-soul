# Context: Phase 4 OpenClaw Integration Plan

**Generated**: 2026-02-07 18:30:00
**Scout**: haiku
**Mode**: flexible
**Topic**: docs/plans/2026-02-07-phase4-openclaw-integration.md

## Files (14 relevant)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| docs/plans/2026-02-07-phase4-openclaw-integration.md | 4d447e666ee36ea2 | 339 | Phase 4 plan: skill integration, missing commands, e2e tests |
| skill/SKILL.md | 73607573829d1e4d | 97 | OpenClaw skill manifest with command definitions |
| docs/plans/2026-02-07-soul-bootstrap-master.md | 265b0335f284fc20 | 241 | Master plan coordinating all phases |
| docs/plans/2026-02-07-phase3-memory-ingestion.md | 0e663d62575ec73b | 552 | Phase 3 plan: memory ingestion pipeline (dependency) |
| docs/proposals/soul-bootstrap-pipeline-proposal.md | 38c0202d22180684 | 1447 | Original proposal with full architecture |
| src/index.ts | e8fcaf1f96b2368b | 82 | Main module exports for neon-soul library |
| src/commands/audit.ts | 385a8a4f6b22365f | 296 | Audit command implementation (exists) |
| src/commands/synthesize.ts | 5e2451e61a9361c3 | 188 | Synthesize command implementation (exists) |
| src/lib/pipeline.ts | 67c45af24e1efc27 | 549 | Pipeline orchestrator with 8 stages |
| src/lib/source-collector.ts | dd7d2f7745ad77d6 | 357 | Source collection for memory integration |
| src/lib/backup.ts | 71891387bdd82635 | 147 | Backup/rollback utilities |
| src/lib/state.ts | 89cac5bfe6e2a554 | 105 | State persistence |
| src/lib/soul-generator.ts | 009d2ac970be975b | 364 | SOUL.md generation |
| src/lib/provenance.ts | 31a06adfa6a15291 | 104 | Provenance chain traversal |

## Historical Notes (from Historian)

*No historical observations available for this topic.*

## Relationships

**Plan Hierarchy**:
- Master Plan (`soul-bootstrap-master.md`) coordinates 4 phases
- Phase 4 (`phase4-openclaw-integration.md`) depends on Phase 3 completion
- Phase 3 (`phase3-memory-ingestion.md`) provides core pipeline infrastructure

**Implementation Dependencies**:
- Phase 4 Stage 4.1 (missing commands) depends on:
  - `src/lib/state.ts` for status command
  - `src/lib/backup.ts` for rollback command
  - `src/lib/provenance.ts` for trace command

- Phase 4 Stage 4.2 (pipeline wiring) needs to connect:
  - `src/lib/pipeline.ts` (orchestrator with placeholders)
  - `src/lib/source-collector.ts` (already implemented)
  - `src/lib/soul-generator.ts` (already implemented)

- Phase 4 Stage 4.3 (skill entry point) creates:
  - `skill/index.ts` (NEW - skill loader)
  - Updates to `skill/SKILL.md` manifest

**Command Status**:
| Command | SKILL.md | Implemented |
|---------|----------|-------------|
| synthesize | Yes | Yes (`src/commands/synthesize.ts`) |
| status | Yes | **NO** (Phase 4.1) |
| rollback | Yes | **NO** (Phase 4.1) |
| audit | No | Yes (`src/commands/audit.ts`) |
| trace | Yes (as alias) | **NO** (Phase 4.1) |

## Suggested Focus

- **Priority 1**: `src/commands/status.ts`, `src/commands/rollback.ts`, `src/commands/trace.ts` - Create missing commands (Stage 4.1)
- **Priority 2**: `src/lib/pipeline.ts` - Wire placeholders to actual implementations (Stage 4.2)
- **Priority 3**: `skill/index.ts` - Create skill loader entry point (Stage 4.3)

## Exploration Notes

**Current Implementation State**:
- 25 TypeScript files in `src/lib/` covering core functionality
- 3 commands implemented: `audit.ts`, `synthesize.ts`, `download-templates.ts`
- 57 passing integration tests mentioned in plan
- Pipeline has 8 stages but some are placeholders

**Gap Analysis**:
- 3 commands documented in SKILL.md but not implemented (status, rollback, trace)
- Pipeline stages `collectSources` and `extractSignals` are placeholders
- No `skill/index.ts` entry point for OpenClaw skill loader
- E2E tests with real OpenClaw memory not yet created

**Architecture Notes**:
- Single-track replacement: SOUL.md is replaced, not merged
- OpenClaw never updates SOUL.md after bootstrap (read-only)
- All matching uses semantic similarity (embeddings), not regex
- Content threshold: 2000 chars before running synthesis

**Estimation from Plan**:
- Stage 4.1 (commands): 1.5 hours
- Stage 4.2 (pipeline wiring): 2 hours
- Stage 4.3 (skill entry): 1 hour
- Stage 4.4 (e2e tests): 2 hours
- Stage 4.5 (docs): 1 hour
- Total: ~7.5 hours

---

*Context generated for Phase 4 OpenClaw integration review.*
