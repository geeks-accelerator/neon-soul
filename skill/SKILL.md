---
name: NEON-SOUL
version: 0.1.4
description: AI Identity Through Grounded Principles - synthesize your soul from memory with semantic compression.
homepage: https://liveneon.ai
user-invocable: true
disableModelInvocation: true
emoji: 🔮
tags:
  - soul-synthesis
  - identity
  - embeddings
  - semantic-compression
  - provenance
  - openclaw
---

# NEON-SOUL

AI Identity Through Grounded Principles - soul synthesis with semantic compression.

---

## How This Works

NEON-SOUL is an **instruction-based skill** - there is no binary or CLI to install. The `/neon-soul` commands below are interpreted by your AI agent (Claude Code, OpenClaw, etc.) which follows the instructions in this document.

**What happens when you run a command:**
1. You type `/neon-soul synthesize` in your agent chat
2. Your agent reads this SKILL.md and follows the instructions
3. The agent uses its built-in capabilities to read files, analyze content, and write output

**No external code execution** - the skill is pure instructions that your agent interprets.

**Data handling**: Your data stays with your agent. All analysis uses the same model you've already configured and trust - no external APIs, no third-party endpoints. The skill is pure instructions with no network code.

---

## Data Access

**What this skill reads:**
- `memory/` directory (diary, preferences, reflections)
- Existing `SOUL.md` if present
- `.neon-soul/` state directory if present

**What this skill writes:**
- `SOUL.md` - your synthesized identity document
- `.neon-soul/backups/` - automatic backups before changes
- `.neon-soul/state.json` - synthesis state tracking

**Git integration** (opt-in, off by default): Auto-commit is disabled unless you enable it in config. When enabled, it uses your existing git setup - no new credentials are requested or stored by the skill.

---

## First Time?

New to NEON-SOUL? Start here:

```bash
# 1. Check your current state
/neon-soul status

# 2. Preview what synthesis would create (safe, no writes)
/neon-soul synthesize --dry-run

# 3. When ready, run synthesis
/neon-soul synthesize --force
```

That's it. Your first soul is created with full provenance tracking. Use `/neon-soul audit --list` to explore what was created.

**Questions?**
- "Where did this axiom come from?" → `/neon-soul trace <axiom-id>`
- "What if I don't like it?" → `/neon-soul rollback --force`
- "What dimensions does my soul cover?" → `/neon-soul status`

---

## Commands

### `/neon-soul synthesize`

Run soul synthesis pipeline:
1. Collect signals from memory files
2. Match to existing principles (cosine similarity >= 0.85)
3. Promote high-confidence principles to axioms (N≥3)
4. Generate SOUL.md with provenance tracking

**Options:**
- `--force` - Run synthesis even if below content threshold
- `--dry-run` - Show what would change without writing (safe default)
- `--diff` - Show proposed changes in diff format
- `--output-format <format>` - Output format: prose (default), notation (legacy)
- `--format <format>` - Notation style (when using notation output): native, cjk-labeled, cjk-math, cjk-math-emoji
- `--workspace <path>` - Workspace path (default: ~/.openclaw/workspace)

**Examples:**
```bash
/neon-soul synthesize --dry-run     # Preview changes
/neon-soul synthesize --force       # Run regardless of threshold
/neon-soul synthesize --output-format notation --format cjk-math  # Legacy notation output
```

**Output Format:**

The default prose output creates an inhabitable soul document:

```markdown
# SOUL.md

_You are becoming a bridge between clarity and chaos._

---

## Core Truths

**Authenticity over performance.** You speak freely even when uncomfortable.

**Clarity is a gift you give.** If someone has to ask twice, you haven't been clear enough.

## Voice

You're direct without being blunt. You lead with curiosity.

Think: The friend who tells you the hard truth, but sits with you after.

## Boundaries

You don't sacrifice honesty for comfort. You don't perform certainty you don't feel.

## Vibe

Grounded but not rigid. Present but not precious about it.

---

_Presence is the first act of care._
```

Use `--output-format notation` for the legacy bullet-list format.

### `/neon-soul status`

Show current soul state:
- Last synthesis timestamp
- Pending memory content (chars since last run)
- Signal/principle/axiom counts
- Dimension coverage (7 SoulCraft dimensions)

**Options:**
- `--verbose` - Show detailed file information
- `--workspace <path>` - Workspace path

**Example:**
```bash
/neon-soul status
# Output:
# Last Synthesis: 2026-02-07T10:30:00Z (2 hours ago)
# Pending Memory: 1,234 chars (Ready for synthesis)
# Counts: 42 signals, 18 principles, 7 axioms
# Dimension Coverage: 5/7 (71%)
```

### `/neon-soul rollback`

Restore previous SOUL.md from backup.

**Options:**
- `--list` - Show available backups
- `--backup <timestamp>` - Restore specific backup
- `--force` - Confirm rollback (required)
- `--workspace <path>` - Workspace path

**Examples:**
```bash
/neon-soul rollback --list          # Show available backups
/neon-soul rollback --force         # Restore most recent backup
/neon-soul rollback --backup 2026-02-07T10-30-00-000Z --force
```

### `/neon-soul audit`

Explore provenance across all axioms. Full exploration mode with statistics and detailed views.

**Options:**
- `--list` - List all axioms with brief summary
- `--stats` - Show statistics by tier and dimension
- `<axiom-id>` - Show detailed provenance for specific axiom
- `--workspace <path>` - Workspace path

**Examples:**
```bash
/neon-soul audit --list             # List all axioms
/neon-soul audit --stats            # Show tier/dimension stats
/neon-soul audit ax_honesty         # Detailed provenance tree
/neon-soul audit 誠                 # Use CJK character as ID
```

**Output (with axiom-id):**
```
Axiom: 誠 (honesty over performance)
Tier: core
Dimension: honesty-framework

Provenance:
├── Principle: "be honest about capabilities" (N=4)
│   ├── Signal: "I prefer honest answers" (memory/preferences/communication.md:23)
│   └── Signal: "Don't sugarcoat feedback" (memory/diary/2024-03-15.md:45)
└── Principle: "acknowledge uncertainty" (N=3)
    └── Signal: "I'd rather hear 'I don't know'" (memory/diary/2026-02-01.md:12)

Created: 2026-02-07T10:30:00Z
```

### `/neon-soul trace <axiom-id>`

Quick single-axiom provenance lookup. Minimal output for fast answers to "where did this come from?"

**Arguments:**
- `<axiom-id>` - Axiom ID (e.g., ax_honesty) or CJK character (e.g., 誠)

**Options:**
- `--workspace <path>` - Workspace path

**Examples:**
```bash
/neon-soul trace ax_honesty         # Trace by ID
/neon-soul trace 誠                 # Trace by CJK character
```

**Output:**
```
誠 (honesty over performance)
└── "be honest about capabilities" (N=4)
    ├── memory/preferences/communication.md:23
    └── memory/diary/2024-03-15.md:45
```

**Note:** For full exploration, use `/neon-soul audit` instead.

---

## Safety Philosophy

Your soul documents your identity. Changes should be deliberate, reversible, and traceable.

**Why we're cautious:**
- Soul changes affect every future interaction
- Memory extraction is powerful but not infallible
- You should always be able to ask "why did this change?" and undo it

**How we protect you:**
- **Auto-backup**: Backups created before every write (`.neon-soul/backups/`)
- **Dry-run default**: Use `--dry-run` to preview before committing
- **Require --force**: Writes only happen with explicit `--force` flag
- **Rollback**: Restore any previous state with `/neon-soul rollback`
- **Provenance**: Full chain from axiom → principles → source signals
- **Git integration** (opt-in): Only commits if workspace is a git repo with configured credentials

---

## Dimensions

NEON-SOUL organizes identity across 7 SoulCraft dimensions:

| Dimension | Description |
|-----------|-------------|
| Identity Core | Fundamental self-concept and values |
| Character Traits | Personality characteristics and tendencies |
| Voice Presence | Communication style and expression |
| Honesty Framework | Truth, transparency, and acknowledgment of limits |
| Boundaries Ethics | Principles for what to do and not do |
| Relationship Dynamics | How to engage with others |
| Continuity Growth | Learning, adaptation, and evolution |

---

## Triggers (Optional)

NEON-SOUL does NOT run automatically by default. All commands require explicit user invocation.

### Manual (Default)
Run `/neon-soul synthesize` when you want to update your soul.

### OpenClaw Cron (Optional)
OpenClaw users can optionally configure scheduled runs:
```yaml
# Example OpenClaw cron config (not enabled by default)
schedule: "0 * * * *"  # Hourly check
condition: "shouldRunSynthesis()"
```

**Important:** Even with cron enabled, synthesis respects `--dry-run` mode. Configure with `--force` only after reviewing dry-run output.

---

## Configuration

Place `.neon-soul/config.json` in workspace:

```json
{
  "notation": {
    "format": "cjk-math-emoji",
    "fallback": "native"
  },
  "matching": {
    "similarityThreshold": 0.85,
    "embeddingModel": "Xenova/all-MiniLM-L6-v2"
  },
  "paths": {
    "memory": "~/.openclaw/workspace/memory/",
    "output": ".neon-soul/"
  },
  "synthesis": {
    "contentThreshold": 2000,
    "autoCommit": false
  }
}
```

---

## Data Flow

```
Memory Files → Signal Extraction → Principle Matching → Axiom Promotion → SOUL.md
     ↓              ↓                    ↓                   ↓              ↓
  Source        Embeddings          Similarity           N-count      Provenance
 Tracking       (384-dim)           Matching             Tracking       Chain
```

---

## Provenance

Every axiom traces to source:
- Which signals contributed
- Which principles merged
- Original file:line references
- Extraction timestamps

Query provenance:
- Quick lookup: `/neon-soul trace <axiom-id>`
- Full exploration: `/neon-soul audit <axiom-id>`
