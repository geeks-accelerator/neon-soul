# Context: ClawHub Deployment

**Generated**: 2026-02-10 20:05:00
**Scout**: haiku
**Mode**: flexible
**Topic**: docs/plans/2026-02-10-clawhub-deployment.md

## Files (8 relevant)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| docs/plans/2026-02-10-clawhub-deployment.md | 447e8c2d9e2ff6c7 | 527 | Main deployment plan: npm publication, ClawHub skill publication, Docker (deferred) |
| skill/SKILL.md | f2a3e84a54dba17a | 267 | Skill manifest with 5 commands: synthesize, status, rollback, audit, trace |
| skill/README.md | 0907f1872d07e56c | 75 | Installation instructions for Claude Code, OpenClaw, and any LLM agent |
| skill/.env.example | 7168e939a64bbe75 | 3 | ClawHub token template for authentication |
| package.json | ebf6cf0775a69808 | 63 | npm package config: v0.1.0, exports ./skill entry, files includes dist+skill |
| src/skill-entry.ts | c71a29c287898310 | 188 | Skill loader entry point with 5 command dispatchers and LLM context forwarding |
| docker/docker-compose.yml | c40c3da481f958a8 | 110 | Docker configuration for OpenClaw, NEON-SOUL extraction, and Ollama |
| docs/plans/2026-02-07-phase4-openclaw-integration.md | bcfdb0c0f90993d5 | 408 | Cross-reference: prerequisite plan (Complete) for skill integration |

## Relationships

```
                   clawhub-deployment.md (this plan)
                         /       |        \
                        v        v         v
              package.json    skill/     docker/
                  |              |            |
                  v              v            v
           npm publish    ClawHub publish  Docker images
                               /   \
                              v     v
                        SKILL.md  README.md
                            |
                            v
                    src/skill-entry.ts
                         (commands)
```

**Dependencies**:
- `clawhub-deployment.md` references `phase4-openclaw-integration.md` as prerequisite (complete)
- `package.json` defines exports that `skill-entry.ts` provides
- `skill/SKILL.md` documents commands implemented in `src/skill-entry.ts`
- `skill/README.md` documents installation methods described in deployment plan
- `docker/docker-compose.yml` configures services for Stage 5 (deferred)

## Suggested Focus

- **Priority 1**: `docs/plans/2026-02-10-clawhub-deployment.md` - Main plan with 7 stages (5 active + 1 deferred + verification)
- **Priority 2**: `skill/SKILL.md`, `skill/README.md` - Skill manifest and installation docs (Stage 6 updates)
- **Priority 3**: `package.json`, `src/skill-entry.ts` - Package configuration and entry point (Stage 1-2 verification)
- **Priority 4**: `docker/docker-compose.yml` - Docker configuration (Stage 5, deferred)

## Exploration Notes

**Plan Structure**:
- 7 stages: Pre-publication (1), npm (2), ClawHub token (3), ClawHub publish (4), Docker (5-deferred), Docs (6), Verification (7)
- Stage 5 explicitly deferred to focus on ClawHub + npm for v0.1.0
- Stage 6 references `docs/workflows/documentation-update.md` (not found in project - may be in parent multiverse)
- Estimated total time: ~2.5 hours

**Prerequisites (per plan)**:
- All complete: skill-entry.ts, SKILL.md, .env.example, Docker config, package.json, 57+ tests, website
- Required before deployment: ClawHub account/token, npm account, LLM provider strategy decision

**Architecture Decision**:
- Recommends Option A: OpenClaw LLM Only (no external API keys needed)
- Documents that NEON-SOUL requires OpenClaw LLM context

**Cross-References**:
- `docs/plans/2026-02-07-phase4-openclaw-integration.md` (Complete) - prerequisite
- `docs/plans/2026-02-10-pbd-alignment.md` - related (not loaded)
- `docs/plans/2026-02-10-meta-axiom-synthesis.md` - future work
