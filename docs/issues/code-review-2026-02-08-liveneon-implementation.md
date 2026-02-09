# Code Review Issue: liveneon.org Implementation

**Created**: 2026-02-08
**Source**: Code review synthesis (N=2 external)
**Reviews**:
- `docs/reviews/2026-02-08-liveneon-implementation-codex.md`
- `docs/reviews/2026-02-08-liveneon-implementation-gemini.md`
**Context**: `docs/reviews/2026-02-08-liveneon-implementation-context.md`
**Plan**: `docs/plans/2026-02-08-liveneon-landing-page.md`

---

## Summary

External code review (Codex + Gemini) of the liveneon.org landing page implementation. Overall assessment is positive - both reviewers found the implementation well-structured with strong accessibility and semantic HTML. Issues are refinements rather than fundamental problems.

**Codex**: 2 critical, 3 important, 3 minor
**Gemini**: 0 critical, 2 important, 4 minor

---

## N=2 Verified (Cross-Reviewer Related)

### 1. Japanese Text Handling
**Codex**: `lang="ja"` scope issue - entire paragraph marked as Japanese including English text
**Gemini**: Unicode-range may exclude Japanese kanji from intended fonts

**Analysis**: Both reviewers flag Japanese text concerns from different angles:
- Codex: Accessibility - screen readers will mispronounce English as Japanese
- Gemini: Typography - Japanese characters may not render with intended font

**Resolution**:
- [ ] Fix `lang="ja"` scope - apply only to Japanese span, not entire paragraph
- [ ] Verify Japanese kanji renders correctly with system fallback fonts
- [ ] Consider if unicode-range needs CJK addition

**Location**: `index.html:90-91`, `variables.css:21-23`

---

### 2. Duplicate/Redundant CSS Patterns
**Codex**: Duplicate reduced-motion handling in base.css and animations.css (minor)
**Gemini**: Notes reduced-motion support in both files as strength (different perspective)

**Analysis**: Not harmful but increases maintenance surface.

**Resolution**:
- [ ] Consider consolidating reduced-motion rules in one file (base.css preferred)

**Location**: `base.css:111-118`, `animations.css:227-234`

---

## Critical (Codex Only)

### 3. OG/Twitter Image 404
**Issue**: Meta tags reference `og-image.png` but only `.svg` exists. Social previews will 404.

**Impact**: Complete failure of social media sharing experience on all platforms.

**Resolution**:
- [ ] Convert `og-image.svg` to PNG (1200x630)
- [ ] OR update meta tags to reference `.svg` (less compatible)

**Location**: `index.html:14,20`

---

### 4. Language Attribute Accessibility Violation
**Issue**: `<p class="hero-quote" lang="ja">` marks entire paragraph as Japanese, but contains English text "Words carry spirit".

**Impact**: Screen readers will pronounce English with Japanese phonetics. Violates WCAG 3.1.2.

**Resolution**:
- [ ] Scope `lang="ja"` only to the Japanese span containing "言霊"

**Location**: `index.html:90`

---

## Important

### 5. CSS Exceeds Budget (Codex)
**Issue**: Total CSS ~31KB unminified vs <14KB critical CSS budget in plan.

**Breakdown**:
| File | Size |
|------|------|
| layout.css | 8.8KB |
| animations.css | 6.3KB |
| components.css | 6.4KB |
| variables.css | 6.0KB |
| base.css | 3.4KB |

**Impact**: May affect Lighthouse performance score and <2s 3G load target.

**Resolution**:
- [ ] Test Lighthouse score before addressing
- [ ] If needed: extract critical CSS, defer non-essential styles
- [ ] Consider CSS minification for production

**Location**: All CSS files

---

### 6. Incomplete Favicon Coverage (Codex)
**Issue**: Only SVG favicon declared. Plan requires raster sizes: 16x16, 32x32, 180x180, 512x512.

**Impact**: Degraded experience on non-SVG-supporting contexts (older browsers, iOS home screen, PWA).

**Resolution**:
- [ ] Generate raster favicon set from SVG source
- [ ] Add `<link>` tags for each size
- [ ] OR document SVG-only as intentional decision (modern browsers only)

**Location**: `index.html:26`

---

### 7. Duplicate Animation Definition (Codex)
**Issue**: `.hero-heading` animation defined twice in animations.css. First definition is dead code.

**Impact**: Maintainability concern, potential confusion.

**Resolution**:
- [ ] Remove duplicate definition (lines 69-72, keep 81-87)

**Location**: `animations.css:69-87`

---

### 8. Email Exposed to Spam Bots (Gemini)
**Issue**: `soul@liveneon.org` directly exposed in footer, susceptible to scraping.

**Resolution**:
- [ ] Obfuscate email (CSS text reversal, JS assembly, or split spans)
- [ ] OR accept risk for a low-traffic project site

**Location**: `index.html:226`

---

## Minor

### 9. Redundant Role Attributes (Gemini)
**Issue**: `role="banner"`, `role="main"`, `role="contentinfo"` redundant on HTML5 semantic elements.

**Resolution**: Optional - remove for cleaner HTML

**Location**: `index.html:67,85,212`

---

### 10. Inconsistent Focus Ring Styles (Codex)
**Issue**: Button focus styles differ between layout.css (2px offset) and components.css (3px offset).

**Resolution**: Consolidate focus styles in one location

**Location**: `layout.css:309`, `components.css:247`

---

### 11. Duplicate Footer Spacing (Codex)
**Issue**: `.site-footer` has padding/margin in both layout.css and components.css.

**Resolution**: Document intentional cascade or consolidate

**Location**: `layout.css:352`, `components.css:222`

---

### 12. Cache-Busting Strategy (Gemini)
**Issue**: Querystring (`?v=1.0`) can be ignored by some proxies/CDNs. Filename hashing more robust.

**Resolution**: Acceptable for static site - consider build tool for future

**Location**: `index.html:49-53`

---

### 13. SVG Optimization (Gemini)
**Issue**: SVGs could be further optimized with SVGO.

**Resolution**: Run `npx svgo -f website/assets`

**Location**: `assets/*.svg`

---

### 14. Lazy Loading Verification (Gemini)
**Issue**: `loading="lazy"` on diagram - verify it's below fold on all viewports.

**Resolution**: Verify position, likely correct

**Location**: `index.html:165`

---

## Items Requiring Runtime Testing

Both reviewers note these cannot be verified in read-only review:

- [ ] Lighthouse Performance Score (target: 90+)
- [ ] Lighthouse Accessibility Score (target: 90+)
- [ ] Lighthouse SEO Score (target: 90+)
- [ ] Page load time on 3G (target: <2s)
- [ ] Color contrast verification (WCAG AA 4.5:1 text, 3:1 UI)
- [ ] Mobile responsiveness on real devices
- [ ] Social preview cards (requires deployment)

---

## Action Items

### Critical (Fix Before Deploy)
- [ ] Convert og-image.svg to PNG OR update meta tags
- [ ] Fix `lang="ja"` scope to Japanese text only

### Important (Fix Soon)
- [ ] Remove duplicate `.hero-heading` animation
- [ ] Generate raster favicon set OR document SVG-only decision
- [ ] Consider email obfuscation
- [ ] Run Lighthouse test after deployment

### Minor (Optional)
- [ ] Consolidate reduced-motion handling
- [ ] Remove redundant role attributes
- [ ] Consolidate focus ring styles
- [ ] Run SVGO on assets

---

## Cross-References

- **Plan**: `docs/plans/2026-02-08-liveneon-landing-page.md`
- **Codex Review**: `docs/reviews/2026-02-08-liveneon-implementation-codex.md`
- **Gemini Review**: `docs/reviews/2026-02-08-liveneon-implementation-gemini.md`
- **Context**: `docs/reviews/2026-02-08-liveneon-implementation-context.md`
- **Prior Issues**:
  - `docs/issues/code-review-2026-02-08-liveneon-landing-page.md` (plan review, resolved)
  - `docs/issues/twin-review-2026-02-08-liveneon-landing-page.md` (plan review, resolved)

---

*Issue created 2026-02-08 from N=2 code review synthesis*
