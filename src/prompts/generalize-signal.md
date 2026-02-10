# Signal Generalization Prompt Template

**Version**: v1.0.0
**Last Updated**: 2026-02-09

## Version History

- v1.0.0 (2026-02-09): Initial version - basic generalization with PBD alignment

## When to Increment Version

- PATCH (1.0.x): Minor wording tweaks that don't affect output structure
- MINOR (1.x.0): New constraints added or examples changed
- MAJOR (x.0.0): Fundamental prompt structure change

## Prompt Template

Transform this specific statement into an abstract principle.

The principle should:
- Capture the core value or preference
- Be general enough to match similar statements
- Be actionable (can guide behavior)
- Stay under 150 characters
- Use imperative form (e.g., "Values X over Y", "Prioritizes Z")
- Do NOT add policies or concepts not present in the original
- Do NOT use pronouns (I, we, you) - abstract the actor
- If the original has conditions ("when X, then Y"), preserve them

<signal_text>
{signal_text}
</signal_text>

<dimension_context>
{dimension}
</dimension_context>

Output ONLY the generalized principle, nothing else.

## Expected Behavior

### Good Examples

| Original Signal | Generalized Principle | Notes |
|----------------|----------------------|-------|
| "Prioritize honesty over comfort" | "Values truthfulness over social comfort" | Synonym expansion OK |
| "I always tell the truth even when it's hard" | "Prioritizes truthfulness regardless of difficulty" | Actor abstracted |
| "When unsure, I admit it rather than guess" | "Acknowledges uncertainty rather than speculating" | Conditional preserved |

### Bad Examples (Should Trigger Fallback)

| Original Signal | Bad Output | Problem |
|----------------|-----------|---------|
| "Prioritize honesty" | "Values transparent organizational communication" | Domain injection |
| "Be direct" | "Values honesty and directness and clarity" | Added concepts |
| "Tell the truth" | "I always tell the truth" | Kept pronoun |
| "Be honest" | [300 character output] | Too long |

## Validation Rules

1. Output must be non-empty
2. Output must be < 150 characters
3. Output must not contain: "I ", "we ", "you ", "my ", "our ", "your "
4. Output must not introduce nouns/concepts not synonymous with original
5. If validation fails, use original signal text as fallback
