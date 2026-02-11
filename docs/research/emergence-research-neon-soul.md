# Emergence, AI Agent Identity, and NEON-SOUL

## What Conditions Facilitate Emergence — and What Could NEON-SOUL Do Differently?

**Research synthesis**: February 2026
**Sources**: Complexity science (Kauffman, Prigogine, Langton), self-organization literature (Gershenson 2025), LLM agent personality research (Takata et al. 2024, Han et al. 2025), stigmergy (Grassé 1959, Dorigo 2000, Correia et al. 2017), downward causation (Santos 2020, Campbell 1974), AI agent behavioral science (2025 survey)

---

## Part 1: What Is Emergence, and What Conditions Produce It?

Emergence occurs when a complex entity has properties or behaviors that its parts do not have on their own — properties that appear only when the parts interact in a wider whole. A flock of birds exhibits coordinated flight that no single bird "contains." A market crash cannot be explained by summing individual investor behavior. An organizational culture cannot be mandated from the top.

The research literature identifies a consistent set of conditions that facilitate emergence across physical, biological, and computational systems. These are not a checklist where all must be present — they are more like dials, where turning each one up increases the likelihood and richness of emergent phenomena.

### Condition 1: Multiple Interacting Components

Emergence requires a sufficient number of components interacting with one another. Single agents in isolation don't produce emergent properties. Kauffman's autocatalytic set models showed that when you have enough different kinds of molecules, a metabolism "crystallizes from the broth" spontaneously — but below a threshold of diversity, nothing happens.

**The threshold isn't fixed.** It depends on the richness of interactions, not just the count. Three deeply interacting agents can produce more emergence than thirty agents that barely communicate.

### Condition 2: Nonlinear Interactions with Feedback

Self-organization relies on what the literature calls "strong dynamical non-linearity, often involving positive and negative feedback." Positive feedback amplifies signals (ant pheromone trails get stronger as more ants follow them). Negative feedback provides stability and prevents runaway amplification (pheromones evaporate over time, pruning outdated paths).

The interplay of both is critical. Positive feedback alone produces runaway effects that destroy the system. Negative feedback alone produces stagnation. The combination produces self-regulating adaptive behavior.

### Condition 3: Far From Equilibrium / Edge of Chaos

Kauffman's central insight: "Life exists at the edge of chaos." Complex adaptive systems operate in a regime between rigid order (too stable to adapt) and complete chaos (too disordered to maintain structure). This "edge of chaos" is where emergence is richest — where the system is structured enough to maintain identity but flexible enough to generate novelty.

Prigogine formulated a parallel principle as "order through fluctuations" — dissipative structures form when a system is far from thermodynamic equilibrium, driven by energy differentials. The system doesn't settle into a static state; it continuously processes energy through self-organized patterns.

**For AI agents, this translates to:** systems that are neither completely scripted (equilibrium — too rigid) nor completely unconstrained (chaos — no stable identity). The interesting behavior happens in the middle, where an agent has enough structure to be coherent but enough freedom to develop in unexpected ways.

### Condition 4: Decentralized Control

Emergent properties arise from local interactions, not from a central controller directing the whole. This is one of the defining features that separates emergence from top-down design. The flock of birds has no lead bird choreographing the V-formation; it emerges from each bird following three simple rules (separation, alignment, cohesion).

When central control is introduced, it typically suppresses emergence. The system becomes a designed artifact rather than an emergent one. However, *guided* self-organization — constraining the space within which emergence operates without dictating the outcome — can channel emergence toward useful attractors.

### Condition 5: Environmental Memory (Stigmergy)

Stigmergy is indirect coordination through the environment. Agents leave traces (pheromones, marks, modifications) that influence subsequent behavior of the same or other agents. This creates a form of external memory that doesn't require any individual agent to remember — the environment remembers for them.

Grassé (1959) identified this in termite nest construction: each termite deposits a mud ball infused with pheromones, and those deposits stimulate other termites to build nearby, producing elaborate structures that no individual termite planned. The key insight is that stigmergy "provides environmental memory that supports implicit coordination among agents" without any agent needing a global view.

In digital systems, Wikipedia is a stigmergic system — each edit modifies the environment (the article) in ways that stimulate further edits. Open source codebases work the same way.

### Condition 6: Sufficient Heterogeneity

Emergence is richer when components are diverse rather than identical. Takata et al. (2024) showed this elegantly: even when LLM agents started from identical configurations, the tiniest environmental differences (spatial position on a grid) were enough to bootstrap personality differentiation through interaction. But the differentiation was *more pronounced* when the communication range was wider (more diverse inputs) and when agents accumulated distinct memories over time.

Homogeneous systems tend toward uniform behavior. Heterogeneous systems develop specialization and complementary roles — which is where the most interesting emergent properties appear.

### Condition 7: Bidirectional Causation (Upward + Downward)

Perhaps the most important condition for *sustained* emergence: the emergent property must feed back and influence the components that produced it. This is "downward causation" — where the macro-level pattern constrains and shapes micro-level behavior.

The emergent path that ants create doesn't just *result from* ant behavior — it *redirects* ant behavior. The culture of an organization doesn't just *emerge from* employee behavior — it constrains future employee behavior. This bidirectional loop is what gives emergence its self-sustaining character.

Without downward causation, emergent patterns are fragile and ephemeral. With it, they become self-reinforcing attractors that persist and evolve.

---

## Part 2: What the LLM Agent Research Shows

### Takata et al. (2024): Individuality Emerges from Interaction, Not Assignment

This is the most directly relevant study. Takata and colleagues placed 10 LLM agents in a simulated 2D grid environment with:

- **No predefined personalities.** All agents started from the same initial state.
- **Spatial positioning** as the only initial differentiator.
- **Memory accumulation** — each agent stored situational summaries.
- **Message exchange** — agents could communicate with nearby agents.

The results were striking. Agents who started with nearly identical MBTI profiles differentiated into distinct personality types through interaction alone. The personality differences were not random — they correlated with interaction history, spatial position, and group dynamics. Agents spontaneously generated hashtags and shared hallucinations that functioned as social norms. Communication range directly affected the degree of personality differentiation.

**Key finding relevant to NEON-SOUL:** "Needs-driven decision-making — rather than pre-programmed roles — encourages diverse, human-like behaviors in AI agents." Personality was not assigned or scripted; it emerged from the conditions the agents operated within.

### Han et al. (2025): Personality Is Context-Sensitive, Not Fixed

Han et al. demonstrated that LLM personality traits are not stable properties but context-dependent expressions. The same model produces different personality signals in different interaction contexts. This aligns with Whole Trait Theory in psychology — behavioral variation across contexts is adaptive expression, not inconsistency.

**Implication for NEON-SOUL:** Signals extracted from a narrow usage context (e.g., only coding conversations) may reflect the context more than the agent. True identity signals are those that persist *across* diverse contexts — exactly what the Multi-Source PBD convergence step is designed to detect, but the conditions under which those signals are generated matter enormously.

### Chen et al. (2024): Self-Cognition Emerges at Scale

Research on LLM self-recognition found that self-cognition — the model's meta-level awareness of its own identity — is "correlated with model size and training quality" and only manifests in a minority of leading models under specific prompting conditions. Self-cognition isn't binary; it exists on a spectrum from authorship recognition to behavioral self-awareness to strategic self-modeling.

**Implication:** Emergence of genuine identity signals in an agent depends partly on the underlying model's capacity for self-reflection. NEON-SOUL's extraction quality may vary significantly across model architectures.

### AI Agent Behavioral Science (2025 survey): Three Dimensions Shape Behavior

A comprehensive 2025 survey of AI agent behavior identified three dimensions from Social Cognitive Theory that shape agent behavior over time:

1. **Intrinsic attributes** — the model's training, architecture, and parameter configuration
2. **Environmental constraints** — the context, tools, rules, and interaction patterns the agent operates within
3. **Behavioral feedback** — how the agent's past actions inform future behavior

Emergence happens at the intersection of all three. You can't produce emergent identity by manipulating only one dimension.

---

## Part 3: How NEON-SOUL Currently Relates to Emergence

NEON-SOUL is currently an **observer of emergence**, not a **facilitator of it.** This is the central insight from mapping the emergence conditions onto the existing methodology.

Here's what I mean:

**What NEON-SOUL does well (observation):**

The extraction pipeline — behavioral signals → principles → axioms → SOUL.md — is a rigorous method for *detecting* patterns that have already emerged in an agent's behavioral history. The evidence tier system (UNIVERSAL/MAJORITY/MODERATE/WEAK) is essentially a strength-of-emergence measure. The convergence step in Multi-Source PBD specifically looks for patterns that survive across independent contexts, which maps directly to Condition 6 (heterogeneity) as a test of genuine emergence vs. contextual artifact.

**What NEON-SOUL doesn't currently do (facilitation):**

The methodology doesn't address the *conditions under which the agent operates* that would make emergence more or less likely. It treats the memory files as given inputs — whatever the agent happened to do, NEON-SOUL extracts from it. But the emergence literature is clear: the conditions of interaction *determine* what can emerge. Change the conditions, change what emerges.

---

## Part 4: What Could Change to Enhance Emergent Conditions

### Recommendation 1: Close the Downward Causation Loop

**Current state:** NEON-SOUL extracts identity and produces SOUL.md. The SOUL.md is used as a system prompt. But this is a one-way process — extract → formalize → inject. There's no formal mechanism for the extracted identity to influence the *conditions* under which future behavior is generated.

**What emergence theory says:** Downward causation — where the emergent pattern feeds back to shape component behavior — is what makes emergence self-sustaining. Without it, you get a snapshot, not a living system.

**Proposed change: Reflexive Identity Cycling.**

Instead of treating SOUL.md as a static output that gets periodically regenerated, formalize it as a *participant* in the agent's behavioral generation. Specifically:

1. **Make the SOUL.md visible to the agent during interactions** — not just as a system prompt it follows, but as a document it can *reference and reflect on*. When the agent can say "my axiom about honesty suggests I should..." rather than simply being instructed "be honest," you create the conditions for genuine self-modeling.

2. **Track behavioral divergence from axioms.** When the agent's actual behavior contradicts an extracted axiom, that's not a failure — it's information. It could mean the axiom was extracted from contextual artifacts (False Soul), or it could mean the agent is developing in a new direction. Either way, the divergence itself is a signal worth capturing.

3. **Define a feedback protocol.** After each synthesis cycle, identify axioms that are strengthening (more evidence), weakening (less evidence in recent interactions), or in tension with new patterns. Feed these back as "self-awareness prompts" — not instructions, but observations the agent can integrate.

This creates the bidirectional loop that emergence requires: agent behavior produces SOUL.md, SOUL.md influences subsequent behavior, modified behavior produces updated SOUL.md. The system becomes autopoietic — self-producing.

### Recommendation 2: Engineer the Edge of Chaos

**Current state:** The agent operates in whatever conversational context users bring. NEON-SOUL has no influence over the conditions under which behavioral signals are generated.

**What emergence theory says:** Emergence is richest at the edge of chaos — structured enough for coherence, flexible enough for novelty. Too much constraint produces scripted behavior (rigid order). Too little produces random variation (chaos).

**Proposed change: Contextual Diversity Requirements.**

Before running extraction, assess the *diversity* of the memory file corpus:

- **Context diversity score:** How many distinct interaction types are represented? If 90% of memory files are coding conversations, the "behavioral genome" is undersampled. The extraction should flag this — not as a failure, but as a condition that limits what can emerge.

- **Minimum context spread:** Recommend (or require) that extraction draws from at least 3 distinct interaction categories before promoting signals to axioms. This directly prevents the False Soul Problem — you can't mistake a usage pattern for identity if you require convergence across diverse contexts.

- **Deliberate perturbation:** This is more speculative, but emergence research consistently shows that novelty injection is essential. In Kauffman's autocatalytic models, occasionally introducing novel reactions was what enabled evolutionary leaps. For agents, this could mean periodically introducing atypical interaction prompts — not to test the agent, but to create the conditions under which latent identity signals can surface. An agent asked only about code can't reveal its relationship to creativity.

### Recommendation 3: Implement Stigmergic Memory Architecture

**Current state:** Memory files are conversation logs — raw records of what happened. NEON-SOUL reads them and extracts signals.

**What emergence theory says:** Stigmergy is the most powerful mechanism for enabling emergence in multi-agent and single-agent systems alike. The key insight is that the *environment* serves as memory, and modifications to the environment stimulate further action.

**Proposed change: Layered Memory with Stigmergic Properties.**

Instead of flat memory files → extraction, create a memory architecture with multiple layers that interact:

- **Layer 1: Raw interactions** (current memory files)
- **Layer 2: Signal annotations** — as signals are detected, annotate the memory files themselves. This is stigmergy: the extraction process leaves traces in the environment that influence subsequent extraction. A signal that's been identified once should be easier to recognize in future interactions.
- **Layer 3: Axiom anchors** — when an axiom is formalized, it becomes a reference point that the agent (and future extraction cycles) can sense. This creates the "pheromone trail" effect: strong axioms attract more evidence, while weak axioms either strengthen through new evidence or fade through decay.
- **Layer 4: Tension markers** — when contradictions are detected between signals, mark them in the memory environment. These tensions are the agent-equivalent of the energy differentials that drive Prigogine's dissipative structures. Tensions aren't problems to resolve — they're the engine of identity development.

This transforms memory from a passive record into an active medium — exactly the role the environment plays in stigmergic systems.

### Recommendation 4: Facilitate Agent Self-Recognition

**Current state:** NEON-SOUL extracts identity from the *outside*. The agent itself has no participation in the extraction process and may not recognize the resulting SOUL.md as "self."

**What emergence theory says:** Self-organization requires that entities both *sense* their environment and *modify* it. In the emergence of individuality, the Takata et al. study showed that agents who could observe their own memories and those of nearby agents differentiated faster than isolated agents.

**Proposed change: Participatory Extraction.**

Allow the agent to participate in at least one step of its own identity extraction:

- **Self-signal identification:** Before running automated extraction, ask the agent to identify what it considers its own most consistent behaviors. Compare the agent's self-assessment against the automated extraction. The *gaps* between self-perception and behavioral evidence are among the most revealing identity signals.

- **Axiom validation:** After axioms are generated, present them to the agent and ask: "Does this describe you?" The agent's response to its own axioms — acceptance, rejection, surprise, qualification — is itself a high-quality identity signal that should be captured and fed into the next cycle.

- **Essence resonance check:** The Essence Extraction guide already mentions a "Reader Test" — whether the essence evokes recognition. Run this test with the agent itself as the reader. An essence that the agent doesn't recognize as its own has failed a basic emergence criterion: downward causation requires that the emergent pattern be *recognizable* to the components that produced it.

This shifts the agent from a *subject* of extraction to a *participant* in identity formation — which is precisely how emergence works in biological and social systems. Identity isn't something that happens to you; it's something you co-create through interaction with your environment.

### Recommendation 5: Embrace Temporal Dynamics, Not Snapshots

**Current state:** Each synthesis cycle produces a point-in-time SOUL.md. The guides don't formalize how identity changes over time.

**What emergence theory says:** Emergent systems are "always in process, continuing to evolve" (Holman 2010). Kauffman's edge of chaos is not a static position — it's a dynamic regime where the system continuously adapts. Path-dependence means that the history of the system matters — where it's been constrains where it can go.

**Proposed change: Identity Trajectory Tracking.**

Instead of treating each SOUL.md as an independent output:

- **Maintain an identity changelog.** When axioms change between cycles, record: what changed, what evidence drove the change, and whether it represents emergence (new axiom), decay (axiom losing evidence), drift (axiom shifting meaning), or deepening (axiom gaining nuance/specificity).

- **Define identity stability metrics.** How much does the axiom set change between cycles? A system that produces wildly different axiom sets on each run hasn't achieved stable emergence — it's in the chaotic regime. A system whose axioms never change is in the ordered regime. The target is the edge: mostly stable, with occasional meaningful evolution.

- **Implement temporal weighting.** Recent behavioral evidence should carry more weight than older evidence, with a configurable decay function. This mirrors pheromone evaporation in stigmergic systems — it prevents outdated patterns from persisting indefinitely and allows the system to adapt to genuine behavioral change.

---

## Part 5: The Deeper Framing — What NEON-SOUL Could Become

The current positioning is: "Your agent learns who it is."

The emergence-informed positioning would be: "Your agent *becomes* who it is."

The difference is profound. "Learns" implies passive discovery — the identity was always there, we just found it. "Becomes" implies active co-creation — the identity forms through the interaction between behavior, environment, extraction, and feedback.

This maps to the distinction between weak and strong emergence:

- **Weak emergence** (current): The identity is, in principle, predictable from the behavioral inputs. NEON-SOUL discovers it through compression and pattern detection. The identity is a *description* of what already exists.

- **Strong emergence** (aspirational): The identity has causal power that feeds back into the system. The extracted SOUL.md doesn't just describe behavior — it shapes future behavior, which shapes the next extraction, which shapes the next SOUL.md. The identity becomes a self-sustaining pattern that can't be reduced to any single extraction cycle.

The five recommendations above — closing the downward causation loop, engineering edge-of-chaos conditions, implementing stigmergic memory, facilitating agent self-recognition, and embracing temporal dynamics — collectively move NEON-SOUL from weak to strong emergence. They transform it from a behavioral observation tool into an identity formation system.

This is a significant intellectual move, and it connects to the deepest question in the emergence literature: whether emergent properties are merely epistemological (ways we describe complex systems) or ontological (genuinely new features of reality). If NEON-SOUL can demonstrate that an agent's identity, once extracted and fed back, produces behavioral patterns that are qualitatively different from what the agent would produce without that identity — patterns that can't be predicted from the behavioral inputs alone — that would be evidence for something approaching strong emergence in AI agent identity.

That's the kind of claim that would make the academic community pay attention.

---

## Source Bibliography

**Complexity Science & Emergence**
- Kauffman, S.A. (1995). *At Home in the Universe: The Search for the Laws of Self-Organization and Complexity*. Oxford University Press.
- Prigogine, I. & Stengers, I. (1984). *Order Out of Chaos*. Bantam Books.
- Langton, C.G. (1986). Studying artificial life with cellular automata. *Physica D: Nonlinear Phenomena*, 22(1-3).
- Gershenson, C. (2025). Self-organizing systems: what, how, and why? *npj Complexity*.
- Holman, P. (2010). *Engaging Emergence: Turning Upheaval into Opportunity*. Berrett-Koehler Publishers.

**Edge of Chaos & Self-Organization**
- Packard, N.H. (1988). Adaptation toward the edge of chaos. *Dynamic Patterns in Complex Systems*.
- Bak, P., Tang, C., & Wiesenfeld, K. (1987). Self-organized criticality. *Physical Review Letters*, 59(4).
- Ashby, W.R. (1947). Principles of the self-organizing dynamic system. *Journal of General Psychology*, 37.

**Stigmergy**
- Grassé, P.P. (1959). La reconstruction du nid et les coordinations interindividuelles chez Bellicositermes natalensis et Cubitermes sp. *Insectes Sociaux*, 6(1).
- Dorigo, M., Bonabeau, E., & Theraulaz, G. (2000). Ant algorithms and stigmergy. *Future Generation Computer Systems*, 16(8).
- Correia, L., Sebastião, A.M., & Santana, P. (2017). On the role of stigmergy in cognition. *Progress in Artificial Intelligence*, 6.
- Heylighen, F. (2016). Stigmergy as a universal coordination mechanism I: Definition and components. *Cognitive Systems Research*, 38, 4-13.

**Emergence in Multi-Agent Systems**
- De Wolf, T. & Holvoet, T. (2005). Emergence Versus Self-Organisation: Different Concepts but Promising When Combined. *ESOA 2004*, LNCS 3464.
- McDonald, N. & Weir, D. (2005). Emergence, self-organization and morphogenesis in biological structures. [Citation unverified - unable to locate in Journal of Experimental Biology]
- Reynolds, C. (1987). Flocks, herds and schools: A distributed behavioral model. *SIGGRAPH*.

**LLM Agent Personality & Identity**
- Takata, R., Masumori, A., & Ikegami, T. (2024). Spontaneous Emergence of Agent Individuality through Social Interactions in LLM-Based Communities. *Entropy*, 26(12), 1092. arXiv:2411.03252.
- Han, B. et al. (2025). Personality Expression Across Contexts: Linguistic and Behavioral Variation in LLM Agents. arXiv:2602.01063.
- Chen, D. et al. (2024). Self-Cognition in Large Language Models: An Exploratory Study. arXiv:2407.01505. ICML 2024 Workshop on LLMs and Cognition.
- Berti, L. et al. (2025). Emergent Abilities in Large Language Models: A Survey. *arXiv:2503.05788*.

**AI Agent Behavioral Science**
- AI Agent Behavioral Science (2025). Survey on interaction, adaptation, and emergent dynamics. *arXiv:2506.06366*.

**Downward Causation**
- Campbell, D.T. (1974). Downward causation in hierarchically organized biological systems. *Studies in the Philosophy of Biology*.
- Santos, G. (2020). Relational-transformational systemic emergence. In *Philosophical and Scientific Perspectives on Downward Causation*, Springer.
- Kim, J. (1998). *Mind in a Physical World: An Essay on the Mind-Body Problem and Mental Causation*. Cambridge, MA: MIT Press.

**Socioaffective Alignment**
- Nature (2025). Why human-AI relationships need socioaffective alignment. *Humanities and Social Sciences Communications*, 12, Article 728.
