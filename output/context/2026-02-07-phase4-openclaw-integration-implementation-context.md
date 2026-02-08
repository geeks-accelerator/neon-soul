# Context: Phase 4 OpenClaw Integration Implementation

**Generated**: 2026-02-07 23:00:00
**Scout**: opus
**Mode**: flexible
**Topic**: Phase 4 OpenClaw Integration implementation review

## Files (24 relevant)

### Commands (5 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/commands/status.ts | b2b4669f16d42dae | 324 | Show synthesis state: last run, pending memory, counts, dimension coverage |
| src/commands/rollback.ts | 9f1a5842fa34feb9 | 300 | Restore SOUL.md from backup: --list, --backup, --force options |
| src/commands/trace.ts | 9e9a9f4788bdf072 | 290 | Quick single-axiom provenance lookup with minimal output |
| src/commands/audit.ts | b0a93d58c50ba2ba | 424 | Full provenance exploration: --list, --stats, detailed axiom view |
| src/commands/synthesize.ts | 69aab4c445f65e68 | 222 | Main synthesis command, requires LLM provider from skill context |

### Core Library (7 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/lib/paths.ts | a89559d52012dda0 | 90 | Shared path utilities: getDefaultWorkspacePath, resolvePath, ~ expansion |
| src/lib/persistence.ts | 4ab31a8f35cd2ab2 | 230 | Persist signals/principles/axioms to .neon-soul/*.json files |
| src/lib/pipeline.ts | 30f7847a3de28acd | 724 | 7-stage pipeline orchestrator with LLM validation |
| src/lib/source-collector.ts | dd7d2f7745ad77d6 | 357 | Collect memory, SOUL.md, USER.md, interview signals |
| src/lib/backup.ts | 2b4f719803760b0a | 196 | Backup rotation (max 10), rollback, git commit integration |
| src/lib/state.ts | e7f0977522a44c3d | 116 | State persistence for last run tracking |
| src/skill-entry.ts | a61384392c1b9166 | 171 | OpenClaw skill loader entry point with lazy command loading |

### Types (4 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| src/types/llm.ts | f97463620bc04505 | 133 | LLMProvider interface, LLMRequiredError, ClassifyOptions |
| src/types/axiom.ts | 038abf99cf59371b | 49 | Axiom type with tier, dimension, canonical notation |
| src/types/principle.ts | 85dccff79ac0db46 | 33 | Principle type with N-count, derived_from signals |
| src/types/signal.ts | eef758175d1f21c0 | 58 | Signal type with source location, dimension |

### Tests (2 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| tests/e2e/live-synthesis.test.ts | 74575b123197ade4 | 480 | E2E tests: pipeline, commands, safety rails, edge cases, LLM integration |
| tests/mocks/llm-mock.ts | b6ff3a83f1000aaa | 362 | Mock LLM provider for deterministic testing |

### Documentation (3 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| skill/SKILL.md | 0723a410117f0db0 | 226 | OpenClaw skill manifest: 5 commands, safety philosophy, dimensions |
| README.md | c8c0103f74927184 | 349 | Getting started, usage examples, installation |
| package.json | 49b426d5852482e9 | 57 | npm package with exports field for "./skill" entry |

### Infrastructure (3 files)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| docker/docker-compose.yml | f0bb412524b5aa05 | 86 | Docker compose for neon-soul service |
| docker/Dockerfile.neon-soul | 371d8438a815a96d | 45 | Node.js 22 container for neon-soul |
| scripts/setup-openclaw.sh | d14c5b467e0b82f6 | 273 | Setup script for OpenClaw workspace structure |

## Historical Notes (from Historian)

*No observations recorded for this topic yet - implementation just completed.*

## Relationships

### Command Dependency Graph

```
synthesize.ts ──uses──> pipeline.ts ──uses──> source-collector.ts
                                          └─> persistence.ts
                                          └─> backup.ts

status.ts ──uses──> paths.ts
               └──> state.ts
               └──> persistence.ts

rollback.ts ──uses──> paths.ts
                 └──> backup.ts

trace.ts ──uses──> paths.ts
             └──> persistence.ts (loadAxioms, loadPrinciples)

audit.ts ──uses──> paths.ts
             └──> persistence.ts (loadAxioms, loadPrinciples, loadSignals)
```

### Skill Entry Point

```
skill-entry.ts
├── synthesize ──lazy──> commands/synthesize.js
├── status ────lazy──> commands/status.js
├── rollback ──lazy──> commands/rollback.js
├── audit ─────lazy──> commands/audit.js
└── trace ─────lazy──> commands/trace.js
```

### Data Flow

```
Memory Files ─> Signal Extraction (LLM) ─> Principle Matching ─> Axiom Promotion
      │                  │                        │                   │
      │                  └───persisted───────────>│                   │
      │                                           └───persisted──────>│
      └──────────────────────────────────────────────────────────────>│
                                                                      v
                                                                SOUL.md + .neon-soul/*.json
```

## Key Implementation Patterns

### LLM Provider Pattern (Option C - No Fallback)

All commands that need LLM throw `LLMRequiredError` if not provided:
- `synthesize.ts` requires `context.llm` from skill context
- `pipeline.ts` validates `options.llm` at start
- Pattern enforces explicit LLM injection, no silent degradation

### Path Resolution Pattern (IM-2)

`src/lib/paths.ts` provides consistent path handling:
- `getDefaultWorkspacePath()` - expands ~ to home directory
- `resolvePath()` - handles ~, relative, and absolute paths
- Used by all 5 commands for consistent workspace resolution

### Atomic Write Pattern (IM-4)

`persistence.ts` exports `writeFileAtomic()`:
- Writes to temp file, then atomic rename
- Prevents corruption on crash mid-write
- Used for signals.json, principles.json, axioms.json, SOUL.md

### Safety Rail Pattern

1. **Dry-run default**: `--dry-run` shows changes without writing
2. **Auto-backup**: Backups created before every write (max 10 rotated)
3. **Force confirmation**: Rollback requires `--force` flag
4. **Provenance chain**: Every axiom traces to source signals

## Command Interface (run() function)

All 5 commands export a programmatic `run()` function:

```typescript
export async function run(args: string[], context?: SkillContext): Promise<{
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}>
```

- `synthesize`: Requires `context.llm`, throws LLMRequiredError without
- `status`, `rollback`, `audit`, `trace`: Context optional

## Test Coverage

E2E tests (20 tests) cover:
- Pipeline integration with mock workspace
- Dry-run mode (no files written)
- Command interfaces (all 5 commands)
- Safety rails (backup, rollback confirmation, dry-run)
- Edge cases (empty memory, missing workspace, missing axiom)
- LLM integration (mock LLM, LLMRequiredError)

## Suggested Focus for Review

- **Priority 1**: `src/lib/pipeline.ts` - Core orchestration, LLM validation, stage execution
- **Priority 2**: `src/skill-entry.ts` - OpenClaw integration point, command dispatch
- **Priority 3**: `src/lib/persistence.ts` - Data persistence, atomic writes
- **Priority 4**: Command implementations (status, rollback, trace, audit)
- **Priority 5**: E2E tests - safety rails, edge cases

## Exploration Notes

**Phase 4 Completion Status**:
- Stage 4.0 (Twin Review Fixes): Complete - paths.ts extracted, audit.ts updated
- Stage 4.1 (Commands): Complete - status, rollback, trace implemented
- Stage 4.2 (Verify Phase 3.5): Complete - 57+ tests pass, no placeholders
- Stage 4.3 (Skill Entry): Complete - skill-entry.ts with lazy loading
- Stage 4.4 (E2E Tests): Complete - 20 tests covering all scenarios
- Stage 4.5 (Documentation): Complete - README, SKILL.md updated

**Quality Gate (QG-Integration)**:
- Phase 3.5 complete: Yes
- Command coverage: 5/5 (synthesize, status, rollback, audit, trace)
- E2E test pass: All green
- Safety rails: Implemented (--live, auto-backup, dry-run default)
- SKILL.md accuracy: 100%
- Build/lint/test: Pass

**Architecture Notes**:
- Single-track SOUL.md replacement (not merge)
- OpenClaw workspace at ~/.openclaw/workspace/
- Memory at workspace/memory/
- Persistence at workspace/.neon-soul/
- 7 SoulCraft dimensions for axiom classification

---

*Context generated for Phase 4 implementation review.*
