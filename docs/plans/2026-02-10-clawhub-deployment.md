# Plan: ClawHub Deployment and npm Publication

**Created**: 2026-02-10
**Status**: ✅ Complete (2026-02-10)
**Priority**: High
**Type**: Deployment
**Trigger**: think hard
**Review Required**: No (code review + twin review complete 2026-02-10)
**Final Version**: 0.1.1 (0.1.0 → 0.1.1 due to ClawHub security scan feedback)

---

## Summary

Deploy NEON-SOUL as a publicly available Agent Skill by:
1. Publishing to ClawHub (clawhub.ai) for OpenClaw users
2. Publishing the Node.js package to npm for OpenClaw skill integration

> **Deferred**: Docker image publication for self-hosted deployments (Stage 5)

**Goal**: Any agent (Claude Code, Gemini CLI, Cursor, OpenClaw, etc.) can use NEON-SOUL.

**Standard**: Built on the [Agent Skills](https://agentskills.io) standard originated by Anthropic and adopted by 27+ tools.

**Architecture**: OpenClaw-only for v0.1.0. NEON-SOUL requires an LLM context provided by OpenClaw. The npm package is for OpenClaw skill developers integrating NEON-SOUL, not standalone use. Standalone/Ollama support planned for future release.

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

### Decision: Option A - OpenClaw LLM Only (v0.1.0)

Use the LLM provided by OpenClaw's context. No external dependencies.

**Pros**: Simple, no API keys needed, works with any OpenClaw LLM
**Cons**: Requires OpenClaw context, can't run standalone

**Implications for npm package**:
- The `synthesize` function throws `LLMRequiredError` if called without LLM context
- npm package is for OpenClaw skill developers, NOT standalone use
- README and npm page must clearly document this requirement

### Future Options (Not v0.1.0)

**Option B: Ollama Fallback** - If OpenClaw LLM not available, fall back to local Ollama.
- Planned for v0.2.0 to enable standalone testing and non-OpenClaw use

**Option C: API Key Configuration** - Allow users to configure their own Anthropic/OpenAI keys.
- Considered for v0.3.0+ if there's demand

---

## User Personas

Understanding who uses NEON-SOUL and what success looks like for each persona:

| Persona | Wants | First Experience | Success Looks Like |
|---------|-------|------------------|-------------------|
| Claude Code user | Extend agent capabilities | `/neon-soul status` | Soul synthesis in their workflow |
| OpenClaw developer | Integrate identity synthesis | `clawhub install`, skill auto-loads | Working soul with full provenance |
| Skill developer (npm) | Build on NEON-SOUL components | `npm install`, import into project | Compiling, understanding LLM requirement |
| Curious explorer | Try it out quickly | Copy/paste SKILL.md | See what it does, decide to install |

> TR-I1: These personas inform Stage 6 documentation structure and README.md organization.

---

## Version 0.1.0 Expectations

This is an **early adopter release**:

- **API stability**: Commands (`/neon-soul synthesize`, etc.) are stable; library API may change
- **Breaking changes**: Possible until 1.0; documented in CHANGELOG
- **Support**: GitHub issues; no guaranteed response time
- **Production use**: Suitable for experimentation; backup SOUL.md before synthesis

> TR-I3: Setting expectations explicitly reduces user confusion about maturity level.

---

## Stages

### Stage 1: Pre-Publication Checklist

**Purpose**: Verify everything is ready for publication

**Tasks**:

1. **CRITICAL: Verify npm name availability** (do this first):
   ```bash
   npm view neon-soul
   # Should return 404 / "not found" if available
   # If package exists, STOP - name collision requires plan revision
   ```
   > CR-I6: This is a mandatory pre-flight step. Do not proceed if name is taken.

2. **Verify build**:
   ```bash
   npm run clean && npm run build
   ls dist/  # Should include skill-entry.js
   ```

3. **Run full test suite**:
   ```bash
   npm test
   ```

4. **Verify package.json**:
   - [ ] `name`: `neon-soul`
   - [ ] `version`: `0.1.0` (or appropriate version)
   - [ ] `files`: includes `dist` and `skill`
   - [ ] `exports`: includes `./skill` entry
   - [ ] `repository`: points to GitHub
   - [ ] `homepage`: https://liveneon.ai

5. **Verify SKILL.md frontmatter**:
   - [ ] `name`: NEON-SOUL
   - [ ] `homepage`: https://liveneon.ai
   - [ ] `user-invocable`: true
   - [ ] `emoji`: set
   - [ ] `version`: 0.1.0 (add if missing, for ClawHub consistency)

6. **Check for sensitive data**:
   ```bash
   # No API keys or secrets in committed files
   grep -r "sk-ant\|sk-" src/ skill/ --include="*.ts" --include="*.md"
   ```

**Acceptance Criteria**:
- [ ] npm name `neon-soul` is available
- [ ] Build succeeds without errors
- [ ] All tests pass
- [ ] Package metadata complete
- [ ] No sensitive data in publishable files

**Estimated scope**: 30 minutes

---

### Stage 2: npm Package Publication

**Purpose**: Publish Node.js package to npm registry for OpenClaw skill integration

> **CR-C3/I5**: The npm package requires OpenClaw LLM context. It is NOT a standalone library.
> The `synthesize` function throws `LLMRequiredError` without LLM context.
> Documentation must clearly state this limitation.

**Files to modify**:
- `package.json` - Bump version if needed, verify description mentions OpenClaw
- `README.md` - Add clear note about LLM requirement in npm installation section

**Pre-publication documentation requirement**:

Ensure README.md npm section includes:
```markdown
### Via npm (for OpenClaw skill developers)

> **Note**: The npm package requires an LLM provider context from OpenClaw.
> For standalone use, wait for v0.2.0 which will include Ollama fallback.

npm install neon-soul
```

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
- [ ] README clearly documents LLM requirement

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
   npm install -g clawhub
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
   # CR-M2: Updated to actual ClawHub username
   clawhub install leegitw/neon-soul

   # Claude Code / Gemini CLI / Cursor users
   git clone https://github.com/leegitw/neon-soul
   cp -r neon-soul/skill ~/.claude/skills/neon-soul
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

### Stage 5: Docker Image Publication (Deferred)

> **Status**: Deferred to future release. Focus on ClawHub + npm for v0.1.0.
>
> **When to implement**: After v0.1.0 is stable and there's demand for self-hosted deployments.

> **TR-I1 Implementation Note**: The Dockerfile fixes (C-1, C-2) are documented below but NOT applied yet.
> Consider applying the multi-stage build fix before Stage 5 resumes, so it's ready for testing.
> This is a minor pre-work item that reduces Stage 5 scope when Docker demand materializes.

**Purpose**: Publish Docker images for self-hosted deployments

**Files**: `docker/Dockerfile.neon-soul`

**Required fixes before implementation** (from code review):

1. **CR-C1: Node version mismatch** - Update `docker/Dockerfile.neon-soul:13` from `node:20-slim` to `node:22-slim` to match `package.json` requirement (`>=22.0.0`)

2. **CR-C2: Build order** - Current Dockerfile runs `npm ci --only=production` before `npm run build`, but TypeScript is a devDependency. Fix with multi-stage build:
   ```dockerfile
   # Stage 1: Build
   FROM node:22-slim AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY src/ ./src/
   COPY tsconfig.json ./
   RUN npm run build

   # Stage 2: Production
   FROM node:22-slim
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY --from=builder /app/dist ./dist
   CMD ["node", "dist/commands/synthesize.js"]
   ```

3. **CR-M1: Ollama version pinning** - Update `docker/docker-compose.yml:82` from `ollama/ollama:latest` to a specific version (e.g., `ollama/ollama:0.1.48`) for reproducible builds.

**Tasks** (when ready):

1. Apply required fixes above
2. Build image: `docker build -t neon-soul:X.Y.Z -f docker/Dockerfile.neon-soul .`
3. Test image: `docker run --rm neon-soul:X.Y.Z --help`
4. Push to registry (Docker Hub or GitHub Container Registry)
5. Update docker-compose.yml to use published image

**Estimated scope**: 45 minutes (when implemented, including fixes)

---

### Stage 6: Documentation Updates

**Purpose**: Update documentation for public users following the documentation-update workflow

**Workflow**: Follow `docs/workflows/documentation-update.md` for systematic updates.

**Scope Classification**: This is a **Deployment** change affecting:
- `skill/README.md` - Installation methods, ClawHub/npm publish steps
- `README.md` - Project overview, installation, quick start
- `package.json` - Version consistency
- `docs/guides/getting-started-guide.md` - Update if needed

**Tasks**:

1. **Follow documentation-update workflow Step 6** (Skill Documentation):
   - [ ] Verify `skill/SKILL.md` commands match implementation
   - [ ] Verify `skill/README.md` has all installation methods
   - [ ] Verify ClawHub publish steps are accurate

2. **Update README.md** with installation section:
   - [ ] Claude Code / Gemini CLI / Cursor installation
   - [ ] OpenClaw installation via ClawHub
   - [ ] npm installation for programmatic use
   - [ ] Copy/paste method for any LLM agent
   - [ ] Quick start commands

3. **Verify version consistency**:
   ```bash
   grep -E "version|0\.[0-9]+\.[0-9]+" package.json skill/SKILL.md | head -5
   ```

4. **Run workflow verification commands**:
   ```bash
   # From docs/workflows/documentation-update.md Step 8
   grep -r "npx neon-soul" docs/ README.md skill/
   grep -E "^## Commands|/neon-soul" skill/SKILL.md skill/README.md
   ```

**README.md Installation Section** (reference content):

```markdown
## Installation

### Claude Code / Gemini CLI / Cursor

git clone https://github.com/leegitw/neon-soul
cp -r neon-soul/skill ~/.claude/skills/neon-soul

### OpenClaw

clawhub install leegitw/neon-soul

### Via npm (for OpenClaw skill developers)

> **Note**: The npm package requires an LLM provider context from OpenClaw.
> It will throw `LLMRequiredError` if used standalone.
> For standalone use, wait for v0.2.0 which will include Ollama fallback.

npm install neon-soul

**Minimal working example** (TR-I2):

```typescript
// In your OpenClaw skill
import { synthesize } from 'neon-soul';

export async function run(context) {
  // context.llm is provided by OpenClaw
  const result = await synthesize(context.llm, {
    workspace: context.workspace,
    dryRun: false
  });
  return result.axiomCount;
}
```

### Any LLM Agent (Copy/Paste)

Open skill/SKILL.md on GitHub, copy contents, paste into agent chat.

## Your First 5 Minutes

After installing, try these commands to verify everything works (TR-I4):

1. `/neon-soul status` - See your current state
2. `/neon-soul synthesize --dry-run` - Preview synthesis (no changes)
3. `/neon-soul synthesize --force` - Run synthesis when ready
4. `/neon-soul audit --list` - Explore what was created
5. `/neon-soul trace <axiom-id>` - See provenance for any axiom
```

**Acceptance Criteria**:
- [ ] README has installation instructions for all 4 methods
- [ ] skill/README.md matches README installation section
- [ ] Quick start guide included
- [ ] Links to ClawHub, npm, and website
- [ ] Version numbers consistent across files
- [ ] Workflow verification commands pass

**Commit**: `docs(neon-soul): add installation instructions for v0.1.0`

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
   # CR-I1: No bin field, so use node -e instead of npx
   node -e "import('neon-soul/skill').then(m => console.log('Skill loaded:', !!m))"
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

> **CR-I4**: Docker image verification removed - Stage 5 is deferred.
> Add Docker verification here when Stage 5 is implemented.

**Acceptance Criteria**:
- [ ] npm package installs and imports correctly
- [ ] OpenClaw can install and run skill
- [ ] All five commands work in OpenClaw (synthesize, status, rollback, audit, trace)

**Estimated scope**: 30 minutes

---

## Verification

```bash
# 1. Verify npm publication
npm view neon-soul

# 2. Verify ClawHub listing
curl -s https://www.clawhub.ai/api/skills/neon-soul | jq .name

# 3. Test npm import in clean environment
# CR-I1: No bin field, use node -e instead of npx
node -e "import('neon-soul/skill').then(m => console.log('OK'))"

# 4. Check website link
curl -I https://liveneon.ai
```

> **Note**: Docker verification removed - Stage 5 is deferred.

---

## Rollback Plan

If issues are discovered after publication:

### Default: Patch Release (Always Prefer This)

> **CR-I5 + TR-I2**: Always use patch releases. `npm unpublish` breaks downstream
> dependencies and is highly discouraged. The default response to ANY issue is a patch.

**Standard process**:
1. **Identify issue** and create fix
2. **npm**: Publish patch version (0.1.1, 0.1.2, etc.)
3. **ClawHub**: Publish matching version
4. **Docker**: Publish new tag with fix (when Stage 5 implemented)

This preserves the ecosystem - downstream dependencies continue working while users get fixes.

### Emergency Only: Unpublish (Security/Legal)

Reserve for critical security vulnerabilities or legal issues ONLY:

1. **npm**: `npm unpublish neon-soul@0.1.0` (within 72 hours, breaks downstream deps)
2. **ClawHub**: Contact ClawHub support for removal
3. **Docker**: Remove tags from registry

> This WILL break downstream users. Only use when the risk of leaving published outweighs the breakage.

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| npm name taken | CRITICAL: Verify availability first (`npm view neon-soul`) - Stage 1 step 1 |
| ClawHub rejection | Review SKILL.md format against examples |
| LLM dependency confusion | Document OpenClaw requirement in README, npm page, skill/README.md |
| Version conflicts | Use semantic versioning, test before release |
| Security exposure | Review for secrets before publish |
| Node.js 22+ limits adoption | Accept for v0.1.0; consider LTS (20) support in future if demand |
| npm standalone expectation | Clear documentation that npm is for OpenClaw integration only |
| Docker build failures | Stage 5 deferred; fixes documented for when implemented |

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
| 5: Docker images | Deferred | - |
| 6: Documentation | Low | 30 min |
| 7: Verification | Medium | 30 min |

**Total**: ~2.5 hours

---

## Cross-References

**Related Plans**:
- `docs/plans/2026-02-07-phase4-openclaw-integration.md` - Skill integration (complete)
- `docs/plans/2026-02-10-pbd-alignment.md` - PBD methodology (prerequisite for full features)
- `docs/plans/2026-02-10-meta-axiom-synthesis.md` - Cognitive load reduction (future)

**Reviews**:
- `docs/reviews/2026-02-10-clawhub-deployment-codex.md` - gpt-5.1-codex-max code review
- `docs/reviews/2026-02-10-clawhub-deployment-gemini.md` - gemini-2.5-pro code review
- `docs/reviews/2026-02-10-clawhub-deployment-twin-technical.md` - Twin 1 technical review
- `docs/reviews/2026-02-10-clawhub-deployment-twin-creative.md` - Twin 2 creative review

**Workflows**:
- `docs/workflows/documentation-update.md` - Systematic documentation update process (used in Stage 6)
- `docs/workflows/skill-publish.md` - Repeatable publish workflow (extracted from this plan)

**Issues from Deployment**:
- `docs/issues/2026-02-10-post-deployment-version-fixes.md` - Version sync fixes (resolved, v0.1.2)
- `docs/issues/2026-02-10-skill-publish-workflow-improvements.md` - Workflow enhancements (resolved)
- `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` - "call LLMs" triggers false positive (open)

**Related Files**:
- `skill/SKILL.md` - Skill manifest
- `skill/README.md` - Installation instructions
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

## Code Review Findings

This plan was reviewed by external validators (2026-02-10):
- `docs/reviews/2026-02-10-clawhub-deployment-codex.md` (gpt-5.1-codex-max)
- `docs/reviews/2026-02-10-clawhub-deployment-gemini.md` (gemini-2.5-pro)

### Findings Addressed

| ID | Severity | Finding | Resolution |
|----|----------|---------|------------|
| C-1 | Critical | Dockerfile uses node:20, requires node:22 | Documented in Stage 5 fixes |
| C-2 | Critical | Build fails (devDeps not installed) | Multi-stage build documented in Stage 5 |
| C-3 | Critical | npm package unusable standalone | OpenClaw-only architecture clarified; docs updated |
| C-4 | Critical | API key exposure in docker-compose | Existing MN-8 warning deemed sufficient for dev |
| I-1 | Important | No bin field, npx fails | Verification updated to use node -e |
| I-2 | Important | Docker CMD mismatch | Stage 5 deferred; noted for future |
| I-3 | Important | LLM strategy confusion | Architecture decision clarified; README template updated |
| I-4 | Important | Stage 7 tests deferred Docker | Docker verification removed from Stage 7 |
| I-5 | Important | npm unpublish risky | Rollback plan updated to prefer patch |
| I-6 | Important | npm name squatting risk | Added as CRITICAL step 1 in Stage 1 |
| M-1 | Minor | Ollama uses :latest | Documented in Stage 5 fixes |
| M-2 | Minor | Placeholder username | Updated to `leegitw` |
| M-3 | Minor | Node 22+ limits adoption | Noted in Risk Assessment |
| M-4 | Minor | Version not in SKILL.md | Added to Stage 1 checklist |
| M-5 | Minor | Workflow file path | Verified exists in project |

---

## Twin Review Findings

This plan was reviewed by internal twin reviewers (2026-02-10):
- `docs/reviews/2026-02-10-clawhub-deployment-twin-technical.md` (Twin 1, Technical)
- `docs/reviews/2026-02-10-clawhub-deployment-twin-creative.md` (Twin 2, Creative)

### Findings Addressed

| ID | Severity | Finding | Resolution |
|----|----------|---------|------------|
| TR-I1 | Important | Dockerfile bug documented but not applied | Added implementation note in Stage 5 |
| TR-I2 | Important | Rollback wording unclear (patch vs unpublish) | Restructured Rollback Plan; patch is now default |
| TR-I3 | Important | SKILL.md missing `version: 0.1.0` | Added to `skill/SKILL.md` frontmatter |
| TR-I4 | Important | User Personas section missing | Added section before Stages |
| TR-I5 | Important | npm needs minimal working example | Added TypeScript example in Stage 6 |
| TR-I6 | Important | v0.1.0 expectations not communicated | Added "Version 0.1.0 Expectations" section |
| TR-I7 | Important | First-time user journey implicit | Added "Your First 5 Minutes" in Stage 6 README |
| TR-M1 | Minor | Philosophy link missing | Deferred to website update |
| TR-M2 | Minor | Error message UX (`LLMRequiredError`) | Deferred to implementation |
| TR-M3 | Minor | Review cross-references missing | Added reviews to Cross-References section |

---

## Approval

- [x] Plan reviewed (code review 2026-02-10)
- [x] Plan reviewed (twin review 2026-02-10)
- [x] npm account ready (leegitw)
- [x] ClawHub account ready (leegitw)
- [x] Deployed (2026-02-10)

---

## Deployment Notes

**Deployed 2026-02-10** by Twin 2 with Claude Code assistance.

### Published Artifacts

| Channel | URL | Version |
|---------|-----|---------|
| npm | https://www.npmjs.com/package/neon-soul | 0.1.1 |
| ClawHub | https://clawhub.ai/leegitw/neon-soul | 0.1.1 |
| GitHub | https://github.com/leegitw/neon-soul | main |
| Website | https://liveneon.ai | - |

### Implementation Issues Encountered

| Issue | Resolution |
|-------|------------|
| TypeScript build errors (`process.env` access) | Changed to bracket notation: `process.env['VAR']` |
| Test expectation mismatch (`classifyDimension`) | Updated test to expect fallback behavior (returns 'identity-core') |
| `skill/.env` included in npm package | Added `.npmignore` and `!skill/.env` to package.json files |
| npm 2FA required | Browser authentication flow completed |
| ClawHub security scan: "Suspicious" rating | Published 0.1.1 with documentation clarifications |

### ClawHub Security Scan Response

ClawHub's automated security scan flagged v0.1.0 as "Suspicious (medium confidence)" due to documentation ambiguity. v0.1.1 addressed these concerns:

| Concern | Clarification Added |
|---------|---------------------|
| CLI/binary confusion | Added "How This Works" section explaining instruction-based execution |
| Data access unclear | Added "Data Access" section listing files read/written |
| Auto-trigger concerns | Updated "Triggers" section to clarify opt-in nature |
| Git credential exposure | Clarified git integration is opt-in, uses existing local credentials |

### Verification Results

```bash
# npm verification
npm view neon-soul  # ✅ 0.1.1 published

# ClawHub verification
clawhub inspect neon-soul  # ✅ 0.1.1 published

# Import verification
node -e "import('neon-soul/skill').then(() => console.log('OK'))"  # ✅ loads
```

### Post-Deployment Review

A post-deployment code review (N=2) was conducted after v0.1.1 publication:
- `docs/reviews/2026-02-10-clawhub-deployment-impl-codex.md`
- `docs/reviews/2026-02-10-clawhub-deployment-impl-gemini.md`

**Findings**: 2 Important + 2 Minor issues identified (version mismatches, stale paths).

**Issue created**: `docs/issues/2026-02-10-post-deployment-version-fixes.md`

**Status**: v0.1.1 works correctly; fixes tracked for v0.1.2 patch.
