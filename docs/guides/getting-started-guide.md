# Getting Started: OpenClaw + NEON-SOUL

**Purpose**: Step-by-step setup for running OpenClaw with NEON-SOUL soul synthesis
**Time**: 30-45 minutes (first run breakdown: Docker pulls ~5-10 min, npm install ~2-5 min, LLM model ~10-30 min depending on connection)
**Audience**: Developers new to OpenClaw or NEON-SOUL

---

## Overview

This guide walks you through:

1. Installing OpenClaw via Docker
2. Creating your first memory files
3. Running NEON-SOUL synthesis
4. Exploring your generated soul

**Architecture**:
```
┌───────────────────────────────────────────────────────────┐
│                     Your Machine                           │
├───────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │    OpenClaw     │  │   Ollama    │  │   NEON-SOUL   │  │
│  │    (Docker)     │  │  (Docker)   │  │ (npm package) │  │
│  │  ├── SOUL.md ◄──┼──┼─────────────┼──┼── Generates   │  │
│  │  └── memory/ ───┼──┼─────────────┼──┼── Reads       │  │
│  └─────────────────┘  │  LLM API ───┼──┼── Classifies  │  │
│                       └─────────────┘  └───────────────┘  │
└───────────────────────────────────────────────────────────┘
```

**Data flow**: Memory files → NEON-SOUL extracts signals → Ollama classifies dimensions → Axioms emerge → SOUL.md generated

**Note**: Ollama is required for CLI mode (Option B). For Option A, OpenClaw provides the LLM context.

---

## Why NEON-SOUL?

> 言霊 (Kotodama): Words carry spirit.

Your memory files carry *your* spirit. NEON-SOUL makes that transfer explicit and traceable.

Most AI assistants are black boxes - their personality shifts, but you never know why. NEON-SOUL provides **grounded identity**: every belief your AI develops traces back to specific lines in your memory files. When your AI says "I prefer direct communication," you can ask "where did that come from?" and get a real answer.

**The core insight**: Identity emerges from patterns. Write enough memories, and axioms crystallize - not because you declared them, but because they emerged from your accumulated reflections. (N=3=型: See thrice, pattern forms.)

**What is a "soul"?** In OpenClaw, `SOUL.md` is the identity document that tells your AI who it is. NEON-SOUL generates this file by extracting signals from your memory files - turning scattered preferences into coherent axioms. The soul isn't a static config file. It's emergent. It grows as you do.

---

## Prerequisites

Before starting, ensure you have:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Docker | 20.10+ | `docker --version` |
| Docker Compose | v2+ | `docker compose version` |
| Node.js | 22+ | `node --version` |
| Git | any | `git --version` |

**Install Docker**:
- **macOS**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: `sudo apt install docker.io docker-compose-v2`
- **Windows**: [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

---

## Choose Your Path

Before starting, decide which setup matches your goal:

| Path | When to Use | What You Get |
|------|-------------|--------------|
| **Option A** (Upstream) | You want full OpenClaw with chat integrations | Complete platform, skill commands in chat |
| **Option B** (Dev Stack) | You want to develop/test NEON-SOUL locally | Minimal setup, CLI-focused workflow |

**Recommended for this guide**: Option B (faster setup, covers all NEON-SOUL features)

---

## Step 1: Install OpenClaw

### Option A: Upstream OpenClaw (Full Features)

For the complete OpenClaw experience with chat integrations:

```bash
# Clone upstream OpenClaw
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# Run automated setup
./docker-setup.sh
```

The setup wizard configures your LLM provider and starts the gateway.

**Access**: http://127.0.0.1:18789/

See [OpenClaw Docker Documentation](https://docs.openclaw.ai/install/docker) for details.

### Option B: NEON-SOUL Development Stack (Recommended for this guide)

For local development with NEON-SOUL, use our pre-configured Docker setup:

```bash
# After cloning NEON-SOUL (Step 4), use our docker-compose
cd neon-soul
./scripts/setup-openclaw.sh
```

This creates the workspace structure and starts a minimal OpenClaw environment.

### Verify Installation

```bash
# Check container is running
docker compose ps

# Expected output (docker compose v2):
# NAME           STATUS          PORTS
# openclaw-dev   Up (healthy)    0.0.0.0:3000->3000/tcp, 0.0.0.0:8080->8080/tcp

# View logs
docker compose logs openclaw -f
```

**Web UI**: http://localhost:3000 | **API**: http://localhost:8080

---

## Step 2: Configure Workspace

OpenClaw stores data in `~/.openclaw/workspace/` by default. This is where NEON-SOUL reads memory files.

**Custom path?** Set `OPENCLAW_WORKSPACE` environment variable if your workspace is elsewhere.

### Verify Structure

```bash
ls -la ~/.openclaw/workspace/
```

Expected structure:
```
~/.openclaw/workspace/
├── SOUL.md           # AI identity (NEON-SOUL updates this)
├── USER.md           # User profile
├── IDENTITY.md       # Core identity statements
├── AGENTS.md         # Agent configurations
├── TOOLS.md          # Available tools
└── memory/
    ├── diary/        # Journal entries
    ├── experiences/  # Event memories
    ├── goals/        # Aspirations
    ├── knowledge/    # Learned facts
    ├── relationships/# People & connections
    └── preferences/  # Likes, dislikes, boundaries
```

### Create Memory Directories (if missing)

```bash
mkdir -p ~/.openclaw/workspace/memory/{diary,experiences,goals,knowledge,relationships,preferences}
```

---

## Step 3: Create Initial Memory Files

NEON-SOUL extracts signals from memory files. Let's create some starter content.

**Alternative**: The setup script (`scripts/setup-openclaw.sh`) creates scaffold files automatically. The examples below show what memory files look like for manual creation or customization.

> **Note**: The examples below illustrate the format. Your memory files should reflect *your* actual preferences and values - there's no "correct" content. The values shown (like "prioritize honesty") are just examples.

### preferences/communication.md

```bash
cat > ~/.openclaw/workspace/memory/preferences/communication.md << 'EOF'
---
category: communication
created: 2026-02-08
---

# Communication Preferences

## I Prefer

- Clear, direct feedback over hints
- Written explanations for complex topics
- Honest answers, even when uncomfortable

## I Avoid

- Passive-aggressive communication
- Unnecessary meetings when async works
- Sugarcoated feedback that hides problems

## Boundaries

- Respect work hours unless urgent
- Don't make promises I can't keep
EOF
```

### goals/current.md

```bash
cat > ~/.openclaw/workspace/memory/goals/current.md << 'EOF'
---
priority: high
status: in-progress
---

# Current Goals

## Learning

- Understand AI systems deeply
- Build practical projects, not just tutorials

## Values

- Prioritize honesty over comfort
- Maintain work-life balance
- Help others learn what I discover
EOF
```

### diary/first-entry.md

```bash
# Create a first diary entry
cat > ~/.openclaw/workspace/memory/diary/first-entry.md << 'EOF'
---
mood: curious
---

# First Entry

Setting up my AI assistant with NEON-SOUL. I want an AI that:

- Knows my preferences without being asked
- Remembers context across conversations
- Evolves alongside me over time

## Reflections

I believe transparency matters. If my AI develops beliefs about me,
I want to know where those beliefs came from.
EOF
```

---

## Step 4: Install NEON-SOUL

### Clone and Build

```bash
# From your projects directory
git clone https://github.com/geeks-accelerator/neon-soul.git
cd neon-soul

# Install dependencies
npm install

# Build
npm run build

# Verify (optional - runs full test suite)
npm test

# Quick smoke test (faster alternative)
npx tsx src/commands/synthesize.ts --help
```

### Configure Workspace Path

NEON-SOUL needs to know where OpenClaw lives:

```bash
export OPENCLAW_WORKSPACE=~/.openclaw/workspace
```

Or create a `.env` file:

```bash
echo "OPENCLAW_WORKSPACE=~/.openclaw/workspace" > .env
```

---

## Step 4.5: Start Ollama (Required for CLI)

NEON-SOUL CLI requires a local LLM. Start Ollama:

```bash
# From the neon-soul directory
docker compose -f docker/docker-compose.ollama.yml up -d

# Pull llama3 model (~4GB download)
docker exec neon-soul-ollama ollama pull llama3

# Verify Ollama is responding
curl http://localhost:11434/api/tags
```

**Note**: If you're using OpenClaw's built-in LLM (Option A above), you can skip this step and use `/neon-soul synthesize` in the chat interface instead.

---

## Step 5: Run Your First Synthesis

**Prerequisites**: Ollama must be running for CLI synthesis (see [Step 4.5: Start Ollama](#step-45-start-ollama-required-for-cli)).

### Preview (Dry Run)

```bash
# See what would happen without writing
npx tsx src/commands/synthesize.ts --dry-run --verbose
```

This shows:
- How many signals would be extracted
- Which dimensions are covered
- What axioms would emerge

### Full Synthesis

```bash
# Run full synthesis
npx tsx src/commands/synthesize.ts --force
```

Output location: `~/.openclaw/workspace/.neon-soul/`

---

## Step 6: Explore Your Soul

### Terminal Commands

View synthesis results directly:

```bash
# Check generated SOUL.md
cat ~/.openclaw/workspace/SOUL.md

# View extracted signals
cat ~/.openclaw/workspace/.neon-soul/signals.json | head -50

# View emergent axioms
cat ~/.openclaw/workspace/.neon-soul/axioms.json
```

### OpenClaw Chat Commands

If using OpenClaw's chat interface (Web UI, Telegram, Discord, Slack):

```
/neon-soul status
```

Output:
```
Last Synthesis: 2026-02-08T12:30:00Z (just now)
Pending Memory: 0 chars (Up to date)
Counts: 12 signals, 5 principles, 3 axioms
Dimension Coverage: 4/7 (57%)
```

### Trace an Axiom

In OpenClaw chat:
```
/neon-soul trace ax_honesty
```

Output:
```
誠 (honesty over comfort)
└── "prioritize honesty" (N=3)
    ├── preferences/communication.md:8
    ├── goals/current.md:14
    └── diary/first-entry.md:15
```

### Full Audit

```
/neon-soul audit --stats
```

**Note**: `/neon-soul` commands run in OpenClaw's chat interface, not the terminal. They use OpenClaw's LLM context for semantic operations.

---

## Troubleshooting

### OpenClaw Issues

| Problem | Solution |
|---------|----------|
| Container not starting | `docker compose logs openclaw` |
| Image not found | Check `docker/docker-compose.yml` image version matches Docker Hub |
| Permission denied | `sudo chown -R 1000:1000 ~/.openclaw` |
| Port 3000/8080 in use | Edit `docker/docker-compose.yml` port mapping |
| No LLM provider | Start Ollama (see Step 4.5) |

### NEON-SOUL Issues

| Problem | Solution |
|---------|----------|
| No signals extracted | Check memory files exist and have content |
| Empty SOUL.md | Run with `--force` flag |
| Build errors | Ensure Node.js 22+, run `npm install` |
| Engine compatibility error | Upgrade Node.js: `nvm install 22 && nvm use 22` |
| Test failures | Check Ollama if using real LLM tests |

### Memory File Issues

| Problem | Solution |
|---------|----------|
| Files not detected | Check `OPENCLAW_WORKSPACE` env var |
| Frontmatter errors | Ensure YAML between `---` delimiters |
| Unicode issues | Save files as UTF-8 |

---

## Next Steps

1. **Add more memory**: Create files in `~/.openclaw/workspace/memory/`
2. **Run synthesis again**: Watch axioms emerge as patterns converge
3. **Explore provenance**: Use `/neon-soul audit` to understand your soul
4. **Configure channels**: Connect Telegram, Discord, or Slack to OpenClaw ([Channel Setup Guide](https://docs.openclaw.ai/channels))
5. **Read the research**: See `docs/research/` for methodology details

---

## Quick Reference

### Commands

```bash
# OpenClaw
docker compose up -d                    # Start
docker compose down                     # Stop
docker compose logs -f openclaw         # Logs

# NEON-SOUL (Terminal - requires Ollama)
npx tsx src/commands/synthesize.ts --dry-run   # Preview changes
npx tsx src/commands/synthesize.ts --force     # Run synthesis
npm test                                       # Run tests

# NEON-SOUL (OpenClaw Chat Interface)
/neon-soul status                       # Check state
/neon-soul synthesize --dry-run         # Preview changes
/neon-soul rollback --force             # Restore backup
```

### Paths

| Path | Purpose |
|------|---------|
| `~/.openclaw/` | OpenClaw home directory |
| `~/.openclaw/workspace/` | Active workspace |
| `~/.openclaw/workspace/memory/` | Signal source files |
| `~/.openclaw/workspace/.neon-soul/` | Synthesis artifacts |
| `~/.openclaw/workspace/SOUL.md` | Generated identity |

### Ports

| Port | Service |
|------|---------|
| 3000 | OpenClaw Web UI (NEON-SOUL dev stack) |
| 8080 | OpenClaw API (NEON-SOUL dev stack) |
| 18789 | OpenClaw Control UI (upstream) |
| 11434 | Ollama API |

---

## Resources

**Project Documentation**:
- [NEON-SOUL Website](https://liveneon.org) - Public landing page
- [NEON-SOUL README](../../README.md)
- [Memory Data Landscape](../research/memory-data-landscape.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md)

**External Resources**:
- [OpenClaw Docker Documentation](https://docs.openclaw.ai/install/docker)
- [OpenClaw Practical Guide (2026)](https://aimlapi.com/blog/openclaw-a-practical-guide-to-local-ai-agents-for-developers)
- [Deploy OpenClaw in 15 Minutes](https://markaicode.com/deploy-openclaw-docker/)

---

*Guide created 2026-02-08. For issues, see troubleshooting section or open a GitHub issue.*
