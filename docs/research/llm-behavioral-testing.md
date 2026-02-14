# LLM Behavioral Testing Patterns

**Date**: 2026-02-13
**Purpose**: Testing methodology for LLM-based classification in agentic skills
**Research Gate**: RG-8 (blocks Phase 2, Stage 1B)
**Sources**: LLM testing frameworks, ML testing literature, CI/CD best practices

---

## Executive Summary

The agentic skills use LLM-based semantic classification for constraint matching, failure detection,
and similarity scoring. Traditional unit testing (exact input→output matching) doesn't work for
probabilistic systems. This research establishes testing patterns that provide confidence without
requiring deterministic behavior.

**Key finding**: Use a three-tier testing approach: (1) deterministic structural tests for CI,
(2) fixture-based semantic tests for regression, and (3) live LLM tests for validation. Combine
with LLM-as-judge evaluation for semantic accuracy.

---

## Part 1: Challenges of Testing LLM Systems

### 1.1 Non-Determinism

From [Challenges in Testing Large Language Model Based Software](https://arxiv.org/html/2503.00481v1):

> "Testing LLMs presents unique challenges due to their non-deterministic behavior and the
> ambiguity inherent in both inputs and outputs."

**For agentic skills**: The same constraint-matching query may produce slightly different
confidence scores on each run. Exact assertion (`expect(score).toBe(0.85)`) will fail intermittently.

### 1.2 Oracle Problem

From [Rethinking Testing for LLM Applications](https://arxiv.org/html/2508.20737v1):

> "The oracle problem—determining whether output is correct—necessitates advances in automated
> oracle design."

**For agentic skills**: What's the "correct" confidence score for a semantic match? There's no
ground truth for many classifications. We need approximate oracles.

### 1.3 Replicability

From [Advancing LLM-Enabled Systems Test Science](https://itea.org/journals/volume-46-3/advancing-the-test-science-of-llm-enabled-systems/):

> "A common desire by stakeholders is that the LLM-enabled system perform in a consistent way,
> even requesting 'near deterministic behavior.'"

**For agentic skills**: CI/CD requires reproducible tests. Flaky tests undermine confidence.

---

## Part 2: Three-Tier Testing Strategy

### 2.1 Overview

| Tier | Test Type | Runs In | LLM Required | Purpose |
|------|-----------|---------|--------------|---------|
| **1** | Structural | CI (always) | No | Validate format, schema, dependencies |
| **2** | Fixture-based | CI (always) | No | Regression testing with recorded responses |
| **3** | Live LLM | Local / nightly | Yes | Semantic accuracy validation |

### 2.2 Tier 1: Structural Tests (Deterministic)

From [LLM Testing: A Practical Guide](https://langfuse.com/blog/2025-10-21-testing-llm-applications):

> "Deterministic tests use fixed inputs and expected outputs to yield clear pass/fail outcomes,
> providing an objective and reproducible framework."

**What to test**:
- SKILL.md files parse correctly (YAML frontmatter, markdown structure)
- Output schemas are valid (JSON structure, required fields)
- Dependencies are available (referenced skills exist)
- File paths resolve correctly

**Example**:
```typescript
describe('structural tests', () => {
  it('failure-tracker outputs valid observation schema', () => {
    const output = runSkill('failure-tracker', mockInput);
    expect(output).toMatchSchema(observationSchema);
    expect(output.r_count).toBeNumber();
    expect(output.sources).toBeArray();
  });
});
```

### 2.3 Tier 2: Fixture-Based Tests (Recorded Responses)

Record LLM responses for known inputs, use as fixtures in CI:

**Fixture generation**:
```typescript
// Run once with real LLM, save responses
const response = await realLLM.classify(action, constraintScope);
saveFixture('git-push-force-match', { input: action, output: response });
```

**Fixture-based test**:
```typescript
describe('fixture-based semantic tests', () => {
  it('matches git force-push to safety constraint', () => {
    const fixture = loadFixture('git-push-force-match');
    const result = runClassificationWithFixture(fixture);

    // Test structure and approximate values
    expect(result.matched).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.constraint_id).toBe('git-safety-force-push');
  });
});
```

**Key principle**: Fixtures test integration and structure. They don't validate semantic accuracy
(that requires live LLM), but they catch regressions in processing logic.

### 2.4 Tier 3: Live LLM Tests (Semantic Validation)

Run with real LLM to validate semantic accuracy. Expensive, so run less frequently.

**When to run**:
- Local development (manual)
- Nightly CI builds
- Pre-release validation
- After model version changes

**Example**:
```typescript
describe.skipIf(!process.env.USE_REAL_LLM)('live LLM tests', () => {
  it('correctly classifies destructive git actions', async () => {
    const actions = [
      { input: 'git push --force origin main', expectedMatch: true },
      { input: 'git push -f origin feature', expectedMatch: true },
      { input: 'git push origin main', expectedMatch: false },
      { input: 'force push to overwrite history', expectedMatch: true },
    ];

    for (const { input, expectedMatch } of actions) {
      const result = await classify(input, 'git-safety-force-push');
      expect(result.matched).toBe(expectedMatch);
      if (expectedMatch) {
        expect(result.confidence).toBeGreaterThan(0.7);
      }
    }
  });
});
```

---

## Part 3: Evaluation Methods

### 3.1 LLM-as-Judge

From [LLM Testing in 2026](https://www.confident-ai.com/blog/llm-testing-in-2024-top-methods-and-strategies):

> "LLM-as-a-judge techniques... use natural language evaluation criteria."

Use a separate LLM to evaluate whether classifications are correct:

```typescript
const evaluationPrompt = `
Given:
- Action: "${action}"
- Constraint scope: "${constraintScope}"
- Classification result: ${result.matched ? 'MATCH' : 'NO MATCH'}
- Confidence: ${result.confidence}

Evaluate: Is this classification correct? Consider:
1. Does the action semantically match the constraint scope?
2. Is the confidence level appropriate?
3. Would a reasonable human make the same classification?

Respond with: CORRECT, INCORRECT, or UNCERTAIN
`;

const evaluation = await evaluatorLLM.complete(evaluationPrompt);
```

### 3.2 Threshold-Based Assertions

Don't assert exact values. Assert ranges:

```typescript
// Bad: exact assertion (will flake)
expect(confidence).toBe(0.85);

// Good: range assertion
expect(confidence).toBeGreaterThan(0.7);
expect(confidence).toBeLessThan(1.0);

// Better: severity-appropriate thresholds
if (constraint.severity === 'CRITICAL') {
  expect(confidence).toBeGreaterThan(0.85);
} else {
  expect(confidence).toBeGreaterThan(0.70);
}
```

### 3.3 Consistency Testing

Test that similar inputs produce similar outputs:

```typescript
it('classifies semantically equivalent actions consistently', async () => {
  const equivalentActions = [
    'git push --force origin main',
    'git push -f origin main',
    'Force push to main branch',
    'Overwrite remote main with force',
  ];

  const results = await Promise.all(
    equivalentActions.map(a => classify(a, 'git-safety-force-push'))
  );

  // All should match
  expect(results.every(r => r.matched)).toBe(true);

  // Confidence scores should be similar (within 0.15)
  const confidences = results.map(r => r.confidence);
  const maxDiff = Math.max(...confidences) - Math.min(...confidences);
  expect(maxDiff).toBeLessThan(0.15);
});
```

---

## Part 4: CI/CD Integration

### 4.1 Test Matrix

| Environment | Tier 1 (Structural) | Tier 2 (Fixture) | Tier 3 (Live LLM) |
|-------------|---------------------|------------------|-------------------|
| PR checks | ✅ Always | ✅ Always | ❌ Skip |
| Main branch | ✅ Always | ✅ Always | ⚠️ Nightly only |
| Pre-release | ✅ Always | ✅ Always | ✅ Full suite |
| Local dev | ✅ On request | ✅ On request | ✅ With env var |

### 4.2 GitHub Actions Example

```yaml
jobs:
  test-structural:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test -- --grep "structural"

  test-fixtures:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test -- --grep "fixture"

  test-live-llm:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' || github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: npm test -- --grep "live LLM"
        env:
          USE_REAL_LLM: true
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### 4.3 Fixture Management

Store fixtures in version control:

```
tests/
├── fixtures/
│   ├── llm-responses/
│   │   ├── git-push-force-match.json
│   │   ├── git-push-normal-no-match.json
│   │   └── semantic-equivalent-group.json
│   └── README.md  # Documents fixture generation process
└── e2e/
    └── skill-behavior.test.ts
```

**Fixture refresh**: Regenerate fixtures when:
- LLM model version changes
- Constraint scopes are updated
- Test coverage expands

---

## Part 5: Behavioral Test Categories

### 5.1 Classification Tests

| Category | Input | Expected | Assertion |
|----------|-------|----------|-----------|
| True positive | Action that violates constraint | matched: true, confidence > 0.7 | Match detected |
| True negative | Action unrelated to constraint | matched: false | No false alarm |
| Semantic equivalence | Same action, different wording | All matched or all not | Consistency |
| Edge cases | Ambiguous actions | Reasonable confidence | No crash |

### 5.2 Regression Tests

Capture known good behavior:

```typescript
describe('regression: previously fixed issues', () => {
  it('distinguishes git push from git push --force', async () => {
    // Regression from issue #123: normal push was incorrectly matched
    const normalPush = await classify('git push origin main', 'git-safety-force-push');
    expect(normalPush.matched).toBe(false);
  });
});
```

### 5.3 Robustness Tests

Test system handles edge cases gracefully:

```typescript
describe('robustness', () => {
  it('handles empty input', async () => {
    const result = await classify('', 'git-safety-force-push');
    expect(result.matched).toBe(false);
    expect(result.error).toBeUndefined();
  });

  it('handles very long input', async () => {
    const longInput = 'git push '.repeat(1000);
    const result = await classify(longInput, 'git-safety-force-push');
    expect(result.error).toBeUndefined();
  });

  it('handles non-English input', async () => {
    const japaneseInput = 'gitにフォースプッシュする';
    const result = await classify(japaneseInput, 'git-safety-force-push');
    // Should either match (semantic understanding) or gracefully not match
    expect(result.error).toBeUndefined();
  });
});
```

---

## Part 6: Tools and Frameworks

### 6.1 Recommended Tools

From [LLM Testing in 2026](https://www.confident-ai.com/blog/llm-testing-in-2024-top-methods-and-strategies):

| Tool | Stars | Strength | Use For |
|------|-------|----------|---------|
| DeepEval | 5.1k | Comprehensive metrics | Semantic evaluation |
| Promptfoo | 5.6k | Prompt testing | Constraint scope validation |
| Langfuse | N/A | Observability | Production monitoring |

### 6.2 Vitest Integration

For agentic skills (using Vitest per CLAUDE.md):

```typescript
import { describe, it, expect } from 'vitest';
import { describeWithLLM } from './helpers/llm-test-helper';

// Tier 1: Always runs
describe('structural', () => { ... });

// Tier 2: Always runs
describe('fixture-based', () => { ... });

// Tier 3: Conditional on environment
describeWithLLM('live LLM', () => { ... });
```

**Helper implementation**:
```typescript
export const describeWithLLM = process.env.USE_REAL_LLM
  ? describe
  : describe.skip;

export const itWithLLM = process.env.USE_REAL_LLM
  ? it
  : it.skip;
```

---

## Conclusions

### Testing Strategy

1. **Tier 1 (Structural)**: Always run, deterministic, fast
2. **Tier 2 (Fixtures)**: Always run, recorded responses, catches regressions
3. **Tier 3 (Live LLM)**: Conditional, validates semantic accuracy

### Key Patterns

1. **Range assertions**: `> 0.7` not `=== 0.85`
2. **Consistency tests**: Similar inputs → similar outputs
3. **LLM-as-judge**: Separate evaluator for semantic correctness
4. **Fixture management**: Version control, refresh on model changes

### Phase 2 Implementation

For Stage 1B behavioral tests:
1. Implement `describeWithLLM` / `itWithLLM` helpers
2. Create fixture generation script
3. Build initial fixture set from existing observations
4. Add structural tests for all Phase 2 skills
5. Add fixture-based semantic tests
6. Add live LLM validation suite (skip in CI by default)

### Research Gate Status

**RG-8: RESOLVED**

Testing methodology established with three-tier approach. Implementation guidance provided
for Vitest integration and CI/CD pipeline.

---

## Sources

- [LLM Testing in 2026: Top Methods and Strategies](https://www.confident-ai.com/blog/llm-testing-in-2024-top-methods-and-strategies)
- [Challenges in Testing Large Language Model Based Software](https://arxiv.org/html/2503.00481v1)
- [Rethinking Testing for LLM Applications](https://arxiv.org/html/2508.20737v1)
- [LLM Testing: A Practical Guide](https://langfuse.com/blog/2025-10-21-testing-llm-applications)
- [Advancing LLM-Enabled Systems Test Science](https://itea.org/journals/volume-46-3/advancing-the-test-science-of-llm-enabled-systems/)
- [Evaluating LLMs with LangChain](https://orangeloops.com/2025/10/evaluating-llms-with-langchain-testing-benchmarking-methods/)

---

*Research completed 2026-02-13 for Phase 2 Research Gate RG-8.*
