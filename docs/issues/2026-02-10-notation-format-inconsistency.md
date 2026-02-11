# Issue: Notation Format Inconsistency in Axiom Generation

**Created**: 2026-02-10
**Status**: Open
**Priority**: Medium
**Type**: Bug / Prompt Engineering
**Related**: `src/lib/compressor.ts`, `docs/plans/2026-02-10-meta-axiom-synthesis.md`

---

## Summary

The `generateNotatedForm()` function produces inconsistent notation formats:
- Pinyin instead of CJK characters
- Cryptic/unclear emoji combinations
- Over-abbreviated text losing meaning
- Mixed formats within single axioms

---

## Examples from SOUL.md

### Pinyin Instead of CJK

```
💪 (jian) ¬Skepticism      ← Should be: 💪 堅: ¬skepticism
💪 (gōng) ¬ contemplation  ← Should be: 💪 功: action > contemplation
💡 giản: A < C             ← Vietnamese? Should be CJK
💪 zhī: A ≠ B              ← Should be: 💪 知: A ≠ B
```

### Cryptic/Unclear Notation

```
💪 明: A > E               ← What are A and E? Meaning lost
💡 明: Val > Ig            ← Over-abbreviated
⚖️ ⾥: ⏳ > 🔴              ← Pure emoji, no semantic anchor
💸 👀: ≤                   ← Incomplete notation
💡 明: values 📈 inquiry 💔 reliance  ← Mixed emoji/text, unclear
```

### Inconsistent Format

```
💎 誠: authenticity > interest    ← Good format
💪Flexible: 簆 ¬Rigidity          ← English word, malformed CJK
💕人:(connect over isolate)       ← Missing space, parens style
```

---

## Root Cause

The prompt in `compressor.ts:generateNotatedForm()` has weak output constraints:

```typescript
const prompt = `Express this principle in compact notation with:
1. An emoji indicator that captures the essence
2. A single CJK character anchor
3. Mathematical notation if there's a relationship

Format your response as: [emoji] [CJK]: [math or brief summary]
Example: "🎯 誠: honesty > performance"
`;
```

**Problems:**
1. No explicit constraint against pinyin/romanization
2. No validation that CJK character is actually CJK
3. No minimum clarity requirement for the summary
4. Single example doesn't cover edge cases
5. No self-healing retry on malformed output

---

## Proposed Fix

Apply the same self-healing pattern used in `semantic-classifier.ts`:

### 1. Stronger Prompt

```typescript
const prompt = `Express this principle in compact notation.

STRICT FORMAT: [emoji] [CJK]: [relationship]

Rules:
- Emoji: Single emoji that captures the essence (🎯💎🛡️💡🌱🤝)
- CJK: Single Chinese/Japanese character (e.g., 誠明安和)
  - NEVER use pinyin or romanization
  - NEVER use parentheses around the character
- Relationship: Use mathematical notation (A > B, ¬X, A ∧ B)
  - Use full words, not abbreviations
  - Keep it under 30 characters

Examples:
- "🎯 誠: honesty > performance"
- "💎 明: clarity > ambiguity"
- "🛡️ 安: stability ≥ risk"
- "🌱 長: growth > stagnation"

Principle: "${text}"

Respond with ONLY the formatted notation. Nothing else.`;
```

### 2. Validation Function

```typescript
function isValidNotation(notation: string): boolean {
  // Check format: emoji + space + CJK + colon + content
  const pattern = /^[\p{Emoji}]\s[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]:\s.+$/u;
  if (!pattern.test(notation)) return false;

  // Reject if contains pinyin patterns
  if (/\([a-z]+\)/i.test(notation)) return false;

  // Reject if too short (likely incomplete)
  if (notation.length < 10) return false;

  return true;
}
```

### 3. Self-Healing Retry

```typescript
async function generateNotatedForm(llm: LLMProvider, text: string): Promise<string> {
  let previousResponse: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const prompt = buildNotationPrompt(text, previousResponse);
    const result = await llm.generate(prompt);

    if (isValidNotation(result.text)) {
      return result.text;
    }

    previousResponse = result.text.slice(0, 50);
  }

  // Fallback: return native form with default emoji
  return `💡 值: ${text.slice(0, 30)}`;
}
```

---

## Implementation Location

This fix should be implemented as **Stage 4.5** in the meta-axiom synthesis plan:
→ See `docs/plans/2026-02-10-meta-axiom-synthesis.md`

Rationale: Meta-axioms will also need notation generation, so fixing this before/during that implementation makes sense.

---

## Files to Change

- `src/lib/compressor.ts` - `generateNotatedForm()` function
- Possibly extract to `src/lib/notation-generator.ts` for reuse

---

## Success Criteria

1. ✅ No pinyin/romanization in output
2. ✅ All axioms have valid CJK character
3. ✅ Relationships use full words (not single letters)
4. ✅ Consistent format across all axioms
5. ✅ Fallback produces readable output

---

## Testing

```bash
# Run synthesis and check for pinyin patterns
npx tsx src/commands/synthesize.ts --force --verbose 2>&1 | grep -i "pinyin\|([a-z]"

# Validate SOUL.md format
grep -E '\([a-z]+\)' ~/.openclaw/workspace/SOUL.md  # Should return nothing
```

---

## Cross-References

- **Plan**: `docs/plans/2026-02-10-meta-axiom-synthesis.md` (Stage 4.5)
- **Related Issue**: `docs/issues/2026-02-10-axiom-count-exceeds-cognitive-limit.md`
- **Code**: `src/lib/compressor.ts:generateNotatedForm()`
