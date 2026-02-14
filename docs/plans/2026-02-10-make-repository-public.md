# Plan: Make neon-soul Repository Public

**Created**: 2026-02-10
**Updated**: 2026-02-11 (code review + twin review findings integrated)
**Status**: Draft
**Priority**: High
**Risk Level**: Medium (requires careful verification)

## Summary

This plan outlines the steps to safely make the `live-neon/neon-soul` GitHub repository public. The repository has been assessed and is generally ready for public release, but this plan ensures systematic verification before and after the transition.

---

## Repository URLs Clarification

| Platform | URL | Username/Org |
|----------|-----|--------------|
| **GitHub** (source) | `https://github.com/live-neon/neon-soul` | geeks-accelerator |
| **npm** (package) | `https://www.npmjs.com/package/neon-soul` | leegitw |
| **ClawHub** (skill) | `https://clawhub.ai/leegitw/neon-soul` | leegitw |

**Note**: The npm package and ClawHub skill are already public (v0.1.5). Making the GitHub repository public adds visibility to commit history, enables community contributions, and provides GitHub-native security features.

---

## Pre-Assessment Results

### Security Scan Summary

| Check | Status | Notes |
|-------|--------|-------|
| Hardcoded API keys in source | ✅ Clean | No credentials in `.ts`, `.js`, `.json` files |
| Environment files | ✅ Clean | Only `.example` templates committed |
| Git history (secrets) | ✅ Clean | `sk-ant` reference is documentation only |
| .gitignore coverage | ✅ Complete | All sensitive patterns excluded |
| .npmignore coverage | ✅ Complete | Sensitive files excluded from npm publish |
| License | ✅ Present | MIT License (permissive, appropriate) |
| README | ✅ Complete | 422 lines, comprehensive documentation |
| Test fixtures | ✅ Safe | Synthetic data, no PII |
| Deleted .env files | ✅ None | No secrets ever committed |

### Files Verified

```
.gitignore          - Properly excludes .env, node_modules, build artifacts
.npmignore          - Properly excludes sensitive items for npm publish
LICENSE             - MIT License (Copyright 2026 Geeks Accelerator)
README.md           - Comprehensive, suitable for public audience
package.json        - Clean, no embedded secrets
skill/.env.example  - Placeholder tokens only
```

---

## Implementation Stages

### Stage 1: Final Security Verification (Pre-Public)

**Objective**: Perform final automated and manual security checks.

**Tasks**:

1. **Run comprehensive secret scan with dedicated tooling** (N=2 code review + N=2 twin review)
   ```bash
   # PREREQUISITE: Verify tooling installed (N=2 twin review)
   which gitleaks || echo "⚠️  gitleaks not installed - run: brew install gitleaks"
   which trufflehog || echo "⚠️  trufflehog not installed - run: pip install truffleHog"

   # RECOMMENDED: Use gitleaks for comprehensive history scan
   brew install gitleaks  # or: go install github.com/gitleaks/gitleaks/v8@latest
   gitleaks detect --source . --verbose --log-opts="--all"

   # ALTERNATIVE: Use truffleHog
   pip install truffleHog
   truffleHog filesystem . --only-verified

   # FALLBACK: Manual patterns (covers fewer cases)
   git grep -E "(sk-ant-|sk-|ghp_|gho_|AKIA|password\s*=|secret\s*=)" -- "*.ts" "*.js" "*.json" "*.md" "*.yaml" "*.yml" "*.sh" "*.tf"

   # Check for PEM/private keys
   git grep -E "(BEGIN RSA|BEGIN OPENSSH|BEGIN EC|BEGIN PGP)" -- .

   # Check for base64-encoded secrets (common pattern)
   git grep -E "eyJ[A-Za-z0-9_-]+\." -- "*.ts" "*.js" "*.json"  # JWT pattern

   # Check for .env files that shouldn't exist (exclude node_modules)
   find . -name "*.env" -o -name ".env.*" | grep -v ".example" | grep -v node_modules

   # Check git history for any deleted sensitive files
   git log --all --full-history --diff-filter=D -- "*.env" ".env*" "*secret*" "*credential*" "*.pem" "*.key"

   # Check for git LFS files that may contain secrets
   git lfs ls-files 2>/dev/null || echo "No LFS files"
   ```

2. **Verify no uncommitted sensitive files**
   ```bash
   git status
   ls -la | grep -i env
   ```

3. **Check for hardcoded URLs that should be configurable**
   ```bash
   git grep -n "localhost:" -- "*.ts" | grep -v test | grep -v spec
   git grep -n "127.0.0.1" -- "*.ts" | grep -v test | grep -v spec
   ```

**Acceptance Criteria**:
- [ ] gitleaks or truffleHog scan passes with no findings
- [ ] No real API keys or secrets found in codebase
- [ ] No uncommitted .env files
- [ ] Git history clean of credential commits (full history scan)
- [ ] No PEM/private keys or JWTs in repository
- [ ] Localhost references only in test files or clearly documented

---

### Stage 2: Documentation Review

**Objective**: Ensure documentation is appropriate for public consumption.

**Tasks**:

1. **Review README.md for public audience**
   - [ ] Installation instructions clear and complete
   - [ ] Quick start guide works for new users
   - [ ] No internal references or private URLs
   - [ ] License badge or reference present
   - [ ] Contributing guidelines (optional but recommended)
   - [x] **Fix GitHub URL**: Line 227 updated to `live-neon/neon-soul`
   - [x] ClawHub URL (line 236) is correct as `leegitw/neon-soul`

2. **Enhance README for first impressions** (N=2 twin review)
   - [ ] Add MIT license badge after website badge (line 3):
     ```markdown
     [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
     ```
   - [ ] Add quick navigation links after title:
     ```markdown
     **Quick Links**: [Install](#installation) | [Contribute](#development-setup) | [Research](#research-questions)
     ```
   - [ ] Add brief "What is a Soul Document?" section for newcomers (before or after Core Insight):
     ```markdown
     ## What is a Soul Document?

     A **soul document** is a compressed representation of an AI agent's identity, values, and behavioral principles. Instead of loading thousands of memory tokens, agents load a small soul file (~100-500 tokens) that captures their core essence with full provenance tracking.
     ```

3. **Review docs/ folder**
   - [ ] No internal meeting notes or private discussions
   - [ ] No references to internal systems or private APIs
   - [ ] Architecture docs suitable for external developers

4. **Review .env.example files** (N=2 code review)
   - [ ] `docker/.env.example:18` has `sk-ant-your-key-here` placeholder
   - [ ] Consider changing to `your_anthropic_api_key_here` to avoid security scanner false positives
   - [ ] `skill/.env.example` is clean (uses `your_token_here`)

5. **Check for TODO/FIXME with sensitive context**
   ```bash
   git grep -n "TODO\|FIXME" -- "*.ts" "*.md" | head -20
   ```

**Acceptance Criteria**:
- [ ] README suitable for external developers
- [ ] GitHub URLs point to live-neon/neon-soul
- [ ] No internal-only documentation exposed
- [ ] TODOs don't reveal sensitive roadmap items
- [ ] .env.example files use clear placeholder formats

---

### Stage 3: License and Legal Verification

**Objective**: Ensure legal compliance for open source release.

**Tasks**:

1. **Verify LICENSE file**
   - [ ] MIT License present and properly formatted
   - [ ] Copyright year and entity correct (2026 Geeks Accelerator)

2. **Check dependency licenses including transitive** (N=2 code review + N=2 twin review)
   ```bash
   # Install license-checker
   npm install -g license-checker

   # Check all production dependencies (including transitive)
   npx license-checker --production --summary

   # Verify only MIT-compatible licenses (with success confirmation)
   npx license-checker --production --onlyAllow 'MIT;ISC;Apache-2.0;BSD-2-Clause;BSD-3-Clause;0BSD;CC0-1.0;Unlicense' \
     && echo "✅ LICENSE CHECK PASSED" \
     || echo "❌ LICENSE CHECK FAILED - review output above"

   # If any fail, investigate specific packages:
   npx license-checker --production --csv > licenses.csv
   ```

   **Incompatible licenses to watch for**:
   - GPL, LGPL, AGPL (copyleft - require source disclosure)
   - SSPL (Server Side Public License)
   - CC-BY-NC (non-commercial restriction)

3. **Verify no proprietary code included**
   - [ ] All code is original or properly attributed
   - [ ] No copy-pasted code without license compliance

**Acceptance Criteria**:
- [ ] LICENSE file correct and complete
- [ ] license-checker passes with allowed licenses only
- [ ] All transitive dependencies compatible with MIT
- [ ] No proprietary code concerns

---

### Stage 4: GitHub Repository Settings

**Objective**: Configure repository for public access with security hardening.

**Tasks**:

1. **Create community health files** (N=2 code review)

   **SECURITY.md** (required for responsible disclosure):
   ```markdown
   # Security Policy

   ## Supported Versions

   | Version | Supported          |
   | ------- | ------------------ |
   | 0.1.x   | :white_check_mark: |

   ## Reporting a Vulnerability

   Please report security vulnerabilities via:
   - **Email**: security@liveneon.ai (preferred)
   - **GitHub Security Advisories**: [Report a vulnerability](https://github.com/live-neon/neon-soul/security/advisories/new)

   **Please do NOT open public issues for security vulnerabilities.**

   ### Response Timeline
   - Initial response: within 48 hours
   - Status update: within 7 days
   - Fix timeline: depends on severity (critical: 24-72 hours)

   ## Security Considerations

   - API keys should never be committed to the repository
   - Use environment variables for all secrets
   - Review the .env.example files for configuration guidance
   ```

   **CONTRIBUTING.md** (recommended) - customized for project philosophy (N=2 twin review):
   ```markdown
   # Contributing to NEON-SOUL

   Thank you for your interest in contributing to NEON-SOUL!

   Your contributions help shape how AI systems understand and express identity.

   ## Types of Contributions Welcome

   - **Research validation**: Test compression limits, semantic anchoring, cross-model portability
   - **Dimension expansions**: Propose new classification dimensions or axiom categories
   - **Bug fixes**: Issues with extraction, compression, or provenance tracking
   - **Documentation**: Clarifications, examples, translations
   - **Cross-model testing**: Validate soul documents work across different LLMs

   ## How to Contribute

   1. Fork the repository
   2. Create a feature branch (`git checkout -b feature/your-contribution`)
   3. Make your changes
   4. Run tests (`npm test`)
   5. Commit with clear messages
   6. Push and open a Pull Request

   ## Development Setup

   ```bash
   git clone https://github.com/live-neon/neon-soul
   cd neon-soul
   npm install
   npm run build
   npm test
   ```

   ## Code Style

   - TypeScript with strict mode
   - Run `npm run lint` before committing
   - Maintain provenance: document where ideas come from

   ## Reporting Issues

   - **Bugs**: Open an issue with reproduction steps
   - **Features**: Describe the use case and how it relates to identity/soul concepts
   - **Research questions**: Open a discussion to explore ideas

   ## Philosophy Alignment

   Contributions should align with NEON-SOUL's core principles:
   - Transparency over black boxes
   - Provenance tracking for all identity claims
   - Compression that preserves meaning

   ## Questions?

   Open an issue or [discussion](https://github.com/live-neon/neon-soul/discussions).
   ```

2. **Pre-public checklist**
   - [ ] Ensure main branch is the default
   - [ ] Review any open PRs for sensitive content
   - [ ] Review any open issues for sensitive content
   - [ ] Check branch protection rules are appropriate

3. **GitHub security hardening** (N=2 code review)
   - [ ] Enable Dependabot alerts (Settings → Security → Dependabot alerts)
   - [ ] Enable Dependabot security updates (Settings → Security → Dependabot security updates)
   - [ ] Enable secret scanning (Settings → Security → Secret scanning)
   - [ ] Consider enabling code scanning with CodeQL (Actions → New workflow → CodeQL)
   - [ ] Set up branch protection on main:
     - Require pull request reviews (optional for solo dev)
     - Require status checks to pass
     - Require branches to be up to date

4. **Repository metadata** (expanded topics per N=2 twin review)
   - [ ] Description is clear and public-appropriate
   - [ ] Topics/tags set for discoverability:
     - Core: `ai`, `soul`, `identity`, `embeddings`, `openclaw`
     - Discovery: `llm`, `claude`, `anthropic`, `ai-identity`, `semantic-compression`, `provenance`
   - [ ] Website URL set (liveneon.ai if live)

5. **Make repository public**
   - Go to repository Settings → General → Danger Zone
   - Click "Change visibility"
   - Select "Make public"
   - Confirm by typing repository name

**Acceptance Criteria**:
- [ ] SECURITY.md created with responsible disclosure process
- [ ] CONTRIBUTING.md created with development setup
- [ ] Dependabot alerts and security updates enabled
- [ ] Secret scanning enabled
- [ ] Repository visible at https://github.com/live-neon/neon-soul
- [ ] README renders correctly on GitHub
- [ ] No sensitive branches or PRs exposed

---

### Stage 5: Post-Public Verification

**Objective**: Verify the public repository is functioning correctly.

**Tasks**:

1. **Test public access with reproducible install** (N=2 code review)
   ```bash
   # Clone from public URL (in temp directory)
   cd /tmp
   rm -rf neon-soul-test  # Clean any previous test
   git clone https://github.com/live-neon/neon-soul.git neon-soul-test
   cd neon-soul-test

   # Verify reproducible installation (npm ci, not npm install)
   npm ci

   # Run full verification suite
   npm run build
   npm run lint
   npm test

   # Validate package contents match .npmignore/files
   npm pack --dry-run
   ```

2. **Verify npm package alignment**
   ```bash
   # Check published version
   npm view neon-soul

   # Verify package.json version matches
   cat package.json | grep version

   # Test npm publish would work (dry run)
   npm publish --dry-run
   ```

3. **Check GitHub features**
   - [ ] Issues enabled (if desired)
   - [ ] Discussions enabled (if desired)
   - [ ] Wiki disabled (unless needed)
   - [ ] Sponsorship settings (optional)
   - [ ] Security tab accessible and policies visible

4. **Verify security features active**
   - [ ] Dependabot alerts visible in Security tab
   - [ ] Secret scanning active (Settings → Security)
   - [ ] SECURITY.md linked from Security tab

**Acceptance Criteria**:
- [ ] Repository cloneable without authentication
- [ ] `npm ci && npm run build && npm run lint && npm test` passes from fresh clone
- [ ] `npm pack --dry-run` shows expected files only
- [ ] GitHub security features active and visible
- [ ] GitHub pages/website working (if applicable)

---

### Stage 6: Announcement and Monitoring

**Objective**: Announce the release and monitor for issues.

**Tasks**:

1. **Create GitHub Release** (optional)
   ```bash
   gh release create v0.1.5 --title "Initial Public Release" --notes "neon-soul is now open source!"
   ```

2. **Monitor for issues**
   - Watch for security vulnerability reports
   - Watch for issues from new users
   - Be prepared to respond to questions

3. **Update related documentation**
   - [ ] Update multiverse CLAUDE.md if needed
   - [ ] Update any internal wikis or docs referencing private repo

**Acceptance Criteria**:
- [ ] Release created (if desired)
- [ ] Monitoring in place
- [ ] Team aware of public status

---

## Rollback Plan

If issues are discovered after making public:

1. **Immediate**: Make repository private again
   - Settings → General → Danger Zone → Change visibility → Make private

2. **If secrets exposed** (N=2 code review: prefer BFG over git filter-branch):
   - Rotate ALL potentially exposed credentials immediately
   - Check git history for when secret was committed
   - Use BFG Repo-Cleaner (faster and safer than git filter-branch):
     ```bash
     # Install BFG
     brew install bfg

     # Clone a fresh mirror
     git clone --mirror https://github.com/live-neon/neon-soul.git

     # Remove files containing secrets
     bfg --delete-files '.env' neon-soul.git
     bfg --delete-files '*.pem' neon-soul.git

     # Or replace text patterns
     bfg --replace-text passwords.txt neon-soul.git

     # Clean up and force push (after making private!)
     cd neon-soul.git
     git reflog expire --expire=now --all && git gc --prune=now --aggressive
     git push --force
     ```
   - Re-assess before making public again

3. **If proprietary code exposed**:
   - Make private immediately
   - Assess legal implications
   - Remove problematic code and re-verify

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Secrets in git history | Low | High | Pre-scan with multiple patterns |
| Sensitive docs exposed | Low | Medium | Manual review of docs/ folder |
| License conflicts | Very Low | Medium | Dependency audit |
| Negative attention | Low | Low | Good documentation, responsive to issues |
| Fork with modifications | Expected | None | MIT license allows this |

---

## Verification Commands Summary

Run these commands before making public (enhanced per N=2 code review + N=2 twin review):

```bash
# 0. Verify tooling installed (N=2 twin review)
which gitleaks || echo "⚠️  Install: brew install gitleaks"

# 1. Secret scan with gitleaks (RECOMMENDED)
gitleaks detect --source . --verbose --log-opts="--all"

# 1b. FALLBACK manual patterns if gitleaks unavailable
git grep -E "(sk-ant-|sk-|ghp_|AKIA|password\s*=|secret\s*=)" -- "*.ts" "*.js" "*.json" "*.sh"
git grep -E "(BEGIN RSA|BEGIN OPENSSH|BEGIN EC)" -- .

# 2. Check for .env files (exclude node_modules)
find . -name "*.env" -o -name ".env.*" | grep -v ".example" | grep -v node_modules

# 3. Check git history for deleted secrets
git log --all --full-history --diff-filter=D -- "*.env" ".env*" "*.pem" "*.key"

# 4. Verify no uncommitted changes
git status

# 5. Check for private URLs
git grep -n "geeksinthewoods\|internal\.\|private\." -- "*.ts" "*.md" | grep -v ".git"

# 6. Verify license
head -5 LICENSE

# 7. Check transitive dependency licenses (with success confirmation)
npx license-checker --production --onlyAllow 'MIT;ISC;Apache-2.0;BSD-2-Clause;BSD-3-Clause;0BSD;CC0-1.0;Unlicense' \
  && echo "✅ LICENSE CHECK PASSED" || echo "❌ LICENSE CHECK FAILED"

# 8. Test build with reproducible install (clean state first)
rm -rf node_modules  # Ensure clean state for npm ci
npm ci && npm run build && npm run lint && npm test

# 9. Validate package contents
npm pack --dry-run
```

---

## Timeline

| Stage | Duration | Dependency |
|-------|----------|------------|
| Stage 1: Security Verification | 15 min | None |
| Stage 2: Documentation Review | 15 min | None |
| Stage 3: License Verification | 10 min | None |
| Stage 4: GitHub Settings | 5 min | Stages 1-3 |
| Stage 5: Post-Public Verification | 10 min | Stage 4 |
| Stage 6: Announcement | 10 min | Stage 5 |

**Total estimated time**: ~1 hour

---

## Pre-Implementation Checklist

Address these items before proceeding to Stage 4 (per N=2 code review + N=2 twin review):

**From Code Review (N=2)**:
- [x] **Critical**: Repository URL mismatch resolved
  - `package.json` updated to `live-neon/neon-soul`
  - `README.md:227` updated to `live-neon/neon-soul`
  - ClawHub URL (line 236) is correct as `leegitw/neon-soul`
- [ ] **Important**: Install and run gitleaks for comprehensive secret scanning
- [ ] **Important**: Run license-checker on transitive dependencies
- [ ] **Important**: Create SECURITY.md for responsible disclosure
- [ ] **Important**: Create CONTRIBUTING.md for community contributions (use customized template)
- [ ] **Important**: Enable GitHub security features (Dependabot, secret scanning)
- [ ] **Optional**: Update docker/.env.example placeholder format

**From Twin Review (N=2)**:
- [ ] **Important**: Add MIT license badge to README.md
- [ ] **Important**: Expand repository topics for discoverability
- [ ] **Important**: Verify security@liveneon.ai is monitored (confirmed by user)
- [ ] **Recommended**: Add "What is a Soul Document?" section to README
- [ ] **Recommended**: Add quick navigation links to README top
- [ ] **Optional**: Consider CODE_OF_CONDUCT.md

---

## Cross-References

- `docs/plans/2026-02-10-clawhub-deployment.md` - ClawHub/npm publication (related)
- `docs/plans/2026-02-10-pbd-alignment.md` - PBD alignment plan
- `docs/reviews/2026-02-11-make-repo-public-codex.md` - Codex code review findings
- `docs/reviews/2026-02-11-make-repo-public-gemini.md` - Gemini code review findings
- `docs/reviews/2026-02-11-make-repo-public-twin-technical.md` - Twin-technical review
- `docs/reviews/2026-02-11-make-repo-public-twin-creative.md` - Twin-creative review
- `README.md` - Public documentation
- `LICENSE` - MIT License

---

## Approval

- [ ] Security verification completed
- [ ] Documentation review completed
- [ ] License verification completed
- [ ] Human approval to proceed with making public

**Approved by**: _______________
**Date**: _______________
