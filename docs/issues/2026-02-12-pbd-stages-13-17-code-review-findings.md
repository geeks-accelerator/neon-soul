# Code Review Findings: PBD Stages 13-17

**Date**: 2026-02-12
**Status**: Resolved (2026-02-12)
**Review Type**: External Code Review (N=2 cross-architecture)
**Reviewers**:
- Codex GPT-5.1 (審碼)
- Gemini 2.5 Pro (審双)

**Cross-References**:
- Plan: `docs/plans/2026-02-10-pbd-alignment.md` (Stages 13-17)
- Review (Codex): `docs/reviews/2026-02-12-pbd-stages-13-17-codex.md`
- Review (Gemini): `docs/reviews/2026-02-12-pbd-stages-13-17-gemini.md`
- Context: `output/context/2026-02-12-pbd-stages-13-17-context.md`

---

## Summary

| Severity | Count | N=2 Consensus | N=1 Verified |
|----------|-------|---------------|--------------|
| Critical | 1 | 1 | 0 |
| Important | 5 | 0 | 5 |
| Minor | 6 | 1 | 5 |
| **Total** | **12** | **2** | **10** |

---

## Critical

### C-1: TOCTOU Race Condition in Lock Acquisition [N=2]

**Location**: `src/lib/cycle-manager.ts:139-153`
**Reporters**: Codex, Gemini
**Status**: Resolved

**Problem**: Lock acquisition uses check-then-act pattern (`existsSync` followed by `writeFileSync`) which is not atomic. Two concurrent processes can both pass the existence check and write the lock file, defeating concurrency protection entirely.

```typescript
// VULNERABLE CODE (lines 144-152)
if (existsSync(lockPath)) {        // Process A checks: no lock
                                    // Process B checks: no lock
  throw new Error(...);
}
writeFileSync(lockPath, pid);       // Process A writes lock
                                    // Process B writes lock (overwrites!)
```

**Impact**: Data corruption during concurrent synthesis. Both processes proceed, modifying soul state simultaneously.

**Fix**: Use atomic `fs.open()` with `'wx'` flag (exclusive create):

```typescript
import { openSync, closeSync, writeSync, unlinkSync } from 'fs';

export async function acquireLock(workspacePath: string): Promise<() => void> {
  const dir = ensureNeonSoulDir(workspacePath);
  const lockPath = resolve(dir, LOCK_FILE);
  const pid = process.pid.toString();

  try {
    // 'wx' flag: opens for writing, fails atomically if exists
    const fd = openSync(lockPath, 'wx');
    writeSync(fd, pid);
    closeSync(fd);
    logger.debug('Acquired synthesis lock', { lockPath, pid });
    return () => {
      try {
        unlinkSync(lockPath);
        logger.debug('Released synthesis lock', { lockPath });
      } catch (error) {
        logger.warn('Failed to release lock', { lockPath, error });
      }
    };
  } catch (error: any) {
    if (error.code === 'EEXIST') {
      const existingPid = readFileSync(lockPath, 'utf-8').trim();
      throw new Error(
        `Synthesis already in progress (PID: ${existingPid}). ` +
        `Remove ${lockPath} if stale.`
      );
    }
    throw error;
  }
}
```

---

## Important

### I-1: Cross-Platform Path Handling [N=1→N=2 Verified]

**Location**: `src/lib/signal-extractor.ts:157-159`
**Reporter**: Codex
**Verified**: Code inspection confirms `split('/')` only

**Problem**: Path heuristics split on `/` only and don't normalize casing. On Windows paths (backslash) or directories with capital letters like `Knowledge/`, the OpenClaw category detection fails completely.

```typescript
// CURRENT (line 157-159)
const pathParts = filePath.split('/');
const memoryCategory = pathParts.find((p) =>
  ['diary', 'experiences', 'goals', 'knowledge', 'relationships', 'preferences'].includes(p)
);
```

**Impact**: On Windows or with capitalized paths, everything falls back to `'self'`, skewing provenance distribution and incorrectly blocking anti-echo-chamber promotion.

**Fix**:
```typescript
const pathParts = filePath.split(/[\\/]/).map(p => p.toLowerCase());
const memoryCategory = pathParts.find((p) =>
  ['diary', 'experiences', 'goals', 'knowledge', 'relationships', 'preferences'].includes(p)
);
```

---

### I-2: Missing Null Guards in canPromote [N=1→N=2 Verified]

**Location**: `src/lib/compressor.ts:121-189`
**Reporter**: Codex
**Verified**: Code inspection confirms direct access without guards

**Problem**: `getProvenanceDiversity` and `canPromote` assume `principle.derived_from.signals` is always present and iterable. Legacy principles (persisted before Stage 15) or malformed data will throw `Cannot read properties of undefined`.

```typescript
// CURRENT (line 123)
for (const s of principle.derived_from.signals) {  // Throws if undefined
```

**Impact**: Runtime crash aborts entire compression pipeline.

**Fix**:
```typescript
export function getProvenanceDiversity(principle: Principle): number {
  const signals = principle.derived_from?.signals ?? [];
  const types = new Set<ArtifactProvenance>();
  for (const s of signals) {
    if (s.provenance) {
      types.add(s.provenance);
    }
  }
  return types.size;
}
```

---

### I-3: Hard-Coded Model in Cache Key [N=1→N=2 Verified]

**Location**: `src/lib/reflection-loop.ts:120`
**Reporter**: Codex
**Verified**: Code inspection confirms hard-coded `'ollama'`

**Problem**: `runReflectiveLoop` invokes generalization with hard-coded model label `'ollama'` while cache keys exclude model ID. Switching LLM providers will silently reuse cached generalizations from a different model.

```typescript
// CURRENT (line 120)
const generalizedSignals = await generalizeSignalsWithCache(llm, signals, 'ollama');
```

**Impact**: Stale clustering inputs and inaccurate audit trails when provider changes.

**Fix**: Pass actual model identifier from LLM provider context and include in cache key.

```typescript
const modelId = llm.getModelId?.() ?? 'unknown';
const generalizedSignals = await generalizeSignalsWithCache(llm, signals, modelId);
```

---

### I-4: Orphaned Temp Files on Crash [N=1→N=2 Verified]

**Location**: `src/lib/cycle-manager.ts:83-87`
**Reporter**: Gemini
**Verified**: Code inspection confirms temp file pattern

**Problem**: The temp file + rename pattern is correct for atomicity, but can leave orphaned `.tmp-soul-*` files if process crashes between `writeFileSync` and `renameSync`.

```typescript
// CURRENT (lines 83-87)
const tempPath = resolve(dir, `.tmp-soul-${randomUUID()}`);
writeFileSync(tempPath, JSON.stringify(soul, null, 2), 'utf-8');  // Crash here...
renameSync(tempPath, statePath);  // ...leaves orphaned temp file
```

**Impact**: Over time, orphaned temp files accumulate in `.neon-soul/` directory.

**Fix**: Add startup cleanup in `acquireLock` or `loadSoul`:

```typescript
function cleanupOrphanedTempFiles(dir: string): void {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      if (file.startsWith('.tmp-soul-')) {
        unlinkSync(resolve(dir, file));
        logger.debug('Cleaned orphaned temp file', { file });
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}
```

---

### I-5: Missing Race Condition Tests [N=1]

**Location**: `tests/unit/cycle-manager.test.ts`
**Reporter**: Gemini
**Status**: Test coverage gap

**Problem**: Current tests verify acquire/release in isolation but not concurrent access scenarios. After fixing C-1, need tests to verify the fix works.

**Fix**: Add concurrent lock test after implementing atomic lock:

```typescript
it('rejects concurrent lock acquisition', async () => {
  const results = await Promise.allSettled([
    acquireLock(workspacePath),
    acquireLock(workspacePath),
    acquireLock(workspacePath),
  ]);

  const fulfilled = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');

  expect(fulfilled).toHaveLength(1);
  expect(rejected).toHaveLength(2);

  // Release the successful lock
  if (fulfilled[0].status === 'fulfilled') {
    fulfilled[0].value();
  }
});
```

---

## Minor

### M-1: No Stale Lock Detection [N=1]

**Location**: `src/lib/cycle-manager.ts:144-149`
**Reporter**: Codex

**Problem**: Lock acquisition throws error with instructions to manually remove lock file. If synthesis crashes without releasing, subsequent runs blocked indefinitely.

**Suggestion**: Read PID from lock and check if process is still running via `process.kill(pid, 0)`.

---

### M-2: Synchronous FS Operations [N=1]

**Location**: `src/lib/cycle-manager.ts`
**Reporter**: Codex

**Problem**: Module uses synchronous file operations (`existsSync`, `readFileSync`, `writeFileSync`) which block the Node.js event loop.

**Note**: Acceptable for CLI tools. Consider async versions for future server-side deployment.

---

### M-3: Contradiction Detection Limitations [N=2]

**Location**: `src/lib/cycle-manager.ts` (textSimilarity function)
**Reporters**: Codex, Gemini

**Problem**: Jaccard similarity + negation pattern matching is heuristic-based. May miss semantic contradictions using different phrasing ("prioritize speed" vs "take your time").

**Note**: Acknowledged as fallback; LLM-based matcher is preferred. Document as known limitation.

---

### M-4: No Schema Validation for Soul State [N=1]

**Location**: `src/lib/cycle-manager.ts:loadSoul`
**Reporter**: Codex

**Problem**: `loadSoul` parses JSON without Zod validation. Corrupted or tampered state files could inject unexpected data.

**Note**: Type assertion provides compile-time safety. Consider adding Zod for runtime validation.

---

### M-5: Filename Heuristics Limited Coverage [N=1]

**Location**: `src/lib/signal-extractor.ts:classifyProvenance`
**Reporter**: Gemini

**Problem**: Files like `notes/feedback-from-mentor.md` don't match any heuristic.

**Note**: Acceptable design - LLM handles ambiguous cases. Consider adding "feedback" pattern if common.

---

### M-6: Blocker Message Terminology [N=1→N=2 Verified]

**Location**: `src/lib/compressor.ts:160`
**Reporter**: Gemini
**Verified**: Code inspection confirms terminology mismatch

**Problem**: Message says "supporting signals" but check is on `n_count` (principle count).

```typescript
// CURRENT (line 160)
blocker: `Insufficient evidence: ${principle.n_count}/${criteria.minPrincipleCount} supporting signals`,
```

**Fix**: Change "signals" to "principles":
```typescript
blocker: `Insufficient evidence: ${principle.n_count}/${criteria.minPrincipleCount} supporting principles`,
```

---

## Documentation Gap

**Location**: `skill/SKILL.md`
**Reporter**: Codex

**Problem**: Documents `--force-resynthesis` flag but doesn't mention equivalent `NEON_SOUL_FORCE_RESYNTHESIS` environment variable in the triggers section.

**Fix**: Add note in Triggers section referencing env var table.

---

## Implementation Priority

| Priority | Items | Rationale |
|----------|-------|-----------|
| **P0** | C-1 | Data corruption risk |
| **P1** | I-1, I-2, I-3 | Functional bugs |
| **P2** | I-4, I-5 | Operational hygiene |
| **P3** | M-1 through M-6 | Quality improvements |

---

## Acceptance Criteria

- [x] C-1: Lock uses atomic `fs.open('wx')` pattern
- [x] I-1: Path splitting handles Windows and casing
- [x] I-2: canPromote guards against undefined signals
- [x] I-3: Model ID passed to generalization cache
- [x] I-4: Startup cleanup for orphaned temp files
- [x] I-5: Concurrent lock test added
- [x] M-6: Blocker message says "principles" not "signals"
- [x] All tests pass after fixes (339 passing)

## Resolution

**Date**: 2026-02-12
**Resolved by**: Claude Code

All critical and important issues have been addressed. Tests pass (339 total, 19 skipped, 12 todo).

---

*Generated from N=2 external code review with N=1 items verified against source code.*
