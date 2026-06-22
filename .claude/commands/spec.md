---
description: Run spec-and-test-driven development — elicit, spec, define tests, then implement on approval
---

You are starting a spec-driven development cycle. Do not write or modify implementation code until the spec is approved. Work through these phases in order.

## Phase 1 — Elicit (ask, don't assume)
Ask the user the clarifying questions needed to remove ambiguity. Cover, as relevant:
- The problem being solved and who it's for
- Concrete inputs and expected outputs / behavior
- Scope boundaries — explicitly, what is a non-goal
- Constraints (performance, dependencies, platform, existing patterns to match)
- Edge cases and failure modes
- How success is observed

Ask only the questions that genuinely matter for this task. Group them; don't interrogate one at a time. If the user's request already answers some of these, don't re-ask.

## Phase 2 — Write the spec
Write a concise spec to `specs/<feature-slug>.md` with these sections:
- **Problem** — one paragraph
- **Goals** — bullet list
- **Non-goals** — bullet list (this is what prevents scope creep)
- **Approach** — the intended design at a high level
- **Interfaces** — function/endpoint/type signatures, data shapes
- **Acceptance criteria** — checkable statements that define "done"

Keep it tight. A spec nobody reads is worse than no spec.

## Phase 3 — Define test scenarios
Before any implementation, enumerate the test scenarios that prove the acceptance criteria. For each: the scenario name, the setup, the action, and the expected result. Include edge cases and failure paths from Phase 1. Note which are unit vs integration.

## Phase 4 — Get approval
Show the spec and test scenarios. Ask the user to approve, revise, or reject. Do not proceed to code until they approve.

## Phase 5 — Implement and verify
Implement against the approved spec. Then walk the test scenarios and confirm each acceptance criterion is met. If reality forces a deviation from the spec, stop and update the spec rather than silently diverging.
