---
name: NEON-SOUL
version: 0.2.1
description: AI Identity Through Grounded Principles - synthesize your soul from memory with semantic compression.
homepage: https://github.com/geeks-accelerator/neon-soul
user-invocable: true
disableModelInvocation: true
disable-model-invocation: true
emoji: 🔮
metadata:
  openclaw:
    config:
      stateDirs:
        - memory/
        - .neon-soul/
    requires:
      config:
        - memory/
        - .neon-soul/
        - SOUL.md
tags:
  - identity
  - personality
  - character
  - values
  - journaling
  - diary
  - memory
  - self-reflection
  - self-discovery
  - ai-agent
  - openclaw
  - personal-knowledge
---

# NEON-SOUL

AI Identity Through Grounded Principles - soul synthesis with semantic compression.

---

## Upgrading to 0.2.0

If you used NEON-SOUL before version 0.2.0:
- Your existing `.neon-soul/state.json` will work (embedding fields are ignored)
- First synthesis will recalculate all similarity matches
- Your SOUL.md and provenance chain are unchanged

Nothing to do - just run `/neon-soul synthesize` as usual.

---

## What Changed in v0.2.0

We removed the embedding model dependency, which means principle matching now uses your agent's LLM directly. This is the same model you already trust with your memory files.

**What this means for you:**
- Synthesis may take a bit longer (seconds, not minutes)
- Results may vary slightly between runs (like asking the same question twice - similar but not identical)
- You'll need an active connection to your agent (can't run offline)

**Why we made this choice:** The previous approach required third-party code that security scanners flagged. Your soul is too important for compromises.

**Your soul reflects patterns in your memory, not exact calculations.** Like human memory itself, the synthesis process involves interpretation. Running synthesis twice may produce slightly different results - but the core truths will remain stable if your memory is consistent.

---

## How This Works

NEON-SOUL is an **instruction-based skill** - there is no binary or CLI to install. The `/neon-soul` commands below are interpreted by your AI agent (Claude Code, OpenClaw, etc.) which follows the instructions in this document.

**What happens when you run a command:**
1. You type `/neon-soul synthesize` in your agent chat
2. Your agent reads this SKILL.md and follows the instructions
3. The agent uses its built-in capabilities to read files, analyze content, and write output

**No third-party services**: NEON-SOUL does not transmit your data to any external servers, third-party endpoints, or services beyond your agent. The skill uses only your agent's existing capabilities.

**Pure instruction skill**: NEON-SOUL uses your agent's existing LLM for semantic analysis. No third-party packages, no model downloads, no additional dependencies.

**Data handling**: Your data stays within your agent's trust boundary. If your agent uses a cloud-hosted LLM (Claude, GPT, etc.), data is transmitted to that service as part of normal agent operation - the same as any other agent interaction. If your agent uses a local LLM (Ollama, etc.), data stays on your machine.

**Principle matching**: When similar principles are detected, the one with the most signal confirmations (highest strength) is kept. Equal-strength principles prefer the older observation.

---

## Requirements

NEON-SOUL requires only an active connection to your AI agent (Claude Code, OpenClaw, etc.). The agent provides all necessary capabilities:

| Requirement | Details |
|-------------|---------|
| Agent | Claude Code, OpenClaw, or compatible |
| LLM access | Your agent's configured LLM (for semantic analysis) |
| No packages | No npm packages required |
| No models | No model downloads |

**That's it.** If your agent works, NEON-SOUL works.

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

## Privacy Considerations

NEON-SOUL processes personal memory files to synthesize your identity. Consider these privacy factors:

**Your agent's LLM determines data handling:**
- **Cloud LLM** (Claude, GPT, etc.): Your memory content is sent to that provider as part of normal LLM operation. This is no different from any other agent interaction with your files.
- **Local LLM** (Ollama, LM Studio, etc.): Your data stays entirely on your machine.

**What NEON-SOUL does NOT do:**
- Send data to any service beyond your configured agent
- Store data anywhere except your local workspace
- Transmit to third-party analytics, logging, or tracking services
- Make network requests independent of your agent

**Before running synthesis:**
1. Review what's in your `memory/` directory
2. Remove or move any secrets, credentials, or highly sensitive files
3. Use `--dry-run` to preview what will be processed
4. Consider whether your LLM provider's privacy policy is acceptable for this content

**About `disable-model-invocation: true`:**
This metadata flag means NEON-SOUL cannot run autonomously - your agent cannot invoke the skill without your explicit command. When you do invoke the skill (e.g., `/neon-soul synthesize`), it uses your agent's LLM for semantic analysis. This is expected behavior, not a contradiction.

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
2. Match to existing principles (semantic similarity via LLM)
3. Promote high-confidence principles to axioms (N≥3)
4. Generate SOUL.md with provenance tracking

**Options:**
- `--force` - Run synthesis even if below content threshold
- `--force-resynthesis` - Force full resynthesis (ignore incremental mode)
- `--dry-run` - Show what would change without writing (safe default)
- `--diff` - Show proposed changes in diff format
- `--output-format <format>` - Output format: prose (default), notation (legacy)
- `--format <format>` - Notation style (when using notation output): native, cjk-labeled, cjk-math, cjk-math-emoji
- `--workspace <path>` - Override workspace directory (default: current workspace)

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
  "paths": {
    "memory": "memory/",
    "output": ".neon-soul/"
  },
  "synthesis": {
    "contentThreshold": 2000,
    "autoCommit": false
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEON_SOUL_DEBUG` | `0` | Enable debug logging (1 = on) |
| `NEON_SOUL_SKIP_META_SYNTHESIS` | `0` | Skip meta-synthesis pass (1 = skip) |
| `NEON_SOUL_FORCE_RESYNTHESIS` | `0` | Force full resynthesis (1 = force) |

**Usage:**
```bash
NEON_SOUL_DEBUG=1 /neon-soul synthesize --force   # Debug mode
NEON_SOUL_FORCE_RESYNTHESIS=1 /neon-soul synthesize --force  # Full resynthesis
```

---

## Cycle Management

NEON-SOUL uses three synthesis modes:

| Mode | Trigger | Behavior |
|------|---------|----------|
| **initial** | No existing soul | Full synthesis from scratch |
| **incremental** | <30% new principles | Merge new insights without full resynthesis |
| **full-resynthesis** | ≥30% new OR contradictions OR manual | Complete resynthesis of all principles |

**When does full-resynthesis trigger?**
- New principle ratio ≥30%
- Detected contradictions (≥2)
- Hierarchy structure changed
- `--force-resynthesis` flag used

Use `--force-resynthesis` when you've significantly restructured your memory or want to rebuild from scratch. Also available via `NEON_SOUL_FORCE_RESYNTHESIS=1` environment variable.

---

## Provenance Classification

Signals are classified by their source type (SSEM model):

| Type | Description | Example |
|------|-------------|---------|
| **self** | Things you wrote | diary entries, reflections, personal notes |
| **curated** | Things you chose to keep | saved quotes, bookmarked articles, adopted guides |
| **external** | Things others said about you | peer reviews, feedback, external assessments |

Provenance is tracked for anti-echo-chamber protection.

---

## Grounding Requirements (Anti-Echo-Chamber Protection)

To prevent self-reinforcing beliefs, axioms must be grounded in diverse evidence:

| Criterion | Default | Why |
|-----------|---------|-----|
| Minimum principles | 3 | Requires pattern across observations |
| Provenance diversity | 2 types | Prevents single-source dominance |
| External OR questioning | Required | Ensures perspective beyond self |

**Blocked axioms** appear in synthesis output with their blocker reason:
```
⚠ 2 axioms blocked by anti-echo-chamber:
  - "I value authenticity above all" (self-only provenance)
  - "Growth requires discomfort" (no questioning evidence)
```

To unblock, add external sources or questioning evidence to your memory.

---

## Data Flow

```
Memory Files → Signal Extraction → Principle Matching → Axiom Promotion → SOUL.md
     ↓              ↓                    ↓                   ↓              ↓
  Source        LLM Analysis        Semantic             N-count      Provenance
 Tracking       (your agent)        Matching             Tracking       Chain
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

---

## Troubleshooting

### Why does my output have bullet lists instead of prose?

When prose generation fails, NEON-SOUL falls back to bullet lists of native axiom text. This preserves your data while signaling that expansion didn't complete.

**Common causes:**
- **LLM provider not available**: Prose expansion requires an LLM. Check your configuration.
- **Validation failures**: The LLM output didn't match expected format (retried once, then fell back).
- **Network timeout**: Generation may have timed out.

**How to check:**
- Enable debug logging: `NEON_SOUL_DEBUG=1 /neon-soul synthesize --force`
- Look for `[prose-expander]` log lines indicating validation or generation failures

**What to try:**
- **Regenerate**: Run synthesis again. LLM output varies; a second attempt often succeeds.
- **Check LLM health**: If using Ollama, verify it's running: `curl http://localhost:11434/api/tags`
- **Use notation format**: If prose keeps failing, use `--output-format notation` for reliable output.

### Why is my essence statement missing?

The essence statement (the italicized line at the top) only appears when LLM extraction succeeds. If missing:
- Your LLM provider may not be configured
- Extraction validation failed (trait lists are rejected)
- Network error during generation

The soul is still valid without it. Run synthesis again to retry extraction.

### Why did an axiom get placed in a different dimension than expected?

Dimension classification uses semantic analysis. If results seem wrong:
- Check the axiom's source signals (`/neon-soul audit <axiom-id>`)
- The LLM classifier uses the axiom's native text, which may have different semantic weight than you expect
- Unknown dimensions default to `vibe` (logged with `NEON_SOUL_DEBUG=1`)

### Soul synthesis paused / LLM unavailable

If you see "Soul synthesis paused: Your agent's LLM is temporarily unavailable":

**What this means:**
- Your agent needs an active LLM connection for semantic matching
- The skill failed to reach the LLM after retrying

**What to try:**
- Check your agent is running and connected
- Check network connectivity
- If using Ollama locally, verify it's running: `curl http://localhost:11434/api/tags`
- Try again in a moment - transient failures are common

**No partial writes.** When LLM is unavailable, NEON-SOUL stops without writing to your files. Note: If using a cloud LLM, some data may have been sent before the failure - this is normal agent operation.
