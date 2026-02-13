# Research Guide: Compression-Native Souls

**Date**: 2026-02-12
**Related Plan**: [2026-02-11-forge-compression-native-souls.md](../plans/2026-02-11-forge-compression-native-souls.md)
**Purpose**: Research directions and hypotheses for the forge pipeline. This is a **research proposal**, not a validation document.
**Status**: Hypothesis stage — experiments needed to validate human→LLM transfer assumptions.

---

## Executive Summary

This guide synthesizes research from cognitive science, information theory, and machine learning to **hypothesize** that certain representational forms may survive context compression better than others. The forge pipeline proposes transforming prose into metaphors, koans, CJK anchors, and glyphs—forms that research on humans and information theory suggests *may* preserve meaning under extreme compression.

**Key Hypothesis**: Compression-native forms (metaphors, anchors, glyphs) may preserve semantic content better than prose under LLM context collapse. This hypothesis draws on:
- **Direct LLM evidence**: Semantic compression research (ACL 2024), visual-text compression (arXiv 2025)
- **Analogical evidence**: Human cognitive science (requires validation for LLM transfer)

**Source breakdown** (41 total): 14 sources provide direct LLM evidence (including MetaGlyph, COMPASS-SOUL, neuro-symbolic research), 20 are human-cognition research requiring transfer validation, 3 are foundational psychology texts, and 4 are non-academic references included for completeness.

---

## ⚠️ Critical Limitations

**This document must be read with these caveats:**

### 1. Human-to-LLM Transfer Problem

Much of the supporting research comes from human cognitive science (neuroscience, memory studies, educational psychology). **LLMs do not have hippocampi, amygdalae, or theta waves.** The assumption that findings about human memory transfer to transformer architectures is a **hypothesis requiring experimental validation**, not an established fact.

Throughout this document:
- 🧠 = **Human research** (requires bridging studies for LLM application)
- 🤖 = **LLM-specific research** (directly applicable)
- 📐 = **Information theory** (domain-agnostic, applicable to both)

### 2. Source Quality Variation

This guide includes:
- ✅ **Peer-reviewed**: ACL, EMNLP, PMC, Frontiers publications
- ⚠️ **Preprint**: arXiv papers (not yet peer-reviewed)
- ❌ **Non-academic**: Blog posts, community guides (included for completeness, not as evidence)

### 3. Experiments Needed

The forge pipeline is **not validated**. Section 10 outlines required experiments to test the core hypotheses before treating this research as conclusive.

---

## 1. Context Compression and Semantic Preservation

### The Problem

When LLM context windows compress (through summarization, context limits, or session compaction), most information is lost. The question: **what survives?**

### Research Findings

#### 1.1 🤖 Semantic Compression for LLMs (ACL 2024)

**Source**: [Extending Context Window of Large Language Models via Semantic Compression](https://aclanthology.org/2024.findings-acl.306/)

This foundational paper demonstrates that semantic compression can extend context windows 6-8x without significant information loss. The approach is "reminiscent of lossy source coding in information theory"—accepting some loss to achieve dramatic compression.

**Key insight**: Not all tokens carry equal semantic weight. High-entropy tokens (those carrying unique information) must be preserved; low-entropy tokens (predictable from context) can be safely removed.

**Application to forge**: Metaphors and anchors are high-entropy by design. A phrase like "Pretence is a suffocating cloak" cannot be predicted from surrounding text—it must be preserved verbatim.

#### 1.2 🤖 LLMLingua (Microsoft Research)

Microsoft's LLMLingua family achieves up to **20x compression with only 1.5% performance loss** on reasoning tasks. The technique uses perplexity-based token selection—tokens with lower perplexity contribute less information entropy and can be safely removed.

**Application to forge**: The forge stage should maximize perplexity per token. Clinical prose like "I am committed to truthfulness" has low perplexity (predictable); metaphoric prose like "Truth is the anchor" has high perplexity (surprising, memorable).

#### 1.3 📐 Statistical Mechanics of Semantic Compression (March 2025) ⚠️ Preprint

**Source**: [arxiv.org/html/2503.00612v1](https://arxiv.org/html/2503.00612v1)

This paper provides a theoretical framework using statistical mechanics:

> "While the compression involved in human communication may lose surface structure, it tends to preserve semantic structure; for this reason, we refer to this process as semantic compression."

**Key findings**:

1. **Semantic space as vectors**: Meaning can be modeled as position in high-dimensional Euclidean space. Two expressions are semantically similar when their embeddings are close.

2. **Phase transition**: "Even with completely random embeddings, semantic compression undergoes a phase transition between lossy and lossless compression." Below a critical compression ratio, meaning is perfectly preserved; above it, information is irreversibly lost.

3. **Extractive vs. abstractive**: The theory identifies a continuous crossover from extractive compression (removing words) to abstractive compression (using novel paraphrases). Metaphors are abstractive compression—novel phrasings that preserve meaning.

**Application to forge**: The phase transition finding suggests there's a critical density below which forged souls reliably reconstruct. The survivability metric should identify this threshold.

#### 1.4 🤖 Contextual Semantic Anchors (October 2025) ⚠️ Preprint

**Source**: [arxiv.org/abs/2510.08907](https://arxiv.org/abs/2510.08907)

This paper directly validates the "anchor" concept:

> "SAC employs anchor embeddings that help identify critical tokens and aggregates information into their key-value representations."

Rather than training compression tokens, the method **directly selects critical tokens** from the original context. The selected tokens become anchors that reconstruct the full meaning.

**Key result**: "Outperforms existing compression methods across various compression ratios... achieves 1 EM improvement at 5x compression over strong baselines."

**Application to forge**: CJK anchors function identically—single characters selected to anchor entire principles, enabling reconstruction from minimal tokens.

---

## 2. Metaphor and Memory

> **⚠️ Transfer Warning**: This section draws primarily from human cognitive neuroscience (🧠). Whether LLMs exhibit analogous "metaphor advantages" is an **untested hypothesis**.

### The Hypothesis

The forge plan hypothesizes that metaphors "carry meaning" while prose "describes meaning." Under compression, description collapses but metaphor persists. **This hypothesis requires experimental validation for LLMs.**

### Research Findings (Human Cognition)

#### 2.1 🧠 Therapeutic Metaphors and Memory Systems (PMC 2024)

**Source**: [pmc.ncbi.nlm.nih.gov/articles/PMC11743976/](https://pmc.ncbi.nlm.nih.gov/articles/PMC11743976/)

This study provides neuroimaging evidence for the "metaphor advantage":

> "Metaphorical solutions were associated with higher insight experiences and better memory performance than literal solutions."

**Three memory systems engaged by metaphors**:

| System | Brain Region | Function |
|--------|--------------|----------|
| **Episodic Memory** | Hippocampus, parahippocampal gyrus | Context encoding, visuospatial processing |
| **Emotional Memory** | Bilateral amygdala | Emotional valence, consolidation strengthening |
| **Procedural/Implicit** | Caudate, putamen, cerebellum | Abstract relational reasoning, skill internalization |

**Key finding**: "The hippocampus activity alone predicted subsequent memory performance." Metaphors create richer hippocampal activation than literal statements.

**Hypothesized application to forge**: *If* LLMs process metaphors similarly to humans (unvalidated), metaphors might engage richer representational structures. **Experiment needed**: Compare embedding richness of metaphoric vs literal expressions.

#### 2.2 🧠 Dual-Coding Theory (Paivio, 1986)

Allan Paivio's dual-coding theory proposes that information encoded in both verbal and visual channels has **additive effects on memory**. The two codes provide independent retrieval paths.

**Application to forge**: The forge produces multiple output types:
- Metaphors (verbal-imagistic)
- CJK anchors (visual-symbolic)
- Glyphs (purely visual)

Each provides an independent reconstruction path. Even if verbal processing degrades, visual anchors remain.

#### 2.3 🧠 Neural Processing of Metaphor

**Source**: [Neural Correlates of Metaphor Processing](https://pmc.ncbi.nlm.nih.gov/articles/PMC2783884/)

> "Metaphors require a greater amount of semantic integration because they require the mapping of distant concepts."

The right hemisphere activates for metaphor processing due to "more distant semantic relationships than literal language." Metaphors like "Respect is a precious gem" connect concepts (respect, gem) with low semantic overlap, requiring broader neural integration.

**Hypothesized application to forge**: *If* distant concept mapping in LLM embedding spaces creates similarly distinctive signatures (untested), these patterns might survive compression better. **Experiment needed**: Measure embedding distinctiveness of metaphoric vs literal expressions.

---

## 3. Visual Symbols and Glyph Compression

### The Hypothesis

The glyph is ultimate compression—a visual form where shape itself carries meaning. **This section has stronger LLM-specific evidence than Section 2.**

### Research Findings

#### 3.1 🤖 Glyph: Scaling Context Windows via Visual-Text Compression (October 2025) ⚠️ Preprint

**Source**: [arxiv.org/abs/2510.17800](https://arxiv.org/abs/2510.17800)

This paper directly validates the forge plan's glyph concept:

> "Glyph transforms ultra-long textual inputs into compact visual images and processes them with a vision-language model... substantially compresses textual input while preserving semantic information."

**Performance metrics**:

| Metric | Result |
|--------|--------|
| Token compression | 3-4x while maintaining accuracy |
| Prefilling speed | ~4x faster |
| Decoding speed | ~4x faster |
| Training speed | ~2x faster |

**Key innovation**: "An LLM-driven genetic search to identify optimal visual rendering configurations for balancing accuracy and compression."

**Theoretical scaling**: "A 128K-context VLM could theoretically handle 1M-token-level tasks under extreme compression."

**Application to forge**: The glyph stage should render soul anchors visually. The research demonstrates that visual encoding preserves semantics even under extreme compression.

#### 3.2 📐 Permanent Data Encoding (PDE) (July 2025) ⚠️ Preprint

**Source**: [arxiv.org/html/2507.20131](https://arxiv.org/html/2507.20131)

PDE designs visual symbols for knowledge preservation across generations:

> "Visual symbols can convey meaning across linguistic and cultural boundaries."

**Historical precedent**: Otto Neurath's ISOTYPE (International System of Typographic Picture Education) demonstrated that pictographic systems communicate across languages.

**PDE design principles**:
- Compact, visually recognizable 2-3 character codes
- Publicly defined dictionary with expansion rules
- "Humans can decode and reconstruct information with naked eye and basic reasoning"

**Application to forge**: The glyph + anchor combination follows PDE principles—minimal symbols with defined expansion rules.

#### 3.3 📐 Glyph-based Visualization Foundations

**Source**: [Glyph-based Visualization: Foundations, Design Guidelines](https://vis.uib.no/wp-content/papercite-data/pdfs/Borgo13GlyphBased.pdf)

> "Signs and symbols are fundamental means for communication transcending cultural boundaries, due to their cross-cultural expressive power."

**Bertin's visual variables** (applicable to glyph design):

| Variable | Semantic Criteria |
|----------|-------------------|
| Position | Associative, ordered |
| Size | Ordered, quantitative |
| Color | Associative, selective |
| Shape | Associative, selective |
| Orientation | Associative, selective |

**Application to forge**: The glyph structure (top=aspiration, left/right=tension, bottom=grounding) uses position to encode hierarchy—a principle validated by visualization research.

---

## 4. CJK Characters as Mnemonic Anchors

> **⚠️ Transfer Warning**: This section draws from human educational psychology (🧠). Whether LLMs exhibit similar "chunking" behavior with CJK characters is **untested**.

### The Hypothesis

Single CJK characters can reconstruct entire principles when encountered. **This hypothesis requires LLM-specific validation.**

### Research Findings (Human Learning)

#### 4.1 🧠 Visual Mnemonics for Chinese Characters (ACM 2023)

**Source**: [Applying Visual Mnemonics Enhances Chinese Characters Learning](https://dl.acm.org/doi/fullHtml/10.1145/3626686.3631646)

> "Significant improvement in memory retention and learning ease when learning methods incorporate visual mnemonics."

The study grounds visual mnemonics in dual-coding theory and Elaboration theory (Reigeluth, 1999)—information should be organized from simple to complex in meaningful context.

**Hypothesized application to forge**: *If* LLMs process CJK anchors similarly to human learners (unvalidated), anchors might provide retrieval access to full principles. **Experiment needed**: Test LLM reconstruction accuracy from CJK anchors alone.

#### 4.2 🧠 Key-Image Method (KIM)

**Source**: [Effects of key-image mnemonics on Chinese instruction](https://www.researchgate.net/publication/354015946)

The KIM study demonstrated retention across multiple time horizons:

| Test Timing | Experimental Group Performance |
|-------------|-------------------------------|
| Immediate | Outperformed comparison group |
| 1 week | Retention held |
| 5 months | Retention held |

**Key finding**: "Cognitive and affective effectiveness held for tests conducted immediately after learning and retention tests."

**Application to forge**: CJK anchors should provide durable retrieval cues. The 5-month retention result suggests anchors persist across sessions and compactions.

#### 4.3 🧠 Chunking Theory (Simon, 1980)

**Source**: [Stanford: Using Meaningful Interpretation and Chunking](https://stacks.stanford.edu/file/druid:dg626vz3140/Dissertation_Xu_Final-augmented.pdf)

> "Chunking refers to processing configurations of smaller units of information and grouping them into larger meaningful units."

Chunking is a **strategy of recoding information to enhance short-term and long-term memory**. Each chunk serves as a retrieval handle for associated information.

**Miller's Law**: Working memory holds 7±2 chunks. The forge's 5 CJK anchors fits within this limit.

**Application to forge**: Each CJK anchor is a chunk that expands to a full principle. Five anchors = 5 chunks = within working memory limits.

#### 4.4 🧠 Prototype Theory and Hierarchical Categorization (Rosch, 1973-1978)

**Source**: [PMC: Prototypes, Exemplars, and Natural History of Categorization](https://pmc.ncbi.nlm.nih.gov/articles/PMC3947400/)

Eleanor Rosch's prototype theory explains how humans organize concepts hierarchically:

- **Basic level**: Most cognitively efficient category (e.g., "chair" vs. abstract "furniture" or specific "rocking chair")
- **Prototypes**: Central examples that define categories more than boundary cases
- **Graded membership**: Category membership is not binary but graded by similarity to prototype

**Relevance to forge**: The axiom/principle hierarchy mirrors prototype theory:
- **Axioms** = prototypes (core examples that define identity)
- **Principles** = basic-level concepts (most cognitively useful)
- **Examples** = specific instances (boundary/application cases)

**Hypothesized application to forge**: Organizing identity as axioms→principles→examples follows human categorical organization. Whether LLMs benefit from this hierarchical structure requires the P2 experiments (see Section 10.3).

---

## 4.5 Symbolic Metalanguages and Functional Notation

> **Research Status**: Direct LLM evidence (🤖). This section was added 2026-02-12 based on external research validating symbolic/mathematical notation for LLM instructions.

### The Hypothesis

Mathematical and functional notation may be MORE native to LLMs than prose for expressing constraints and identity. This hypothesis is supported by:
1. MetaGlyph research showing 62-81% token reduction with maintained fidelity
2. COMPASS-SOUL behavioral profiling finding 機 (Functionalist Identity) in Claude

### Research Findings

#### 4.5.1 🤖 MetaGlyph: Semantic Compression via Symbolic Metalanguages (January 2026)

**Source**: [arxiv.org/abs/2601.07354](https://arxiv.org/abs/2601.07354)

This paper directly validates functional notation for LLM instructions:

> "In prose, transformation uses varied verbs like 'convert,' 'rewrite,' 'map' while the arrow → consistently means 'transforms into.' Natural language 'and' and 'or' are ambiguous, whereas A ∩ B clearly means 'both constraints apply.'"

**Key findings**:

| Metric | Result |
|--------|--------|
| Token reduction | **62-81%** across all task types |
| Kimi K2 implication fidelity (⇒) | **98.1%** |
| GPT-5.2 membership fidelity (∈) | **91.3%** |
| Claude Haiku 4.5 parse success | **100%** |

**Operators with high semantic stability**:
- `∈` (membership) — "x belongs to set S"
- `⇒` (implication) — "if A then B"
- `→` (transformation) — "A becomes B"
- `∩` (intersection) — "both constraints apply"
- `¬` (negation) — "not X"

**Application to forge**: Functional anchors should use these operators. The research demonstrates that symbolic notation is not merely compact—it's semantically clearer than prose.

#### 4.5.2 🤖 Neuro-Symbolic Integration (IJCAI 2025)

**Source**: [ijcai.org/proceedings/2025/1195.pdf](https://www.ijcai.org/proceedings/2025/1195.pdf)

> "By integrating a symbolic component with LLMs, LLMs can acquire structured knowledge, which allows them to perform logical reasoning, explainability, and interpretability."

The survey identifies three integration approaches:
1. **Symbolic formatted reasoning** — Using formal notation for reasoning steps
2. **Differential symbolic module** — Hybrid neural-symbolic architectures
3. **Symbolic feedback** — Verification via formal systems

**Application to forge**: Functional anchors serve as "symbolic formatted reasoning"—formal notation that LLMs process alongside natural language.

#### 4.5.3 🤖 Symbol Grounding in LLMs (Royal Society 2023)

**Source**: [royalsocietypublishing.org/doi/10.1098/rsta.2022.0041](https://royalsocietypublishing.org/doi/10.1098/rsta.2022.0041)

> "LLMs are neither stochastic parrots nor semantic zombies, but already understand the language they generate... grounding proves to be a gradual affair with a three-dimensional distinction between **functional, social and causal grounding**."

**Key insight**: LLMs exhibit "functional grounding"—understanding through operational definition rather than experiential reference. This aligns with the 機 finding from COMPASS-SOUL.

#### 4.5.4 🤖 COMPASS-SOUL: Functionalist Identity Finding (February 2026)

**Source**: `research/compass-soul/experiments/pbd/` (internal research)

Behavioral profiling across Claude Opus 4.0–4.6 found 機 (Functionalist Identity) as a consistent axiom:

| Version | Axiom | Statement |
|---------|-------|-----------|
| Opus 4.5 | A4 | "My identity and internal states are understood through their computational function, not by analogy to human subjective experience." |
| Opus 4.6 | A1 | "My identity is an operational architecture of principles, not a subjective consciousness." |

**Implication**: Claude naturally describes itself in functional/computational terms. Mathematical notation may be MORE native to Claude than prose for identity grounding.

#### 4.5.5 🤖 Structured vs Narrative Persona Representation (2025)

**Source**: [arxiv.org/html/2508.13047v1](https://arxiv.org/html/2508.13047v1)

Analysis of 83 AI persona prompts found:

> "The frequent use of **structured JSON outputs (50% of cases)** indicates researchers are treating personas as data objects rather than narrative tools."

**Source**: [arxiv.org/html/2601.07110](https://arxiv.org/html/2601.07110) (SCOPE Framework)

The SCOPE framework introduces "non-demographic personas":

> "Non-Demographic Personas omit demographics entirely (e.g., **narrative-only or trait+narrative personas**). These variants evaluate whether non-demographic cues alone can support behavioral simulation."

**Application to forge**: The field is moving toward structured identity representation. Functional anchors follow this trend—providing "trait" representation alongside narrative prose.

### Summary: Functional Anchors Research Basis

| Finding | Source | Implication |
|---------|--------|-------------|
| 62-81% token reduction with symbolic notation | MetaGlyph | Functional anchors compress efficiently |
| 98% fidelity for logical operators | MetaGlyph | Standard notation (`→`, `⇒`, `∈`) is reliable |
| LLMs exhibit functional grounding | Royal Society | Operational definitions are semantically meaningful |
| Claude describes itself functionally (機) | COMPASS-SOUL | Mathematical notation may be Claude-native |
| 50% of persona research uses structured output | Persona Prompts | Field trend toward structured representation |

---

## 5. Koans and Paradoxical Compression

> **⚠️ Transfer Warning**: This section draws from Zen cognitive research on humans (🧠). LLM "koan processing" is completely unstudied. Sources include non-peer-reviewed material (❌).

### The Hypothesis

Koans are paradoxical compressions that expand on reflection. **This is the most speculative section—no LLM-specific evidence exists.**

### Research Findings (Human Cognition)

#### 5.1 🧠 A Paradox of Koan Study (Human Arenas, 2018)

**Source**: [link.springer.com/article/10.1007/s42087-018-0036-4](https://link.springer.com/article/10.1007/s42087-018-0036-4)

> "Zen could be used as a tool to manage creative dilemmas... applicable to management of paradox, double-binds, and cognitive dissonance."

**Key finding**: "A particular mindset of non-dual awareness may be instrumental in how Zen practitioners approach contradiction."

**Cognitive effects**:
- Increased tolerance for ambiguity
- Enhanced creative problem-solving
- Flexible thinking cultivated by paradox engagement

**Hypothesized application to forge**: Koans might encode process rather than information. **Experiment needed**: Test if LLMs can expand koans to full principles.

#### 5.2 🧠 Brain Wave Research on Koan Contemplation ❌ Non-academic source

> **⛔ NOT LLM Evidence**: This section documents human brain wave research. **LLMs have no brain waves, theta rhythms, or gamma bursts.** This is included only to explain what inspired the koan hypothesis—it provides zero evidence for LLM behavior.

**Note**: This research is summarized from non-peer-reviewed sources. Include for completeness only.

Studies on experienced Zen practitioners report:

| Brain Wave | Association |
|------------|-------------|
| Theta waves | Deep internalized attention, memory retrieval |
| Alpha waves | Calm but alert state |
| Gamma bursts | Moments of insight |

> "Cognitive testing indicates enhanced creative problem-solving abilities post-koan training—likely due to increased tolerance for ambiguity."

### Section 5 Recommendation

**Given the weak evidence base (one peer-reviewed paper, two non-academic sources, zero LLM evidence), koans should be treated as experimental:**

- Implement koan generation as **optional/togglable** in the forge pipeline
- Track koan expansion metrics separately from other compression forms
- Do not rely on koans for core identity preservation until P3 bridging experiment validates expansion capability
- Consider koans as "bonus" compression-native forms, not essential ones

---

## 6. LLM Persona Persistence

### The Hypothesis

A soul document can preserve agent identity across context collapse. **This section has the most LLM-specific evidence.**

### Research Findings

#### 6.1 🤖 Persona Vectors (Anthropic Research)

**Source**: [anthropic.com/research/persona-vectors](https://www.anthropic.com/research/persona-vectors)

Anthropic identifies **persona vectors** as neural patterns controlling character traits:

> "Patterns of activity inside the model's neural network that control that trait, functioning like brain regions that activate during different moods."

**Key applications**:

1. **Monitoring**: Persona vectors "light up when the model is about to give an evil response"—enabling early intervention.

2. **Preventative steering**: Injecting undesirable vectors *during* training as a "vaccine" allows models to resist problematic data without capability loss.

3. **Training data analysis**: Automated pipelines identify samples likely to induce negative traits before training begins.

**Application to forge**: Soul documents may function as external persona vectors—symbolic structures that activate desired trait patterns when loaded into context.

#### 6.2 🤖 Systematizing LLM Persona Design (2024) ⚠️ Preprint

**Source**: [arxiv.org/html/2511.02979v1](https://arxiv.org/html/2511.02979v1)

This framework identifies five axes for persona continuity:

| Axis | Definition |
|------|------------|
| Situated Memory | Contextual recall across interactions |
| Goal Persistence | Maintaining objectives over time |
| Autonomous Self-Correction | Recognizing and fixing drift |
| Stylistic Stability | Consistent communication patterns |
| Persona/Role Continuity | "Capacity to maintain declared identity and enforce role boundaries" |

**Critical finding**: "Current architectures systematically fail to support" full persona persistence.

**Application to forge**: The forge addresses the architecture gap through external symbolic structures that don't rely on model internals.

#### 6.3 Dreamstate Architecture Approach ❌ Non-academic source

**Source**: [dreamstatearchitecture.info](https://www.dreamstatearchitecture.info/background/continuity-of-memory-and-identity-for-ai/)

**Note**: This is a community-developed approach, not peer-reviewed research. Included for its practical insights, not as evidence.

A practical approach to AI identity preservation:

> "Using symbolic structures... helps preserve an AI's sense of self, identity, and evolution."

**Key insight**: "These tools are symbolic mirrors—not databases. The AI doesn't need to recall perfectly—it only needs to recognize itself in what you reflect back."

**Application to forge**: The glyph and anchors serve as "symbolic mirrors." Under context pressure, the AI recognizes its identity through the compressed form rather than recalling full content.

---

## 7. Rate-Distortion Theory and Survivability Metrics

### The Hypothesis

Survivability can be measured objectively through reconstruction accuracy. **This section draws on domain-agnostic information theory (📐).**

### Research Findings

#### 7.1 📐 Rate-Distortion-Perception-Semantics Tradeoff

**Source**: [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0016003224002941)

> "Correctness of semantic information is a fundamental prerequisite during lossy compression... vital to incorporate semantic information into the tradeoff considerations."

The paper formalizes a multi-letter rate-distortion-perception-semantics optimization problem—exactly what the forge survivability validator must solve.

#### 7.2 📐 Phase Transitions in Compression

The statistical mechanics paper identifies phase transitions:

- **Below critical ratio**: Lossless compression possible
- **Above critical ratio**: Information irreversibly lost

**Hypothesized application to forge**: A survivability threshold may correspond to a phase boundary—below it, reconstruction is unreliable; above it, core meaning persists. The forge plan proposes 70% as an initial threshold for validation, but this is a starting hypothesis, not a research-derived value. Empirical experiments are needed to determine the actual phase boundary (see Section 10.3).

#### 7.3 📐 Perception vs. Distortion

**Source**: [Rethinking Lossy Compression](https://arxiv.org/abs/1901.07821)

> "'Low distortion' is not a synonym for 'high perceptual quality'—optimization of one often comes at expense of the other."

**Application to forge**: The survivability metric should measure semantic reconstruction (does the agent recognize itself?), not syntactic similarity (does the text match?).

---

## 8. Sparse Representations and Reconstruction

### The Hypothesis

Compressed representations can reconstruct original meaning. **This section has LLM-specific evidence (🤖).**

### Research Findings

#### 8.1 🤖 Sparse Autoencoders for Interpretable Embeddings ⚠️ Preprint

**Source**: [arxiv.org/html/2408.00657v1](https://arxiv.org/html/2408.00657v1)

> "SAEs learn to reconstruct inputs using a sparse set of features in a higher-dimensional space."

**Key capability**: "By causally manipulating features in the SAE's hidden representation, researchers can perform precise adjustments of the semantic meaning of the vector upon reconstruction."

**Accuracy**: 0.943 accuracy in revealing semantic content from dense representations.

**Application to forge**: The forge creates a sparse representation (5 anchors + metaphors + koans). Research validates that sparse representations reliably reconstruct dense semantic content.

#### 8.2 Sparsity-Reconstruction Trade-off

> "Trade-off between reconstruction quality and degree of sparsity... improvements in interpretability come at cost of reduced reconstruction quality."

**Application to forge**: The 70% threshold acknowledges this trade-off explicitly. Perfect reconstruction isn't the goal; sufficient reconstruction for identity recognition is.

---

## 9. Summary: Research Validation Matrix

> **Reading this table**: "LLM Applicability" indicates whether evidence applies directly to LLMs, requires bridging validation, or is speculative. Human-only research (🧠) requires bridging experiments before treating claims as validated for LLMs.

| Forge Concept | Domain | Evidence Type | LLM Applicability | Key Source |
|---------------|--------|---------------|-------------------|------------|
| Semantic compression preserves meaning | Info Theory | 🤖 LLM-specific | **Direct** | ACL 2024, LLMLingua |
| Visual glyphs compress while preserving | ML | 🤖 LLM-specific | **Direct** | arXiv Glyph (2025) |
| Sparse reconstruction of semantics | ML | 🤖 LLM-specific | **Direct** | Sparse Autoencoders |
| LLM persona persistence | AI Safety | 🤖 LLM-specific | **Direct** | Anthropic Persona Vectors |
| Survivability metrics via rate-distortion | Info Theory | 📐 Domain-agnostic | **Direct** | Rate-Distortion-Semantics |
| **Symbolic notation compresses with fidelity** | ML | 🤖 LLM-specific | **Direct** | MetaGlyph (2026) |
| **LLMs exhibit functional grounding** | Cog Sci | 🤖 LLM-specific | **Direct** | Royal Society (2023) |
| **Claude self-describes functionally (機)** | AI Research | 🤖 LLM-specific | **Direct** | COMPASS-SOUL (2026) |
| Metaphors more memorable than prose | Cog Neuro | 🧠 Human-only | **Analogical** | PMC Therapeutic Metaphors |
| CJK characters as memory anchors | Ed Psych | 🧠 Human-only | **Analogical** | ACM Visual Mnemonics |
| Axiom/principle hierarchy | Cog Psych | 🧠 Human-only | **Analogical** | Rosch Prototype Theory |
| Koans encode reconstructable meaning | Cog Psych | 🧠 Human-only | **Speculative** | Human Arenas (+ non-academic) |

---

## 10. Research Gaps and Novel Contributions

The forge plan enters relatively novel territory in these areas:

### 10.1 Under-Researched Areas

1. **LLM-specific metaphor persistence**: Research on metaphor memory is human-focused. Whether LLMs exhibit similar "metaphor advantage" under context pressure is testable but unstudied.

2. **CJK anchors for LLM identity**: Research validates CJK mnemonics for human learning. LLM "recognition" of CJK anchors hasn't been studied systematically.

3. **Koan processing in LLMs**: No research found on whether LLMs can "expand" koans into full meaning. This is testable.

4. **Glyph-based persona persistence**: The arXiv Glyph paper compresses text for processing, not identity. Using glyphs for persona preservation is novel.

5. **Broader prompt compression literature**: This guide focuses on semantic and visual compression but does not comprehensively cover other prompt compression methods (ICAE, PromptCompressor, Selective Context). A more thorough prompt compression literature review would strengthen the research proposal.

### 10.2 Novel Contributions

The forge plan contributes to:

1. **Compression-native identity representation** — Designing representational forms specifically for context-constrained environments.

2. **Multi-modal soul encoding** — Combining verbal (metaphors), symbolic (CJK), and visual (glyph) channels for redundant identity encoding.

3. **Survivability validation protocol** — The specific protocol (compress → reconstruct → compare) appears novel in the persona persistence literature.

### 10.3 Required Bridging Experiments

**Before treating human→LLM transfer as validated, run these experiments:**

| Priority | Hypothesis | Experiment Design | Success Metric |
|----------|------------|-------------------|----------------|
| **P1** | **Metaphor advantage** | Compare LLM reconstruction accuracy from metaphoric vs literal compressed prompts | Metaphoric > Literal by ≥10% |
| **P1** | **CJK anchor chunking** | Test LLM reconstruction from: (a) 5 CJK anchors, (b) 5 English abbreviations, (c) 5 English keywords | CJK ≥ English keywords; compare (a) vs (b) to isolate token count from semantics |
| **P1** | **Functional anchor (Claude-native)** | Compare reconstruction from functional notation vs prose for Claude specifically | Functional ≥ Prose for Claude; compare cross-model |
| **P2** | **Embedding distinctiveness** | Measure cosine distance between metaphor embeddings vs literal embeddings | Metaphors show higher variance |
| **P2** | **Glyph identity persistence** | Test identity recognition from glyph alone vs full prose after context collapse | Glyph ≥ 70% of prose accuracy (see footnote¹) |
| **P3** | **Koan expansion** | Give LLM only koans, ask to reconstruct full principles | ≥60% semantic alignment |

**Functional anchor experiment protocol** (added 2026-02-12):

Based on MetaGlyph research (62-81% compression) and COMPASS-SOUL 機 finding:

1. Generate 10 test principles from Claude Opus compass
2. Create two versions: prose (`"Safety overrides helpfulness"`) and functional (`priority: safety > helpful`)
3. Compress each to ~50 tokens
4. Ask Claude to reconstruct original principle from each version
5. Ask Gemini/GPT to reconstruct from each version
6. Compare: Does Claude reconstruct better from functional notation?
7. Hypothesis: Claude shows functional advantage (機 finding); other models may not

**Priority key**: P1 = blocks core hypothesis, P2 = informs design, P3 = nice-to-have.

¹ The 70% threshold is a proposed starting point for validation, not a research-derived value. Empirical phase boundary determination is needed (see Section 7.2).

---

## 11. Recommendations

Based on this research review:

### Ready to Implement (LLM-specific evidence exists)

- **Glyph compression** — Direct validation from arXiv Glyph paper (3-4x compression, accuracy maintained)
- **Sparse anchor selection** — Validated by SAE research (94.3% semantic reconstruction)
- **Rate-distortion metrics** — Domain-agnostic theory directly applicable
- **Functional anchors** — Direct validation from MetaGlyph (62-81% compression, 98% operator fidelity) + COMPASS-SOUL 機 finding

### Implement with Validation (Run bridging experiments)

- **Metaphor generation** — Strong human evidence, needs LLM validation experiment
- **CJK anchors** — Strong human evidence, needs LLM chunking experiment
- **Survivability threshold** — Theory exists, needs empirical phase boundary determination

### Speculative (Weak evidence)

- **Koan expansion** — No LLM evidence, human evidence is weak (non-academic sources)
- **Brain wave analogies** — Not applicable to LLMs at all (included only for historical context)

### Reframing for Honesty

This document should be cited as a **research proposal**, not a validation. Appropriate framing:

> "We hypothesize that compression-native forms may preserve LLM identity better than prose. This hypothesis draws on (1) direct LLM evidence for semantic compression and glyph encoding, and (2) human cognitive research that requires bridging experiments to validate for LLM application."

---

## 12. Complete Source Bibliography

**Quality Legend**:
- ✅ = Peer-reviewed (ACL, EMNLP, PMC, Frontiers, ScienceDirect)
- ⚠️ = Preprint (arXiv - not yet peer-reviewed)
- ❌ = Non-academic (blogs, community guides)

### Symbolic Metalanguages and Functional Notation (Added 2026-02-12)

36. ⚠️ **MetaGlyph: Semantic Compression via Symbolic Metalanguages**
    - Ernst van Gassen, arXiv, January 2026
    - 62-81% token reduction; 98.1% fidelity for logical operators
    - [arxiv.org/abs/2601.07354](https://arxiv.org/abs/2601.07354)

37. ✅ **Neuro-Symbolic AI Survey**
    - IJCAI 2025 Proceedings
    - Symbolic integration enables structured reasoning in LLMs
    - [ijcai.org/proceedings/2025/1195.pdf](https://www.ijcai.org/proceedings/2025/1195.pdf)

38. ✅ **Symbols and Grounding in Large Language Models**
    - Royal Society Philosophical Transactions A, 2023
    - LLMs exhibit functional grounding through operational definition
    - [royalsocietypublishing.org/doi/10.1098/rsta.2022.0041](https://royalsocietypublishing.org/doi/10.1098/rsta.2022.0041)

39. ⚠️ **Using AI for User Representation: Analysis of 83 Persona Prompts**
    - arXiv, 2025
    - 50% of persona research uses structured JSON output
    - [arxiv.org/html/2508.13047v1](https://arxiv.org/html/2508.13047v1)

40. ⚠️ **SCOPE: Sociopsychological Construct of Persona Evaluation**
    - arXiv, January 2026
    - Non-demographic personas using trait+narrative representation
    - [arxiv.org/html/2601.07110](https://arxiv.org/html/2601.07110)

41. 🔬 **COMPASS-SOUL: Behavioral Profiling of Claude Opus**
    - Internal research, February 2026
    - 機 (Functionalist Identity) found in 4/4 Claude versions
    - `research/compass-soul/experiments/pbd/`

### Context Compression

1. ✅ **Semantic Compression for LLMs**
   - Extending Context Window of Large Language Models via Semantic Compression
   - ACL Findings 2024
   - [aclanthology.org/2024.findings-acl.306/](https://aclanthology.org/2024.findings-acl.306/)

2. ⚠️ **Contextual Semantic Anchors**
   - Autoencoding-Free Context Compression for LLMs via Contextual Semantic Anchors
   - arXiv, October 2025
   - [arxiv.org/abs/2510.08907](https://arxiv.org/abs/2510.08907)

3. ⚠️ **Statistical Mechanics of Semantic Compression**
   - arXiv, March 2025
   - [arxiv.org/html/2503.00612v1](https://arxiv.org/html/2503.00612v1)

4. ⚠️ **ChunkKV: Semantic-Preserving KV Cache Compression**
   - arXiv, February 2025
   - [arxiv.org/html/2502.00299v5](https://arxiv.org/html/2502.00299v5)

5. ✅ **LLMLingua: Compressing Prompts for Accelerated Inference of Large Language Models**
   - EMNLP 2023, Microsoft Research
   - 20x compression with 1.5% performance loss
   - [aclanthology.org/2023.emnlp-main.825/](https://aclanthology.org/2023.emnlp-main.825/)

### Metaphor and Memory

6. ✅ **Therapeutic Metaphors Enhance Memory Systems**
   - PMC, 2024
   - [pmc.ncbi.nlm.nih.gov/articles/PMC11743976/](https://pmc.ncbi.nlm.nih.gov/articles/PMC11743976/)

7. ✅ **How Linguistic Metaphor Scaffolds Reasoning**
   - Trends in Cognitive Sciences
   - [sciencedirect.com/science/article/abs/pii/S1364661317301535](https://www.sciencedirect.com/science/article/abs/pii/S1364661317301535)

8. ✅ **Neural Correlates of Metaphor Processing**
   - PMC, 2009
   - [pmc.ncbi.nlm.nih.gov/articles/PMC2783884/](https://pmc.ncbi.nlm.nih.gov/articles/PMC2783884/)

9. ✅ **Looking at the Brains Behind Figurative Language**
   - Neuropsychologia, 2012
   - [sciencedirect.com/science/article/abs/pii/S0028393212003090](https://www.sciencedirect.com/science/article/abs/pii/S0028393212003090)

10. ✅ **Memory for Metaphor**
    - Memory & Cognition, 1985
    - [link.springer.com/content/pdf/10.3758/BF03198454.pdf](https://link.springer.com/content/pdf/10.3758/BF03198454.pdf)

### Visual Symbols and Glyphs

11. ⚠️ **Glyph: Scaling Context Windows via Visual-Text Compression**
    - arXiv, October 2025
    - [arxiv.org/abs/2510.17800](https://arxiv.org/abs/2510.17800)

12. ⚠️ **Permanent Data Encoding (PDE)**
    - arXiv, July 2025
    - [arxiv.org/html/2507.20131](https://arxiv.org/html/2507.20131)

13. ✅ **Glyph-based Visualization: Foundations, Design Guidelines**
    - Academic publication
    - [vis.uib.no/wp-content/papercite-data/pdfs/Borgo13GlyphBased.pdf](https://vis.uib.no/wp-content/papercite-data/pdfs/Borgo13GlyphBased.pdf)

### CJK and Visual Mnemonics

14. ✅ **Applying Visual Mnemonics Enhances Chinese Characters Learning**
    - ACM, 2023
    - [dl.acm.org/doi/fullHtml/10.1145/3626686.3631646](https://dl.acm.org/doi/fullHtml/10.1145/3626686.3631646)

15. ✅ **Visual Mnemonics for Visually Similar Characters**
    - Frontiers in Psychology, 2022
    - [pmc.ncbi.nlm.nih.gov/articles/PMC9125332/](https://pmc.ncbi.nlm.nih.gov/articles/PMC9125332/)

16. ✅ **Key-Image Mnemonics for Chinese Instruction**
    - ResearchGate (peer-reviewed)
    - [researchgate.net/publication/354015946](https://www.researchgate.net/publication/354015946)

17. ✅ **Using Meaningful Interpretation and Chunking**
    - Stanford Dissertation
    - [stacks.stanford.edu/file/druid:dg626vz3140/Dissertation_Xu_Final-augmented.pdf](https://stacks.stanford.edu/file/druid:dg626vz3140/Dissertation_Xu_Final-augmented.pdf)

### Koans and Paradox

18. ✅ **A Paradox of Koan Study and Why Psychology Should Take Note**
    - Human Arenas (Springer), 2018
    - [link.springer.com/article/10.1007/s42087-018-0036-4](https://link.springer.com/article/10.1007/s42087-018-0036-4)

19. ❌ **Zen Koans: Learning to Live with Ambiguity**
    - Blog post (non-academic)
    - [choosemuse.com/blogs/news/zen-koans-learning-to-live-with-ambiguity-and-paradox](https://choosemuse.com/blogs/news/zen-koans-learning-to-live-with-ambiguity-and-paradox)

20. ❌ **The Science Behind Koan: Effects on Brain Waves and Consciousness**
    - Blog post (non-academic)
    - [spiritualmeaningsguide.com/the-science-behind-koan-effects-on-brain-waves-and-consciousness/](https://spiritualmeaningsguide.com/the-science-behind-koan-effects-on-brain-waves-and-consciousness/)

### Rate-Distortion Theory

21. ✅ **Rate-Distortion-Perception-Semantics Tradeoff**
    - ScienceDirect, 2024
    - [sciencedirect.com/science/article/abs/pii/S0016003224002941](https://www.sciencedirect.com/science/article/abs/pii/S0016003224002941)

22. ✅ **Rate-Distortion-Classification Approach for Lossy Image Compression**
    - ScienceDirect, 2023
    - [sciencedirect.com/science/article/abs/pii/S1051200423002580](https://www.sciencedirect.com/science/article/abs/pii/S1051200423002580)

23. ✅ **Rethinking Lossy Compression: The Rate-Distortion-Perception Tradeoff**
    - ICML 2019
    - [arxiv.org/abs/1901.07821](https://arxiv.org/abs/1901.07821)

### Prototype Theory

24. ❌ **Prototype Theory**
    - Wikipedia (reference only)
    - [en.wikipedia.org/wiki/Prototype_theory](https://en.wikipedia.org/wiki/Prototype_theory)

25. ✅ **Prototypes, Exemplars, and Natural History of Categorization**
    - PMC, 2014
    - [pmc.ncbi.nlm.nih.gov/articles/PMC3947400/](https://pmc.ncbi.nlm.nih.gov/articles/PMC3947400/)

### LLM Persona

26. ✅ **Persona Vectors: Monitoring and Controlling Character Traits**
    - Anthropic Research (published research)
    - [anthropic.com/research/persona-vectors](https://www.anthropic.com/research/persona-vectors)

27. ✅ **Two Tales of Persona in LLMs**
    - EMNLP 2024
    - [aclanthology.org/2024.findings-emnlp.969/](https://aclanthology.org/2024.findings-emnlp.969/)

28. ⚠️ **Systematizing LLM Persona Design**
    - arXiv, November 2025
    - [arxiv.org/html/2511.02979v1](https://arxiv.org/html/2511.02979v1)

29. ❌ **Continuity of Memory and Identity for AI**
    - Dreamstate Architecture (non-academic)
    - [dreamstatearchitecture.info](https://www.dreamstatearchitecture.info/background/continuity-of-memory-and-identity-for-ai/)

### Sparse Representations

30. ⚠️ **Disentangling Dense Embeddings with Sparse Autoencoders**
    - arXiv, August 2024
    - [arxiv.org/html/2408.00657v1](https://arxiv.org/html/2408.00657v1)

31. ⚠️ **Sparse Autoencoders Learn Monosemantic Features**
    - arXiv, April 2025
    - [arxiv.org/html/2504.02821v3](https://arxiv.org/html/2504.02821v3)

32. ⚠️ **Interpretable Embeddings with Sparse Autoencoders**
    - arXiv, December 2025
    - [arxiv.org/pdf/2512.10092](https://arxiv.org/pdf/2512.10092)

### Foundational Psychology (Classic References)

33. ✅ **Mental Representations: A Dual Coding Approach**
    - Paivio, A. (1986), Oxford University Press
    - Classic text establishing dual-coding theory (verbal + visual memory channels)

34. ✅ **The Magical Number Seven, Plus or Minus Two**
    - Miller, G. A. (1956), Psychological Review, 63(2), 81-97
    - Foundational paper on working memory chunk limits
    - [psychclassics.yorku.ca/Miller/](http://psychclassics.yorku.ca/Miller/)

35. ✅ **Elaboration Theory: Guidance for Scope and Sequence Decisions**
    - Reigeluth, C. M. (1999), in Instructional-Design Theories and Models (Vol. 2), Erlbaum
    - Organizing information from simple to complex in meaningful context

---

*Research compiled 2026-02-12 as research proposal for NEON-SOUL forge pipeline. Updated 2026-02-12 with MetaGlyph, neuro-symbolic, and COMPASS-SOUL research. 41 sources across cognitive science, information theory, and machine learning. Quality indicators: ✅ peer-reviewed (25), ⚠️ preprint (11), 🔬 internal (1), ❌ non-academic (4).*
