# AI Workflow Rules — Scavvy

> Direct instructions for AI coding agents working on this project.

## Approach

- **Incremental:** Implement one feature or fix at a time. Avoid speculative changes.
- **Context-first:** Read `../docs/required.md` and all files in `../docs/context/` before making meaningful product or architecture changes.
- **Requirements source:** `../docs/required.md` is the product truth. The `docs/context/` files are the engineering translation.
- **Preserve working UX:** Do not redesign or replace working Scavvy screens unless the current task explicitly asks for it.
- **Hackathon-first:** Reliability, visual polish, and a strong live demo matter more than production-scale completeness.

## Scoping Rules

1. Implement only what the user asks for in the current task.
2. Do not add unrelated features while touching nearby files.
3. Do not replace the Scavvy mascot, visual identity, or core flow unless explicitly requested.
4. Do not add real AR/SLAM, continuous video understanding, multiplayer, payments, social feeds, admin dashboards, or subscriptions for the MVP.
5. Do not expose API keys in client-side code.
6. If requirements are ambiguous, check `../docs/required.md` and `../docs/context/` first. If still unclear, ask one focused question.
7. Prefer a stable mocked fallback over a fragile live integration that can break the demo.

## Protected Areas

Do not modify without explicit instruction:

- Scavvy mascot assets
- global brand tokens
- navigation architecture
- native `ios/` or `android/` folders
- `../docs/required.md` unless the product requirements themselves changed
- `../docs/context/` files other than `progress-tracker.md`, unless architecture, UI rules, or scope changed

## Required Reading Order

Before starting a non-trivial task, read:

1. `../docs/required.md`
2. `../docs/context/project-overview.md`
3. `../docs/context/product-flow.md`
4. `../docs/context/architecture.md`
5. `../docs/context/ui-context.md`
6. `../docs/context/ai-context.md`
7. `../docs/context/progress-tracker.md`

## Documentation Sync

After each completed unit of work:

1. Update `../docs/context/progress-tracker.md`
2. Update `../docs/context/architecture.md` if boundaries, state shape, services, or invariants changed
3. Update `../docs/context/ui-context.md` if design tokens or reusable UI patterns changed
4. Update `../docs/context/product-flow.md` if navigation or user flow changed
5. Update `../docs/context/ai-context.md` if prompts, response schemas, or fallback behavior changed
6. Update `../docs/context/project-overview.md` only if product scope changed

## Verification Before Moving On

- [ ] App builds successfully
- [ ] Type-check passes if configured
- [ ] Lint passes if configured
- [ ] No obvious console/runtime errors
- [ ] No dead primary CTA
- [ ] No screen traps the user without a way forward/back
- [ ] Core gameplay still works
- [ ] No API key is shipped in the client
- [ ] Live API paths have safe fallbacks
- [ ] Existing Scavvy mascot and brand are preserved
- [ ] `../docs/context/progress-tracker.md` is updated

## Scavvy-Specific Reminders

- Scavvy is a **raccoon adventure companion**, not a generic AI chatbot.
- Core magic: **scan the real environment first, then generate quests from what Scavvy saw**.
- MVP environment scan uses **3 captured room/environment photos**, not continuous video.
- The AI should not identify people.
- Quests must be safe and not require strangers, restricted areas, dangerous actions, or private information.
- Main tabs: **Home · Adventures · Profile**.
- Immersive gameplay screens hide the main tab bar.
- Use proper vector icons for functional UI; avoid emoji as primary interface icons.
- Audio must still work in demo mode through a fallback if ElevenLabs is unavailable.

## Application Building Context

Read these files in order before implementing or making an architectural decision:

1. `../docs/required.md`
2. `../docs/context/project-overview.md`
3. `../docs/context/architecture.md`
4. `../docs/context/ui-context.md`
5. `../docs/context/progress-tracker.md`

Update `../docs/context/progress-tracker.md` after each meaningful implementation change.

## Git & GitHub Rules

All commits and pushes for this repo must use the **shaklan2001** GitHub account only.

### Identity (local repo config)

Before committing, ensure this repo is configured:

```bash
git config user.name "shaklan2001"
git config user.email "90901154+shaklan2001@users.noreply.github.com"
```

Do not use the global `nishantshaklan` identity for this repository.

### Remote & SSH

- Remote: `git@github.com-shaklan2001:shaklan2001/Scavvy.git`
- SSH host alias: `github.com-shaklan2001`
- Key: `~/.ssh/id_ed25519_shaklan2001`

Always push through the `shaklan2001` SSH alias so authentication matches the repo owner.

### Commit rules

- **Never** add `Co-authored-by: cursoragent` (or any Cursor/agent co-author trailer) to commit messages.
- Commits must show **only** `shaklan2001` as author and committer — no AI agent attribution.
- Do not commit or push unless the user explicitly asks.

