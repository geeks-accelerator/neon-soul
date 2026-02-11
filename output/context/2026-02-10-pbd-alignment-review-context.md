# Context: PBD Alignment Plan Review

**Generated**: 2026-02-10 23:58:00
**Scout**: haiku
**Mode**: flexible
**Topic**: docs/plans/2026-02-10-pbd-alignment.md

## Files (15 relevant)

| File | SHA256 (16-char) | Lines | Summary |
|------|------------------|-------|---------|
| projects/neon-soul/docs/plans/2026-02-10-pbd-alignment.md | 8266f02ac1cc77ee | 1643 | Main plan: 17-stage PBD methodology alignment for neon-soul synthesis pipeline |
| projects/neon-soul/src/types/signal.ts | 9c5d063b602765ee | 113 | Signal types with SignalSource, GeneralizedSignal; plan adds stance/importance/provenance |
| projects/neon-soul/src/types/axiom.ts | 038abf99cf59371b | 49 | Axiom types with CanonicalForm, AxiomTier; plan adds tensions/promotable fields |
| projects/neon-soul/src/types/principle.ts | 7fce86a6905cba54 | 37 | Principle types with PrincipleProvenance; plan adds centrality/coveragePct |
| projects/neon-soul/src/types/provenance.ts | b53c31684e6490bb | 22 | ProvenanceChain for audit trail; plan creates new ArtifactProvenance type |
| projects/neon-soul/src/lib/semantic-classifier.ts | 6020afec0fa23137 | 344 | LLM-based classification for dimensions/types; plan adds classifyStance/classifyImportance |
| projects/neon-soul/src/lib/signal-extractor.ts | 2eb1f9daa93362f8 | 247 | Signal extraction with batch LLM calls; plan adds stance/importance/source classification |
| projects/neon-soul/src/lib/principle-store.ts | 5d632433ff337e84 | 395 | Principle clustering with centroid updates; plan adds importance weighting/orphan tracking |
| projects/neon-soul/src/lib/compressor.ts | c76dfe0ad0250efe | 385 | Axiom compression with cascade thresholds; plan adds anti-echo-chamber rule/tension detection |
| projects/neon-soul/src/lib/reflection-loop.ts | 9ac8b1a5794e10ce | 185 | Single-pass synthesis pipeline; plan adds cycle management/provenance flow |
| projects/neon-soul/docs/architecture/synthesis-philosophy.md | 3ba079be142103f0 | 125 | Design choices documentation; plan adds PBD alignment section |
| projects/neon-soul/docs/guides/single-source-pbd-guide.md | 36d9e8735f6ff8dc | 280 | Single-source extraction methodology; plan updates with stance/importance tagging |
| projects/neon-soul/docs/guides/multi-source-pbd-guide.md | 204f6828b14ec4d5 | 349 | Multi-source axiom extraction; plan updates with weighted convergence |
| projects/neon-soul/docs/guides/essence-extraction-guide.md | 3302ccfb0f3a9d5d | 327 | Essence distillation from axioms; plan updates with centrality/tension awareness |
| artifacts/guides/methodology/PBD_VOCABULARY.md | 46e85afe54accc68 | 289 | Cross-project PBD vocabulary; canonical source for terminology alignment |

## Historical Notes (from Historian)

*No semantic search performed - scout run without automation CLI recall.*

## Relationships

### Type Dependencies
```
signal.ts
  └── Used by: signal-extractor.ts, principle-store.ts, reflection-loop.ts
  └── Plan adds: SignalStance, SignalImportance, ArtifactProvenance, SignalSourceType

axiom.ts
  └── Used by: compressor.ts, reflection-loop.ts
  └── Plan adds: tensions[], promotable, promotionBlocker, provenanceDiversity

principle.ts
  └── Used by: principle-store.ts, compressor.ts
  └── Plan adds: centrality, coveragePct
```

### Pipeline Flow (Current)
```
Signals → [signal-extractor] → [signal-generalizer] → [principle-store] → [compressor] → Axioms
                                                              ↓
                                                    [reflection-loop] orchestrates
```

### Pipeline Flow (After Plan)
```
Artifacts → [provenance classification] → Signals
                                            ↓
Signals → [signal-extractor] + stance/importance/source classification
                                            ↓
          [principle-store] + importance weighting + orphan tracking
                                            ↓
          [tension-detector] + [compressor] + anti-echo-chamber rule
                                            ↓
          [cycle-manager] → initial/incremental/full-resynthesis decision
```

### Cross-Project Alignment
- **PBD_VOCABULARY.md**: Canonical terminology (shared with essence-router)
- **Stage 14-16**: SSEM-style provenance from essence-router implementation
- **Anti-echo-chamber rule**: Requires external OR questioning evidence (F=2.0 stance)

## Suggested Focus

- **Priority 1**: `src/types/signal.ts`, `src/types/axiom.ts` - Type extensions are foundation for all other stages
- **Priority 2**: `src/lib/semantic-classifier.ts`, `src/lib/signal-extractor.ts` - Core classification changes (Stages 2-3, 12)
- **Priority 3**: `src/lib/compressor.ts`, `src/lib/principle-store.ts` - Weighting and anti-echo-chamber logic (Stages 4-6, 15)
- **Priority 4**: Documentation files - Update after implementation stages complete

## Exploration Notes

### Plan Characteristics
- **17 stages** (13 original + 3 cross-project + 1 final docs)
- **LLM-dependent stages**: 2, 3, 5, 12, 14 - expect 50-100% additional effort
- **Estimated scope**: ~825 new lines, ~580 modified lines
- **Evidence base**: N=4 (PBD Guide, obviously-not/writer, neon-soul, essence-router)

### Key Technical Decisions
1. **Stance classification** maps to F-values (1.0 affirming, 2.0 questioning/denying)
2. **Importance weighting** uses multiplicative factors (core=1.5x, peripheral=0.5x)
3. **Anti-echo-chamber** requires EXTERNAL provenance OR QUESTIONING/DENYING stance
4. **Cycle management** thresholds: 30% new principles or 2 contradictions triggers full resynthesis
5. **Orphan rate threshold**: 20% (from grounded theory saturation literature)

### Gaps Identified in Plan
1. Current `SignalSourceType` in signal.ts is `'memory' | 'interview' | 'template'` - plan adds different `SignalSourceType` for signal origin (agent-initiated/user-elicited)
2. No existing tension detection infrastructure - Stage 5 creates new module
3. No cycle state persistence - Stage 13 creates `.soul-state.json`

### Review Considerations
- Plan exceeds 300-400 line standard (1643 lines) - justified by cross-project complexity
- Code review findings already incorporated (deny stance fix in Stage 15)
- Twin review findings already incorporated (weight composition, operator experience)
- External validation completed (Codex, Gemini reviews)

### File Organization
```
neon-soul/
├── src/
│   ├── types/         # Type definitions (Stages 1, 12, 14)
│   └── lib/           # Implementation (Stages 2-7, 12-16)
├── docs/
│   ├── architecture/  # Philosophy doc (Stage 8)
│   ├── guides/        # PBD guides (Stage 10)
│   └── plans/         # This plan
└── tests/
    └── integration/   # PBD alignment tests (Stage 9)
```
