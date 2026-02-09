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

### 1. Time Estimate Unrealistic
**Codex**: "6 hours underestimates custom asset creation, copy development, QA"
**Gemini**: "Stage 3 estimate is optimistic... High-quality asset creation often requires more time"

**Resolution**: Update total estimate to 8-10 hours. Increase Stage 3 from 2 hours to 4 hours.

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

### 3. Architecture Diagram Concerns
**Codex**: "ASCII clashes with neon aesthetic and has accessibility issues"
**Gemini**: "Technical diagrams often too detailed for general audience"

**Resolution**:
- Choose SVG only (not ASCII)
- Create simplified public-facing diagram focused on conceptual flows
- Reference technical diagram in docs for developers

**Location**: Lines 138, 204

---

## Critical Issues (Codex Only)

### 4. ~~GitHub Pages Subdirectory Infeasible~~ → Railway.com Deployment
**Original Issue**: GitHub Pages cannot publish from `website/` subdirectory
**Resolution**: Use Railway.com instead. Benefits:
- Supports any directory structure
- Auto-HTTPS
- Simple CLI deployment
- Free tier available

**Update Required**: Rewrite Stage 5 (Deployment) for Railway.com:
- [ ] Update deployment steps
- [ ] Add `railway.json` configuration
- [ ] Document DNS/CNAME setup for custom domain
- [ ] Remove CNAME file approach

**Location**: Lines 239-264 (Stage 5)

---

### 5. Performance Targets Unachievable
**Issue**: "<2s on 3G" and "90+ Lighthouse" declared without implementation strategy

**Resolution**: Add explicit performance budget before Stage 1:
- [ ] Total page weight budget (target: <500KB)
- [ ] Critical CSS strategy (inline above-fold)
- [ ] Font loading approach (font-display: swap, subset fonts)
- [ ] Image optimization (WebP, lazy loading)
- [ ] Caching headers configuration

**Location**: Lines 289, 233

---

### 6. Frontmatter Conflict
**Issue**: Stage 3 "Quick start commands" (line 139) conflicts with `code_examples: forbidden` (line 6)

**Resolution**: Rephrase "Quick start commands" to:
- "Link to installation documentation" OR
- "Getting Started CTA" OR
- "Reference to getting-started-guide.md"

**Location**: Lines 6, 139

---

## Important Issues (Codex Only)

### 7. Accessibility Incomplete
**Issue**: Only "skip links" mentioned. Missing WCAG requirements.

**Resolution**: Add to Stage 2 acceptance criteria:
- [ ] WCAG AA color contrast (4.5:1 text, 3:1 UI)
- [ ] Focus/hover states for keyboard navigation
- [ ] ARIA landmarks (main, nav, footer)
- [ ] `prefers-reduced-motion` fallbacks for animations

**Location**: Line 150

---

### 8. SEO Essentials Missing
**Issue**: No mention of sitemap, robots, schema, favicons

**Resolution**: Add to Stage 5 or new Stage 5.5:
- [ ] `sitemap.xml`
- [ ] `robots.txt`
- [ ] Canonical tags
- [ ] JSON-LD schema (Organization/WebSite)
- [ ] Favicon set (multiple sizes)
- [ ] `manifest.json` for PWA

**Location**: Not present (add to Stage 5)

---

### 9. Asset Sourcing Unclear
**Issue**: Logo, OG image, diagram listed but no sourcing/licensing plan

**Resolution**: Add to Stage 3:
- [ ] Font licenses documented (Space Grotesk: OFL, Inter: OFL, JetBrains Mono: OFL)
- [ ] Font hosting decision: self-host (privacy) vs CDN (cache)
- [ ] Image format specifications (logo SVG, OG 1200x630 PNG)
- [ ] Asset creation ownership (who creates?)

**Location**: Lines 179-182

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

### 11. CSS File Structure Inconsistent (Gemini)
**Issue**: Stage 1 creates `variables.css`, `base.css` but Stage 4 introduces `components.css`, `animations.css`

**Resolution**: Either:
- Create all CSS files in Stage 0 (preferred)
- OR consolidate into single `styles.css`

**Location**: Lines 97, 210

---

### 12. Tagline Not Finalized (Gemini)
**Issue**: Two candidates listed, decision needed before copy

**Resolution**: Choose primary tagline before Stage 3:
- "Your AI, grounded" (shorter, punchier)
- "Identity that knows where it came from" (more descriptive)

**Location**: Line 29

---

### 13. Post-Deploy Monitoring Absent (Codex)
**Issue**: No uptime checks or verification beyond initial link testing

**Resolution**: Add to Stage 5 or post-deploy:
- [ ] Basic uptime monitoring (Uptime Robot, Ping, etc.)
- [ ] Status badge in README
- [ ] Periodic link verification

**Location**: Not present

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
- [ ] Finalize tagline choice
- [ ] Create performance budget

### Plan Updates Required
- [ ] Update Stage 5 for Railway.com deployment
- [ ] Update time estimate (8-10 hours total)
- [ ] Rephrase "Quick start commands" → "Getting Started CTA"
- [ ] Simplify audience sections (4 → 2 layers)
- [ ] Add accessibility acceptance criteria (WCAG AA)
- [ ] Add SEO requirements (sitemap, robots, schema)
- [ ] Specify asset sourcing (fonts OFL, self-host)
- [ ] Clarify CSS file structure
- [ ] Add post-deploy monitoring

---

## Cross-References

- **Plan**: `docs/plans/2026-02-08-liveneon-landing-page.md`
- **Codex Review**: `docs/reviews/2026-02-08-liveneon-landing-page-codex.md`
- **Gemini Review**: `docs/reviews/2026-02-08-liveneon-landing-page-gemini.md`
- **Plans Index**: `docs/plans/README.md`

---

*Issue created 2026-02-08 from N=2 code review synthesis*
