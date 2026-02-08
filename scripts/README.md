# Scripts

Pipeline testing and demo generation scripts for NEON-SOUL.

## Usage

All scripts run from the project root:

```bash
cd research/neon-soul
npx tsx scripts/<script-name>.ts
```

## TypeScript Scripts

| Script | Purpose | Output |
|--------|---------|--------|
| `test-extraction.ts` | Quick test: extract signals from 3 templates | Console output |
| `test-pipeline.ts` | Full pipeline: all 14 templates → signals → principles → axioms | `test-fixtures/souls/*` |
| `test-single-template.ts` | Analyze one template with similarity matrix | Console output |
| `generate-demo-output.ts` | Generate compressed outputs in all 4 formats | `test-fixtures/souls/compressed/*` |

## Shell Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-openclaw.sh` | One-command OpenClaw setup with NEON-SOUL integration | `./scripts/setup-openclaw.sh` |

### setup-openclaw.sh

Sets up OpenClaw local development environment:
- Creates workspace directory structure (`~/.openclaw/workspace/`)
- Initializes memory subdirectories
- Copies environment template
- Starts OpenClaw via Docker Compose

```bash
# Full setup
./scripts/setup-openclaw.sh

# Setup without starting Docker
./scripts/setup-openclaw.sh --skip-docker

# Reset workspace (WARNING: destroys data)
./scripts/setup-openclaw.sh --reset
```

## Workflow

```bash
# 1. Download templates (if not already present)
npx tsx src/commands/download-templates.ts

# 2. Run full pipeline (generates signals, principles, axioms)
npx tsx scripts/test-pipeline.ts

# 3. Generate demo outputs (all 4 notation formats)
npx tsx scripts/generate-demo-output.ts
```

## Regression Testing

After making changes to the pipeline, run:

```bash
npx tsx scripts/generate-demo-output.ts
git diff test-fixtures/souls/compressed/
```

If output differs, verify changes are intentional before committing.
