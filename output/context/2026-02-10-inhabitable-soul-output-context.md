# Context: Implementation of Inhabitable Soul Output plan

**Generated**: 2026-02-10 (Scout exploration)
**Scout**: Opus 4.5
**Mode**: flexible
**Topic**: Implementation of Inhabitable Soul Output plan (docs/plans/2026-02-10-inhabitable-soul-output.md)

## Files (11 relevant)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| docs/plans/2026-02-10-inhabitable-soul-output.md | 0345e2b3650437b2 | 368 | Implementation plan - 4 stages: cognitive load cap, prose expander, pipeline wiring, documentation |
| src/lib/prose-expander.ts | 244ae4bfa7413f75 | 541 | NEW: Core prose expansion module - transforms axioms into prose sections (Core Truths, Voice, Boundaries, Vibe) |
| src/lib/compressor.ts | 5e6733ed1e9a7207 | 384 | MODIFIED: Added COGNITIVE_LOAD_CAP (25), pruned axioms tracking, cascade compression with cap enforcement |
| src/lib/pipeline.ts | a25a964acdeb82f0 | 847 | MODIFIED: Added prose-expansion stage, proseExpansion field in context, outputFormat option |
| src/lib/soul-generator.ts | 7ac869305ecad900 | 496 | MODIFIED: Added formatProseSoulMarkdown(), proseExpansion option, essence statement integration |
| src/types/axiom.ts | 038abf99cf59371b | 49 | Type definitions for Axiom, AxiomTier, CanonicalForm, AxiomProvenance |
| src/types/llm.ts | a100c20c1660c610 | 137 | LLM provider interface with classify() and generate() methods |
| docs/ARCHITECTURE.md | 1f459a2e2475c9d8 | 445 | UPDATED: Documents prose-expander module, prose expansion data flow, output format options |
| skill/SKILL.md | 4e10ea604c94b593 | 345 | UPDATED: Documents prose output format, --output-format option, example prose SOUL.md |
| README.md | 0a50fd75a79828a1 | 421 | UPDATED: Describes prose output, compression vs presentation distinction, inhabitable language |
| tests/unit/pipeline.test.ts | 7cb140cfe3da015e | 71 | Unit tests for pipeline LLM requirement - prose expansion tests may be needed |

## Historical Notes

*No historical observations retrieved - first exploration of this implementation.*

## Relationships

```
Pipeline Flow:
  pipeline.ts
    -> compressor.ts (cognitive load cap, cascade thresholds)
    -> prose-expander.ts (new stage between validate-output and backup-current)
    -> soul-generator.ts (renders prose or notation format)

Type Dependencies:
  prose-expander.ts imports:
    - types/axiom.ts (Axiom)
    - types/signal.ts (SoulCraftDimension)
    - types/llm.ts (LLMProvider)

  pipeline.ts imports:
    - prose-expander.ts (expandToProse, ProseExpansion)
    - soul-generator.ts (generateSoul)
    - compressor.ts (via reflection-loop)

Documentation Dependencies:
  README.md -> docs/ARCHITECTURE.md -> skill/SKILL.md
  (all updated to document prose output format)
```

## Suggested Focus

- **Priority 1**: `src/lib/prose-expander.ts` (541 lines) - Core new module implementing section-aware LLM prompts with validation and retry logic
- **Priority 2**: `src/lib/pipeline.ts` (847 lines) - Integration point with proseExpansion context field and prose-expansion stage
- **Priority 3**: `src/lib/soul-generator.ts` (496 lines) - Rendering logic for prose vs notation formats

## Exploration Notes

1. **Implementation Status**: Plan marked as Complete (2026-02-10). All 4 stages implemented:
   - Stage 1: COGNITIVE_LOAD_CAP = 25 in compressor.ts, with pruned axioms tracking
   - Stage 2: Full prose-expander.ts module with 4 sections + closing tagline
   - Stage 3: Pipeline wiring complete with outputFormat option
   - Stage 4: Documentation updated in ARCHITECTURE.md, SKILL.md, README.md

2. **Key Design Decisions**:
   - Prose expansion runs after validate-output, before backup-current
   - Sections generated in phases: Core Truths/Voice/Vibe parallel, then Boundaries (needs context), then closing tagline
   - Validation per section with retry once, graceful fallback to bullet list
   - Backward compatibility via outputFormat: 'prose' | 'notation' (default: prose)

3. **Test Coverage Gap**: No dedicated prose-expander tests found in tests/ directory. Integration testing may be through e2e/live-synthesis.test.ts or manual verification.

4. **Compression Clarification**: Plan explicitly states this is a presentation change, not compression change. Axiom layer still provides ~7:1 compression benefit; prose is larger but usable output.
