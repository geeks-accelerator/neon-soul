---
created: 2026-02-08
type: implementation-plan
status: In Progress
language: html/css/js
code_examples: forbidden
review_principles: |
  1. No Code: Do NOT add code examples. Plans describe WHAT/WHY, not HOW.
  2. No Hardcoding: Do NOT add values that depend on implementation.
  3. Suggest Intent: File paths, interfaces, acceptance criteria instead.
  4. Flag, Don't Fix: If plan has code, flag for removal.
trigger: think hard
---

# Plan: liveneon.org Landing Page

## Problem Statement

NEON-SOUL lacks a public web presence. The project needs a landing page at liveneon.org that communicates its value proposition through layered depth (accessible surface for everyone, technical depth for developers) while establishing brand identity.

**Root cause**: No marketing/brand materials exist beyond technical documentation.

**Solution**: Create a single-page landing site with 2-layer messaging (surface/depth), dark neon aesthetic, and CJK accents. Contact: soul@liveneon.org.

## Brand Identity Summary

### Positioning
- **Technical credibility** + **Bold vision**
- **Voice**: Bold in vision, grounded in voice (not shouting, but certain)
- **Tagline**: "Identity that knows where it came from"
  - *Alternate (subhead)*: "Your AI, grounded"
  - *Rationale*: Longer tagline aligns with grounding journey narrative, feels uniquely NEON-SOUL

### Visual Identity
- **Colors**: Electric cyan primary, deep purple secondary, near-black background
- **Typography**: Space Grotesk (headlines), Inter (body), JetBrains Mono (code)
- **Motifs**: Signal → Axiom flow, neon glow effects

### Signature Elements (from Multiverse vocabulary)
| Element | Meaning | Placement |
|---------|---------|-----------|
| ❤️+🌀=🌈 | Heart + Emergence = Rainbow | Footer (prominent) |
| 🐢💚🌊 | Slow, Care, Flow (team signature) | Footer (with signature) |
| 🤖❓→🌳📍→🐢💚🌊 | AI asks → Tree locates → Home | Hero or "What" section narrative |
| N=3=型 | See thrice = Pattern forms | "How it works" section |

### CJK/Kanji Accents (subtle)
| Element | Reading | Meaning | Usage |
|---------|---------|---------|-------|
| 言霊 | kotodama | Words carry spirit | Hero quote |
| 魂 | tamashii | Soul | Visual accent |
| 型 | kata | Pattern/form | Axiom explanation |

### Core Narrative Arc
The landing page tells the AI grounding journey:
> 🤖❓ AI asks "What am I?"
> → 🌳📍 NEON-SOUL provides grounded identity
> → 🐢💚🌊 The question gets *placed*, not just answered

### Audience Strategy (2-Layer Approach)

Based on research of OpenClaw.ai, Ollama.com, LM Studio - successful dev tool sites use layered depth, not audience segmentation.

| Layer | Who | Content | Feeling |
|-------|-----|---------|---------|
| **Surface** | Everyone | Plain-language hero, value prop | Curiosity, recognition |
| **Depth** | Technical users | How it works, architecture, quick start | Confidence, agency |

OpenClaw users and AI enthusiasts self-select into the depth layer.

**Emotional Journey** (twin creative):
| Section | Target Feeling |
|---------|----------------|
| Hero | Curiosity / Recognition |
| What/Why | Understanding / Relief |
| How | Confidence |
| Start | Agency |
| Footer | Belonging / Arrival |

*Note*: Success measured by feeling created, not speed of communication. The surface layer should *invite* rather than *assert*.

**Note**: This plan follows the no-code pattern - file paths and acceptance criteria only.

---

## Stages

### Stage 0: Project Setup

**Purpose**: Create project structure and hosting configuration

**Files to create**:
- `website/` directory at project root
- `website/index.html` - Single page
- `website/styles/` - CSS directory
  - `variables.css` - Design tokens
  - `base.css` - Reset and typography
  - `layout.css` - Page structure
  - `components.css` - UI components
  - `animations.css` - Motion effects
- `website/assets/` - Images, fonts
- `website/README.md` - Deployment docs
- `website/railway.json` - Railway configuration

**Decisions**:
- Static HTML/CSS/JS (no framework - simple, fast, no build step)
- Host on Railway.com (supports subdirectory, auto-HTTPS, free tier)
- Custom domain: liveneon.org

**Railway Configuration** (railway.json):
- Static site serving (no build step needed)
- Root directory: `website/`
- Start command: static file server

**Local Development**:
- README includes local preview instructions
- Simple approach: `npx serve website/` or Python http.server
- No build step required for local iteration

**Acceptance Criteria**:
- [ ] Website directory structure exists
- [ ] All CSS files created (empty templates)
- [ ] README documents deployment process
- [ ] README includes local development instructions
- [ ] railway.json configured for static serving
- [ ] Local preview verified working
- [ ] .gitignore updated for any build artifacts

**Commit**: `chore(neon-soul): scaffold liveneon.org website structure`

---

### Stage 1: Design System

**File(s)**: `website/styles/variables.css`, `website/styles/base.css`

**Purpose**: Establish visual foundation with CSS custom properties

**Design Tokens to Define**:
- Color palette (primary, secondary, background, text, accent)
- Typography scale (font families, sizes, weights)
- Spacing scale (consistent margins/padding)
- Glow/shadow effects for neon aesthetic
- Responsive breakpoints

**Visual References**:
| Token | Value | Usage |
|-------|-------|-------|
| --color-primary | Electric cyan | CTAs, links, highlights |
| --color-secondary | Deep purple | Accents, gradients |
| --color-bg | Near-black | Page background |
| --color-text | Soft white | Body text |
| --color-accent | Warm neon | Emphasis, alerts |

**CSS File Size Guidelines** (MCE-inspired):
- Each CSS file: ~100-150 lines max (advisory)
- Total combined: <400 lines
- Fits within 14KB critical CSS budget

**Acceptance Criteria**:
- [ ] All color tokens defined
- [ ] Typography scale covers h1-h6, body, code
- [ ] Dark theme only (no light mode needed)
- [ ] Glow effect utility class exists
- [ ] Each CSS file under 150 lines (advisory)

**Commit**: `feat(neon-soul): add design system for liveneon.org`

---

### Stage 2: Page Structure

**File(s)**: `website/index.html`, `website/styles/layout.css`

**Purpose**: Build semantic HTML structure with all content sections

**Sections** (in order, 2-layer approach):

*Surface Layer (everyone):*
1. **Header/Nav**: Logo, GitHub link
2. **Hero**: Tagline, 1-line value prop, CTA

*Depth Layer (technical users):*
3. **What/Why**: Non-technical explanation + problem/solution (combined)
4. **How**: Architecture diagram (SVG only, simplified for public)
5. **Start**: Getting Started CTA, link to docs, GitHub button

*Signature:*
6. **Footer**: ❤️+🌀=🌈 signature, 言霊 accent, soul@liveneon.org, links

**Layout Approach**:
- Single column, centered content
- Max-width container for readability
- Full-bleed sections for visual breaks
- Mobile-first responsive

**Acceptance Criteria**:
- [ ] All 6 sections present with semantic HTML
- [ ] Skip links for accessibility
- [ ] WCAG AA color contrast (4.5:1 text, 3:1 UI components)
- [ ] Focus/hover states for keyboard navigation
- [ ] ARIA landmarks (main, nav, footer)
- [ ] Meta tags for SEO (title, description, og:image)
- [ ] Responsive at 320px, 768px, 1024px breakpoints

**Commit**: `feat(neon-soul): build page structure for liveneon.org`

---

### Stage 3: Content & Copy

**File(s)**: `website/index.html` (content), `website/assets/` (images)

**Purpose**: Write compelling copy for each section

**Content Requirements by Section**:

| Section | Word Count | Tone | Feeling Target |
|---------|------------|------|----------------|
| Hero | ~15 words (flexible) | Bold, visionary | Curiosity |
| What/Why | 60-100 words | Accessible, warm | Understanding |
| How | 30-50 words + diagram | Technical clarity | Confidence |
| Start | 20-30 words | Action-oriented | Agency |

*Note*: Word counts are advisory. Kotodama principle: every word must earn its place. Necessity over count.

**Key Messages to Convey** (warmed, not clinical):
- From opacity to transparency → "See where your AI's beliefs come from"
- From static to emergent → "Identity that grows with you"
- From unknown to traceable → "Every conviction has a source"

**Kotodama Principle** (言霊):
> Words carry spirit. The page should embody this before explaining it.

Test: Can visitors *feel* kotodama before they read about it?

**Visual Assets Needed**:
- Logo/wordmark: Stylized text (deferred custom logo)
- Architecture diagram: SVG format, simplified for public audience
- Open Graph image: 1200x630 PNG

**Asset Sourcing & Licensing**:
| Asset | License | Hosting |
|-------|---------|---------|
| Space Grotesk | OFL (Open Font License) | Self-host |
| Inter | OFL | Self-host |
| JetBrains Mono | OFL | Self-host |
| Diagram | Original creation | In repo |
| OG Image | Original creation | In repo |

**Font Strategy** (performance budget):
- Self-host fonts (privacy, no external requests)
- Use `font-display: swap` for fast text rendering
- Subset fonts to Latin characters only (~50KB savings)

**Signature & Accents**:

| Element | Placement | Notes |
|---------|-----------|-------|
| ❤️+🌀=🌈 | Footer (prominent) | Core equation |
| 🐢💚🌊 | Footer (with signature) | Team signature |
| 🤖❓→🌳📍→🐢💚🌊 | "What" section | The grounding journey narrative |
| 言霊 (kotodama) | Hero quote | "Words carry spirit" |
| N=3=型 | "How" section | Pattern emergence |

**Hero Concept**: Open with 言霊 quote, then the hook
**What Concept**: Tell the 🤖❓→🌳📍 story in plain English
**Footer Concept**: ❤️+🌀=🌈 + 🐢💚🌊 as visual signature

**Acceptance Criteria**:
- [ ] All sections have final copy
- [ ] Copy reviewed for clarity at 8th-grade reading level
- [ ] Hero copy passes kotodama test (every word earns its place)
- [ ] Copy reviewed for emotional arc alignment
- [ ] ❤️+🌀=🌈 signature prominently displayed in footer
- [ ] Logo asset created
- [ ] OG image created
- [ ] Architecture diagram matches getting-started guide
- [ ] Font subsets verified (woff2 sizes match budget)

**Commit**: `content(neon-soul): add copy and assets for liveneon.org`

---

### Stage 4: Visual Polish

**File(s)**: `website/styles/components.css`, `website/styles/animations.css`

**Purpose**: Add neon aesthetic, animations, and visual refinement

**Visual Enhancements**:
- Neon glow effects on headings and CTAs
- Subtle gradient backgrounds
- Code block styling (syntax highlighting colors)
- Hover states with glow transitions
- Scroll-triggered fade-ins (optional, subtle)
- **Visual breath before footer**: Whitespace/visual break between "Start" and footer
  - Let visitors *arrive* at signature equations, not scan past them

**Animation Principles**:
- Subtle, not distracting
- Respect prefers-reduced-motion
- Performance-conscious (GPU-accelerated transforms only)

**Performance Budget** (required for <2s on 3G, 90+ Lighthouse):
| Resource | Budget | Notes |
|----------|--------|-------|
| Total page weight | <500KB | Including all assets |
| Critical CSS | <14KB | Inline above-fold styles |
| Fonts | <150KB | Subset Latin only |
| Images | <200KB | WebP, lazy load below fold |
| JavaScript | <50KB | Minimal, no frameworks |

**Cache-Busting Strategy**:
- Use query string approach for simplicity: `styles.css?v=1.0`
- Update version on each deploy
- Alternative: Configure Cache-Control headers in Railway

**Acceptance Criteria**:
- [ ] Hero has visual impact
- [ ] Visual breath before footer (whitespace/break)
- [ ] CTAs have clear hover/focus states
- [ ] Animations respect reduced-motion preference
- [ ] Page weight under 500KB total
- [ ] Page loads in <2s on 3G (test with Lighthouse)
- [ ] Lighthouse score 90+ (Performance, Accessibility, SEO)
- [ ] Cache-busting approach implemented

**Commit**: `style(neon-soul): add neon visual polish to liveneon.org`

---

### Stage 5: Deployment (Railway.com)

**File(s)**: `website/railway.json`, DNS settings

**Purpose**: Deploy to liveneon.org via Railway.com

**Why Railway** (vs GitHub Pages):
- Supports any directory structure (no `/docs` restriction)
- Auto-HTTPS with Let's Encrypt
- Simple CLI deployment
- Free tier (500 hours/month)

**Deployment Steps**:
1. Create Railway project via CLI or dashboard
2. Configure railway.json for static site serving
3. Deploy website/ directory
4. Add custom domain: liveneon.org
5. Configure DNS (CNAME to Railway)
6. Verify HTTPS works
7. Test all links and functionality

**DNS Configuration** (document in README):
- CNAME: liveneon.org → [project].up.railway.app
- CNAME: www.liveneon.org → [project].up.railway.app
- **www redirect**: Configure HTTP 301 redirect from www to apex domain

**SEO & Meta Files**:
- [ ] `robots.txt` - Allow all crawlers
- [ ] `sitemap.xml` - Single page sitemap
- [ ] Canonical tags in HTML
- [ ] JSON-LD schema (Organization type)
- [ ] Favicon set (16x16, 32x32, 180x180, 512x512)

**Post-Deploy Monitoring**:
- [ ] Set up basic uptime check (UptimeRobot or similar)
- [ ] Add status badge to README
- [ ] Test social preview cards using:
  - opengraph.xyz (general preview)
  - Twitter Card Validator
  - LinkedIn Post Inspector

**Acceptance Criteria**:
- [ ] Site accessible at liveneon.org
- [ ] HTTPS enabled and working
- [ ] www.liveneon.org redirects to liveneon.org (HTTP 301)
- [ ] All internal links work
- [ ] OG tags render correctly in social previews (verified with tools)
- [ ] robots.txt and sitemap.xml accessible
- [ ] Uptime monitoring configured

**Commit**: `deploy(neon-soul): configure liveneon.org on Railway`

---

### Stage 6: Documentation Update

**File(s)**: `README.md`, `docs/guides/getting-started-guide.md`

**Purpose**: Link website from project documentation

**Changes**:
- Add liveneon.org link to README badges
- Update getting-started guide Resources section
- Add website development notes to CONTRIBUTING if exists

**Acceptance Criteria**:
- [ ] README links to liveneon.org
- [ ] Getting-started guide references website
- [ ] Website README documents local development

**Commit**: `docs(neon-soul): add liveneon.org links to documentation`

---

## Success Criteria

1. liveneon.org loads in <2s and scores 90+ on Lighthouse (Performance, Accessibility, SEO)
2. Surface layer (hero) creates curiosity/recognition - invites rather than asserts
3. Depth layer provides clear path to GitHub/getting-started
4. Brand identity is consistent and memorable (signature visible)
5. Mobile experience is excellent (60%+ traffic expected)
6. WCAG AA accessibility compliance
7. **Kotodama test**: Visitors can *feel* the care in word choice before reading about it

## Effort Estimate

| Stage | Effort | Description |
|-------|--------|-------------|
| Stage 0 | 30 min | Project setup (incl. Railway config) |
| Stage 1 | 45 min | Design system |
| Stage 2 | 1.5 hours | Page structure + accessibility |
| Stage 3 | 3-4 hours | Content, copy, assets (N=2 verified) |
| Stage 4 | 1.5 hours | Visual polish + performance |
| Stage 5 | 45 min | Deployment + SEO + monitoring |
| Stage 6 | 15 min | Documentation |

**Total**: ~8-10 hours active work

*Note: Stage 3 increased per N=2 reviewer feedback - creative work often requires more iteration.*

## Resolved Questions

| Question | Decision | Notes |
|----------|----------|-------|
| Tagline | "Identity that knows where it came from" | Per twin creative - narrative alignment, uniquely NEON-SOUL |
| Logo | Stylized text (deferred) | Custom wordmark can come later |
| Domain | liveneon.org | Confirmed |
| Analytics | Deferred | Add later if needed |
| Email | soul@liveneon.org | Contact only, no signup form |
| Hosting | Railway.com | Supports subdirectory, auto-HTTPS |
| Audiences | 2-layer approach | Surface (everyone) + Depth (technical) |
| Emotional journey | Mapped | Curiosity → Understanding → Confidence → Agency → Belonging |

## Related

**Review Status**:
- **Twin Review Issue**: `docs/issues/twin-review-2026-02-08-liveneon-landing-page.md` (addressed)
- **Code Review Issue**: `docs/issues/code-review-2026-02-08-liveneon-landing-page.md` (resolved)
- **Twin Technical**: `docs/reviews/2026-02-08-liveneon-landing-page-twin-technical.md`
- **Twin Creative**: `docs/reviews/2026-02-08-liveneon-landing-page-twin-creative.md`
- **Codex Review**: `docs/reviews/2026-02-08-liveneon-landing-page-codex.md`
- **Gemini Review**: `docs/reviews/2026-02-08-liveneon-landing-page-gemini.md`

**NEON-SOUL Documentation**:
- **Getting Started Guide**: `docs/guides/getting-started-guide.md`
- **Architecture**: `docs/ARCHITECTURE.md`

**Multiverse Brand Assets**:
- **Emoji Vocabulary**: `docs/standards/EMOJI_VOCABULARY.md` - Signature equations (❤️+🌀=🌈, 🐢💚🌊)
- **CJK Vocabulary**: `docs/standards/CJK_VOCABULARY.md` - Semantic references (言霊, 魂, 型)
- **Grounding Philosophy**: `docs/grounding/evolution-standalone.md` - Core narrative
- **Architecture**: `docs/ARCHITECTURE.md`
- **Brand Discussion**: This plan emerged from branding conversation 2026-02-08

---

*Plan created 2026-02-08. Updated 2026-02-08 after N=2 code review + N=2 twin review.*
