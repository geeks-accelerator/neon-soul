# liveneon.org Implementation Review - Codex

**Date**: 2026-02-08
**Reviewer**: codex-gpt51-examiner (GPT-5.1 Codex Max)
**Files Reviewed**:
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/website/index.html` (268 lines)
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/website/styles/variables.css` (177 lines)
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/website/styles/base.css` (130 lines)
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/website/styles/layout.css` (425 lines)
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/website/styles/components.css` (263 lines)
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/website/styles/animations.css` (267 lines)
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/website/assets/*.svg` (favicon, og-image, architecture-diagram)
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/website/robots.txt`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/website/sitemap.xml`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/website/railway.json`
- `/Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul/website/README.md`

## Summary

The liveneon.org landing page implementation is well-structured with strong semantic HTML, good accessibility foundations, and a clean CSS architecture using design tokens. However, there are critical issues with social preview images (404 due to format mismatch), accessibility concerns with language attributes, and performance budget violations for CSS size. The implementation mostly aligns with the plan but has gaps in favicon coverage and asset format requirements.

## Findings

### Critical

1. **[index.html:14, 20] OG/Twitter image points to non-existent PNG**
   - Meta tags reference `assets/og-image.png` but only `assets/og-image.svg` exists
   - Social previews will 404, breaking link sharing on all major platforms
   - Plan Stage 3 explicitly requires "OG image created" with 1200x630 PNG format
   - **Impact**: Complete failure of social media sharing experience

2. **[index.html:90] Language attribute scope causes accessibility violation**
   - Entire `<p class="hero-quote" lang="ja">` is marked as Japanese
   - Contains English text "Words carry spirit" within the same element
   - Screen readers will attempt to pronounce English text with Japanese phonetics
   - Violates WCAG 3.1.2 (Language of Parts)
   - **Fix**: Scope `lang="ja"` only to the Japanese span containing "kotodama"

### Important

3. **[styles/*.css] CSS payload exceeds critical CSS budget**
   - Total CSS: ~31KB unminified (measured via `wc -c`)
   - Plan specifies <14KB critical CSS budget
   - File breakdown:
     - layout.css: 8.8KB (425 lines)
     - animations.css: 6.3KB (267 lines)
     - components.css: 6.4KB (263 lines)
     - variables.css: 6.0KB (177 lines)
     - base.css: 3.4KB (130 lines)
   - **Impact**: May affect Lighthouse performance score and <2s 3G load target
   - **Recommendation**: Extract above-the-fold critical CSS, defer non-essential styles

4. **[index.html:26] Incomplete favicon coverage**
   - Only SVG favicon declared: `<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">`
   - Plan Stage 5 requires: "Favicon set (16x16, 32x32, 180x180, 512x512)"
   - Missing raster icons affect older browsers, iOS home screen, and PWA manifest
   - **Impact**: Degraded experience on non-SVG-supporting contexts

5. **[styles/animations.css:69-87] Duplicate animation definition creates dead code**
   - `.hero-heading` animation defined at lines 69-72
   - Immediately overwritten by lines 81-87 (same selector)
   - First definition is never applied due to cascade
   - **Impact**: Maintainability concern, potential confusion for future editors

### Minor

6. **[styles/layout.css:309 vs styles/components.css:247] Inconsistent focus ring styles**
   - `layout.css:309`: `.btn:focus-visible { outline-offset: 2px; }`
   - `components.css:247-251`: `.btn:focus-visible { outline-offset: 3px; box-shadow: ... }`
   - Components overrides layout due to load order, but inconsistency reduces predictability
   - **Recommendation**: Consolidate focus styles in one location

7. **[styles/layout.css, components.css] Duplicate margin/padding on .site-footer**
   - `layout.css:352`: `padding-top: var(--space-12);`
   - `components.css:222`: `margin-top: var(--space-16); padding-top: var(--space-16);`
   - Cascade creates combined spacing, which may be intentional but lacks comments
   - **Recommendation**: Document intentional cascade or consolidate

8. **[base.css:111-118, animations.css:227-234] Duplicate reduced-motion handling**
   - Both files contain `@media (prefers-reduced-motion: reduce)` with similar reset rules
   - Not harmful (both apply correctly) but increases maintenance surface
   - **Recommendation**: Consolidate in one file (base.css preferred)

## Plan Compliance Assessment

| Acceptance Criteria | Status | Notes |
|---------------------|--------|-------|
| All 6 sections present | PASS | Hero, What/Why, How, Start, Footer all present |
| Skip links for accessibility | PASS | Two skip links at lines 59-60 |
| WCAG AA color contrast | UNTESTED | Requires Lighthouse/axe verification |
| Focus/hover states | PASS | Comprehensive states in components.css |
| ARIA landmarks | PASS | main, nav, footer all have roles |
| Meta tags for SEO | PARTIAL | Present but og:image will 404 |
| Responsive breakpoints | PASS | 320px, 768px, 1024px covered |
| Favicon set (multi-size) | FAIL | Only SVG, missing raster sizes |
| OG image created (PNG) | FAIL | SVG exists, PNG required |
| Critical CSS <14KB | FAIL | ~31KB total CSS |
| Page load <2s on 3G | UNTESTED | Requires Lighthouse test |
| Lighthouse 90+ | UNTESTED | Requires test after deployment |
| prefers-reduced-motion | PASS | Covered in both base.css and animations.css |

## Observations

### Strengths
- Clean CSS architecture with well-organized tokens in variables.css
- Semantic HTML with proper heading hierarchy (h1, h2, h3)
- JSON-LD schema correctly implemented for Organization type
- Self-hosted fonts with font-display: swap for FOIT prevention
- IntersectionObserver fallback for scroll-timeline animations
- .no-js fallback ensures content visible without JavaScript
- Cache-busting implemented via query strings

### Areas for Improvement
- Consider CSS minification/bundling for production
- Add font preload hints for critical fonts
- Convert og-image.svg to PNG for social platform compatibility
- Generate raster favicon set from SVG source
- Add aria-current="page" to active nav items

## Untested Items

The following require runtime testing (not possible in read-only review):

1. **Lighthouse Performance Score** - Target: 90+
2. **Lighthouse Accessibility Score** - Target: 90+
3. **Lighthouse SEO Score** - Target: 90+
4. **Page load time on 3G** - Target: <2s
5. **Color contrast verification** - WCAG AA 4.5:1 text, 3:1 UI
6. **Mobile responsiveness** - Real device testing at 320px
7. **Social preview cards** - Require deployment to verify
8. **Font file sizes** - Budget: <150KB total (fonts folder shows ~102KB)

## Raw Output

<details>
<summary>Full CLI output</summary>

```
OpenAI Codex v0.63.0 (research preview)
--------
workdir: /Users/twin2/Desktop/projects/multiverse/projects/live-neon/neon-soul
model: gpt-5.1-codex-max
provider: openai
approval: never
sandbox: read-only
reasoning effort: xhigh
reasoning summaries: auto
session id: 019c4079-896b-70f2-bcb4-259e555fcd67
--------

**Findings**
- [`index.html:14`] OG/Twitter image points to `assets/og-image.png`, but the repo only ships `assets/og-image.svg`, so social previews will 404 and plan's PNG requirement isn't met.
- [`index.html:90`] Entire hero quote is marked `lang="ja"` while it contains English text ("Words carry spirit"), causing screen readers to pronounce the English as Japanese; scope the language to the Japanese span only (WCAG 3.1.2).
- [`styles/layout.css:1`] CSS payload across five files is ~31KB (`wc -c`), above the plan's <14KB critical CSS budget; consider trimming/merging and extracting only above-the-fold styles to stay within the performance target.
- [`index.html:26`] Only an SVG favicon is declared; plan Stage 5 calls for raster icons at 16/32/180/512px for broader browser/PWA coverage—those links/files are absent.
- [`styles/animations.css:69`] `.hero-heading` animation is defined twice (69–72 and 81–87); the first rule is immediately overwritten, leaving dead code and potential confusion.
- [`styles/layout.css:309`] Button focus-ring styles here differ from the later override in `styles/components.css:247` (outline-offset 2px vs 3px); consolidate to avoid inconsistent focus feedback.

Testing: Not run in this read-only session; Lighthouse/axe/perf checks for the <2s/90+ targets remain outstanding.

tokens used: 237,490
```

</details>

---

*Review generated by codex-gpt51-examiner agent using Codex CLI v0.63.0 with gpt-5.1-codex-max model in read-only sandbox mode.*
