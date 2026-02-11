# ClawHub Deployment Review - Codex

**Date**: 2026-02-10
**Reviewer**: codex-gpt51-examiner (gpt-5.1-codex-max)
**Files Reviewed**:
- `docs/plans/2026-02-10-clawhub-deployment.md` (primary)
- `skill/SKILL.md`
- `skill/README.md`
- `skill/.env.example`
- `package.json`
- `src/skill-entry.ts`
- `docker/docker-compose.yml`
- `docker/Dockerfile.neon-soul`
- `docs/plans/2026-02-07-phase4-openclaw-integration.md` (cross-reference)
- `README.md`

## Summary

The deployment plan is well-structured with clear stages but contains critical infrastructure mismatches that will cause build and verification failures. The Dockerfile uses Node 20 while package.json requires Node 22+, and Stage 7 verification assumes CLI capabilities that don't exist in the package. LLM provider strategy in the plan contradicts implementation behavior.

## Findings

### Critical

- **C-1**: `docker/Dockerfile.neon-soul:13` - Uses `node:20-slim` but `package.json:52` requires `engines.node >= 22.0.0`. This mismatch will cause runtime incompatibility and may trigger unexpected behavior.

- **C-2**: `docker/Dockerfile.neon-soul:22-31` - Runs `npm ci --only=production` before `npm run build`, but TypeScript is a devDependency. Build will fail because `tsc` won't be available. Stage 5 Docker steps will fail.

### Important

- **I-1**: `docs/plans/2026-02-10-clawhub-deployment.md:419` - Stage 7 verification calls `npx neon-soul --version` but `package.json:1-63` has no `bin` field. This check will fail with "command not found". Either add a bin entry or change the verification step.

- **I-2**: `docs/plans/2026-02-10-clawhub-deployment.md:393` - Docker verification expects `docker run ... status` to work, but `docker/Dockerfile.neon-soul:44-45` hardwires CMD to `dist/commands/synthesize.js`. The "status" argument won't be dispatched; it will run synthesize and fail without an LLM provider.

- **I-3**: `docs/plans/2026-02-10-clawhub-deployment.md:45-70` vs `src/skill-entry.ts:75-111` - LLM strategy mismatch. Plan recommends "Option A: OpenClaw LLM Only" but skill-entry.ts doesn't inject an LLM by default. The synthesize command (`src/commands/synthesize.ts:226-229`) requires LLM context and will throw `LLMRequiredError` if not provided. Plan should clarify whether standalone/Ollama is supported or enforce OpenClaw-only contract.

- **I-4**: Stage 5 is deferred yet Stage 7 still references Docker image verification (`docs/plans/2026-02-10-clawhub-deployment.md:393-400`). The plan has internal inconsistency - either remove Docker verification from Stage 7 or move it under "when Stage 5 is implemented" section.

### Minor

- **M-1**: `docker/docker-compose.yml:82` - Ollama uses `ollama/ollama:latest` while OpenClaw is pinned to `1.0.0` (line 33). Inconsistent pinning practice can break reproducible setups.

- **M-2**: `skill/README.md:24-27` and `docs/plans/2026-02-10-clawhub-deployment.md:247` - Uses placeholder `username/neon-soul` instead of actual ClawHub slug. Plan acceptance criteria (lines 288-355) requires npm installation coverage, but `skill/README.md:9-33` only lists clone/OpenClaw/copy-paste methods.

- **M-3**: `docs/plans/2026-02-10-clawhub-deployment.md:292` - References `docs/workflows/documentation-update.md` but context file notes "(not found in project - may be in parent multiverse)". Should verify this workflow exists or remove the reference.

## Alternative Framing: Are We Solving the Right Problem?

The plan addresses publication mechanics (npm, ClawHub, Docker) but does not address:

1. **User onboarding gap**: How do first-time users discover and understand NEON-SOUL? The plan focuses on making it available, not on making it understandable.

2. **LLM provider confusion**: The plan recommends OpenClaw-only but the codebase supports multiple LLM providers. This creates uncertainty for users about what's actually supported.

3. **Version 0.1.0 expectations**: Publishing as "0.1.0" implies beta-quality software. The plan doesn't set expectations about stability, breaking changes policy, or support level.

4. **Dependency on external services**: The plan assumes ClawHub and npm will accept the publication without issues, but doesn't discuss fallback if either service rejects (e.g., name collision, manifest validation failure).

## Recommendations

1. **Fix Dockerfile immediately**: Update to `node:22-slim` and ensure dev dependencies are available for build (multi-stage build recommended).

2. **Add bin entry or update verification**: Either add `"bin": { "neon-soul": "./dist/cli.js" }` to package.json with a CLI wrapper, or change Stage 7 to use `node -e "require('neon-soul/skill')"` instead.

3. **Clarify LLM strategy**: Either document that standalone use is not supported (Option A strict), or update the plan to include Ollama fallback as valid deployment option.

4. **Remove Docker verification from Stage 7**: Since Stage 5 is deferred, Docker verification should also be deferred to maintain plan consistency.

5. **Update placeholder slugs**: Replace `username/neon-soul` with actual ClawHub username before publication.

## Risk Summary

| Category | Count | Risk Level |
|----------|-------|------------|
| Critical | 2 | Build will fail |
| Important | 4 | Verification will fail |
| Minor | 3 | Documentation inconsistency |

**Overall Assessment**: Plan requires fixes before execution. Critical issues will cause immediate failure. Recommend addressing C-1, C-2, I-1, and I-4 before proceeding.

## Raw Output

<details>
<summary>Full CLI output (truncated for readability)</summary>

```
**Findings**
- critical: Docker image build is broken and out of spec - docker/Dockerfile.neon-soul uses node:20-slim (line 13) and installs only production deps before running npm run build (lines 22-31), but TypeScript is a devDependency and the project requires Node >=22 (package.json:52). Stage 5/7 Docker steps will fail and the image won't match the runtime requirement.
- important: Stage 7 verification calls npx neon-soul --version (docs/plans/2026-02-10-clawhub-deployment.md:418-420) but the package has no CLI/bin entry (package.json:1-63), so that check will fail; either add a bin or change the verification step.
- important: Docker verification expects docker run ... status (docs/plans/2026-02-10-clawhub-deployment.md:391-400), but the image CMD is hardwired to dist/commands/synthesize.js (docker/Dockerfile.neon-soul:44-45). The "status" arg won't be dispatched, so this test will run synthesize and fail without an LLM provider. Stage 5 is deferred, yet Stage 7 still requires this image.
- important: LLM strategy is misaligned - plan recommends OpenClaw LLM only (docs/plans/2026-02-10-clawhub-deployment.md:45-70), while the synthesize command auto-detects and prefers local Ollama (src/commands/synthesize.ts:160-205) and the skill loader doesn't inject an LLM by default (src/skill-entry.ts:75-111). The publication plan should clarify whether standalone/Ollama is supported or enforce the OpenClaw-only contract.
- minor: Ollama is pulled as ollama/ollama:latest (docker/docker-compose.yml:80-88) while OpenClaw is pinned; this can break repeatable setups and differs from the pinned-image practice noted elsewhere.
- minor: Installation docs are inconsistent with the plan's acceptance criteria - skill/README.md lists clone/OpenClaw/copy-paste only (skill/README.md:9-33) and uses the placeholder username/neon-soul (docs/plans/2026-02-10-clawhub-deployment.md:244-252) while the plan requires npm installation coverage and aligned commands (docs/plans/2026-02-10-clawhub-deployment.md:288-355).

OpenAI Codex v0.63.0 (research preview)
model: gpt-5.1-codex-max
sandbox: read-only
tokens used: 210,504
```

</details>

---

*Review generated by codex-gpt51-examiner agent*
