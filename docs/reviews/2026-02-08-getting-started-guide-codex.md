# Getting Started Guide Review - Codex

**Date**: 2026-02-08
**Reviewer**: codex-gpt51-examiner
**Files Reviewed**: `/Users/twin2/Desktop/projects/multiverse/projects/neon-soul/docs/guides/getting-started-guide.md`

## Summary

The Getting Started guide contains several critical inaccuracies that would prevent users from successfully completing the setup. The documented commands, service names, ports, and scripts do not match the actual repository structure. The guide describes an aspirational workflow that is not yet fully implemented.

## Findings

### Critical

- **Line 262-296**: `npx tsx scripts/test-pipeline.ts [--dry-run]` is the wrong entry point. The script lacks a dry-run flag, requires an LLM provider (calling `extractFromTemplate` with `undefined`), and writes to `test-fixtures/souls/*`, not `~/.openclaw/...`. The described first synthesis/output paths will fail to appear.

- **Lines 300-337, 411-417**: `/neon-soul ...` commands only work inside the OpenClaw skill with an injected LLM. `src/commands/synthesize.ts` CLI mode exits as "not yet supported." The guide never explains how to load the skill, making these commands unreachable after Step 5.

- **Lines 88-105, 407-410, 431-434**: Service names/ports don't match this repo's `docker/docker-compose.yml`. The repo ships `openclaw` on 3000/8080, not `openclaw-gateway` on 18789. Log/URL/token instructions will point users at nonexistent services.

- **Line 62**: Quick setup calls `./docker-setup.sh`, which doesn't exist in this repo. The available automation is `scripts/setup-openclaw.sh` plus `docker/docker-compose.yml`, so the scripted install will fail immediately.

### Important

- **Lines 79-85**: Manual setup uses `docker build -f Dockerfile .` and `openclaw-cli onboard/openclaw-gateway`, but the shipped compose uses the prebuilt `openclaw/openclaw:1.0.0` image with no CLI/gateway services. Commands will error.

- **Line 104**: Token retrieval via `docker compose run --rm openclaw-cli dashboard --no-open` references a container not shipped in `docker/docker-compose.yml`.

- **Line 233**: Clone URL is still `your-org/neon-soul` placeholder. Should point to actual repo (current remote: `geeks-accelerator/multiverse`).

- **Lines 411-417**: Quick Reference suggests `/neon-soul synthesize --dry-run` as CLI command, but synthesize requires OpenClaw skill context and is explicitly disabled in standalone CLI mode.

- **Line 4**: "~15 minutes" is optimistic given Docker image pulls plus `npm install` (and `@xenova/transformers` download) are typically longer on first run.

- **Line 42**: Node.js 22+ may be stricter than needed for users who only run the Docker stack. Consider clarifying compatibility vs. hard requirement (package.json enforces >=22).

### Minor

- **Lines 9-30**: Architecture diagram omits the OpenClaw skill loader/LLM provider dependency, implying NEON-SOUL is a standalone npm package rather than an OpenClaw-bound skill.

- **Lines 143-223**: Memory file creation relies on lengthy heredocs with future-dated samples and no mention of the existing `scripts/setup-openclaw.sh` scaffold, increasing copy/paste error risk.

- **Lines 391-397**: "Configure channels" is listed as a next step without a pointer to how to do that in OpenClaw.

- **Lines 440-445**: External resource links weren't verified. Worth double-checking availability (OpenClaw docs, AIMLAPI blog, markaicode).

## Alternative Framing

The guide assumes NEON-SOUL requires OpenClaw, but this raises questions:

1. **Is OpenClaw actually required?** The pipeline could potentially work standalone with any LLM provider. The tight coupling may be premature.

2. **Aspirational vs. Actual**: The guide describes a polished workflow (skill commands, dry-run, status) that isn't fully implemented. Consider documenting what works today vs. planned features.

3. **Entry point confusion**: Users are directed to `scripts/test-pipeline.ts` which is a developer testing tool, not a user-facing entry point.

## Recommended Actions

1. Align setup instructions with `docker/README.md` + `scripts/setup-openclaw.sh`
2. Replace Step 5/Quick Reference with the actual skill-based synthesis flow
3. Update clone URLs and ports to match actual repository
4. Add section explaining skill installation/loading in OpenClaw
5. Consider splitting into "What works now" vs "Coming soon" sections

## Raw Output

<details>
<summary>Full CLI output</summary>

```
OpenAI Codex v0.63.0 (research preview)
--------
workdir: /Users/twin2/Desktop/projects/multiverse/projects/neon-soul
model: gpt-5.1-codex-max
provider: openai
approval: never
sandbox: read-only
reasoning effort: xhigh
reasoning summaries: auto
session id: 019c3fa9-63fd-7400-be85-f117fb618743
--------

**Critical**
- docs/guides/getting-started-guide.md:262-296 - `npx tsx scripts/test-pipeline.ts [--dry-run]` is the wrong entry point: it lacks a dry-run flag, currently requires an LLM provider (calling `extractFromTemplate` with `undefined`), and writes to `test-fixtures/souls/*`, not `~/.openclaw/...`, so the described first synthesis/output paths will fail to appear.
- docs/guides/getting-started-guide.md:300-337, 411-417 - `/neon-soul ...` commands only work inside the OpenClaw skill with an injected LLM; `src/commands/synthesize.ts` CLI mode exits as "not yet supported." The guide never explains how to load the skill, so these commands are unreachable after Step 5.
- docs/guides/getting-started-guide.md:88-105, 407-410, 431-434 - Service names/ports don't match this repo's `docker/docker-compose.yml` (we ship `openclaw` on 3000/8080, no `openclaw-gateway` on 18789). Log/URL/token instructions will point users at nonexistent services.
- docs/guides/getting-started-guide.md:62 - Quick setup calls `./docker-setup.sh`, which isn't in this repo; the available automation is `scripts/setup-openclaw.sh` plus `docker/docker-compose.yml`, so the scripted install will fail immediately.

**Important**
- docs/guides/getting-started-guide.md:79-85 - Manual setup uses `docker build -f Dockerfile .` and `openclaw-cli onboard/openclaw-gateway`, but the shipped compose uses the prebuilt `openclaw/openclaw:1.0.0` image and no CLI/gateway services; commands will error.
- docs/guides/getting-started-guide.md:104 - Token retrieval via `docker compose run --rm openclaw-cli dashboard --no-open` references a container we don't ship in `docker/docker-compose.yml`.
- docs/guides/getting-started-guide.md:233 - Clone URL is still `your-org/neon-soul`; should point to the real repo (current remote: `geeks-accelerator/multiverse`).
- docs/guides/getting-started-guide.md:411-417 - Quick Reference suggests `/neon-soul synthesize --dry-run` as a CLI command, but synthesize requires OpenClaw skill context and is explicitly disabled in standalone CLI mode.
- docs/guides/getting-started-guide.md:4 - "~15 minutes" is optimistic given Docker image pulls plus `npm install` (and `@xenova/transformers` download) are typically longer on first run.
- docs/guides/getting-started-guide.md:42 - Node.js 22+ may be stricter than needed for users who only run the Docker stack; consider clarifying compatibility vs. hard requirement (package.json enforces >=22).

**Minor**
- docs/guides/getting-started-guide.md:9-30 - Architecture diagram omits the OpenClaw skill loader/LLM provider dependency, implying NEON-SOUL is a standalone npm package rather than an OpenClaw-bound skill.
- docs/guides/getting-started-guide.md:143-223 - Memory file creation relies on lengthy heredocs with future-dated samples and no mention of the existing `scripts/setup-openclaw.sh` scaffold, increasing copy/paste error risk.
- docs/guides/getting-started-guide.md:391-397 - "Configure channels" is listed as a next step without a pointer to how to do that in OpenClaw.
- docs/guides/getting-started-guide.md:440-445 - External resource links weren't verified in this environment; worth double-checking availability.

Next steps: align setup instructions with `docker/README.md` + `scripts/setup-openclaw.sh`, replace Step 5/Quick Reference with the actual skill-based synthesis flow, and update clone URLs/ports so new users can complete the path end-to-end.

tokens used: 199,386
```

</details>
