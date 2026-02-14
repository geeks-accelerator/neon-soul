# Plan: Ollama LLM Provider for E2E Testing

**Date**: 2026-02-08
**Status**: Complete
**Project**: projects/live-neon/neon-soul
**Trigger**: think hard
**Cross-Reference**: [E2E Testing Plan](./2026-02-09-e2e-testing.md)

---

## Summary

Create an Ollama-based LLM provider for neon-soul that enables real end-to-end testing without external API keys. This allows semantic validation of the full synthesis pipeline using local LLM inference.

**Goal**: Programmatic E2E testing with real LLM via Ollama.

**Relationship to E2E Testing Plan**: This plan addresses Gap #5 from the E2E testing plan: "Real LLM - Semantic behavior untested". The E2E testing plan (2026-02-09) established mock-based testing; this plan extends it with real LLM testing capability.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/llm-providers/ollama-provider.ts` | Create | OllamaLLMProvider implementation |
| `src/lib/llm-providers/index.ts` | Create | Provider exports |
| `docker/docker-compose.yml` | Modify | Add Ollama service (optional profile) |
| `docker/docker-compose.ollama.yml` | Create | Ollama-only compose for dev |
| `tests/e2e/real-llm.test.ts` | Create | E2E tests with real LLM |
| `tests/e2e/ollama-provider.test.ts` | Create | Provider unit tests |

---

## Context

### LLMProvider Interface (from `src/types/llm.ts`)

```typescript
interface LLMProvider {
  classify<T extends string>(
    prompt: string,
    options: ClassifyOptions<T>
  ): Promise<ClassificationResult<T>>;

  classifyBatch?<T extends string>(
    prompts: string[],
    options: ClassifyOptions<T>
  ): Promise<ClassificationResult<T>[]>;

  generate?(prompt: string): Promise<GenerationResult>;
}
```

### Ollama OpenAI-Compatible API

Ollama exposes: `http://localhost:11434/v1/chat/completions`
- Compatible with OpenAI SDK
- Supports structured output via JSON mode
- Models: `llama3`, `mistral`, `phi3`, `neural-chat`

### Testing Strategy (from E2E Testing Plan)

The E2E testing plan established:
1. Mock LLM for deterministic CI tests (fast, repeatable)
2. Real file I/O verification
3. State persistence testing
4. Safety rails testing

This plan adds:
5. Real LLM testing (semantic validation, slower, optional)

---

## Stages

### Stage 1: Docker Ollama Setup ✅ COMPLETE

**Purpose**: Add Ollama service to Docker environment

**Files Created**:
- `docker/docker-compose.ollama.yml` - Standalone Ollama for dev
- `docker/docker-compose.yml` - Updated with Ollama profile

**Usage**:
```bash
# Standalone Ollama
docker compose -f docker/docker-compose.ollama.yml up -d

# Or with full stack (OpenClaw + Ollama)
docker compose --profile ollama up -d
```

**Commit**: `feat(neon-soul): add Ollama Docker configuration`

---

### Stage 2: OllamaLLMProvider Implementation ✅ COMPLETE

**File**: `src/lib/llm-providers/ollama-provider.ts`

**Purpose**: Implement LLMProvider interface using Ollama's OpenAI-compatible API

**Design**:
- Use native fetch (no OpenAI SDK dependency)
- Parse LLM responses to extract classification category
- Support both `classify()` and `generate()` methods
- Configurable model and base URL

**Key Implementation Details**:

1. **classify()**: Send chat completion request, parse response to extract category
   - Use system prompt to constrain output format
   - Extract category from response using regex/parsing
   - Calculate confidence from response patterns

2. **generate()**: Direct text generation for notation
   - Simple chat completion
   - Return raw text response

3. **Error Handling**:
   - Connection refused → clear error message
   - Invalid response → fallback to first category with low confidence
   - Timeout handling (local LLM can be slow)

**Acceptance Criteria**:
- [x] Implements all LLMProvider methods
- [x] Works with llama3 and mistral models
- [x] Handles Ollama not running gracefully
- [x] Timeout configurable (default 30s for local inference)

**Commit**: `feat(neon-soul): implement OllamaLLMProvider`

---

### Stage 3: Provider Unit Tests ✅ COMPLETE

**File**: `tests/e2e/ollama-provider.test.ts`

**Purpose**: Test OllamaLLMProvider in isolation

**Test Cases**:
1. `creates provider with default config`
2. `creates provider with custom base URL`
3. `classify returns valid category from options`
4. `generate returns text response`
5. `handles connection refused gracefully`
6. `respects timeout configuration`

**Skip Strategy**: Tests require Ollama running. Skip if not available:
```typescript
const ollamaAvailable = await checkOllamaHealth();
describe.skipIf(!ollamaAvailable)('OllamaLLMProvider', () => { ... });
```

**Acceptance Criteria**:
- [x] Tests pass when Ollama running
- [x] Tests skip gracefully when Ollama not available
- [x] No hardcoded model assumptions (configurable)

**Commit**: `test(neon-soul): add OllamaLLMProvider tests`

---

### Stage 4: Real LLM E2E Tests ✅ COMPLETE

**File**: `tests/e2e/real-llm.test.ts`

**Purpose**: Full pipeline tests with real LLM

**Test Cases**:
1. `synthesis produces meaningful axioms with real LLM`
2. `classification accuracy on known inputs`
3. `signal extraction finds real signals`
4. `notation generation produces valid format`
5. `full synthesis cycle with real content`

**Environment Toggle**:
```typescript
const USE_REAL_LLM = process.env.USE_REAL_LLM === 'true';
const llm = USE_REAL_LLM
  ? new OllamaLLMProvider({ model: 'llama3' })
  : createMockLLM();
```

**Relationship to Existing E2E Tests**:
| Test File | LLM | Purpose |
|-----------|-----|---------|
| `live-synthesis.test.ts` | Mock | Pipeline mechanics |
| `real-environment.test.ts` | Mock | File I/O verification |
| `state-persistence.test.ts` | Mock | State across runs |
| `safety-rails.test.ts` | Mock | Security mechanisms |
| `real-llm.test.ts` | Real | Semantic validation |

**Acceptance Criteria**:
- [x] Tests pass with `USE_REAL_LLM=true` when Ollama running
- [x] Tests skip when Ollama not available
- [x] Clear distinction from mock-based tests

**Commit**: `test(neon-soul): add real LLM E2E tests`

---

### Stage 5: Documentation ✅ COMPLETE

**Files**: `docker/README.md`

**Content**:
1. How to start Ollama
2. How to pull models
3. How to run real LLM tests
4. Model recommendations

**Acceptance Criteria**:
- [x] Clear setup instructions
- [x] Model selection guidance

**Commit**: `docs(neon-soul): document Ollama integration`

---

## Verification

```bash
# 1. Start Ollama
docker compose -f docker/docker-compose.ollama.yml up -d

# 2. Pull model
docker exec neon-soul-ollama ollama pull llama3

# 3. Verify Ollama responding
curl http://localhost:11434/api/tags

# 4. Run provider tests
npm test tests/e2e/ollama-provider.test.ts

# 5. Run real LLM E2E tests
USE_REAL_LLM=true npm test tests/e2e/real-llm.test.ts

# 6. Run full test suite (mock tests unaffected)
npm test
```

---

## Technical Details

### OllamaLLMProvider Structure

```typescript
interface OllamaConfig {
  baseUrl?: string;       // Default: http://localhost:11434
  model?: string;         // Default: llama3
  timeout?: number;       // Default: 30000 (30s)
}

class OllamaLLMProvider implements LLMProvider {
  constructor(config?: OllamaConfig);

  async classify<T>(prompt: string, options: ClassifyOptions<T>): Promise<ClassificationResult<T>>;
  async generate(prompt: string): Promise<GenerationResult>;

  // Health check utility
  static async isAvailable(baseUrl?: string): Promise<boolean>;
}
```

### Model Selection

| Model | Size | Speed | Quality | Recommendation |
|-------|------|-------|---------|----------------|
| llama3 | 8B | Medium | High | Default choice |
| mistral | 7B | Fast | Good | Fast iteration |
| phi3 | 3.8B | Fast | Medium | Resource-limited |

---

## Testing Strategy Summary

### Two-Track Testing Approach

**Track 1: Mock LLM (CI/Fast)**
- All existing tests in `tests/e2e/*.test.ts`
- Deterministic, fast, no external dependencies
- Runs on every commit/PR

**Track 2: Real LLM (Semantic Validation)**
- `tests/e2e/real-llm.test.ts`
- Requires Ollama running
- Run manually or in dedicated semantic validation pipeline
- Toggle: `USE_REAL_LLM=true`

### When to Use Each

| Scenario | Track |
|----------|-------|
| CI/CD pipeline | Mock (Track 1) |
| Local development | Mock (Track 1) |
| Semantic accuracy validation | Real (Track 2) |
| Prompt engineering iteration | Real (Track 2) |
| Pre-release validation | Both |

---

## Rollback Plan

If Ollama integration causes issues:
1. Real LLM tests are isolated (`tests/e2e/real-llm.test.ts`)
2. Provider is opt-in via environment variable
3. All existing mock tests continue to work
4. Docker compose changes are in separate file

---

## Cross-References

- **E2E Testing Plan**: `docs/plans/2026-02-09-e2e-testing.md`
- **E2E Testing Findings**: `docs/issues/e2e-testing-findings.md`
- **LLM Types**: `src/types/llm.ts`
- **Mock LLM**: `tests/mocks/llm-mock.ts`
- **Semantic Classifier**: `src/lib/semantic-classifier.ts`
- **Pipeline**: `src/lib/pipeline.ts`
- **Docker Setup**: `docker/docker-compose.yml`
