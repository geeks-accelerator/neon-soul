# Workflow: Skill Publishing (npm + ClawHub)

**Purpose**: Publish NEON-SOUL skill updates to npm and ClawHub registries, and install on various agent platforms.

**When to use**: Version bumps, bug fixes, feature releases, or skill installation.

**Frequency**: Per release (typically after plan completion or bug fixes).

**Status**: Established (N=12: v0.1.0 through v0.2.1)

---

## What Is This?

NEON-SOUL is an [Agent Skill](https://agentskills.io) - portable instructions that extend what AI coding agents can do. The skill is defined in `skill/SKILL.md`, a Markdown document with YAML frontmatter that any compatible agent can read and execute.

**Skill Directory Structure**:
```
skill/
├── SKILL.md       # Main skill manifest (required)
├── .env.example   # ClawHub token template
└── .env           # Your ClawHub token (gitignored)
```

---

## Commands

| Command | Description |
|---------|-------------|
| `/neon-soul synthesize` | Run soul synthesis pipeline |
| `/neon-soul status` | Show current soul state |
| `/neon-soul rollback` | Restore previous SOUL.md |
| `/neon-soul audit` | Explore provenance across axioms |
| `/neon-soul trace <axiom>` | Quick single-axiom lookup |

See `skill/SKILL.md` for full command documentation.

---

## Links

- **Website**: https://liveneon.ai (note: homepage URL in SKILL.md points to GitHub for VirusTotal compatibility)
- **GitHub**: https://github.com/geeks-accelerator/neon-soul
- **npm**: https://www.npmjs.com/package/neon-soul
- **ClawHub**: https://clawhub.ai (search "neon-soul")
- **Agent Skills Standard**: https://agentskills.io

---

## Quick Reference (Returning Users)

Already set up? Jump to:
- [Pre-Flight Checklist](#pre-flight-checklist)
- [Version Bump](#version-bump)
- [Publish to npm](#publish-to-npm)
- [Publish to ClawHub](#publish-to-clawhub)

New to publishing? Start with [First-Time Setup](#first-time-setup-one-time).

---

## First-Time Setup (One-Time)

Skip this section if already configured.

### npm Setup

```bash
# Login to npm
npm login
npm whoami  # Verify: should show your username

# Enable 2FA (required for publishing)
# Go to: https://www.npmjs.com/settings/USERNAME/security
```

### ClawHub Setup

```bash
# 1. Create account at https://clawhub.ai
# 2. Generate token at https://clawhub.ai/settings/tokens
# 3. Save token to skill/.env
cp skill/.env.example skill/.env
# Edit skill/.env and add: CLAWHUB_TOKEN=clh_xxx...

# 4. Install CLI
npm install -g clawhub

# 5. Login
source skill/.env
clawhub login --token "$CLAWHUB_TOKEN" --no-browser
clawhub whoami  # Verify: should show your username
```

### Package Exclusions Setup

Ensure sensitive files are excluded from npm package:

**`.npmignore`** (create if missing):
```
skill/.env
**/.env
tests/
docker/
docs/
```

**`package.json`** files array:
```json
"files": [
  "dist",
  "skill",
  "!skill/.env",
  "!**/.env"
]
```

> **Lesson learned**: Both `.npmignore` AND `package.json` files array are needed. The `files` array is an allowlist that can override `.npmignore`.

---

## Pre-Flight Checklist

Before publishing, verify:

```bash
# 1. Working directory (must be project root)
pwd  # Should end with /neon-soul

# 2. Clean build
npm run clean && npm run build

# 3. All tests pass
npm test

# 4. Version consistency (all three should match)
grep '"version"' package.json
grep 'version:' skill/SKILL.md
grep "version:" src/skill-entry.ts

# 5. No secrets in package (CRITICAL)
npm publish --dry-run 2>&1 | grep -E "skill/\.env$"
# Should show NOTHING or only .env.example
# If you see "skill/.env" (without .example), STOP and fix exclusions

# 6. Logged into both registries
npm whoami
clawhub whoami

# 7. Clean working directory (if pre-commit hooks configured)
git status  # No uncommitted changes that would block commit
```

---

## Version Bump

Update version in **all three locations**:

| File | Search Pattern | Format |
|------|----------------|--------|
| `package.json` | `grep '"version"'` | `"version": "X.Y.Z",` |
| `skill/SKILL.md` | `grep 'version:'` | `version: X.Y.Z` |
| `src/skill-entry.ts` | `grep "version:"` | `version: 'X.Y.Z',` |

Then rebuild and verify:

```bash
npm run build
# Verify build succeeded
ls dist/skill-entry.js  # Should exist
```

> **Lesson learned**: Version mismatch in `skill-entry.ts` caused post-deployment fixes (v0.1.0 → v0.1.2). Always update all three before publishing.

### Commit Version Bump

```bash
git add package.json skill/SKILL.md src/skill-entry.ts
git commit -m "chore(neon-soul): bump version to X.Y.Z"
```

> Commit before publishing so version bump is tracked even if publish fails.

---

## Publish to npm

```bash
npm publish --access public
```

**2FA Required**: npm will open browser for authentication. Complete the browser flow, then return to terminal.

**Alternative for CI/CD**: Create an automation token at https://www.npmjs.com/settings/USERNAME/tokens. Automation tokens should be: (1) scoped to package, (2) stored in CI/CD secrets, (3) rotated periodically.

**Verify**:
```bash
npm view neon-soul version
# Should show new version

npm view neon-soul
# Shows full package info including dependencies
```

---

## Publish to ClawHub

```bash
# Ensure logged in (token may expire)
source skill/.env
clawhub whoami
# If "Unauthorized", re-login using First-Time Setup login command
```

```bash
# Publish (from project root)
clawhub --workdir . publish skill \
  --slug neon-soul \
  --name "NEON-SOUL" \
  --version X.Y.Z \
  --changelog "Description of changes"
```

**Verify**:
```bash
clawhub inspect neon-soul
# Should show new version

clawhub search neon-soul
# Should appear in search results
```

---

## Post-Publish Verification

```bash
# 1. npm package loads correctly
node -e "import('neon-soul/skill').then(() => console.log('OK'))"

# 2. ClawHub listing shows correct version
clawhub inspect neon-soul

# 3. Clean install test (recommended for major versions)
rm -rf /tmp/test-ns && mkdir /tmp/test-ns && cd /tmp/test-ns
npm init -y && npm install neon-soul
node -e "import('neon-soul/skill').then(() => console.log('OK'))"
cd -  # Return to original directory
```

---

## Security Scan Response

ClawHub runs automated security scans after publishing. Check status at:
`https://clawhub.ai/leegitw/neon-soul`

### Scan Categories

| Category | What It Checks |
|----------|----------------|
| Purpose & Capability | Does SKILL.md match actual functionality? |
| Instruction Scope | What files/actions are requested? |
| Install Mechanism | Code execution vs instruction-only? |
| Credentials | API keys, tokens requested? |
| Persistence & Privilege | Writes to disk, autonomous triggers? |

### Common Flags and Fixes

| Flag | Likely Cause | Fix |
|------|--------------|-----|
| "CLI referenced but no binary" | `/neon-soul` commands without install | Add "How This Works" section explaining instruction-based execution |
| "Reads sensitive files" | Memory directory access | Add "Data Access" section listing files read/written |
| "Autonomous triggers" | Cron/scheduled runs mentioned | Clarify triggers are opt-in, require explicit configuration |
| "Git credential exposure" | Auto-commit feature | Clarify git integration uses existing local credentials |
| "LLM API calls" / "External LLM" | SKILL.md mentions "call LLMs" | Reword to "analyze content" + add explicit data handling statement (no external APIs) |
| "Model-invocable" / "Autonomous execution" | Missing `disableModelInvocation: true` | Add to frontmatter - requires explicit user invocation |
| "Write access" / "Auto-commit" | Auto-commit behavior unclear | Clarify it's opt-in and off by default |

### Response Process

1. **Review findings** at ClawHub skill page
2. **Update SKILL.md** with clarifications (see fixes above)
3. **Publish patch version** (e.g., v0.1.1 → v0.1.2)
4. **Re-check scan** after new version processes

> **Lesson learned**: v0.1.0 flagged as "Suspicious (medium confidence)". Fixed in v0.1.1 by adding "How This Works", "Data Access", and clarifying opt-in triggers.

---

## Troubleshooting

| Issue | Symptom | Solution |
|-------|---------|----------|
| **npm 2FA failure** | "Two-factor authentication required" | Complete browser auth flow, or create automation token |
| **npm 403 Forbidden** | Permission denied | Verify `npm whoami`, check package name not taken |
| **`.env` in package** | Token visible in `npm publish --dry-run` | Add to both `.npmignore` AND `package.json` files array with `!` prefix |
| **ClawHub unauthorized** | "Unauthorized" on whoami | Re-login using First-Time Setup login command |
| **ClawHub token expired** | Login worked before, now fails | Generate new token at clawhub.ai/settings/tokens |
| **Version mismatch** | Different versions in npm vs ClawHub | Check all 3 locations before publish |
| **Build fails** | TypeScript errors | Check `process.env` uses bracket notation: `process.env['VAR']` |
| **Tests fail** | Blocking publish | Fix tests first; don't publish broken code |
| **Wrong directory** | "package.json not found" | `cd` to project root (where package.json is) |
| **ClawHub "Suspicious"** | Security scan flags | See Security Scan Response section above |
| **npm package too large** | >1MB warning | Check `.npmignore` excludes tests/, docs/, docker/ |
| **Version in publish example stale** | Old version in publish example | Update `--version X.Y.Z` in this workflow |

### TypeScript Build Errors

Common TypeScript errors and fixes:

```typescript
// Error: Property 'VAR' comes from index signature
// Wrong:
process.env.OLLAMA_BASE_URL
// Right:
process.env['OLLAMA_BASE_URL']
```

---

## Changelog Guidelines

Keep changelog concise and user-focused:

```bash
# Good - user-facing description
--changelog "Fix version display in skill metadata"
--changelog "Add Data Access section for security clarity"
--changelog "Improve error messages for missing LLM context"

# Bad - internal implementation details
--changelog "Updated src/skill-entry.ts line 49 to fix version mismatch"
```

---

## Publish Order

**Recommended**: ClawHub first, then npm.

**Why**: ClawHub security scan may require follow-up patch. Better to discover issues before npm publish (npm versions are permanent after 72 hours).

**Alternative**: If npm is primary distribution channel, publish npm first for faster user access.

---

## Rollback

### Default: Patch Release (Always Prefer)

The standard response to any issue is a patch release:

```bash
# 1. Fix the issue in code
# 2. Bump to X.Y.Z+1 (all three locations)
# 3. npm run clean && npm run build
# 4. npm test
# 5. git commit
# 6. Publish to ClawHub, then npm
```

This preserves downstream compatibility and follows semver.

### Emergency Only: Deprecate or Unpublish

Reserve for critical security/legal issues:

**Deprecate** (warns but doesn't break):
```bash
npm deprecate neon-soul@X.Y.Z "Security issue - upgrade to X.Y.Z+1"
```

**Unpublish** (breaks downstream, last resort):
```bash
npm unpublish neon-soul@X.Y.Z  # Within 72 hours only
# WARNING: This breaks anyone who installed this version
```

### ClawHub Rollback

```bash
# Publish new version with fix
clawhub --workdir . publish skill \
  --slug neon-soul \
  --name "NEON-SOUL" \
  --version X.Y.Z+1 \
  --changelog "Fix: description of fix"
```

---

## Cross-References

**Original deployment plan**:
- `docs/plans/2026-02-10-clawhub-deployment.md` - Full 7-stage deployment with rationale

**Related files**:
- `package.json` - npm package configuration
- `skill/SKILL.md` - ClawHub skill manifest
- `.npmignore` - Package exclusions
- `src/skill-entry.ts` - Version metadata (line ~49)

**Published packages**:
- npm: https://www.npmjs.com/package/neon-soul
- ClawHub: https://clawhub.ai/leegitw/neon-soul

**Issues from deployment**:
- `docs/issues/2026-02-10-post-deployment-version-fixes.md` - Version sync lessons

**Version History**:
| Version | Date | Notes |
|---------|------|-------|
| 0.1.0 | 2026-02-10 | Initial release |
| 0.1.1 | 2026-02-10 | Security scan clarifications |
| 0.1.2 | 2026-02-10 | Version sync fixes, README path fixes |
| 0.1.3 | 2026-02-11 | Security scan fixes: disableModelInvocation, data handling statement |
| 0.1.4 | 2026-02-11 | Added configPaths array |
| 0.1.5 | 2026-02-11 | Added kebab-case disable-model-invocation |
| 0.1.6 | 2026-02-11 | Added workspace path to configPaths, model invocation clarification |
| 0.1.7 | 2026-02-11 | (skipped - internal) |
| 0.1.8 | 2026-02-11 | (skipped - internal) |
| 0.1.9 | 2026-02-12 | Fix VirusTotal flag (homepage URL), embedding model fail-fast, Requirements section |
| 0.1.10 | 2026-02-12 | Fix "No external code execution" wording, add model integrity verification |
| 0.2.0 | 2026-02-12 | **BREAKING**: Remove @xenova/transformers, LLM-based similarity (requires active LLM connection) |
| 0.2.1 | 2026-02-12 | PBD stages 13-17: cycle management, anti-echo-chamber, TOCTOU fix, Zod validation |
