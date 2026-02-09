# Code Review Issue: liveneon.org Landing Page Plan

**Created**: 2026-02-08
**Source**: Code review synthesis (N=2)
**Reviews**:
- `docs/reviews/2026-02-08-liveneon-landing-page-codex.md`
- `docs/reviews/2026-02-08-liveneon-landing-page-gemini.md`
**Plan**: `docs/plans/2026-02-08-liveneon-landing-page.md`

---

## Summary

External code review (Codex + Gemini) identified issues in the liveneon.org landing page plan. This issue consolidates findings for systematic resolution. **Deployment updated from GitHub Pages to Railway.com.**

---

## N=2 Verified Issues (Cross-Reviewer Agreement)

### 1. Time Estimate Unrealistic ✅
**Codex**: "6 hours underestimates custom asset creation, copy development, QA"
**Gemini**: "Stage 3 estimate is optimistic... High-quality asset creation often requires more time"

**Resolution**: ✅ Updated total estimate to 8-10 hours. Stage 3 increased to 3-4 hours.

**Location**: Lines 295-307 (Effort Estimate)

---

### 2. Open Questions Block Progress
**Codex**: "Domain, analytics, and email capture are open questions that block deployment"
**Gemini**: "These should be resolved before committing to the plan"

**Resolution**: ✅ Resolved. Decisions made:
- [x] Domain: `liveneon.org` (confirmed)
- [x] Logo: Deferred (use stylized text for now)
- [x] Analytics: Deferred (add later if needed)
- [x] Email: `soul@liveneon.org`

**Location**: Lines 309-314 (Open Questions)

---

### 3. Architecture Diagram Concerns ✅
**Codex**: "ASCII clashes with neon aesthetic and has accessibility issues"
**Gemini**: "Technical diagrams often too detailed for general audience"

**Resolution**: ✅ Updated plan:
- SVG only (ASCII removed from options)
- Simplified for public audience
- Technical diagram referenced in docs

**Location**: Lines 138, 204

---

## Critical Issues (Codex Only)

### 4. ~~GitHub Pages Subdirectory Infeasible~~ → Railway.com Deployment ✅
**Original Issue**: GitHub Pages cannot publish from `website/` subdirectory
**Resolution**: ✅ Stage 5 rewritten for Railway.com:
- [x] Deployment steps updated
- [x] railway.json added to Stage 0 files
- [x] DNS/CNAME setup documented
- [x] CNAME file approach removed

**Location**: Lines 239-264 (Stage 5)

---

### 5. Performance Targets Unachievable ✅
**Issue**: "<2s on 3G" and "90+ Lighthouse" declared without implementation strategy

**Resolution**: ✅ Added performance budget table to Stage 4:
- [x] Total page weight: <500KB
- [x] Critical CSS: <14KB inline
- [x] Fonts: <150KB (subset Latin, font-display: swap)
- [x] Images: <200KB (WebP, lazy load)
- [x] JavaScript: <50KB

**Location**: Stage 4 (Visual Polish)

---

### 6. Frontmatter Conflict ✅
**Issue**: Stage 3 "Quick start commands" (line 139) conflicts with `code_examples: forbidden` (line 6)

**Resolution**: ✅ Rephrased to "Getting Started CTA, link to docs, GitHub button"

**Location**: Stage 2 (Page Structure)

---

## Important Issues (Codex Only)

### 7. Accessibility Incomplete ✅
**Issue**: Only "skip links" mentioned. Missing WCAG requirements.

**Resolution**: ✅ Added to Stage 2 acceptance criteria:
- [x] WCAG AA color contrast (4.5:1 text, 3:1 UI)
- [x] Focus/hover states for keyboard navigation
- [x] ARIA landmarks (main, nav, footer)
- [x] `prefers-reduced-motion` added to Stage 4

**Location**: Stage 2 + Stage 4

---

### 8. SEO Essentials Missing ✅
**Issue**: No mention of sitemap, robots, schema, favicons

**Resolution**: ✅ Added to Stage 5 (Deployment):
- [x] `sitemap.xml`
- [x] `robots.txt`
- [x] Canonical tags
- [x] JSON-LD schema (Organization type)
- [x] Favicon set (16x16, 32x32, 180x180, 512x512)

**Location**: Stage 5 (Deployment)

---

### 9. Asset Sourcing Unclear ✅
**Issue**: Logo, OG image, diagram listed but no sourcing/licensing plan

**Resolution**: ✅ Added Asset Sourcing & Licensing table to Stage 3:
- [x] Font licenses documented (all OFL)
- [x] Self-host decision (privacy)
- [x] Image format specs (SVG diagram, 1200x630 OG)
- [x] Font strategy with subset + font-display: swap

**Location**: Stage 3 (Content & Copy)

---

### 10. Audience Strategy Simplified
**Issue**: Four audiences defined but no mechanism to guide them

**Research Finding**: Analyzed OpenClaw.ai, Ollama.com, LM Studio - none segment by audience type. They use:
- Layered depth (accessible hero → technical details below)
- Use-case categories (what you can DO, not who you ARE)
- Single narrative flow (everyone reads same page, stops where relevant)

**Resolution**: Simplify from 4 audiences to 2 layers:

| Layer | Who | Content |
|-------|-----|---------|
| Surface | Everyone (10 sec) | Plain-language hero + value prop |
| Depth | Technical users | How it works, architecture, quick start |

"OpenClaw users" and "AI enthusiasts" are subsets of technical users - they self-select into depth layer.

**Updated Page Structure**:
1. Hero → Everyone (plain language, 10 seconds)
2. What/Why → Curious users who want more
3. How → Technical users (architecture + quick start combined)
4. Footer → Signature + links

**Location**: Lines 58-63, 133-141

---

## Minor Issues

### 11. CSS File Structure Inconsistent (Gemini) ✅
**Issue**: Stage 1 creates `variables.css`, `base.css` but Stage 4 introduces `components.css`, `animations.css`

**Resolution**: ✅ All CSS files now created in Stage 0:
- variables.css, base.css, layout.css, components.css, animations.css

**Location**: Stage 0 (Project Setup)

---

### 12. Tagline Not Finalized (Gemini)
**Issue**: Two candidates listed, decision needed before copy

**Resolution**: Choose primary tagline before Stage 3:
- "Your AI, grounded" (shorter, punchier)
- "Identity that knows where it came from" (more descriptive)

**Location**: Line 29

---

### 13. Post-Deploy Monitoring Absent (Codex) ✅
**Issue**: No uptime checks or verification beyond initial link testing

**Resolution**: ✅ Added to Stage 5 Post-Deploy Monitoring section:
- [x] Uptime check requirement
- [x] Status badge in README
- [x] Social preview card testing

**Location**: Stage 5 (Deployment)

---

### 14. OpenClaw Audience Unaddressed (Codex)
**Issue**: Problem statement mentions "OpenClaw users" but no specific content

**Resolution**: ✅ Resolved via audience simplification. OpenClaw users are technical users who self-select into the "depth" layer. No separate section needed - they're addressed through:
- Architecture/How section
- Quick start / GitHub CTA
- Integration context in "What" section

**Location**: Line 19

---

## Codex Alternative Framing (Consider)

> Is this the right problem? The plan assumes a landing page is the solution to "no public web presence."

1. **GitHub README as landing page**: For developer-focused projects, polished README may serve better. Is domain needed now?

2. **Audience prioritization**: Trying to serve everyone risks serving no one. Who is primary at this stage?

3. **CJK accents accessibility**: Heavy use of kanji may confuse Western audiences. Consider balance.

**Response**: Valid concerns addressed:
1. Domain establishes brand identity beyond GitHub - proceeding with liveneon.org
2. Audience simplified to 2 layers (surface/depth) based on research of OpenClaw, Ollama, LM Studio patterns
3. CJK used as accent only (not primary messaging) - maintains accessibility

---

## Action Items

### Immediate (Before Implementation)
- [x] Resolve open questions (domain, logo, analytics, email) ✅
- [x] Choose deployment platform (Railway.com) ✅
- [x] Simplify audience strategy (2 layers) ✅
- [x] Create performance budget ✅
- [ ] Finalize tagline choice (before Stage 3)

### Plan Updates ✅ Complete
- [x] Update Stage 5 for Railway.com deployment
- [x] Update time estimate (8-10 hours total)
- [x] Rephrase "Quick start commands" → "Getting Started CTA"
- [x] Simplify audience sections (4 → 2 layers)
- [x] Add accessibility acceptance criteria (WCAG AA)
- [x] Add SEO requirements (sitemap, robots, schema)
- [x] Specify asset sourcing (fonts OFL, self-host)
- [x] Clarify CSS file structure
- [x] Add post-deploy monitoring

---

## Cross-References

- **Plan**: `docs/plans/2026-02-08-liveneon-landing-page.md`
- **Codex Review**: `docs/reviews/2026-02-08-liveneon-landing-page-codex.md`
- **Gemini Review**: `docs/reviews/2026-02-08-liveneon-landing-page-gemini.md`
- **Plans Index**: `docs/plans/README.md`

---

*Issue created 2026-02-08 from N=2 code review synthesis*
