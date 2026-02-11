---
status: Draft
observation_file: null
observation_count: 0
last_updated: 2026-02-10
---

# Workflow: Documentation Update

**Status**: Draft (N=0)
**Last Updated**: 2026-02-10

## Purpose

Systematic process for updating NEON-SOUL documentation when architecture, plans, or implementation changes.

**Principles Applied**: Single Source of Truth, Documentation as Code

---

## When to Use This Workflow

**Trigger when:**
- Architecture changes (standalone CLI → OpenClaw skill)
- Adding/removing/renaming pipeline phases or stages
- Changing shared module structure
- Updating dependencies or technology stack
- Code review findings require plan updates
- Adding/modifying skill commands (update skill/SKILL.md)
- Changing installation methods (update skill/README.md)
- Publishing to ClawHub/npm (update version references)

**Skip when:**
- Internal implementation details (no public interface change)
- Test-only changes
- Research notes that don't affect plans

---

## Documentation Hierarchy

Updates flow from authoritative sources down:

```
docs/proposals/soul-bootstrap-pipeline-proposal.md  # Authoritative design (decisions)
        ↓
docs/plans/README.md                                 # Plan registry (index of all plans)
        ↓
docs/plans/*-master.md                               # Implementation overview
        ↓
docs/ARCHITECTURE.md                                 # How system works
        ↓
docs/plans/*.md                                      # Feature/phase-specific details
        ↓
skill/SKILL.md                                       # Agent skill manifest (commands)
        ↓
skill/README.md + README.md                          # Installation & project overview
        ↓
docs/issues/                                         # Active issues
docs/reviews/                                        # Code review outputs
```

**Document purposes**:
- **Proposal**: Historical record of design decisions ("what we decided to build and why")
- **Plan Registry**: Index of all implementation plans with status
- **Master Plan**: Implementation coordination ("how phases relate")
- **ARCHITECTURE.md**: System reference ("how the code actually works")
- **Feature Plans**: Implementation details ("what to build")
- **skill/SKILL.md**: Agent skill manifest (commands, frontmatter, invocation)
- **skill/README.md**: Installation instructions for all agent types
- **README**: Newcomer entry point ("quick start")

**Rule**: The proposal is the authoritative design source. ARCHITECTURE.md implements the proposal and evolves with the code. skill/SKILL.md defines agent commands. README and skill/README.md summarize for newcomers.

---

## Steps

### Step 1: Identify Scope of Change

Classify the change:

| Type | Files Affected |
|------|----------------|
| **Architecture** | Proposal, Master Plan, ARCHITECTURE.md, Phase Plans, README |
| **Phase structure** | Master Plan, ARCHITECTURE.md, affected Phase Plans |
| **Stage details** | Specific Phase Plan only |
| **Module structure** | ARCHITECTURE.md, Phase 0, affected Phase Plans |
| **Dependency** | Proposal (tech stack), Phase 0, README |
| **Issue resolution** | Issues file, affected Plans |
| **Skill commands** | skill/SKILL.md, skill/README.md, README |
| **Installation** | skill/README.md, README, deployment plan |
| **Deployment** | Deployment plan, skill/README.md, package.json |

### Step 2: Update Proposal (if architectural)

The proposal is the design authority. Update:

- [ ] Technology Stack table
- [ ] Dependencies JSON
- [ ] Directory structure diagram
- [ ] OpenClaw Skill Commands section
- [ ] Data model interfaces (if types changed)

### Step 3: Update Master Plan

High-level coordination document:

- [ ] Architecture diagram
- [ ] Shared Module Architecture table
- [ ] Technology Stack table
- [ ] Phase dependencies (if phases added/removed)
- [ ] Key Architectural Decisions section

### Step 4: Update Phase Plans

Update affected phase plans:

- [ ] Files to create section
- [ ] Tasks and code snippets
- [ ] Acceptance criteria
- [ ] Quality Gate metrics
- [ ] Deliverables list
- [ ] Shared modules references ("> **Reuses from Phase X**")

### Step 5: Update README.md

Project overview for newcomers:

- [ ] Technology section
- [ ] Project Structure diagram
- [ ] Key Documents table
- [ ] Current Status checklist
- [ ] Example commands

### Step 6: Update Skill Documentation (if applicable)

When commands or installation methods change:

**skill/SKILL.md**:
- [ ] Command table (name, description, examples)
- [ ] Frontmatter (version, homepage, user-invocable)
- [ ] Usage examples

**skill/README.md**:
- [ ] Installation methods (Claude Code, Gemini CLI, Cursor, OpenClaw, npm)
- [ ] ClawHub publish steps
- [ ] Command quick reference
- [ ] Links (website, GitHub, ClawHub)

### Step 7: Update Issues (if applicable)

If changes resolve or affect open issues:

- [ ] Mark resolved findings as N/A or fixed
- [ ] Update fix groupings
- [ ] Add resolution notes with commit references
- [ ] Update issue status in registry

### Step 8: Verify Consistency

Run verification checks:

```bash
# Check for stale command references
grep -r "npx neon-soul" docs/ README.md

# Check for stale SDK references
grep -r "@anthropic-ai/sdk" docs/ README.md

# Check for mismatched phase counts
grep -r "Phase [0-9]" docs/plans/

# Verify all plans cross-reference correctly
grep -r "Master Plan\|Depends on" docs/plans/
```

---

## Checklist Files

| File | What to Check |
|------|---------------|
| `docs/proposals/soul-bootstrap-pipeline-proposal.md` | Tech stack, deps, commands, interfaces |
| `docs/plans/README.md` | Plan registry, status, cross-references |
| `docs/plans/*-master.md` | Architecture, shared modules, phases |
| `docs/ARCHITECTURE.md` | Module diagram, data flow, config options |
| `docs/plans/*.md` | Feature plans: tasks, acceptance criteria |
| `skill/SKILL.md` | Commands, frontmatter, invocation examples |
| `skill/README.md` | Installation methods, ClawHub/npm publish steps |
| `README.md` | Technology, structure, status, quick start |
| `package.json` | Version, exports, files array |
| `docs/issues/*.md` | Active issues, status updates |
| `scripts/README.md` | Script table, usage, regression testing |

> **Note**: Check `docs/plans/README.md` for the complete list of plans and their status. Plans are dated (YYYY-MM-DD-*.md) and may span multiple dates.

---

## Script Documentation Standards

All scripts in `scripts/` must be self-documenting with a header block:

```typescript
/**
 * Script Name
 *
 * Brief description of what the script does.
 *
 * Usage:
 *   npx tsx scripts/script-name.ts [options]
 *
 * Input:
 *   - Description of input files/directories
 *
 * Output:
 *   - Description of output files/directories
 *
 * Notes:
 *   - Any important caveats or configuration
 */
```

When adding a new script:
1. Add self-documenting header to the script file
2. Update `scripts/README.md` with the new script
3. Update phase plan if script is part of a phase deliverable

---

## Common Mistakes

### 1. Updating Plans Without Proposal

**Wrong**: Changing architecture in plans but not proposal
**Right**: Proposal is authoritative; update it first, then plans

### 2. Forgetting Cross-References

**Wrong**: Updating one plan without checking others that reference it
**Right**: Grep for references: `grep -r "Phase 0\|phase0" docs/plans/`

### 3. Stale Command Syntax

**Wrong**: Mixing `npx neon-soul` and `/neon-soul` commands
**Right**: All commands use `/neon-soul` skill invocation

### 4. Orphaned Issues

**Wrong**: Resolving findings in code but not updating issue file
**Right**: Mark findings as resolved with commit reference

### 5. Missing Shared Module Updates

**Wrong**: Adding shared module in Phase 0 but not updating Phase 1-3 references
**Right**: Update all "Reuses from Phase X" sections

### 6. Skill Command Drift

**Wrong**: Adding command to code but not updating skill/SKILL.md
**Right**: Update skill/SKILL.md command table, skill/README.md quick reference

---

## Verification Commands

```bash
# All commands should use skill invocation
grep -r "npx neon-soul" docs/ README.md skill/
# Expected: No results

# No stale SDK references
grep -r "@anthropic-ai/sdk" docs/ README.md
# Expected: No results (or only in historical context)

# Plan cross-references valid
for f in docs/plans/*.md; do
  echo "=== $f ==="
  grep -E "Master Plan|Depends on|Cross-References" "$f" | head -5
done

# All issues have status
grep -E "^status:" docs/issues/*.md

# Skill documentation consistency
grep -E "^## Commands|/neon-soul" skill/SKILL.md skill/README.md
# Expected: Matching command lists

# Version consistency
grep -E "version|0\.[0-9]+\.[0-9]+" package.json skill/SKILL.md | head -5
```

---

## Examples

### Example: CLI → OpenClaw Skill Architecture Change

**Files updated** (in order):
1. `docs/proposals/soul-bootstrap-pipeline-proposal.md` - Tech stack, deps, commands
2. `docs/plans/2026-02-07-soul-bootstrap-master.md` - Added skill architecture section
3. `docs/plans/2026-02-07-phase0-project-setup.md` - Removed SDK dep, added arch decision
4. `docs/plans/2026-02-07-phase{1,2,3}-*.md` - Updated command invocations
5. `README.md` - Updated technology section, examples
6. `docs/issues/internal-soul-bootstrap-code-review-findings.md` - C-1 marked N/A

**Verification**:
```bash
grep -r "npx neon-soul" docs/ README.md  # Should return nothing
grep -r "@anthropic-ai/sdk" docs/        # Should return nothing
```

---

## Anti-Patterns

| Anti-Pattern | Why It's Wrong | Do Instead |
|--------------|----------------|------------|
| Updating plans without proposal | Drift from design authority | Proposal first, then plans |
| Partial command updates | Mixed syntax confuses users | Global replace with verification |
| Ignoring cross-references | Plans become inconsistent | Grep for references before finishing |
| Leaving issues stale | Unclear what's resolved | Update issues with each fix |
| Code commands without skill update | Users can't discover commands | Update skill/SKILL.md with code |
| Version mismatch | Confuses package consumers | Sync package.json and skill/SKILL.md |

---

## Related Documentation

- **[Soul Bootstrap Proposal](../proposals/soul-bootstrap-pipeline-proposal.md)** - Authoritative design (decisions)
- **[Plan Registry](../plans/README.md)** - Index of all implementation plans
- **[Master Plan](../plans/2026-02-07-soul-bootstrap-master.md)** - Implementation overview
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - System reference
- **[skill/SKILL.md](../../skill/SKILL.md)** - Agent skill manifest
- **[skill/README.md](../../skill/README.md)** - Installation instructions
- **[ClawHub Deployment Plan](../plans/2026-02-10-clawhub-deployment.md)** - Publishing workflow
- **[Issues Registry](../issues/README.md)** - Active issues
- **[Parent Documentation Update](../../../../docs/workflows/documentation-update.md)** - Multiverse workflow

---

*Workflow created from architecture change (CLI → OpenClaw skill). Updated 2026-02-10 to include skill/ directory and generalized plan references.*
