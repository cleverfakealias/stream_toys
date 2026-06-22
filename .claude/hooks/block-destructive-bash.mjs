#!/usr/bin/env node
// PreToolUse hook (Bash): defense-in-depth guard for shell commands.
// Blocks: destructive ops, secret-file reads (the Bash bypass of Read deny rules),
// env dumps, agent self-modification of policy files, and un-allowlisted one-off
// remote package execution (npx/uvx/pnpm dlx — the npm-worm vector).
// Exit 0 = allow. Exit 2 = block; stderr explains why to Claude.
//
// NOTE: permission deny rules only constrain Claude's Read/Edit tools — Bash can
// bypass them, which is why this hook exists. The OS sandbox (see
// settings.local.json.example) is the final boundary; this hook is the middle layer.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0); // fail open: never block the user on a parse error
}

const cmd = String(payload?.tool_input?.command ?? "");
if (!cmd) process.exit(0);

function deny(reason) {
  process.stderr.write(
    `blocked: ${reason} (hook: block-destructive-bash.mjs)\ncommand: ${cmd}\n`,
  );
  process.exit(2);
}

// ── destructive operations ────────────────────────────────────────────────────
const reForcePush = /git\s+push\s.*(--force|\s-f)(\s|$)/;
const reForceLease = /--force-with-lease/;

if (/rm\s+-[a-zA-Z]*[rR][a-zA-Z]*\s+(\/|~|\$HOME|\.|\.git)(\s|$|\/)/.test(cmd))
  deny("recursive delete of a critical path");
if (reForcePush.test(cmd) && !reForceLease.test(cmd))
  deny("force push (ask the user; --force-with-lease only with explicit approval)");
if (/git\s+reset\s+--hard/.test(cmd)) deny("git reset --hard discards uncommitted work");
if (/git\s+clean\s+-[a-zA-Z]*f/.test(cmd)) deny("git clean -f deletes untracked files");
if (/(curl|wget)\s[^|]*\|\s*(sudo\s+)?(ba|z|fi)?sh/.test(cmd))
  deny("piping a download straight into a shell");
if (/chmod\s+(-[a-zA-Z]+\s+)*777/.test(cmd)) deny("world-writable permissions");
if (/(^|\s)(mkfs|dd\s+if=)/.test(cmd)) deny("raw disk operation");
if (/--ignore-scripts=false/.test(cmd)) deny("explicitly re-enabling npm lifecycle scripts");

// ── secret reads via shell (Read deny rules do not cover Bash) ────────────────
const reReadVerb =
  /(^|[;&|\s])(cat|less|more|head|tail|grep|rg|cp|mv|scp|rsync|base64|xxd|od|strings|source|\.)\s/;
const reSecretPath =
  /~\/\.ssh\/|~\/\.aws\/|~\/\.kube\/|~\/\.gnupg\/|~\/\.docker\/config\.json|(^|[/\s"'])\.netrc|(^|[/\s"'])\.pypirc|(^|[/\s"'])\.npmrc|id_rsa|id_ed25519|\.pem([\s"']|$)|(^|[/\s"'])\.env(\.[A-Za-z0-9_-]+)?([\s"']|$)/;
const reSecretExempt = /\.env\.(example|template|sample)/;
if (reReadVerb.test(cmd) && reSecretPath.test(cmd) && !reSecretExempt.test(cmd))
  deny("shell read of a secret/credential file (use .env.example for templates)");

if (/(^|[;&|\s])(printenv|env\s*($|[|>]))/.test(cmd))
  deny("dumping the process environment (secrets live there)");

// ── self-modification of agent policy files ───────────────────────────────────
const rePolicyPath =
  /(\.claude\/(settings(\.local)?\.json|hooks)|\.mcp\.json|\.git\/hooks|\.github\/workflows)/;
const reWriteVerb = /(>|>>|\stee\s|sed\s+-i|mv\s|cp\s|rm\s|truncate|chmod)/;
if (rePolicyPath.test(cmd) && reWriteVerb.test(cmd))
  deny("modifying agent policy / CI files via shell (settings, hooks, .mcp.json, workflows) — ask the user");

// ── one-off remote package execution (npx/uvx/dlx) ────────────────────────────
const reRunner =
  /(^|[;&|\s])(npx|uvx|pipx\s+run|pnpm\s+dlx|yarn\s+dlx|bunx)\s/;
if (reRunner.test(cmd) && !/npx\s+--no-install/.test(cmd)) {
  // strip everything up to and including the runner token + spaces, then take the
  // first remaining whitespace-separated token that isn't a flag.
  const rest = cmd.replace(/.*(npx|uvx|pipx\s+run|pnpm\s+dlx|yarn\s+dlx|bunx)\s+/, "");
  const pkg = rest.split(/\s+/).find((t) => t && !t.startsWith("-")) ?? "";
  const pkgBase = pkg.replace(/(.)@[^@]*$/, "$1"); // strip @version, keep @scope

  const allowlistPath = join(
    process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    ".claude",
    "hooks",
    "allowed-run-packages.txt",
  );
  let allowed = false;
  if (existsSync(allowlistPath)) {
    const entries = readFileSync(allowlistPath, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    allowed = entries.includes(pkgBase);
  }
  if (!allowed)
    deny(
      `one-off remote package execution of '${pkgBase}' — packages run code on download (npm-worm vector). If legitimate, the user can add it to .claude/hooks/allowed-run-packages.txt`,
    );
}

process.exit(0);
