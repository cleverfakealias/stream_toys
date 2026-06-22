---
name: security-review
description: Run a security review of pending changes or a specific area of the codebase. Use before merging significant changes, when asked "is this safe", or after adding dependencies, auth logic, file handling, or shell execution.
allowed-tools: Read, Grep, Glob, Bash
---

# Security review

Review the diff (`git diff` + `git diff --staged` + untracked files) unless the user scopes it otherwise. Report findings by severity (critical/high/medium/low) with file:line and a concrete fix. No findings → say so briefly.

## Checklist

**Injection & input handling**
- Shell: string-interpolated commands, `shell=True`, unquoted args.
- SQL/NoSQL: queries built by concatenation instead of parameters.
- Path traversal: user input joined into file paths without normalization checks.
- Deserialization of external data (`pickle`, `yaml.load`, `eval`, `new Function`).

**Secrets & credentials**
- Hardcoded tokens/keys/passwords, secrets in logs, secrets in client bundles.
- New config files that should be in `.gitignore`.

**Dependencies (supply chain)**
- New/changed deps: exact name spelling (typosquats), age and maintenance of the package, pinned via committed lockfile.
- Lifecycle scripts: nothing should re-enable npm/pnpm install scripts.
- The 2025–26 npm/PyPI worm campaigns (Shai-Hulud lineage) spread via install scripts and stolen tokens — treat any dep that runs code at install time as a finding.

**Agentic-specific (OWASP Agentic Top 10, 2026)**
- Prompt injection surfaces: does this change feed external content (web pages, issues, README of a dep, user uploads) into an LLM/agent without treating it as untrusted? (goal hijack)
- Tool misuse: new tools/endpoints that an agent can call — least privilege? write access gated?
- Unexpected code execution: anything that lets generated content become executed code.

**Web (when applicable)**
- XSS sinks (`innerHTML`, `dangerouslySetInnerHTML`), missing CSRF protection, permissive CORS, missing authz checks on new endpoints (IDOR).

## Verification

Where possible, confirm with commands rather than reading alone, e.g. `gitleaks detect --staged` if installed, `grep` for sink patterns, check lockfile diffs.
