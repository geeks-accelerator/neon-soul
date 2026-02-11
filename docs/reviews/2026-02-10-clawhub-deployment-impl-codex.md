# ClawHub Deployment Implementation Review - Codex

**Date**: 2026-02-10
**Reviewer**: codex-gpt51-examiner (gpt-5.1-codex-max)
**Review Type**: Post-deployment implementation review
**Files Reviewed**:
- `docs/plans/2026-02-10-clawhub-deployment.md` (deployment plan, COMPLETE)
- `package.json` (npm package config, v0.1.1)
- `.npmignore` (package exclusions)
- `skill/SKILL.md` (skill manifest, v0.1.1)
- `skill/README.md` (installation docs)
- `README.md` (project overview)
- `src/skill-entry.ts` (skill entry point)
- `src/commands/synthesize.ts` (synthesize command)
- `docker/Dockerfile.neon-soul` (deferred Stage 5)
- `dist/skill-entry.js` (built artifact)

## Summary

The deployment was executed successfully with npm v0.1.1 and ClawHub v0.1.1 published. Prior reviews (4 reviewers) addressed major issues before deployment. However, post-deployment analysis reveals version inconsistencies between source code metadata and released artifacts, along with documentation path errors. No critical issues found; the deployment is functional but has cleanup items.

## Findings

### Critical

None identified. The deployment was executed correctly and packages are functional.

### Important

- **I-1**: `src/skill-entry.ts:49` - Skill metadata reports `version: '0.1.0'` while `package.json:3` and `skill/SKILL.md:3` correctly show `0.1.1`. The built artifact `dist/skill-entry.js:20` also shows `0.1.0`. This causes runtime version reporting to mismatch the published package version.

  ```typescript
  // src/skill-entry.ts:47-50
  export const skill = {
    name: 'neon-soul',
    version: '0.1.0',  // Should be '0.1.1'
  ```

  **Impact**: ClawHub loaders or version-checking tools may report incorrect version. User confusion when comparing `skill.version` to npm package version.

  **Recommendation**: Update `src/skill-entry.ts:49` to `'0.1.1'` and rebuild.

- **I-2**: `skill/README.md:77` - ClawHub publish instructions still reference `--version 0.1.0`:

  ```bash
  clawhub publish skill \
    --slug neon-soul \
    --name "NEON-SOUL" \
    --version 0.1.0  # Should be 0.1.1
  ```

  **Impact**: Following these instructions would attempt to publish an older version, causing confusion or errors.

  **Recommendation**: Update to `--version 0.1.1`.

### Minor

- **M-1**: `README.md:266` and `README.md:291` - Development setup instructions reference incorrect path:

  ```bash
  cd research/neon-soul
  ```

  The repository root is `neon-soul`, not `research/neon-soul`. This path was likely copied from the monorepo context where the project lives under `research/`.

  **Impact**: New developers following README instructions will get "directory not found" errors.

  **Recommendation**: Update to `cd neon-soul` or simply remove the cd instruction since users likely cloned the repo directly.

- **M-2**: `docker/Dockerfile.neon-soul:13` - Still uses `node:20-slim` while `package.json:52` requires `node >= 22.0.0`. Lines 22-23 run `npm ci --only=production` before build, but TypeScript is a devDependency.

  **Impact**: Stage 5 (Docker) is deferred as documented, so this is not blocking. However, if anyone attempts to build the Docker image now, it will fail.

  **Recommendation**: Acceptable as-is since Stage 5 is explicitly deferred. Fixes are documented in plan lines 340-360.

- **M-3**: `package-lock.json:4` reports `version: '0.1.0'` - stale from pre-bump. Not included in npm package (excluded by .npmignore implicitly), so no user impact.

## Architecture Notes

### LLM Provider Strategy: Documentation vs Implementation

The documentation states NEON-SOUL is "OpenClaw-only" for v0.1.0, requiring LLM context from OpenClaw. However, `src/commands/synthesize.ts:180-188` still includes Ollama auto-detection for CLI use:

```typescript
// src/commands/synthesize.ts:180-188
// Try Ollama first (local, no API key needed)
if (await OllamaLLMProvider.isAvailable()) {
  if (options.verbose) {
    console.log('Using Ollama LLM provider (local)');
  }
  const llm = new OllamaLLMProvider();
  await runSynthesisWithLLM(options, llm);
  return;
}
```

**Question**: Is standalone Ollama support intentionally maintained as an undocumented escape hatch, or should this be removed to match the "OpenClaw-only" documentation?

**Observation**: This is actually a positive feature - it allows local development and testing without OpenClaw. The documentation correctly notes that the npm package exports require LLM context (via `synthesize()` function), while the CLI command has this fallback. This is a reasonable architecture.

### Approach Assessment

**Is the overall approach correct? Are we solving the right problem?**

Yes. The deployment approach is sound:

1. **Distribution channels are appropriate**: npm for developers, ClawHub for OpenClaw users, copy/paste for quick trials
2. **LLM requirement is clearly documented**: README lines 234-236 explicitly state the OpenClaw requirement
3. **Safety measures in place**: `.npmignore` correctly excludes `.env`, tests, and development files
4. **Version bump response**: The v0.1.0 to v0.1.1 bump due to ClawHub security scan feedback shows appropriate responsiveness
5. **Deferred scope is documented**: Stage 5 (Docker) deferral is clearly marked with fixes documented for future implementation

The only oversight is incomplete version propagation after the 0.1.1 bump.

## Positive Observations

1. **`.npmignore`** (lines 1-20) correctly excludes:
   - `skill/.env` and `**/.env` (sensitive files)
   - `tests/`, `*.test.ts`, `*.spec.ts` (development files)
   - `docker/`, `docs/`, `scripts/` (not needed in package)

2. **`package.json` files array** (lines 54-59) with negation patterns:
   ```json
   "files": [
     "dist",
     "skill",
     "!skill/.env",
     "!**/.env"
   ]
   ```
   Belt-and-suspenders approach ensures .env exclusion.

3. **LLM requirement documentation** in `README.md:234-236` and `skill/README.md:32-34` is clear and accurate.

4. **SKILL.md** (lines 21-34) includes "How This Works" section explaining instruction-based execution, addressing ClawHub security scan concerns.

5. **Version consistency** between `package.json:3` and `skill/SKILL.md:3` - both correctly show `0.1.1`.

## Summary Table

| Category | Count | Severity |
|----------|-------|----------|
| Critical | 0 | - |
| Important | 2 | Version mismatch in code and docs |
| Minor | 3 | Path errors and deferred Docker fixes |

**Overall Assessment**: Deployment successful. Post-deployment cleanup needed for version consistency and documentation paths. No blocking issues for users.

## Recommended Next Steps

1. **High Priority**: Update `src/skill-entry.ts:49` to version `'0.1.1'` and rebuild
2. **High Priority**: Update `skill/README.md:77` publish command to `--version 0.1.1`
3. **Low Priority**: Fix README.md paths at lines 266 and 291 (remove `research/` prefix)
4. **Optional**: Clarify Ollama fallback support in documentation (currently undocumented but functional)

## Raw Output

<details>
<summary>Full CLI output</summary>

```
OpenAI Codex v0.63.0 (research preview)
model: gpt-5.1-codex-max
sandbox: read-only
tokens used: 246,125

**Important**
- `src/skill-entry.ts:47-50` (and built `dist/skill-entry.js:18-21`) still report version `0.1.0`
  while package/manifest and published artifacts are 0.1.1, so the shipped skill metadata is out
  of sync with the released version (will misreport to loaders/ClawHub).
- `skill/README.md:66-78` ClawHub publish instructions still use `--version 0.1.0`; following them
  would republish an older version and drift from npm/ClawHub 0.1.1.

**Minor**
- `README.md:265` and `README.md:291` direct developers to `cd research/neon-soul`, but the repo
  root is `neon-soul`, so the setup commands fail as written.
- `docker/Dockerfile.neon-soul:13-31` remains on `node:20` with a single-stage build (missing
  devDeps), so Stage 5 is still not runnable as-is despite the documented fixes; acceptable if
  intentionally deferred, but it will break if anyone tries to build now.

**Notes / Questions**
- `src/commands/synthesize.ts:160-205` still auto-detects an Ollama LLM for CLI use. Docs position
  v0.1.1 as OpenClaw-only; confirm whether this standalone Ollama path is intentionally supported.

LLM requirement is documented in both READMEs and `.npmignore` excludes `.env`, so sensitive files
are still kept out of npm.
```

</details>

---

*Review generated by codex-gpt51-examiner agent (gpt-5.1-codex-max)*

---

## Issue Created

Findings from this review have been consolidated into:
`docs/issues/2026-02-10-post-deployment-version-fixes.md`
