# LLM-Based Similarity Plan Review - Twin Creative

**Date**: 2026-02-12
**Reviewer**: Twin 2 (Creative/Organizational Focus)
**Model**: Claude Opus 4.5

**Verified files**:
- `docs/plans/2026-02-12-llm-based-similarity.md` (576 lines, MD5: 5c912b25)
- `docs/reviews/2026-02-12-llm-similarity-plan-codex.md` (201 lines, MD5: fd092dfb)
- `docs/reviews/2026-02-12-llm-similarity-plan-gemini.md` (152 lines, MD5: e05baa5a)

**Context files read**:
- `skill/SKILL.md` (518 lines) - Current user-facing documentation
- `docs/issues/2026-02-10-skillmd-llm-wording-false-positive.md` (588 lines) - Security scan history

**Status**: Approved with suggestions

---

## Summary

The plan is well-structured after N=2 code review revisions. The previous reviewers correctly caught technical gaps (ollama-provider.ts, centroid logic, trajectory tracking). This creative review focuses on **user experience**, **communication clarity**, and **philosophy alignment** - areas technical reviews tend to underweight.

**Core finding**: The plan solves a technical problem (scanner flags) with an architectural change. The technical approach is sound, but the **user story is underdeveloped**. Users will notice behavior changes (latency, consistency) without understanding why. The SKILL.md updates in Stage 6 need more attention to maintain user trust.

---

## Findings

### Critical

None. The N=2 code review addressed the critical technical gaps. No critical user-experience issues remain.

### Important

**I-1: User story absent from plan** (plan:entire document)

The plan explains WHY this change benefits the scanner rating but not WHY it benefits users. From a user perspective:

- **Before**: "Embeddings for similarity matching"
- **After**: "LLM for similarity matching"

Users will wonder: "Why did my synthesis get slower?" or "Why did the same memory produce different principles this time?"

**Impact**: Users may perceive the change as a regression (slower, less consistent) without understanding the security benefit.

**Recommendation**: Add a "User Impact" section after Trade-offs that explicitly frames this from the user's perspective:

```markdown
## User Impact

**What you'll notice:**
- First synthesis may take longer (LLM calls vs local inference)
- Principle matching may vary slightly between runs
- Requires active LLM connection (offline synthesis not supported)

**What you won't notice:**
- Your data handling is unchanged (still local, still private)
- Output quality should be equivalent or better
- Provenance tracking is unchanged

**Why we made this change:**
- Eliminates third-party npm package dependency
- Uses your already-trusted LLM instead of adding new inference engine
- Addresses security scanner concerns about untrusted code
```

This frames the change as user-centric, not scanner-centric.

---

**I-2: "Highest strength" principle selection may confuse users** (plan:lines 256-262)

The centroid replacement strategy selects "the principle with highest strength" when merging. While technically sound, users may find this unintuitive:

> "Wait, why did my older principle disappear? It was the first observation!"

The **fallback** (keep older if equal strength) is buried in the plan. Users expect temporal priority ("I said this first") not strength priority ("I repeated this more").

**Impact**: Users tracing provenance (`/neon-soul trace`) may be confused when their "original" principle text is replaced by a later, more-confirmed variant.

**Recommendation**: Document this behavior explicitly in SKILL.md Stage 6 updates. Consider:

1. **Option A**: Keep current approach (highest strength wins) but document clearly
2. **Option B**: Prefer oldest principle when strength is close (within 1 N-count)
3. **Option C**: Track provenance of merges so users can see "merged from 3 principles"

At minimum, add to SKILL.md's "How This Works" section:
> "When similar principles are detected, the one with the most signal confirmations (highest strength) is kept. Equal-strength principles prefer the older observation."

---

**I-3: "Text stability" metric is opaque to users** (plan:lines 266-270)

The trajectory tracking replacement uses "text stability" - whether principle texts changed between iterations. This is coarser than the previous cosine drift metric.

**User-facing concern**: Convergence feedback (if surfaced via `/neon-soul status`) will be less granular. Users accustomed to seeing "drift: 0.02" will now see "stable: yes/no".

**Impact**: Users lose nuance in understanding how their soul is evolving. The binary "stable/unstable" doesn't communicate "almost converged" vs "chaotic changes".

**Recommendation**:

1. **If convergence is user-visible**: Add a stability counter (e.g., "stable for 3 iterations") rather than boolean
2. **If convergence is internal only**: Document that users may see more synthesis iterations before convergence settles
3. **Consider**: Add "changes this iteration: 2 principles merged" to status output for transparency

---

### Minor

**M-1: SKILL.md trade-off transparency section could be warmer** (plan:lines 347-354)

The plan specifies trade-offs to document:
- Potential latency increase
- Token usage
- Non-deterministic matching
- Requires LLM connection

This reads like a warning label. For a skill about **identity and soul**, the tone should acknowledge that users may feel anxious about changes to something so personal.

**Recommendation**: Frame trade-offs with context, not just facts:

> **What changed in v0.2.0**: We removed the embedding model dependency, which means principle matching now uses your agent's LLM directly. This is the same model you already trust with your memory files.
>
> **What this means for you**:
> - Synthesis may take a bit longer (seconds, not minutes)
> - Results may vary slightly between runs (like asking the same question twice - similar but not identical)
> - You'll need an active connection to your agent (can't run offline)
>
> **Why we made this choice**: The previous approach required third-party code that security scanners flagged. Your soul is too important for compromises.

---

**M-2: Version bump to 0.2.0 needs migration guidance in SKILL.md** (plan:lines 504-515)

The plan correctly identifies breaking changes:
- Internal API signature changes
- Type changes (embedding field removed)
- Dependency removal

But the SKILL.md updates (Stage 6) don't mention adding a migration note for existing users.

**Recommendation**: Add to SKILL.md at the top (after frontmatter):

```markdown
## Upgrading to 0.2.0

If you used NEON-SOUL before version 0.2.0:
- Your existing `.neon-soul/state.json` will work (embedding fields are ignored)
- First synthesis will recalculate all similarity matches
- Your SOUL.md and provenance chain are unchanged

Nothing to do - just run `/neon-soul synthesize` as usual.
```

This prevents user anxiety about "breaking changes" - their soul is safe.

---

**M-3: "Fail loud" on LLM unavailability may alarm users** (plan:lines 444)

The plan explicitly states:
> "If LLM is unavailable, similarity matching fails with clear error. This is the intended behavior (fail loud, not fail silent)."

While technically correct, the error message matters. Users running `/neon-soul synthesize` during network hiccups should see a helpful message, not a stack trace.

**Recommendation**: Ensure the error message (implemented in Stage 1) follows NEON-SOUL's voice:

> "Soul synthesis paused: Your agent's LLM is temporarily unavailable. Try again in a moment."

Not:
> "Error: LLM request failed after 3 retries. Network timeout."

The former maintains the skill's personal tone. The latter is technically accurate but jarring for a soul-related tool.

---

**M-4: Tags in SKILL.md frontmatter include "embeddings"** (skill/SKILL.md:line 24)

The current SKILL.md has:
```yaml
tags:
  - soul-synthesis
  - identity
  - embeddings  # <-- Should be removed in v0.2.0
  - semantic-compression
  - provenance
  - openclaw
```

**Recommendation**: Add to Stage 6 acceptance criteria:
- [ ] Remove `embeddings` tag from SKILL.md frontmatter (no longer applicable)
- [ ] Consider adding `llm-similarity` or similar tag

---

## Alternative Framing

### Are we solving the right problem?

**The scanner wants checksums. We're giving it architecture.**

This is a legitimate question. The scanner explicitly said:
> "If you want more confidence, provide the exact commands the agent will run and hashes for the model/artifacts"

The plan's response is essentially: "Instead of checksums, we'll remove the thing that needs checksums."

**Assessment**: This is a **valid engineering trade-off**, not scope creep. Reasons:

1. **Checksums are maintenance burden**: Model files update, hashes drift, users forget to verify
2. **Root cause elimination**: Removing the dependency is more robust than documenting it
3. **Architectural simplification**: One less inference engine = simpler mental model
4. **Trust model coherence**: "Your agent's LLM" is already trusted; @xenova/transformers requires new trust

The plan is not overkill - it's choosing permanent solution over perpetual maintenance.

### What's the user story here?

**Current**: "We changed internals to satisfy a scanner."

**Better**: "We simplified NEON-SOUL to use only what you already trust."

The plan should lead with user benefit, not scanner compliance. Recommendation: Revise Quick Reference (lines 16-20) to emphasize user value:

> **Solution**: Simplify similarity matching to use your agent's existing LLM. This eliminates the need for a third-party embedding package, meaning NEON-SOUL now requires zero additional dependencies beyond your agent itself.

### Is "fail loud" the right UX choice?

Yes, but the implementation matters.

**Why fail loud is correct**: Silent fallbacks in identity tools are dangerous. If similarity matching secretly started using external APIs, users would lose the "no external data transmission" guarantee they trust.

**How to make it good UX**: The error should be:
1. **Actionable**: "Check your agent's LLM connection"
2. **Reassuring**: "Your soul data is safe - we didn't send anything"
3. **Recoverable**: "Run synthesis again when connection is restored"

The plan addresses this in Risk 5 mitigation but doesn't specify error message UX. Minor gap, easily fixed in implementation.

---

## Philosophy Alignment

### Does this change align with NEON-SOUL's purpose?

**NEON-SOUL's core purpose** (from SKILL.md):
> "AI Identity Through Grounded Principles - synthesize your soul from memory with semantic compression."

**Key values**:
1. **Privacy**: Data stays local
2. **Traceability**: Full provenance chain
3. **User control**: Opt-in, dry-run defaults, explicit consent
4. **Safety**: Auto-backup, rollback, deliberate changes

**Assessment**: The LLM-based similarity change **aligns well** with these values:

| Value | Current (Embeddings) | Proposed (LLM) | Alignment |
|-------|---------------------|----------------|-----------|
| Privacy | Local inference | Uses agent's LLM | Neutral (both local) |
| Traceability | Similarity scores | Confidence scores | Equivalent |
| User control | Deterministic | May vary slightly | Minor reduction |
| Safety | Third-party package | Already-trusted model | Improved |

**The key insight**: NEON-SOUL is about trusting AI with your identity. Using the **same AI the user already trusts** (their configured LLM) is more philosophically coherent than adding a second AI component (@xenova/transformers).

### Potential concern: Non-determinism in identity tools

The plan acknowledges that LLM-based similarity "may vary slightly" (line 103). For most applications, this is acceptable. For an **identity** tool, it's worth pausing:

> "My soul should be consistent. If I run synthesis twice with the same memory, shouldn't I get the same soul?"

**Reality check**: Even with embeddings, principle merging and axiom promotion involve judgment. The system was never purely deterministic. The LLM change makes this explicit rather than hidden.

**Recommendation**: Address this explicitly in SKILL.md v0.2.0:
> "Your soul reflects patterns in your memory, not exact calculations. Like human memory itself, the synthesis process involves interpretation. Running synthesis twice may produce slightly different results - but the core truths will remain stable if your memory is consistent."

This frames non-determinism as a feature of organic growth, not a bug.

---

## Checklist

**Structure & Clarity**:
- [x] Purpose stated in first paragraph
- [x] Logical section flow
- [x] Headings form clear outline
- [x] Scannable (not walls of text)

**Token Efficiency**:
- [x] Plan is 576 lines (acceptable for major architectural change)
- [x] No unnecessary duplication
- [x] Examples concise but clear

**Organization**:
- [x] File in correct directory (`docs/plans/`)
- [x] Filename follows conventions
- [x] Cross-references correct
- [x] Related docs linked

**Standards Compliance**:
- [x] Follows plan template (frontmatter, stages, risks)
- [x] `code_examples: forbidden` respected
- [x] N=2 code review findings addressed (documented in plan)

**Completeness**:
- [x] All stages have acceptance criteria
- [ ] User impact section missing (Important I-1)
- [ ] Migration guidance missing (Minor M-2)
- [x] Next steps clear

**UX Considerations**:
- [ ] User story not framed (Important I-1)
- [ ] Principle merging behavior unclear to users (Important I-2)
- [ ] Convergence feedback granularity reduced (Important I-3)
- [ ] Trade-off tone could be warmer (Minor M-1)

---

## Recommendations Summary

**Before implementation**:

1. **Add "User Impact" section** after Trade-offs (I-1) - Frame change as user benefit, not scanner appeasement
2. **Document principle merging behavior** in Stage 6 SKILL.md updates (I-2) - Users need to understand "highest strength wins"
3. **Consider stability counter** for convergence feedback (I-3) - "Stable for N iterations" is more useful than boolean

**During implementation**:

4. **Use warm tone** in SKILL.md trade-off section (M-1) - This is an identity tool, not enterprise software
5. **Add migration guidance** to SKILL.md for v0.2.0 (M-2) - Reassure existing users their soul is safe
6. **Craft error messages** for LLM unavailability with care (M-3) - Actionable, reassuring, recoverable
7. **Update frontmatter tags** to remove "embeddings" (M-4) - Small but important for discoverability

---

## Verdict

**Approve with suggestions**. The plan is technically solid after N=2 code review. The creative review surfaces user experience gaps that are addressable without blocking implementation. The architectural change aligns with NEON-SOUL's philosophy of minimizing trust requirements.

**Recommended merge priority**: Important findings (I-1 through I-3) should be addressed in Stage 6 SKILL.md updates. Minor findings (M-1 through M-4) can be addressed during or after implementation.

---

## Raw Notes

**What I liked**:
- The "Insight" section (lines 45-60) clearly articulates why this change makes sense
- Trade-offs table is honest about downsides
- Risk 5 explicitly states "no fallback" - transparent about trade-off
- Review findings addressed section shows responsiveness to feedback

**What gave me pause**:
- The plan reads like it's written for the scanner, not for users
- "Breaking change" language (line 504) may alarm users unnecessarily
- Non-determinism is acknowledged but not framed for identity-sensitive users

**Questions for author**:
1. Has the ClawHub team confirmed that removing @xenova/transformers alone achieves "Benign"? (Codex asked this too)
2. Will convergence status be user-visible after this change? If so, how will "text stability" be communicated?
3. What's the error message strategy for LLM unavailability? (implementation detail, but affects UX)

---

*Review complete. The soul is safe.*
