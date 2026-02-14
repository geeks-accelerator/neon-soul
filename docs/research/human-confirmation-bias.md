# Human Confirmation Bias in AI Feedback Loops

**Date**: 2026-02-13
**Purpose**: Identify and mitigate cognitive biases in R/C/D counter system
**Research Gate**: RG-5 (blocks Phase 2, Stages 2-3)
**Sources**: Human-AI collaboration research, cognitive psychology, annotation quality studies

---

## Executive Summary

The R/C/D counter system relies on human confirmations (C) and disconfirmations (D) to validate
AI-detected failures. This research identifies cognitive biases that affect human feedback quality
and proposes mitigation strategies.

**Key finding**: Human feedback quality depends more on individual attitudes toward AI than on
training or incentives. Pro-automation attitudes lead to undercorrection (accepting AI errors),
while skepticism leads to overcorrection (rejecting valid detections). Mitigation requires
workflow design that encourages critical evaluation without excessive friction.

---

## Part 1: Identified Biases

### 1.1 Automation Bias (Undercorrection)

From [Bias in the Loop: How Humans Evaluate AI-Generated Suggestions](https://arxiv.org/html/2509.08514v1):

> "Participants with favorable attitudes toward AI exhibited... higher levels of undercorrection
> where incorrect suggestions went undetected."

**For R/C/D system**: Users who trust AI may confirm (C+1) failure detections without verifying
them, inflating C counts with false positives.

**Risk**: Constraints generated from unverified confirmations may be inappropriate.

### 1.2 Skepticism Bias (Overcorrection)

From the same study:

> "Overcorrection [flagging correct suggestions as wrong] increased when annotators reported
> higher skepticism."

**For R/C/D system**: Skeptical users may disconfirm (D+1) valid failure detections, preventing
legitimate constraints from being generated.

**Risk**: Real failure patterns may never reach C≥2 threshold due to excessive D counts.

### 1.3 Anchoring Bias

The study **rejected** anchoring hypotheses:

> "The accuracy of the AI pre-annotation in the first three screens did not influence
> subsequent annotations."

**For R/C/D system**: This is good news—users don't appear to anchor on early AI accuracy.
Each confirmation decision may be relatively independent.

### 1.4 Engagement Decay

From [Error in the Loop](https://journals.sagepub.com/doi/10.1177/2755323X251357643):

> "Incorporating selectively labeled data into training sets can significantly reduce predictive
> accuracy while simultaneously showing false signs of improvement."

**For R/C/D system**: If users stop engaging with confirmations over time (rubber-stamping),
the C/D counts become unreliable. The system may appear to improve while actually degrading.

---

## Part 2: Bias Patterns in Practice

### 2.1 User Profile Mapping

| User Profile | Likely Bias | C/D Pattern | Constraint Risk |
|--------------|-------------|-------------|-----------------|
| AI-trusting | Undercorrection | High C, low D | False positive constraints |
| AI-skeptical | Overcorrection | Low C, high D | Valid constraints blocked |
| Fatigued | Engagement decay | Rubber-stamp C | Unreliable counts |
| Careful reviewer | Balanced | Accurate C/D | Reliable constraints |

### 2.2 Observable Signals

Detect bias patterns through:

| Signal | Pattern | Indicates |
|--------|---------|-----------|
| C/(C+D) ratio consistently >95% | User confirms almost everything | Possible undercorrection |
| C/(C+D) ratio consistently <50% | User rejects most detections | Possible overcorrection |
| Time-to-confirm <5 seconds | Very fast decisions | Possible rubber-stamping |
| Time-to-confirm varies widely | Some decisions take longer | Active engagement |

### 2.3 Session-Level Patterns

From research on annotation fatigue:

- **Early session**: Higher engagement, more careful decisions
- **Mid session**: Peak performance (warmed up, not yet fatigued)
- **Late session**: Declining engagement, faster (less careful) decisions

---

## Part 3: Mitigation Strategies

### 3.1 Workflow Design Mitigations

From [DeBiasMe: De-biasing Human-AI Interactions](https://arxiv.org/html/2504.16770v1):

> "AI literacy approaches should prioritize developing human bias awareness and metacognitive
> skills—the ability to monitor, evaluate, and regulate one's own decision-making processes."

**Strategies**:

| Strategy | Implementation | Effect |
|----------|---------------|--------|
| **Explicit evidence requirement** | Show failure evidence before C/D prompt | Forces engagement with details |
| **Confidence prompt** | "How confident are you in this decision?" | Encourages metacognition |
| **Delay before decision** | 5-second minimum viewing time | Prevents instant rubber-stamping |
| **Explanation requirement** | Optional "why" field for D decisions | Surfaces reasoning gaps |

### 3.2 Counter Validation Checks

Add automated checks for bias signals:

```
# Bias detection rules

if user.c_ratio > 0.95 over last 20 decisions:
    flag "Possible undercorrection - high confirm rate"
    weight recent C counts lower in eligibility calculation

if user.c_ratio < 0.50 over last 20 decisions:
    flag "Possible overcorrection - high disconfirm rate"
    request second opinion on disconfirmed items

if user.avg_decision_time < 5 seconds:
    flag "Possible rubber-stamping - very fast decisions"
    require explanation for next 3 decisions
```

### 3.3 Multi-Reviewer Requirement

The eligibility criteria already requires:
- R ≥ 3 (recurrences from system)
- C ≥ 2 (confirmations from humans)
- sources ≥ 2 (distinct contexts)

**Enhancement**: Require C from at least 2 different users, not just 2 confirmations from
the same user. This mitigates individual bias.

```yaml
# Current
eligibility:
  r_min: 3
  c_min: 2
  sources_min: 2

# Enhanced
eligibility:
  r_min: 3
  c_min: 2
  c_unique_users_min: 2  # NEW: require 2 different humans
  sources_min: 2
```

### 3.4 Calibration Through Feedback

Periodically inject known test cases:

1. **Known true positives**: Failures that definitely warrant constraints
2. **Known false positives**: AI detections that are actually false alarms

Track user accuracy on these known cases. Use accuracy to weight their C/D contributions.

---

## Part 4: R/C/D Counter Refinements

### 4.1 Weighted Confirmations

Instead of simple C+1, weight confirmations by reliability signals:

```
c_weighted = sum(
    confirmation.weight
    for confirmation in confirmations
)

where weight = (
    1.0  # base
    * engagement_factor  # 0.5-1.0 based on decision time
    * accuracy_factor    # 0.5-1.0 based on calibration accuracy
    * recency_factor     # 0.8-1.0 based on session fatigue
)
```

### 4.2 Decay for Unreviewed Detections

If failure detections sit unreviewed for extended periods:

- 7 days: Warning that detection needs review
- 30 days: R count decays (R-1) to prevent stale detections accumulating
- 90 days: Auto-archive if never confirmed

### 4.3 D Count Interpretation

Disconfirmations (D) should not simply cancel confirmations. Consider:

| D Pattern | Interpretation | Action |
|-----------|----------------|--------|
| D early, then C | Initial false positive, later real pattern | Weight recent C higher |
| C early, then D | Pattern changed or misunderstood initially | Investigate change |
| D > C consistently | Systematic false positive or overcorrection | Review constraint scope |
| D from one user only | Individual bias | Require second opinion |

### 4.4 Source Diversity Enhancement

The sources ≥ 2 requirement currently means distinct files/sessions. Enhance to include:

- Different users reporting the same failure
- Different time periods (not all in one day)
- Different contexts (planning vs implementing vs reviewing)

---

## Part 5: Implementation Recommendations

### 5.1 Phase 2 Integration

For failure-tracker and observation-recorder:

1. **Record timing metadata**:
   - Timestamp of detection
   - Timestamp of C/D decision
   - Time between detection presentation and decision

2. **Record user metadata**:
   - User identifier (for multi-user requirement)
   - User's historical C/D ratio
   - User's calibration accuracy (if available)

3. **Implement engagement checks**:
   - Minimum viewing time before C/D allowed
   - Optional explanation field

### 5.2 Phase 2 Monitoring

Add to effectiveness-metrics skill:

- Per-user C/D ratios
- Average decision times
- Bias warning triggers
- Constraint quality correlated with confirmation patterns

### 5.3 Documentation

Update constraint files to track confirmation quality:

```yaml
c_count: 3
c_details:
  - user: user_a
    timestamp: 2026-02-10
    decision_time_seconds: 12
    engagement_score: 0.9
  - user: user_b
    timestamp: 2026-02-11
    decision_time_seconds: 8
    engagement_score: 0.85
  - user: user_a
    timestamp: 2026-02-12
    decision_time_seconds: 3  # Warning: very fast
    engagement_score: 0.5
```

---

## Conclusions

### Key Biases

1. **Undercorrection** (pro-AI users): Over-confirm, inflate C counts
2. **Overcorrection** (skeptical users): Over-reject, inflate D counts
3. **Engagement decay**: Rubber-stamping over time

### Mitigation Summary

1. **Workflow friction**: Minimum viewing time, evidence display, explanation prompts
2. **Multi-user requirement**: C from ≥2 different users, not just ≥2 confirmations
3. **Weighted confirmations**: Factor in engagement time and calibration accuracy
4. **Bias monitoring**: Track C/D ratios, flag anomalies
5. **Calibration testing**: Inject known test cases to measure user accuracy

### Research Gate Status

**RG-5: RESOLVED**

Bias risks identified with practical mitigation strategies. Key enhancement: require
confirmations from multiple users (c_unique_users_min: 2).

---

## Sources

- [Bias in the Loop: How Humans Evaluate AI-Generated Suggestions](https://arxiv.org/html/2509.08514v1)
- [Error in the Loop: How Human Mistakes Can Improve Algorithmic Learning](https://journals.sagepub.com/doi/10.1177/2755323X251357643)
- [DeBiasMe: De-biasing Human-AI Interactions with Metacognitive Interventions](https://arxiv.org/html/2504.16770v1)
- [The AI Learns to Lie to Please You: Preventing Biased Feedback Loops](https://www.mdpi.com/2813-2203/2/2/20)
- [Human in the Loop Machine Learning](https://labelyourdata.com/articles/human-in-the-loop-in-machine-learning)
- [Human-in-the-Loop AI: Why It Matters](https://www.tredence.com/blog/hitl-human-in-the-loop)

---

*Research completed 2026-02-13 for Phase 2 Research Gate RG-5.*
