---
name: python-standards
description: Python conventions for this repo — toolchain, style, typing, testing, and security. Use when writing, reviewing, or refactoring Python code, or setting up Python project config (pyproject.toml, ruff, pytest, uv).
user-invocable: true
---

# Python standards (2026)

## Toolchain

- **uv** manages everything: `uv sync` (install from `uv.lock`), `uv add <pkg>`, `uv run <cmd>`. Never `pip install` into the project env. In CI use `uv sync --locked`.
- **ruff** is the only formatter/linter: `ruff format` + `ruff check --fix`. Pin `ruff>=0.15,<0.16` in dev deps (pre-1.0; minors change rule behavior). No black/flake8/isort — ruff replaces all of them.
- **Type checking**: pyright or mypy (strict mode) is the blocking check. Astral's `ty` is beta — fine as a fast advisory pass (`uvx ty check`), not as the gate.
- **pytest 9** for tests: `uv run pytest -q`. Use built-in subtests and TOML config in `pyproject.toml`.

## Style

- Target the project's `requires-python`; use modern syntax for that floor (e.g. `match`, `type` aliases, `X | None` over `Optional[X]`).
- Full type annotations on public functions; avoid `Any` — if unavoidable, comment why.
- Dataclasses or Pydantic for structured data, never bare dicts across module boundaries.
- Raise specific exceptions; never `except Exception: pass`. Log or re-raise with context.
- `pathlib.Path` over `os.path`; f-strings over `%`/`.format()`.

## Testing

- Tests live in `tests/`, named `test_<module>.py`; one behavior per test.
- Use fixtures over setup/teardown; `parametrize` over copy-paste.
- Don't mock what you own — refactor for injectable seams instead. Mock only true externals (network, clock, OS).

## Security

- Validate all external input at the boundary (Pydantic models for API payloads).
- No `eval`/`exec`/`pickle.loads` on external data; `subprocess` with list args, never `shell=True` with interpolated strings.
- Secrets come from the environment at runtime — never hardcoded, never committed, never read from `.env` by the agent.
- New dependencies: prefer well-maintained packages; check the name carefully (typosquats); `uv.lock` is committed and CI installs `--locked`.
