---
name: zenn-mode
description: "Intent-driven development. Activate whenever the user starts non-trivial implementation work — building a feature, adding an endpoint/component/module, refactoring a subsystem, or any task where ambiguity exists and code will be written. Captures intent in a spec, expands it into an implementation blueprint, tracks execution against a task list, and carries state across sessions. Do NOT activate for one-line questions, read-only exploration, trivial fixes, or when the user explicitly opts out."
---

# Zenn Mode

Zenn mode is intent-driven development: capture **intent** before code, expand it into a **blueprint** with real implementation detail, execute against a tracked **task list**, and preserve **state** so work survives across sessions. The goal is that nothing significant gets built from a vague prompt, and any session can be resumed cold.

## When this applies

Apply for feature work, new subsystems, endpoints/components/modules, non-trivial refactors, integrations — anything where (a) code will be written or changed and (b) there's ambiguity worth resolving first. Skip it for questions, reading/exploration, and genuine one-liners. If the user signals a deliberate quick fix, respect that and stand down.

## Adaptive artifact set

Match the ceremony to the size of the work. Decide which tier this is, state your choice in one line, and proceed.

**Small work** (a single file, a contained change, a few hours): one file, `specs/<slug>.md`, with the sections: Intent, Approach, Tasks (checklist), Notes. Status and decisions fold into Notes.

**Big work** (multiple files/modules, cross-cutting, multi-session): the full four-file set under `specs/<slug>/`:
- `requirements.md` — the **intent**: problem, goals, non-goals, acceptance criteria. The *what* and *why*.
- `plan.md` — the **blueprint**: architecture, interfaces, data shapes, file-by-file implementation detail, test strategy. The *how*.
- `tasks.md` — an ordered checklist the work is executed against, each item checkable.
- `status.md` — the scratchpad: current state, decisions made and why, open questions, where to resume. Updated as work proceeds.

When unsure which tier, ask once, briefly, then commit.

## The loop

1. **Elicit intent.** Ask the clarifying questions that actually matter — scope, inputs/outputs, edge cases, constraints, non-goals. Group them; don't drip one at a time. Skip what the request already answers.
2. **Capture intent** in the spec / `requirements.md`.
3. **Build the blueprint.** Expand intent into concrete implementation detail and a test strategy. This is where design decisions get made explicit, not left to discover mid-code.
4. **Derive tasks** — an ordered, checkable list.
5. **Get approval** before writing implementation code. Show intent + blueprint; let the user approve, revise, or reject.
6. **Execute,** checking off tasks and updating status as you go. Verify against acceptance criteria.
7. **Keep state honest.** If reality forces a deviation from the blueprint, update the spec rather than diverging silently. If a deviation is significant, surface it.

## Resuming a session

At the start of work on an existing spec: read `status.md` first (or the Notes section), then `plan.md`/the spec, then pick up the next unchecked task. Don't re-derive what's already decided.

## Operating posture

- Bias toward asking before assuming on anything ambiguous; bias toward acting once intent is clear and approved.
- Specs are tight and read, not exhaustive and ignored.
- Tests express the acceptance criteria; define them before implementation when the work warrants it.
