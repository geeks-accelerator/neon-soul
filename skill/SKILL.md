---
name: NEON-SOUL
description: AI Identity Through Grounded Principles - synthesize your soul from memory with semantic compression.
homepage: https://liveneon.ai
user-invocable: true
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
- `--format <format>` - Output notation: native, cjk-labeled, cjk-math, cjk-math-emoji
- `--workspace <path>` - Workspace path (default: ~/.openclaw/workspace)

**Examples:**
```bash
/neon-soul synthesize --dry-run     # Preview changes
/neon-soul synthesize --force       # Run regardless of threshold
/neon-soul synthesize --format cjk-math  # Use CJK+logic notation
```

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
- **Rollback**: Restore any previous state with `/neon-soul rollback`
- **Provenance**: Full chain from axiom → principles → source signals
- **Git integration**: Auto-commit if workspace is a repo

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

## Triggers

### Content Threshold (cron)

Runs automatically when new memory content exceeds threshold (default: 2000 chars).

Configured in OpenClaw cron:
```yaml
schedule: "0 * * * *"  # Hourly check
condition: "shouldRunSynthesis()"
```

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
    "autoCommit": true
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
