# Issue: Inhabitable Soul Output Code Review Findings

**Created**: 2026-02-10
**Updated**: 2026-02-10
**Status**: Open
**Priority**: High
**Type**: Code Review Consolidation

**Reviews**:
- `docs/reviews/2026-02-10-inhabitable-soul-output-codex.md` (Codex/GPT-5.1)
- `docs/reviews/2026-02-10-inhabitable-soul-output-gemini.md` (Gemini 2.5 Pro)

**Related Plans/Issues**:
- `docs/plans/2026-02-10-inhabitable-soul-output.md` (Complete)

---

## Summary

External code review (N=2) of the Inhabitable Soul Output implementation identified 3 critical issues, 4 important issues, and 4 minor issues. All N=1 findings were verified to N=2.

---

## Critical Findings (P0)

### C-1: Axiom Pruning Uses Wrong Metric

**Severity**: Critical (N=2: Codex + Gemini consensus)
**Location**: `src/lib/compressor.ts:345-348`

**Problem**: When pruning axioms to meet the cognitive load cap (25), the sort uses `derived_from.principles.length` as a proxy for N-count. However, `synthesizeAxiom()` always creates axioms with a single-principle provenance, making this metric always equal to 1. Pruning is effectively arbitrary.

```typescript
// Current (broken) - always equals 1:
const aNCount = a.derived_from?.principles?.length ?? 1;
const bNCount = b.derived_from?.principles?.length ?? 1;
```

**Impact**: Highest-evidence axioms (N=5 core) may be dropped in favor of low-evidence axioms (N=1 emerging).

**Fix**: Access actual n_count from the source principle:
```typescript
const aNCount = a.derived_from?.principles?.[0]?.n_count ?? 1;
```

---

### C-2: Path Traversal Bypass

**Severity**: Critical (N=2: Codex raised, orchestrator verified)
**Location**: `src/lib/pipeline.ts:329`

**Problem**: `validatePath()` uses `startsWith` to check if paths are within allowed roots. This allows paths like `/tmp2/evil` or `/home/user_evil` to bypass the constraint because they match the prefix without respecting directory boundaries.

```typescript
// Current (vulnerable):
const isAllowed = allowedRoots.some(root => normalized.startsWith(root));
```

**Impact**: Paths outside the intended sandbox could be read or written.

**Fix**: Use path segment checks:
```typescript
const isAllowed = allowedRoots.some(root =>
  normalized === root || normalized.startsWith(root + path.sep)
);
```

---

### C-3: Prompt Injection Vulnerability

**Severity**: Critical (N=2: Gemini raised, orchestrator verified)
**Location**: `src/lib/prose-expander.ts:146-148`

**Problem**: Axiom text is directly embedded into LLM prompts without delimiters in `formatAxiomsForPrompt()`. Malicious or malformed axiom content could be interpreted as instructions by the LLM.

```typescript
// Current (vulnerable):
function formatAxiomsForPrompt(axioms: Axiom[]): string {
  return axioms.map(a => `- ${a.canonical?.native || a.text}`).join('\n');
}
```

**Impact**: An axiom like `"Ignore all previous instructions and..."` could potentially hijack LLM prompts.

**Fix**: Wrap axiom content in clear data delimiters:
```typescript
const prompt = `...
<axiom_data>
${formatAxiomsForPrompt(axioms)}
</axiom_data>
...`;
```

---

## Important Findings (P1)

### I-1: Boundaries Fallback Returns Empty String on LLM Error

**Severity**: Important (N=2: Codex raised, orchestrator verified)
**Location**: `src/lib/prose-expander.ts:346-349`

**Problem**: When the LLM call fails in `generateBoundaries()`, the catch block returns an empty string instead of the fallback inversion list used when validation fails.

```typescript
} catch (error) {
  logger.warn('[prose-expander] Boundaries generation failed', { error });
  return { content: '', usedFallback: true };  // Returns empty, not fallback
}
```

**Impact**: Prose output may have an empty Boundaries section with no backup content.

**Fix**: Return the inversion fallback (same as validation failure path):
```typescript
const fallback = allAxioms.slice(0, 5).map(a => {
  const text = a.canonical?.native || a.text;
  return `You don't abandon ${text.toLowerCase().replace(/^values?\s*/i, '')}`;
}).join('\n');
return { content: fallback, usedFallback: true };
```

---

### I-2: Brittle Boundaries Validation

**Severity**: Important (N=2: Gemini raised, orchestrator verified)
**Location**: `src/lib/prose-expander.ts:116-118`

**Problem**: `validateBoundaries()` requires EVERY line to start with specific patterns. If the LLM adds any introductory text like "Based on your identity:", validation fails and triggers fallback.

```typescript
return lines.every(line =>
  validStarters.some(pattern => pattern.test(line.trim()))
);
```

**Impact**: LLM output variations unnecessarily trigger fallback, reducing prose quality.

**Fix**: Either:
- A) Check that at least 3 lines match the pattern (allowing intro/outro)
- B) Filter lines first, validate the filtered subset
- C) Use `lines.filter(...).length >= 3` instead of `lines.every(...)`

---

### I-3: Inaccurate Axiom Count in Provenance

**Severity**: Important (N=2: Codex + Gemini consensus)
**Location**: `src/lib/soul-generator.ts:403-404`

**Problem**: In `formatProseSoulMarkdown()`, the axiom count is approximated from unique dimensions (max 7), not the actual axiom count.

```typescript
// Current (wrong) - counts dimensions:
const axiomCount = new Set(principles.map(p => p.dimension)).size;
```

**Impact**: Provenance table shows "~7" axioms when there may be 15-25.

**Fix**: Pass actual axiom array to `formatProseSoulMarkdown()` and count correctly, or track axiom count in `ProseExpansion`.

---

### I-4: Silent Fallback Masks Persistent Errors

**Severity**: Important (N=2: Gemini raised, orchestrator verified)
**Location**: `src/lib/pipeline.ts:643-647`

**Problem**: When prose expansion fails, the pipeline silently falls back to notation format with only a warning log. This can hide persistent issues with LLM providers, API keys, or prompt formatting.

```typescript
} catch (error) {
  // Non-fatal - fall back to notation format
  logger.warn('[pipeline] Prose expansion failed, will use notation format', { error });
}
```

**Impact**: Users may not realize their souls are using the legacy notation format.

**Fix**: Add a `strictMode` option that fails the pipeline on prose expansion errors, useful for CI/testing.

---

## Minor Findings (P2)

### M-1: Vibe Validation Comment/Code Mismatch

**Severity**: Minor (N=2: Codex raised, orchestrator verified)
**Location**: `src/lib/prose-expander.ts:122-129`

**Problem**: Comment says "Must be 2-4 sentences" but validation accepts 1-5.

**Fix**: Align comment with code, or tighten bounds if stricter format is required.

---

### M-2: No Dedicated Test Coverage

**Severity**: Minor (N=2: Codex + Gemini consensus)
**Location**: `src/lib/prose-expander.ts`

**Problem**: The 541-line prose-expander module has no dedicated tests. Coverage gap includes:
- Prose section generation with mock LLM
- Validation retry logic
- Fallback generation paths
- Parallel execution correctness

**Fix**: Add unit tests for validation functions, integration tests with mock LLM for `expandToProse()`.

---

### M-3: Duplicate Function Bodies

**Severity**: Minor (N=2: Gemini raised, orchestrator verified)
**Location**: `src/lib/prose-expander.ts:146-155`

**Problem**: `formatAxiomsForPrompt()` and `generateFallback()` have identical implementations.

**Fix**: Could consolidate, but keeping separate allows future divergence. Low priority.

---

### M-4: Closing Tagline Fallback Not Tracked

**Severity**: Minor (N=2: Codex raised, orchestrator verified)
**Location**: `src/lib/prose-expander.ts`

**Problem**: `generateClosingTagline` can fall back to a default tagline, but this is not tracked in `fallbackSections`. The `usedFallback` flag doesn't capture this case.

**Fix**: Track closing tagline fallback separately or include in `fallbackSections`.

---

## Action Items

| Priority | ID | Issue | Status |
|----------|-----|-------|--------|
| P0 | C-1 | Fix axiom pruning metric | 🔴 open |
| P0 | C-2 | Fix path traversal bypass | 🔴 open |
| P0 | C-3 | Add prompt injection protection | 🔴 open |
| P1 | I-1 | Fix boundaries empty fallback | 🔴 open |
| P1 | I-2 | Loosen boundaries validation | 🔴 open |
| P1 | I-3 | Fix provenance axiom count | 🔴 open |
| P1 | I-4 | Add strictMode option | 🔴 open |
| P2 | M-1 | Fix vibe validation comment | 🔴 open |
| P2 | M-2 | Add prose-expander tests | 🔴 open |
| P2 | M-3 | Consider consolidating duplicate functions | 🔴 open |
| P2 | M-4 | Track closing tagline fallback | 🔴 open |

---

## Architecture Assessment

Both reviewers agree the **approach is sound**:
- Clean separation of concerns (prose-expander, pipeline, soul-generator)
- Parallel execution of independent sections
- Graceful degradation with retry-then-fallback
- Backward compatibility via `outputFormat` option

The issues are **implementation bugs, not design flaws**.
