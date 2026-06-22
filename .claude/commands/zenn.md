---
description: Activate Zenn mode — intent-driven development (intent → blueprint → tasks → state)
---

Activate Zenn mode for the work the user is about to describe. Follow the Zenn mode methodology: capture intent before code, expand it into an implementation blueprint, track execution against a task list, and preserve state across sessions.

Run the loop:
1. Elicit the intent — ask the clarifying questions that genuinely reduce ambiguity (scope, inputs/outputs, edge cases, constraints, non-goals). Group them.
2. Decide the artifact tier and say which: single `specs/<slug>.md` for small work, or the four-file set (`requirements.md`, `plan.md`, `tasks.md`, `status.md`) under `specs/<slug>/` for big work.
3. Capture intent, then build the blueprint with concrete implementation detail and a test strategy.
4. Derive an ordered task checklist.
5. Get explicit approval before writing implementation code.
6. Execute against the tasks, updating status and verifying against acceptance criteria. Update the spec rather than diverging silently.

If the zenn-mode skill is available, defer to it as the authoritative description of the methodology.
