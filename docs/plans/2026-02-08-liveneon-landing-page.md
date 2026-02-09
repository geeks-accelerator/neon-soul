---
created: 2026-02-08
type: implementation-plan
status: Draft
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

NEON-SOUL lacks a public web presence. The project needs a landing page at liveneon.org that communicates its value proposition to multiple audiences (developers, AI enthusiasts, OpenClaw users, general public) while establishing brand identity.

**Root cause**: No marketing/brand materials exist beyond technical documentation.

**Solution**: Create a single-page landing site with layered messaging for all audiences, dark neon aesthetic, and CJK accents.

## Brand Identity Summary

### Positioning
- **Technical credibility** + **Bold vision**
- Tagline candidates: "Your AI, grounded" or "Identity that knows where it came from"

### Visual Identity
- **Colors**: Electric cyan primary, deep purple secondary, near-black background
- **Typography**: Space Grotesk (headlines), Inter (body), JetBrains Mono (code)
- **Motifs**: Signal → Axiom flow, subtle 言霊/魂 accents, neon glow effects

### Audience Layers
1. Everyone → Bold hero with 1-line hook
2. General/Curious → Non-technical "what is this"
3. AI Enthusiasts → The problem we solve
4. Technical users → Architecture overview
5. Developers → Quick start / GitHub

**Note**: This plan follows the no-code pattern - file paths and acceptance criteria only.

---

## Stages

### Stage 0: Project Setup

**Purpose**: Create project structure and hosting configuration

**Files to create**:
- `website/` directory at project root
- `website/index.html` - Single page
- `website/styles/` - CSS directory
- `website/assets/` - Images, fonts
- `website/README.md` - Deployment docs

**Decisions**:
- Static HTML/CSS/JS (no framework - simple, fast, no build step)
- Host on GitHub Pages initially (free, simple)
- Custom domain: liveneon.org

**Acceptance Criteria**:
- [ ] Website directory structure exists
- [ ] README documents deployment process
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

**Acceptance Criteria**:
- [ ] All color tokens defined
- [ ] Typography scale covers h1-h6, body, code
- [ ] Dark theme only (no light mode needed)
- [ ] Glow effect utility class exists

**Commit**: `feat(neon-soul): add design system for liveneon.org`

---

### Stage 2: Page Structure

**File(s)**: `website/index.html`, `website/styles/layout.css`

**Purpose**: Build semantic HTML structure with all content sections

**Sections** (in order):
1. **Header/Nav**: Logo, GitHub link
2. **Hero**: Tagline, 1-line value prop, CTA
3. **What**: Non-technical explanation (2-3 sentences)
4. **Why**: Problem/solution framing
5. **How**: Architecture diagram (ASCII or SVG)
6. **Start**: Quick start commands, GitHub button
7. **Footer**: 言霊 accent, links, copyright

**Layout Approach**:
- Single column, centered content
- Max-width container for readability
- Full-bleed sections for visual breaks
- Mobile-first responsive

**Acceptance Criteria**:
- [ ] All 7 sections present with semantic HTML
- [ ] Skip links for accessibility
- [ ] Meta tags for SEO (title, description, og:image)
- [ ] Responsive at 320px, 768px, 1024px breakpoints

**Commit**: `feat(neon-soul): build page structure for liveneon.org`

---

### Stage 3: Content & Copy

**File(s)**: `website/index.html` (content), `website/assets/` (images)

**Purpose**: Write compelling copy for each section

**Content Requirements by Section**:

| Section | Word Count | Tone |
|---------|------------|------|
| Hero | 10-15 words | Bold, visionary |
| What | 30-50 words | Accessible, clear |
| Why | 50-80 words | Problem/solution |
| How | 30-50 words + diagram | Technical clarity |
| Start | 20-30 words + commands | Action-oriented |

**Key Messages to Convey**:
- Black box → Glass box (transparency)
- Static config → Emergent identity (growth)
- Unknown → Traceable (provenance)

**Visual Assets Needed**:
- Logo/wordmark (NEON-SOUL)
- Architecture diagram (SVG preferred)
- Open Graph image (1200x630)

**CJK Accents**:
- 言霊 in hero or footer (subtle)
- 魂 as visual element (optional)

**Acceptance Criteria**:
- [ ] All sections have final copy
- [ ] Copy reviewed for clarity at 8th-grade reading level
- [ ] Logo asset created
- [ ] OG image created
- [ ] Architecture diagram matches getting-started guide

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

**Animation Principles**:
- Subtle, not distracting
- Respect prefers-reduced-motion
- Performance-conscious (GPU-accelerated)

**Acceptance Criteria**:
- [ ] Hero has visual impact
- [ ] CTAs have clear hover/focus states
- [ ] Code blocks readable with neon theme
- [ ] Animations respect reduced-motion preference
- [ ] Page loads in <2s on 3G

**Commit**: `style(neon-soul): add neon visual polish to liveneon.org`

---

### Stage 5: Deployment

**File(s)**: `website/CNAME`, GitHub Pages config, DNS settings

**Purpose**: Deploy to liveneon.org

**Deployment Steps**:
1. Enable GitHub Pages for `website/` directory
2. Add CNAME file with `liveneon.org`
3. Configure DNS (A record to GitHub Pages IPs)
4. Verify HTTPS works
5. Test all links and functionality

**DNS Configuration** (document in README):
- A record → GitHub Pages IPs
- CNAME for www → liveneon.org

**Acceptance Criteria**:
- [ ] Site accessible at liveneon.org
- [ ] HTTPS enabled and working
- [ ] www redirects to apex domain
- [ ] All internal links work
- [ ] OG tags render correctly in social previews

**Commit**: `deploy(neon-soul): configure liveneon.org hosting`

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

1. liveneon.org loads in <2s and scores 90+ on Lighthouse
2. All four audience types can find relevant content within 10 seconds
3. Clear path from landing page to GitHub/getting-started
4. Brand identity is consistent and memorable
5. Mobile experience is excellent (60%+ traffic expected)

## Effort Estimate

| Stage | Effort | Description |
|-------|--------|-------------|
| Stage 0 | 15 min | Project setup |
| Stage 1 | 45 min | Design system |
| Stage 2 | 1 hour | Page structure |
| Stage 3 | 2 hours | Content & copy |
| Stage 4 | 1.5 hours | Visual polish |
| Stage 5 | 30 min | Deployment |
| Stage 6 | 15 min | Documentation |

**Total**: ~6 hours active work

## Open Questions

1. **Logo**: Create custom wordmark or use stylized text?
2. **Domain**: Is liveneon.org already registered?
3. **Analytics**: Add simple analytics (Plausible/Fathom) or skip for privacy?
4. **Email capture**: Include newsletter signup or defer?

## Related

- **Getting Started Guide**: `docs/guides/getting-started-guide.md`
- **Grounding Philosophy**: `docs/grounding/evolution-standalone.md` (multiverse)
- **Architecture**: `docs/ARCHITECTURE.md`
- **Brand Discussion**: This plan emerged from branding conversation 2026-02-08

---

*Plan created 2026-02-08. Ready for review.*
