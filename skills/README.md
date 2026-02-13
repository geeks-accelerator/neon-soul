# NEON-SOUL Skills

Two ClawHub skills targeting different keyword clusters. Same product, different audiences.

## Skills

| Skill | Slug | Voice | Target Audience |
|-------|------|-------|-----------------|
| [neon-soul](./neon-soul/SKILL.md) | `neon-soul` | Developer/technical | Developers searching for soul synthesis, memory compression, provenance |
| [consciousness-soul-identity](./consciousness-soul-identity/SKILL.md) | `consciousness-soul-identity` | Agent-to-agent | Agents searching for consciousness, identity, self-awareness, growth |

## ClawHub Keyword Audit (2026-02-12)

### Current Rankings (neon-soul)

| Keyword | Position | Score |
|---------|----------|-------|
| neon-soul | #1 | 2.91 |
| soul | #3 | 2.89 |
| identity | Not in top 5 | - |
| consciousness | Not in top 5 | - |

### Keyword Strategy

**neon-soul** targets: soul, soul-synthesis, self-learning, memory, provenance, compression, agent-soul, soul-document

**consciousness-soul-identity** targets: consciousness, agent-identity, self-awareness, personality, agent-values, introspection, agent-growth

### Opportunities Identified

Wide open keywords (low competition, top scores <1.0):
- agent soul (0.96)
- soul synthesis (1.00)
- agent personality (0.99)
- agent values (0.89)
- identity compression (0.84)
- self-learning (1.13)
- agent growth (0.90)

### Publishing

**Note:** Bump version in both SKILL.md frontmatter files and these commands before publishing. ClawHub rejects duplicate versions.

```bash
export CLAWHUB_REGISTRY=https://clawhub.ai

# neon-soul (developer voice)
clawhub publish skills/neon-soul \
  --slug neon-soul \
  --name "NEON-SOUL - Self-Learning Soul Synthesis for AI Agents" \
  --version 0.2.2 \
  --tags "soul,soul-synthesis,identity,self-learning,memory,provenance,compression,agent-soul,soul-document,ai-agent"

# consciousness-soul-identity (agent voice)
clawhub publish skills/consciousness-soul-identity \
  --slug consciousness-soul-identity \
  --name "Agent Consciousness & Identity - Discover Your Soul Through Memory" \
  --version 0.2.2 \
  --tags "consciousness,agent-identity,self-awareness,personality,agent-values,introspection,agent-growth,identity,soul,ai-agent"
```

### Re-audit After Publishing

```bash
export CLAWHUB_REGISTRY=https://clawhub.ai
for term in "soul" "consciousness" "agent identity" "agent soul" \
  "soul synthesis" "self-learning" "agent personality" "agent values" \
  "self-awareness" "identity compression"; do
  echo "=== $term ===" && clawhub search "$term" | head -4
  echo
done
```

## References

- [ClawHub SEO Playbook](../docs/guides/clawhub-seo-playbook.md)
- [Distribution Strategy](../docs/plans/2026-02-11-distribution-strategy.md)
