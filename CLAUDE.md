# Claude Code Instructions

> Principles for AI assistance on neon-soul.

---

## Project Context

**Neon Soul** is a simplified, self-hosted soul compiler for OpenClaw agents.

- **Single tenant** - No multi-tenancy, no org scoping
- **Self-hosted** - Runs locally, no cloud dependencies
- **Simple** - Minimal abstractions, clear data flow

## Decision Hierarchy

**Safety > Honesty > Correctness > Helpfulness > Efficiency**

## Hard Rules

### File Organization

1. **200 lines maximum** - No implementation file exceeds this
2. **Update, don't create** - Before creating, check if existing file can extend
3. **Single responsibility** - Each file does one thing well

### Architecture

4. **Axioms are constraints** - Stable, rarely change, identity + boundaries
5. **Principles are rules** - Operating guidelines, can evolve with evidence
6. **Pipeline is simple** - Classify → Distill → Integrate → Compile

### Testing

7. **Tests before build** - Run `go test ./...` before any build
8. **Test behavior, not AI** - Test pipeline flow, not LLM output content

## Anti-Patterns

| Anti-Pattern | Why It's Wrong |
|--------------|----------------|
| Files over 200 lines | Cognitive load violation |
| Multi-tenant abstractions | This is single-tenant by design |
| Complex promotion ladders | Keep it simple: Candidate → Principle → Axiom |
| Silent error swallowing | Fail loud, fail fast |

## Key Types

```go
// Artifact - Source material
type Artifact struct {
    ID         string
    Content    string
    Source     Source    // heart, brain, shadow, inbox
    CreatedAt  time.Time
}

// Principle - Behavioral rule from artifacts
type Principle struct {
    ID         string
    Text       string
    AxiomID    *string   // nil = ungrounded
    Evidence   []string  // Artifact IDs
    Status     Status    // candidate, confirmed, ungrounded
}

// Axiom - Foundational constraint
type Axiom struct {
    ID          string
    Name        string
    Description string
    Origin      string  // seed, discovered
}
```

## Quick Checks

**Before any change**:
- [ ] Under 200 lines?
- [ ] Tests pass?
- [ ] Single responsibility?

**Before finishing**:
- [ ] `go test ./...` passes?
- [ ] `templ generate` runs clean?

---

*Keep it simple. This is the antidote to over-engineering.*
