# Context: Essence Extraction Plan Review

**Generated**: 2026-02-10 (Scout)
**Scout**: haiku
**Mode**: flexible
**Topic**: Review of essence extraction implementation plan and its dependencies

## Files (8 relevant)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| projects/neon-soul/docs/plans/2026-02-10-essence-extraction.md | 7a65339ad5466f3a | 315 | Implementation plan for adding LLM-based essence extraction to SOUL.md generation |
| projects/neon-soul/docs/guides/essence-extraction-guide.md | 3302ccfb0f3a9d5d | 327 | Guide for distilling axioms into evocative identity statements (Phase 3 of PBD pipeline) |
| projects/neon-soul/docs/guides/single-source-pbd-guide.md | 36d9e8735f6ff8dc | 280 | Phase 1 guide: Extract principles from single memory file via section-based convergence |
| projects/neon-soul/docs/guides/multi-source-pbd-guide.md | 204f6828b14ec4d5 | 349 | Phase 2 guide: Extract axioms from principles across multiple sources |
| projects/neon-soul/src/lib/soul-generator.ts | 1b24c0efbfb578b3 | 359 | SOUL.md generation with dimension formatting, provenance, and metrics |
| projects/neon-soul/src/lib/pipeline.ts | c9e5f585fa5f6444 | 766 | Pipeline orchestrator: 7-stage synthesis from memory to SOUL.md |
| projects/neon-soul/src/types/llm.ts | 3b2395af3f4b331e | 137 | LLM provider interface with classify, classifyBatch, and generate methods |
| docs/observations/meta-recursion-essence-extraction.md | 9a6cfaed774d07f2 | 77 | Observation about meta-recursive teaching moment in essence extraction |

## Historical Notes (from Historian)

| N | Observation | Summary |
|---|-------------|---------|
| 1 | docs/observations/meta-recursion-essence-extraction.md | Meta-recursive teaching moment: literal references vs extracting essence |

*N-count indicates observation maturity: N=1 first, N=2 validated, N=3 proven pattern.*

## Relationships

### Pipeline Architecture
```
Memory Files
    |
    v
[Single-Source PBD] --> Principles (Phase 1)
    |
    v
[Multi-Source PBD] --> Axioms (Phase 2)
    |
    v
[Essence Extraction] --> Identity Statement (Phase 3 - THIS PLAN)
    |
    v
SOUL.md
```

### File Dependencies

1. **Plan** (`2026-02-10-essence-extraction.md`):
   - References guide: `essence-extraction-guide.md`
   - Modifies: `soul-generator.ts` (Stages 1-3)
   - Modifies: `pipeline.ts` (Stage 4)
   - Uses interface: `llm.ts` LLMProvider

2. **soul-generator.ts** (target of modification):
   - Imports: `types/axiom.ts`, `types/principle.ts`, `types/signal.ts`
   - Imports: `metrics.ts` (token counting)
   - Exports: `generateSoul()`, `SoulGeneratorOptions`, `GeneratedSoul`
   - Current: No LLM parameter, no essence extraction

3. **pipeline.ts** (integration point):
   - Imports: `soul-generator.ts` as `generateSoulContent`
   - Imports: `llm.ts` LLMProvider interface
   - Already has LLM in context (`context.options.llm`)
   - Stage `generate-soul` calls `generateSoulContent()`

4. **llm.ts** (interface):
   - Exports: `LLMProvider` with `classify()`, `classifyBatch?()`, `generate?()`
   - `generate()` method exists (optional) - needed for essence extraction
   - Exports: `LLMRequiredError`, `requireLLM()`

### Key Interfaces

**Current SoulGeneratorOptions** (soul-generator.ts:55-68):
- `format: NotationFormat`
- `includeProvenance?: boolean`
- `includeMetrics?: boolean`
- `includeUnconverged?: boolean`
- `originalContent?: string`
- `title?: string`
- **Missing**: `llm?: LLMProvider` (Stage 1 adds this)

**Current GeneratedSoul** (soul-generator.ts:35-50):
- `content: string`
- `byDimension: Map<...>`
- `coverage: number`
- `tokenCount: number`
- `originalTokenCount: number`
- `compressionRatio: number`
- `generatedAt: Date`
- **Missing**: `essenceStatement?: string` (Stage 1 adds this)

**LLMProvider.generate()** (llm.ts:93):
- Method signature: `generate?(prompt: string): Promise<GenerationResult>`
- Returns: `{ text: string }`
- Currently optional - essence extraction needs this

## Suggested Focus

- **Priority 1**: `soul-generator.ts` - Core implementation target (Stages 1-3)
- **Priority 2**: `pipeline.ts` - Integration point (Stage 4), already has LLM access
- **Priority 3**: `llm.ts` - Interface check (ensure `generate()` meets needs)
- **Priority 4**: `essence-extraction-guide.md` - Methodology reference for prompt design

## Exploration Notes

1. **LLM Already Available**: `pipeline.ts` already has LLM provider in options (`context.options.llm`). Stage 4 just needs to pass it through to `generateSoulContent()`.

2. **generate() Method Exists**: The `LLMProvider` interface already has `generate()` (added in IM-2 fix for notation generation). Essence extraction can use this.

3. **Current Header Format** (soul-generator.ts:184-189):
   ```typescript
   lines.push(`# ${options.title ?? 'SOUL.md'}`);
   lines.push('');
   lines.push('*AI identity through grounded principles.*');
   ```
   Plan targets changing this to include extracted essence.

4. **Prompt Template Available**: `essence-extraction-guide.md` lines 158-186 has the LLM prompt template for essence extraction.

5. **Backward Compatibility**: Plan explicitly requires LLM to be optional. When absent, fallback to default "*AI identity through grounded principles.*"

6. **Test Location**: Plan suggests `tests/integration/essence.test.ts` - this file does not exist yet (Stage 4 creates it).

7. **Documentation Update**: Stage 5 updates `ARCHITECTURE.md` and `README.md` - these are in `projects/neon-soul/docs/` and root.

---

*Generated by Scout for review workflow. Reviewers should verify file hashes match before proceeding.*
