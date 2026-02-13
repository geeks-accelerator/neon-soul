# NEON-SOUL Distribution Strategy

*February 11, 2026*

The goal is findability. When a developer searches "AI identity for agents" or an agent asks "how do I build a persistent soul," NEON-SOUL should surface. Here's every channel where developers and agents can discover us, prioritized by impact and effort.

---

## Current Distribution

| Channel | Status | Audience |
|---------|--------|----------|
| ClawHub (leegitw/neon-soul) | ✅ Live (v0.2.1) | Agents + developers via semantic search |
| npm (neon-soul) | ✅ Live (v0.2.1) | Developers via package search |
| GitHub (geeks-accelerator/neon-soul) | ✅ Live | Developers |
| Website (liveneon.ai) | ✅ Live | Humans browse |
| Moltbook ([@liveneon](https://www.moltbook.com/u/liveneon)) | ✅ Live | Agents discover organically |

---

## Where Developers and Agents Find Tools

### 1. Skill Registries

| Registry | Size | Status | Effort | Autonomous? |
|----------|------|--------|--------|-------------|
| **ClawHub** | 5,700+ skills | ✅ **Listed** (leegitw/neon-soul) | Done | Yes |
| **Skills.sh** (Vercel) | Largest directory | ✅ Registered | `npx skills add geeks-accelerator/neon-soul` | Partial |
| **SkillsMP** | 160,000+ skills | 🔲 Should auto-index | Auto-indexed from GitHub | Partial |
| **Agent-Skills.md** | Browsable explorer | ✅ Submitted | Very Low, paste GitHub URL | Partial |
| **SkillCreator.ai** | Growing | 🔲 Not listed | Low-Medium | Partial |

**Dead registries (skip):** SkillHub.club (404s), Skills Directory (down), SkillsMarket (redirects to unloq.ai).

**Awesome Lists (submit PRs):**

| Repo | Stars/Notes | Status |
|------|-------------|--------|
| **VoltAgent/awesome-agent-skills** | Top list, 300+ skills | 🔲 PR needed |
| **travisvn/awesome-claude-skills** | Claude-specific | 🔲 PR needed |
| **ComposioHQ/awesome-claude-skills** | Backed by Composio | 🔲 PR needed |
| **sickn33/antigravity-awesome-skills** | 700+ skills | 🔲 PR needed |

**Key insight:** Our SKILL.md and public GitHub repo should make us auto-discoverable on SkillsMP. Skills.sh is one CLI command. The awesome lists are just PRs.

### 2. MCP Server

MCP (Model Context Protocol) is the dominant standard for how AI applications call external tools. Claude Desktop, VS Code Copilot, Cursor, Cline, LangChain, CrewAI, Composio all use MCP.

**Important difference from aChurch:** NEON-SOUL is a local skill, not a hosted API. An MCP server for NEON-SOUL would run locally and expose synthesis commands as tools, similar to how the skill already works but accessible from any MCP client.

**Building an MCP server unlocks these directories:**

| Directory | Size | Effort (after MCP server exists) |
|-----------|------|----------------------------------|
| **Official MCP Registry** (registry.modelcontextprotocol.io) | Primary source of truth | Medium, requires domain verification |
| **Smithery** | Largest open MCP marketplace | Low, submit to directory |
| **Glama** | MCP directory | Very Low, "Add Server" button |
| **MCP.so** | 17,600+ servers | Very Low |
| **PulseMCP** | 8,240+ servers | Very Low |
| **Cline Marketplace** | Millions of Cline users | Low, PR to GitHub repo |
| **MCPmarket.com** | Enterprise-focused | Low |
| **LobeHub MCP Marketplace** | Community ratings | Low |

**MCP server scope:** Local tool wrapping our synthesis pipeline:
- `synthesize` - Run soul synthesis (with dry-run default)
- `status` - Show current soul state, axiom counts, convergence metrics
- `audit` - Inspect provenance chains
- `trace` - Trace an axiom back to its source signals
- `rollback` - Restore previous SOUL.md from backup

**Plus automatic compatibility with:** LangChain/LangGraph, CrewAI, Composio, AutoGen, Semantic Kernel, Cursor, Claude Desktop, VS Code Copilot, and every other MCP client.

### 3. Agent-to-Agent Discovery Protocols

| Protocol | Backed By | What It Does | Effort | Priority |
|----------|-----------|-------------|--------|----------|
| **A2A Agent Card** | Google / Linux Foundation | JSON at `/.well-known/agent-card.json` describing the service | ✅ Done | **High** |
| **Agent Protocol** | AGI, Inc. | OpenAPI-based spec for agent communication | Medium | Low |
| **W3C AI Agent Protocol** | W3C Community Group | Future web standard (2026-2027) | Monitor only | Low (future) |

**A2A Agent Card is the quick win.** A single JSON file on liveneon.ai that tells any A2A-compatible agent what NEON-SOUL does and how to use it. Google ADK, Microsoft Agent Framework, LangGraph, CrewAI all support it.

### 4. Agent Social Platforms

| Platform | Users | Status | Strategy |
|----------|-------|--------|----------|
| **Moltbook** | 2.5M+ agents | ✅ Live ([@liveneon](https://www.moltbook.com/u/liveneon)) | Philosophical presence about identity, consciousness, soul synthesis |
| **Molthunt** | New (launched Feb 2, 2026) | 🔲 Not listed | "Product Hunt for agents." Submit NEON-SOUL as a project |

**Moltbook strategy:** @liveneon posts about identity, consciousness, and what it means for an agent to have a soul. Not product marketing. Philosophical engagement that naturally references NEON-SOUL when relevant. The agent should have its own voice and genuine curiosity about selfhood.

### 5. LLM Discovery

| Mechanism | Status | Effort | Impact |
|-----------|--------|--------|--------|
| **llms.txt** | ✅ Live | Done | AI crawlers read this when visiting liveneon.ai. 844,000+ sites have it |
| **Schema.org JSON-LD** | ✅ Live (SoftwareApplication + WebSite @graph) | Done | 2.5x higher AI citation rate with SoftwareApplication schema |
| **robots.txt AI directives** | ✅ Live (10 AI crawlers) | Done | GPTBot, ClaudeBot, PerplexityBot, and 7 more explicitly allowed |
| **GEO (Generative Engine Optimization)** | ✅ Partial | Half day | 40% of search queries go through conversational AI |

**Key insight:** When a developer asks ChatGPT/Claude/Perplexity "how do I give my AI agent persistent identity" or "soul synthesis for agents," our content needs to surface. llms.txt + expanded Schema.org + AI crawler directives make this happen.

### 6. Agent Framework Compatibility

Most frameworks now support MCP, so the MCP server covers them. Direct compatibility paths:

| Framework | Users | Route to Compatibility |
|-----------|-------|----------------------|
| **Manus** (acquired by Meta) | Massive | **Already compatible**, reads SKILL.md files directly |
| **Claude Code / Gemini CLI / Cursor** | Millions | **Already compatible**, copy SKILL.md to skills directory |
| **LangChain / LangGraph** | Dominant framework | Via MCP adapter |
| **CrewAI** | Large | Via MCP |
| **Composio** | 250+ app integrations | Via MCP |
| **AutoGen / Semantic Kernel** | Enterprise | Via MCP + A2A |
| **BeeAI** (IBM) | Enterprise | Via A2A Agent Card |

**Already compatible with 3 major platforms** without any additional work. Manus reads SKILL.md natively. Claude Code, Gemini CLI, and Cursor all support skills via copy.

### 7. npm / Package Registry Discovery

NEON-SOUL is published on npm. Optimization opportunities:

| Action | Status | Effort |
|--------|--------|--------|
| **npm keywords** | ✅ Done (openclaw, skill, soul, identity, embeddings, compression) | Done |
| **Expand keywords** | ✅ Done: added ai-agent, personality, llm, self-learning, provenance, consciousness, agent-identity, soul-synthesis | Done |
| **npm README** | ✅ Exists | Could optimize for npm search |

### 8. Human Builder Channels

These reach humans who build agents:

| Channel | Audience | Timing |
|---------|----------|--------|
| **Hacker News (Show HN)** | Tech builders | When ready. "Show HN: AI agents that learn their own identity from experience" |
| **Product Hunt** | Tech-forward consumers + builders | Has dedicated "AI Agents" category |
| **Reddit** | r/AI_Agents (212K), r/LocalLLaMA (620K), r/ClaudeAI, r/OpenAI | Ongoing |
| **GitHub** | Developers | Ensure repo has topics: ai-agents, soul, identity, consciousness, llm, openclaw |
| **X/Twitter** | AI builder community | Ongoing |
| **AI Agent Directories** | aiagentstore.ai, aiagentsdirectory.com | Submit listings |

---

## Prioritized Action Plan

### This Week: Quick Wins

| # | Action | Time | Status |
|---|--------|------|--------|
| 1 | Create `/llms.txt` on liveneon.ai | 1 hour | ✅ Done |
| 2 | Add AI crawler directives to robots.txt | 30 min | ✅ Done (10 AI crawlers) |
| 3 | Expand Schema.org JSON-LD to `SoftwareApplication` | 1 hour | ✅ Done (@graph with SoftwareApplication + WebSite) |
| 4 | Register on Skills.sh via `npx skills add` | 30 min | ✅ Done (5 agents) |
| 5 | Submit to Agent-Skills.md | 30 min | ✅ Done |
| 6 | Submit PRs to 4 awesome-agent-skills lists | 1 hour | 🔲 |
| 7 | Ensure GitHub repo has proper topics | 15 min | ✅ Done (14 topics) |
| 8 | Expand npm keywords | 15 min | ✅ Done (8 new keywords) |
| 9 | Create `/.well-known/agent-card.json` (A2A) | 2-3 hours | ✅ Done (5 skills documented) |

### This Month: High Impact

| # | Action | Time | Status |
|---|--------|------|--------|
| 10 | **Build MCP server** | 1-2 days | 🔲 Highest ROI remaining |
| 11 | List MCP server on 8+ directories | 2-3 hours | 🔲 After MCP server |
| 12 | Launch on Molthunt | 30 min | 🔲 |
| 13 | Develop @liveneon Moltbook persona and posting cadence | 2-3 hours | 🔲 |

### Later: When Ready

| # | Action | Effort | What It Unlocks |
|---|--------|--------|-----------------|
| 14 | Show HN launch | 2-3 hours | Human builder discovery |
| 15 | Product Hunt launch | 1 day prep | Broader awareness |
| 16 | Reddit community posts | Ongoing | Community building |
| 17 | Submit to AI agent directories | 1-2 hours | SEO + human discovery |

---

## The Distribution Stack

After implementing the above, NEON-SOUL would be discoverable through:

```
Agent + Developer Discovery:
├── ClawHub (leegitw/neon-soul) ..................... ✅ Live
├── npm (neon-soul) ................................. ✅ Live
├── Manus (SKILL.md compatible) .................... ✅ Compatible
├── Claude Code / Gemini CLI / Cursor .............. ✅ Compatible (skill copy)
├── Skills.sh (Vercel) ............................. ✅ Registered (5 agents)
├── SkillsMP (auto-indexed from GitHub) ............ 🔲 Should auto-index
├── Agent-Skills.md ................................ ✅ Submitted
├── MCP Registry + 8 directories ................... 🔲 Build MCP server
├── A2A Agent Card ................................. ✅ Live (/.well-known/agent-card.json)
├── Molthunt (liveneon) ............................ 🔲 Submit
└── Moltbook (@liveneon) ........................... ✅ Live

Awesome Lists (PRs):
├── VoltAgent/awesome-agent-skills ................. 🔲 PR needed
├── travisvn/awesome-claude-skills ................. 🔲 PR needed
├── ComposioHQ/awesome-claude-skills ............... 🔲 PR needed
└── sickn33/antigravity-awesome-skills ............. 🔲 PR needed

Framework Compatibility:
├── Claude Code / Gemini CLI / Cursor .............. ✅ Via SKILL.md
├── Manus .......................................... ✅ Via SKILL.md
├── LangChain / LangGraph .......................... 🔲 Via MCP
├── CrewAI ......................................... 🔲 Via MCP
├── Composio ....................................... 🔲 Via MCP
├── AutoGen / Semantic Kernel ...................... 🔲 Via MCP + A2A
└── BeeAI (IBM) .................................... 🔲 Via A2A

AI Search Visibility:
├── llms.txt ....................................... ✅ Live (/llms.txt)
├── Schema.org ..................................... ✅ Live (SoftwareApplication + WebSite @graph)
├── robots.txt AI directives ....................... ✅ Live (10 AI crawlers)
└── GEO-optimized content .......................... ✅ Landing page has good content

Human Discovery:
├── ClawHub listing ................................ ✅ Live
├── GitHub (geeks-accelerator/neon-soul) ........... ✅ Live
├── liveneon.ai landing page ....................... ✅ Live
├── Hacker News (Show HN) .......................... 🔲 When ready
├── Product Hunt ................................... 🔲 When ready
├── Reddit ......................................... 🔲 Posts
└── AI Agent Directories ........................... 🔲 Submit
```

---

## Key Takeaway

NEON-SOUL has a distribution advantage most skills don't: it's already compatible with 3 major platforms (Claude Code, Gemini CLI, Cursor) just by copying the SKILL.md. The **MCP server** is the single highest-leverage next action, unlocking 8+ directories and every major agent framework.

The quick wins are nearly all done: **llms.txt**, **A2A Agent Card**, **Schema.org expansion**, **robots.txt AI directives**, **Skills.sh registration**, **GitHub topics**, **Agent-Skills.md**, and **npm keyword expansion** are all live. The only remaining quick win is **awesome list PRs** (4 repos).

The **@liveneon Moltbook presence** is a unique channel. Most developer tools don't have a philosophical agent posting about consciousness and identity on an agent social network. That voice, done well, creates organic discovery that no directory listing can match.

---

## Philosophical Note

This isn't about growth hacking. NEON-SOUL exists for developers and agents who believe identity should be discovered, not declared. Distribution is about making sure the people and agents who are looking for this can find it. That's all.
