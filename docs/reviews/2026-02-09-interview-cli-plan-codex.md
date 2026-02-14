# Interview CLI Integration Plan Review - Codex

**Date**: 2026-02-09
**Reviewer**: 審碼 (codex-gpt51-examiner)
**Model**: gpt-5.1-codex-max
**Files Reviewed**:
- `docs/plans/2026-02-09-interview-cli-integration.md` (primary)
- `src/types/interview.ts`
- `src/lib/interview.ts`
- `src/lib/question-bank.ts`
- `src/commands/synthesize.ts`

## Summary

The plan addresses a real UX problem (cold start) but has critical architectural gaps that would cause the interview-then-synthesize loop to fail silently. Two critical issues must be resolved before implementation: the threshold gating will still skip after interview completion, and interactive prompts cannot be mixed with the programmatic skill path.

## Findings

### Critical

1. **Threshold gating blocks post-interview synthesis**
   - `src/lib/pipeline.ts:353` - Pipeline skips before extraction when content delta < threshold
   - If interview captures <2000 chars (the exact cold-start case), re-running synthesize will still return `skipped`
   - The "offer interview then synthesize" loop never unblocks unless the plan explicitly adds `--force` or adjusts threshold logic
   - **Impact**: Core user flow broken - users complete interview, synthesis still skips

2. **Interactive prompts incompatible with skill path**
   - `src/commands/synthesize.ts:211` - The `run()` function is the non-interactive skill entry point
   - Adding readline prompts here would hang OpenClaw/automated callers expecting a pure function
   - **Impact**: Would break programmatic usage of the synthesize command
   - **Fix needed**: Plan must separate CLI-only interactive flow from skill/programmatic path

### Important

3. **Coverage-based question selection lacks cold-start path**
   - `src/lib/interview.ts:44` + `src/lib/interview.ts:375` require coverage input to target gaps
   - Cold-start runs never extract signals because pipeline skips at `src/lib/pipeline.ts:353`
   - Plan assumes gap-aware question selection without describing how to derive coverage when below threshold
   - **Question**: How does `analyzeCoverage()` get signal data if extraction never runs?

4. **Interview storage format mismatch**
   - `src/lib/source-collector.ts:186` only ingests interview signals from `workspace/interviews/*.json`
   - Plan stores responses as `memory/onboarding/interview-*.md` (markdown)
   - These will be treated as memory signals, not interview signals
   - `analyzeCoverage()` at `src/lib/interview.ts:389` will show zero interview signals
   - **Impact**: Interview coverage tracking will be incorrect; resume logic may malfunction

5. **Static website lacks data pipeline for demo**
   - `website/README.md:1` confirms site is plain HTML/CSS with no build step
   - "Record real interview session and replay" needs:
     - Export path for sanitized session data to static JSON asset
     - Consent/PII handling for recorded interview content
     - JavaScript to load and animate the JSON
   - **Risk**: Demo cannot ship or risks leaking raw interview content without explicit data flow plan

6. **Embedding model cold-start latency**
   - `src/lib/embeddings.ts:12` lazily downloads/initializes the Xenova model (~90MB)
   - Plan doesn't address UX during model initialization
   - Users may see blank prompt for 10-30 seconds on first interview
   - **Suggestion**: Add progress indicator or pre-warm step

### Minor

7. **Session persistence lacks versioning**
   - `src/lib/interview.ts:165` persists raw session JSON without schema version
   - If question bank changes between sessions, resume may break silently
   - No expiry or cleanup strategy for abandoned sessions
   - **Suggestion**: Add version field, implement session expiry (e.g., 7 days)

## Unquestioned Assumptions

1. **Users will complete enough interview to exceed 2000 chars**: Average interview response might be 100-200 chars per question. With 7 questions, that's 700-1400 chars - potentially still below threshold.

2. **Cold-start is the only skip reason**: Other skip conditions (no new content, same content hash) may also trigger after interview, causing confusion.

3. **Interview should be inline in synthesize**: Alternative pattern - standalone `interview` command that writes memory, user runs `synthesize --force` separately. Simpler, more composable.

4. **Real recorded sessions are needed for demo**: Could use curated/synthetic demo data instead, avoiding PII concerns entirely.

## Recommended Plan Modifications

### For Critical Issues

1. **Stage 3 addition**: After writing memory file, call `synthesize` with `--force` flag explicitly, OR modify threshold check to recognize "fresh interview" state.

2. **Architecture split**:
   - `main()` in synthesize.ts handles CLI-only interactive flow
   - `run()` remains pure/non-interactive for skill usage
   - Interview prompt only in `main()` branch

### For Important Issues

3. **Stage 1 addition**: When interview starts without prior signals, use all-dimensions mode (skip coverage-based filtering) OR run a lightweight scan to estimate sparse dimensions.

4. **Stage 2 modification**: Either:
   - Write to `workspace/interviews/` as JSON (matches collector expectation)
   - OR update source-collector to also scan `memory/onboarding/interview-*.md`

5. **Stage 6 modification**: Add explicit sub-steps:
   - Recording consent prompt
   - PII sanitization pass
   - JSON export to `website/data/`
   - Document that demo uses reviewed/approved recordings

## Raw Output

<details>
<summary>Full CLI output</summary>

```
OpenAI Codex v0.63.0 (research preview)
--------
workdir: /Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul
model: gpt-5.1-codex-max
provider: openai
approval: never
sandbox: read-only
reasoning effort: xhigh
reasoning summaries: auto
session id: 019c4447-36eb-7ac3-8559-60f82daba663
--------

**Critical**
- `src/lib/pipeline.ts:353` skips before extraction when content delta < threshold; if the interview captures <2000 chars (the exact cold-start case), a rerun of `synthesize` will still return `skipped`, so the "offer interview then synthesize" loop never unblocks unless you change threshold/force in the plan.
- `src/commands/synthesize.ts:211` is the non-interactive skill entry; adding readline prompts here would hang OpenClaw/automated callers that expect a pure function. The plan doesn't separate CLI-only prompts from the skill path.

**Important**
- `src/lib/interview.ts:44` + `src/lib/interview.ts:375` require coverage input to target gaps, but cold-start runs never extract signals because they're skipped in `collectSources` (`src/lib/pipeline.ts:353`). The plan assumes gap-aware question selection without describing how to derive coverage (and fund the LLM calls) when you're below threshold.
- `src/lib/source-collector.ts:186` only ingests interview signals from `workspace/interviews/*.json`; storing responses as `memory/onboarding/interview-*.md` will be treated as memory signals, so interview coverage/stats in `analyzeCoverage` (`src/lib/interview.ts:389`) stay zero. Decide whether to emit JSON signals with `source.type='interview'` or adjust the collector.
- `website/README.md:1` and the static "How It Works" section in `website/index.html:150` show the site is plain HTML/CSS with no data pipeline; "record real interview session and replay on landing page" needs a plan for exporting sanitized session data into a static asset plus consent/PII handling, otherwise the demo can't ship or risks leaking raw interview content.
- `src/lib/embeddings.ts:12` lazily downloads/initializes the Xenova model; the plan doesn't address cold-start latency or offline failure when launching an interview from the CLI, so users may sit in a blank prompt while the model loads.

**Minor**
- `src/lib/interview.ts:165` persists raw session JSON without versioning or sanitization; if the question bank changes or the file corrupts, resume may break silently and there's no expiry/cleanup strategy.

tokens used: 285,113
```

</details>
