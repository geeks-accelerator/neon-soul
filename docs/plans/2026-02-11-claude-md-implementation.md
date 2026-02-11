# Plan: Add CLAUDE.md for AI Assistant Context

**Created**: 2026-02-11
**Status**: Complete
**Priority**: Medium
**Risk Level**: Low

## Summary

Add `CLAUDE.md` to provide Claude Code with project context when working on the codebase. This complements the existing documentation without duplication.

---

## Documentation Structure

After implementation, the project will have three primary documentation files:

| File | Audience | Purpose | Status |
|------|----------|---------|--------|
| **README.md** | Humans | Project overview, installation, features | ✅ Exists (430 lines) |
| **CLAUDE.md** | Claude Code | Structure, workflows, conventions | 📝 To create (~100 lines) |
| **CONTRIBUTING.md** | Contributors | How to contribute | ✅ Exists |
| **SECURITY.md** | Security researchers | Vulnerability reporting | ✅ Exists |

**Key principle**: No duplication between files. Each serves its audience.

---

## Background

### Why CLAUDE.md?

Claude Code automatically loads `CLAUDE.md` at session start, providing persistent context for AI-assisted development. Without it, Claude must rediscover project structure each session.

### Best Practices (from HumanLayer, Anthropic, Dometrain)

1. **Keep it minimal**: 60-200 lines optimal
2. **Three sections**: WHAT (tech/structure), WHY (purpose), HOW (workflows)
3. **Use file references**: `path/file:line` instead of code snippets
4. **Don't duplicate README**: Different audiences

### Why NOT AGENTS.md?

AGENTS.md is a tool-agnostic standard for Cursor, Codex, etc. Since neon-soul is a Claude Code skill and primary users have Claude Code, AGENTS.md adds complexity without benefit. Can be added later if needed.

---

## Implementation

### Stage 1: Create CLAUDE.md

**Objective**: Add Claude Code-specific context file (~100 lines).

**Content Structure**:

```
# NEON-SOUL
Brief description + tech stack

## Quick Start
npm install/build/test/lint commands

## Project Structure
Key directories and entry points

## Key Concepts
Signal → Principle → Axiom → Provenance

## Development Workflows
- Adding commands
- Testing changes
- Running synthesis

## Important Files
File:line references to key code

## Conventions
- Command export pattern
- Test fixtures location
- Provenance requirements

## Safety Rails
- Path traversal protection
- Auto-backup
- LLM context requirement
```

**Tasks**:
1. Create `CLAUDE.md` in project root
2. Verify under 150 lines
3. Verify no code snippets (file references only)
4. Verify no duplicate README content

---

### Stage 2: Update README.md

**Objective**: Add reference to CLAUDE.md in Key Documents table.

**Change**:
Add one line to the Key Documents table:
```markdown
| [CLAUDE.md](CLAUDE.md) | AI assistant context for Claude Code development |
```

---

### Stage 3: Update Documentation Workflow

**Objective**: Add CLAUDE.md to the documentation-update workflow so future changes include it.

**Changes to `docs/workflows/documentation-update.md`**:

1. **Document purposes** (after README entry):
```markdown
- **CLAUDE.md**: AI assistant context ("project structure, conventions, workflows for Claude Code")
```

2. **Checklist Files** table (add row):
```markdown
| `CLAUDE.md` | Project structure, key concepts, conventions, workflows |
```

3. **Step 5** (add note):
```markdown
> **Note**: Keep CLAUDE.md and README.md in sync but not duplicated. README is for humans (project overview), CLAUDE.md is for AI assistants (development context).
```

---

## File Changes

| File | Action | Lines |
|------|--------|-------|
| `CLAUDE.md` | Create | ~100 |
| `README.md` | Update | +1 |
| `docs/workflows/documentation-update.md` | Update | +5 |

**Total new content**: ~105 lines

---

## Draft CLAUDE.md

```markdown
# NEON-SOUL

AI identity compression with full provenance tracking. Generates soul documents from memory files.

**Stack**: TypeScript, Node.js 22+, Vitest, @xenova/transformers (local embeddings)

---

## Quick Start

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm test             # Run tests (286 passing)
npm run lint         # Type check
```

---

## Project Structure

```
src/
├── index.ts              # Library exports
├── skill-entry.ts        # OpenClaw skill loader
├── commands/             # Skill commands (synthesize, status, audit, trace, rollback)
├── lib/                  # Core library
│   ├── pipeline.ts       # Main orchestration (8 stages)
│   ├── embeddings.ts     # Local 384-dim embeddings
│   ├── principle-store.ts # N-count convergence
│   └── soul-generator.ts # SOUL.md generation
└── types/                # TypeScript interfaces

skill/
└── SKILL.md              # OpenClaw skill manifest

tests/
├── integration/          # Unit/integration tests
└── e2e/                  # End-to-end tests with fixtures
```

---

## Key Concepts

- **Signal**: Raw insight extracted from memory (with source location)
- **Principle**: Validated pattern (N≥2 occurrences)
- **Axiom**: Core identity element (N≥3, promoted from principles)
- **Provenance**: Full audit trail from axiom → principle → signal → source line

---

## Development Workflows

### Adding a new command
1. Create `src/commands/your-command.ts` with `run()` export
2. Add to `src/skill-entry.ts` command registry
3. Add tests in `tests/integration/`

### Testing changes
```bash
npm test                           # Full suite
npm test -- --grep "pipeline"      # Filter by name
npm run test:watch                 # Watch mode
```

### Running synthesis locally
```bash
# Requires OpenClaw workspace with memory files
/neon-soul synthesize --dry-run    # Preview
/neon-soul synthesize --force      # Execute
```

---

## Important Files

- `src/lib/pipeline.ts:1-50` - Pipeline stages overview
- `src/types/signal.ts` - Core data types
- `skill/SKILL.md` - Skill manifest and commands
- `docs/ARCHITECTURE.md` - System design reference

---

## Conventions

- All commands export `run(args, context)` function
- Tests use `tests/e2e/fixtures/mock-openclaw/` for workspace simulation
- Provenance is mandatory - every axiom traces to source
- Default to `--dry-run`, require `--force` for mutations

---

## Safety Rails

- Path traversal protection in all file operations
- Symlink detection and rejection
- Auto-backup before SOUL.md overwrites
- LLM context required (throws `LLMRequiredError` if missing)
```

---

## Verification

```bash
# Check file length (should be < 150)
wc -l CLAUDE.md

# Verify Claude Code loads it (manual test)
# Start new Claude Code session in project directory
# Claude should reference CLAUDE.md content
```

---

## Cross-References

- Research: Best practices from HumanLayer, Anthropic, Dometrain
- Related: `docs/plans/2026-02-10-make-repository-public.md` (public release)

---

## Acceptance Criteria

- [x] CLAUDE.md created in project root
- [x] Under 150 lines (99 lines)
- [x] No duplicate README content (intentional overlap accepted per twin review)
- [x] README.md updated with reference
- [x] docs/workflows/documentation-update.md updated with CLAUDE.md
- [ ] Verified Claude Code loads it (manual verification)

---

## Approval

- [ ] Plan approved

**Approved by**: _______________
**Date**: _______________
