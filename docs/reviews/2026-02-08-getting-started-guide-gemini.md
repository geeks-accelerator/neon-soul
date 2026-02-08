# Getting Started Guide Review - Gemini

**Date**: 2026-02-08
**Reviewer**: gemini-2.5-pro (gemini-25pro-validator)
**Files Reviewed**: /Users/twin2/Desktop/projects/multiverse/projects/neon-soul/docs/guides/getting-started-guide.md
**Focus**: Documentation quality, accuracy, completeness, user experience

## Summary

The guide is well-structured and covers essential steps, but has two critical issues that make it currently unusable: a placeholder repository URL and confusion between skill commands (executed in chat interfaces) versus shell commands (executed in terminal). Several important findings around path assumptions and command clarity also need addressing.

## Findings

### Critical

1. **Line 233: Placeholder repository URL**
   - `git clone https://github.com/your-org/neon-soul.git` is a placeholder that will fail for any user
   - Must point to actual project repository or clearly mark as placeholder requiring user replacement

2. **Lines 306-331: Skill commands presented as shell commands**
   - `/neon-soul status`, `/neon-soul trace`, `/neon-soul audit` are OpenClaw skill commands
   - These execute within chat interfaces (OpenClaw Control UI, Slack, Discord), NOT in terminal
   - Fundamentally misleading - will cause user failure
   - Guide needs preceding step explaining HOW and WHERE to run skill commands

### Important

3. **Line 110: Hardcoded workspace path**
   - `~/.openclaw/workspace/` assumes default configuration
   - Should mention users with non-standard setups need to adjust path
   - Relevant for `OPENCLAW_WORKSPACE` environment variable (line 252)

4. **Line 204: Hardcoded date in filename**
   - `diary/2026-02-08.md` uses specific date
   - Users following on different days may be confused
   - Better: use generic `diary/first-entry.md` or instruct user to use current date

5. **Line 268: Test script as primary synthesis command**
   - `npx tsx scripts/test-pipeline.ts` appears to be a test script, not primary synthesis
   - `src/index.ts` suggests a CLI entry point exists
   - Confusing for users - clarify if this is intended user-facing command or if direct command should be created

6. **Lines 371-387: Ollama setup ordering**
   - Optional Ollama setup appears at end
   - But `npm test` on line 243 might fail if E2E tests require running LLM
   - Clarify if main test suite requires live LLM; consider moving Ollama setup earlier if so

### Minor

7. **Line 19-30: Architecture diagram**
   - Text-based diagram is simplistic
   - Mermaid.js or more detailed visual could better illustrate relationships
   - Shows OpenClaw, NEON-SOUL, file system, LLM provider connections

8. **Line 94-96: Docker status output**
   - Expected output shows `Up` for container status
   - Should be `running` for modern `docker compose ps` output
   - Small discrepancy potentially confusing for new users

9. **Line 137-139: Directory creation phrasing**
   - States "if missing" but command is safe regardless
   - Rephrase: "To ensure the necessary memory directories exist, run:"

10. **Line 243: Full test suite in getting-started**
    - Running full test suite may be slow and potentially flaky
    - Consider smoke test or specific crucial test for installation verification

11. **Line 283: Implementation detail exposure**
    - Mentioning hidden `.neon-soul/` directory may be unnecessary detail
    - Subsequent commands correctly point to relevant files anyway

12. **Lines 440-446: External links**
    - Links to openclaw.ai and external blogs should be validated for freshness
    - Internal links like `[NEON-SOUL README](../../README.md)` need validation for correct resolution

## Alternative Framing

**Assumption: Users need to install OpenClaw first**
- The guide assumes a fresh OpenClaw installation
- But what if user already has OpenClaw? The guide should provide a "quick path" for existing OpenClaw users that skips to Step 4

**Assumption: Terminal-based workflow**
- Guide mixes shell commands with skill commands without clear distinction
- Users may not understand the dual-interface nature (terminal for setup, chat for operation)
- Consider explicit "Setup Phase (Terminal)" vs "Operation Phase (Chat Interface)" sections

**Assumption: 15-minute timeframe**
- Claims ~15 minutes but includes Docker builds, npm installs, and LLM model downloads
- Actual time likely 30-45 minutes depending on network/hardware
- More realistic estimate would set better expectations

## Recommendations

1. **Immediate**: Fix placeholder URL - either provide real URL or explain clearly
2. **Immediate**: Add section explaining skill commands vs shell commands before Step 6
3. **High Priority**: Consider splitting guide into "OpenClaw Setup" and "NEON-SOUL Integration" for users who may already have OpenClaw
4. **Medium Priority**: Update time estimate to be more realistic
5. **Low Priority**: Add Mermaid diagram, fix minor phrasing issues

## Raw Output

<details>
<summary>Full CLI output</summary>

Here is a review of the `getting-started-guide.md` documentation.

### Critical Findings

-   **Line 183: `git clone https://github.com/your-org/neon-soul.git`**
    -   **Severity**: Critical
    -   **Issue**: The repository URL is a placeholder. This will fail for any user trying to follow the instructions. It should point to the actual project repository or be clearly marked as a placeholder that the user needs to replace.
-   **Lines 221, 230, 237, 242, 275: `/neon-soul` commands**
    -   **Severity**: Critical
    -   **Issue**: The guide presents `/neon-soul` as a shell command. Based on the project's architecture, these are skill commands executed within an OpenClaw-compatible chat interface (like the OpenClaw Control UI, Slack, Discord, etc.), not in a terminal. This is fundamentally misleading and will cause user failure. The guide needs a preceding step explaining *how* and *where* to run these skill commands.

### Important Findings

-   **Line 90: `~/.openclaw/workspace/`**
    -   **Severity**: Important
    -   **Issue**: The guide hardcodes the OpenClaw workspace path. While common, this path can be configured by the user. The guide should mention that if the user has a non-standard OpenClaw setup, they will need to adjust this path accordingly. This is especially relevant for the `OPENCLAW_WORKSPACE` environment variable (Line 196).
-   **Line 139: `diary/2026-02-08.md`**
    -   **Severity**: Important
    -   **Issue**: The filename for the diary entry is hardcoded with today's date. A user following this guide on a different day might be confused. It would be better to use a generic filename like `diary/first-entry.md` or explicitly tell the user to use the current date.
-   **Line 210: `npx tsx scripts/test-pipeline.ts`**
    -   **Severity**: Important
    -   **Issue**: This command seems to be a test script, not the primary synthesis command. The file `src/index.ts` suggests a CLI entry point. Using a test script for the main synthesis action is confusing. The guide should clarify if this is the intended user-facing command or if a more direct command (e.g., `npx neon-soul synthesize`) exists or should be created.
-   **Line 258: Ollama Setup**
    -   **Severity**: Important
    -   **Issue**: The optional Ollama setup is presented at the end. However, the `npm test` command on line 193 might fail if it includes E2E tests that require a running LLM, which isn't set up until much later. The guide should clarify if the main test suite requires a live LLM and potentially move the Ollama setup instructions earlier if so.

### Minor Findings

-   **Line 29: Architecture Diagram**
    -   **Severity**: Minor
    -   **Issue**: The diagram is text-based and a bit simplistic. A more detailed visual diagram (e.g., using Mermaid.js) could better illustrate the relationship between OpenClaw, NEON-SOUL, the file system, and the LLM provider.
-   **Line 73: `docker compose ps`**
    -   **Severity**: Minor
    -   **Issue**: The expected output shows `Up` for the container status. It should be `running` for `docker compose ps`. A small but potentially confusing discrepancy for new users.
-   **Line 108: `mkdir -p ...`**
    -   **Severity**: Minor
    -   **Issue**: The guide states "if missing," but the command is safe to run even if the directories exist. It could be slightly rephrased to something like: "To ensure the necessary memory directories exist, run the following command:".
-   **Line 191: `npm test`**
    -   **Severity**: Minor
    -   **Issue**: Running the full test suite might be overkill for a getting-started guide. It could be slow and potentially flaky depending on the environment. A smoke test or a specific, crucial test might be better to "Verify" the installation.
-   **Line 213: Output location `~/.openclaw/workspace/.neon-soul/`**
    -   **Severity**: Minor
    -   **Issue**: This is an implementation detail. The guide correctly points the user to `SOUL.md` and the JSON artifacts in the subsequent commands. Mentioning the hidden `.neon-soul` directory might be unnecessary detail for a new user.
-   **Line 307: Resource Links**
    -   **Severity**: Minor
    -   **Issue**: The links to `openclaw.ai` and other external blogs are great for context, but it's worth ensuring they are not broken. The internal links like `[NEON-SOUL README](../../README.md)` should be validated to ensure they resolve correctly from the rendered documentation.

### Overall Assessment

The guide is well-structured and covers the essential steps. However, the critical issues regarding the placeholder repository URL and the misrepresentation of skill commands as shell commands make the current version unusable for a new developer. Addressing these issues, along with the important findings, would significantly improve the quality and accuracy of the documentation.

</details>
