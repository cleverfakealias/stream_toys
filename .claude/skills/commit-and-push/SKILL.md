---
name: commit-and-push
description: Commit staged work and optionally push. Creates clean conventional commits with a secret scan first.
disable-model-invocation: true
---

# Commit and push

Side-effect skill — only runs when the user invokes `/commit-and-push`.

1. `git status` + `git diff` — review what's changing. Don't commit unrelated files together; split into logical commits.
2. Secret scan before committing: run `gitleaks protect --staged` if gitleaks is installed; otherwise grep staged changes for obvious token patterns (`AKIA`, `ghp_`, `sk-`, `-----BEGIN`). Any hit → stop and ask.
3. Never `git add .` blindly — add the specific files belonging to this change. Never commit `.env*`, lockfile changes you didn't intend, or generated artifacts.
4. Commit message: conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`), imperative, ≤72-char subject. Body explains *why* when non-obvious.
5. Push only if the user asked. Plain `git push` — never force-push (blocked by policy; `--force-with-lease` only with explicit user approval).
