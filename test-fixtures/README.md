# Test Fixtures

Test data for validating the NEON-SOUL extraction and compression pipeline.

## Directory Structure

```
test-fixtures/
├── souls/
│   ├── raw/              # Downloaded SOUL.md templates from souls.directory
│   ├── principles/       # Extracted principles per template (Single-Source PBD output)
│   ├── axioms/           # Distilled axioms per template (Multi-Source PBD output)
│   └── compressed/       # Final compressed souls (target format)
└── memory/               # Synthetic memory files for testing memory ingestion
```

## Data Sources

| Source | URL | Purpose |
|--------|-----|---------|
| souls.directory | https://souls.directory/ | Public SOUL.md templates |
| onlycrabs.ai | https://onlycrabs.ai | Additional published souls |
| Synthetic | Generated | Memory file ingestion testing |

## Usage

### Phase 1: Template Compression Testing

1. Download templates to `souls/raw/`
2. Run Single-Source PBD → output to `souls/principles/`
3. Run Multi-Source PBD → output to `souls/axioms/`
4. Run compression → output to `souls/compressed/`
5. Measure: token reduction ratio, semantic preservation

### Phase 3: Memory Ingestion Testing

1. Create synthetic memory files in `memory/`
2. Run memory parser → extract signals
3. Run PBD pipeline → compressed soul
4. Validate against expected output

## Metrics

| Metric | Target |
|--------|--------|
| Token reduction | ≥6:1 ratio |
| Principle extraction | 5-15 per template |
| Axiom convergence | 5-7 axioms |
| Semantic preservation | Human evaluation |

---

*See [Soul Bootstrap Pipeline Proposal](../docs/proposals/soul-bootstrap-pipeline-proposal.md) for full methodology.*
