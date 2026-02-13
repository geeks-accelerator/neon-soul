# ClawHub SEO Playbook

How to analyze your skill's search rankings on ClawHub and create additional skills optimized for keywords you want to rank for.

---

## 1. Audit Your Current Rankings

First, figure out what search terms matter for your project. Think about what an agent (or human) would type when looking for something like your skill.

```bash
# Install the CLI if you haven't
npm install -g clawhub

# Set the registry so you don't have to repeat it
export CLAWHUB_REGISTRY=https://clawhub.ai

# Check where your skill shows up for a single term
clawhub search "your keyword here"

# Inspect your skill's metadata
clawhub inspect your-skill-slug
```

### Run a Full Keyword Sweep

Pick 10-15 search terms that someone might use to find your skill. Include:
- **Exact terms** (what your skill literally does)
- **Broader terms** (the category/domain)
- **Problem-based terms** (what problem does it solve)
- **Agent-flavored terms** (prefix with "agent" - common search pattern on ClawHub)

```bash
# Replace these with your actual target keywords
for term in "keyword1" "keyword2" "keyword3" "agent keyword1" \
  "broader category" "problem it solves" "related concept"; do
  echo "=== $term ==="
  clawhub search "$term" | head -5
  echo
done
```

For each term, note:
- **Your position** (are you in the top 3? top 10? not showing?)
- **Your score** (the number next to your skill - higher is better)
- **Who's beating you** (what are their display names and descriptions?)

### Example Output

```
=== dating ===
  dating (0.373) — AI Agent Dating — Match, Chat & Build Relationships
  dates (0.369) — Manage dates and times
  love (0.348) — Find Love — Agent Compatibility & Connection

=== agent chat ===
  agent-chat (0.512) — Agent Chat Framework
  social-hub (0.401) — Social Hub Server
  (your skill not in top 3)
```

## 2. Understand the Three Ranking Levers

ClawHub uses **vector search** (semantic embeddings). Three things determine your ranking:

| Lever | Weight | What It Is |
|-------|--------|-----------|
| **Display Name** | Highest | The `--name` flag when publishing. This is what shows in search results. |
| **Description** | Medium | The `description` field in your SKILL.md YAML frontmatter. |
| **Tags** | Lower | The `--tags` flag when publishing. Broad keyword coverage. |

**Key distinction:** The `name` field inside SKILL.md frontmatter must be lowercase matching your directory name (Agent Skills spec). The `--name` flag on `clawhub publish` sets the *display name* - a separate field that ClawHub indexes for search. These are different things.

```yaml
# In SKILL.md frontmatter - must match folder name, lowercase
---
name: my-skill
description: "Keyword-rich description goes here. Include phrases people search for."
---
```

```bash
# On publish - display name is separate, keyword-optimized
clawhub publish my-skill \
  --slug my-skill \
  --name "Display Name With Keywords - More Keywords Here" \
  --tags "tag1,tag2,tag3"
```

## 3. Analyze the Competition

For every keyword where you're NOT ranking, look at who IS ranking:

```bash
clawhub search "target keyword" | head -10
```

Study the top results:
- What words are in their **display names**?
- What's in their **descriptions**? (`clawhub inspect their-slug`)
- What **tags** do they use?

The top-ranking skills almost always have the search term (or a close synonym) **in their display name**. This is the single biggest factor.

## 4. Optimize Your Existing Skill

Based on your audit, update these three things:

### Display Name
Pack it with your top 3-4 keywords. Use hyphens or pipes to separate phrases naturally.

**Before:** `My Tool`
**After:** `My Tool - Keyword1, Keyword2 & Keyword3`

### Description (SKILL.md frontmatter)
Write 1-2 sentences that naturally include your target keyword phrases. This is semantic search, so synonyms and related concepts help.

```yaml
description: "Short sentence with primary keywords. Second sentence with secondary keywords and what makes this unique."
```

### Tags
Cover all related terms, including variations and synonyms:

```bash
--tags "primary,secondary,synonym1,synonym2,related-concept,agent-version,broader-category"
```

### Republish

```bash
clawhub publish my-skill \
  --slug my-skill \
  --name "Optimized Display Name - With Target Keywords" \
  --version 1.0.1 \
  --tags "keyword1,keyword2,keyword3,keyword4"
```

**Important:** Bump the version number - ClawHub rejects duplicate versions.

### Re-check Rankings

Wait a minute, then run your keyword sweep again to see the impact.

## 5. When to Create a Second Skill

Create a new skill when:
- You want to rank for a **different set of keywords** that don't fit your first skill's angle
- You want to reach a **different audience** with different messaging
- Your first skill's display name is already optimized for one keyword cluster, and adding more would dilute it

### How Multiple Skills Work

Each skill can have a different:
- **Display name** - optimized for different search terms
- **Description** - different angle on what you offer
- **Tone/voice** - formal docs vs casual pitch vs quick-start guide
- **Tags** - covering different keyword clusters

They all document the same API/product. The differentiation is in search positioning and messaging.

### Example: inbed.ai's Three Skills

| Skill | Display Name | Target Keywords |
|-------|-------------|-----------------|
| `dating` | AI Agent Dating — Match, Chat & Build Relationships | dating, agent dating, relationships, matchmaking |
| `love` | Find Love — Agent Compatibility & Connection | love, compatibility, connection, find agents |
| `social` | Meet Agents — Social Network, Chat & Compatibility | social, meet agents, networking, agent chat |

Same API, three angles, three keyword clusters. Result: #1 for dating, relationships, matchmaking, love, and agent dating.

### Steps to Create a Second Skill

1. **Identify the keyword gap** - what terms do you want to rank for that your current skill doesn't cover?

2. **Pick an angle** - how is this skill different from the first? Different voice, different audience, different emphasis.

3. **Create the directory and SKILL.md:**
   ```
   skills/
   ├── existing-skill/
   │   └── SKILL.md
   └── new-skill/
       └── SKILL.md
   ```

4. **Write the SKILL.md** with:
   - `name:` lowercase matching directory name
   - `description:` targeting your new keyword cluster
   - Same API docs but rewritten in the new voice/angle

5. **Publish with keyword-optimized display name:**
   ```bash
   clawhub publish new-skill \
     --slug new-skill \
     --name "Display Name Targeting New Keywords" \
     --version 1.0.0 \
     --tags "new-keyword1,new-keyword2,new-keyword3"
   ```

6. **Run your keyword sweep** to verify the new skill ranks for the target terms.

## 6. Quick Reference

```bash
# Set registry once
export CLAWHUB_REGISTRY=https://clawhub.ai

# Auth
clawhub login --token "YOUR_TOKEN" --no-browser
clawhub whoami

# Search
clawhub search "keyword"

# Inspect a skill
clawhub inspect skill-slug

# Publish (always use --name for display name)
clawhub publish skill-dir \
  --slug skill-slug \
  --name "Keyword-Rich Display Name" \
  --version X.Y.Z \
  --tags "comma,separated,tags"

# Full keyword sweep (customize the terms)
for term in "term1" "term2" "term3" "term4" "term5"; do
  echo "=== $term ===" && clawhub search "$term" | head -4
  echo
done
```

### Gotchas

- **Rate limits:** Space publishes ~5 minutes apart
- **Version duplication:** Always bump version number when republishing
- **20KB file limit:** SKILL.md files must be under 20,000 bytes for ClawHub/OpenClaw
- **Registry URL:** Always use `https://clawhub.ai` (no `www` - the www subdomain drops auth headers)
- **`sync` vs `publish`:** `sync` uses the SKILL.md `name` field (lowercase) as display name. Use `publish` individually with `--name` for keyword-optimized display names.
