# Context: liveneon.org Landing Page Implementation

**Generated**: 2026-02-08
**Scout**: haiku
**Mode**: flexible
**Topic**: liveneon.org landing page implementation review

## Files (17 total)

| File | Lines | Summary |
|------|-------|---------|
| website/index.html | 268 | Single-page landing with semantic HTML, JSON-LD schema, OG tags, skip links, 6 sections (hero, what/why, how, start, footer) |
| website/styles/variables.css | 178 | Design tokens: colors (cyan/purple/near-black), typography (Space Grotesk, Inter, JetBrains Mono), spacing scale, glow effects, breakpoints |
| website/styles/base.css | 131 | CSS reset, typography rules (h1-h6, body, code), link styles, glow utilities, accessibility (skip-link, sr-only, reduced-motion) |
| website/styles/layout.css | 426 | Page structure: container, header/nav, sections, hero, content blocks, buttons, footer, responsive breakpoints (320px, 768px, 1024px) |
| website/styles/components.css | 264 | Visual polish: neon headings, gradient backgrounds, enhanced buttons with glow, journey emoji hover, footer signature glow, visual breath before footer |
| website/styles/animations.css | 268 | Motion effects: glow-pulse, fade-in-up, float keyframes, staggered hero animation, scroll-triggered content blocks, reduced-motion support |
| website/README.md | 227 | Deployment docs: local dev (serve, python, VS Code), Railway deployment steps, DNS config, post-deploy checklist, performance budget |
| website/railway.json | 12 | Railway config: NIXPACKS builder, serve command with $PORT |
| website/robots.txt | 9 | SEO: allows all crawlers, points to sitemap |
| website/sitemap.xml | 10 | SEO: single-page sitemap for liveneon.org |
| website/assets/favicon.svg | 17 | Favicon: "N" letter with cyan-to-purple gradient on dark background |
| website/assets/og-image.svg | 60 | Social preview: 1200x630 with logo, tagline, signature equation, grid pattern |
| website/assets/architecture-diagram.svg | 87 | Architecture: Signal -> Classify -> Axiom flow with provenance arrow |
| website/assets/fonts/space-grotesk-latin.woff2 | (binary) | Self-hosted headline font (OFL license) |
| website/assets/fonts/inter-latin.woff2 | (binary) | Self-hosted body font (OFL license) |
| website/assets/fonts/jetbrains-mono-latin.woff2 | (binary) | Self-hosted code font (OFL license) |
| website/assets/.gitkeep | 0 | Placeholder for assets directory |

**Plan file**: `docs/plans/2026-02-08-liveneon-landing-page.md` (470 lines)

## Relationships

### CSS Cascade
```
variables.css (tokens)
    |
    v
base.css (reset + typography) --> uses tokens
    |
    v
layout.css (structure) --> uses tokens, base classes
    |
    v
components.css (polish) --> uses tokens, extends layout classes
    |
    v
animations.css (motion) --> uses tokens, extends component states
```

### HTML Structure
```
index.html
    |-- imports all 5 CSS files (with cache-busting ?v=1.0)
    |-- references assets/favicon.svg
    |-- references assets/architecture-diagram.svg (lazy loaded)
    |-- links to GitHub repo (external)
    |-- references og-image.svg (via meta tags - note: needs PNG conversion)
```

### Brand Identity Integration
The implementation follows brand guidelines from the plan:
- **Colors**: Electric cyan (#00f0ff), deep purple (#8b5cf6), near-black (#0a0a0f)
- **Typography**: Space Grotesk (headlines), Inter (body), JetBrains Mono (code)
- **Signature elements**: Heart+Emergence=Rainbow, Turtle-Care-Flow in footer
- **CJK accents**: Kotodama in hero, kata in how section

### Section Flow (2-Layer Approach)
1. **Surface Layer** (everyone):
   - Header with logo + GitHub link
   - Hero: Kotodama quote, main tagline, CTAs
2. **Depth Layer** (technical users):
   - What/Why: AI grounding journey narrative
   - How: N=3=kata pattern, architecture diagram
   - Start: Getting started CTAs
3. **Signature**:
   - Footer: Equations, contact, links

## Suggested Focus

- **Priority 1**: `index.html` - Core content, accessibility, SEO meta tags
- **Priority 2**: `layout.css` + `components.css` - Visual implementation, responsiveness
- **Priority 3**: `animations.css` - Motion effects, reduced-motion compliance
- **Priority 4**: SVG assets - Diagram accuracy, OG image rendering

## Exploration Notes

### Implementation Status
All 6 plan stages appear complete:
- Stage 0: Project structure created
- Stage 1: Design system with full token set
- Stage 2: Semantic HTML with all sections
- Stage 3: Content with brand copy, SVG assets
- Stage 4: Neon visual polish, animations
- Stage 5: Railway config ready (deployment pending domain setup)

### Accessibility Features
- Skip links for keyboard navigation
- ARIA landmarks (main, nav, footer)
- Screen reader text for emoji sequences
- prefers-reduced-motion support
- Focus-visible states with glow

### Performance Considerations
- Self-hosted fonts with font-display: swap
- Latin-only unicode ranges for font subsetting
- Lazy loading on architecture diagram
- CSS-only scroll animations with JS fallback
- Cache-busting via query strings

### Potential Review Focus Areas
1. **OG Image**: Currently SVG - may need PNG conversion for social platforms
2. **Font file sizes**: Not measured - should verify against 150KB budget
3. **Lighthouse scores**: Not yet tested
4. **Mobile responsiveness**: Has breakpoints but needs real device testing
5. **GitHub links**: Point to placeholder neon-soul/neon-soul repo

---

*Context generated for implementation review. Plan status: Complete.*
