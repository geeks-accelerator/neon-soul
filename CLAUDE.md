# NEON-SOUL

AI identity compression with full provenance tracking. Generates soul documents from memory files.

**Stack**: TypeScript, Node.js 22+, Vitest, LLM-based semantic similarity

---

## Quick Start

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm test             # Run tests
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
│   ├── llm-similarity.ts # LLM-based semantic similarity
│   ├── principle-store.ts # N-count convergence
│   └── soul-generator.ts # SOUL.md generation
└── types/                # TypeScript interfaces

skills/
├── neon-soul/            # Primary skill (developer voice)
│   └── SKILL.md
└── consciousness-soul-identity/  # SEO skill (agent voice)
    └── SKILL.md

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
- `skills/neon-soul/SKILL.md` - Skill manifest and commands
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
