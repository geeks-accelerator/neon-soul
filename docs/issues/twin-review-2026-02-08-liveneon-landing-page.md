# Twin Review Issue: liveneon.org Landing Page Plan

**Created**: 2026-02-08
**Source**: Twin review synthesis (N=2 internal)
**Reviews**:
- `docs/reviews/2026-02-08-liveneon-landing-page-twin-technical.md`
- `docs/reviews/2026-02-08-liveneon-landing-page-twin-creative.md`
**Plan**: `docs/plans/2026-02-08-liveneon-landing-page.md`
**Prior Review**: `docs/issues/code-review-2026-02-08-liveneon-landing-page.md` (resolved)

---

## Summary

Twin review (Technical + Creative) approved the plan with suggestions. This review complements the N=2 external code review (Codex + Gemini) which has already been addressed. The twin review surfaces deeper concerns about implementation quality and philosophical alignment.

**Status**: ✅ All findings addressed. Plan updated.

---

## N=2 Verified (Cross-Twin Agreement)

### 1. Tagline Decision Outstanding
**Technical**: "Choosing during Stage 3 adds decision overhead mid-implementation"
**Creative**: "This is a soul question, not a marketing question"

**Both twins recommend resolution before Stage 3**, but differ on choice:

| Twin | Recommendation | Reasoning |
|------|----------------|-----------|
| Technical | "Your AI, grounded" | Shorter, punchier, memorable |
| Creative | "Identity that knows where it came from" | Warmer, narrative alignment, more NEON-SOUL |

**Resolution**: Choose before Stage 3. Consider:
- "Your AI, grounded" - utility-focused, could belong to any AI tool
- "Identity that knows where it came from" - narrative-focused, uniquely NEON-SOUL

**Creative's test**: "If the landing page could belong to any AI project by changing the logo, it's not NEON-SOUL."

**Location**: Line 29 (Tagline candidates)

---

### 2. Plan Status: Approved
**Technical**: "Approved with suggestions"
**Creative**: "Approved with suggestions"

Both twins confirm the plan is ready for implementation after addressing findings.

---

## Technical Domain (N=1)

These findings address infrastructure and deployment concerns.

### 3. Cache-Busting Strategy Missing
**Issue**: Performance budget addresses file sizes but not cache invalidation. Static sites need cache-busting for CSS/JS updates.

**Why it matters**: Railway auto-deploys on git push. If CSS changes but filename doesn't, caches serve old version.

**Resolution**: Add to Stage 0 or Stage 5:
- [ ] Choose approach: file hash, query string, or Cache-Control headers
- [ ] Document in README

**Confidence**: HIGH - Standard static site practice

**Location**: Stage 4-5

---

### 4. CSS File Size Limits Unspecified
**Issue**: Five CSS files created but no size guidance. MCE-like discipline improves maintainability.

**Resolution**: Add advisory limits to Stage 1:
- [ ] Each CSS file: ~100-150 lines max
- [ ] Total combined: <400 lines

**Confidence**: MEDIUM - Advisory, not blocking

**Location**: Stage 0-1

---

### 5. Railway Environment Config Incomplete
**Issue**: `railway.json` mentioned but structure not specified. Railway static site serving requires explicit config.

**Gaps**:
- Build command (or staticBuild section)
- Start command for static server
- Environment variables

**Resolution**: Add to Stage 0 acceptance criteria:
- [ ] railway.json includes static site serving config
- [ ] Local test with `railway run` before deploy

**Confidence**: HIGH - Required for Railway deployment

**Location**: Stage 5, lines 282-328

---

### 6. Local Development Workflow Missing
**Issue**: README documents deployment but not local dev workflow.

**Resolution**: Add to Stage 0:
- [ ] README includes local preview instructions (e.g., `npx serve website/`)

**Confidence**: HIGH - Enables iteration without deploy

**Location**: Stage 0

---

### 7. www Redirect Implementation Unspecified
**Issue**: DNS mentions CNAME for www but not redirect implementation.

**Resolution**: Add to Stage 5:
- [ ] www.liveneon.org redirects to liveneon.org (HTTP 301)

**Confidence**: HIGH - Standard practice

**Location**: Stage 5, lines 304-305

---

## Creative Domain (N=1)

These findings address soul, emotion, and philosophical alignment.

### 8. Kotodama Integration Needs Intentionality
**Issue**: The hero quote "words carry spirit" is placed but not embodied. If kotodama frames the page, every word should demonstrate it.

**The test**: Can visitors *feel* kotodama before they read about it?

**Resolution**: During implementation:
- [ ] Write hero copy first, test against kotodama (does every word earn its place?)
- [ ] Prioritize necessity over word count
- [ ] If 10-15 words feels forced, adjust constraint

**Confidence**: HIGH - Core philosophical alignment

**Location**: Lines 29, 224-229

---

### 9. Hero Word Count May Be Too Tight
**Issue**: 10-15 words may force compression that loses soul. Bold, visionary tone needs breathing room.

**Resolution**:
- [ ] Treat word count as advisory, not hard constraint
- [ ] Test copy for emotional impact before length

**Confidence**: MEDIUM - Depends on copy quality

**Location**: Lines 148-157

---

### 10. Surface Layer Time Pressure (10-Second Test)
**Issue**: For a project about grounding and placing identity, measuring success by speed may import wrong values.

**Creative's framing**: "NEON-SOUL is about *placing* identity, not *grabbing* attention."

**Resolution**: Reframe success criterion:
- [ ] "Surface layer creates right *feeling*" rather than "communicates in 10 seconds"
- [ ] Consider: "What if the surface layer invites rather than asserts?"

**Confidence**: MEDIUM - Philosophical, not technical

**Location**: Lines 147-155

---

### 11. Emotional Journey Not Mapped
**Issue**: Audience strategy defines WHO and WHAT but not HOW visitors should FEEL.

**Suggested emotional arc**:
1. Hero → Curiosity/Recognition
2. What → Understanding/Relief
3. How → Confidence
4. Start → Agency
5. Footer → Belonging

**Resolution**: Add to Stage 3 or implementation notes:
- [ ] Map emotional target for each section
- [ ] Review copy against emotional arc

**Confidence**: MEDIUM - Creative guidance

**Location**: Lines 58-66

---

### 12. Key Messages Cold/Clinical
**Issue**: "Black box → Glass box", "Static → Emergent", "Unknown → Traceable" are accurate but stated clinically.

**Resolution**: During Stage 3:
- [ ] Rewrite transformations to make visitors *want* them, not just understand them

**Confidence**: LOW - Implementation detail

**Location**: Lines 189-197

---

### 13. No Tonal Arc Defined
**Issue**: Plan describes content requirements but not tonal progression. Should page build intensity? Soften toward invitation?

**The tension**: Neon aesthetic suggests energy; grounding philosophy suggests stillness.

**Resolution**: Add to Stage 3 or implementation:
- [ ] Define tonal arc (suggested: "Bold in vision, grounded in voice")
- [ ] Review each section for tonal consistency

**Confidence**: LOW - Creative direction

**Location**: Not present

---

## Minor (Both Twins)

### 14. Font Subset Verification (Technical)
**Issue**: Font strategy mentions subset but no verification step.

**Resolution**: Add to Stage 3:
- [ ] Font subset verified (woff2 sizes match budget)

**Location**: Stage 3, lines 213-215

---

### 15. Social Preview Testing Tools (Technical)
**Issue**: Testing mentioned but no specific tools.

**Resolution**: Add specific approach:
- opengraph.xyz for preview
- Twitter Card Validator
- LinkedIn Post Inspector

**Location**: Stage 5, line 318

---

### 16. Visual Breath Before Footer (Creative)
**Issue**: Need moment of rest between "Start" and footer signature. Let visitors arrive at equations, not scan past them.

**Resolution**: Add to Stage 4:
- [ ] Whitespace/visual break before footer

**Location**: Not present

---

## The Central Question (from Creative)

> **Can visitors sense kotodama before they read about it?**

If yes, the page succeeds. If no, it becomes marketing collateral with Japanese aesthetics.

**Authenticity test**: If the landing page could belong to any AI project by changing the logo, it's not NEON-SOUL.

---

## Action Items ✅ Complete

### Before Stage 3 (Content)
- [x] **Decide tagline** - "Identity that knows where it came from" (per creative)
- [x] **Map emotional journey** - Added to Audience Strategy section

### During Stage 0-2 (Setup/Structure)
- [x] Add cache-busting strategy (query string approach in Stage 4)
- [x] Add CSS file size advisory (~100-150 lines each in Stage 1)
- [x] Document railway.json config (Stage 0)
- [x] Add local dev workflow to README (Stage 0)
- [x] Add www redirect requirement (Stage 5)

### During Stage 3-4 (Content/Polish)
- [x] Apply kotodama test to hero copy (acceptance criterion added)
- [x] Warm up clinical transformation messages (rewritten in Stage 3)
- [x] Add visual breath before footer (Stage 4)
- [x] Verify font subsets (acceptance criterion added)

### During Stage 5 (Deploy)
- [x] Test social previews with specific tools (listed in Stage 5)
- [x] Verify www redirect works (acceptance criterion added)

---

## Cross-References

- **Plan**: `docs/plans/2026-02-08-liveneon-landing-page.md`
- **Technical Review**: `docs/reviews/2026-02-08-liveneon-landing-page-twin-technical.md`
- **Creative Review**: `docs/reviews/2026-02-08-liveneon-landing-page-twin-creative.md`
- **Prior Issue**: `docs/issues/code-review-2026-02-08-liveneon-landing-page.md` (resolved)
- **Codex Review**: `docs/reviews/2026-02-08-liveneon-landing-page-codex.md`
- **Gemini Review**: `docs/reviews/2026-02-08-liveneon-landing-page-gemini.md`

---

*Issue created 2026-02-08 from N=2 twin review synthesis*
