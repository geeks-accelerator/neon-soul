# NEON-SOUL Skill

AI Identity Through Grounded Principles - soul synthesis with semantic compression.

## What Is This?

This is an [Agent Skill](https://agentskills.io) - portable instructions that extend what AI coding agents can do. The skill is defined in `SKILL.md`, a Markdown document with YAML frontmatter that any compatible agent can read and execute.

## Installation

### Claude Code / Gemini CLI / Cursor

Copy the skill directory into your agent's skills folder:

```bash
git clone https://github.com/leegitw/neon-soul
cp -r neon-soul/skill ~/.claude/skills/neon-soul
```

The skill becomes available as `/neon-soul` commands. Compatible agents will also auto-invoke it when detecting relevant tasks.

### OpenClaw

```bash
clawhub install leegitw/neon-soul
```

Skills install to `./skills/` and OpenClaw loads them automatically.

### Via npm (for OpenClaw skill developers)

> **Note**: The npm package requires an LLM provider context from OpenClaw.
> It will throw `LLMRequiredError` if used standalone.
> For standalone use, wait for v0.2.0 which will include Ollama fallback.

```bash
npm install neon-soul
```

### Any LLM Agent (Copy/Paste)

Open `SKILL.md` on GitHub, copy the contents, and paste directly into your agent's chat. The agent will follow the instructions immediately.

## Commands

| Command | Description |
|---------|-------------|
| `/neon-soul synthesize` | Run soul synthesis pipeline |
| `/neon-soul status` | Show current soul state |
| `/neon-soul rollback` | Restore previous SOUL.md |
| `/neon-soul audit` | Explore provenance across axioms |
| `/neon-soul trace <axiom>` | Quick single-axiom lookup |

See `SKILL.md` for full command documentation.

## Files

```
skill/
├── SKILL.md       # Main skill manifest (required)
├── README.md      # This file
├── .env.example   # ClawHub token template
└── .env           # Your ClawHub token (gitignored)
```

## Publishing to ClawHub

1. Get a token from https://clawhub.ai/settings/tokens
2. Copy `.env.example` to `.env` and add your token
3. Install CLI: `npm install -g clawhub`
4. Publish:
   ```bash
   source .env
   clawhub publish skill \
     --slug neon-soul \
     --name "NEON-SOUL" \
     --version 0.1.2
   ```

## Links

- **Website**: https://liveneon.ai
- **GitHub**: https://github.com/leegitw/neon-soul
- **npm**: https://www.npmjs.com/package/neon-soul
- **ClawHub**: https://clawhub.ai (search "neon-soul")
- **Agent Skills Standard**: https://agentskills.io
