# Semantic Similarity Thresholds for Constraint Matching

**Date**: 2026-02-13
**Purpose**: Calibration guidance for LLM-based semantic classification in agentic skills
**Research Gate**: RG-3 (blocks Phase 2, all stages using semantic matching)
**Sources**: ACL 2024-2025 publications, LLM evaluation literature, embedding research

---

## Executive Summary

This research establishes threshold recommendations for LLM-based semantic similarity in constraint
matching. The agentic skills specification requires semantic classification over pattern matching,
but provides no calibration guidance for confidence thresholds.

**Key finding**: Use tiered thresholds based on action criticality. For safety-critical constraints,
require ≥0.85 similarity with human confirmation for 0.70-0.85. For informational matching, ≥0.70
is acceptable. Graph-based confidence methods outperform single-score approaches.

---

## Part 1: Semantic Similarity Foundations

### 1.1 Embedding-Based Similarity

From [Semantic Similarity Rating (SSR)](https://www.emergentmind.com/topics/semantic-similarity-rating-ssr):

> "SSR frameworks map natural language to numerical scores by calculating cosine similarity between
> LLM-generated responses and curated anchor texts... yielding a probabilistic distribution over ratings."

**For constraint matching**: Define anchor texts for each constraint scope. Compare action
description to anchors. Similarity score = match confidence.

### 1.2 Confidence vs. Accuracy

From [A Survey of Confidence Estimation and Calibration](https://aclanthology.org/2024.naacl-long.366.pdf):

LLM confidence ≠ accuracy. Key findings:
- LLMs are often **overconfident** in their outputs
- Embedding-based similarity is more reliable than self-reported confidence
- Calibration requires domain-specific tuning

### 1.3 BERTScore and Contextual Embeddings

From [LLM Evaluation Metrics](https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation):

> "BERTScore computes cosine similarity between contextual embeddings of words in reference and
> generated texts... Higher scores indicate greater semantic overlap."

BERTScore provides F1, precision, and recall variants. For constraint matching:
- **Precision**: How much of the action matches the constraint scope
- **Recall**: How much of the constraint scope is covered by the action
- **F1**: Balanced measure

---

## Part 2: Threshold Calibration

### 2.1 Industry Threshold Ranges

From academic and industry sources:

| Use Case | Typical Threshold | Source |
|----------|------------------|--------|
| Document similarity | 0.70-0.80 | Information retrieval literature |
| Semantic search | 0.75-0.85 | RAG system defaults |
| Classification | 0.80-0.90 | NLP classification papers |
| Safety-critical | 0.85-0.95 | Medical/legal AI systems |

### 2.2 Recommended Thresholds for Constraint Matching

| Constraint Severity | Match Threshold | Human Review Range | Reject Below |
|---------------------|-----------------|---------------------|--------------|
| **CRITICAL** | ≥0.85 | 0.70-0.85 | <0.70 |
| **IMPORTANT** | ≥0.80 | 0.65-0.80 | <0.65 |
| **MINOR** | ≥0.70 | 0.55-0.70 | <0.55 |

**Rationale**:
- Critical constraints (e.g., git force-push) need high confidence before blocking
- Human review range catches potential matches that need verification
- Reject threshold prevents noise from unrelated actions

### 2.3 Calibration Dataset Approach

From [Trust or Escalate: LLM Judges with Calibration](https://proceedings.iclr.cc/paper_files/paper/2025/file/08dabd5345b37fffcbe335bd578b15a0-Paper-Conference.pdf):

> "A calibration dataset is used to learn a threshold that determines each judge's minimum
> confidence level."

**For agentic skills**:
1. Collect known action→constraint matches (ground truth)
2. Run semantic similarity on all pairs
3. Plot precision/recall at different thresholds
4. Select threshold that achieves target precision (e.g., 95%)

### 2.4 Graph-Based Confidence

From [Graph-based Confidence Calibration](https://arxiv.org/html/2411.02454v1):

> "Organize responses in a graph with pairwise semantic similarity and extract graph statistics
> for confidence estimation."

**Application**: For actions that could match multiple constraints, build a similarity graph.
Use graph centrality to identify the most likely match rather than simple max-similarity.

---

## Part 3: Practical Implementation

### 3.1 Two-Stage Matching

Recommended architecture for constraint-enforcer:

```
Stage 1: Fast Filter (embedding similarity)
├── Action embedding vs constraint scope embeddings
├── Threshold: 0.60 (permissive, catches candidates)
└── Output: Candidate constraint list

Stage 2: Deep Match (LLM semantic classification)
├── Full action context vs constraint full text
├── LLM classifies: MATCH / PARTIAL / NO_MATCH
├── Confidence score: 0.0-1.0
└── Output: Final match decision with confidence
```

**Why two stages**:
- Stage 1 is fast (embedding comparison), filters obvious non-matches
- Stage 2 is accurate (full LLM reasoning), only runs on candidates
- Reduces latency and API costs

### 3.2 Confidence Score Interpretation

| Score Range | Interpretation | Action |
|-------------|----------------|--------|
| ≥0.85 | High confidence match | Apply constraint |
| 0.70-0.85 | Probable match | Apply with warning, log for review |
| 0.55-0.70 | Uncertain | Human confirmation required |
| <0.55 | Unlikely match | Don't apply constraint |

### 3.3 Semantic Scope Definition

Instead of regex patterns, define constraint scope semantically:

```yaml
# Old (pattern-based) - DON'T USE
scope:
  patterns:
    - "git push --force"
    - "git push -f"
    - "git push --force-with-lease"

# New (semantic) - USE THIS
scope:
  description: "Actions that force-push to remote git repositories, overwriting history"
  intent: destructive
  domain: version-control
  anchor_examples:
    - "git push --force origin main"
    - "Force pushing to overwrite remote branch"
    - "Rewriting git history on remote"
```

### 3.4 Handling Edge Cases

**False positives** (constraint incorrectly matched):
- Log with low confidence for human review
- Track D (disconfirmation) counter
- Adjust threshold or scope if pattern emerges

**False negatives** (constraint missed):
- More dangerous for safety-critical constraints
- Use lower thresholds for CRITICAL severity
- Human review range catches borderline cases

---

## Part 4: Uncertainty Quantification

### 4.1 Beyond Single Scores

From [Beyond Semantic Entropy](https://aclanthology.org/2025.findings-acl.234.pdf):

> "SNNE (semantic entropy) is consistently more distinctive than single-score confidence,
> especially when the number of semantic clusters is large."

**For constraint matching**: When multiple constraints could match, uncertainty is higher.
Use entropy-based measures to quantify this.

### 4.2 Multi-Constraint Scenarios

When an action could match multiple constraints:

1. Compute similarity to all active constraints
2. If top match >> second match (e.g., 0.85 vs 0.60): High confidence single match
3. If top matches are close (e.g., 0.82 vs 0.78): Uncertain, flag for review
4. Return all matches above threshold with confidence scores

---

## Part 5: Validation Methodology

### 5.1 Building a Calibration Dataset

For Phase 2 behavioral tests:

1. **Collect ground truth pairs**:
   - Known constraint violations from observations
   - Synthetic examples (action + intended constraint)
   - Negative examples (action that shouldn't match)

2. **Run similarity scoring**:
   - Embedding similarity (Stage 1)
   - LLM classification (Stage 2)

3. **Analyze results**:
   - Precision at various thresholds
   - Recall at various thresholds
   - False positive/negative patterns

### 5.2 Threshold Selection Criteria

Select thresholds that achieve:

| Constraint Severity | Target Precision | Target Recall |
|---------------------|-----------------|---------------|
| CRITICAL | ≥95% | ≥90% |
| IMPORTANT | ≥90% | ≥85% |
| MINOR | ≥85% | ≥80% |

**Trade-off**: Higher precision = fewer false positives but may miss real violations.
For safety-critical constraints, we accept some false positives (human review) to minimize
false negatives (missed violations).

---

## Conclusions

### Recommended Thresholds

| Severity | Match | Review | Reject |
|----------|-------|--------|--------|
| CRITICAL | ≥0.85 | 0.70-0.85 | <0.70 |
| IMPORTANT | ≥0.80 | 0.65-0.80 | <0.65 |
| MINOR | ≥0.70 | 0.55-0.70 | <0.55 |

### Implementation Recommendations

1. **Two-stage matching**: Fast embedding filter + deep LLM classification
2. **Semantic scope definitions**: Natural language descriptions, not patterns
3. **Confidence calibration**: Build calibration dataset from observations
4. **Human review range**: Critical constraints get wider review range
5. **Uncertainty quantification**: Use entropy for multi-constraint scenarios

### Research Gate Status

**RG-3: RESOLVED**

Threshold calibration approach defined with recommended values. Implementation should include
calibration dataset building as part of Phase 2 behavioral tests.

---

## Sources

- [LLM Evaluation Metrics: The Ultimate Guide](https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation)
- [A Survey of Confidence Estimation and Calibration in LLMs](https://aclanthology.org/2024.naacl-long.366.pdf)
- [Graph-based Confidence Calibration for LLMs](https://arxiv.org/html/2411.02454v1)
- [Trust or Escalate: LLM Judges with Calibration](https://proceedings.iclr.cc/paper_files/paper/2025/file/08dabd5345b37fffcbe335bd578b15a0-Paper-Conference.pdf)
- [Beyond Semantic Entropy](https://aclanthology.org/2025.findings-acl.234.pdf)
- [Semantic Similarity Rating (SSR)](https://www.emergentmind.com/topics/semantic-similarity-rating-ssr)

---

*Research completed 2026-02-13 for Phase 2 Research Gate RG-3.*
