# liveneon.org Website

Static landing page for NEON-SOUL at [liveneon.org](https://liveneon.org).

## Local Development

No build step required. Serve the website directory directly.

### Option 1: npx serve (recommended)

```bash
npx serve website/
```

Then open http://localhost:3000 in your browser.

### Option 2: Python http.server

```bash
cd website
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

### Option 3: VS Code Live Server

1. Install the "Live Server" extension
2. Right-click `website/index.html`
3. Select "Open with Live Server"

## Deployment (Railway.com)

The site is deployed to Railway.com with automatic HTTPS.

### Initial Setup

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link project (from project root):
   ```bash
   railway link
   ```

### Deploy

From the project root:

```bash
railway up
```

Railway uses the `railway.json` configuration to serve the static site.

### Custom Domain

1. In Railway dashboard, go to project settings
2. Add custom domain: `liveneon.org`
3. Configure DNS with your registrar:
   - CNAME: `liveneon.org` -> `[project].up.railway.app`
   - CNAME: `www.liveneon.org` -> `[project].up.railway.app`
4. Configure www redirect in Railway dashboard (HTTP 301 to apex)

### Verify Deployment

- Site: https://liveneon.org
- HTTPS: Should auto-provision via Let's Encrypt
- www redirect: https://www.liveneon.org should redirect to https://liveneon.org

## File Structure

```
website/
├── index.html          # Single page
├── railway.json        # Railway deployment config
├── README.md           # This file
├── styles/
│   ├── variables.css   # Design tokens
│   ├── base.css        # Reset and typography
│   ├── layout.css      # Page structure
│   ├── components.css  # UI components
│   └── animations.css  # Motion effects
└── assets/             # Images, fonts
```

## Performance Budget

| Resource | Budget |
|----------|--------|
| Total page weight | <500KB |
| Critical CSS | <14KB |
| Fonts | <150KB |
| Images | <200KB |
| JavaScript | <50KB |

Target: <2s load on 3G, Lighthouse 90+

## Related

- [NEON-SOUL README](../README.md)
- [Implementation Plan](../docs/plans/2026-02-08-liveneon-landing-page.md)
