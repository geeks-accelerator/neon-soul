# Plan: ClawHub Deployment and npm Publication

**Created**: 2026-02-10
**Status**: Draft
**Priority**: High
**Type**: Deployment
**Trigger**: think hard
**Review Required**: Yes

---

## Summary

Deploy NEON-SOUL as a publicly available Agent Skill by:
1. Publishing to ClawHub (clawhub.ai) for OpenClaw users
2. Publishing the Node.js package to npm for programmatic use
3. Optionally publishing Docker images for self-hosted deployments

**Goal**: Any agent (Claude Code, Gemini CLI, Cursor, OpenClaw, etc.) can use NEON-SOUL.

**Standard**: Built on the [Agent Skills](https://agentskills.io) standard originated by Anthropic and adopted by 27+ tools.

---

## Prerequisites

**Already Complete**:
- [x] Skill entry point (`src/skill-entry.ts`)
- [x] SKILL.md manifest (`skill/SKILL.md`)
- [x] ClawHub token config (`skill/.env.example`, `skill/.env` gitignored)
- [x] Docker configuration (`docker/`)
- [x] Package.json configured for publishing
- [x] All 57+ tests passing
- [x] Website deployed at https://liveneon.ai

**Required Before Deployment**:
- [ ] ClawHub account and API token (save to `skill/.env`)
- [ ] npm account with publish access
- [ ] Docker Hub account (optional, for images)
- [ ] Decision on LLM provider strategy (see Architecture Decision)

---

## Architecture Decision: LLM Provider Strategy

NEON-SOUL requires an LLM for semantic classification. OpenClaw provides an LLM context, but we need to decide how to handle this.

### Option A: OpenClaw LLM Only (Recommended)

Use the LLM provided by OpenClaw's context. No external dependencies.

**Pros**: Simple, no API keys needed, works with any OpenClaw LLM
**Cons**: Requires OpenClaw context, can't run standalone

### Option B: Ollama Fallback

If OpenClaw LLM not available, fall back to local Ollama.

**Pros**: Works standalone, no API costs
**Cons**: Requires Ollama installation, slower

### Option C: API Key Configuration

Allow users to configure their own Anthropic/OpenAI keys.

**Pros**: Maximum flexibility
**Cons**: Complexity, key management

**Recommendation**: Start with Option A. Document that NEON-SOUL requires OpenClaw's LLM context.

---

## Stages

### Stage 1: Pre-Publication Checklist

**Purpose**: Verify everything is ready for publication

**Tasks**:

1. **Verify build**:
   ```bash
   npm run clean && npm run build
   ls dist/  # Should include skill-entry.js
   ```

2. **Run full test suite**:
   ```bash
   npm test
   ```

3. **Verify package.json**:
   - [ ] `name`: `neon-soul`
   - [ ] `version`: `0.1.0` (or appropriate version)
   - [ ] `files`: includes `dist` and `skill`
   - [ ] `exports`: includes `./skill` entry
   - [ ] `repository`: points to GitHub
   - [ ] `homepage`: https://liveneon.ai

4. **Verify SKILL.md frontmatter**:
   - [ ] `name`: NEON-SOUL
   - [ ] `homepage`: https://liveneon.ai
   - [ ] `user-invocable`: true
   - [ ] `emoji`: set

5. **Check for sensitive data**:
   ```bash
   # No API keys or secrets in committed files
   grep -r "sk-ant\|sk-" src/ skill/ --include="*.ts" --include="*.md"
   ```

**Acceptance Criteria**:
- [ ] Build succeeds without errors
- [ ] All tests pass
- [ ] Package metadata complete
- [ ] No sensitive data in publishable files

**Estimated scope**: 30 minutes

---

### Stage 2: npm Package Publication

**Purpose**: Publish Node.js package to npm registry

**Files to modify**:
- `package.json` - Bump version if needed

**Tasks**:

1. **Login to npm**:
   ```bash
   npm login
   # Enter credentials
   npm whoami  # Verify
   ```

2. **Dry-run publish**:
   ```bash
   npm publish --dry-run
   # Review what would be published
   ```

3. **Publish**:
   ```bash
   npm publish --access public
   ```

4. **Verify publication**:
   ```bash
   npm view neon-soul
   # Check https://www.npmjs.com/package/neon-soul
   ```

**Acceptance Criteria**:
- [ ] Package published to npm
- [ ] Can install via `npm install neon-soul`
- [ ] `dist/skill-entry.js` included in package
- [ ] `skill/SKILL.md` included in package

**Commit**: `chore(neon-soul): publish v0.1.0 to npm`

**Estimated scope**: 15 minutes

---

### Stage 3: ClawHub Token Setup

**Purpose**: Get ClawHub API token for publication

**Files**:
- `skill/.env.example` - Template (already exists)
- `skill/.env` - Your token (gitignored)

**Tasks**:

1. **Create ClawHub account**:
   - Go to https://www.clawhub.ai
   - Sign up / Log in

2. **Generate API token**:
   - Navigate to https://clawhub.ai/settings/tokens
   - Generate new API token

3. **Store token in skill/.env**:
   ```bash
   cp skill/.env.example skill/.env
   # Edit skill/.env and add your token
   ```

4. **Install ClawHub CLI**:
   ```bash
   npm install -g @clawhub/cli
   # or
   brew install clawhub/tap/clawhub
   ```

5. **Verify authentication**:
   ```bash
   export CLAWHUB_REGISTRY=https://www.clawhub.ai
   source skill/.env
   clawhub login --token "$CLAWHUB_TOKEN" --no-browser
   clawhub whoami
   ```

**Acceptance Criteria**:
- [ ] ClawHub account created
- [ ] API token saved to `skill/.env`
- [ ] CLI authenticated successfully

**Estimated scope**: 15 minutes

---

### Stage 4: ClawHub Skill Publication

**Purpose**: Publish skill to ClawHub registry

**Tasks**:

1. **Prepare skill directory**:
   ```bash
   # skill/ directory already exists with SKILL.md
   ls skill/SKILL.md
   ```

2. **Publish to ClawHub**:
   ```bash
   export CLAWHUB_REGISTRY=https://www.clawhub.ai
   source skill/.env

   clawhub --workdir . publish skill \
     --slug neon-soul \
     --name "NEON-SOUL" \
     --version 0.1.0 \
     --changelog "Initial release: AI identity synthesis with semantic compression"
   ```

3. **Verify publication**:
   - Visit https://www.clawhub.ai/skills/neon-soul
   - Check skill details and documentation

4. **Test installation** (users will run):
   ```bash
   # OpenClaw users
   clawhub install username/neon-soul

   # Claude Code / Gemini CLI / Cursor users
   git clone https://github.com/geeks-accelerator/neon-soul
   cp -r neon-soul/skill .claude/skills/neon-soul
   ```

**Acceptance Criteria**:
- [ ] Skill visible on ClawHub
- [ ] SKILL.md content rendered correctly
- [ ] Commands documented
- [ ] Homepage link works
- [ ] Installation command works

**Commit**: `chore(neon-soul): publish to ClawHub v0.1.0`

**Estimated scope**: 15 minutes

---

### Stage 5: Docker Image Publication (Optional)

**Purpose**: Publish Docker images for self-hosted deployments

**Files**: `docker/Dockerfile.neon-soul`

**Tasks**:

1. **Build image**:
   ```bash
   docker build -t neon-soul:0.1.0 -f docker/Dockerfile.neon-soul .
   docker tag neon-soul:0.1.0 neon-soul:latest
   ```

2. **Test image**:
   ```bash
   docker run --rm neon-soul:0.1.0 --help
   ```

3. **Push to Docker Hub** (or GitHub Container Registry):
   ```bash
   docker login
   docker tag neon-soul:0.1.0 yourusername/neon-soul:0.1.0
   docker tag neon-soul:0.1.0 yourusername/neon-soul:latest
   docker push yourusername/neon-soul:0.1.0
   docker push yourusername/neon-soul:latest
   ```

4. **Update docker-compose.yml**:
   ```yaml
   # Use published image instead of local build
   image: yourusername/neon-soul:0.1.0
   ```

**Acceptance Criteria**:
- [ ] Image builds successfully
- [ ] Image runs and executes commands
- [ ] Image published to registry
- [ ] docker-compose.yml updated

**Commit**: `chore(neon-soul): publish Docker image v0.1.0`

**Estimated scope**: 30 minutes

---

### Stage 6: Documentation Updates

**Purpose**: Update documentation for public users

**Files to modify**:
- `README.md` - Add installation instructions
- `skill/SKILL.md` - Verify all commands documented
- `docs/guides/getting-started.md` - Update if needed

**README.md additions**:

```markdown
## Installation

### Claude Code / Gemini CLI / Cursor

Clone the repo and copy skill into your agent's skills directory:

```bash
git clone https://github.com/geeks-accelerator/neon-soul
cp -r neon-soul/skill .claude/skills/neon-soul
```

The skill becomes available as `/neon-soul` commands.

### OpenClaw

```bash
clawhub install username/neon-soul
```

Skills install to `./skills/` and OpenClaw loads them automatically.

### Via npm (for programmatic use)

```bash
npm install neon-soul
```

### Any LLM Agent (Copy/Paste)

Open `skill/SKILL.md` on GitHub, copy contents, paste into your agent's chat.

## Quick Start

```bash
# Check status
/neon-soul status

# Preview synthesis (safe, no writes)
/neon-soul synthesize --dry-run

# Run synthesis
/neon-soul synthesize --force
```
```

**Acceptance Criteria**:
- [ ] README has installation instructions
- [ ] All three installation methods documented
- [ ] Quick start guide included
- [ ] Links to ClawHub and npm

**Commit**: `docs(neon-soul): add installation instructions`

**Estimated scope**: 30 minutes

---

### Stage 7: End-to-End Verification

**Purpose**: Verify the full deployment works

**Tasks**:

1. **Test npm installation**:
   ```bash
   mkdir /tmp/test-neon-soul
   cd /tmp/test-neon-soul
   npm init -y
   npm install neon-soul
   node -e "const {skill} = require('neon-soul/skill'); console.log(skill.name)"
   ```

2. **Test in OpenClaw** (if available):
   ```bash
   # Start OpenClaw
   docker compose up -d

   # Install skill
   openclaw skill install neon-soul

   # Run commands
   /neon-soul status
   /neon-soul synthesize --dry-run
   ```

3. **Test Docker image**:
   ```bash
   docker run --rm yourusername/neon-soul:latest status
   ```

**Acceptance Criteria**:
- [ ] npm package installs and imports correctly
- [ ] OpenClaw can install and run skill
- [ ] Docker image executes commands
- [ ] All five commands work (synthesize, status, rollback, audit, trace)

**Estimated scope**: 30 minutes

---

## Verification

```bash
# 1. Verify npm publication
npm view neon-soul

# 2. Verify ClawHub listing
curl -s https://www.clawhub.ai/api/skills/neon-soul | jq .name

# 3. Verify Docker image (if published)
docker pull yourusername/neon-soul:latest

# 4. Test installation in clean environment
npx neon-soul --version

# 5. Check website link
curl -I https://liveneon.ai
```

---

## Rollback Plan

If issues are discovered after publication:

1. **npm**: `npm unpublish neon-soul@0.1.0` (within 72 hours)
2. **ClawHub**: Contact ClawHub support or publish new version
3. **Docker**: Remove tags from registry

For minor issues, prefer publishing a patch version (0.1.1) over unpublishing.

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| npm name taken | Verify availability before attempting (`npm view neon-soul`) |
| ClawHub rejection | Review SKILL.md format against examples |
| LLM dependency confusion | Document that OpenClaw LLM context is required |
| Version conflicts | Use semantic versioning, test before release |
| Security exposure | Review for secrets before publish |

---

## Post-Deployment Tasks

After successful deployment:

1. **Announce**: Post on relevant channels (OpenClaw community, etc.)
2. **Monitor**: Watch for issues, feedback
3. **Iterate**: Plan v0.2.0 with improvements
4. **Update issue**: Mark `docs/issues/2026-02-10-axiom-count-exceeds-cognitive-limit.md` if meta-axiom synthesis is included

---

## Dependencies

**Required**:
- npm account with publish access
- ClawHub account and token

**Optional**:
- Docker Hub account (for image publication)

**Code dependencies**:
- All existing neon-soul code (already complete)
- Build system (`npm run build`)

---

## Estimated Scope

| Stage | Complexity | Time |
|-------|------------|------|
| 1: Pre-publication checklist | Low | 30 min |
| 2: npm publication | Low | 15 min |
| 3: ClawHub token setup | Low | 15 min |
| 4: ClawHub publication | Low | 15 min |
| 5: Docker images (optional) | Medium | 30 min |
| 6: Documentation | Low | 30 min |
| 7: Verification | Medium | 30 min |

**Total**: ~2.5 hours (without Docker), ~3 hours (with Docker)

---

## Cross-References

**Related Plans**:
- `docs/plans/2026-02-07-phase4-openclaw-integration.md` - Skill integration (complete)
- `docs/plans/2026-02-10-pbd-alignment.md` - PBD methodology (prerequisite for full features)
- `docs/plans/2026-02-10-meta-axiom-synthesis.md` - Cognitive load reduction (future)

**Related Files**:
- `skill/SKILL.md` - Skill manifest
- `src/skill-entry.ts` - Skill entry point
- `docker/docker-compose.yml` - Docker configuration
- `package.json` - npm package configuration

**External References**:
- Agent Skills Standard: https://agentskills.io
- ClawHub: https://www.clawhub.ai
- npm: https://www.npmjs.com
- OpenClaw Docs: https://docs.openclaw.ai

**Working Examples**:
- `projects/essence-router/docs/plans/clawhub-skill-publication.md` - API-based skill
- `projects/obviously-not/patent-skills/README.md` - Pure SKILL.md skills

---

## Approval

- [ ] Plan reviewed
- [ ] npm account ready
- [ ] ClawHub account ready
- [ ] Ready to implement
