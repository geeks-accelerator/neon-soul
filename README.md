# Neon Soul

Self-hosted soul compiler for OpenClaw agents. Transforms memory files into agent governance (Axioms + Principles).

## Overview

**Input**: OpenClaw memory files (artifacts)
**Output**: `soul.md` - compiled agent compass

## Quick Start

```bash
# Install dependencies
go mod tidy

# Generate templ files
templ generate

# Run the web app
go run ./cmd/web-app

# Open browser
open http://localhost:8080
```

## Architecture

Based on the simplified Heart/Brain intake architecture:

```
Memory Files → Classify → Distill → Integrate → Compile Soul
                                        ↓
                              Axioms + Principles
```

### Two Layers of Governance

- **Axioms**: Non-negotiable constraints (identity + hard boundaries)
- **Principles**: Operating rules and trade-off guidance

### Lifecycle

1. **Candidate** - Extracted from artifact
2. **Draft Principle** - Deduplicated, tracked with evidence
3. **Axiom Candidate** - Strong rule that may become constraint
4. **Pending** - Compiled for review
5. **Approved** - Accepted for use
6. **Active** - Current governors

## Project Structure

```
neon-soul/
├── cmd/web-app/          # Web application entry point
├── internal/
│   ├── soul/             # Core types (Artifact, Principle, Axiom)
│   ├── store/            # BuntDB persistence
│   └── web/              # HTTP server, handlers, templ components
└── docs/                 # Documentation
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP server port |
| `DATA_DIR` | `./data` | Data directory for BuntDB |
| `MEMORY_DIR` | `./memory` | OpenClaw memory files directory |

## Development

```bash
# Run tests
go test ./...

# Build binary
go build -o bin/neon-soul ./cmd/web-app

# Watch templ files (requires templ CLI)
templ generate --watch
```

---

*Single tenant. Self-hosted. Simple.*
