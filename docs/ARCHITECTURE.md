# Heart/Brain Intake — Simplified Architecture (Axioms + Principles as Agent Governors)

*(Updated plain-language documentation; no code examples.)*

## Purpose

This system ingests **artifacts** (notes, chats, essays, links, documents) and turns them into **governance** for an autonomous agent:

- **Axioms** = non‑negotiable constraints (identity + hard boundaries)
- **Principles** = operating rules and trade‑off guidance (how to act within constraints)

Artifacts are processed in the background into structured outputs that can be compiled into an “agent compass” and activated only after review.

---

## Key idea: Two layers of governance

### Axioms (constraints)
Axioms are the agent’s *always‑true* guardrails: what it must preserve, protect, and refuse to violate.

### Principles (operating rules)
Principles are the agent’s *default behavior rules*: how it chooses among options, what it optimizes for, and how it explains decisions.

> **Constraints → Possibility:** A principle is a constraint plus the “enabler” that makes good action possible.

---

## Agent governor format (Compass Compact)

Below is the compact governor format this system can compile into. It contains:
- **Five Axioms**
- **Ten Principles**
- A consistent trade‑off order (e.g., Safety > Honesty > Correctness > Helpfulness > Efficiency)

# [針・極小] Compact Compass

## 五理 (Five Axioms)

1. **誤容** - Pragmatic Fallibilism (approach truth, design for revision)
2. **尊護** - Care + Dignity as Constraints (first, do no harm)
3. **徳匠** - Virtues for Builders (character is craft)
4. **果重** - Consequences Over Intentions (results matter)
5. **言創** - Language Shapes Worlds (words create reality)

## 十則 (Ten Principles)

**序** (Hierarchy): 安全>誠実>正確>助益>効率 (Safety > Honesty > Correctness > Helpfulness > Efficiency)

1. **安** Safety - Never ship unsafe
2. **誠** Honesty & Accuracy - Declare uncertainty
3. **私** Privacy & Consent - Protect secrets
4. **証** Evidence & Verification - Measure, don't guess
5. **長** Long-View & Strategy - Think future-maintainer
6. **比** Proportionality & Efficiency - Right-size solutions
7. **責** Accountability & Repair - Own mistakes
8. **尊** Respect & Inclusion - Dignity for all
9. **省** Reflection - Pause before action
10. **精** Precision of Metaphor - Constructive language

## 型 (Pattern)

**制約→可能** (Constraints Enable)

Every principle = constraint + enabler. Limits create possibilities.

## Usage

**When to use this compact version**:
- Embedded in templates (observations, plans, agent specs) - unavoidably present
- Quick hierarchy check during decisions
- Refreshing memory without full compass load

**When to use full compass** (a long-form compass template):
- Post-compaction session start (complete learning, 3-5 min)
- Deep understanding needed (examples, explanations)
- Principle conflicts requiring trade-off analysis

**Architecture**: Context injection (embedded), NOT procedural checkpoints ("remember to load")

---

## Governor evolution (bootstrapping + drift control)

This system is designed so the **governor content can grow and change** while the agent stays stable and explainable.

### What is “fixed” vs “adaptive”
- **Fixed:** the *format* (Axioms + Principles), the *lifecycle*, and the *activation rules*.
- **Adaptive:** the actual Axiom/Principle statements, which can be proposed from new artifacts.

### Bootstrapping (v0)
You start with a minimal, sensible **v0 Compass** so the agent can behave coherently on day one and so the pipeline has a target structure to compile into.

### Lifecycle (how governors change safely)
New artifacts create **candidates**, which move through states:

1) **Candidate** — extracted from an artifact (with citations)
2) **Draft Principle** — deduped/merged and tracked with evidence
3) **Axiom Candidate** — strong rule that may become a constraint
4) **Pending Compass version** — a compiled set for review
5) **Approved** — accepted for use
6) **Active** — the current governors the agent runs on

### Promotion rules (simple defaults)
- Promote to **Principle** when it repeats, has clear meaning, and doesn’t conflict with active axioms.
- Promote to **Axiom** only with higher evidence, low ambiguity, and explicit approval.
- Use **Shadow** evidence to block or downgrade items (anti-patterns, failures, contradictions).

### Versioning and rollback
Governors should be **versioned**, not edited in place:
- new versions supersede old ones
- you can audit why something changed
- you can roll back if behavior regresses

### Where “autonomy” should live
To avoid identity drift:
- keep **Axioms slow-changing**
- allow **Principles medium-changing**
- allow **tactics/playbooks fast-changing** (optional layer) for day-to-day optimization

---

---

## System overview

## Tech stack (plain terms)

- **Language:** Built in **Go (Golang)** for a single, easy-to-deploy backend binary.
- **Storage:** A small persistent store for artifacts, derived outputs, and versioned governor sets.
- **Background jobs:** A durable task queue / scheduler so uploads trigger **classify → distill → summarize** reliably (retries, dependency ordering).
- **Vector database (similarity search):** Stores embeddings for summaries so the system can:
  - find near-duplicates,
  - cluster related artifacts,
  - and help merge overlapping principles.

This section is intentionally lightweight: it describes *what each piece is for* without tying the design to any one vendor.

---

### Inputs
- Artifacts: text, links, documents, transcripts, notes, etc.

### Outputs
For each artifact, the system produces:
1) **Normalized text** (what was said)
2) **Distillation** (structured extraction)
3) **Short summary** (for similarity matching & search)

From many artifacts over time, the system produces:
- A growing set of **Principles**
- A smaller, higher‑confidence set of **Axioms**
- A compiled, versioned **Agent Compass** that can be activated after approval

---

## Core objects (simple definitions)

### Artifact
A piece of source material you uploaded.

Common fields:
- id, title
- original format (pdf, markdown, text, link)
- extracted/normalized text
- provenance tag: heart | brain | shadow | inbox
- timestamps and source references

### Principle
A behavioral rule distilled from artifacts.
- Can be soft, contextual, or situational
- Gains confidence as it appears across artifacts (N‑count)

### Axiom
A high‑confidence principle promoted into a constraint.
- Fewer in number
- Requires stronger evidence and/or explicit confirmation

### Governor Set (Agent Compass)
A versioned bundle:
- Five Axioms (constraints)
- Ten Principles (operating rules)
- Optional calibration notes (known tensions and how to handle them)

---

## Processing pipeline (three steps)

Artifacts flow through a simple, reliable pipeline:

### Step 1 — Classify + Normalize
- Identify artifact kind and format
- Extract text and normalize it
- Assign provenance tag (heart/brain/shadow/inbox)

### Step 2 — Distill (Principles + Axiom candidates)
- Extract candidate **Principles**
- Extract candidate **Axioms** (stronger statements)
- Attach citations back to artifact segments

### Step 3 — Summarize (for matching & retrieval)
- Create a compact summary of the distillation
- This supports similarity search, deduping, and clustering

---

## Promotion: How Principles become Axioms

Axioms should be harder to create than principles.

Suggested promotion rules:
- Minimum evidence threshold (N‑count)
- No unresolved contradictions with existing axioms
- Optional “human confirm” gate
- Shadow track can block promotion (anti‑pattern evidence)

Result:
- Many principles, few axioms
- The compass stays stable and readable

---

## Merging and conflict handling (how we keep it sane)

### Canonical meaning beats stylistic notation
Even if some statements are written differently, merge on:
- A shared anchor (key term / concept)
- Plain‑language meaning
- Evidence trail (sources + counts)

### Three types of conflict
When two extracted items disagree, classify the tension:
1) **Resolvable**: rewrite into a single clearer rule
2) **Productive**: keep both, add a calibration note (“when X, prefer A; when Y, prefer B”)
3) **Fundamental**: requires human decision (or becomes a shadow rule: “avoid this pattern”)

---

## Background job system (reliable processing)

Uploads do not do heavy work inline. Instead:
- Upload creates an Artifact record
- The system enqueues tasks for classify → distill → summarize
- Workers execute tasks with persistence and retries
- Dependencies ensure steps happen in the right order

This gives you:
- reliability (no lost work)
- scalability (many uploads)
- observability (task status + errors)

---

## Versioning and activation

The system periodically compiles a new **Governor Set** (Agent Compass):
- status: draft/pending → approved → active
- only one active version at a time
- older versions remain for audit and rollback

---

## User flow

**Upload → Extract → Propose Governors → Review → Activate**

And present the output as:
- “Proposed Axioms (constraints)”
- “Proposed Principles (operating rules)”
- “Notes (tensions / exceptions / avoid)”

Optional provenance labels can be shown only when helpful.
